import { LEGAL_CONTROLLER_NAME, LEGAL_EMAIL } from "../config/legal.js";
const BASE_URL = process.env.PUBLIC_BASE_URL || "https://vagvanner.se";

/** Skickar två e-postmeddelanden till båda parter efter bokning */
export async function sendBookingEmails({
  bookingId,
  passenger,
  driver,
  ride,
  seats,
}) {
  // Disabled: email sending handled only in specific scenarios elsewhere
  return { ok: true, skipped: true, reason: "email_disabled_global" };
}

/**
 * Skickar ett kvitto/confirmation till passageraren vid inskickad bokningsförfrågan (utan PII för motparten)
 */
export async function sendPassengerBookingReceiptEmail({ toEmail, toName, ride }) {
  return { ok: true, skipped: true, reason: "email_disabled_global" };
}

/**
 * إشعار للراكب عند قبول السائق للحجز
 */
export async function sendBookingAcceptedEmail({ passengerEmail, passengerName, driverName, ride, bookingLink }) {
  return { ok: true, skipped: true, reason: "email_disabled_global" };
}

/**
 * إشعار للـ passenger عند اهتمام أحد برحلته
 */
export async function sendInterestNotificationEmail({ passengerEmail, passengerName, ride }) {
  return { ok: true, skipped: true, reason: "email_disabled_global" };
}

/**
 * إشعار إلغاء الحجز
 */
export async function sendBookingCancelledEmail({ toEmail, toName, ride, cancelledBy }) {
  return { ok: true, skipped: true, reason: "email_disabled_global" };
}
