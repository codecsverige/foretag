// src/utils/rideSummary.js

/**
 * Utilities to build a clear Swedish summary sentence that always includes
 * the word "samåkning" and adapts to role, recurrence, weekdays and time.
 */

import { extractCity } from './address.js';

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const WEEKDAY_LABELS_SHORT = {
  mon: "mån",
  tue: "tis",
  wed: "ons",
  thu: "tor",
  fri: "fre",
  sat: "lör",
  sun: "sön",
};

const WEEKDAY_LABELS_LONG = {
  mon: "måndag",
  tue: "tisdag",
  wed: "onsdag",
  thu: "torsdag",
  fri: "fredag",
  sat: "lördag",
  sun: "söndag",
};

function formatSwedishDateLong(dateStr, timeStr) {
  try {
    const dt = new Date(`${dateStr}T${timeStr || "00:00"}`);
    const datePart = dt.toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const timePart = timeStr
      ? dt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
      : "";
    return timePart ? `${datePart} kl ${timePart}` : datePart;
  } catch {
    return [dateStr, timeStr].filter(Boolean).join(" ");
  }
}

function compressWeekdayRanges(weekdayKeys) {
  // Given an array like ["mon","tue","wed","thu"], return "mån–tor"
  // Otherwise join: "mån, tis och fre"
  const indices = weekdayKeys
    .map((k) => WEEKDAY_KEYS.indexOf(k))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);

  if (indices.length === 0) return "";

  const ranges = [];
  let start = indices[0];
  let prev = indices[0];

  for (let i = 1; i < indices.length; i++) {
    const cur = indices[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    ranges.push([start, prev]);
    start = cur;
    prev = cur;
  }
  ranges.push([start, prev]);

  // If exactly one continuous range with 2+ days -> mån–tor
  if (ranges.length === 1 && ranges[0][1] > ranges[0][0]) {
    const [a, b] = ranges[0];
    return `${WEEKDAY_LABELS_SHORT[WEEKDAY_KEYS[a]]}–${WEEKDAY_LABELS_SHORT[WEEKDAY_KEYS[b]]}`;
  }

  // Else list with commas and "och"
  const labels = indices.map((i) => WEEKDAY_LABELS_SHORT[WEEKDAY_KEYS[i]]);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} och ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} och ${labels[labels.length - 1]}`;
}

export function buildSamakningSummary(ride) {
  const roleNorm = (ride?.role || '').toLowerCase();
  const role = roleNorm.includes('fö') || roleNorm.includes('dri') || ride?.type === 'offer' ? 'förare' : 'passagerare';
  const isDriver = role === "förare";
  const count = Number(ride?.count ?? ride?.seats ?? ride?.availableSeats ?? 1) || 1;
  const tripType = ride?.tripType || "";

  // Build permissions/allowances info
  let permissions = [];
  if (isDriver) {
    if (ride?.specialServices === "pet_friendly" || ride?.specialServices?.includes("pet")) permissions.push("husdjur OK");
    if (ride?.specialServices === "luggage_help") permissions.push("hjälp med bagage");
    if (ride?.specialServices === "child_seats") permissions.push("barnstolar");
    if (ride?.specialServices === "wheelchair_accessible") permissions.push("rullstol OK");
    if (ride?.smokingAllowed === "yes") permissions.push("rökning OK");
    if (ride?.luggageSpace > 0) permissions.push("bagage OK");
  } else {
    if (ride?.petsAllowed) permissions.push("har husdjur");
    if (ride?.baggage && ride?.baggage !== "none") {
      if (ride.baggage === "large") permissions.push("stor väska");
      else if (ride.baggage === "multiple") permissions.push("flera väskor");
      else permissions.push("bagage");
    }
    if (ride?.accessibilityNeeds) permissions.push("särskilda behov");
  }
  
  const permissionText = permissions.length > 0 ? ` (${permissions.join(", ")})` : "";

  const recurrence = ride?.recurrence || "en gång";
  const timeStr = ride?.departureTime || ride?.time || ride?.preferredTime || "";
  const isRoundTrip = Boolean(ride?.roundTrip);
  const returnTime = ride?.returnTime || "";
  const returnDate = ride?.returnDate || "";

  // Payment/compensation phrasing (neutral, for passenger if cost mode provided)
  const costMode = ride?.costMode || (ride?.price ? 'fixed_price' : 'cost_share');
  const price = Number(ride?.price) || null;
  const paymentText = (() => {
    if (costMode === 'companionship') return 'Endast sällskap';
    if (costMode === 'free') return 'Gratis/utan ersättning';
    if (costMode === 'by_agreement') return 'Ersättning enligt överenskommelse';
    if (costMode === 'fixed_price') return price ? `Ersättning ca ${price} kr` : 'Ersättning erbjuds';
    if (costMode === 'cost_share' && Number(ride?.approxPrice) > 0) return `Kostnadsdelning ca ${Number(ride.approxPrice)} kr`;
    // cost_share or unknown
    return 'Kostnadsdelning';
  })();

  const personsText = (!isDriver && count > 1) ? ` Vi är ${count} personer.` : '';
  const seatsText = (isDriver && count > 0) ? (count === 1 ? '1 plats' : `${count} platser`) : '';
  // Show only exact time in texts; omit ±flex info
  const timeLabel = timeStr ? ` kl ${timeStr}` : '';
  
  // Helper for from-to format
  const fromCity = extractCity(ride?.origin || '');
  const toCity = extractCity(ride?.destination || '');

  // Deterministic variant selector for openings (keeps message stable across renders)
  const selectVariant = (variants, seed) => {
    try {
      const s = String(seed || '').trim();
      if (!variants || variants.length === 0) return '';
      if (!s) return variants[0];
      let h = 5381;
      for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
      const idx = Math.abs(h) % variants.length;
      return variants[idx];
    } catch {
      return variants[0] || '';
    }
  };
  const seed = ride?.id || `${ride?.origin || ''}-${ride?.destination || ''}-${ride?.date || ''}-${timeStr}`;

  // === RECURRING TRIPS (dagligen) ===
  if (recurrence === "dagligen") {
    const selected = Array.isArray(ride?.weekdays) ? ride.weekdays : [];
    const daysLabel = selected.length > 0 ? compressWeekdayRanges(selected) : '';
    
    // DRIVER - Daily
    if (isDriver) {
      // Format: "Jag kör Stockholm - Göteborg mån-fre kl 07:00 (och tillbaka kl 17:00). Finns 2 platser. Kostnadsdelning."
      let msg = `Jag kör ${fromCity} - ${toCity}`;
      if (daysLabel) msg += ` ${daysLabel}`;
      if (timeStr) msg += `${timeLabel}`;
      if (isRoundTrip && returnTime) msg += ` (och tillbaka kl ${returnTime})`;
      msg += `.`;
      if (seatsText) msg += ` Finns ${seatsText}.`;
      const pay = (costMode === 'free' || costMode === 'companionship') ? paymentText : (costMode === 'fixed_price' && price ? `${price} kr/plats` : (Number(ride?.approxPrice) > 0 ? `ca ${Number(ride.approxPrice)} kr • Kostnadsdelning` : 'Kostnadsdelning'));
      msg += ` ${pay}.`;
      return `${msg}${permissionText}`.trim();
    }
    
    // PASSENGER - Daily
    // Format: "Behöver skjuts Stockholm - Göteborg mån-fre kl 07:00 (retur kl 17:00). Delar gärna på kostnaden."
    const openers = ['Behöver skjuts', 'Söker samåkning', 'Någon som kör', 'Letar skjuts'];
    const opener = selectVariant(openers, seed);
    let msg = `${opener} ${fromCity} - ${toCity}`;
    if (daysLabel) msg += ` ${daysLabel}`;
    if (timeStr) msg += `${timeLabel}`;
    if (isRoundTrip && returnTime) msg += ` (retur kl ${returnTime})`;
    msg += `.`;
    msg += ` ${paymentText}${personsText}.`;
    return `${msg}${permissionText}`.trim();
  }

  // === ONE-TIME TRIPS (en gång) ===
  const dateLabel = formatSwedishDateLong(ride?.date, timeStr);
  
  // DRIVER - One-time
  if (isDriver) {
    // Format: "Jag kör Stockholm - Malmö på fredag 3 oktober kl 12:00 och tillbaka söndag 5 oktober kl 14:00. Finns 2 platser. Kostnadsdelning."
    let msg = `Jag kör ${fromCity} - ${toCity} på ${dateLabel}`;
    
    if (isRoundTrip) {
      if (returnDate && returnTime) {
        const retDateLabel = formatSwedishDateLong(returnDate, returnTime);
        msg += ` och tillbaka ${retDateLabel}`;
      } else if (returnTime) {
        msg += ` och tillbaka samma dag kl ${returnTime}`;
      }
    }
    msg += `.`;
    
    if (seatsText) msg += ` Finns ${seatsText}.`;
    const pay = (costMode === 'free' || costMode === 'companionship') ? paymentText : (costMode === 'fixed_price' && price ? `${price} kr/plats` : (Number(ride?.approxPrice) > 0 ? `ca ${Number(ride.approxPrice)} kr • Kostnadsdelning` : 'Kostnadsdelning'));
    msg += ` ${pay}.`;
    return `${msg}${permissionText}`.trim();
  }
  
  // PASSENGER - One-time
  // Format: "Någon som åker från Stockholm till Göteborg på fredag 10 oktober (och tillbaka söndag 12 oktober)? Delar gärna bensinpeng."
  const openers = ['Någon som åker från', 'Behöver skjuts från', 'Söker samåkning från', 'Letar skjuts från'];
  const opener = selectVariant(openers, seed);
  let msg = `${opener} ${fromCity} till ${toCity} på ${dateLabel}`;
  
  if (isRoundTrip) {
    if (returnDate && returnTime) {
      const retDateLabel = formatSwedishDateLong(returnDate, returnTime);
      msg += ` och tillbaka ${retDateLabel}`;
    } else if (returnTime) {
      msg += ` och tillbaka samma dag kl ${returnTime}`;
    } else if (returnDate) {
      const retDateLabel = formatSwedishDateLong(returnDate, '');
      msg += ` och tillbaka ${retDateLabel}`;
    }
  }
  msg += `?`;
  msg += ` ${paymentText}${personsText}.`;
  return `${msg}${permissionText}`.trim();
}

export function getWeekdayOptions() {
  return [
    { key: "mon", short: WEEKDAY_LABELS_SHORT.mon, long: WEEKDAY_LABELS_LONG.mon },
    { key: "tue", short: WEEKDAY_LABELS_SHORT.tue, long: WEEKDAY_LABELS_LONG.tue },
    { key: "wed", short: WEEKDAY_LABELS_SHORT.wed, long: WEEKDAY_LABELS_LONG.wed },
    { key: "thu", short: WEEKDAY_LABELS_SHORT.thu, long: WEEKDAY_LABELS_LONG.thu },
    { key: "fri", short: WEEKDAY_LABELS_SHORT.fri, long: WEEKDAY_LABELS_LONG.fri },
    { key: "sat", short: WEEKDAY_LABELS_SHORT.sat, long: WEEKDAY_LABELS_LONG.sat },
    { key: "sun", short: WEEKDAY_LABELS_SHORT.sun, long: WEEKDAY_LABELS_LONG.sun },
  ];
}
