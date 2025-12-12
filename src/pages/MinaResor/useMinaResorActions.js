import { useCallback, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  runTransaction,
  addDoc,
  
} from "firebase/firestore";
import { useAuth } from "./AuthContext.jsx";
import { useActivity } from "./ActivityContext.jsx";
import { useMyRides, ACTIONS } from "./MyRidesContext.jsx";
import { mapRole } from "../utils/mapRole.js";

const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

export default function useMyRidesActions() {
  const { user } = useAuth();
  const { last, markSeen } = useActivity();
  const { state, dispatch } = useMyRides();
  

  // فحص التخزين المؤقت
  const getCachedData = useCallback((key) => {
    const cached = state.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, [state.cache]);

  // حفظ في التخزين المؤقت
  const setCachedData = useCallback((key, data) => {
    dispatch({
      type: ACTIONS.ADD_TO_CACHE,
      payload: { key, data }
    });
  }, [dispatch]);

  // تحميل البيانات المحسن
  const loadData = useCallback(async () => {
    if (!user?.uid) return;

    dispatch({ type: ACTIONS.SET_LOADING, payload: { type: 'global', isLoading: true } });
    dispatch({ type: ACTIONS.SET_NETWORK_ERROR, payload: false });

    try {
      // فحص التخزين المؤقت أولاً
      const cacheKey = `user_${user.uid}_all_data`;
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        dispatch({ type: ACTIONS.SET_DATA, payload: { dataType: 'driverRides', data: cachedData.driverRides } });
        dispatch({ type: ACTIONS.SET_DATA, payload: { dataType: 'passengerAds', data: cachedData.passengerAds } });
        dispatch({ type: ACTIONS.SET_DATA, payload: { dataType: 'seatBookings', data: cachedData.seatBookings } });
        dispatch({ type: ACTIONS.SET_DATA, payload: { dataType: 'unlocks', data: cachedData.unlocks } });
        dispatch({ type: ACTIONS.SET_LOADING, payload: { type: 'global', isLoading: false } });
        return;
      }

      // تحميل البيانات من Firestore
      const [ridesSnap, bookingsSnap, unlocksSnap] = await Promise.all([
        getDocs(query(collection(db, "rides"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "bookings"), where("userId", "==", user.uid), where("bookingType", "==", "seat_booking"))),
        getDocs(query(collection(db, "bookings"), where("userId", "==", user.uid), where("bookingType", "==", "contact_unlock")))
      ]);

      const rides = ridesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const driverRides = rides.filter(r => mapRole(r.role) === "driver");
      const passengerAds = rides.filter(r => mapRole(r.role) === "passenger");
      const seatBookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const unlocks = unlocksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // حفظ في التخزين المؤقت
      const dataToCache = { driverRides, passengerAds, seatBookings, unlocks };
      setCachedData(cacheKey, dataToCache);

      // تحديث الحالة
      dispatch({ type: ACTIONS.SET_DATA, payload: { dataType: 'driverRides', data: driverRides } });
      dispatch({ type: ACTIONS.SET_DATA, payload: { dataType: 'passengerAds', data: passengerAds } });
      dispatch({ type: ACTIONS.SET_DATA, payload: { dataType: 'seatBookings', data: seatBookings } });
      dispatch({ type: ACTIONS.SET_DATA, payload: { dataType: 'unlocks', data: unlocks } });

    } catch (error) {
      console.error("Error loading data:", error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
      dispatch({ type: ACTIONS.SET_NETWORK_ERROR, payload: true });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: { type: 'global', isLoading: false } });
    }
  }, [user?.uid, db, dispatch, getCachedData, setCachedData]);

  // حذف محسن مع Optimistic Update
  const deleteRide = useCallback(async (ride) => {
    if (!ride?.id) return { success: false, message: "معرف الرحلة مفقود" };

    const dataType = mapRole(ride.role) === "driver" ? "driverRides" : "passengerAds";

    // التحديث المحسن - حذف فوري من الواجهة
    dispatch({
      type: ACTIONS.OPTIMISTIC_DELETE,
      payload: { id: ride.id, dataType }
    });

    try {
      // حذف من قاعدة البيانات
      await runTransaction(db, async (tx) => {
        const bQ = query(collection(db, "bookings"), where("rideId", "==", ride.id));
        const bSnap = await getDocs(bQ);
        bSnap.forEach((d) => tx.delete(d.ref));
        tx.delete(doc(db, "rides", ride.id));
      });

      return { success: true, message: "Annonsen raderades." };
    } catch (error) {
      console.error("Delete ride error:", error);
      
      // إرجاع التحديث المحسن عند الفشل
      dispatch({
        type: ACTIONS.REVERT_DELETE,
        payload: { id: ride.id }
      });

      return { success: false, message: "Kunde inte radera annonsen. Försök igen." };
    }
  }, [db, dispatch]);

  // إلغاء الحجز مع Optimistic Update
  const cancelSeatBooking = useCallback(async (booking) => {
    if (!booking?.id) return { success: false, message: "معرف الحجز مفقود" };

    // التحديث المحسن - إلغاء فوري
    dispatch({
      type: ACTIONS.OPTIMISTIC_CANCEL,
      payload: { 
        bookingId: booking.id, 
        newStatus: "cancelled_by_passenger" 
      }
    });

    try {
      await runTransaction(db, async (tx) => {
        const rideRef = doc(db, "rides", booking.rideId);
        const rideSnap = await tx.get(rideRef);
        if (rideSnap.exists()) {
          const avail = (rideSnap.data().seatsAvailable || 0) + (booking.seats || 1);
          tx.update(rideRef, { seatsAvailable: avail });
        }
        tx.update(doc(db, "bookings", booking.id), {
          status: "cancelled_by_passenger",
          cancelledAt: Date.now(),
        });
      });

      return { success: true, message: "Bokningen avbröts." };
    } catch (error) {
      console.error("Cancel booking error:", error);
      
      // إرجاع التحديث المحسن عند الفشل
      dispatch({
        type: ACTIONS.REVERT_CANCEL,
        payload: { bookingId: booking.id }
      });

      return { success: false, message: "Kunde inte avbryta bokningen. Försök igen." };
    }
  }, [db, dispatch]);

  // إلغاء من قبل السائق
  const cancelBookingByDriver = useCallback(async ({ ride, booking }) => {
    if (!booking?.id) return { success: false, message: "معرف الحجز مفقود" };

    // التحديث المحسن
    dispatch({
      type: ACTIONS.OPTIMISTIC_CANCEL,
      payload: { 
        bookingId: booking.id, 
        newStatus: "cancelled_by_driver" 
      }
    });

    try {
      await runTransaction(db, async (tx) => {
        const rideRef = doc(db, "rides", ride.id);
        const snap = await tx.get(rideRef);
        if (snap.exists()) {
          const avail = (snap.data().seatsAvailable || 0) + (booking.seats || 1);
          tx.update(rideRef, { seatsAvailable: avail });
        }
        tx.update(doc(db, "bookings", booking.id), {
          status: "cancelled_by_driver",
          cancelledAt: Date.now(),
        });
      });

      // إرسال إشعار للراكب
      try {
        await addDoc(collection(db, "notifications"), {
          userEmail: booking.passengerEmail,
          title: "Bokning avbröts",
          body: "Föraren avbröt din bokning.",
          type: "danger",
          read: false,
          createdAt: Date.now(),
        });
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
      }

      return { success: true, message: "Bokningen avbröts." };
    } catch (error) {
      console.error("Cancel booking by driver error:", error);
      
      dispatch({
        type: ACTIONS.REVERT_CANCEL,
        payload: { bookingId: booking.id }
      });

      return { success: false, message: "Kunde inte avbryta bokningen. Försök igen." };
    }
  }, [db, dispatch]);

  // تغيير التبويب النشط
  const setActiveTab = useCallback((tab) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: tab });
    markSeen(tab);
  }, [dispatch, markSeen]);

  // إعادة تحميل البيانات
  const refreshData = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_CACHE });
    loadData();
  }, [dispatch, loadData]);

  // تحميل البيانات عند التغيير
  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user?.uid, loadData]);

  return {
    // العمليات
    deleteRide,
    cancelSeatBooking,
    cancelBookingByDriver,
    setActiveTab,
    refreshData,
    loadData,
    
    // البيانات
    ...state,
    
    // حالات إضافية
    isLoading: state.loading.global,
    hasOptimisticUpdates: state.optimisticUpdates.size > 0
  };
}
