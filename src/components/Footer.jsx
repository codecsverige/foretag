import React from "react";
import { Link } from "react-router-dom";
import { SUPPORT_EMAIL, LEGAL_PHONE } from "../config/legal.js";

export default function Footer() {
  const links = [
    { to: "/",              label: "Hem" },
    { to: "/create-ride",   label: "Skapa resa" },
    { to: "/samakning",     label: "Samåkning" },
    { to: "/student-guide", label: "För studenter" },
    { to: "/commuter-guide", label: "För arbetspendlare" },
    { to: "/no-car-guide", label: "Utan bil" },
    { to: "/travel-tips", label: "Resenärstips" },
    { to: "/inbox",         label: "Inkorg" },
    { to: "/user-profile",  label: "Min profil" },
    { to: "/my-rides",      label: "Mina resor" },
  ];
  const legalLinks = [
    { to: "/cookiepolicy",       label: "Cookiepolicy" },
    { to: "/integritetspolicy",  label: "Integritetspolicy" },
    { to: "/anvandningsvillkor", label: "Användarvillkor" },
  ];

  const popularRoutes = [
    { href: "/ride/stockholm-goteborg", label: "Stockholm → Göteborg" },
    { href: "/ride/goteborg-stockholm", label: "Göteborg → Stockholm" },
    { href: "/ride/malmo-stockholm",    label: "Malmö → Stockholm" },
    { href: "/ride/uppsala-stockholm",  label: "Uppsala → Stockholm" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        {/* Branding */}
        <div>
          <h3 className="text-xl font-extrabold text-white mb-4">🚗 VägVänner</h3>
          <p className="text-sm leading-relaxed">
            Din samåkningsplattform i Sverige.
          </p>
          <p className="mt-3 text-sm text-gray-400">
            © {new Date().getFullYear()} VägVänner.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-3">Snabblänkar</h4>
          <ul className="space-y-2 text-sm">
            {links.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="hover:text-white transition">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-white font-semibold mb-3">Juridik</h4>
          <ul className="space-y-2 text-sm">
            {legalLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="hover:text-white transition">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Popular Routes */}
        <div>
          <h4 className="text-white font-semibold mb-3">Populära rutter</h4>
          <ul className="space-y-2 text-sm">
            {popularRoutes.map(({ href, label }) => (
              <li key={href}>
                <a href={href} className="hover:text-white transition">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact & Social */}
        <div>
          <h4 className="text-white font-semibold mb-3">Kontakt</h4>
          <p className="text-sm">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="hover:text-white transition"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="mt-2 text-sm">📞 {LEGAL_PHONE}</p>

          <h4 className="text-white font-semibold mt-6 mb-3">Följ oss</h4>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="https://www.facebook.com/vagvanner" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              Facebook
            </a>
            <a href="https://www.instagram.com/vagvanner" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              Instagram
            </a>
            <a href="https://www.linkedin.com/company/vagvanner" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
