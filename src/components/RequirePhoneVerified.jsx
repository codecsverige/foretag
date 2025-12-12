// src/components/RequirePhoneVerified.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

export function RequirePhoneVerified() {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return <Loader />;

  const returnPath = location.pathname + location.search;

  if (!user) {
    return (
      <Navigate
        to={`/google-auth?return=${encodeURIComponent(returnPath)}`}
        replace
      />
    );
  }

  if (!user.phoneNumber) {
    return (
      <Navigate
        to={`/verify-phone?return=${encodeURIComponent(returnPath)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
