import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext";
import UnlockCard from "./UnlockCard.jsx";
import GridOrEmpty from "./ui/GridOrEmpty.jsx";

export default function PassengerUnlockedBookings() {
  const { user } = useAuth();
  
  const [unlocks, setUnlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Show contact unlock conversations addressed to me (as passenger ad owner)
    const unlocksQ = query(
      collection(db, "bookings"),
      where("bookingType", "==", "contact_unlock"),
      where("counterpartyId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(unlocksQ, (snapshot) => {
      const unlocksData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUnlocks(unlocksData);
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
    <GridOrEmpty items={unlocks} empty="Inga kontakter ännu." type="unlocks">
      {unlocks.map((unlock) => (
        <div key={unlock.id} className="w-full">
          <UnlockCard
            unlock={unlock}
            viewerUid={user.uid}
            onCardDeleted={(id) => setUnlocks((prev) => prev.filter((u) => u.id !== id))}
          />
        </div>
      ))}
    </GridOrEmpty>
  );
}
