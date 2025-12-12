import React, { createContext, useContext, useState, useCallback } from "react";

/* السياق */
const NotificationContext = createContext(null);
export const useNotification = () => useContext(NotificationContext);

/* مزوِّد */
export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  /* دالة الإظهار */
  const notify = useCallback(({ type = "info", message }) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}

      {/* Toast بسيط */}
      {notification && (
        <div
          className={`
            fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg
            text-white text-sm font-semibold
            ${
              notification.type === "success"
                ? "bg-green-600"
                : notification.type === "error"
                ? "bg-rose-600"
                : "bg-blue-600"
            }
          `}
        >
          {notification.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
}
