import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function useVerifiedPhone() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading) return;

    const fullPath = location.pathname + location.search;

    if (!user) {
      navigate(
        `/google-auth?return=${encodeURIComponent(fullPath)}`,
        { replace: true }
      );
      return;
    }

    if (!user.phoneNumber && !fullPath.startsWith("/verify-phone")) {
      navigate(
        `/verify-phone?return=${encodeURIComponent(fullPath)}`,
        { replace: true }
      );
    }
  }, [
    authLoading,
    user,
    navigate,
    location.pathname,
    location.search
  ]);

  return {
    loading: authLoading,
    phone: user?.phoneNumber
  };
}
