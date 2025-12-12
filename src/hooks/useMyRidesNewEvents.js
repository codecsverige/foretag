/* ────────────────────────────────────────────────
   src/hooks/useMyRidesNewEvents.js
   Hook som räknar nya händelser för "Mina resor"
   (bokningsförfrågningar, egna väntande bokningar, upplåsningar)
──────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useActivity } from "../context/ActivityContext.jsx";

export default function useMyRidesNewEvents() {
  const { user } = useAuth();
  const { last } = useActivity();

  const [counts, setCounts] = useState({ driver: 0, bookings: 0, unlocks: 0 });

  useEffect(() => {
    if (!user) return;
    const unsubs = [];

    // (1) Nya förfrågningar på mina förarannonser (jag är mottagaren)
    unsubs.push(
      onSnapshot(
        query(
          collection(db, "bookings"),
          where("counterpartyId", "==", user.uid),
          where("status", "==", "requested")
        ),
        (snap) => {
          const n = snap.docs.filter(
            (d) => (d.data().createdAt || 0) > last("driver")
          ).length;
          setCounts((prev) => ({ ...prev, driver: n }));
        }
      )
    );

    // (2) Mina egna väntande bokningar (som passagerare)
    unsubs.push(
      onSnapshot(
        query(
          collection(db, "bookings"),
          where("userId", "==", user.uid),
          where("status", "==", "requested")
        ),
        (snap) => {
          const n = snap.docs.filter(
            (d) => (d.data().createdAt || 0) > last("bookings")
          ).length;
          setCounts((prev) => ({ ...prev, bookings: n }));
        }
      )
    );

    // (3) Upplåsta kontakter (betalda) – jag kan vara förare ELLER passagerare
    let unlockAsDriver = 0;
    let unlockAsPassenger = 0;
    const refreshUnlockTotal = () =>
      setCounts((prev) => ({ ...prev, unlocks: unlockAsDriver + unlockAsPassenger }));

    const unlockQuery = (field) =>
      query(
        collection(db, "bookings"),
        where(field, "==", user.uid),
        where("bookingType", "==", "contact_unlock"),
        where("paypal.status", "==", "paid")
      );

    unsubs.push(
      onSnapshot(unlockQuery("userId"), (snap) => {
        unlockAsDriver = snap.docs.filter(
          (d) => (d.data().paidAt || 0) > last("unlocks")
        ).length;
        refreshUnlockTotal();
      })
    );
    unsubs.push(
      onSnapshot(unlockQuery("counterpartyId"), (snap) => {
        unlockAsPassenger = snap.docs.filter(
          (d) => (d.data().paidAt || 0) > last("unlocks")
        ).length;
        refreshUnlockTotal();
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [db, user, last]);

  const sum = counts.driver + counts.bookings + counts.unlocks;
  const hasNew = sum > 0;

  return { counts, sum, hasNew };
}

