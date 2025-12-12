import React, { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext";
import PassengerRideGroupCard from "./PassengerRideGroupCard.jsx";
import GridOrEmpty from "./ui/GridOrEmpty.jsx";

export default function PassengerActiveBookings() {
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const bookingsQ = query(
      collection(db, "bookings"),
      where("passengerId", "==", user.uid),
      where("bookingType", "==", "seat_booking"),
      where("status", "!=", "cancelled")
    );

    const unsubscribe = onSnapshot(bookingsQ, (snapshot) => {
      const bookingsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setBookings(bookingsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid, db]);

  // Group bookings by rideId
  const groupedRides = useMemo(() => {
    const groups = {};
    bookings.forEach(booking => {
      const rideId = booking.rideId || booking.id;
      if (!groups[rideId]) {
        groups[rideId] = {
          rideId,
          origin: booking.ride_origin,
          destination: booking.ride_destination,
          date: booking.ride_date,
          time: booking.ride_time,
          bookings: []
        };
      }
      groups[rideId].bookings.push(booking);
    });
    return Object.values(groups);
  }, [bookings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <GridOrEmpty items={groupedRides} empty="Inga bokningar ännu." type="bookings">
      {groupedRides.map((rideGroup) => (
        <PassengerRideGroupCard 
          key={rideGroup.rideId} 
          rideGroup={rideGroup}
          viewerUid={user.uid}
        />
      ))}
    </GridOrEmpty>
  );
}
