import React from 'react';
import { Helmet } from 'react-helmet-async';
import { LEGAL_CONTROLLER_NAME, LEGAL_EMAIL, LEGAL_PHONE, LEGAL_ADDRESS } from "../config/legal.js";

const KontaktJuridik = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Helmet>
        <title>Kontakt & Juridik - VägVänner</title>
        <meta name="description" content="Juridisk kontaktinformation för VägVänner" />
      </Helmet>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Kontakt & Juridik
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* معلومات الشركة */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Företagsinformation
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div><strong>Personuppgiftsansvarig:</strong> {LEGAL_CONTROLLER_NAME}</div>
              <div><strong>Adress:</strong> {LEGAL_ADDRESS}</div>
              <div><strong>Land:</strong> Sverige</div>
            </div>
          </section>

          {/* معلومات الاتصال */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Kontaktinformation
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div><strong>E‑post:</strong> <a href={`mailto:${LEGAL_EMAIL}`} className="text-blue-600 hover:underline ml-2">{LEGAL_EMAIL}</a></div>
              <div><strong>Telefon:</strong> <span className="ml-2">{LEGAL_PHONE}</span></div>
            </div>
          </section>
        </div>

        {/* معلومات قانونية إضافية */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Juridisk Information
          </h2>
          
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Digital Services Act (DSA) Compliance
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                VägVänner följer EU:s Digital Services Act (DSA) och tillhandahåller transparent 
                kontaktinformation för användare och myndigheter.
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-xs mt-2">
                Rättslig kontaktpunkt: <a href={`mailto:${LEGAL_EMAIL}`} className="underline">{LEGAL_EMAIL}</a>
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Rapportering av Innehåll
              </h3>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Användare kan rapportera olämpligt innehåll via plattformen. 
                Vi åtar oss att granska rapporter inom 48 timmar enligt DSA-kraven.
              </p>
              <p className="text-green-700 dark:text-green-300 text-xs mt-2">
                Rapportera via "Rapportera problem" eller e‑post: <a href={`mailto:${LEGAL_EMAIL}`} className="underline">{LEGAL_EMAIL}</a>
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Skatte- och Försäkringsansvar
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                VägVänner är endast en förmedlingstjänst. Förare och passagerare ansvarar själva 
                för skatte- och försäkringsaspekter enligt svensk lag.
              </p>
            </div>
          </div>
        </section>

        {/* روابط مهمة */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Viktiga Länkar
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a 
              href="/anvandningsvillkor" 
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Användningsvillkor
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Våra användarvillkor och ansvarsbegränsningar
              </p>
            </a>
            
            <a 
              href="/integritetspolicy" 
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Integritetspolicy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hur vi hanterar dina personuppgifter
              </p>
            </a>
            
            <a 
              href="/cookiepolicy" 
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Cookie Policy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Information om cookies och spårning
              </p>
            </a>
            
            <div className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Rapportera Problem
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Använd "Rapportera annons" funktionen på respektive annons
              </p>
            </div>
          </div>
        </section>

        {/* ملاحظة ختامية */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Senast uppdaterad:</strong> {new Date().toLocaleDateString('sv-SE')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Denna information uppdateras regelbundet för att säkerställa compliance med gällande lagar och regler.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KontaktJuridik; 