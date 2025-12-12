import { db } from "../firebase/firebase.js";
import { doc, setDoc, deleteField } from "firebase/firestore";

function normalizeEmail(email = "") {
  try { return String(email).trim().toLowerCase(); } catch { return ""; }
}

export async function saveFcmTokenForEmail(userEmail, token, extra = {}) {
  const email = normalizeEmail(userEmail);
  if (!email || !token) return false;
  
  try {
    const ref = doc(db, "user_fcm_by_email", email);
    const now = Date.now();
    await setDoc(ref, {
      email,
      app: extra.platform || extra.deviceType || "web",
      updatedAt: now,
      // Store tokens as a map for easy cleanup of individual tokens
      tokens: { [token]: now },
      ...extra,
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving FCM token:', error.message);
    return false;
  }
}

export async function removeFcmTokenForEmail(userEmail, token) {
  const email = normalizeEmail(userEmail);
  if (!email || !token) return false;
  try {
    const ref = doc(db, "user_fcm_by_email", email);
    await setDoc(ref, { tokens: { [token]: deleteField() }, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (_) {
    return false;
  }
}

export default { saveFcmTokenForEmail, removeFcmTokenForEmail };

