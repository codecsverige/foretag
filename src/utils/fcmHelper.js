// FCM Helper - Handle FCM token issues and provide reset mechanism
import { deleteToken, getToken } from 'firebase/messaging';
import { messaging } from '../firebase/firebase.js';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

/**
 * Reset FCM token - useful when push service errors occur
 * This function will:
 * 1. Delete the current FCM token
 * 2. Delete the FCM document in Firestore
 * 3. Clear local storage flags
 * 4. Force a new token request
 */
export async function resetFcmToken(userEmail) {
  try {
    // 1. Delete current FCM token from browser
    if (messaging) {
      try {
        await deleteToken(messaging);
      } catch (e) {
        // Token might not exist, continue
      }
    }
    
    // 2. Delete FCM document from Firestore
    if (userEmail) {
      const normalizedEmail = userEmail.trim().toLowerCase();
      try {
        await deleteDoc(doc(db, 'user_fcm_by_email', normalizedEmail));
      } catch (e) {
        // Document might not exist, continue
      }
    }
    
    // 3. Clear local storage flags
    localStorage.removeItem('push_setup_done');
    localStorage.removeItem('fcm_token_timestamp');
    
    // 4. Force page reload to reinitialize
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error('Failed to reset FCM token:', error);
    return false;
  }
}

/**
 * Check if FCM token needs refresh (older than 7 days)
 */
export function shouldRefreshFcmToken() {
  const timestamp = localStorage.getItem('fcm_token_timestamp');
  if (!timestamp) return true;
  
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return parseInt(timestamp) < sevenDaysAgo;
}

/**
 * Save FCM token timestamp
 */
export function saveFcmTokenTimestamp() {
  localStorage.setItem('fcm_token_timestamp', Date.now().toString());
}