import React, { useState, useEffect, useCallback } from "react";
import { Car } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import useUnreadCount from "../hooks/useUnreadCount";
import MyRidesNavLink from "./MyRidesNavLink.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import useMyRidesNewEvents from "../hooks/useMyRidesNewEvents.js";
import NotificationBadge from "./ui/NotificationBadge.jsx";

/* شارة عدد الرسائل */
const Badge = ({ n }) =>
  n ? (
    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-[2px] flex items-center justify-center">
      {n > 99 ? "99+" : n}
    </span>
  ) : null;

// Préchargement des routes (React.lazy) au survol
const preloads = {
  home: () => import("../pages/SearchDynamic.jsx"),
  createRide: () => import("../pages/CreateRide.jsx"),
  inbox: () => import("../pages/Inbox.jsx"),
  myRides: () => import("../pages/MinaResor/index.jsx"),
  userProfile: () => import("../pages/UserProfilePage.jsx"),
};

const Header = function Header() {
  const { user, logout } = useAuth();
  const unread = useUnreadCount();
  const { sum: myRidesNewSum } = useMyRidesNewEvents();
  const { notify } = useNotification();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasShownOpenTip, setHasShownOpenTip] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Visa en kort in-app notis vid appstart om det finns nya händelser
  useEffect(() => {
    if (!user) return;
    const key = `vv_open_tip_${user.uid}`;
    const lastShown = parseInt(localStorage.getItem(key) || "0", 10);
    const TEN_MIN = 10 * 60 * 1000;
    const shouldShow = Date.now() - lastShown > TEN_MIN;
    const totalNew = (myRidesNewSum || 0) + (unread || 0);
    if (!hasShownOpenTip && shouldShow && totalNew > 0) {
      notify({
        type: "info",
        message: `Du har ${totalNew} nya händelser. Öppna Mina resor för att se.`,
      });
      localStorage.setItem(key, String(Date.now()));
      setHasShownOpenTip(true);
    }
  }, [user, myRidesNewSum, unread, hasShownOpenTip, notify]);

  // Handlers mémorisés
  const handleMenuToggle = useCallback(() => setMenuOpen((v) => !v), []);
  const handleMenuClose = useCallback(() => setMenuOpen(false), []);
  const handleLogout = useCallback(() => logout(), [logout]);

  // Feedback visuel rapide (ripple/surbrillance)
  const handleButtonClick = useCallback((e) => {
    const btn = e.currentTarget;
    btn.classList.add("ring-2", "ring-blue-600", "ring-opacity-40");
    setTimeout(() => btn.classList.remove("ring-2", "ring-blue-600", "ring-opacity-40"), 180);
  }, []);

  // Préchargement au survol
  const preload = useCallback((key) => {
    if (preloads[key]) preloads[key]();
  }, []);

  const baseLink = "transition font-medium text-xs md:text-sm px-3 py-1.5 tracking-wide rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/30";
  const linkClass = "text-gray-600 hover:text-brand";
  const activeLink = "text-brand font-semibold bg-gray-100";
  const buttonClass = "bg-brand hover:bg-brand-dark text-white px-3 py-1.5 rounded-full font-semibold text-xs md:text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-600/30";

  const menuLinks = (
    <>
      <NavLink
        to="/"
        className={({ isActive }) => `${baseLink} ${isActive ? activeLink : linkClass} group`}
        onMouseEnter={() => preload("home")}
        onClick={handleButtonClick}
      >
        <span className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-medium">Hem</span>
        </span>
      </NavLink>
      <NavLink
        to="/create-ride"
        className={({ isActive }) => `${baseLink} ${isActive ? activeLink : linkClass} group`}
        onMouseEnter={() => preload("createRide")}
        onClick={handleButtonClick}
      >
        <span className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 000-2h1a1 1 0 001 1v3a1 1 0 00.293.707L18 11.414V13a1 1 0 00-1 1h-1.05a2.5 2.5 0 01-4.9 0H9a1 1 0 01-1-1v-1a1 1 0 011-1h5V7z" />
            </svg>
          </div>
          <span className="font-medium">Erbjud resa</span>
        </span>
      </NavLink>
      {user && (
        <>
          <span onMouseEnter={() => preload("myRides")} className="relative inline-flex items-center">
            <MyRidesNavLink />
            {/* Förare aggregated notifications badge */}
            <NotificationBadge show={(myRidesNewSum || 0) > 0} count={myRidesNewSum || null} size="small" position="top-right" />
          </span>
          <NavLink
            to="/inbox"
            className={({ isActive }) => `relative ${baseLink} ${isActive ? activeLink : linkClass} group`}
            onMouseEnter={() => preload("inbox")}
            onClick={handleButtonClick}
          >
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 relative">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.94 6.412A2 2 0 002 8.108V16a2 2 0 002 2h12a2 2 0 002-2V8.108a2 2 0 00-.94-1.696l-6-3.75a2 2 0 00-2.12 0l-6 3.75zm2.615 2.423a1 1 0 10-1.11 1.664l5 3.333a1 1 0 001.11 0l5-3.333a1 1 0 00-1.11-1.664L10 11.798 5.555 8.835z" clipRule="evenodd" />
                </svg>
                <Badge n={unread} />
              </div>
              <span className="font-medium">Förare</span>
            </span>
          </NavLink>
          <NavLink
            to="/user-profile"
            className={({ isActive }) => `${baseLink} ${isActive ? activeLink : linkClass} group`}
            onMouseEnter={() => preload("userProfile")}
            onClick={handleButtonClick}
          >
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">Inställningar</span>
            </span>
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 transition ${scrolled ? "shadow-md" : ""}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-2 md:px-4 py-2 md:py-3">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2 text-[20px] md:text-[22px] font-extrabold text-brand tracking-tight select-none hover:text-blue-700 transition-all duration-300">
          <span className="inline-flex w-8 h-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/>
            </svg>
          </span>
          <span className="leading-none transition-all group-hover:scale-[1.02] duration-300 tracking-wide flex items-center gap-1 md:gap-1.5">
            <span>VägVänner</span>
            <Car className="w-4 h-4 md:w-5 md:h-5 opacity-90 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
        {/* Desktop */}
        <nav className="hidden md:flex items-center space-x-2">
          {menuLinks}
          {user ? (
            <button
              onClick={(e) => { handleLogout(); handleButtonClick(e); }}
              className={`${buttonClass} group flex items-center gap-2`}
            >
              <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 001-1h10.586l-2.293 2.293a1 1 0 001.414 1.414l4-4a1 1 0 000-1.414l-4-4a1 1 0 10-1.414 1.414L15.586 2H4a1 1 0 00-1 1z" clipRule="evenodd" />
              </svg>
              <span>Logga ut</span>
            </button>
          ) : (
            <NavLink
              to="/google-auth"
              className={`${buttonClass} group flex items-center gap-2`}
              onClick={handleButtonClick}
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 01-1-1h10.586l-2.293-2.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 11-1.414-1.414L15.586 6H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>Logga in</span>
            </NavLink>
          )}
        </nav>
        {/* Hamburger */}
        <button
          onClick={handleMenuToggle}
          className="md:hidden p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30 shadow-sm hover:shadow-md transition-all duration-200 group"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2.5">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>
      {/* Mobile */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${menuOpen ? "max-h-[500px]" : "max-h-0"}`}>
        <nav className="flex flex-col bg-white border-t divide-y text-gray-700 text-xs">
          <NavLink to="/" onClick={handleMenuClose} className="px-5 py-3 hover:bg-gray-50 flex items-center gap-3" onMouseEnter={() => preload("home")}>
            <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
              </svg>
            </div>
            <span>Hem</span>
          </NavLink>
          <NavLink to="/create-ride" onClick={handleMenuClose} className="px-5 py-3 hover:bg-gray-50 flex items-center gap-3" onMouseEnter={() => preload("createRide")}>
            <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
              </svg>
            </div>
            <span>Erbjud resa</span>
          </NavLink>
          {user ? (
            <>
              <div onClick={handleMenuClose} className="px-5 py-3 hover:bg-gray-50" onMouseEnter={() => preload("myRides")}> <MyRidesNavLink /> </div>
              <NavLink to="/inbox" onClick={handleMenuClose} className="relative px-5 py-3 hover:bg-gray-50 flex items-center gap-3" onMouseEnter={() => preload("inbox")}>
                <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.94 6.412A2 2 0 002 8.108V16a2 2 0 002 2h12a2 2 0 002-2V8.108a2 2 0 00-.94-1.696l-6-3.75a2 2 0 00-2.12 0l-6 3.75z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Förare</span>
                <Badge n={unread} />
              </NavLink>
              <NavLink to="/user-profile" onClick={handleMenuClose} className="px-5 py-3 hover:bg-gray-50 flex items-center gap-3" onMouseEnter={() => preload("userProfile")}>
                <div className="w-4 h-4 rounded bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Inställningar</span>
              </NavLink>
              <button
                onClick={(e) => { handleLogout(); handleButtonClick(e); handleMenuClose(); }}
                className="text-left w-full px-5 py-3 text-red-600 hover:bg-red-50 flex items-center gap-3"
              >
                <div className="w-4 h-4 rounded bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 001-1h10.586l-2.293 2.293a1 1 0 001.414 1.414l4-4a1 1 0 000-1.414l-4-4a1 1 0 10-1.414 1.414L15.586 2H4a1 1 0 00-1 1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Logga ut</span>
              </button>
            </>
          ) : (
            <NavLink to="/google-auth" onClick={handleMenuClose} className="px-5 py-3 hover:bg-blue-50 text-blue-600 flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 01-1-1h10.586l-2.293-2.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 11-1.414-1.414L15.586 6H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Logga in</span>
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

export default React.memo(Header);
