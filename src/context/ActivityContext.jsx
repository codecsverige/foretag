import React, { createContext, useContext, useEffect, useState } from "react";

/* إنشاء السياق */
const ActivityContext = createContext(null);
export const useActivity = () => useContext(ActivityContext);

/* تبويبات MyRides الأربعة */
const KEYS = ["driver", "passenger", "bookings", "unlocks"];

/* helpers للتخزين المحلى */
const STORAGE = "vv_lastSeen";
const now     = () => Date.now();
const load    = () => {
  try   { return JSON.parse(localStorage.getItem(STORAGE) || "{}"); }
  catch { return {}; }
};
const save = (obj) => localStorage.setItem(STORAGE, JSON.stringify(obj));

/* المزوِّد */
export function ActivityProvider({ children }) {
  const [lastSeen, setLastSeen] = useState(() => load());

  /* استدعِها عند فتح تبويب */
  const markSeen = (tab) => {
    const updated = { ...lastSeen, [tab]: now() };
    setLastSeen(updated);
    save(updated);
  };

  const last = (tab) => lastSeen[tab] || 0;

  /* مزوّد القيمة */
  return (
    <ActivityContext.Provider value={{ KEYS, last, markSeen }}>
      {children}
    </ActivityContext.Provider>
  );
}
