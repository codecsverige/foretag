// src/services/otpService.js
import { getAuth } from "firebase/auth";

function getFunctionsBaseUrl() {
  const custom = process.env.REACT_APP_FUNCTIONS_BASE_URL;
  if (custom && typeof custom === 'string') return custom.replace(/\/$/, '');
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const region = 'europe-west1';
  if (!projectId) return '';
  return `https://${region}-${projectId}.cloudfunctions.net`;
}

export async function canSendPhoneOtpServer() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return { ok: false, reason: 'auth', error: 'User not signed in' };
    const token = await user.getIdToken();

    const base = getFunctionsBaseUrl();
    if (!base) {
      // No base configured → allow, client limiter will still protect
      return { ok: true, degraded: true };
    }

    const res = await fetch(`${base}/canSendPhoneOtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userToken: token })
    });

    const data = await res.json();
    // Normalize to { ok, reason, waitMs, remaining, limit }
    if (res.ok && typeof data === 'object') return data;
    return { ok: false, reason: 'server', error: 'Request failed' };
  } catch (e) {
    console.warn('OTP preflight error', e);
    // Fail-open but with client-side limiter still active
    return { ok: true, degraded: true };
  }
}

