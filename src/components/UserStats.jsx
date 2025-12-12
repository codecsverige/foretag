import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

const UserStats = ({ userId }) => {
  const [stats, setStats] = useState({
    totalRides: 0,
    totalBookings: 0,
    totalUnlocks: 0,
    totalEarnings: 0,
    totalSpent: 0,
    memberSince: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;

      try {
        
        
        // Compter les rides
        const ridesQuery = query(collection(db, "rides"), where("userId", "==", userId));
        const ridesSnap = await getDocs(ridesQuery);
        const totalRides = ridesSnap.size;

        // Compter les bookings
        const bookingsQuery = query(collection(db, "bookings"), where("userId", "==", userId));
        const bookingsSnap = await getDocs(bookingsQuery);
        const totalBookings = bookingsSnap.size;

        // Compter les unlocks
        const unlocksQuery = query(
          collection(db, "bookings"), 
          where("userId", "==", userId),
          where("bookingType", "==", "contact_unlock")
        );
        const unlocksSnap = await getDocs(unlocksQuery);
        const totalUnlocks = unlocksSnap.size;

        // Calculer les revenus (rides créées)
        let totalEarnings = 0;
        ridesSnap.docs.forEach(doc => {
          const ride = doc.data();
          if (ride.commission) {
            totalEarnings += ride.commission * (ride.bookingsCount || 0);
          }
        });

        // Calculer les dépenses (unlocks achetés)
        let totalSpent = 0;
        unlocksSnap.docs.forEach(doc => {
          const unlock = doc.data();
          if (unlock.commission) {
            totalSpent += unlock.commission;
          }
        });

        setStats({
          totalRides,
          totalBookings,
          totalUnlocks,
          totalEarnings,
          totalSpent,
          memberSince: new Date().toLocaleDateString("sv-SE")
        });
      } catch (error) {
        console.error("Error loading user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-20"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Skapade resor</p>
            <p className="text-2xl font-bold text-blue-800">{stats.totalRides}</p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <span className="text-blue-600 text-lg">🚗</span>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-medium">Bokningar</p>
            <p className="text-2xl font-bold text-green-800">{stats.totalBookings}</p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <span className="text-green-600 text-lg">📅</span>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-600 font-medium">Upplåsningar</p>
            <p className="text-2xl font-bold text-purple-800">{stats.totalUnlocks}</p>
          </div>
          <div className="p-2 bg-purple-100 rounded-lg">
            <span className="text-purple-600 text-lg">🔓</span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-600 font-medium">Intäkter</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.totalEarnings} kr</p>
          </div>
          <div className="p-2 bg-yellow-100 rounded-lg">
            <span className="text-yellow-600 text-lg">💰</span>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-600 font-medium">Utgifter</p>
            <p className="text-2xl font-bold text-red-800">{stats.totalSpent} kr</p>
          </div>
          <div className="p-2 bg-red-100 rounded-lg">
            <span className="text-red-600 text-lg">💸</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Medlem sedan</p>
            <p className="text-2xl font-bold text-gray-800">{stats.memberSince}</p>
          </div>
          <div className="p-2 bg-gray-100 rounded-lg">
            <span className="text-gray-600 text-lg">👤</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats; 