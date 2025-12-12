import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  query,
  collection,
  where,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useActivity } from "../context/ActivityContext.jsx";
import Pill from "./Pill.jsx";

export default function MyRidesNavLink() {
  const { user } = useAuth();
  const { last } = useActivity();          // timestamps « driver », « bookings », « unlocks »
  

  /* — compteur par catégorie — */
  const [counts, setCounts] = useState({ driver: 0, bookings: 0, unlocks: 0 });

  useEffect(() => {
    if (!user) return;
    const unsubs = [];

    /* (1) nouvelles demandes reçues par MES annonces conducteur */
    unsubs.push(
      onSnapshot(
        query(
          collection(db, "bookings"),
          where("counterpartyId", "==", user.uid),  // le conducteur = destinataire
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

    /* (2) mes propres réservations encore en attente (côté passager) */
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

    /* (3) contacts débloqués (payés) — je peux être conducteur OU passager */
    let unlockAsDriver = 0;
    let unlockAsPassenger = 0;
    const refreshUnlockTotal = () =>
      setCounts((prev) => ({
        ...prev,
        unlocks: unlockAsDriver + unlockAsPassenger,
      }));

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

  /* total affiché dans le badge */
  const sum = counts.driver + counts.bookings + counts.unlocks;

  return (
    <NavLink to="/my-rides" className="relative inline-flex items-center gap-1">
      🧳 Passager
      <Pill count={sum} />
    </NavLink>
  );
}
