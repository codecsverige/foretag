import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext";
import DriverRideCard from "./DriverRideCard.jsx";
import GridOrEmpty from "./ui/GridOrEmpty.jsx";

export default function DriverActiveRides() {
  const { user } = useAuth();
  
  const [driverRides, setDriverRides] = useState([]);
  const [bookingsMap, setBookingsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Get driver rides
    const ridesQ = query(
      collection(db, "rides"), 
      where("userId", "==", user.uid),
      where("role", "==", "driver")
    );

    const unsubRides = onSnapshot(ridesQ, (snap) => {
      const rides = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDriverRides(rides);

      // Get bookings for these rides
      if (rides.length > 0) {
        const rideIds = rides.map(r => r.id);
        const bookingsQ = query(
          collection(db, "bookings"),
          where("rideId", "in", rideIds),
          where("bookingType", "==", "seat_booking")
        );

        const unsubBookings = onSnapshot(bookingsQ, (bookingSnap) => {
          const bookingsData = {};
          bookingSnap.docs.forEach(d => {
            const booking = { id: d.id, ...d.data() };
            if (!bookingsData[booking.rideId]) {
              bookingsData[booking.rideId] = [];
            }
            bookingsData[booking.rideId].push(booking);
          });
          setBookingsMap(bookingsData);
          setLoading(false);
        });

        return () => {
          unsubRides();
          unsubBookings();
        };
      } else {
        setLoading(false);
      }
    });

    return unsubRides;
  }, [user?.uid, db]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <GridOrEmpty items={driverRides} empty="Inga förar-resor ännu." type="driver">
      {driverRides.map((ride) => (
        <DriverRideCard
          key={ride.id}
          ride={ride}
          bookings={bookingsMap[ride.id] || []}
          viewerUid={user.uid}
        />
      ))}
    </GridOrEmpty>
  );
}
