// Simple profanity filter with normalization and basic leetspeak mapping

export function normalizeText(input = "") {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[@$!|]/g, "i")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/0/g, "o")
    .replace(/5/g, "s")
    .toLowerCase();
}

// Minimal base list (extend as needed)
const BASE_BLOCKLIST = [
  // English
  "fuck", "shit", "bitch", "asshole", "bastard",
  // Swedish (basic set)
  "fan", "hora", "kuk", "fitta", "jävel", "satan",
  // Generic
  "idiot"
];

export function containsProfanity(text = "", extra = []) {
  const hay = normalizeText(text);
  const list = [...BASE_BLOCKLIST, ...extra].map(normalizeText);
  return list.some(w => w && hay.includes(w));
}

export function cleanProfanity(text = "", extra = []) {
  if (!text) return text;
  let out = text;
  const list = [...BASE_BLOCKLIST, ...extra];
  for (const w of list) {
    if (!w) continue;
    const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    out = out.replace(re, "***");
  }
  return out;
}

export default { normalizeText, containsProfanity, cleanProfanity };

