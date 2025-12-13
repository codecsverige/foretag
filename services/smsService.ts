/**
 * SMS Service - BokaNära
 * Hanterar SMS-påminnelser för bokningar
 * 
 * OBS: Detta är en stub/placeholder som behöver konfigureras med en SMS-leverantör
 * Stödda leverantörer: Twilio, 46elks, Sinch
 */

import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Environment variables for SMS provider
const SMS_PROVIDER = process.env.NEXT_PUBLIC_SMS_PROVIDER || ''
const SMS_API_KEY = process.env.SMS_API_KEY || ''
const SMS_API_SECRET = process.env.SMS_API_SECRET || ''
const SMS_SENDER = process.env.SMS_SENDER || 'BokaNara'

/**
 * Normalisera telefonnummer till E.164 format
 */
export function normalizePhone(phone: string): string {
  let p = phone.trim().replace(/[^\d+]/g, '')
  
  // Svenska nummer utan landskod
  if (p.startsWith('07') && p.length === 10) {
    p = '+46' + p.substring(1)
  }
  // Med 0046 prefix
  else if (p.startsWith('0046')) {
    p = '+46' + p.substring(4)
  }
  // Med 46 utan +
  else if (p.startsWith('46') && p.length === 11) {
    p = '+' + p
  }
  
  return p
}

/**
 * Skicka SMS (placeholder - behöver implementeras med faktisk provider)
 */
export async function sendSms(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const normalizedTo = normalizePhone(to)
  
  if (!normalizedTo) {
    return { success: false, error: 'Ogiltigt telefonnummer' }
  }
  
  if (!SMS_PROVIDER || !SMS_API_KEY) {
    console.log('[SMS STUB] Provider ej konfigurerad:', {
      to: normalizedTo,
      message: message.substring(0, 50) + '...',
      sender: SMS_SENDER
    })
    return { success: false, error: 'SMS-tjänst ej konfigurerad' }
  }
  
  try {
    // TODO: Implementera faktisk SMS-sändning baserat på provider
    // Exempel för Twilio:
    // if (SMS_PROVIDER === 'twilio') {
    //   const response = await fetch('https://api.twilio.com/...', { ... })
    //   ...
    // }
    
    console.log('[SMS] Skulle skicka:', { to: normalizedTo, message, sender: SMS_SENDER })
    
    return { 
      success: false, 
      error: 'SMS-sändning ej implementerad. Konfigurera SMS_PROVIDER.' 
    }
  } catch (error: any) {
    console.error('SMS-fel:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Skapa SMS-påminnelse för en bokning
 * Sparar i Firestore 'reminders' collection för senare utskick via Cloud Function
 */
export async function createBookingReminder(
  bookingId: string,
  companyId: string,
  userId: string,
  phone: string,
  appointmentTime: Date,
  businessName: string,
  serviceName: string
): Promise<{ success: boolean; reminderId?: string; error?: string }> {
  try {
    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) {
      return { success: false, error: 'Ogiltigt telefonnummer' }
    }
    
    const now = Date.now()
    const appointmentMs = appointmentTime.getTime()
    
    // Skapa påminnelser 24h och 2h före
    const reminders = [
      { kind: 'before_24h', offsetMs: 24 * 60 * 60 * 1000 },
      { kind: 'before_2h', offsetMs: 2 * 60 * 60 * 1000 },
    ]
    
    const createdIds: string[] = []
    
    for (const { kind, offsetMs } of reminders) {
      const sendAt = appointmentMs - offsetMs
      
      // Skippa om det redan är för sent
      if (sendAt <= now + 60 * 1000) continue
      
      const dateStr = appointmentTime.toLocaleDateString('sv-SE')
      const timeStr = appointmentTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
      
      const message = kind === 'before_24h'
        ? `Påminnelse: Du har en bokning hos ${businessName} imorgon kl ${timeStr}. Tjänst: ${serviceName}. /BokaNära`
        : `Påminnelse: Din bokning hos ${businessName} börjar om 2 timmar (${timeStr}). /BokaNära`
      
      const reminderData = {
        channel: 'sms',
        status: 'pending',
        kind,
        companyId,
        userId,
        bookingId,
        toPhone: normalizedPhone,
        message,
        sendAt,
        createdAt: now,
        attempts: 0,
      }
      
      const docRef = await addDoc(collection(db, 'reminders'), reminderData)
      createdIds.push(docRef.id)
    }
    
    return { 
      success: true, 
      reminderId: createdIds.join(',')
    }
  } catch (error: any) {
    console.error('Fel vid skapande av påminnelse:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Avbryt påminnelser för en avbokad bokning
 */
export async function cancelBookingReminders(bookingId: string): Promise<boolean> {
  try {
    const { query, where, getDocs, updateDoc } = await import('firebase/firestore')
    
    const q = query(
      collection(db, 'reminders'),
      where('bookingId', '==', bookingId),
      where('status', '==', 'pending')
    )
    
    const snapshot = await getDocs(q)
    
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { status: 'cancelled', cancelledAt: Date.now() })
    )
    
    await Promise.all(updates)
    return true
  } catch (error) {
    console.error('Fel vid avbrytning av påminnelser:', error)
    return false
  }
}

export default {
  normalizePhone,
  sendSms,
  createBookingReminder,
  cancelBookingReminders,
}
