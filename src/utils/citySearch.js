import cities from "../data/cities-se.json";
import Fuse from "fuse.js";

const cache = new Map();
let inFlight = null;

const fuse = new Fuse(cities, {
  includeScore: false,
  threshold: 0.3,
});

const normalize = (s = "") => s
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

const normalizedCitySet = new Set(cities.map(c => normalize(c)));

export async function getCitySuggestions(query) {
  const q = (query || "").trim();
  if (q.length < 2) return [];

  const cached = cache.get(q.toLowerCase());
  const TTL = 5 * 60 * 1000; // 5 minutes
  if (cached && Date.now() - cached.t < TTL) return cached.v;

  if (inFlight) inFlight.abort();
  inFlight = new AbortController();

  // Resolve Functions base URL automatically (no manual env needed in prod)
  const resolveFunctionsBase = () => {
    const fromEnv = (process.env.REACT_APP_FUNCTIONS_BASE_URL || '').trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    const projectId = (process.env.REACT_APP_FIREBASE_PROJECT_ID || '').trim();
    if (projectId) return `https://europe-west1-${projectId}.cloudfunctions.net`;
    return '';
  };

  const urlRemote = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8&accept-language=sv&addressdetails=1&countrycodes=se`;
  const functionsBase = resolveFunctionsBase();
  const urlProxy  = functionsBase ? `${functionsBase}/osmGeocode?q=${encodeURIComponent(q)}&limit=8` : '';
  try {
    let res;
    const isProd = typeof window !== 'undefined' && /vagvanner\.se$/.test(window.location.hostname);
    if (isProd) {
      if (urlProxy) {
        // Use proxy in production to avoid CORS and return rich address data
        res = await fetch(urlProxy, { signal: inFlight.signal });
      } else {
        // No proxy available -> fallback to local Fuse below
        throw new Error('proxy_unavailable');
      }
    } else {
      // Local dev: call Nominatim directly
      res = await fetch(urlRemote, { signal: inFlight.signal, headers: { 'User-Agent': 'VagVanner/1.0 (dev)' } });
    }
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    const v = (data || [])
      .filter((item) => (item?.address?.country_code || "").toLowerCase() === "se")
      .map((item) => {
        const addr = item.address || {};
        const city = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || '';
        const region = addr.municipality || addr.county || addr.state || addr.region || '';
        const streetName = addr.road || addr.pedestrian || addr.residential || addr.footway || addr.cycleway || addr.path || '';
        const houseNumber = addr.house_number || '';
        const postcode = addr.postcode || '';
        const street = `${streetName}${houseNumber ? ' ' + houseNumber : ''}`.trim();
        const label = (item.display_name || '').trim() || [street, city, region].filter(Boolean).join(', ');
        return { label, city, region, street, houseNumber, postcode };
      });
    cache.set(q.toLowerCase(), { v, t: Date.now() });
    return v;
  } catch (e) {
    // Fallback to local Fuse search
    const v = fuse.search(q).slice(0, 8).map((r) => ({ label: r.item }));
    cache.set(q.toLowerCase(), { v, t: Date.now() });
    return v;
  }
}

export function isSwedishCity(name = "") {
  if (!name) return false;
  const base = name.split(",")[0];
  const n = normalize(base);
  if (normalizedCitySet.has(n)) return true;
  // Fuzzy acceptance for minor variations
  const hits = fuse.search(base).slice(0, 1);
  return hits.length > 0;
}

export default { getCitySuggestions };

