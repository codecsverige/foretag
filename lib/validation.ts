/**
 * Form validation utilities
 * Inspired by best practices from VägVänner
 */

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationResult {
  isValid: boolean
  errors: { [key: string]: string }
}

/**
 * Validate Swedish phone number
 */
export function validateSwedishPhone(phone: string): boolean {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Valid formats:
  // +46XXXXXXXXX (12 chars)
  // 0046XXXXXXXXX (13 chars)
  // 07XXXXXXXX (10 chars)
  
  if (cleaned.startsWith('+46') && cleaned.length === 12) return true
  if (cleaned.startsWith('0046') && cleaned.length === 13) return true
  if (cleaned.startsWith('07') && cleaned.length === 10) return true
  
  return false
}

/**
 * Validate Swedish personal number (personnummer)
 */
export function validateSwedishPersonalNumber(pnr: string): boolean {
  const cleaned = pnr.replace(/[^\d]/g, '')
  
  // Should be 10 or 12 digits
  if (cleaned.length !== 10 && cleaned.length !== 12) return false
  
  // Use last 10 digits for validation
  const digits = cleaned.slice(-10)
  
  // Luhn algorithm
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let num = parseInt(digits[i])
    if (i % 2 === 0) {
      num *= 2
      if (num > 9) num -= 9
    }
    sum += num
  }
  
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(digits[9])
}

/**
 * Validate Swedish organization number (organisationsnummer)
 */
export function validateSwedishOrgNumber(orgNr: string): boolean {
  const cleaned = orgNr.replace(/[^\d]/g, '')
  
  if (cleaned.length !== 10) return false
  
  // First digit should be 1-9, not 0
  if (cleaned[0] === '0') return false
  
  // Luhn algorithm
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let num = parseInt(cleaned[i])
    if (i % 2 === 0) {
      num *= 2
      if (num > 9) num -= 9
    }
    sum += num
  }
  
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(cleaned[9])
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate Swedish postal code
 */
export function validateSwedishPostalCode(postalCode: string): boolean {
  const cleaned = postalCode.replace(/\s/g, '')
  return /^\d{5}$/.test(cleaned)
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate Swedish city name
 */
export function validateSwedishCity(city: string): boolean {
  // Allow only Swedish letters and spaces
  const swedishCityRegex = /^[a-zA-ZåäöÅÄÖ\s-]+$/
  return swedishCityRegex.test(city) && city.length >= 2 && city.length <= 50
}

/**
 * Validate price (must be positive number)
 */
export function validatePrice(price: number): boolean {
  return typeof price === 'number' && price >= 0 && price <= 999999
}

/**
 * Validate duration in minutes
 */
export function validateDuration(duration: number): boolean {
  return typeof duration === 'number' && duration > 0 && duration <= 1440 // Max 24 hours
}

/**
 * Generic form validator
 */
export function validateForm(
  data: { [key: string]: any },
  rules: { [key: string]: ValidationRule }
): ValidationResult {
  const errors: { [key: string]: string } = {}

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]

    // Required check
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[field] = 'Detta fält är obligatoriskt'
      continue
    }

    // Skip other validations if not required and empty
    if (!rule.required && !value) continue

    // Min length
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `Minst ${rule.minLength} tecken krävs`
      continue
    }

    // Max length
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `Max ${rule.maxLength} tecken tillåtna`
      continue
    }

    // Pattern
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = 'Ogiltigt format'
      continue
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value)
      if (result !== true) {
        errors[field] = typeof result === 'string' ? result : 'Ogiltig inmatning'
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export default {
  validateSwedishPhone,
  validateSwedishPersonalNumber,
  validateSwedishOrgNumber,
  validateEmail,
  validateUrl,
  validateSwedishPostalCode,
  sanitizeInput,
  validateSwedishCity,
  validatePrice,
  validateDuration,
  validateForm
}
