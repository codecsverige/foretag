/* ═══════════════════════════════════════════════════════════
   🎯 محسن عرض الحجوزات - يحسن UX بدون تغيير البنية
   🛡️ آمن 100% - يضيف نصوص توضيحية ومعلومات مفيدة فقط
   ═══════════════════════════════════════════════════════════ */

import React from 'react';

// 🎨 مكون لإظهار حالة الحجز بوضوح
export const BookingStatusExplainer = ({ booking, isNew = false }) => {
  const status = (booking.status || "").toLowerCase();
  const unlocked = booking.contactUnlockedAt || booking.paidAt;
  const cancelled = status.startsWith("cancelled");
  const isFree = booking.price === 0 || booking.price === "0";

  // 🆕 رسالة للحجوزات الجديدة
  if (isNew && !cancelled) {
    return (
      <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-r-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg animate-bounce">🎉</span>
          <div>
            <p className="text-sm font-bold text-green-800">Ny bokning inkom!</p>
            <p className="text-xs text-green-600">
              {booking.passengerName || 'En resenär'} vill åka med dig
              {isFree ? '' : ` för ${booking.price || 'okänt pris'} kr`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// 💰 مكون لإظهار معلومات السعر والدفع
export const PriceExplainer = ({ booking }) => {
  const isFree = booking.price === 0 || booking.price === "0";
  const unlocked = booking.contactUnlockedAt || booking.paidAt;
  const cancelled = (booking.status || "").toLowerCase().startsWith("cancelled");

  if (cancelled) return null;

  // NEW: Communication platform - no payment system
  return (
    <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">💬</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-700">Kommunikation</p>
          <p className="text-xs text-blue-600">
            Chatta med resenären - dela kontaktuppgifter när ni känner er bekväma
          </p>
        </div>
      </div>
    </div>
  );
  
  /* HIDDEN: Old payment-based display - frozen for rollback
  return (
    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <div>
            {isFree ? (
              <>
                <p className="text-sm font-bold text-green-600">GRATIS RESA!</p>
                <p className="text-xs text-gray-600">Ingen betalning krävs</p>
              </>
            ) : unlocked ? (
              <>
                <p className="text-sm font-bold text-green-600">Betald & Upplåst</p>
                <p className="text-xs text-gray-600">Kontaktinfo är tillgänglig</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-orange-600">Väntar på betalning</p>
                <p className="text-xs text-gray-600">
                  När resenären betalar {booking.commission || 20} kr visas telefonnummer och e-post här
                </p>
              </>
            )}
          </div>
        </div>
        
        {!unlocked && !isFree && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Provision:</p>
            <p className="text-sm font-bold text-orange-600">{booking.commission || 20} kr</p>
          </div>
        )}
      </div>
    </div>
  );
  */
};

// 👤 مكون لإظهار معلومات الراكب بوضوح
export const PassengerInfoExplainer = ({ booking }) => {
  const unlocked = booking.contactUnlockedAt || booking.paidAt;
  const seats = booking.seats || 1;

  return (
    <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-start gap-2">
        <span className="text-lg mt-0.5">👤</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-gray-800">
              {booking.passengerName || booking.passengerEmail || 'Okänd resenär'}
            </p>
            <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-full">
              <span className="text-xs">💺</span>
              <span className="text-xs font-bold">{seats} plats{seats > 1 ? 'er' : ''}</span>
            </div>
          </div>
          
          {/* NEW: Communication message */}
          <div className="mt-1">
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <span>💬</span>
              <span>Använd chatten för att kommunicera - dela kontaktuppgifter när ni vill</span>
            </p>
          </div>
          
          {/* HIDDEN: Old payment-based contact display - frozen for rollback */}
          {false && unlocked ? (
            <div className="space-y-1">
              <p className="text-xs text-green-600 font-medium">✅ Kontaktuppgifter upplåsta:</p>
              {booking.passengerEmail && (
                <p className="text-xs text-blue-600">📧 {booking.passengerEmail}</p>
              )}
              {booking.passengerPhone && (
                <p className="text-xs text-blue-600">📞 {booking.passengerPhone}</p>
              )}
            </div>
          ) : false && (
            <p className="text-xs text-orange-600">
              🔒 Kontaktuppgifter låsta - väntar på betalning från resenären
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// 🔄 مكون لإظهار الإجراءات المطلوبة
export const ActionExplainer = ({ booking }) => {
  const unlocked = booking.contactUnlockedAt || booking.paidAt;
  const cancelled = (booking.status || "").toLowerCase().startsWith("cancelled");
  const isFree = booking.price === 0 || booking.price === "0";

  if (cancelled) {
    return (
      <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">❌</span>
          <div>
            <p className="text-sm font-bold text-red-600">Bokning avbruten</p>
            <p className="text-xs text-red-500">Denna bokning är inte längre aktiv</p>
          </div>
        </div>
      </div>
    );
  }

  if (unlocked) {
    return (
      <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <div>
            <p className="text-sm font-bold text-green-600">Redo att resa!</p>
            <p className="text-xs text-green-500">
              Ring eller maila resenären för att bestämma tid och träffpunkt
            </p>
          </div>
        </div>
      </div>
    );
  }

  // NEW: Communication message (always show)
  return (
    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">💬</span>
        <div>
          <p className="text-sm font-bold text-blue-600">Kommunikation</p>
          <p className="text-xs text-blue-500">
            Chatta med resenären nedan - dela kontaktuppgifter när ni känner er bekväma
          </p>
        </div>
      </div>
    </div>
  );
  
  /* HIDDEN: Old payment messages - frozen for rollback
  if (isFree) {
    return (
      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎁</span>
          <div>
            <p className="text-sm font-bold text-blue-600">Gratis resa - Ingen avgift</p>
            <p className="text-xs text-blue-500">
              Ring eller maila resenären direkt - ingen betalning behövs
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">⏳</span>
        <div>
          <p className="text-sm font-bold text-yellow-600">Väntar på resenären</p>
          <p className="text-xs text-yellow-500">
            Efter betalning ({booking.commission || 20} kr) ser du resenärens telefon och e-post
          </p>
        </div>
      </div>
    </div>
  );
  */
};

// 📋 مكون لإظهار ملخص الحجوزات
export const BookingsSummary = ({ bookings = [] }) => {
  const total = bookings.length;
  const active = bookings.filter(b => !b.status?.startsWith("cancelled")).length;
  const unlocked = bookings.filter(b => b.contactUnlockedAt || b.paidAt).length;
  const newBookings = bookings.filter(b => 
    b.createdAt > Date.now() - (24 * 60 * 60 * 1000) && 
    !b.status?.startsWith("cancelled")
  ).length;
  const freeBookings = bookings.filter(b => 
    b.price === 0 || b.price === "0"
  ).length;

  if (total === 0) {
    return (
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <span className="text-2xl mb-2 block">📋</span>
        <p className="text-sm font-bold text-gray-600 mb-1">Inga bokningar ännu</p>
        <p className="text-xs text-gray-500">
          När någon bokar din resa kommer de att visas här
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📊</span>
        <p className="text-sm font-bold text-blue-800">Bokningsöversikt</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="text-center p-2 bg-white rounded border">
          <p className="font-bold text-gray-800">{total}</p>
          <p className="text-gray-600">Totalt</p>
        </div>
        <div className="text-center p-2 bg-white rounded border">
          <p className="font-bold text-green-600">{active}</p>
          <p className="text-gray-600">Aktiva</p>
        </div>
        <div className="text-center p-2 bg-white rounded border">
          <p className="font-bold text-blue-600">{unlocked}</p>
          <p className="text-gray-600">Upplåsta</p>
        </div>
        {newBookings > 0 && (
          <div className="text-center p-2 bg-green-100 rounded border border-green-300">
            <p className="font-bold text-green-700">{newBookings}</p>
            <p className="text-green-600">Nya!</p>
          </div>
        )}
        {freeBookings > 0 && (
          <div className="text-center p-2 bg-yellow-100 rounded border border-yellow-300">
            <p className="font-bold text-yellow-700">{freeBookings}</p>
            <p className="text-yellow-600">—</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 🎯 مكون لفصل الحجوزات الجديدة
export const NewBookingSeparator = () => {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-300 rounded-full">
        <span className="text-sm animate-pulse">✨</span>
        <span className="text-xs font-bold text-green-700">Nya bokningar</span>
        <span className="text-sm animate-pulse">✨</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
    </div>
  );
};

export default {
  BookingStatusExplainer,
  PriceExplainer, 
  PassengerInfoExplainer,
  ActionExplainer,
  BookingsSummary,
  NewBookingSeparator
};