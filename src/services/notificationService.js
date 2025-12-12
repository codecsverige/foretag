/* ────────────────────────────────────────────────
   src/services/notificationService.js
   Service de notification amélioré avec gestion d'erreurs
──────────────────────────────────────────────── */
import {  collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase.js";
import logger from "../utils/logger.js";

/**
 * Envoie une notification à un utilisateur
 * 
 * @param {string} userEmail - Email de l'utilisateur
 * @param {string} title - Titre de la notification
 * @param {string} body - Corps de la notification
 * @param {string} [userName] - Nom de l'utilisateur (optionnel)
 * @param {string} [type] - Type de notification (info, success, warning, error)
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export async function sendNotification(
  userEmail,
  title,
  body,
  userName = "",
  type = "info"
) {
  try {
    if (!userEmail) {
      throw new Error("Email utilisateur requis");
    }

    // Normalize email to lowercase to match FCM token storage
    const normalizedEmail = userEmail.trim().toLowerCase();
  
    const notificationData = {
      userEmail: normalizedEmail,
      userName,
      title,
      body,
      type,
      createdAt: Date.now(),
      read: false,
      sent: true
    };

    const docRef = await addDoc(collection(db, "notifications"), notificationData);
    
    logger.log('Notification envoyée avec succès:', docRef.id);
    
    return {
      success: true,
      id: docRef.id,
      data: notificationData
    };
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de la notification:', error);
    
    // Retourner un objet d'erreur structuré
    return {
      success: false,
      error: error.message || 'Erreur inconnue lors de l\'envoi de la notification',
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Envoie une notification de déverrouillage de contact
 * 
 * @param {Object} bookingData - Données du booking
 * @param {string} shareMode - Mode de partage (both, phone, email, none)
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export async function sendUnlockNotification(bookingData, shareMode = "both") {
  try {
    const { passengerEmail, passengerName, ride_origin, ride_destination, price, commission } = bookingData;
    
    if (!passengerEmail) {
      throw new Error("Email passager requis");
    }

    const title = "Tack för din betalning! 🎉";
    let body = "✅ Betalningen har genomförts framgångsrikt!\n\n";
    
    // Message basé sur le mode de partage
    switch (shareMode) {
      case "both":
        body += "📞 Föraren har delat både telefonnummer och e-post med dig.\n";
        break;
      case "phone":
        body += "📞 Föraren har delat sitt telefonnummer med dig.\n";
        break;
      case "email":
        body += "📧 Föraren har delat sin e-postadress med dig.\n";
        break;
      case "none":
        body += "👤 Föraren har accepterat och kommer kontakta dig direkt.\n";
        break;
      default:
        body += "✅ Föraren har accepterat din förfrågan.\n";
    }

    // Ajouter des détails sur le trajet
    if (ride_origin && ride_destination) {
      body += `\n📍 Resa: ${ride_origin} → ${ride_destination}\n`;
    }

    // Ajouter les détails de paiement
    const amount = commission || 10;
    body += `\n💳 Betalning: ${amount} kr (reserverad)\n`;
    body += `⏱️ Du har 48 timmar att rapportera problem för återbetalning.\n`;
    body += `\n🚗 Lycka till med resan och tack för att du använder VägVänner!`;

    return await sendNotification(
      passengerEmail,
      title,
      body,
      passengerName,
      "success"
    );
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de la notification de déverrouillage:', error);
    return {
      success: false,
      error: error.message,
      code: 'UNLOCK_NOTIFICATION_ERROR'
    };
  }
}

/**
 * Send notification that capture completed successfully
 */
export async function sendCaptureSuccessNotification(bookingData) {
  try {
    const { passengerEmail, passengerName, commission = 10 } = bookingData;
    if (!passengerEmail) throw new Error("Email passagerare saknas");
    const title = "🎉 Betalning genomförd!";
    const body = `Din betalning på ${commission} kr har genomförts framgångsrikt. Kontaktuppgifterna förblir upplåsta.`;
    return await sendNotification(passengerEmail, title, body, passengerName, 'success');
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de la notification capture:', error);
    return { success: false, error: error.message, code: 'CAPTURE_NOTIFICATION_ERROR' };
  }
}

/**
 * Send notification that authorization was voided/refunded
 */
export async function sendVoidNotification(bookingData) {
  try {
    const { passengerEmail, passengerName } = bookingData;
    if (!passengerEmail) throw new Error("Email passagerare saknas");
    const title = "Återbetalning/void slutförd";
    const body = "Din betalningsreservation har släppts. Ingen debitering har skett.";
    return await sendNotification(passengerEmail, title, body, passengerName, 'info');
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de la notification void:', error);
    return { success: false, error: error.message, code: 'VOID_NOTIFICATION_ERROR' };
  }
}

/**
 * Envoie une notification d'annulation de booking
 * 
 * @param {Object} bookingData - Données du booking
 * @param {string} cancelledBy - Qui a annulé (driver/passenger)
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export async function sendCancellationNotification(bookingData, cancelledBy = "driver") {
  try {
    const { passengerEmail, passengerName, ride_origin, ride_destination, ride_date, ride_time } = bookingData;
    
    if (!passengerEmail) {
      throw new Error("Email passager requis");
    }

    const title = cancelledBy === "driver" 
      ? "Bokning avbruten av föraren ❌"
      : "Din bokning har avbrutits ✅";
      
    let body = cancelledBy === "driver" 
      ? "Tyvärr har föraren avbrutit din bokning.\n\n"
      : "Din bokning har avbrutits enligt din begäran.\n\n";

    // Ajouter des détails sur le trajet
    if (ride_origin && ride_destination) {
      body += `📍 Resa: ${ride_origin} → ${ride_destination}\n`;
    }
    
    if (ride_date && ride_time) {
      body += `📅 Datum: ${ride_date} kl. ${ride_time}\n`;
    }
    
    body += "\n";
    
    if (cancelledBy === "driver") {
      body += "💡 Tips: Sök efter andra resor på VägVänner.\n";
      body += "Vi beklagar besväret och hoppas du hittar en annan resa snart!";
    } else {
      body += "Om du ändrar dig kan du alltid boka en ny resa.\n";
      body += "Tack för att du använder VägVänner!";
    }

    return await sendNotification(
      passengerEmail,
      title,
      body,
      passengerName,
      "warning"
    );
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de la notification d\'annulation:', error);
    return {
      success: false,
      error: error.message,
      code: 'CANCELLATION_NOTIFICATION_ERROR'
    };
  }
}

/**
 * إرسال إشعار موافقة على الحجز
 * @param {string} passengerEmail 
 * @param {string} passengerName 
 * @param {Object} rideData 
 * @returns {Promise<Object>}
 */
export async function sendBookingApprovedNotification(passengerEmail, passengerName, rideData) {
  try {
    console.log('🔔 Sending approval notification to:', passengerEmail);
    const title = "Bokning godkänd! 🎉";
    const body = `Din bokningsförfrågan har godkänts!\n\n` +
                 `🚗 ${rideData.origin} → ${rideData.destination}\n` +
                 `📅 ${rideData.date} kl. ${rideData.departureTime}\n\n` +
                 `Föraren kommer att kontakta dig för att planera resan.\n` +
                 `Du kan nu chatta med föraren i VägVänner.`;
    
    const result = await sendNotification(passengerEmail, title, body, passengerName, "success");
    console.log('✅ Approval notification result:', result);
    return result;
  } catch (error) {
    console.error('❌ Approval notification error:', error);
    logger.error('Fel vid approval notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * إرسال إشعار رفض الحجز  
 * @param {string} passengerEmail 
 * @param {string} passengerName 
 * @param {Object} rideData 
 * @returns {Promise<Object>}
 */
export async function sendBookingRejectedNotification(passengerEmail, passengerName, rideData) {
  try {
    const title = "Bokning avvisad 😔";
    const body = `Tyvärr har föraren avvisat din bokningsförfrågan.\n\n` +
                 `🚗 ${rideData.origin} → ${rideData.destination}\n` +
                 `📅 ${rideData.date} kl. ${rideData.departureTime}\n\n` +
                 `Du kan söka efter andra resor på VägVänner.\n` +
                 `Tack för förståelsen!`;
    
    return await sendNotification(passengerEmail, title, body, passengerName, "info");
  } catch (error) {
    logger.error('Fel vid rejection notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * إرسال إشعار للسائق عن طلب حجز جديد
 * @param {string} driverEmail 
 * @param {string} driverName 
 * @param {Object} rideData 
 * @param {string} passengerName 
 * @returns {Promise<Object>}
 */
export async function sendNewBookingNotification(driverEmail, driverName, rideData, passengerName) {
  try {
    console.log('🔔 Sending new booking notification to:', driverEmail);
    const title = "Ny bokningsförfrågan! 📬";
    const body = `${passengerName} vill boka din resa.\n\n` +
                 `🚗 ${rideData.origin} → ${rideData.destination}\n` +
                 `📅 ${rideData.date} kl. ${rideData.departureTime}\n\n` +
                 `Öppna VägVänner för att se meddelandet och svara.`;
    
    const result = await sendNotification(driverEmail, title, body, driverName, "info");
    console.log('✅ New booking notification result:', result);
    return result;
  } catch (error) {
    console.error('❌ New booking notification error:', error);
    logger.error('Fel vid ny bokning notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie une notification de rapport/réclamation
 * 
 * @param {Object} reportData - Données du rapport
 * @returns {Promise<Object>} - Résultat de l'opération
 */
export async function sendReportNotification(reportData) {
  try {
    const { reporterEmail, reporterName, reason, message } = reportData;
    
    if (!reporterEmail) {
      throw new Error("Email rapporteur requis");
    }

    const title = "Rapport mottaget 📝";
    
    let body = "Vi har tagit emot din rapport och kommer granska ärendet.\n\n";
    
    // Raison du rapport
    const reasonTexts = {
      "wrong_number": "Fel nummer / kontaktuppgift",
      "no_response": "Ingen kontakt / svarar inte",
      "spam": "Spam / olämpligt innehåll",
      "other": "Annat problem"
    };
    
    body += `📋 Anledning: ${reasonTexts[reason] || reason}\n`;
    
    if (message) {
      body += `💬 Ditt meddelande: ${message}\n`;
    }
    
    body += "\n⏱️ Vi granskar alla rapporter inom 24-48 timmar.\n";
    body += "💳 Din betalning är pausad tills vi har granskat ärendet.\n";
    body += "📧 Vi kontaktar dig via e-post med uppdateringar.\n\n";
    body += "Tack för att du hjälper oss hålla VägVänner säkert!";

    return await sendNotification(
      reporterEmail,
      title,
      body,
      reporterName,
      "info"
    );
  } catch (error) {
    logger.error('Erreur lors de l\'envoi de la notification de rapport:', error);
    return {
      success: false,
      error: error.message,
      code: 'REPORT_NOTIFICATION_ERROR'
    };
  }
}
