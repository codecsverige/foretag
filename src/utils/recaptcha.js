// src/utils/recaptcha.js
import { RecaptchaVerifier } from "firebase/auth";

export function createInvisibleRecaptcha(auth, containerId = 'recaptcha-container', options = {}) {
  const { onSolved, onExpired } = options;
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      try { onSolved && onSolved(); } catch {}
    },
    'expired-callback': () => {
      try { onExpired && onExpired(); } catch {}
    }
  });
  verifier.render();
  return verifier;
}

export function clearRecaptcha(verifier) {
  if (!verifier) return;
  try { verifier.clear?.(); } catch {}
}

