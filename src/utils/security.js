/**
 * Security utilities för VägVänner
 * Skyddar mot vanliga säkerhetshot som XSS, CSRF, och SQL injection
 */

// Sanera HTML-input för att förhindra XSS-attacker
export function sanitizeHTML(input) {
  if (!input) return '';
  
  // Ta bort farliga HTML-taggar och attribut
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Validera och sanera användarinput
export function sanitizeInput(input, type = 'text') {
  if (!input) return '';
  
  // Konvertera till sträng och trimma
  let sanitized = String(input).trim();
  
  switch (type) {
    case 'email':
      // Validera e-postformat
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(sanitized) ? sanitized.toLowerCase() : '';
      
    case 'phone':
      // Ta bort allt utom siffror och +
      return sanitized.replace(/[^0-9+]/g, '');
      
    case 'name':
      // Tillåt endast bokstäver, mellanslag och svenska tecken
      return sanitized.replace(/[^a-zA-ZåäöÅÄÖ\s-]/g, '');
      
    case 'city':
      // Tillåt bokstäver, siffror, mellanslag och vissa specialtecken
      return sanitized.replace(/[^a-zA-ZåäöÅÄÖ0-9\s,.-]/g, '');
      
    case 'message':
      // Tillåt mer tecken men ta bort farliga HTML/script
      return sanitized
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '');
      
    case 'number':
      // Endast siffror
      const num = parseInt(sanitized, 10);
      return isNaN(num) ? 0 : num;
      
    case 'url':
      // Validera URL
      try {
        const url = new URL(sanitized);
        // Tillåt endast http och https
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          return sanitized;
        }
      } catch {
        return '';
      }
      return '';
      
    default:
      // Standard textsanering
      return sanitized.replace(/[<>]/g, '');
  }
}

// Generera CSRF-token
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validera CSRF-token
export function validateCSRFToken(token, storedToken) {
  if (!token || !storedToken) return false;
  return token === storedToken;
}

// Kryptera känslig data (enkel implementation för demonstration)
export function encryptData(data, key) {
  if (!data || !key) return '';
  
  // I produktion, använd en riktig krypteringsbibliotek som crypto-js
  // Detta är endast en enkel XOR-kryptering för demonstration
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(encrypted); // Base64-koda resultatet
}

// Dekryptera data
export function decryptData(encryptedData, key) {
  if (!encryptedData || !key) return '';
  
  try {
    const data = atob(encryptedData); // Base64-avkoda
    let decrypted = '';
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return decrypted;
  } catch {
    return '';
  }
}

// Validera filuppladdning
export function validateFileUpload(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB standard
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options;
  
  // Kontrollera filstorlek
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Filen är för stor. Max storlek: ${maxSize / 1024 / 1024}MB`
    };
  }
  
  // Kontrollera MIME-typ
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Ogiltig filtyp'
    };
  }
  
  // Kontrollera filändelse
  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Ogiltig filändelse'
    };
  }
  
  return { valid: true };
}

// Skapa säker lösenordshash (använd bcrypt i produktion)
export async function hashPassword(password) {
  // I produktion, använd bcrypt eller liknande
  // Detta är endast för demonstration
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validera lösenordsstyrka
export function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = {
    valid: false,
    score: 0,
    feedback: []
  };
  
  if (password.length < minLength) {
    strength.feedback.push(`Lösenordet måste vara minst ${minLength} tecken`);
  } else {
    strength.score += 1;
  }
  
  if (!hasUpperCase) {
    strength.feedback.push('Lägg till minst en stor bokstav');
  } else {
    strength.score += 1;
  }
  
  if (!hasLowerCase) {
    strength.feedback.push('Lägg till minst en liten bokstav');
  } else {
    strength.score += 1;
  }
  
  if (!hasNumbers) {
    strength.feedback.push('Lägg till minst en siffra');
  } else {
    strength.score += 1;
  }
  
  if (!hasSpecialChar) {
    strength.feedback.push('Lägg till minst ett specialtecken');
  } else {
    strength.score += 1;
  }
  
  strength.valid = strength.score >= 4;
  strength.level = 
    strength.score <= 2 ? 'Svagt' :
    strength.score <= 3 ? 'Medel' :
    strength.score <= 4 ? 'Starkt' :
    'Mycket starkt';
  
  return strength;
}

// Content Security Policy headers
export function getCSPHeaders() {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.paypal.com https://api-m.paypal.com https://www.paypal.com https://firebase.googleapis.com https://firebaseapp.com wss://*.firebaseio.com",
      "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  };
}

// Säker session-hantering
export const secureSession = {
  set(key, value, expiryMinutes = 30) {
    const item = {
      value: value,
      expiry: new Date().getTime() + (expiryMinutes * 60 * 1000)
    };
    sessionStorage.setItem(key, JSON.stringify(item));
  },
  
  get(key) {
    const itemStr = sessionStorage.getItem(key);
    if (!itemStr) return null;
    
    try {
      const item = JSON.parse(itemStr);
      const now = new Date().getTime();
      
      if (now > item.expiry) {
        sessionStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch {
      return null;
    }
  },
  
  remove(key) {
    sessionStorage.removeItem(key);
  },
  
  clear() {
    sessionStorage.clear();
  }
};

export default {
  sanitizeHTML,
  sanitizeInput,
  generateCSRFToken,
  validateCSRFToken,
  encryptData,
  decryptData,
  validateFileUpload,
  hashPassword,
  validatePasswordStrength,
  getCSPHeaders,
  secureSession
};