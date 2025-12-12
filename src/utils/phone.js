// src/utils/phone.js
import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Normalize a Swedish phone number to E.164 and validate it strictly as SE.
 * Accepts inputs like 07x..., 08..., +46..., 0046..., with or without spaces/dashes.
 * Returns { ok: boolean, e164?: string, error?: string }
 */
export function normalizeSwedishPhone(input) {
  const raw = (input || "").toString().trim();
  if (!raw) {
    return { ok: false, error: "Tomt nummer" };
  }

  // Try Swedish default region to interpret local formats (07x, 08, etc.)
  let phone = parsePhoneNumberFromString(raw, 'SE');
  if (!phone || !phone.isValid()) {
    // Try parsing as international explicitly
    phone = parsePhoneNumberFromString(raw);
  }

  if (!phone || !phone.isValid() || phone.country !== 'SE') {
    return { ok: false, error: "Endast svenska nummer (+46) accepteras" };
  }

  try {
    const e164 = phone.number; // Already E.164
    if (!e164.startsWith('+46')) {
      return { ok: false, error: "Endast svenska nummer (+46) accepteras" };
    }
    return { ok: true, e164 };
  } catch (_) {
    return { ok: false, error: "Ogiltigt telefonnummer" };
  }
}

/**
 * Quick boolean check for Swedish phone numbers.
 */
export function isValidSwedishPhone(input) {
  const res = normalizeSwedishPhone(input);
  return !!res.ok;
}

