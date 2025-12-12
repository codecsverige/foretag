import {
  sanitizeHTML,
  sanitizeInput,
  generateCSRFToken,
  validateCSRFToken,
  encryptData,
  decryptData,
  validateFileUpload,
  validatePasswordStrength,
  secureSession
} from '../security';

describe('Security Utils', () => {
  describe('sanitizeHTML', () => {
    test('tar bort farliga HTML-taggar', () => {
      const input = '<script>alert("XSS")</script>Hej världen';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('alert');
    });

    test('hanterar null och undefined', () => {
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
    });
  });

  describe('sanitizeInput', () => {
    test('sanerar e-postadresser', () => {
      expect(sanitizeInput('TEST@EXAMPLE.COM', 'email')).toBe('test@example.com');
      expect(sanitizeInput('invalid-email', 'email')).toBe('');
    });

    test('sanerar telefonnummer', () => {
      expect(sanitizeInput('+46 70-123 45 67', 'phone')).toBe('+46701234567');
      expect(sanitizeInput('abc123def', 'phone')).toBe('123');
    });

    test('sanerar namn', () => {
      expect(sanitizeInput('Anna Åberg', 'name')).toBe('Anna Åberg');
      // Script tags tas bort men "script" texten finns kvar
      const result = sanitizeInput('Name123<script>', 'name');
      expect(result).not.toContain('123');
      expect(result).not.toContain('<');
    });

    test('sanerar städer', () => {
      expect(sanitizeInput('Stockholm, Sverige', 'city')).toBe('Stockholm, Sverige');
      // Script tags tas bort från städer
      const result = sanitizeInput('City<script>alert()</script>', 'city');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    test('sanerar meddelanden', () => {
      const input = 'Hej! <script>alert("XSS")</script> Detta är ett meddelande.';
      const result = sanitizeInput(input, 'message');
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hej!');
      expect(result).toContain('Detta är ett meddelande.');
    });

    test('sanerar nummer', () => {
      expect(sanitizeInput('123', 'number')).toBe(123);
      expect(sanitizeInput('abc', 'number')).toBe(0);
    });

    test('validerar URL:er', () => {
      expect(sanitizeInput('https://example.com', 'url')).toBe('https://example.com');
      expect(sanitizeInput('javascript:alert(1)', 'url')).toBe('');
      expect(sanitizeInput('not-a-url', 'url')).toBe('');
    });
  });

  describe('CSRF Token', () => {
    test('genererar unika tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      
      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    test('validerar tokens korrekt', () => {
      const token = generateCSRFToken();
      
      expect(validateCSRFToken(token, token)).toBe(true);
      expect(validateCSRFToken(token, 'wrong-token')).toBe(false);
      expect(validateCSRFToken(null, token)).toBe(false);
      expect(validateCSRFToken(token, null)).toBe(false);
    });
  });

  describe('Kryptering', () => {
    test('krypterar och dekrypterar data', () => {
      const data = 'Hemlig information';
      const key = 'min-hemliga-nyckel';
      
      const encrypted = encryptData(data, key);
      expect(encrypted).not.toBe(data);
      
      const decrypted = decryptData(encrypted, key);
      expect(decrypted).toBe(data);
    });

    test('hanterar tomma värden', () => {
      expect(encryptData('', 'key')).toBe('');
      expect(encryptData('data', '')).toBe('');
      expect(decryptData('', 'key')).toBe('');
      expect(decryptData('data', '')).toBe('');
    });
  });

  describe('Filvalidering', () => {
    test('accepterar giltiga filer', () => {
      const file = {
        name: 'bild.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg'
      };
      
      const result = validateFileUpload(file);
      expect(result.valid).toBe(true);
    });

    test('avvisar för stora filer', () => {
      const file = {
        name: 'bild.jpg',
        size: 10 * 1024 * 1024, // 10MB
        type: 'image/jpeg'
      };
      
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('för stor');
    });

    test('avvisar ogiltiga filtyper', () => {
      const file = {
        name: 'dokument.pdf',
        size: 1024,
        type: 'application/pdf'
      };
      
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Ogiltig filtyp');
    });

    test('avvisar ogiltiga filändelser', () => {
      const file = {
        name: 'bild.exe',
        size: 1024,
        type: 'image/jpeg'
      };
      
      const result = validateFileUpload(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Ogiltig filändelse');
    });
  });

  describe('Lösenordsvalidering', () => {
    test('validerar starka lösenord', () => {
      const result = validatePasswordStrength('StarkT123!');
      expect(result.valid).toBe(true);
      expect(result.level).toBe('Mycket starkt');
    });

    test('avvisar svaga lösenord', () => {
      const result = validatePasswordStrength('abc123');
      expect(result.valid).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    test('ger feedback för förbättring', () => {
      const result = validatePasswordStrength('password');
      expect(result.feedback).toContain('Lägg till minst en stor bokstav');
      expect(result.feedback).toContain('Lägg till minst en siffra');
      expect(result.feedback).toContain('Lägg till minst ett specialtecken');
    });
  });

  describe('Säker session', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    test('sparar och hämtar värden', () => {
      secureSession.set('test', 'värde');
      expect(secureSession.get('test')).toBe('värde');
    });

    test('tar bort utgångna värden', () => {
      // Sätt värde med 0 minuters utgång
      const item = {
        value: 'test',
        expiry: new Date().getTime() - 1000 // Redan utgånget
      };
      sessionStorage.setItem('expired', JSON.stringify(item));
      
      expect(secureSession.get('expired')).toBeNull();
    });

    test('tar bort specifika nycklar', () => {
      secureSession.set('test', 'värde');
      secureSession.remove('test');
      expect(secureSession.get('test')).toBeNull();
    });

    test('rensar all session', () => {
      secureSession.set('test1', 'värde1');
      secureSession.set('test2', 'värde2');
      secureSession.clear();
      
      expect(secureSession.get('test1')).toBeNull();
      expect(secureSession.get('test2')).toBeNull();
    });
  });
});