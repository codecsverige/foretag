// src/utils/distance.js
// Simple distance estimator between Swedish cities for price reasonableness checks

const DEG2RAD = Math.PI / 180;

function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * DEG2RAD;
  const dLon = (lon2 - lon1) * DEG2RAD;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * DEG2RAD) * Math.cos(lat2 * DEG2RAD) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c; // Earth radius km
}

function normalizeCity(name = "") {
  return (name || "")
    .toLowerCase()
    .replace(/[åÅ]/g, 'a')
    .replace(/[äÄ]/g, 'a')
    .replace(/[öÖ]/g, 'o')
    .replace(/\s+/g, ' ')
    .trim();
}

// Minimal coordinates set for major Swedish cities (approximate)
const CITY_COORDS = {
  'stockholm': { lat: 59.334591, lon: 18.06324 },
  'goteborg':  { lat: 57.70887,  lon: 11.97456 },
  'gothenburg':{ lat: 57.70887,  lon: 11.97456 },
  'malmo':     { lat: 55.605,    lon: 13.0038 },
  'uppsala':   { lat: 59.8586,   lon: 17.6389 },
  'vasteras':  { lat: 59.6099,   lon: 16.5448 },
  'orebro':    { lat: 59.2753,   lon: 15.2134 },
  'linkoping': { lat: 58.4109,   lon: 15.6216 },
  'helsingborg': { lat: 56.0467, lon: 12.6944 },
  'jonkoping': { lat: 57.7815,   lon: 14.1562 },
  'norrkoping': { lat: 58.5877,  lon: 16.1924 },
  'lund':      { lat: 55.7047,   lon: 13.191 },
  'umea':      { lat: 63.8258,   lon: 20.263 },
  'gavle':     { lat: 60.6749,   lon: 17.1413 },
  'boras':     { lat: 57.721,    lon: 12.9401 },
  'eskilstuna':{ lat: 59.3713,   lon: 16.5098 },
  'sodertalje':{ lat: 59.1955,   lon: 17.6253 },
  'karlstad':  { lat: 59.3793,   lon: 13.5036 },
  'vaxjo':     { lat: 56.8777,   lon: 14.8091 },
  'halmstad':  { lat: 56.6745,   lon: 12.8568 },
  'sundsvall': { lat: 62.3908,   lon: 17.3069 },
  'lulea':     { lat: 65.5848,   lon: 22.1567 },
  'ostersund': { lat: 63.1792,   lon: 14.6357 },
  'skovde':    { lat: 58.3912,   lon: 13.8451 },
  'karlskrona': { lat: 56.1616,  lon: 15.5866 },
  'kalmar':    { lat: 56.6616,   lon: 16.3616 },
  'nykoping':  { lat: 58.753,    lon: 17.0079 },
  'falun':     { lat: 60.606,    lon: 15.6356 },
  'kristianstad': { lat: 56.0294, lon: 14.1567 },
  'gotland':   { lat: 57.6348,   lon: 18.2948 }, // Visby approx
};

export function estimateDistanceKm(originCity, destinationCity) {
  const o = CITY_COORDS[normalizeCity(originCity)] || null;
  const d = CITY_COORDS[normalizeCity(destinationCity)] || null;
  if (!o || !d) return null;
  return Math.round(haversineKm(o.lat, o.lon, d.lat, d.lon));
}

export function recommendedPricePerSeat(distanceKm) {
  if (!distanceKm || !Number.isFinite(distanceKm)) return null;
  // Simple heuristic: 1.5–2.0 SEK per km per seat for cost-sharing
  const low = Math.max(10, Math.round(distanceKm * 1.5));
  const high = Math.max(low + 10, Math.round(distanceKm * 2.0));
  return { low, high };
}

export function maxReasonablePerSeat(distanceKm) {
  if (!distanceKm || !Number.isFinite(distanceKm)) return null;
  // Upper bound heuristic: ~3.5 SEK/km per seat
  return Math.round(distanceKm * 3.5);
}

export default {
  estimateDistanceKm,
  recommendedPricePerSeat,
  maxReasonablePerSeat,
};

