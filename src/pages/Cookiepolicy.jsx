// src/pages/Cookiepolicy.jsx
import React from "react";
import { LEGAL_EMAIL } from "../config/legal.js";
import { Helmet } from "react-helmet-async";

export default function Cookiepolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 bg-white rounded-xl shadow">
      <Helmet>
        <title>Cookiepolicy | VägVänner</title>
      </Helmet>
      <h1 className="text-3xl font-bold mb-6 text-center">Cookiepolicy</h1>
      <p>
        VägVänner använder cookies och liknande teknologier för att förbättra din användarupplevelse.  
        Cookies hjälper oss att:
      </p>
      <ul className="list-disc pl-6 mb-2">
        <li>Komma ihåg dina inställningar och inloggning</li>
        <li>Skydda din information och säkerhet</li>
      </ul>
      <p>
        Vi använder endast nödvändiga cookies (inga analys- eller marknadsföringscookies) och lämnar aldrig ut data till tredje part.  
        Du kan alltid välja att blockera cookies i webbläsarens inställningar, men vissa funktioner kan då begränsas.
      </p>
      <p>
        Vid frågor om cookies, kontakta <a href={`mailto:${LEGAL_EMAIL}`} className="underline text-blue-600">{LEGAL_EMAIL}</a>.
      </p>
      <div className="text-xs text-gray-500 mt-8">
        Senast uppdaterad: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
