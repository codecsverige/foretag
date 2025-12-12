import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../services/analytics.js";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Spåra sidvisning i Google Analytics
    trackPageView(pathname, document.title);
  }, [pathname]);

  return null;
}
