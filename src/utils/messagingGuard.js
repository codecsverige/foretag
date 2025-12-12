// Enhanced contact detection system with comprehensive patterns

export function detectContact(text = "") {
  try {
    const t = String(text).toLowerCase();
    
    // Enhanced email detection (more comprehensive)
    const emailPatterns = [
      /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
      /[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/i, // with spaces
      /[a-z0-9._%+-]+\s*\(\s*at\s*\)\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/i, // (at) replacement
      /[a-z0-9._%+-]+\s*\[\s*at\s*\]\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/i, // [at] replacement
    ];

    // Enhanced phone number detection (Swedish and international)
    const phonePatterns = [
      // Swedish numbers
      /(?:\+46|0046|46)[\s-]?[0-9][\s-]?[0-9]{7,8}/,
      /07[0-9][\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}/,
      /08[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}/,
      
      // International formats
      /(?:\+|00)\d{1,3}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9}/,
      
      // General patterns (7+ digits with possible separators)
      /(?:\d[\s-]?){7,}/,
      
      // Numbers with common separators
      /\d{3,4}[\s.-]\d{3,4}[\s.-]\d{2,4}/,
      /\d{2,3}[\s-]\d{3,4}[\s-]\d{2,4}/,
      
      // Disguised numbers (with letters/symbols)
      /(?:\d[a-z\s\-._]?){7,}/,
    ];

    // Social media handles and usernames
    const socialPatterns = [
      /@[a-z0-9_]{3,}/,
      /instagram\.com\/[a-z0-9_.]/i,
      /facebook\.com\/[a-z0-9_.]/i,
      /twitter\.com\/[a-z0-9_]/i,
      /linkedin\.com\/in\/[a-z0-9-]/i,
      /snapchat/i,
      /whatsapp/i,
      /telegram/i,
      /discord/i,
      /skype/i,
      /viber/i,
    ];

    // Contact-related keywords (Swedish and English)
    const contactKeywords = [
      // Swedish - direct contact requests
      /ring\s*mig/i, /ringa\s*mig/i, /kontakta\s*mig/i, /sms\s*mig/i,
      /telefon/i, /mobil/i, /nummer/i, /mejl/i, /epost/i, /e-post/i,
      /hör\s*av\s*dig/i, /höra\s*av/i, /kontakt/i,
      
      // English - direct contact requests  
      /call\s*me/i, /phone\s*me/i, /text\s*me/i, /email\s*me/i,
      /my\s*number/i, /my\s*phone/i, /my\s*email/i, /contact\s*me/i,
      /reach\s*me/i, /get\s*in\s*touch/i,
      
      // Common possession patterns
      /mitt\s*nummer/i, /min\s*telefon/i, /min\s*mobil/i, /min\s*mejl/i,
      /min\s*mail/i, /mitt\s*tel/i, /min\s*e-post/i,
      
      // Disguised contact sharing attempts
      /noll\s*sju/i, /noll\s*åtta/i, /snabel-a/i, /punkt\s*se/i, /punkt\s*com/i,
      /at\s*tecken/i, /alfabet.*nummer/i, /bokstav.*siffra/i,
    ];

    // Check all patterns
    const hasEmail = emailPatterns.some(pattern => pattern.test(t));
    const hasPhone = phonePatterns.some(pattern => pattern.test(t));
    const hasSocial = socialPatterns.some(pattern => pattern.test(t));
    const hasKeywords = contactKeywords.some(pattern => pattern.test(t));

    return hasEmail || hasPhone || hasSocial || hasKeywords;
    
  } catch { 
    return false; 
  }
}

// Get specific contact violation message
export function getContactViolationMessage(text = "") {
  try {
    const t = String(text).toLowerCase();
    
    // Check for specific violations and return appropriate message
    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(t)) {
      return "📧 E-postadresser kan inte delas i chatten. Kontaktuppgifter visas efter betalning.";
    }
    
    if (/(?:\+|00)?\d[\s-]*\d{6,}/.test(t)) {
      return "📱 Telefonnummer kan inte delas i chatten. Kontaktuppgifter visas efter betalning.";
    }
    
    if (/@[a-z0-9_]{3,}/.test(t) || /instagram|facebook|twitter|snapchat|whatsapp|telegram/i.test(t)) {
      return "📱 Sociala medier och användarnamn kan inte delas i chatten. Kontaktuppgifter visas efter betalning.";
    }
    
    if (/ring\s*mig|kontakta\s*mig|mitt\s*nummer|min\s*telefon|hör\s*av\s*dig|reach\s*me/i.test(t)) {
      return "☎️ Förfrågningar om kontakt kan inte delas i chatten. Kontaktuppgifter visas efter betalning.";
    }
    
    if (/noll\s*sju|noll\s*åtta|snabel-a|punkt\s*se|punkt\s*com|at\s*tecken/i.test(t)) {
      return "🚫 Försök att kringgå kontaktreglerna är inte tillåtet. Kontaktuppgifter visas efter betalning.";
    }
    
    // Generic message
    return "🚫 Kontaktuppgifter kan inte delas i chatten. All kontaktinformation visas automatiskt efter betalning.";
    
  } catch {
    return "🚫 Kontaktuppgifter kan inte delas i chatten. All kontaktinformation visas automatiskt efter betalning.";
  }
}

export default { detectContact, getContactViolationMessage };

