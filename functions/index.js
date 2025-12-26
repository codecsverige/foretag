/**
 * BokaNära - Cloud Functions
 * 
 * Hanterar:
 * - SMS-påminnelser för bokningar
 * - Push-notifikationer
 * - Databasunderhåll
 * - SEO-generering
 */

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const validator = require("validator");
const emailjs = require("@emailjs/nodejs");

// Initialize Firebase Admin
admin.initializeApp();

// Set global options
setGlobalOptions({
  maxInstances: 10,
  region: "europe-west1", // EU (Belgium) region
});

// SMS Configuration
const SMS_PROVIDER = process.env.SMS_PROVIDER || '';
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_API_SECRET = process.env.SMS_API_SECRET || '';
const SMS_SENDER = process.env.SMS_SENDER || 'BokaNara';
const EMAILJS_PUBLIC_KEY = defineSecret('EMAILJS_PUBLIC_KEY');
const EMAILJS_PRIVATE_KEY = defineSecret('EMAILJS_PRIVATE_KEY');
const EMAILJS_SERVICE_ID = defineSecret('EMAILJS_SERVICE_ID');
const EMAILJS_TEMPLATE_ID_BOOKING = defineSecret('EMAILJS_TEMPLATE_ID_BOOKING');

// Lightweight in-memory rate limiter
function createMemoryLimiter(points, durationSec) {
  const store = new Map();
  return {
    async consume(key) {
      const now = Date.now();
      const e = store.get(key) || { c: 0, resetAt: now + durationSec * 1000 };
      if (now > e.resetAt) {
        e.c = 0;
        e.resetAt = now + durationSec * 1000;
      }
      if (e.c >= points) {
        const err = new Error('Too many requests');
        err.msBeforeNext = e.resetAt - now;
        throw err;
      }
      e.c += 1;
      store.set(key, e);
      return true;
    }
  };
}

const rateLimiter = createMemoryLimiter(30, 60);

// =========================================================
// SMS Functions
// =========================================================

function normalizePhone(phone) {
  let p = String(phone || '').trim().replace(/[^\d+]/g, '');
  if (p.startsWith('07') && p.length === 10) {
    p = '+46' + p.substring(1);
  } else if (p.startsWith('0046')) {
    p = '+46' + p.substring(4);
  } else if (p.startsWith('46') && p.length === 11) {
    p = '+' + p;
  }
  return p;
}

async function sendSms({ to, message }) {
  if (!SMS_PROVIDER || !SMS_API_KEY) {
    console.log('[SMS] Provider ej konfigurerad:', { to, message: message.substring(0, 30) });
    return { ok: false, skipped: true, reason: 'sms_not_configured' };
  }

  try {
    // 46elks implementation
    if (SMS_PROVIDER === '46elks') {
      const auth = Buffer.from(`${SMS_API_KEY}:${SMS_API_SECRET}`).toString('base64');
      const params = new URLSearchParams({
        from: SMS_SENDER,
        to: to,
        message: message,
      });
      
      const res = await fetch('https://api.46elks.com/a1/sms', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      
      const data = await res.json();
      if (res.ok) {
        return { ok: true, messageId: data.id };
      }
      return { ok: false, error: data.message || 'SMS failed' };
    }
    
    // Twilio implementation
    if (SMS_PROVIDER === 'twilio') {
      const accountSid = SMS_API_KEY;
      const authToken = SMS_API_SECRET;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const params = new URLSearchParams({
        From: SMS_SENDER,
        To: to,
        Body: message,
      });
      
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      
      const data = await res.json();
      if (res.ok) {
        return { ok: true, messageId: data.sid };
      }
      return { ok: false, error: data.message || 'SMS failed' };
    }

    return { ok: false, error: `Unknown provider: ${SMS_PROVIDER}` };
  } catch (e) {
    console.error('SMS error:', e);
    return { ok: false, error: String(e.message || e) };
  }
}

// =========================================================
// Booking Notifications
// =========================================================

/**
 * Send notification when a new booking is created
 */
exports.onBookingCreated = onDocumentCreated({
  document: "bookings/{bookingId}",
  secrets: [EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_BOOKING],
}, async (event) => {
  try {
    const db = admin.firestore();
    const booking = event.data && event.data.data();
    if (!booking) return null;

    const bookingId = event.params.bookingId;
    const companyId = booking.companyId;
    const bookingDate = booking.date || '';
    const bookingTime = booking.time || '';
    const slotId = (booking.slotId || (bookingDate && bookingTime ? `${bookingDate}_${String(bookingTime).replace(':', '-')}` : '')).trim();
    
    // Get company info
    const companySnap = await db.collection('companies').doc(companyId).get();
    if (!companySnap.exists) return null;
    const company = companySnap.data();
    
    const ownerEmail = (company.email || company.ownerEmail || '').trim();
    if (!ownerEmail) return null;

    let cancelledBySlot = false;
    if (companyId && slotId) {
      const slotRef = db.collection('companies').doc(companyId).collection('bookingSlots').doc(slotId);
      const bookingRef = event.data.ref;
      try {
        await db.runTransaction(async (tx) => {
          const slotSnap = await tx.get(slotRef);
          if (!slotSnap.exists) {
            tx.set(slotRef, {
              companyId,
              date: bookingDate,
              time: bookingTime,
              bookingId,
              createdAt: Date.now(),
            });
            return;
          }

          const existing = slotSnap.data() || {};
          const existingBookingId = String(existing.bookingId || '');
          if (existingBookingId && existingBookingId !== bookingId) {
            tx.set(bookingRef, { status: 'cancelled', updatedAt: Date.now(), cancelReason: 'slot_taken' }, { merge: true });
            cancelledBySlot = true;
          } else {
            tx.set(slotRef, { bookingId }, { merge: true });
          }
        });
      } catch (e) {
        console.error('slot ensure error:', e);
      }
    }

    if (cancelledBySlot || booking.status === 'cancelled' || booking.cancelReason === 'slot_taken') {
      return null;
    }

    // Create notification for company owner
    const title = '📅 Ny bokning!';
    const body = [
      `${booking.customerName || 'En kund'} har bokat ${booking.serviceName || 'en tjänst'}.`,
      '',
      `📆 ${bookingDate} kl. ${bookingTime}`,
      (booking.customerPhone || booking.phone) ? `📞 ${booking.customerPhone || booking.phone}` : '',
    ].filter(Boolean).join('\n');

    await db.collection('notifications').add({
      userEmail: ownerEmail.toLowerCase(),
      userName: company.name || '',
      title,
      body,
      type: 'info',
      createdAt: Date.now(),
      read: false,
      route: '/konto',
    });

    try {
      const wantsSms = Boolean(booking.smsReminder);
      const toPhone = normalizePhone(booking.customerPhone || booking.phone);
      const appointmentMs = Date.parse(`${bookingDate}T${bookingTime}:00`);
      if (wantsSms && toPhone && Number.isFinite(appointmentMs)) {
        const now = Date.now();
        const reminders = [
          { kind: 'before_24h', offsetMs: 24 * 60 * 60 * 1000 },
          { kind: 'before_2h', offsetMs: 2 * 60 * 60 * 1000 },
        ];

        const batch = db.batch();
        reminders.forEach(({ kind, offsetMs }) => {
          const sendAt = appointmentMs - offsetMs;
          if (sendAt <= now + 60 * 1000) return;
          const ref = db.collection('reminders').doc(`${bookingId}_${kind}`);
          const message = kind === 'before_24h'
            ? `Påminnelse: Du har en bokning hos ${(booking.companyName || company.name || 'företaget')} imorgon kl ${bookingTime}. Tjänst: ${(booking.serviceName || booking.service || 'din tjänst')}. /BokaNära`
            : `Påminnelse: Din bokning hos ${(booking.companyName || company.name || 'företaget')} börjar om 2 timmar (${bookingTime}). /BokaNära`;
          batch.set(ref, {
            channel: 'sms',
            status: 'pending',
            kind,
            companyId,
            customerId: booking.customerId || null,
            bookingId,
            toPhone,
            message,
            sendAt,
            createdAt: now,
            attempts: 0,
          }, { merge: true });
        });

        await batch.commit();
      }
    } catch (e) {
      console.error('create reminders error:', e);
    }

    const emailjsPublicKey = EMAILJS_PUBLIC_KEY.value();
    const emailjsPrivateKey = EMAILJS_PRIVATE_KEY.value();
    const emailjsServiceId = EMAILJS_SERVICE_ID.value();
    const emailjsTemplateId = EMAILJS_TEMPLATE_ID_BOOKING.value();

    if (emailjsPublicKey && emailjsPrivateKey && emailjsServiceId && emailjsTemplateId) {
      const customerName = booking.customerName || 'Kund';
      const customerPhone = booking.customerPhone || booking.phone || '';
      const customerEmail = booking.customerEmail || '';
      const serviceName = booking.serviceName || booking.service || 'Tjänst';
      const servicePrice = Number(booking.servicePrice || 0);
      const serviceDuration = Number(booking.serviceDuration || 0);
      const date = booking.date || '';
      const time = booking.time || '';
      const customerMessage = booking.customerMessage || '';

      const templateParams = {
        to_email: ownerEmail,
        company_name: company.name || '',
        booking_id: bookingId,
        company_id: companyId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        service_name: serviceName,
        service_price: servicePrice,
        service_duration: serviceDuration,
        booking_date: date,
        booking_time: time,
        customer_message: customerMessage,
        dashboard_url: 'https://bokanara.se/konto?tab=bookings',
      };

      try {
        await emailjs.send(
          emailjsServiceId,
          emailjsTemplateId,
          templateParams,
          {
            publicKey: emailjsPublicKey,
            privateKey: emailjsPrivateKey,
          }
        );
      } catch (e) {
        console.error('EmailJS send error:', e && e.message ? e.message : e);
      }
    } else {
      console.log('[EmailJS] Not configured, skipping email for booking:', bookingId);
    }

    return null;
  } catch (e) {
    console.error('onBookingCreated error:', e);
    return null;
  }
});

/**
 * Create SMS reminders when booking is confirmed
 */
exports.createBookingReminders = onDocumentUpdated("bookings/{bookingId}", async (event) => {
  try {
    const db = admin.firestore();
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status !== 'cancelled' && after.status === 'cancelled') {
      const bookingId = event.params.bookingId;
      const companyId = after.companyId;
      const slotId = (after.slotId || (after.date && after.time ? `${after.date}_${String(after.time).replace(':', '-')}` : '')).trim();

      if (companyId && slotId) {
        await db.collection('companies').doc(companyId).collection('bookingSlots').doc(slotId).delete().catch(() => {});
      }

      const batch = db.batch();
      ['before_24h', 'before_2h'].forEach((kind) => {
        batch.delete(db.collection('reminders').doc(`${bookingId}_${kind}`));
      });
      await batch.commit().catch(() => {});
      return null;
    }
    
    // Only trigger when status changes to 'confirmed'
    if (before.status === 'confirmed' || after.status !== 'confirmed') {
      return null;
    }

    const bookingId = event.params.bookingId;
    const phone = normalizePhone(after.phone || after.customerPhone);
    if (!phone) return null;

    // Parse appointment time
    const dateStr = after.date;
    const timeStr = after.time;
    if (!dateStr || !timeStr) return null;

    const appointmentMs = Date.parse(`${dateStr}T${timeStr}:00`);
    if (!Number.isFinite(appointmentMs)) return null;

    const now = Date.now();
    const companyName = after.companyName || 'företaget';
    const serviceName = after.serviceName || 'din tjänst';

    // Schedule reminders
    const reminders = [
      { kind: 'before_24h', offsetMs: 24 * 60 * 60 * 1000 },
      { kind: 'before_2h', offsetMs: 2 * 60 * 60 * 1000 },
    ];

    const batch = db.batch();
    reminders.forEach(({ kind, offsetMs }) => {
      const sendAt = appointmentMs - offsetMs;
      if (sendAt <= now + 60 * 1000) return;

      const message = kind === 'before_24h'
        ? `Påminnelse: Du har en bokning hos ${companyName} imorgon kl ${timeStr}. Tjänst: ${serviceName}. /BokaNära`
        : `Påminnelse: Din bokning hos ${companyName} börjar om 2 timmar (${timeStr}). /BokaNära`;

      const ref = db.collection('reminders').doc(`${bookingId}_${kind}`);
      batch.set(ref, {
        channel: 'sms',
        status: 'pending',
        kind,
        companyId: after.companyId,
        customerId: after.customerId,
        bookingId,
        toPhone: phone,
        message,
        sendAt,
        createdAt: now,
        attempts: 0,
      }, { merge: true });
    });

    await batch.commit();
    return null;
  } catch (e) {
    console.error('createBookingReminders error:', e);
    return null;
  }
});

/**
 * Send due SMS reminders every 5 minutes
 */
exports.sendDueReminders = onSchedule({ schedule: "every 5 minutes", timeZone: "Europe/Stockholm" }, async () => {
  const db = admin.firestore();
  const now = Date.now();
  const LIMIT = 50;

  try {
    const snap = await db.collection('reminders')
      .where('status', '==', 'pending')
      .where('sendAt', '<=', now)
      .orderBy('sendAt', 'asc')
      .limit(LIMIT)
      .get();

    if (snap.empty) return null;

    const tasks = snap.docs.map(async (docSnap) => {
      const r = docSnap.data() || {};
      const attempts = Number(r.attempts || 0);
      
      if (attempts >= 3) {
        await docSnap.ref.set({ status: 'failed', lastError: 'max_attempts', updatedAt: now }, { merge: true });
        return;
      }

      const to = normalizePhone(r.toPhone);
      if (!to) {
        await docSnap.ref.set({ status: 'failed', lastError: 'missing_phone', updatedAt: now, attempts: attempts + 1 }, { merge: true });
        return;
      }

      const message = r.message || 'Påminnelse: Du har en bokning snart. Öppna BokaNära för detaljer.';
      const result = await sendSms({ to, message });

      if (result && result.ok) {
        await docSnap.ref.set({ status: 'sent', sentAt: now, updatedAt: now, provider: SMS_PROVIDER || 'unknown' }, { merge: true });
      } else {
        await docSnap.ref.set({
          status: (attempts + 1 >= 3) ? 'failed' : 'pending',
          attempts: attempts + 1,
          lastError: (result && (result.reason || result.error)) || 'send_failed',
          updatedAt: now,
        }, { merge: true });
      }
    });

    await Promise.all(tasks);
    return null;
  } catch (e) {
    console.error('sendDueReminders error:', e);
    return null;
  }
});

// =========================================================
// Push Notifications
// =========================================================

/**
 * Send FCM push when a new notification is created
 */
exports.pushOnNotificationCreate = onDocumentCreated("notifications/{id}", async (event) => {
  try {
    const db = admin.firestore();
    const notif = event.data && event.data.data();
    if (!notif) return null;
    
    const email = (notif.userEmail || '').trim().toLowerCase();
    if (!email) return null;

    const fcmDoc = await db.collection('user_fcm_by_email').doc(email).get();
    if (!fcmDoc.exists) return null;
    
    const fcmData = fcmDoc.data() || {};
    const tokensMap = fcmData.tokens || {};
    const tokens = Object.keys(tokensMap).filter(Boolean).slice(0, 100);
    if (!tokens.length) return null;

    const message = {
      notification: {
        title: notif.title || 'BokaNära',
        body: notif.body || '',
      },
      data: {
        route: notif.route || '/',
        type: String(notif.type || 'info'),
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#3b82f6',
          defaultSound: true,
          priority: 'high',
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          }
        }
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
        }
      }
    };

    const results = await Promise.all(tokens.map(async (t) => {
      try { 
        return await admin.messaging().send({ token: t, ...message });
      } catch (e) { 
        return { error: e && e.message || 'send_failed', token: t }; 
      }
    }));

    // Cleanup invalid tokens
    const invalidTokens = results
      .filter(r => r && r.error)
      .map(r => r.token)
      .filter(Boolean);
    
    if (invalidTokens.length) {
      const updates = {};
      invalidTokens.forEach(t => { updates[`tokens.${t}`] = admin.firestore.FieldValue.delete(); });
      await fcmDoc.ref.set(updates, { merge: true });
    }

    return null;
  } catch (e) {
    console.error('pushOnNotificationCreate error:', e);
    return null;
  }
});

// =========================================================
// Data Maintenance
// =========================================================

/**
 * Daily maintenance: cleanup old data
 */
exports.dailyMaintenance = onSchedule({ schedule: '0 3 * * *', timeZone: 'Europe/Stockholm' }, async () => {
  const db = admin.firestore();
  const now = Date.now();
  const DAYS = (n) => n * 24 * 60 * 60 * 1000;
  
  try {
    // Delete old notifications (>180 days)
    const oldNotifs = now - DAYS(180);
    let notifSnap = await db.collection('notifications').where('createdAt', '<', oldNotifs).limit(500).get();
    while (!notifSnap.empty) {
      const batch = db.batch();
      notifSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      notifSnap = await db.collection('notifications').where('createdAt', '<', oldNotifs).limit(500).get();
    }

    // Delete sent/failed reminders (>30 days)
    const oldReminders = now - DAYS(30);
    let reminderSnap = await db.collection('reminders')
      .where('status', 'in', ['sent', 'failed'])
      .where('createdAt', '<', oldReminders)
      .limit(500)
      .get();
    while (!reminderSnap.empty) {
      const batch = db.batch();
      reminderSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      reminderSnap = await db.collection('reminders')
        .where('status', 'in', ['sent', 'failed'])
        .where('createdAt', '<', oldReminders)
        .limit(500)
        .get();
    }

    console.log('dailyMaintenance completed');
    return null;
  } catch (e) {
    console.error('dailyMaintenance error:', e);
    return null;
  }
});

// =========================================================
// Health Check
// =========================================================

exports.health = onRequest({ cors: true }, async (req, res) => {
  res.status(200).json({ 
    ok: true, 
    service: 'BokaNära Functions',
    timestamp: new Date().toISOString(),
    region: 'europe-west1'
  });
});
