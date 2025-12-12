/* ────────────────────────────────────────────────
   src/utils/mapRole.js
   Konverterar rå text till "driver" eller "passenger"
──────────────────────────────────────────────── */

export function mapRole(raw) {
  if (!raw) return "driver";
  const r = raw.toLowerCase();
  if (r.startsWith("fö") || r.startsWith("dri")) return "driver";
  if (r.startsWith("pass")) return "passenger";
  return "driver";
}

export default mapRole;
