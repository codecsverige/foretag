// src/services/alertService.js
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase.js";

export async function createRideAlert({
  userId,
  userEmail,
  originCity,
  destinationCity,
  preferredDate, // 'YYYY-MM-DD'
  preferredTime, // legacy single time (optional)
  preferredTimeFrom, // 'HH:mm' optional
  preferredTimeTo,   // 'HH:mm' optional
  toleranceMinutes = 720, // default 12h window
}) {
  if (!userId) throw new Error("Inloggning krävs");
  // Allow global alerts (no origin/destination/time)
  const payload = {
    userId,
    userEmail: userEmail || "",
    originCity,
    destinationCity,
    preferredDate: String(preferredDate || ""),
    preferredTime: String(preferredTime || ""),
    preferredTimeFrom: String(preferredTimeFrom || ""),
    preferredTimeTo: String(preferredTimeTo || ""),
    toleranceMinutes: Number(toleranceMinutes) || 720,
    scope: (!originCity && !destinationCity && !preferredDate && !preferredTime && !preferredTimeFrom && !preferredTimeTo) ? 'global' : 'filtered',
    active: true,
    createdAt: new Date().toISOString(),
    createdAtTs: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, "alerts"), payload);
  return ref.id;
}

export async function listActiveAlerts(userId) {
  const snap = await import('firebase/firestore').then(({ getDocs, query, collection, where, orderBy, limit }) =>
    getDocs(query(collection(db, 'alerts'), where('userId', '==', userId), where('active', '==', true), orderBy('createdAtTs', 'desc'), limit(50)))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deactivateAlert(alertId) {
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  await updateDoc(doc(db, 'alerts', alertId), { active: false, deactivatedAt: serverTimestamp() });
}

export default { createRideAlert, listActiveAlerts, deactivateAlert };

