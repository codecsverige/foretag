// src/pages/Anvandningsvillkor.jsx
import React from "react";
import { Helmet } from "react-helmet-async";

export default function Anvandningsvillkor() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 bg-white rounded-xl shadow">
      <Helmet>
        <title>Användarvillkor | VägVänner</title>
      </Helmet>
      <h1 className="text-3xl font-bold mb-6 text-center">Användarvillkor</h1>

      <h2 className="text-xl font-semibold mt-8 mb-2">1. Om tjänsten</h2>
      <p>
        VägVänner är en digital plattform som kopplar samman förare och passagerare för samåkning. Plattformen är endast ett kontaktverktyg och är aldrig part i avtal eller kommunikation mellan användare.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Plattformens roll och ansvar</h2>
      <p>
        Plattformens enda roll är att förmedla kontaktuppgifter mellan förare och passagerare efter bekräftad bokning. All vidare kommunikation, överenskommelse och betalning sker direkt mellan användarna och utanför VägVänners kontroll och ansvar. Plattformen ansvarar inte för kvalitet, säkerhet, utförande eller ekonomisk uppgörelse gällande resor eller meddelanden mellan användare.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Användarens åtaganden</h2>
      <ul className="list-disc pl-6 mb-2">
        <li>Du ansvarar för att lämna korrekt information och följa svensk lag.</li>
        <li>Du får inte använda tjänsten för olagliga syften, spam eller trakasserier.</li>
        <li>Du ansvarar för din egen säkerhet, försäkringar, betalning och överenskommelser.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Avgifter och betalning</h2>
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3">
        <p className="text-blue-900 font-semibold text-sm mb-1">💡 Viktigt att förstå:</p>
        <p className="text-blue-800 text-xs">
          VägVänner tar ut en <strong>plattformsavgift</strong> (10 kr) för kontaktupplåsning. 
          Detta är avgift för annonsplattformens tjänst - <strong>INTE</strong> för själva resan. 
          Eventuell kostnadsdelning sker direkt mellan förare och passagerare utanför plattformen.
        </p>
      </div>
      <ul className="list-disc pl-6 mb-2">
        <li>Vid upplåsning av kontaktuppgifter tas en <strong>plattformsavgift</strong> ut (10 kr). Detta är inte resekostnad.</li>
        <li>Eventuella reskostnader (kostnadsdelning) mellan förare och passagerare regleras direkt mellan parterna. Plattformen deltar INTE i betalningen för resan.</li>
        <li>Plattformsavgifter återbetalas inte efter genomfört köp, utom vid godkänd rapport inom 48 timmar.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Missbruk & avstängning</h2>
      <p>
        Vid överträdelser av dessa villkor eller vid missbruk av tjänsten förbehåller vi oss rätten att stänga av eller ta bort användare och annonser utan återbetalning.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Personuppgifter och integritet</h2>
      <p>
        Behandling av personuppgifter sker enligt vår integritetspolicy. Vid bokning kan vissa uppgifter delas mellan parterna (exempelvis telefonnummer och, om du väljer, e‑post) för att möjliggöra kontakt. Vi deltar inte i kommunikationen mellan användare.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Ändringar</h2>
      <p>
        Vi kan när som helst ändra dessa villkor. Vid väsentliga ändringar informeras användare via plattformen eller e-post.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Tvist och tillämplig lag</h2>
      <p>
        Svensk lag gäller. Tvist avgörs i svensk domstol. Vid frågor, kontakta oss via <a href="mailto:support@vagvanner.se" className="underline text-blue-600">support@vagvanner.se</a>.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Kontakt och ansvarsfrihet</h2>
      <p>
        Plattformen tillhandahåller endast ett digitalt kontaktverktyg. Vi ansvarar inte för kommunikation, samtal, meddelanden, avtal, betalningar eller eventuella tvister mellan användare. Allt ansvar ligger hos respektive användare. Vi delger endast kontaktuppgifter (telefon, e-post) vid bokning och deltar aldrig i kommunikationen.
      </p>

      <div className="text-xs text-gray-500 mt-8">
        Senast uppdaterad: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
