import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  runTransaction,
  addDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useActivity } from "../../context/ActivityContext.jsx";
import { mapRole } from "../../utils/mapRole.js";

/* ─────────── Helpers ─────────── */
const ts = (u) =>
  u.contactUnlockedAt ||
  u.paidAt ||
  u.createdAt ||
  0; // timestamp لاختيار الأحدث

const infoScore = (u) =>
  (!!u.driverEmailShared ? 1 : 0) + (!!u.driverPhoneShared ? 1 : 0);

export default function useMinaResorData(opts = {}) {
  const passengerOnly = !!opts.passengerOnly;
  const { user, authLoading } = useAuth();
  
  
  const [driverRides, setDriverRides] = useState([]);
  const [passengerAds, setPassengerAds] = useState([]);
  const [bookingsMap, setBookingsMap] = useState({});
  const [seatBookings, setSeatBookings] = useState([]);
  const [unlocksRaw, setUnlocksRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  const { last, markSeen } = useActivity();
  const unsubBookings = useRef(null);

  /* اشتراك حجوزات السائق حيًّا - محسن للأداء */
  const subscribeDriverBookings = useCallback(
    (driverIds, setMap) => {
      const unsubs = [];

      // تنظيف الاشتراكات القديمة
      if (unsubBookings.current) {
        unsubBookings.current();
      }

      // Feature flag (debug only): ?useWhereIn=1 يعيد استخدام استعلام where-in السابق
      const preferWhereIn = (() => {
        try {
          const params = new URLSearchParams(window.location.search);
          return params.get('useWhereIn') === '1';
        } catch { return false; }
      })();

      if (preferWhereIn) {
        const CHUNK = 10;
        for (let i = 0; i < driverIds.length; i += CHUNK) {
          const slice = driverIds.slice(i, i + CHUNK);
          if (!slice.length) continue;
          const q = query(
            collection(db, "bookings"),
            where("rideId", "in", slice)
          );
          const unsub = onSnapshot(q, (snap) => {
            try {
              const draft = {};
              snap.forEach((d) => {
                const b = { id: d.id, ...d.data() };
                if (b.bookingType === "seat_booking") {
                  (draft[b.rideId] ||= []).push(b);
                }
              });
              setMap((prev) => ({ ...prev, ...draft }));
            } catch (err) {
              console.error("Booking processing error (where-in):", err);
            }
          }, (error) => {
            console.error("Booking subscription error (where-in):", error);
          });
          unsubs.push(unsub);
        }
        const cleanup = () => unsubs.forEach((u) => u());
        unsubBookings.current = cleanup;
        return cleanup;
      }

      // استبدال استعلام rideId IN بإشتراك لكل rideId لتفادي متطلبات الفهارس المركبة
      for (const rideId of driverIds) {
        if (!rideId) continue;
        const q = query(
          collection(db, "bookings"),
          where("rideId", "==", rideId)
        );

        const unsub = onSnapshot(q, (snap) => {
          try {
            const list = [];
            snap.forEach((d) => {
              const b = { id: d.id, ...d.data() };
              // نُبقي فقط حجوزات المقاعد هنا كما كان أصلًا
              if (b.bookingType === "seat_booking") list.push(b);
            });
            setMap((prev) => ({ ...prev, [rideId]: list }));
          } catch (err) {
            console.error("Booking processing error:", err);
          }
        }, (error) => {
          // لا نُظهر تحذير شبكة هنا لأن بيانات الأقسام الأخرى قد تكون سليمة
          console.error("Booking subscription error (rideId=", rideId, "):", error);
        });
        unsubs.push(unsub);
      }

      const cleanup = () => unsubs.forEach((u) => u());
      unsubBookings.current = cleanup;
      return cleanup;
    },
    [db]
  );

  const loadData = useCallback(() => {
    if (authLoading || !user?.uid) return;

    setNetworkError(false);
    setLoading(true);

    /* (1) إعلاناتي - محسن */
    const adsQ = query(collection(db, "rides"), where("userId", "==", user.uid));
    const unsubAds = onSnapshot(adsQ, async (snap) => {
      try {
        const ads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const drivers = ads.filter((a) => mapRole(a.role) === "driver");
        const passengers = ads.filter((a) => mapRole(a.role) === "passenger");
        // In passenger-only mode, do not keep driver rides in local state
        setDriverRides(passengerOnly ? [] : drivers);
        setPassengerAds(passengers);

        const ids = passengerOnly ? [] : drivers.map((r) => r.id);

        /* إدارة الاشتراك القديم/الجديد للحجوزات (معطل في وضع passengerOnly) */
        if (unsubBookings.current) unsubBookings.current();
        if (!passengerOnly && ids.length) {
          unsubBookings.current = subscribeDriverBookings(ids, setBookingsMap);
        } else {
          setBookingsMap({});
          unsubBookings.current = null;
        }

        setLoading(false);
      } catch (error) {
        console.error("Ads processing error:", error);
        setNetworkError(true);
        setLoading(false);
      }
    }, (error) => {
      console.error("Ads subscription error:", error);
      setNetworkError(true);
      setLoading(false);
    });

    /* (2) حجوزاتي seat_booking - محسن (معطل في وضع passengerOnly) */
    let unsubSeat = () => {};
    if (!passengerOnly) {
      const seatQ = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid),
        where("bookingType", "==", "seat_booking")
      );
      unsubSeat = onSnapshot(seatQ, (snap) => {
        try {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Server-side hidden
          let filtered = list.filter((b) => {
            const arr = Array.isArray(b.hiddenForUids) ? b.hiddenForUids : [];
            return !arr.includes(user.uid);
          });
          // Exclude cancelled bookings entirely from the Bokningar tab
          filtered = filtered.filter(
            (b) => !String(b.status || "").toLowerCase().startsWith("cancelled")
          );
          // Local fallback hidden
          try {
            const key = `vv_hidden_bookings_${user.uid}`;
            const local = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(local) && local.length) {
              const setLocal = new Set(local);
              filtered = filtered.filter((b) => !setLocal.has(b.id));
            }
          } catch {}
          setSeatBookings(filtered);
        } catch (error) {
          console.error("Seat bookings processing error:", error);
        }
      }, (error) => {
        console.error("Seat bookings error:", error);
      });
    } else {
      setSeatBookings([]);
    }

    /* (3) contact_unlock - آمن مع القواعد: اشترك مرتين (كمنشئ وكطرف مقابل) */
    const unlockQMine = query(
      collection(db, "bookings"),
      where("bookingType", "==", "contact_unlock"),
      where("userId", "==", user.uid)
    );
    const unlockQCounterparty = query(
      collection(db, "bookings"),
      where("bookingType", "==", "contact_unlock"),
      where("counterpartyId", "==", user.uid)
    );
    const unsubUnlockMine = onSnapshot(unlockQMine, (snap) => {
      try {
        const mine = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUnlocksRaw((prev) => {
          const map = new Map(prev.map((u) => [u.id, u]));
          mine.forEach((u) => map.set(u.id, u));
          return Array.from(map.values());
        });
      } catch (error) {
        console.error("Unlocks (mine) processing error:", error);
      }
    }, (error) => {
      console.error("Unlocks (mine) error:", error);
    });

    const unsubUnlockCounterparty = onSnapshot(unlockQCounterparty, (snap) => {
      try {
        const their = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUnlocksRaw((prev) => {
          const map = new Map(prev.map((u) => [u.id, u]));
          their.forEach((u) => map.set(u.id, u));
          return Array.from(map.values());
        });
      } catch (error) {
        console.error("Unlocks (counterparty) processing error:", error);
      }
    }, (error) => {
      console.error("Unlocks (counterparty) error:", error);
    });

    return () => {
      unsubAds();
      if (unsubSeat) unsubSeat();
      unsubUnlockMine();
      unsubUnlockCounterparty();
      if (unsubBookings.current) unsubBookings.current();
    };
  }, [db, user?.uid, authLoading, subscribeDriverBookings, passengerOnly]);

  useEffect(() => {
    return loadData();
  }, [loadData]);

  /* إزالة التكرار بين unlocks - مُحسّن وتقسيم حسب المصدر */
  const unlocks = useMemo(() => {
    try {
      const map = new Map();
      for (const u of unlocksRaw) {
        const key = u.rideId;
        const prev = map.get(key);
        if (!prev) {
          map.set(key, u);
        } else {
          const prevScore = infoScore(prev);
          const newScore = infoScore(u);
          if (newScore > prevScore || (newScore === prevScore && ts(u) > ts(prev))) {
            map.set(key, u);
          }
        }
      }
      return [...map.values()].sort((a, b) => ts(b) - ts(a));
    } catch (error) {
      console.error("Unlocks processing error:", error);
      return [];
    }
  }, [unlocksRaw]);

  const unlocksPurchased = useMemo(() => {
    try {
      const mine = unlocksRaw.filter((u) => u.userId === user?.uid && !u.isDeleted);
      const map = new Map();
      for (const u of mine) {
        const key = u.rideId;
        const prev = map.get(key);
        if (!prev) {
          map.set(key, u);
        } else {
          const prevScore = infoScore(prev);
          const newScore = infoScore(u);
          if (newScore > prevScore || (newScore === prevScore && ts(u) > ts(prev))) {
            map.set(key, u);
          }
        }
      }
      return [...map.values()].sort((a, b) => ts(b) - ts(a));
    } catch (error) {
      console.error("UnlocksPurchased processing error:", error);
      return [];
    }
  }, [unlocksRaw, user?.uid]);

  const unlocksForMyAds = useMemo(() => {
    try {
      // جميع الـ unlocks التي أنا الطرف المقابل فيها (أي الرسائل المرسلة لإعلاناتي)
      const mineAds = unlocksRaw.filter((u) => u.counterpartyId === user?.uid);
      
      // ترتيب حسب الوقت (الأحدث أولاً)
      return mineAds.sort((a, b) => ts(b) - ts(a));
    } catch (error) {
      console.error("UnlocksForMyAds processing error:", error);
      return [];
    }
  }, [unlocksRaw, user?.uid]);

  // حماية ضد تكرار seatBookings - إزالة التكرارات المحتملة
  const uniqueSeatBookings = useMemo(() => {
    if (!seatBookings?.length) return [];
    
    // إنشاء Map لإزالة التكرار بناءً على id
    const uniqueMap = new Map();
    seatBookings.forEach(booking => {
      if (booking.id && !uniqueMap.has(booking.id)) {
        uniqueMap.set(booking.id, booking);
      }
    });
    
    return Array.from(uniqueMap.values());
  }, [seatBookings]);

  /* تنظيف الذاكرة عند إلغاء المكون */
  useEffect(() => {
    return () => {
      if (unsubBookings.current) {
        unsubBookings.current();
      }
    };
  }, []);

  /* ───── Mutations محسنة ───── */
  const deleteRide = useCallback(
    async (ride) => {
      try {
        setLoading(true);
        await runTransaction(db, async (tx) => {
          const bQ = query(collection(db, "bookings"), where("rideId", "==", ride.id));
          const bSnap = await getDocs(bQ);
          bSnap.forEach((d) => tx.delete(d.ref));
          tx.delete(doc(db, "rides", ride.id));
        });
        return { success: true, message: "Annonsen raderades." };
      } catch (error) {
        console.error("Delete ride error:", error);
        return { success: false, message: "Kunde inte radera annonsen. Försök igen." };
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const cancelSeatBooking = useCallback(
    async (booking) => {
      try {
        setLoading(true);
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
            hiddenForUids: arrayUnion(user.uid),
          });
        });
        return { success: true, message: "Bokningen avbröts." };
      } catch (error) {
        console.error("Cancel booking error:", error);
        return { success: false, message: "Kunde inte avbryta bokningen. Försök igen." };
      } finally {
        setLoading(false);
      }
    },
    [db, user]
  );

  const cancelBookingByDriver = useCallback(
    async ({ ride, booking }) => {
      try {
        setLoading(true);
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
            hiddenForUids: arrayUnion(ride.userId, booking.userId),
          });
        });
        
        // إرسال إشعار للراكب
        try {
          const { sendCancellationNotification } = await import("../../services/notificationService.js");
          await sendCancellationNotification({
            passengerEmail: booking.passengerEmail,
            passengerName: booking.passengerName || "Passagerare",
            ride_origin: booking.ride_origin,
            ride_destination: booking.ride_destination,
            ride_date: booking.ride_date,
            ride_time: booking.ride_time,
          }, "driver");
        } catch (notificationError) {
          console.error("Notification error:", notificationError);
        }
        
        return { success: true, message: "Bokningen avbröts." };
      } catch (error) {
        console.error("Cancel booking by driver error:", error);
        return { success: false, message: "Kunde inte avbryta bokningen. Försök igen." };
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  /* ───── Badges (النقاط الجديدة) ───── */
  const newDriverCount = passengerOnly ? 0 : driverRides.reduce((count, r) =>
    count + (bookingsMap[r.id] || []).filter(
      (b) => b.createdAt > last("driver") && b.status === "requested"
    ).length, 0
  );
  const newDriver = newDriverCount > 0;
  
  const newBookingsCount = passengerOnly ? 0 : seatBookings.filter(
    (b) => b.createdAt > last("bookings") && b.status === "requested"
  ).length;
  const newBookings = newBookingsCount > 0;
  
  const newUnlocksCount = unlocks.filter((u) => ts(u) > last("unlocks")).length;
  const newUnlocks = newUnlocksCount > 0;

  return {
    // Data
    driverRides,
    passengerAds,
    bookingsMap,
    seatBookings: uniqueSeatBookings,
    unlocks,
    unlocksPurchased,
    unlocksForMyAds,
    
    // State
    loading,
    networkError,
    authLoading,
    user,
    
    // Notifications
    newDriver,
    newBookings,
    newUnlocks,
    newDriverCount,
    newBookingsCount,
    newUnlocksCount,
    
    // Actions
    deleteRide,
    cancelSeatBooking,
    cancelBookingByDriver,
    loadData,
    markSeen
  };
}
