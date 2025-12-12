// src/hooks/useConsolidatedData.js - Hook consolidé pour optimiser les performances
import {
import { db } from "../firebase/firebase.js";
import { useOptimizedCache, usePaginatedCache } from "./useOptimizedCache.js";
import { useAuth } from "../context/AuthContext.jsx";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  doc, 
  runTransaction,
  
  orderBy,
  limit,
  startAfter
} from "firebase/firestore";

/**
 * Hook consolidé pour gérer toutes les données de l'application
 * Remplace useMyRidesData, useOptimizedData, useHighPerformanceData
 */
export function useConsolidatedData(options = {}) {
  const { user, authLoading } = useAuth();
  
  
  const {
    enableRealtime = true,
    pageSize = 20,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    enablePagination = false
  } = options;

  // États consolidés
  const [data, setData] = useState({
    driverRides: [],
    passengerAds: [],
    bookings: [],
    seatBookings: [],
    unlocks: [],
    bookingsMap: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  
  // Refs pour les listeners en temps réel
  const unsubscribers = useRef([]);
  const lastFetch = useRef(0);

  // Cache optimisé pour les données statiques
  const { 
    data: cachedDriverRides,
    loading: driverRidesLoading,
    refetch: refetchDriverRides
  } = useOptimizedCache(
    `driver-rides-${user?.uid}`,
    async () => {
      if (!user?.uid) return [];
      const q = query(
        collection(db, "rides"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    { cacheTime, enabled: !!user?.uid }
  );

  // Cache paginé pour les grandes listes
  const paginatedBookings = usePaginatedCache(
    `bookings-${user?.uid}`,
    async ({ page, pageSize, offset }) => {
      if (!user?.uid) return { items: [], totalCount: 0 };
      
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
      
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return {
        items,
        totalCount: snapshot.size,
        hasMore: snapshot.size === pageSize
      };
    },
    { pageSize, enabled: enablePagination && !!user?.uid }
  );

  // Fonction de nettoyage des listeners
  const cleanupListeners = useCallback(() => {
    unsubscribers.current.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    unsubscribers.current = [];
  }, []);

  // Setup des listeners en temps réel
  const setupRealtimeListeners = useCallback(() => {
    if (!user?.uid || !enableRealtime) return;

    cleanupListeners();

    // Listener pour les annonces passagers
    const passengerAdsQuery = query(
      collection(db, "passengerAds"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubPassengerAds = onSnapshot(
      passengerAdsQuery,
      (snapshot) => {
        const ads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(prev => ({ ...prev, passengerAds: ads }));
      },
      (error) => {
        console.error("Error in passenger ads listener:", error);
        setNetworkError(true);
      }
    );

    // Listener pour les réservations de sièges
    const seatBookingsQuery = query(
      collection(db, "seatBookings"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubSeatBookings = onSnapshot(
      seatBookingsQuery,
      (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(prev => ({ ...prev, seatBookings: bookings }));
      },
      (error) => {
        console.error("Error in seat bookings listener:", error);
        setNetworkError(true);
      }
    );

    // Listener pour les déverrouillages
    const unlocksQuery = query(
      collection(db, "unlocks"),
      where("userId", "==", user.uid),
      orderBy("contactUnlockedAt", "desc")
    );

    const unsubUnlocks = onSnapshot(
      unlocksQuery,
      (snapshot) => {
        const unlocks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(prev => ({ ...prev, unlocks }));
      },
      (error) => {
        console.error("Error in unlocks listener:", error);
        setNetworkError(true);
      }
    );

    unsubscribers.current = [unsubPassengerAds, unsubSeatBookings, unsubUnlocks];
  }, [user?.uid, enableRealtime, db, cleanupListeners]);

  // Chargement initial des données
  useEffect(() => {
    if (authLoading || !user?.uid) return;

    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      setNetworkError(false);

      try {
        // Les données en cache sont déjà gérées par useOptimizedCache
        setupRealtimeListeners();
        lastFetch.current = Date.now();
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError(err);
        setNetworkError(true);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user?.uid, authLoading, setupRealtimeListeners]);

  // Mise à jour des données du driver depuis le cache
  useEffect(() => {
    if (cachedDriverRides) {
      setData(prev => ({ ...prev, driverRides: cachedDriverRides }));
    }
  }, [cachedDriverRides]);

  // Nettoyage au démontage
  useEffect(() => {
    return cleanupListeners;
  }, [cleanupListeners]);

  // Actions optimisées
  const actions = useMemo(() => ({
    // Supprimer une course
    deleteRide: async (rideId) => {
      try {
        await runTransaction(db, async (transaction) => {
          const rideRef = doc(db, "rides", rideId);
          transaction.delete(rideRef);
        });
        
        // Mise à jour optimiste
        setData(prev => ({
          ...prev,
          driverRides: prev.driverRides.filter(ride => ride.id !== rideId)
        }));
        
        // Invalider le cache
        refetchDriverRides();
        
        return { success: true, message: "Resa raderad framgångsrikt" };
      } catch (error) {
        console.error("Error deleting ride:", error);
        return { success: false, message: "Kunde inte radera resan" };
      }
    },

    // Annuler une réservation
    cancelBooking: async (bookingId) => {
      try {
        await runTransaction(db, async (transaction) => {
          const bookingRef = doc(db, "seatBookings", bookingId);
          transaction.update(bookingRef, { 
            status: "cancelled",
            cancelledAt: Date.now()
          });
        });
        
        // Mise à jour optimiste
        setData(prev => ({
          ...prev,
          seatBookings: prev.seatBookings.map(booking =>
            booking.id === bookingId 
              ? { ...booking, status: "cancelled", cancelledAt: Date.now() }
              : booking
          )
        }));
        
        return { success: true, message: "Bokning avbruten framgångsrikt" };
      } catch (error) {
        console.error("Error cancelling booking:", error);
        return { success: false, message: "Kunde inte avbryta bokningen" };
      }
    },

    // Recharger toutes les données
    refetchAll: async () => {
      setLoading(true);
      try {
        await Promise.all([refetchDriverRides()]);
        setupRealtimeListeners();
        return { success: true, message: "Data uppdaterad" };
      } catch (error) {
        console.error("Error refetching data:", error);
        setNetworkError(true);
        return { success: false, message: "Kunde inte uppdatera data" };
      } finally {
        setLoading(false);
      }
    }
  }), [db, refetchDriverRides, setupRealtimeListeners]);

  // Données dérivées optimisées
  const derivedData = useMemo(() => {
    const totalItems = data.driverRides.length + 
                      data.passengerAds.length + 
                      data.seatBookings.length + 
                      data.unlocks.length;

    const activeBookings = data.seatBookings.filter(booking => 
      booking.status === 'active' || booking.status === 'confirmed'
    );

    const recentUnlocks = data.unlocks.filter(unlock => 
      Date.now() - (unlock.contactUnlockedAt || 0) < 24 * 60 * 60 * 1000 // 24h
    );

    return {
      totalItems,
      activeBookings,
      recentUnlocks,
      hasData: totalItems > 0,
      isEmpty: totalItems === 0 && !loading,
      isHighVolume: totalItems > 100
    };
  }, [data, loading]);

  // État de chargement global
  const globalLoading = loading || driverRidesLoading;

  return {
    // Données
    ...data,
    ...derivedData,
    
    // États
    loading: globalLoading,
    error,
    networkError,
    authLoading,
    user,
    
    // Actions
    ...actions,
    
    // Pagination (si activée)
    ...(enablePagination && {
      paginatedBookings,
      pageInfo: paginatedBookings.pageInfo
    }),
    
    // Métadonnées
    lastFetch: lastFetch.current,
    cacheHit: !!cachedDriverRides && !driverRidesLoading
  };
}

// Hook spécialisé pour les listes haute performance
export function useHighVolumeData(userId) {
  return useConsolidatedData({
    enableRealtime: true,
    enablePagination: true,
    pageSize: 50,
    cacheTime: 2 * 60 * 1000 // 2 minutes pour les données haute fréquence
  });
}

// Hook pour les données en lecture seule (plus rapide)
export function useReadOnlyData(userId) {
  return useConsolidatedData({
    enableRealtime: false,
    enablePagination: false,
    cacheTime: 10 * 60 * 1000 // 10 minutes pour les données statiques
  });
} 