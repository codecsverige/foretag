/**
 * extractCity(fullAddress: string): string
 * ---------------------------------------
 * Returnerar stadens eller kommunens namn från en fri adresssträng (oftast svensk).
 *
 * Strategi:
 *  1. Om det finns ett kommatecken, ta första ordet efter kommatecknet (ta bort svensk genitiv "s").
 *  2. Annars sök efter nyckelord som "kommun" eller "stad" och returnera första ordet före dem.
 *  3. Annars returnera sista segmentet som inte innehåller siffror.
 */
export function extractCity(fullAddress = "") {
  if (!fullAddress) return "";

  /* ❶ Efter första kommatecknet */
  const [, afterComma] = fullAddress.split(",");
  if (afterComma) {
    const word = afterComma.trim().split(/\s+/)[0];
    if (word && isNaN(word)) return word.replace(/s$/i, "");
  }

  /* ❷ Sök efter nyckelord */
  const parts = fullAddress.split(",").map(p => p.trim());
  const keywords = ["kommun", "stad", "city", "ort", "town", "capital", "köping"];
  const hit = parts.find(p => keywords.some(k => p.toLowerCase().includes(k)));
  if (hit) {
    const word = hit.split(/\s+/)[0];
    return word.replace(/s$/i, "");
  }

  /* ❸ fallback: sista icke-numeriska delen */
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] && !/\d/.test(parts[i])) return parts[i];
  }
  return parts[0] || "";
}
