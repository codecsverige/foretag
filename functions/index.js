const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {setGlobalOptions} = require("firebase-functions/v2");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const helmet = require("helmet");
const validator = require("validator");
const fetch = require("node-fetch");
const { onDocumentCreated: onDocCreated } = require("firebase-functions/v2/firestore");

// Initialize Firebase Admin
admin.initializeApp();

// Set global options
setGlobalOptions({
  maxInstances: 10,
  region: "europe-west1", // EU (Belgium) region
});

// Email transport configuration (Elastic Email)
const ELASTIC_API_KEY = process.env.ELASTIC_EMAIL_API_KEY || process.env.ELASTIC_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@vagvanner.se";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "VägVänner";

function withTimeout(promise, ms, reason = "timeout") {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return Promise.race([
    promise(ctrl.signal).finally(() => clearTimeout(t)),
  ]).catch((e) => {
    if (e && e.name === 'AbortError') throw new Error(reason);
    throw e;
  });
}

async function timedFetch(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function sendEmailViaElastic({ to, subject, html, text }) {
  if (!ELASTIC_API_KEY) {
    console.warn("sendEmailViaElastic: missing ELASTIC_EMAIL_API_KEY, skipping send");
    return { ok: false, skipped: true, reason: 'missing_api_key' };
  }
  const params = new URLSearchParams({
    apikey: ELASTIC_API_KEY,
    from: EMAIL_FROM,
    fromName: EMAIL_FROM_NAME,
    to,
    subject,
    bodyHtml: html || '',
    bodyText: text || '',
    isTransactional: "true"
  });

  const url = "https://api.elasticemail.com/v2/email/send";

  // Try up to 2 times with short timeouts
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await timedFetch(url, { method: "POST", body: params }, 6000);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data && (data.success === true || data.success === 'true')) {
        return { ok: true, messageID: data.data || null };
      }
      const err = (data && (data.error || data.message)) || `elastic status ${res.status}`;
      if (attempt === 2) return { ok: false, error: String(err) };
    } catch (e) {
      if (attempt === 2) return { ok: false, error: String(e && e.message || e) };
    }
  }
}

// Lightweight in-memory rate limiter (per instance)
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

// Rate limiter configuration (per IP)
const rateLimiter = createMemoryLimiter(10, 60);
const emailRateLimiter = createMemoryLimiter(5, 60);
const otpIpRateLimiter = createMemoryLimiter(5, 60);

/**
 * 🔒 SECURE EMAIL SENDING FUNCTION
 * Replaces client-side EmailJS with server-side security
 */
exports.sendSecureEmail = onRequest({
  cors: true,
  maxInstances: 5,
}, async (req, res) => {
  // Security headers
  helmet()(req, res, () => {});
  
  // CORS handling
  cors(req, res, async () => {
    try {
      // Rate limiting
      await emailRateLimiter.consume(req.ip);
      
      // Only allow POST
      if (req.method !== "POST") {
        return res.status(405).json({error: "Only POST method allowed"});
      }

      // Validate request body
      const {
        to_email,
        to_name,
        from_name,
        ride_origin,
        ride_destination,
        ride_date,
        ride_time,
        passenger_phone,
        passenger_comment,
        booking_type = "seat_booking"
      } = req.body;

      // Input validation
      if (!to_email || !validator.isEmail(to_email)) {
        return res.status(400).json({error: "Valid email required"});
      }

      if (!to_name || !validator.isLength(to_name, {min: 1, max: 100})) {
        return res.status(400).json({error: "Valid name required"});
      }

      if (!ride_origin || !ride_destination) {
        return res.status(400).json({error: "Origin and destination required"});
      }

      // Sanitize inputs
      const sanitizedData = {
        to_email: validator.escape(to_email.trim()),
        to_name: validator.escape(to_name.trim()),
        from_name: validator.escape((from_name || "").trim()),
        ride_origin: validator.escape(ride_origin.trim()),
        ride_destination: validator.escape(ride_destination.trim()),
        ride_date: validator.escape((ride_date || "").trim()),
        ride_time: validator.escape((ride_time || "").trim()),
        passenger_phone: validator.escape((passenger_phone || "").trim()),
        passenger_comment: validator.escape((passenger_comment || "").trim()),
      };

      // Disabled global email endpoint (kept for compatibility)
      return res.status(200).json({ success: true, skipped: true, reason: 'email_disabled_global' });

    } catch (rateLimitError) {
      if (rateLimitError.remainingHours) {
        return res.status(429).json({
          error: "Too many requests. Try again later.",
          retryAfter: Math.round(rateLimitError.msBeforeNext / 1000)
        });
      }
      
      console.error("Email function error:", rateLimitError);
      res.status(500).json({error: "Internal server error"});
    }
  });
});

/**
 * 🔒 SECURE BOOKING VALIDATION FUNCTION
 * Server-side validation for all booking operations
 */
exports.validateBooking = onRequest({
  cors: true,
  maxInstances: 5,
}, async (req, res) => {
  cors(req, res, async () => {
    try {
      await rateLimiter.consume(req.ip);

      if (req.method !== "POST") {
        return res.status(405).json({error: "Only POST method allowed"});
      }

      const {bookingData, userToken} = req.body;

      // Verify Firebase Auth token
      const decodedToken = await admin.auth().verifyIdToken(userToken);
      const uid = decodedToken.uid;

      // Server-side validation
      const validation = validateBookingData(bookingData, uid);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: "Validation failed",
          details: validation.errors
        });
      }

      // Additional security checks
      const securityCheck = await performSecurityChecks(bookingData, uid);
      
      if (!securityCheck.passed) {
        return res.status(403).json({
          error: "Security check failed",
          reason: securityCheck.reason
        });
      }

      res.status(200).json({
        success: true,
        validatedData: validation.sanitizedData
      });

    } catch (error) {
      console.error("Booking validation error:", error);
      res.status(500).json({error: "Validation failed"});
    }
  });
});

/**
 * 🔐 Server-side OTP quota & cooldown check
 * Enforces per-user daily cap and cooldown between requests using Firestore.
 * Returns { ok: boolean, reason?: string, waitMs?: number, remaining?: number }
 */
exports.canSendPhoneOtp = onRequest({ cors: true, maxInstances: 20 }, async (req, res) => {
  // Basic security headers and CORS
  cors(req, res, async () => {
    try {
      await otpIpRateLimiter.consume(req.ip);

      if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Only POST allowed' });
      }

      const { userToken } = req.body || {};
      if (!userToken) {
        return res.status(401).json({ ok: false, error: 'Missing user token' });
      }

      // Verify Firebase ID token
      const decoded = await admin.auth().verifyIdToken(userToken);
      const uid = decoded.uid;
      if (!uid) return res.status(401).json({ ok: false, error: 'Invalid token' });

      const db = admin.firestore();
      const ref = db.collection('otp_limits').doc(uid);
      const snap = await ref.get();

      const now = Date.now();
      const ONE_MIN = 60 * 1000;
      const COOLDOWN_MS = 60 * 1000; // 60s cooldown
      const DAILY_LIMIT = 5;

      const today = new Date();
      const dayKey = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2,'0')}-${today.getDate().toString().padStart(2,'0')}`;

      const data = snap.exists ? snap.data() : {};
      const lastAttemptAt = data.lastAttemptAt || 0;
      const counts = data.countByDay || {};
      const todayCount = counts[dayKey] || 0;

      // Cooldown
      if (now - lastAttemptAt < COOLDOWN_MS) {
        return res.status(200).json({ ok: false, reason: 'cooldown', waitMs: COOLDOWN_MS - (now - lastAttemptAt) });
      }

      // Daily cap
      if (todayCount >= DAILY_LIMIT) {
        return res.status(200).json({ ok: false, reason: 'daily_limit', remaining: 0, limit: DAILY_LIMIT });
      }

      // Record new attempt
      counts[dayKey] = todayCount + 1;
      await ref.set({ lastAttemptAt: now, countByDay: counts, updatedAt: now }, { merge: true });

      return res.status(200).json({ ok: true, remaining: Math.max(0, DAILY_LIMIT - counts[dayKey]) });
    } catch (error) {
      if (error && error.remainingPoints !== undefined) {
        return res.status(429).json({ ok: false, error: 'Too many requests', retryAfter: Math.round(error.msBeforeNext/1000) });
      }
      console.error('canSendPhoneOtp error', error);
      return res.status(500).json({ ok: false, error: 'Internal error' });
    }
  });
});

/**
 * 🔒 AUTOMATIC SECURITY MONITORING
 * Monitors and logs suspicious activities
 */
exports.monitorSecurity = onDocumentCreated("bookings/{bookingId}", (event) => {
  const booking = event.data.data();
  const bookingId = event.params.bookingId;

  // Monitor for suspicious patterns
  const suspiciousIndicators = [
    booking.price > 10000, // Unusually high price
    booking.seats > 8, // Too many seats
    !booking.userId || !booking.counterpartyId, // Missing user data
  ];

  if (suspiciousIndicators.some(indicator => indicator)) {
    console.warn("🚨 Suspicious booking detected:", {
      bookingId,
      userId: booking.userId,
      indicators: suspiciousIndicators
    });
    
    // In production: send alert to admin, flag for review
  }

  return null;
});

/**
 * 🔒 Attempt settlement (capture) for a single booking on demand
 * Client calls this after 48h window expires as a safe fallback.
 */
exports.attemptBookingSettlement = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Only POST allowed' });
      }

      const { bookingId, userToken } = req.body || {};
      if (!bookingId || !userToken) {
        return res.status(400).json({ ok: false, error: 'Missing bookingId or userToken' });
      }

      const decoded = await admin.auth().verifyIdToken(userToken);
      const callerUid = decoded.uid;
      if (!callerUid) return res.status(401).json({ ok: false, error: 'Invalid token' });

      const db = admin.firestore();
      const now = Date.now();
      const bkRef = db.collection('bookings').doc(bookingId);
      const bkSnap = await bkRef.get();
      if (!bkSnap.exists) return res.status(404).json({ ok: false, error: 'Booking not found' });
      const b = bkSnap.data();

      // Caller must be a party
      if (!(callerUid === b.userId || callerUid === b.counterpartyId)) {
        return res.status(403).json({ ok: false, error: 'Not allowed' });
      }

      const H48 = 48 * 60 * 60 * 1000;
      const toMs = (ts) => (typeof ts === 'number' ? ts : (ts && ts.toMillis ? ts.toMillis() : 0));
      const opened = toMs(b.contactUnlockedAt) || toMs(b.paidAt) || toMs(b.createdAt);
      const ends = b.reportWindowEndsAt ? toMs(b.reportWindowEndsAt) : (opened ? opened + H48 : 0);

      const status = String(b.status || '').toLowerCase();
      const wantsRefund = !!b.refundRequested || !!b.reported;
      if (status !== 'authorized') {
        return res.status(200).json({ ok: true, skipped: true, reason: 'not_authorized' });
      }
      if (!ends || now < ends) {
        return res.status(200).json({ ok: true, skipped: true, reason: 'window_not_ended' });
      }
      if (wantsRefund) {
        // Mark voided, append system message, notify
        await bkRef.update({ status: 'voided', voidedAt: now, note: 'Refund requested or reported', paypal: { ...(b.paypal||{}), status: 'VOIDED' } });
        await appendSystemMessage(db, bkRef, {
          type: 'system', id: `system-refund-${now}`, createdAt: now,
          text: 'Återbetalning begärd. Din betalning är pausad och reservationen släpps.'
        }, 'refundMsgSentAt');
        await sendUserNotification(db, b, 'Återbetalning pågår', 'Vi har mottagit din rapport/återbetalning. Beloppet reserveras inte längre.', 'warning');
        await archiveAndDeleteRideIfNeeded(db, { ...b, status: 'voided' }, 'refund eller rapport');
        return res.status(200).json({ ok: true, voided: true });
      }

      // Lock and capture
      const locked = await acquireSettlementLock(db, bkRef, now);
      if (!locked) {
        return res.status(200).json({ ok: true, skipped: true, reason: 'locked' });
      }

      const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
      const authId = b?.paypal?.authorizationId;
      if (!authId) {
        await bkRef.update({ status: 'voided', voidedAt: now, note: 'Missing authorizationId' });
        await appendSystemMessage(db, bkRef, { type: 'system', id: `system-void-missing-${now}`, createdAt: now, text: 'Betalningsreservationen har släppts. (Saknar authId)' }, 'voidMsgSentAt');
        await sendUserNotification(db, b, 'Betalningsreservation släppt', 'Din betalningsreservation kunde inte behandlas. Ingen debitering har skett.', 'info');
        await archiveAndDeleteRideIfNeeded(db, { ...b, status: 'voided' }, 'saknar authId');
        return res.status(200).json({ ok: true, voided: true, reason: 'missing_auth' });
      }

      // PayPal capture
      let data = { id: 'SIMULATED', status: 'COMPLETED' };
      if (!DRY_RUN) {
        const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
        const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
        const basic = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
          method: 'POST', headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials'
        });
        const tokenJson = await tokenRes.json();
        const access_token = tokenJson && tokenJson.access_token;
        if (!access_token) throw new Error('PayPal token error');
        const capRes = await fetch(`https://api-m.paypal.com/v2/payments/authorizations/${authId}/capture`, { method: 'POST', headers: { Authorization: `Bearer ${access_token}` }, body: JSON.stringify({}) });
        data = await capRes.json();
        if (!capRes.ok) {
          await bkRef.update({ status: 'error', settleError: data || true, errorAt: now });
          return res.status(500).json({ ok: false, error: 'capture_failed', details: data });
        }
      }

      await bkRef.update({ status: 'captured', capturedAt: now, paypal: { ...(b.paypal||{}), status: 'CAPTURED', captureResult: data } });
      await appendSystemMessage(db, bkRef, { type: 'system', id: `system-capture-${now}`, createdAt: now, text: '🎉 Tack för betalningen! Dina kontaktuppgifter är upplåsta. Du kan nu kontakta motparten fritt via telefon eller e‑post.' }, 'captureMsgSentAt');
      await sendUserNotification(db, b, '🎉 Betalning genomförd!', 'Din betalning har genomförts och kontakten är upplåst.', 'success');
      await archiveAndDeleteRideIfNeeded(db, { ...b, status: 'captured', paypal: { ...(b.paypal||{}), status: 'CAPTURED', captureResult: data } }, 'captured');
      return res.status(200).json({ ok: true, captured: true });
    } catch (e) {
      console.error('attemptBookingSettlement error', e);
      return res.status(500).json({ ok: false, error: 'internal' });
    }
  });
});

// Indexing moved to CI (GitHub Actions). No runtime pings here to keep functions light.

/**
 * 🔔 Alert matching: when a new ride is created, notify users who asked for this route
 */
exports.matchAlertsOnRideCreate = onDocumentCreated("rides/{rideId}", async (event) => {
  try {
    const db = admin.firestore();
    const rideId = event.params.rideId;
    const r = event.data.data();
    if (!r) return null;
    // Derive normalized searchable fields and departureAt (Timestamp)
    const originText = (r.origin || '').toString();
    const destinationText = (r.destination || '').toString();
    const originNorm = originText.split(',')[0].trim().toLowerCase();
    const destNorm = destinationText.split(',')[0].trim().toLowerCase();
    let departureAt = null;
    try {
      if (r.date) {
        const dt = new Date(`${r.date}T${(r.departureTime || '00:00')}:00.000Z`);
        if (!isNaN(dt.getTime())) {
          departureAt = admin.firestore.Timestamp.fromDate(dt);
        }
      }
    } catch {}

    const derive = {
      originNorm,
      destNorm,
      departureAt: departureAt || null,
      derivedAt: Date.now()
    };
    try { await db.collection('rides').doc(rideId).set(derive, { merge: true }); } catch {}
    const origin = originNorm;
    const dest = destNorm;
    if (!origin || !dest) return null;

    // Fetch active alerts (cap to 200 to avoid heavy scans)
    const snap = await db.collection('alerts')
      .where('active', '==', true)
      .limit(500)
      .get();
    if (snap.empty) return null;

    const toNotify = [];
    const rideMs = Date.parse(`${r.date || ''}T${r.departureTime || '00:00'}:00.000`);
    snap.forEach(doc => {
      const a = doc.data();
      const aFrom = String(a.originCity || '').trim().toLowerCase();
      const aTo = String(a.destinationCity || '').trim().toLowerCase();
      const isGlobal = a.scope === 'global' || (!aFrom && !aTo);

      // Route match: either global or matching origin/destination
      const routeOk = isGlobal || (aFrom && aTo && origin.includes(aFrom) && dest.includes(aTo));
      if (!routeOk) return;

      // Time/date matching:
      // - If alert has preferredDate, it must match ride.date
      // - If alert has time range (preferredTimeFrom/To), ride time must be within
      // - Else if alert has a single preferredTime, use tolerance window
      const tol = Number(a.toleranceMinutes || 720);
      if (a.preferredDate && r.date && a.preferredDate !== r.date) return;

      if (a.preferredTimeFrom && a.preferredTimeTo && r.departureTime) {
        const tRide = r.departureTime.slice(0,5);
        if (tRide < a.preferredTimeFrom || tRide > a.preferredTimeTo) return;
      } else if (rideMs && a.preferredTime) {
        const prefMs = Date.parse(`${a.preferredDate || r.date || ''}T${a.preferredTime || '00:00'}:00.000`);
        if (Number.isFinite(prefMs)) {
          const diff = Math.abs(rideMs - prefMs) / 60000; // minutes
          if (diff > tol) return;
        }
      }
      toNotify.push({ id: doc.id, ...a });
    });

    if (!toNotify.length) return null;

    const tasks = toNotify.slice(0, 200).map(async (a) => {
      // Write an in-app notification
      const title = 'Ny resa matchar din bevakning';
      const body = `${originText || ''} → ${destinationText || ''} den ${r.date || ''} ${r.departureTime || ''}`.trim();
      await db.collection('notifications').add({
        userEmail: a.userEmail || '',
        userName: a.userName || '',
        title,
        body,
        type: 'info',
        createdAt: Date.now(),
        read: false,
        route: `/ride/${rideId}`,
      }).catch(() => {});

      // Send email notification
      if (a.userEmail) {
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🔔 Ny resa matchar din bevakning!</h2>
            <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;"><strong>📍 ${r.origin || ''} → ${r.destination || ''}</strong></p>
              <p style="margin: 8px 0 0; color: #64748b;">📅 ${r.date || ''} kl ${r.departureTime || ''}</p>
            </div>
            <a href="https://vagvanner.se/ride/${rideId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Se resan →</a>
            <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Kontakta föraren direkt via VägVänner för att boka din plats.</p>
          </div>
        `;
        await sendEmailViaElastic({
          to: a.userEmail,
          subject: `🔔 Ny resa: ${r.origin || ''} → ${r.destination || ''}`,
          html: emailHtml,
          text: body + `\n\nSe resan: https://vagvanner.se/ride/${rideId}`
        }).catch(() => {});
      }
    });

    await Promise.all(tasks);
    return null;
  } catch (e) {
    console.warn('matchAlertsOnRideCreate warn', e.message);
    return null;
  }
});

/**
 * 🔔 Send FCM push when a new notification is created for a user (by email)
 * Looks up tokens in user_fcm_by_email/{email}.tokens and sends a basic push.
 */
exports.pushOnNotificationCreate = onDocCreated("notifications/{id}", async (event) => {
  try {
    const db = admin.firestore();
    const notif = event.data && event.data.data();
    console.log('🔔 New notification created:', { id: event.params.id, data: notif });
    
    if (!notif) {
      console.log('No notification data found');
      return null;
    }
    
    const email = (notif.userEmail || '').trim().toLowerCase();
    console.log('Looking for FCM tokens for email:', email);
    
    if (!email) {
      console.log('No email found in notification');
      return null;
    }

    const fcmDoc = await db.collection('user_fcm_by_email').doc(email).get();
    if (!fcmDoc.exists) {
      console.log('No FCM document found for email:', email);
      return null;
    }
    
    const fcmData = fcmDoc.data() || {};
    const tokensMap = fcmData.tokens || {};
    const tokens = Object.keys(tokensMap).filter(Boolean).slice(0, 100);
    console.log(`Found ${tokens.length} FCM tokens for ${email}`);
    
    if (!tokens.length) {
      console.log('No FCM tokens found');
      return null;
    }
    
    // معلومات إضافية عن نوع الجهاز
    const platform = fcmData.platform || 'unknown';
    const deviceType = fcmData.deviceType || 'unknown';
    console.log(`Sending to platform: ${platform}, device: ${deviceType}`);

    const message = {
      notification: {
        title: notif.title || 'VägVänner',
        body: notif.body || '',
      },
      data: {
        route: notif.route || '/',
        type: String(notif.type || 'info'),
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // For mobile apps
        notification_foreground: 'true'
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#2563eb',
          defaultSound: true,
          priority: 'high',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true
          }
        }
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          icon: '/favicon.png',
          badge: '/favicon.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
          tag: 'vagvanner-notification',
          renotify: true
        }
      }
    };

    const results = await Promise.all(tokens.map(async (t) => {
      try { 
        const result = await admin.messaging().send({ token: t, ...message });
        console.log('✅ Push sent successfully to token:', t.substring(0, 20) + '...');
        return { messageId: result, token: t };
      }
      catch (e) { 
        console.error('❌ Failed to send push to token:', t.substring(0, 20) + '...', e.message);
        return { error: e && e.message || 'send_failed', token: t }; 
      }
    }));

    // Cleanup invalid tokens
    const invalidTokens = [];
    let successCount = 0;
    results.forEach(r => {
      if (r && r.error) {
        invalidTokens.push(r.token);
      } else {
        successCount++;
      }
    });
    
    console.log(`Push notification results: ${successCount} success, ${invalidTokens.length} failed`);
    
    if (invalidTokens.length) {
      const updates = {};
      invalidTokens.forEach(t => { updates[`tokens.${t}`] = admin.firestore.FieldValue.delete(); });
      await fcmDoc.ref.set(updates, { merge: true });
      console.log(`Cleaned up ${invalidTokens.length} invalid tokens`);
    }

    return null;
  } catch (e) {
    console.error('pushOnNotificationCreate error:', e);
    return null;
  }
});

/**
 * 🔔 Push when a new seat booking is created: notify the other party (driver)
 * Triggers on bookings/{bookingId} creation with status=requested.
 * Adds a notifications document for the driver's email so existing push flow works.
 */
exports.pushOnBookingCreate = onDocCreated("bookings/{bookingId}", async (event) => {
  try {
    const db = admin.firestore();
    const booking = event.data && event.data.data();
    if (!booking) return null;
    // Only on initial request
    const status = String(booking.status || '').toLowerCase();
    if (status !== 'requested') return null;

    // Resolve driver email: prefer booking.driverEmail, else ride.driverEmail, else Auth email of counterpartyId
    let driverEmail = (booking.driverEmail || '').trim().toLowerCase();
    const rideId = booking.rideId;
    if (!driverEmail && rideId) {
      try {
        const rideSnap = await db.collection('rides').doc(rideId).get();
        const ride = rideSnap.exists ? rideSnap.data() : null;
        if (ride && ride.driverEmail) driverEmail = String(ride.driverEmail).trim().toLowerCase();
      } catch {}
    }
    if (!driverEmail && booking.counterpartyId) {
      try {
        const userRecord = await admin.auth().getUser(booking.counterpartyId);
        if (userRecord && userRecord.email) driverEmail = String(userRecord.email).trim().toLowerCase();
      } catch {}
    }
    if (!driverEmail) return null; // Nothing to notify

    // Compose notification
    const origin = booking.ride_origin || '';
    const destination = booking.ride_destination || '';
    const title = 'Ny bokningsförfrågan! 📬';
    const body = [
      'Du har fått en ny bokningsförfrågan!',
      '',
      `📍 ${origin} → ${destination}`,
      booking.ride_date && booking.ride_time ? `📅 ${booking.ride_date} kl. ${booking.ride_time}` : ''
    ].filter(Boolean).join('\n');

    // Deduplicate: skip if a very recent similar notification exists for this driver
    try {
      const recentSnap = await db.collection('notifications')
        .where('userEmail', '==', driverEmail)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      const now = Date.now();
      const dup = recentSnap.docs.some(d => {
        const n = d.data() || {};
        const age = now - (n.createdAt || 0);
        return age < 60 * 1000 && String(n.title||'').includes('Ny bokningsförfrågan');
      });
      if (dup) return null;
    } catch {}

    // Write notifications doc (existing pushOnNotificationCreate will send FCM)
    await db.collection('notifications').add({
      userEmail: driverEmail,
      userName: booking.driverName || '',
      title,
      body,
      type: 'info',
      createdAt: Date.now(),
      read: false,
      route: '/inbox?tab=bokningar',
    });
    return null;
  } catch (e) {
    console.error('pushOnBookingCreate error:', e);
    return null;
  }
});

/**
 * 🌐 SEO auto-index: publish static HTML page to GitHub when a new ride is created
 * Requires env vars: GITHUB_TOKEN, GITHUB_REPO (owner/repo), GITHUB_BRANCH (optional)
 */
exports.publishRideSeoOnCreate = onDocumentCreated("rides/{rideId}", async (event) => {
  try {
    const rideId = event.params.rideId;
    const r = event.data && event.data.data();
    if (!rideId || !r) return null;

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO; // e.g. "codecsverige/vagvanner"
    const branch = process.env.GITHUB_BRANCH || "main";
    if (!token || !repo) {
      console.log("publishRideSeoOnCreate: missing GITHUB_TOKEN or GITHUB_REPO, skipping");
      return null;
    }

    const baseUrl = "https://vagvanner.se";
    const origin = (r.origin || '').toString();
    const destination = (r.destination || '').toString();
    const date = (r.date || '').toString();
    const time = (r.departureTime || '').toString();
    const role = (r.role || '').toString();

    // Minimal static HTML (accessible, fast) with JSON-LD Event for rich results
    function buildHtml(pageUrl) {
      const startIso = `${date || ''}T${(time || '08:00')}:00`;
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        inLanguage: 'sv-SE',
        name: `${role === 'passagerare' ? 'Söker' : 'Erbjuder'} samåkning från ${origin} till ${destination}`,
        description: `Samåkning från ${origin} till ${destination}`,
        startDate: startIso,
        endDate: startIso,
        location: { '@type': 'Place', name: origin, address: origin },
        arrivalLocation: { '@type': 'Place', name: destination, address: destination },
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        organizer: { '@type': 'Person', name: r.driverName || r.passengerName || 'VägVänner användare', url: pageUrl },
        performer: { '@type': 'Organization', name: 'VägVänner', url: baseUrl },
        image: `${baseUrl}/og/vagvanner-og.jpg`,
        offers: { '@type': 'Offer', url: pageUrl, price: String(r.price || 0), priceCurrency: 'SEK', availability: 'https://schema.org/InStock', validFrom: startIso },
        url: pageUrl,
      };

      return `<!doctype html>\n<html lang="sv">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>${origin} → ${destination} | VägVänner</title>\n  <meta name="description" content="${role === 'passagerare' ? 'Söker' : 'Erbjuder'} samåkning ${origin} → ${destination} den ${date}${time ? ' kl ' + time : ''}." />\n  <link rel="canonical" href="${pageUrl}" />\n  <meta property="og:title" content="${origin} → ${destination} | VägVänner" />\n  <meta property="og:description" content="Samåkning ${origin} → ${destination}" />\n  <meta property="og:image" content="${baseUrl}/og/vagvanner-og.jpg" />\n  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n  <style>body{font-family:system-ui,Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px}</style>\n</head>\n<body>\n  <h1>${role === 'passagerare' ? '🔍 Söker samåkning' : '🚗 Erbjuder samåkning'}</h1>\n  <h2>${origin} → ${destination}</h2>\n  <p><strong>Datum:</strong> ${date || ''} ${time ? 'kl ' + time : ''}</p>\n  <p><a href="${baseUrl}/ride/${rideId}">Öppna i appen</a></p>\n  <hr/><p style="color:#666">SEO‑förhandsgranskning. För full funktionalitet, öppna appen.</p>\n</body>\n</html>`;
    }

    async function createOrUpdateFile(pathInRepo, content) {
      const api = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(pathInRepo)}`;
      const message = `SEO: publish ride ${rideId} (${origin} → ${destination})`;
      const body = {
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch,
      };
      // Check if file exists to include sha
      try {
        const headRes = await fetch(api + `?ref=${encodeURIComponent(branch)}`, { headers: { Authorization: `token ${token}`, 'User-Agent': 'VagVanner-SEOBot' } });
        if (headRes.ok) {
          const json = await headRes.json();
          if (json && json.sha) body.sha = json.sha;
        }
      } catch {}
      const res = await fetch(api, {
        method: 'PUT',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'VagVanner-SEOBot' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.warn('GitHub commit failed', res.status, txt);
      }
    }

    // Publish /ride/:id page
    const pageUrl = `${baseUrl}/ride/${encodeURIComponent(rideId)}`;
    const html = buildHtml(pageUrl);
    await createOrUpdateFile(`public/ride/${rideId}/index.html`, html);

    // For passenger ads, also publish /passenger/:id for clarity
    if (role === 'passagerare') {
      const pUrl = `${baseUrl}/passenger/${encodeURIComponent(rideId)}`;
      const pHtml = buildHtml(pUrl);
      await createOrUpdateFile(`public/passenger/${rideId}/index.html`, pHtml);
    }

    // Best‑effort: ping sitemap
    try {
      const sm = `${baseUrl}/sitemap.xml`;
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sm)}`).catch(()=>{});
      await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sm)}`).catch(()=>{});
    } catch {}

    return null;
  } catch (e) {
    console.warn('publishRideSeoOnCreate warn', e.message);
    return null;
  }
});

/**
 * 🔔 sendTestPush: HTTP function to send a test FCM push to an email-mapped token
 * Usage: POST { email: 'user@example.com', title?: '...', body?: '...' }
 */
exports.sendTestPush = onRequest({ cors: true, maxInstances: 2 }, async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Only POST allowed' });
      const { email, title, body } = req.body || {};
      const to = String(email || '').trim().toLowerCase();
      if (!to || !validator.isEmail(to)) return res.status(400).json({ ok: false, error: 'Valid email required' });

      const db = admin.firestore();
      const fcmDoc = await db.collection('user_fcm_by_email').doc(to).get();
      if (!fcmDoc.exists) return res.status(404).json({ ok: false, error: 'No tokens for this email' });
      const tokensMap = (fcmDoc.data() && fcmDoc.data().tokens) || {};
      const tokens = Object.keys(tokensMap).filter(Boolean).slice(0, 10);
      if (!tokens.length) return res.status(404).json({ ok: false, error: 'No active tokens' });

      const message = {
        notification: { title: title || 'VägVänner test', body: body || 'Detta är ett testmeddelande.' },
        data: { route: '/inbox', type: 'info' }
      };

      const results = await Promise.all(tokens.map(async (t) => {
        try { return await admin.messaging().send({ token: t, ...message }); }
        catch (e) { return { error: e && e.message || 'send_failed', token: t }; }
      }));
      return res.status(200).json({ ok: true, results });
    } catch (e) {
      console.error('sendTestPush error', e);
      return res.status(500).json({ ok: false, error: 'internal' });
    }
  });
});

/**
 * 🧹 eraseUserDataNow: User-initiated GDPR deletion/anonymization
 * - Verifies Firebase ID token
 * - Removes PII from Firestore (users, bookings, alerts, notifications, tokens)
 * - Deletes rides created by the user unless archived/paid
 * - Sanitizes corresponding archive docs to keep only PayPal data
 * - Deletes Firebase Auth user (server-side)
 */
exports.eraseUserDataNow = onRequest({ cors: true, maxInstances: 2 }, async (req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Only POST allowed' });
      const { userToken, reason } = req.body || {};
      if (!userToken) return res.status(400).json({ ok: false, error: 'Missing userToken' });

      const decoded = await admin.auth().verifyIdToken(userToken);
      const uid = decoded.uid;
      if (!uid) return res.status(401).json({ ok: false, error: 'Invalid token' });

      const db = admin.firestore();
      const userRecord = await admin.auth().getUser(uid).catch(() => null);
      const email = (userRecord && userRecord.email || '').trim().toLowerCase();
      const stats = { usersCleared: 0, bookingsAnonymized: 0, ridesDeleted: 0, alertsDeleted: 0, notifsDeleted: 0, contactUnlockDeleted: 0, tokensDeleted: 0, archiveSanitized: 0, authDeleted: false };

      // 1) Clear and delete users/{uid}
      try {
        const uref = db.collection('users').doc(uid);
        await uref.set({ displayName: '', phone: null, phoneVerified: false, sharePhone: false, shareEmail: false, email: null, updatedAt: Date.now(), erasedByUserAt: Date.now() }, { merge: true });
        await uref.delete();
        stats.usersCleared = 1;
      } catch {}

      // Helper to anonymize a booking doc
      async function anonymizeBookingDoc(docSnap) {
        const b = docSnap.data() || {};
        const updates = {
          passengerEmail: '',
          passengerPhone: '',
          driverEmail: '',
          driverPhone: '',
          unlockerEmail: '',
          unlockerName: '',
          userEmail: '',
          userName: '',
          messages: [],
          anonymized: true,
          anonymizedAt: Date.now(),
          anonymizedBy: 'user_request',
          anonymizedReason: reason || 'user_erasure_request',
        };
        await docSnap.ref.set(updates, { merge: true });

        // Sanitize archive doc for this ride if exists
        const rideId = b.rideId;
        if (rideId) {
          try {
            const aRef = db.collection('archive').doc(`ride_${rideId}`);
            const aSnap = await aRef.get();
            if (aSnap.exists) {
              const payload = aSnap.data() || {};
              const booking = payload.booking || {};
              const sanitized = {
                ...(payload || {}),
                booking: {
                  ...booking,
                  passengerEmail: '',
                  passengerPhone: '',
                  driverEmail: '',
                  driverPhone: '',
                  unlockerEmail: '',
                  unlockerName: '',
                  userEmail: '',
                  userName: '',
                  messages: [],
                  anonymized: true,
                  anonymizedAt: Date.now(),
                  anonymizedBy: 'user_request',
                  anonymizedReason: reason || 'user_erasure_request',
                }
              };
              await aRef.set(sanitized, { merge: true });
              stats.archiveSanitized++;
            }
          } catch {}
        }

        stats.bookingsAnonymized++;
      }

      // 2) Anonymize bookings where user is party (as userId or counterpartyId)
      for (const field of ['userId', 'counterpartyId']) {
        let lastDoc = null;
        while (true) {
          let q = db.collection('bookings').where(field, '==', uid).limit(200);
          if (lastDoc) q = q.startAfter(lastDoc);
          const snap = await q.get();
          if (snap.empty) break;
          for (const d of snap.docs) await anonymizeBookingDoc(d);
          lastDoc = snap.docs[snap.docs.length - 1];
          if (snap.size < 200) break;
        }
      }

      // 3) Delete alerts
      try {
        let last = null;
        while (true) {
          let q = db.collection('alerts').where('userId', '==', uid).limit(300);
          if (last) q = q.startAfter(last);
          const snap = await q.get();
          if (snap.empty) break;
          const batch = db.batch();
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
          stats.alertsDeleted += snap.size;
          last = snap.docs[snap.docs.length - 1];
          if (snap.size < 300) break;
        }
      } catch {}

      // 4) Delete notifications by email
      if (email) {
        try {
          let last = null;
          while (true) {
            let q = db.collection('notifications').where('userEmail', '==', email).limit(300);
            if (last) q = q.startAfter(last);
            const snap = await q.get();
            if (snap.empty) break;
            const batch = db.batch();
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            stats.notifsDeleted += snap.size;
            last = snap.docs[snap.docs.length - 1];
            if (snap.size < 300) break;
          }
        } catch {}
      }

      // 5) Delete contact_unlock where user involved
      try {
        for (const field of ['userId', 'counterpartyId']) {
          let last = null;
          while (true) {
            let q = db.collection('contact_unlock').where(field, '==', uid).limit(300);
            if (last) q = q.startAfter(last);
            const snap = await q.get();
            if (snap.empty) break;
            const batch = db.batch();
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            stats.contactUnlockDeleted += snap.size;
            last = snap.docs[snap.docs.length - 1];
            if (snap.size < 300) break;
          }
        }
      } catch {}

      // 6) Delete non-archived rides created by user, sanitize archived if present
      try {
        let last = null;
        while (true) {
          let q = db.collection('rides').where('userId', '==', uid).limit(200);
          if (last) q = q.startAfter(last);
          const snap = await q.get();
          if (snap.empty) break;
          for (const d of snap.docs) {
            const r = d.data() || {};
            if (r.archived === true) {
              // Already archived in 'archive' collection; ensure no PII remains in archive via bookings loop above
              continue;
            } else {
              await d.ref.delete();
              stats.ridesDeleted++;
            }
          }
          last = snap.docs[snap.docs.length - 1];
          if (snap.size < 200) break;
        }
      } catch {}

      // 7) Delete FCM email mapping
      if (email) {
        try {
          await db.collection('user_fcm_by_email').doc(email).delete();
          stats.tokensDeleted = 1;
        } catch {}
      }

      // 8) Delete Firebase Auth user (server-side)
      try {
        await admin.auth().deleteUser(uid);
        stats.authDeleted = true;
      } catch (e) {
        // Could fail if already deleted by client; ignore
      }

      // Minimal, non-PII audit log (for accountability per GDPR Art. 5(2))
      try {
        await db.collection('erasure_logs').add({
          type: 'user_request',
          uid,
          email: email ? 'hash:' + require('crypto').createHash('sha256').update(email).digest('hex').slice(0,16) : null,
          at: Date.now(),
          reason: reason || 'user_erasure_request',
          stats,
          version: 1
        });
      } catch {}

      return res.status(200).json({ ok: true, stats });
    } catch (e) {
      console.error('eraseUserDataNow error', e);
      return res.status(500).json({ ok: false, error: 'internal' });
    }
  });
});

/**
 * ⏱️ Scheduled job: capture PayPal after 48h if no refund requested, else void
 * Kör varje timme. Hämtar bookings med status=authorized och passerad reportWindowEndsAt.
 */
exports.settleAuthorizedBookings = onSchedule({schedule: "0 11 * * *", timeZone: "Europe/Stockholm"}, async () => {
  const db = admin.firestore();
  const now = Date.now();
  const batchSize = 50;
  const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

  try {
    const snap = await db.collection("bookings")
      .where("status", "==", "authorized")
      .where("reportWindowEndsAt", "<=", now)
      .limit(batchSize)
      .get();

    if (snap.empty) return null;

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const basic = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

    // Hämta PayPal access token en gång per körning
    let access_token = null;
    if (!DRY_RUN) {
      const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
      });
      const tokenJson = await tokenRes.json();
      access_token = tokenJson && tokenJson.access_token;
      if (!access_token) throw new Error("PayPal token error");
    }

    let stats = { scanned: 0, locked: 0, missingAuth: 0, voided: 0, captured: 0, errors: 0, skippedLocked: 0 };
    const tasks = snap.docs.map(async (docSnap) => {
      stats.scanned++;
      const b = docSnap.data();
      // Acquire per-booking lock (10 min TTL)
      const locked = await acquireSettlementLock(db, docSnap.ref, now);
      if (!locked) { stats.skippedLocked++; return; }
      stats.locked++;
      const authId = b?.paypal?.authorizationId;
      const wantsRefund = !!b.refundRequested || !!b.reported; // om rapport -> få ej capture

      if (!authId) {
        stats.missingAuth++;
        if (!DRY_RUN) {
          await archiveAndDeleteRideIfNeeded(db, { ...b, status: "voided" }, "saknar authId");
          await docSnap.ref.update({ status: "voided", voidedAt: now, note: "Missing authorizationId" });
          await appendSystemMessage(db, docSnap.ref, {
            type: "system",
            id: `system-void-missing-${now}`,
            createdAt: now,
            text: "Betalningsreservationen har släppts. (Saknar authId)",
          }, "voidMsgSentAt");
          await sendUserNotification(db, b, "Betalningsreservation släppt", "Din betalningsreservation kunde inte behandlas. Ingen debitering har skett.", "info");
        }
        return;
      }

      if (wantsRefund) {
        // låt authorization löpa ut -> pengarna går tillbaka
        if (!DRY_RUN) {
          await docSnap.ref.update({ status: "voided", voidedAt: now, note: "Refund requested or reported", paypal: { ...(b.paypal||{}), status: "VOIDED" } });
          await appendSystemMessage(db, docSnap.ref, {
            type: "system",
            id: `system-refund-${now}`,
            createdAt: now,
            text: "Återbetalning begärd. Din betalning är pausad och reservationen släpps.",
          }, "refundMsgSentAt");
          await sendUserNotification(db, b, "Återbetalning pågår", "Vi har mottagit din rapport/återbetalning. Beloppet reserveras inte längre.", "warning");
          await archiveAndDeleteRideIfNeeded(db, { ...b, status: "voided" }, "refund eller rapport");
        }
        stats.voided++;
        return;
      }

      // Capture
      let data = { id: 'SIMULATED', status: 'COMPLETED' };
      if (!DRY_RUN) {
        const capRes = await fetch(`https://api-m.paypal.com/v2/payments/authorizations/${authId}/capture`, {
          method: "POST",
          headers: { Authorization: `Bearer ${access_token}` },
          body: JSON.stringify({})
        });
        data = await capRes.json();
        if (!capRes.ok) {
          await docSnap.ref.update({ status: "error", settleError: data || true, errorAt: now });
          stats.errors++;
          return;
        }
      }

      if (!DRY_RUN) {
        await docSnap.ref.update({
          status: "captured",
          capturedAt: now,
          paypal: { ...(b.paypal || {}), status: "CAPTURED", captureResult: data },
        });

        await appendSystemMessage(db, docSnap.ref, {
          type: "system",
          id: `system-capture-${now}`,
          createdAt: now,
          text: "🎉 Tack för betalningen! Dina kontaktuppgifter är upplåsta. Du kan nu kontakta motparten fritt via telefon eller e‑post.",
        }, "captureMsgSentAt");

        await sendUserNotification(db, b, "🎉 Betalning genomförd!", "Din betalning har genomförts och kontakten är upplåst.", "success");
        await archiveAndDeleteRideIfNeeded(db, { ...b, status: "captured", paypal: { ...(b.paypal||{}), status: "CAPTURED", captureResult: data } }, "captured");
        await writeSettlementLog(db, { bookingId: docSnap.id, rideId: b.rideId || null, action: 'capture', ok: true, at: now });
      }
      stats.captured++;
    });

    await Promise.all(tasks);
    console.log('settleAuthorizedBookings stats:', JSON.stringify(stats));
    return null;
  } catch (e) {
    console.error("settleAuthorizedBookings error", e);
    return null;
  }
});

async function archiveAndDeleteRideIfNeeded(db, booking, reason) {
  try {
    const rideId = booking.rideId;
    if (!rideId) return;
    const rideRef = db.collection("rides").doc(rideId);
    const rideSnap = await rideRef.get();
    if (!rideSnap.exists) return;

    const ride = rideSnap.data();
    const rideDate = new Date(`${ride.date || ""}T${ride.departureTime || "00:00"}`);
    const isPast = Date.now() - rideDate.getTime() > 0;

    const archiveRef = db.collection("archive").doc(`ride_${rideId}`);
    await archiveRef.set({ rideId, ride, booking, reason, archivedAt: Date.now() }, {merge: true});

    if (booking.status === "captured" || booking.status === "voided" || isPast) {
      await rideRef.delete();
    }
  } catch (e) {
    console.warn("archiveAndDeleteRideIfNeeded warn", e.message);
  }
}

/**
 * Appends a single system message to a booking.messages array if not already sent.
 * Uses a per-type flag field on the booking document to prevent duplicates on retries.
 */
async function appendSystemMessage(db, bookingRef, messageObj, flagField) {
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) return;
      const data = snap.data() || {};
      const sys = data.sys || {};
      if (sys && sys[flagField]) return; // already appended
      const existing = Array.isArray(data.messages) ? data.messages : [];
      const next = existing.concat([messageObj]).slice(-300);
      tx.update(bookingRef, { messages: next, sys: { ...(sys || {}), [flagField]: Date.now() } });
    });
  } catch (e) {
    console.warn("appendSystemMessage warn", e.message);
  }
}

/**
 * Sends a simple notification document into notifications collection for the booking user
 */
async function sendUserNotification(db, booking, title, body, type = 'info') {
  try {
    const userEmail = booking.unlockerEmail || booking.passengerEmail || booking.userEmail || '';
    const userName = booking.unlockerName || booking.passengerName || booking.userName || '';
    if (!userEmail) return;
    await db.collection('notifications').add({ userEmail, userName, title, body, type, createdAt: Date.now(), read: false });
  } catch (e) {
    console.warn('sendUserNotification warn', e.message);
  }
}

/**
 * Acquire a short-lived per-booking lock to prevent concurrent settlements.
 */
async function acquireSettlementLock(db, bookingRef, nowMs) {
  try {
    const TTL = 10 * 60 * 1000;
    let ok = false;
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) return;
      const data = snap.data() || {};
      if (data.status !== 'authorized') return; // already processed/changed
      const sys = data.sys || {};
      const prev = sys.settlementLockAt || 0;
      if (prev && (nowMs - prev) < TTL) return; // lock active
      tx.update(bookingRef, { sys: { ...(sys || {}), settlementLockAt: nowMs } });
      ok = true;
    });
    return ok;
  } catch (e) {
    console.warn('acquireSettlementLock warn', e.message);
    return false;
  }
}

/**
 * Compact audit log for settlement operations.
 */
async function writeSettlementLog(db, payload) {
  try {
    const ref = db.collection('settlements_log').doc();
    await ref.set({ ...payload, createdAt: Date.now() });
  } catch (e) {
    console.warn('writeSettlementLog warn', e.message);
  }
}

/**
 * ⏳ Cleanup job: archive and delete expired rides that are not paid/authorized
 */
exports.cleanupExpiredRides = onSchedule({ schedule: "10 11 * * *", timeZone: "Europe/Stockholm" }, async () => {
  const db = admin.firestore();
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayKey = `${yyyy}-${mm}-${dd}`;

  try {
    // Fetch candidate rides (today or earlier) that are not archived
    // Avoid composite index requirement: only filter on 'date' and post-filter by 'archived'
    const ridesSnap = await db.collection('rides')
      .where('date', '<=', todayKey)
      .limit(500)
      .get();

    if (ridesSnap.empty) return null;

    const tasks = ridesSnap.docs.map(async (rideDoc) => {
      const ride = rideDoc.data();
      // Compute precise timestamp
      const ms = Date.parse(`${ride.date || ''}T${ride.departureTime || '00:00'}:00.000`);
      if (!Number.isFinite(ms) || ms > now) return; // not expired yet

      // Always mark expired when past
      await rideDoc.ref.set({ expired: true, expiredAt: now }, { merge: true });

      const age = now - ms;
      if (age < ONE_WEEK_MS) return; // keep visible for 7 days

      // After 7 days from ride time: delete or archive (keep PayPal only)
      const bSnap = await db.collection('bookings')
        .where('rideId', '==', rideDoc.id)
        .limit(50)
        .get();

      const hasPayment = bSnap.docs.some(d => {
        const s = (d.data().status || '').toLowerCase();
        return s === 'authorized' || s === 'captured' || !!(d.data().paypal && (d.data().paypal.authorizationId || d.data().paypal.status));
      });

      if (hasPayment) {
        try {
          // Keep PayPal-only archive snapshot
          const paypals = bSnap.docs.map(d => ({ id: d.id, paypal: d.data().paypal || null, status: d.data().status || '' }));
          await db.collection('archive').doc(`ride_${rideDoc.id}`).set({
            rideId: rideDoc.id,
            ride: { origin: ride.origin || '', destination: ride.destination || '', date: ride.date || '', departureTime: ride.departureTime || '', role: ride.role || '' },
            paypals,
            reason: 'ride_expired_7d',
            archivedAt: now
          }, { merge: true });
        } catch {}
      }

      await rideDoc.ref.delete();
    });

    await Promise.all(tasks);
    return null;
  } catch (e) {
    console.error('cleanupExpiredRides error', e);
    return null;
  }
});

/**
 * 🕑 Cleanup contact exposure: after 48h from unlock, remove PII so neither party sees contacts.
 */
exports.cleanupContactExposure = onSchedule({ schedule: '20 11 * * *', timeZone: 'Europe/Stockholm' }, async () => {
  const db = admin.firestore();
  const now = Date.now();
  const H48 = 48 * 60 * 60 * 1000;
  try {
    // Prefer docs with computed window
    const snap = await db.collection('bookings')
      .where('reportWindowEndsAt', '<=', now)
      .limit(300)
      .get();

    const tasks = snap.docs.map(async (docSnap) => {
      const b = docSnap.data() || {};
      const sys = b.sys || {};
      if (sys.contactClearedAt) return;
      const opened = (typeof b.contactUnlockedAt === 'number' ? b.contactUnlockedAt : (b.contactUnlockedAt && b.contactUnlockedAt.toMillis ? b.contactUnlockedAt.toMillis() : 0))
        || (typeof b.paidAt === 'number' ? b.paidAt : (b.paidAt && b.paidAt.toMillis ? b.paidAt.toMillis() : 0))
        || (typeof b.createdAt === 'number' ? b.createdAt : 0);
      const ends = b.reportWindowEndsAt || (opened ? (opened + H48) : 0);
      if (!ends || now < ends) return;
      const updates = {
        passengerEmail: '',
        passengerPhone: '',
        driverEmail: '',
        driverPhone: '',
        driverPhoneShared: '',
        driverEmailShared: '',
        sys: { ...(sys || {}), contactClearedAt: now }
      };
      await docSnap.ref.set(updates, { merge: true });
    });

    await Promise.all(tasks);
    return null;
  } catch (e) {
    console.warn('cleanupContactExposure warn', e.message);
    return null;
  }
});

/**
 * 📆 Daily data maintenance: simple and compliant
 * - Delete stale notifications (>180 days)
 * - Delete/disable old alerts (>365 days)
 * - Purge rides whose ttlDeleteAt has passed
 * - Anonymize old bookings (>=180 days) while preserving PayPal data
 */
async function runDataMaintenanceInternal() {
  const db = admin.firestore();
  const now = Date.now();
  const DAYS = (n) => n * 24 * 60 * 60 * 1000;
  const OLD_NOTIF = now - DAYS(180);
  const OLD_ALERTS = now - DAYS(365);
  const OLD_BOOKINGS = now - DAYS(180);
  const OLD_ERASURE_LOGS = now - DAYS(730); // 24 months
  const ARCHIVE_RETENTION = now - (365 * 7 * 24 * 60 * 60 * 1000); // ~7 years

  const stats = { notificationsDeleted: 0, alertsDeleted: 0, ridesPurged: 0, bookingsAnonymized: 0 };

  // Helper: paginated delete
  async function deleteWhere(coll, field, op, value, limitN = 200) {
    while (true) {
      const snap = await db.collection(coll).where(field, op, value).limit(limitN).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      if (coll === 'notifications') stats.notificationsDeleted += snap.size;
      if (coll === 'alerts') stats.alertsDeleted += snap.size;
    }
  }

  // 1) Notifications older than 180 days
  try { await deleteWhere('notifications', 'createdAt', '<', OLD_NOTIF); } catch (e) { console.warn('maintenance: notifications', e.message); }

  // 2) Alerts older than 365 days
  try { await deleteWhere('alerts', 'createdAtTs', '<', new admin.firestore.Timestamp(Math.floor(OLD_ALERTS/1000), 0)); } catch (e) { console.warn('maintenance: alerts by createdAtTs', e.message); }
  // Also delete inactive alerts older than 180 days by createdAt fallback
  try { await deleteWhere('alerts', 'active', '==', false); } catch (e) { console.warn('maintenance: inactive alerts', e.message); }

  // 3) Purge rides with ttlDeleteAt <= now
  try {
    while (true) {
      const snap = await db.collection('rides').where('ttlDeleteAt', '<=', now).limit(200).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      stats.ridesPurged += snap.size;
    }
  } catch (e) { console.warn('maintenance: rides ttl', e.message); }

  // 4) Anonymize old bookings but preserve PayPal capture data (GDPR: data minimization & retention)
  try {
    while (true) {
      const snap = await db.collection('bookings')
        .where('status', 'in', ['captured', 'voided'])
        .where('createdAt', '<=', OLD_BOOKINGS)
        .limit(100)
        .get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach((docSnap) => {
        const b = docSnap.data() || {};
        if (b.anonymized) return;
        const del = admin.firestore.FieldValue.delete();
        // remove PII and messages; keep ride basics and PayPal
        const updates = {
          passengerEmail: '',
          passengerPhone: '',
          driverEmail: '',
          driverPhone: '',
          unlockerEmail: '',
          unlockerName: '',
          messages: [],
          anonymized: true,
          anonymizedAt: now,
          anonymizedBy: 'maintenance',
          anonymizedReason: 'retention_180d',
        };
        batch.update(docSnap.ref, updates);
        stats.bookingsAnonymized++;
      });
      await batch.commit();
    }
  } catch (e) { console.warn('maintenance: bookings anonymize', e.message); }

  // 4b) Purge old archive entries beyond legal retention (keep for 7 years)
  try {
    while (true) {
      const snap = await db.collection('archive').where('archivedAt', '<=', ARCHIVE_RETENTION).limit(200).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (e) { console.warn('maintenance: archive purge', e.message); }

  // 4c) Purge old erasure logs (accountability without indefinite storage)
  try {
    while (true) {
      const snap = await db.collection('erasure_logs').where('at', '<=', OLD_ERASURE_LOGS).limit(200).get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (e) { console.warn('maintenance: erasure_logs', e.message); }

  // 5) Write compact maintenance log (no PII)
  try {
    await db.collection('erasure_logs').add({
      type: 'maintenance',
      at: now,
      stats,
      version: 1
    });
  } catch {}

  return stats;
}

// Scheduled daily at 03:30 local time
exports.dailyDataMaintenance = onSchedule({ schedule: '40 11 * * *', timeZone: 'Europe/Stockholm' }, async () => {
  try {
    const stats = await runDataMaintenanceInternal();
    console.log('dailyDataMaintenance:', JSON.stringify(stats));
    return null;
  } catch (e) {
    console.error('dailyDataMaintenance error', e);
    return null;
  }
});

// Manual trigger via HTTP with a shared secret
exports.runMaintenanceNow = onRequest({ cors: true, maxInstances: 1 }, async (req, res) => {
  cors(req, res, async () => {
    try {
      if (!['GET','POST'].includes(req.method)) return res.status(405).json({ ok: false, error: 'Only GET/POST allowed' });
      const key = (req.query && req.query.key) || (req.body && req.body.key);
      const secret = process.env.MAINTENANCE_SECRET;
      if (!secret) return res.status(500).json({ ok: false, error: 'Server misconfigured' });
      if (key !== secret) return res.status(403).json({ ok: false, error: 'Forbidden' });
      const stats = await runDataMaintenanceInternal();
      // Also backfill rides missing departureAt (one-off per call, capped)
      try {
        const db = admin.firestore();
        const snap = await db.collection('rides').where('departureAt', '==', null).limit(200).get();
        const batch = db.batch();
        snap.docs.forEach((d) => {
          const r = d.data() || {};
          try {
            if (!r.date) return;
            const dt = new Date(`${r.date}T${(r.departureTime || '00:00')}:00.000Z`);
            if (isNaN(dt.getTime())) return;
            batch.set(d.ref, { departureAt: admin.firestore.Timestamp.fromDate(dt) }, { merge: true });
          } catch {}
        });
        if (snap.size) await batch.commit();
      } catch (e) { console.warn('backfill departureAt warn', e.message); }
      return res.status(200).json({ ok: true, stats });
    } catch (e) {
      console.error('runMaintenanceNow error', e);
      return res.status(500).json({ ok: false, error: 'internal' });
    }
  });
});

/**
 * 🌐 OSM Geocoding proxy (Nominatim) to avoid CORS on the client
 * Usage: GET /osmGeocode?q=Västerås&limit=8
 */
exports.osmGeocode = onRequest({ cors: true, maxInstances: 5 }, async (req, res) => {
  cors(req, res, async () => {
    try {
      await rateLimiter.consume(req.ip);
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Only GET allowed' });
      }
      const q = (req.query.q || req.query.query || '').toString().trim();
      const limit = Math.min(parseInt(req.query.limit, 10) || 8, 15);
      if (!q) return res.status(400).json({ error: 'missing q' });

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=${limit}&accept-language=sv&addressdetails=1&countrycodes=se`;
      const r = await fetch(url, {
        headers: {
          // Nominatim requires a valid identifying User-Agent
          'User-Agent': 'VagVanner/1.0 (https://vagvanner.se/contact)'
        }
      });
      const data = await r.json();
      return res.status(200).json(data);
    } catch (e) {
      console.error('osmGeocode error', e);
      return res.status(500).json({ error: 'geocode_failed' });
    }
  });
});

// Helper functions
function createEmailTemplate(data, bookingType) {
  const subject = bookingType === "contact_unlock" ? 
    "Kontaktuppgifter upplåsta - VägVänner" : 
    "Ny bokningsförfrågan - VägVänner";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">${subject}</h2>
      <p>Hej ${data.to_name},</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Resedetaljer:</h3>
        <p><strong>Från:</strong> ${data.ride_origin}</p>
        <p><strong>Till:</strong> ${data.ride_destination}</p>
        <p><strong>Datum:</strong> ${data.ride_date}</p>
        <p><strong>Tid:</strong> ${data.ride_time}</p>
      </div>

      ${data.from_name ? `<p><strong>Kontaktperson:</strong> ${data.from_name}</p>` : ""}
      ${data.passenger_phone ? `<p><strong>Telefon:</strong> ${data.passenger_phone}</p>` : ""}
      ${data.passenger_comment ? `<p><strong>Meddelande:</strong> ${data.passenger_comment}</p>` : ""}

      <hr style="margin: 30px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        Detta meddelande skickades säkert via VägVänner's server.
      </p>
    </div>
  `;

  return {
    subject,
    html: htmlContent,
    text: `${subject}\n\nHej ${data.to_name},\n\nResedetaljer:\nFrån: ${data.ride_origin}\nTill: ${data.ride_destination}\nDatum: ${data.ride_date}\nTid: ${data.ride_time}`
  };
}

function validateBookingData(data, userId) {
  const errors = [];
  const sanitized = {};

  // Validate user ID match
  if (data.userId !== userId) {
    errors.push("User ID mismatch");
  }

  // Validate required fields
  if (!data.rideId || !validator.isAlphanumeric(data.rideId)) {
    errors.push("Valid ride ID required");
  } else {
    sanitized.rideId = data.rideId;
  }

  if (!data.bookingType || !["seat_booking", "contact_unlock"].includes(data.bookingType)) {
    errors.push("Valid booking type required");
  } else {
    sanitized.bookingType = data.bookingType;
  }

  // Validate seats
  if (data.seats && (!Number.isInteger(data.seats) || data.seats < 1 || data.seats > 8)) {
    errors.push("Seats must be between 1-8");
  } else if (data.seats) {
    sanitized.seats = data.seats;
  }

  // Validate price
  if (data.price !== undefined && (!Number.isFinite(data.price) || data.price < 0 || data.price > 5000)) {
    errors.push("Price must be between 0-5000");
  } else if (data.price !== undefined) {
    sanitized.price = data.price;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: sanitized
  };
}

async function performSecurityChecks(bookingData, userId) {
  try {
    // Check if user exists and is verified
    const userRecord = await admin.auth().getUser(userId);
    if (!userRecord.emailVerified) {
      return {passed: false, reason: "Email not verified"};
    }

    // Check for rate limiting on bookings
    const recentBookings = await admin.firestore()
      .collection("bookings")
      .where("userId", "==", userId)
      .where("createdAt", ">", Date.now() - 60000) // Last minute
      .get();

    if (recentBookings.size > 3) {
      return {passed: false, reason: "Too many recent bookings"};
    }

    return {passed: true};
  } catch (error) {
    console.error("Security check error:", error);
    return {passed: false, reason: "Security check failed"};
  }
}
