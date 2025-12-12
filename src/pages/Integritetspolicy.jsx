// src/pages/Integritetspolicy.jsx
import React from "react";
import { Helmet } from "react-helmet-async";
import { LEGAL_CONTROLLER_NAME, LEGAL_EMAIL, LEGAL_ADDRESS } from "../config/legal.js";

export default function Integritetspolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 bg-white rounded-xl shadow">
      <Helmet>
        <title>Sekretesspolicy | VägVänner</title>
      </Helmet>
      <h1 className="text-3xl font-bold mb-6 text-center">Integritetspolicy</h1>
      <p>
        Denna sekretesspolicy förklarar hur VägVänner (“vi”, “oss”, “plattformen”) samlar in, behandlar och skyddar dina personuppgifter enligt Dataskyddsförordningen (GDPR) och svensk lag.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Vilka uppgifter samlas in?</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>Namn, e-postadress och telefonnummer vid kontoregistrering eller bokning/skapande av resa.</li>
        <li>Reseinformation, meddelanden, bokningar och användaraktivitet.</li>
        <li>Teknisk data såsom IP-adress, webbläsarinställningar och cookies.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Hur används dina uppgifter?</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>För att tillhandahålla och administrera samåkningstjänsten.</li>
        <li>För kontakt mellan förare och passagerare, endast efter bekräftad bokning.</li>
        <li>För support, säkerhet, statistik och lagstadgade krav.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Hur delas uppgifter?</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>Kontaktuppgifter (telefonnummer och e-post) delas endast mellan förare och passagerare vid bokning, så att parterna kan kontakta varandra direkt. Plattformen deltar aldrig i kommunikationen och tar inget ansvar för den.</li>
        <li>Vi lämnar aldrig ut dina uppgifter till tredje part för marknadsföring eller utanför plattformen, utom om det krävs enligt lag.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Personuppgiftsansvarig & Kontakt</h2>
      <p className="mb-2">
        Personuppgiftsansvarig: <strong>{LEGAL_CONTROLLER_NAME}</strong><br/>
        Adress: {LEGAL_ADDRESS}<br/>
        E‑post: <a href={`mailto:${LEGAL_EMAIL}`} className="underline text-blue-600">{LEGAL_EMAIL}</a>
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Dina rättigheter</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>Du har rätt att få tillgång till, rätta eller radera dina personuppgifter.</li>
        <li>Du kan begära begränsning eller invända mot behandling.</li>
        <li>Du har rätt till dataportabilitet och att återkalla samtycke.</li>
        <li>Kontakta oss på <a href={`mailto:${LEGAL_EMAIL}`} className="underline text-blue-600">{LEGAL_EMAIL}</a> för att utöva dina rättigheter.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Dataskydd och lagring</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>Dina uppgifter lagras på säkra servrar inom EU/EES eller hos leverantörer som är GDPR-kompatibla.</li>
        <li>Endast behörig personal har tillgång till dina uppgifter.</li>
        <li>Uppgifter sparas endast så länge det är nödvändigt för tjänstens syfte eller enligt lagkrav.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Rättslig grund och lagringstid</h2>
      <p>
        Vi behandlar dina uppgifter med stöd av berättigat intresse (drift, säkerhet och förbättring av plattformen),
        avtal (för att kunna tillhandahålla tjänsten) samt samtycke (exempelvis vid marknadsföring). Uppgifter
        sparas endast så länge som krävs för respektive ändamål eller enligt lagstadgade krav. Rese- och bokningsdata kan
        behållas i anonymiserad form för statistik och missbruksförebyggande ändamål.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Cookies</h2>
      <p>
        Vi använder endast nödvändiga cookies som krävs för att driva tjänsten (t.ex. inloggning, säkerhet, drift). Vi använder inte analys- eller marknadsföringscookies. Du kan blockera cookies i webbläsarens inställningar, men vissa funktioner kan då begränsas.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Dina val och kontakt</h2>
      <p>
        Vid frågor om integritet, kontakta oss på <a href={`mailto:${LEGAL_EMAIL}`} className="underline text-blue-600">{LEGAL_EMAIL}</a>.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">10. Mottagare & Överföringar</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>
          Personuppgifter behandlas i vår plattform och hos våra personuppgiftsbiträden, bl.a. Google Firebase (hosting och databas). 
          <strong className="text-blue-700"> OBS: VägVänner är en kommunikationsplattform och hanterar inga betalningar mellan användare.</strong>
        </li>
        <li>
          Lagring sker inom EU/EES där det är möjligt. Vid överföring till tredjeland tillämpas EU:s standardavtalsklausuler (SCC) och lämpliga skyddsåtgärder. Vi har personbiträdesavtal (DPA) med våra leverantörer och genomför bedömningar av överföringar (TIA) vid behov.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">11. Tillsynsmyndighet</h2>
      <p>
        Du har rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY):
        <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 ml-1">imy.se</a>
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">12. Minderåriga</h2>
      <p>
        Tjänsten riktar sig inte till barn under 16 år. Om du är vårdnadshavare och anser att barns uppgifter behandlats, kontakta oss för radering.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">13. Begäran om rättigheter</h2>
      <p>
        Vi besvarar förfrågningar om tillgång, rättelse, radering m.m. inom 30 dagar. Kontakta <a href={`mailto:${LEGAL_EMAIL}`} className="underline text-blue-600">{LEGAL_EMAIL}</a>.
      </p>
      <div className="text-xs text-gray-500 mt-8">
        Senast uppdaterad: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
