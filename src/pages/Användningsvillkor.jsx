import React from 'react';
import { Helmet } from 'react-helmet-async';
import { LEGAL_CONTROLLER_NAME, LEGAL_EMAIL, LEGAL_ADDRESS } from "../config/legal.js";

const Användningsvillkor = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Helmet>
        <title>Användningsvillkor - VägVänner</title>
        <meta name="description" content="Användningsvillkor för VägVänner - samåkningsplattform" />
      </Helmet>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Användningsvillkor
        </h1>

        {/* KRITISK VARNING LÄNGST UPP */}
        <div className="mb-8 p-6 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 border-l-8 border-red-600 rounded-r-xl">
          <div className="flex items-start gap-4">
            <span className="text-5xl">⚠️</span>
            <div>
              <h2 className="text-2xl font-bold text-red-900 dark:text-red-200 mb-3">
                EXTREMT VIKTIGT - Läs innan du använder VägVänner
              </h2>
              <div className="space-y-2 text-red-800 dark:text-red-300">
                <p className="font-semibold text-lg">
                  VägVänner är ENDAST för privat icke-kommersiell samåkning!
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li><strong>FÖRBJUDET:</strong> Yrkesmässig persontransport (taxi, Uber-liknande verksamhet)</li>
                  <li><strong>TILLÅTET:</strong> Kostnadsdelning (bensin, slitage) mellan privatpersoner</li>
                  <li><strong>INGET ANSVAR:</strong> VägVänner ansvarar INTE för resor, skador, olyckor eller försäkring</li>
                  <li><strong>LAGKRAV:</strong> Daglig regelbunden samåkning kan kräva tillstånd från Transportstyrelsen</li>
                </ul>
                <p className="mt-3 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded border border-yellow-400">
                  🚨 Du använder plattformen på EGEN RISK. Kontrollera alltid din försäkring och följ svensk lag!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              1. Tjänstebeskrivning
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              VägVänner är en <strong>digital kommunikationsplattform</strong> som fungerar som ett socialt nätverk för resenärer. 
              Vi tillhandahåller endast en teknisk infrastruktur för att koppla ihop förare och passagerare genom meddelanden och chattfunktioner.
            </p>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 p-4 my-4">
              <p className="text-blue-900 dark:text-blue-200 text-sm font-semibold mb-2">
                📢 VägVänner är en KOMMUNIKATIONSPLATTFORM - inte en transporttjänst. 
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc pl-5">
                <li>Vi tillhandahåller endast verktyg för kommunikation mellan resenärer</li>
                <li>Avtalet sluts direkt mellan förare och passagerare</li>
                <li>Vi hanterar INGA betalningar och står ALDRIG som part i avtalet</li>
                <li>Vi är INTE en transporttjänst eller taxiförmedling</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              2. Ansvarsbegränsning och Roll
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                <strong>VIKTIGT:</strong> VägVänner är endast en förmedlingstjänst (annonsplattform). 
                Avtalet om samåkning sluts direkt mellan förare och passagerare.
              </p>
            </div>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>VägVänner ansvarar inte för fordonets tekniska skick eller säkerhet</li>
              <li>Vi ansvarar inte för förarens körkort, försäkring eller kompetens</li>
              <li>Vi ansvarar inte för förseningar, inställda resor eller eventuella skador</li>
              <li>Vi hanterar inte betalningar för själva resan mellan förare och passagerare</li>
              <li>Vi står inte som part i avtalet mellan förare och passagerare</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              3. Förarens Ansvar
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Föraren ansvarar för att:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Ha ett giltigt körkort och vara behörig att köra fordonet</li>
              <li>Ha giltig trafikförsäkring (trafikförsäkring) som krävs enligt svensk lag</li>
              <li>Fordonet ska vara i lagligt skick och godkänd för trafik</li>
              <li>Följa alla trafikregler och säkerhetsföreskrifter</li>
              <li>Deklarera eventuell inkomst från samåkning till Skatteverket</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              4. Passagerarens Ansvar
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Passageraren ansvarar för att:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Betala den överenskomna ersättningen direkt till föraren</li>
              <li>Följa förarens instruktioner under resan</li>
              <li>Vara punktlig vid avtalad avgångstid</li>
              <li>Respektera fordonet och andra passagerare</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              5. Skatte- och Försäkringsaspekter
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 mb-4">
              <p className="text-blue-800 dark:text-blue-200">
                <strong>VIKTIGT:</strong> Samåkning där ersättningen överstiger rena kostnadsdelningen 
                kan betraktas som yrkesmässig trafik och måste deklareras enligt Skatteverket.
              </p>
            </div>
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">11. Kontakt & Juridik</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Personuppgiftsansvarig: <strong>{LEGAL_CONTROLLER_NAME}</strong>
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">Adress: {LEGAL_ADDRESS}</p>
            <p className="text-gray-700 dark:text-gray-300">
              Juridisk kontakt: <a href={`mailto:${LEGAL_EMAIL}`} className="text-blue-600 underline">{LEGAL_EMAIL}</a>
            </p>
          </section>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Både förare och passagerare ansvarar för att följa gällande skatte- och försäkringsregler.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              6. Kostnadsdelning och Icke-Kommersiell Verksamhet
            </h2>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mb-4 flex items-center gap-2">
                <span>✅</span> VägVänner tillåter ENDAST icke-kommersiell samåkning
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">✅ TILLÅTET:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-green-700 dark:text-green-400">
                    <li>Kostnadsdelning (bensin, slitage, vägavgifter)</li>
                    <li>Ingen ersättning</li>
                    <li>Endast sällskap</li>
                    <li>Sporadisk/tillfällig samåkning</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">❌ FÖRBJUDET:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-red-700 dark:text-red-400">
                    <li>Yrkesmässig persontransport</li>
                    <li>Taxi eller Uber-liknande verksamhet</li>
                    <li>Fast pris över faktiska kostnader</li>
                    <li>Vinst från samåkning</li>
                    <li>Kommersiell verksamhet utan tillstånd</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-4">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                ⚠️ Enligt Skatteverket och Transportstyrelsen:
              </h4>
              <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-2">
                <li>
                  <strong>Kostnadsdelning:</strong> Dela endast faktiska kostnader (bensin ~1.5 kr/km + slitage ~0.8 kr/km). 
                  Detta är INTE skattepliktig inkomst.
                </li>
                <li>
                  <strong>Ersättning över kostnader:</strong> Betraktas som inkomst och måste deklareras till Skatteverket.
                </li>
                <li>
                  <strong>Regelbunden daglig samåkning:</strong> Kan kräva tillstånd från Transportstyrelsen 
                  även vid kostnadsdelning. Kontakta <a href="https://www.transportstyrelsen.se" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Transportstyrelsen</a> vid osäkerhet.
                </li>
              </ul>
            </div>

            <p className="text-gray-700 dark:text-gray-300 text-sm">
              <strong>VägVänner hanterar INTE betalningar</strong> mellan förare och passagerare. 
              All ekonomisk uppgörelse sker privat mellan parterna.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              7. Plattformens Avgifter
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-400 rounded-xl p-6 mb-4">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                <span>💬</span> VägVänner - Kommunikationsplattform
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                VägVänner är en <strong>digital kommunikationsplattform</strong> där du kan hitta och kontakta resenärer.
              </p>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Grundfunktioner utan avgift:</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>✅ Använda plattformen</li>
                  <li>✅ Söka och skapa resor</li>
                  <li>✅ Kommunicera med andra användare</li>
                  <li>✅ Dela kontaktinformation</li>
                  <li>✅ Skicka och ta emot meddelanden</li>
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg text-sm">
                <p className="text-amber-800 dark:text-amber-300">
                  💡 <strong>Viktigt:</strong> VägVänner är ett socialt nätverk och kommunikationsverktyg - 
                  vi är <strong>INTE</strong> en transporttjänst eller part i några avtal mellan användare. 
                  Alla överenskommelser om resor och kostnadsdelning sker direkt mellan användare, utanför plattformen.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  <strong>Framtida utveckling:</strong> Vi kan introducera frivilliga Premium-funktioner 
                  (t.ex. extra verktyg, statistik, prioriterad visning) som kan medföra en avgift, 
                  men grundfunktionerna för kommunikation förblir tillgängliga.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              8. Rapportering och Moderering
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Användare kan rapportera olämpliga annonser eller beteenden. 
              Vi åtar oss att granska rapporterade inlägg inom 48 timmar och ta bort innehåll som bryter mot våra riktlinjer.
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              Rapportera via knappen "Rapportera problem" i gränssnittet eller genom att kontakta oss på {" "}
              <a href={`mailto:${LEGAL_EMAIL}`} className="text-blue-600 underline">{LEGAL_EMAIL}</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              8. Kontaktinformation
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Juridisk kontakt:</strong>
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                VägVänner
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                E-post: {LEGAL_EMAIL}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                Adress: {LEGAL_ADDRESS}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                VägVänner drivs för närvarande av privatperson. Vid köp övergår ansvaret till den nya ägaren.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              9. Ändringar i Villkoren
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Vi förbehåller oss rätten att ändra dessa villkor. Vid väsentliga ändringar kommer användare att meddelas 
              via e-post eller genom meddelande på plattformen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              10. Tillämplig Lag
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Dessa villkor regleras av svensk lag. Eventuella tvister ska avgöras av svenska domstolar.
            </p>
          </section>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Användningsvillkor; 