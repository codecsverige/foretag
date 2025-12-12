/* ────────────────────────────────────────────────
   src/hooks/useWelcomeNotifications.js
   Hook لإشعارات الترحيب عند دخول المستخدم
──────────────────────────────────────────────── */

import { useState, useEffect } from 'react';

export function useWelcomeNotifications({ 
  newDriver, 
  newBookings, 
  newUnlocks,
  newDriverCount,
  newBookingsCount,
  newUnlocksCount 
}) {
  const [welcomeNotification, setWelcomeNotification] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Visa endast om det finns nya uppdateringar
    if (newDriver || newBookings || newUnlocks) {
      const notifications = [];
      
      if (newDriver && newDriverCount > 0) {
        notifications.push(`${newDriverCount} nya bokningar på dina resor`);
      }
      
      if (newBookings && newBookingsCount > 0) {
        notifications.push(`${newBookingsCount} uppdateringar i dina bokningar`);
      }
      
      if (newUnlocks && newUnlocksCount > 0) {
        notifications.push(`${newUnlocksCount} nya upplåsningar av kontaktuppgifter`);
      }

      if (notifications.length > 0) {
        setWelcomeNotification({
          title: "Välkommen tillbaka! 👋",
          message: notifications.join(" • "),
          type: "welcome"
        });
        setShowWelcome(true);
        
        // إخفاء الإشعار بعد 5 ثوان
        setTimeout(() => {
          setShowWelcome(false);
        }, 5000);
      }
    }
  }, [newDriver, newBookings, newUnlocks, newDriverCount, newBookingsCount, newUnlocksCount]);

  const dismissWelcome = () => {
    setShowWelcome(false);
  };

  return {
    welcomeNotification,
    showWelcome,
    dismissWelcome
  };
}