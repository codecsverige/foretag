/* ──────── src/hooks/useUnreadCount.js ──────── */
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

/** Retourne le nombre de messages non lus pour l’utilisateur connecté */
export default function useUnreadCount() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }

    
    const q = query(collection(db, "rides"), where("userId", "==", user.uid));

    const unsub = onSnapshot(q, (snap) => {
      let total = 0;
      snap.forEach((d) => {
        (d.data().messages || []).forEach((m) => {
          // si le champ `read` est absent OU false → non-lu
          if (!m.read) total += 1;
        });
      });
      setUnread(total);
    });

    return unsub;
  }, [user]);

  return unread;
}
