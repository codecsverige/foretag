/* ────────────────────────────────────────────────
   src/services/reportService.js
   Skickar rapport vid kontaktupplåsning (contact_unlock)
   Skapar dokument i reports-samlingen och markerar bokning som rapporterad.
──────────────────────────────────────────────── */
import {
  getFirestore,
  
  collection,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import { sendReportNotification } from "./notificationService.js";

// Helper function to get readable reason text
function getReasonText(reason) {
  const reasonTexts = {
    "wrong_number": "Fel nummer / kontaktuppgift",
    "no_response": "Ingen kontakt / svarar inte", 
    "spam": "Spam / olämpligt beteende",
    "other": "Annat problem"
  };
  return reasonTexts[reason] || reason;
}

/**
 * Registrerar en rapport för bokning av typ contact_unlock.
 * Ändrar inte betalningsstatus; Scheduler kontrollerar reported för att hoppa över Capture.
 *
 * @param {Object} p
 * @param {string} p.bookingId
 * @param {string} p.rideId
 * @param {string} p.reporterId
 * @param {string} p.reporterEmail
 * @param {string} [p.reporterName]
 * @param {string} p.reason    - kode kort: "wrong_number" | "no_response" | "spam" | "other"
 * @param {string} [p.message] - fritext
 */
export async function submitUnlockReport({
  bookingId,
  rideId,
  reporterId,
  reporterEmail,
  reporterName = "Anonym",
  reason,
  message = "",
}) {
  try {
    // 1) Skapa rapport i reports-samlingen
    const reportData = {
      type: "contact_unlock",
      bookingId,
      rideId,
      reporterId,
      reporterEmail,
      reporterName,
      reason,
      message,
      createdAt: new Date(),
      status: "pending",
    };
    const reportRef = await addDoc(collection(db, "reports"), reportData);

    // 2) Markera bokningen som rapporterad
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      reported: true,
      reportedAt: new Date(),
      reportReason: reason,
      reportId: reportRef.id,
    });

    // 3) Skicka notifikation till admin
    await sendReportNotification({
      bookingId,
      reason,
      message,
    });

    // 4) Skicka bekräftelse till användaren i inbox
    await addDoc(collection(db, "notifications"), {
      userEmail: reporterEmail,
      userName: reporterName,
      title: "📝 Rapport skickad",
      body: `Din rapport har tagits emot och kommer att granskas inom 24-48 timmar.\n\n` +
            `🔍 Anledning: ${getReasonText(reason)}\n` +
            `💳 Din betalning är pausad under granskningen\n` +
            `📧 Vi kontaktar dig via e-post med uppdateringar\n\n` +
            `Tack för att du hjälper oss hålla VägVänner säkert!`,
      createdAt: Date.now(),
      read: false,
      type: "info",
    });

    return { success: true, reportId: reportRef.id };
  } catch (error) {
    console.error("Error submitting report:", error);
    return { success: false, error: error.message };
  }
}

export default submitUnlockReport;