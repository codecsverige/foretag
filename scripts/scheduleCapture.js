// scripts/scheduleCapture.js
import fetch from "node-fetch";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 1. إعداد Firebase Admin باستخدام متغير البيئة (مع حراسة)
let db = null;
let FIREBASE_READY = false;
try {
  const rawSa = process.env.FIREBASE_ADMIN_SA_JSON;
  if (!rawSa) {
    console.warn("[scheduleCapture] FIREBASE_ADMIN_SA_JSON saknas. Kör DRY_RUN och avslutar utan fel.");
  } else {
    const serviceAccount = JSON.parse(rawSa);
    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }
    db = getFirestore();
    FIREBASE_READY = true;
  }
} catch (e) {
  console.error("[scheduleCapture] Fel vid läsning av FIREBASE_ADMIN_SA_JSON:", e && e.stack || e);
}

// 2. إعداد متغيرات PayPal من secrets
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.paypal.com";
const HAS_PAYPAL_CREDS = !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);

// 3. إرجاع access_token من PayPal (مع كاش مؤقت)
let _paypalToken = null;
let _paypalTokenExp = 0;
async function getPayPalToken() {
  if (!HAS_PAYPAL_CREDS) throw new Error("PAYPAL creds saknas");
  if (_paypalToken && Date.now() < _paypalTokenExp) return _paypalToken;
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("PayPal token error");
  const data = await res.json();
  _paypalToken = data.access_token;
  _paypalTokenExp = Date.now() + Math.max(0, (data.expires_in || 3000) - 60) * 1000; // minus 60s safety
  return _paypalToken;
}

const H48 = 48 * 60 * 60 * 1000; // 48 hours window

// 4. تنفيذ capture للمدفوعات
async function captureBooking(authorizationId) {
  const token = await getPayPalToken();
  const res = await fetch(
    `${PAYPAL_API_BASE}/v2/payments/authorizations/${authorizationId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error("Failed to capture: " + (data && data.message));
  return data;
}

// 5. إرسال إشعار للطرفين في notifications
async function sendNotification(userEmail, userName, title, body) {
  if (!FIREBASE_READY) return;
  await db.collection("notifications").add({
    userEmail, userName, title, body, createdAt: Date.now(), read: false,
  });
}

function toMs(ts) {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (ts.toMillis) return ts.toMillis();
  return 0;
}

// Timezone-safe helpers for Europe/Stockholm without external deps
function getNowTz(date = new Date()) {
  const tz = "Europe/Stockholm";
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); // YYYY-MM-DD
  const timeStr = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' }).format(date); // HH:MM
  return { tzDate: dateStr, tzTime: timeStr };
}

function isRideExpired(ride) {
  const { tzDate, tzTime } = getNowTz();
  const d = String(ride.date || "").slice(0, 10);
  const t = String(ride.departureTime || "00:00").slice(0, 5);
  if (!d) return false;
  if (d < tzDate) return true;
  if (d > tzDate) return false;
  // same day
  return t <= tzTime;
}

async function notifyRefundAck(booking) {
  try {
    const email = booking.unlockerEmail || booking.passengerEmail || "";
    if (!email) return;
    if (!FIREBASE_READY) return;
    await db.collection("notifications").add({
      userEmail: email,
      userName: booking.unlockerName || booking.passengerName || "",
      title: "Återbetalning begärd",
      body: "Din begäran om återbetalning har mottagits. Beloppet kommer inte att debiteras under granskningen.",
      createdAt: Date.now(),
      read: false,
      type: "info",
    });
  } catch {}
}

async function sendCaptureSuccessNotification(booking) {
  try {
    const email = booking.unlockerEmail || booking.passengerEmail || "";
    const name = booking.unlockerName || booking.passengerName || "";
    const amount = booking.paypal?.amount || 10;
    
    if (!email) return;
    
    if (!FIREBASE_READY) return;
    await db.collection("notifications").add({
      userEmail: email,
      userName: name,
      title: "🎉 Betalning genomförd!",
      body: `Din betalning på ${amount} kr har genomförts framgångsrikt!\n\n` +
            `✅ Kontaktuppgifter har delats\n` +
            `💰 Transaktionen är nu slutförd\n` +
            `📱 Tack för att du använder VägVänner!\n\n` +
            `💡 Hjälp oss växa - berätta för dina vänner om VägVänner och spara pengar tillsammans på resor!`,
      createdAt: Date.now(),
      read: false,
      type: "success",
    });
  } catch (error) {
    console.error("Error sending capture success notification:", error);
  }
}

// 6. الكود الرئيسي: سياسة 48h + capture + أرشفة + رسائل سيستم + تنظيف الرحلات منتهية غير مدفوعة
async function main() {
  const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true' || !FIREBASE_READY || !HAS_PAYPAL_CREDS;
  if (DRY_RUN) {
    console.warn("[scheduleCapture] DRY_RUN-läge: ", {
      FIREBASE_READY,
      HAS_PAYPAL_CREDS
    });
  }
  const nowMs = Date.now();
  // 6.1 معالجات contact_unlock فقط، وحالة authorized
  if (!FIREBASE_READY) {
    console.warn("[scheduleCapture] Skipping Firestore operations (FIREBASE not configured). Exiting ok.");
    return;
  }

  const allBookings = await db
    .collection("bookings")
    .where("bookingType", "==", "contact_unlock")
    .where("status", "==", "authorized")
    .get();

  let capturedCount = 0;

  for (const doc of allBookings.docs) {
    const booking = doc.data();
    const opened = toMs(booking.contactUnlockedAt) || toMs(booking.paidAt) || toMs(booking.createdAt);
    const defaultWindowEnds = opened + H48;
    const ends = booking.reportWindowEndsAt ? toMs(booking.reportWindowEndsAt) : defaultWindowEnds;

    // Persist window end once so other parts of the app can query it reliably
    if (!booking.reportWindowEndsAt) {
      await doc.ref.set({ reportWindowEndsAt: defaultWindowEnds }, { merge: true });
    }

    // 6.1 إذا تم الإبلاغ خلال 48h → لا capture، أرسل تأكيد مرة واحدة
    if (booking.reported === true && nowMs <= ends) {
      if (!booking.refundAckSentAt) {
        await notifyRefundAck(booking);
        await doc.ref.update({ refundAckSentAt: Date.now() });
      }
      continue;
    }

    // 6.2 إذا انتهت 48h بدون تقرير → capture + أرشفة الرحلة
    if (nowMs > ends && booking.reported !== true) {
      const authId = booking?.paypal?.authorizationId;
      if (!authId) continue;
      try {
        const capture = DRY_RUN ? { id: 'SIMULATED', status: 'COMPLETED' } : await captureBooking(authId);

        // تحديث الحجز: حفظ كامل بيانات PayPal، وتحديث الحالة
        const now = Date.now();
        const existingMsgs = Array.isArray(booking.messages) ? booking.messages : [];
        await doc.ref.update({
          status: "captured",
          capturedAt: now,
          paypal: {
            ...(booking.paypal || {}),
            status: "CAPTURED",
            captureResult: capture,
          },
          messages: existingMsgs.concat([{ type: 'system', id: `system-capture-${now}`, createdAt: now, text: '🎉 Betalning genomförd! Kontakt uppgifter är upplåsta.' }]).slice(-300),
          sys: { ...(booking.sys || {}), captureMsgSentAt: now }
        });

        // أرشفة الإعلان وإزالته من العرض العام
        if (booking.rideId) {
          const rideRef = db.collection("rides").doc(booking.rideId);
          await rideRef.set({ archived: true, archivedAt: Date.now(), expired: true }, { merge: true });
        }

        // إرسال إشعار نجاح الدفع للمشتري
        await sendCaptureSuccessNotification(booking);

        capturedCount++;
        console.log("Captured booking:", doc.id);
      } catch (e) {
        console.error("Fel vid capture:", doc.id, e.message);
        await doc.ref.set({ captureError: String(e.message || e) }, { merge: true });
      }
    }
  }
  console.log(`✅ Färdigt. Totalt: ${capturedCount} capture.`);

  // 6.3 حذف الرحلات المنتهية غير المدفوعة (مع مسار احتياطي بدون فهارس مركبة)
  await cleanupExpiredRidesSafe();
}

async function cleanupExpiredRidesSafe() {
  if (!FIREBASE_READY) return;
  const now = Date.now();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayKey = `${yyyy}-${mm}-${dd}`;

  try {
    const snap = await db.collection('rides')
      .where('date', '<=', todayKey)
      .limit(500)
      .get();
    await processRidesSnapshot(snap, now);
  } catch (e) {
    if (String(e && e.message).includes('FAILED_PRECONDITION')) {
      // fallback: جلب مجموعة محدودة بدون شروط ثم فلترة محلياً
      const snap = await db.collection('rides')
        .limit(500)
        .get();
      await processRidesSnapshot(snap, now, { localFilterByDate: todayKey });
    } else {
      console.error('cleanupExpiredRidesSafe error', e);
    }
  }
}

async function processRidesSnapshot(snap, now, opts = {}) {
  const todayKey = opts.localFilterByDate || null;
  let scanned = 0, expired = 0, keptPaid = 0, deleted = 0;
  for (const r of snap.docs) {
    scanned++;
    const ride = r.data();
    if (ride.archived === true) continue;
    if (todayKey && (ride.date || '') > todayKey) continue;

    if (!isRideExpired(ride)) continue;
    expired++;

    // check paid/authorized bookings exist
    const paid = await db.collection('bookings')
      .where('rideId', '==', r.id)
      .where('status', 'in', ['authorized', 'captured'])
      .limit(1)
      .get();
    if (!paid.empty) {
      await r.ref.set({ expired: true, archived: !!ride.archived, expiredAt: now }, { merge: true });
      keptPaid++;
      continue;
    }
    // Unpaid: delete directly without archiving snapshot (per new requirement)
    await r.ref.delete();
    deleted++;
  }
  console.log(`Cleanup stats: scanned=${scanned}, expired=${expired}, keptPaid=${keptPaid}, deleted=${deleted}`);
}

main().catch(e => {
  console.error("[scheduleCapture] Uncaught error:\n", e && e.stack || e);
  // Fail only if base configuration exists; otherwise, treat as non-fatal
  if (FIREBASE_READY || HAS_PAYPAL_CREDS) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
