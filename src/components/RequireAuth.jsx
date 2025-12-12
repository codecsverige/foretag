import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { useAuth } from "../context/AuthContext";

export function RequireAuth() {
  const { user, authLoading } = useAuth();
  const loc = useLocation();
  const [checked, setChecked] = useState(false);

  // فرض reload() مرّة لضمان صلاحية الـ ID-Token
  useEffect(() => {
    (async () => {
      try { await getAuth().currentUser?.reload(); }
      finally { setChecked(true); }
    })();
  }, []);

  if (authLoading || !checked) {
    return <p className="text-center py-12 animate-pulse">Laddar användare…</p>;
  }
  if (!user) {
    // نمرّر search للحفاظ على rideId مثلاً
    return (
      <Navigate
        to={`/google-auth${loc.search}`}
        state={{ from: loc }}
        replace
      />
    );
  }
  return <Outlet />;
}
