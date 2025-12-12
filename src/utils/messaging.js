// Simple smart masking for contact details in chat when contact is locked
// Masks phone numbers and emails while keeping the message readable

export function maskContactIfLocked(text = "") {
  try {
    let out = String(text);
    // Mask email addresses
    out = out.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (m) => maskEmail(m));
    // Mask phone numbers (Swedish and general) sequences of 7+ digits or patterns with spaces/dashes
    out = out.replace(/(?:(?:\+|00)\d{1,3}[- ]?)?(?:\d[- ]?){7,}/g, (m) => maskPhone(m));
    // Mask social handles (@username)
    out = out.replace(/@[A-Z0-9_]{3,}/gi, '@***');
    // Mask common social domains
    out = out.replace(/(?:instagram|facebook|twitter|x|snapchat|whatsapp|telegram|discord|linkedin)\.[A-Z.\/0-9_-]+/gi, '***');
    return out;
  } catch {
    return text;
  }
}

function maskEmail(email) {
  const [user, domain] = email.split("@");
  const maskedUser = user.length <= 2 ? "**" : user[0] + "***" + user[user.length - 1];
  const parts = domain.split(".");
  const tld = parts.pop();
  const maskedDomain = parts.join('.')
    .replace(/[^.]/g, (c, i) => (i % 2 === 0 ? "*" : c)) || "***";
  return `${maskedUser}@${maskedDomain}.${tld}`;
}

function maskPhone(phone) {
  // Keep first and last digit, mask middle
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const masked = digits[0] + "*".repeat(Math.max(1, digits.length - 2)) + digits[digits.length - 1];
  // Reinsert some spacing for readability
  return masked.match(/.{1,3}/g)?.join(" ") || masked;
}

export default { maskContactIfLocked };

