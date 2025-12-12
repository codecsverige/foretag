import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resetFcmToken } from '../utils/fcmHelper';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [notificationStatus, setNotificationStatus] = useState('checking');
  const [fcmStatus, setFcmStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    checkNotificationStatus();
  }, [user]);
  
  const checkNotificationStatus = async () => {
    // Check browser notification permission
    if (!('Notification' in window)) {
      setNotificationStatus('not-supported');
      return;
    }
    
    setNotificationStatus(Notification.permission);
    
    // Check FCM token status
    if (user?.email) {
      try {
        const normalizedEmail = user.email.trim().toLowerCase();
        const fcmDoc = await getDoc(doc(db, 'user_fcm_by_email', normalizedEmail));
        
        if (fcmDoc.exists()) {
          const data = fcmDoc.data();
          const hasTokens = data.tokens && Object.keys(data.tokens).length > 0;
          setFcmStatus(hasTokens ? 'active' : 'no-tokens');
        } else {
          setFcmStatus('not-registered');
        }
      } catch (e) {
        setFcmStatus('error');
      }
    }
  };
  
  const handleResetNotifications = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      await resetFcmToken(user.email);
      // Page will reload automatically
    } catch (e) {
      console.error('Failed to reset notifications:', e);
      setLoading(false);
    }
  };
  
  const handleRequestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      
      if (permission === 'granted') {
        // Reload page to trigger FCM setup
        window.location.reload();
      }
    } catch (e) {
      console.error('Failed to request permission:', e);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Notifikationsinställningar</h3>
      
      {/* Notification Permission Status */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Webbläsarnotifikationer</h4>
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-block w-3 h-3 rounded-full ${
            notificationStatus === 'granted' ? 'bg-green-500' : 
            notificationStatus === 'denied' ? 'bg-red-500' : 
            'bg-yellow-500'
          }`}></span>
          <span className="text-sm">
            {notificationStatus === 'granted' ? 'Aktiverad' :
             notificationStatus === 'denied' ? 'Blockerad (kontrollera webbläsarinställningar)' :
             notificationStatus === 'default' ? 'Inte beviljad' :
             notificationStatus === 'not-supported' ? 'Stöds inte i denna webbläsare' :
             'Kontrollerar...'}
          </span>
        </div>
        
        {notificationStatus === 'default' && (
          <button
            onClick={handleRequestPermission}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Begär tillstånd
          </button>
        )}
      </div>
      
      {/* FCM Token Status */}
      {user && (
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">Push-notifikationer</h4>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-block w-3 h-3 rounded-full ${
              fcmStatus === 'active' ? 'bg-green-500' : 
              fcmStatus === 'error' ? 'bg-red-500' : 
              'bg-yellow-500'
            }`}></span>
            <span className="text-sm">
              {fcmStatus === 'active' ? 'Aktiv' :
               fcmStatus === 'no-tokens' ? 'Inga aktiva tokens' :
               fcmStatus === 'not-registered' ? 'Inte registrerad' :
               fcmStatus === 'error' ? 'Fel vid kontroll' :
               'Kontrollerar...'}
            </span>
          </div>
        </div>
      )}
      
      {/* Reset Button */}
      {user && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Om du har problem med notifikationer, kan du återställa dina inställningar.
          </p>
          <button
            onClick={handleResetNotifications}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm"
          >
            {loading ? 'Återställer...' : 'Återställ notifikationer'}
          </button>
        </div>
      )}
    </div>
  );
}