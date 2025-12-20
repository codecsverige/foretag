/**
 * Phone Verification Service
 * Handles phone number verification and communication masking
 * Inspired by VägVänner's verification system
 */

import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'

interface VerificationCode {
  id: string
  phone: string
  code: string
  expiresAt: number
  verified: boolean
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Normalize phone number to E.164 format
 */
export function normalizePhone(phone: string): string {
  let p = phone.trim().replace(/[^\d+]/g, '')
  
  // Swedish numbers without country code
  if (p.startsWith('07') && p.length === 10) {
    p = '+46' + p.substring(1)
  }
  // With 0046 prefix
  else if (p.startsWith('0046')) {
    p = '+46' + p.substring(4)
  }
  // With 46 without +
  else if (p.startsWith('46') && p.length === 11) {
    p = '+' + p
  }
  
  return p
}

/**
 * Mask phone number for privacy
 * Example: +46701234567 -> +46*****4567
 */
export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone)
  if (normalized.length < 8) return normalized
  
  const start = normalized.substring(0, 4)
  const end = normalized.substring(normalized.length - 4)
  const masked = '*'.repeat(normalized.length - 8)
  
  return `${start}${masked}${end}`
}

/**
 * Send verification code via SMS
 */
export async function sendVerificationCode(
  phone: string
): Promise<{ success: boolean; error?: string; codeId?: string }> {
  try {
    if (!db) {
      return { success: false, error: 'Database not available' }
    }

    const normalizedPhone = normalizePhone(phone)
    
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return { success: false, error: 'Invalid phone number' }
    }

    // Check for existing recent code
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const existingQuery = query(
      collection(db, 'verification_codes'),
      where('phone', '==', normalizedPhone),
      where('createdAt', '>', fiveMinutesAgo)
    )
    
    const existingSnap = await getDocs(existingQuery)
    
    if (!existingSnap.empty) {
      return { 
        success: false, 
        error: 'Verification code already sent. Please wait 5 minutes before requesting a new one.' 
      }
    }

    // Generate verification code
    const code = generateVerificationCode()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    // Save to database
    const codeDoc = await addDoc(collection(db, 'verification_codes'), {
      phone: normalizedPhone,
      code,
      expiresAt,
      verified: false,
      createdAt: Date.now()
    })

    // In a real implementation, send SMS here
    // For now, log the code (remove in production)
    console.log(`[DEV] Verification code for ${maskPhone(normalizedPhone)}: ${code}`)

    return { 
      success: true, 
      codeId: codeDoc.id 
    }
  } catch (error: any) {
    console.error('Send verification error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verify the code entered by user
 */
export async function verifyCode(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!db) {
      return { success: false, error: 'Database not available' }
    }

    const normalizedPhone = normalizePhone(phone)
    
    const q = query(
      collection(db, 'verification_codes'),
      where('phone', '==', normalizedPhone),
      where('code', '==', code),
      where('verified', '==', false)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return { success: false, error: 'Invalid or expired code' }
    }

    const doc = snapshot.docs[0]
    const data = doc.data()
    
    // Check if expired
    if (data.expiresAt < Date.now()) {
      return { success: false, error: 'Code has expired' }
    }

    // Mark as verified
    const { updateDoc } = await import('firebase/firestore')
    await updateDoc(doc.ref, {
      verified: true,
      verifiedAt: Date.now()
    })

    return { success: true }
  } catch (error: any) {
    console.error('Verify code error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Format phone number for display
 * Example: +46701234567 -> +46 70 123 45 67
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhone(phone)
  
  if (normalized.startsWith('+46')) {
    const rest = normalized.substring(3)
    return `+46 ${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5, 7)} ${rest.substring(7)}`
  }
  
  return normalized
}

export default {
  generateVerificationCode,
  normalizePhone,
  maskPhone,
  sendVerificationCode,
  verifyCode,
  formatPhoneForDisplay
}
