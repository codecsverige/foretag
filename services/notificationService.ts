/**
 * Notification Service - BokaNära
 * Hanterar in-app notifikationer och push-meddelanden
 */

import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Notification {
  id?: string
  userEmail: string
  userName?: string
  title: string
  body: string
  type: 'info' | 'success' | 'warning' | 'error'
  createdAt: number
  read: boolean
  route?: string
}

/**
 * Skicka en notifikation till en användare
 */
export async function sendNotification(
  userEmail: string,
  title: string,
  body: string,
  userName = '',
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  route?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!userEmail) {
      throw new Error('Email användare krävs')
    }

    const normalizedEmail = userEmail.trim().toLowerCase()
  
    const notificationData: Omit<Notification, 'id'> = {
      userEmail: normalizedEmail,
      userName,
      title,
      body,
      type,
      createdAt: Date.now(),
      read: false,
      ...(route && { route })
    }

    const docRef = await addDoc(collection(db, 'notifications'), notificationData)
    
    console.log('✅ Notifikation skickad:', docRef.id)
    
    return {
      success: true,
      id: docRef.id
    }
  } catch (error: any) {
    console.error('❌ Fel vid notifikation:', error)
    return {
      success: false,
      error: error.message || 'Okänt fel'
    }
  }
}

/**
 * Hämta användarens notifikationer
 */
export async function getUserNotifications(
  userEmail: string,
  limitCount = 50
): Promise<Notification[]> {
  try {
    const normalizedEmail = userEmail.trim().toLowerCase()
    
    const q = query(
      collection(db, 'notifications'),
      where('userEmail', '==', normalizedEmail),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[]
  } catch (error) {
    console.error('Fel vid hämtning av notifikationer:', error)
    return []
  }
}

/**
 * Markera notifikation som läst
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    })
    return true
  } catch (error) {
    console.error('Fel vid markering som läst:', error)
    return false
  }
}

/**
 * Markera alla notifikationer som lästa
 */
export async function markAllAsRead(userEmail: string): Promise<boolean> {
  try {
    const normalizedEmail = userEmail.trim().toLowerCase()
    
    const q = query(
      collection(db, 'notifications'),
      where('userEmail', '==', normalizedEmail),
      where('read', '==', false)
    )
    
    const snapshot = await getDocs(q)
    
    const promises = snapshot.docs.map(d => 
      updateDoc(d.ref, { read: true })
    )
    
    await Promise.all(promises)
    return true
  } catch (error) {
    console.error('Fel vid markering alla som lästa:', error)
    return false
  }
}

/**
 * Ta bort en notifikation
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId))
    return true
  } catch (error) {
    console.error('Fel vid borttagning:', error)
    return false
  }
}

// === BokaNära Specifika Notifikationer ===

/**
 * Notifikation för ny bokning (till företaget)
 */
export async function sendNewBookingNotification(
  businessEmail: string,
  businessName: string,
  customerName: string,
  serviceName: string,
  date: string,
  time: string
): Promise<{ success: boolean; error?: string }> {
  const title = '📅 Ny bokning!'
  const body = `${customerName} har bokat ${serviceName}.\n\n📆 ${date} kl. ${time}\n\nÖppna BokaNära för att se detaljer.`
  
  return sendNotification(businessEmail, title, body, businessName, 'info', '/konto')
}

/**
 * Notifikation för bekräftad bokning (till kunden)
 */
export async function sendBookingConfirmedNotification(
  customerEmail: string,
  customerName: string,
  businessName: string,
  serviceName: string,
  date: string,
  time: string
): Promise<{ success: boolean; error?: string }> {
  const title = '✅ Bokning bekräftad!'
  const body = `Din bokning hos ${businessName} är bekräftad!\n\n📍 ${serviceName}\n📆 ${date} kl. ${time}\n\nVi skickar en SMS-påminnelse innan din tid.`
  
  return sendNotification(customerEmail, title, body, customerName, 'success', '/konto')
}

/**
 * Notifikation för avbokad bokning
 */
export async function sendBookingCancelledNotification(
  email: string,
  name: string,
  businessName: string,
  serviceName: string,
  date: string,
  cancelledBy: 'customer' | 'business'
): Promise<{ success: boolean; error?: string }> {
  const title = cancelledBy === 'business' 
    ? '❌ Bokning avbokad av företaget'
    : '✅ Din avbokning är bekräftad'
    
  const body = cancelledBy === 'business'
    ? `Tyvärr har ${businessName} avbokat din tid för ${serviceName} den ${date}.\n\nSök gärna efter andra tider på BokaNära.`
    : `Din bokning för ${serviceName} hos ${businessName} den ${date} har avbokats.\n\nDu är välkommen att boka en ny tid.`
  
  return sendNotification(email, title, body, name, cancelledBy === 'business' ? 'warning' : 'info')
}

/**
 * Notifikation för ny recension (till företaget)
 */
export async function sendNewReviewNotification(
  businessEmail: string,
  businessName: string,
  rating: number,
  reviewerName: string
): Promise<{ success: boolean; error?: string }> {
  const stars = '⭐'.repeat(rating)
  const title = `${stars} Ny recension!`
  const body = `${reviewerName} har lämnat en recension med ${rating} stjärnor.\n\nÖppna BokaNära för att läsa och svara.`
  
  return sendNotification(businessEmail, title, body, businessName, 'info', '/konto')
}

/**
 * Påminnelse om bokning (24h före)
 */
export async function sendBookingReminderNotification(
  customerEmail: string,
  customerName: string,
  businessName: string,
  serviceName: string,
  date: string,
  time: string
): Promise<{ success: boolean; error?: string }> {
  const title = '⏰ Påminnelse: Bokning imorgon'
  const body = `Glöm inte din bokning hos ${businessName}!\n\n📍 ${serviceName}\n📆 ${date} kl. ${time}\n\nVi ses snart!`
  
  return sendNotification(customerEmail, title, body, customerName, 'info')
}

export default {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNewBookingNotification,
  sendBookingConfirmedNotification,
  sendBookingCancelledNotification,
  sendNewReviewNotification,
  sendBookingReminderNotification,
}
