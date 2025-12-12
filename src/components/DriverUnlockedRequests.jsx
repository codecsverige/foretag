import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext";
import UnlockCard from "./UnlockCard.jsx";
import GridOrEmpty from "./ui/GridOrEmpty.jsx";

export default function DriverUnlockedRequests() {
  const { user } = useAuth();
  
  const [unlockedRides, setUnlockedRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle individual card deletion (per-card delete button)
  const handleCardDeleted = (bookingId) => {
    setUnlockedRides(prev => prev.filter(unlock => unlock.id !== bookingId));
  };

  useEffect(() => {
    if (!user?.uid) return;

    const unlocksQ = query(
      collection(db, "unlocks"),
      where("driverId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(unlocksQ, (snapshot) => {
      const unlocks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUnlockedRides(unlocks);
      setLoading(false);
    });

    return unsubscribe;
  }, [user?.uid, db]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GridOrEmpty items={unlockedRides} empty="Inga kontakter ännu." type="unlocks">
        {unlockedRides.map((unlock) => (
          <UnlockCard
            key={unlock.id}
            unlock={unlock}
            viewerUid={user.uid}
            onCardDeleted={handleCardDeleted}
          />
        ))}
      </GridOrEmpty>
    </div>
  );
}
