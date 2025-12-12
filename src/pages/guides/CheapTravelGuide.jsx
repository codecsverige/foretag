import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function CheapTravelGuide() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Helmet>
        <title>Billiga resor mellan städer i Sverige 2024 | VägVänner</title>
        <meta name="description" content="Guide: Res billigt mellan Stockholm, Uppsala, Göteborg, Malmö. Jämför priser: tåg, buss, samåkning. Spara upp till 80% på resor." />
      </Helmet>

      <article className="prose prose-lg max-w-none">
        <h1>🚗 Billiga resor mellan städer i Sverige 2024</h1>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="font-bold">Spara upp till 80% på dina resor!</p>
          <p>Jämför alla alternativ: tåg, buss, samåkning</p>
        </div>

        <h2>Prisjämförelse populära sträckor</h2>
        
        <h3>Stockholm - Uppsala</h3>
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Färdsätt</th>
              <th className="border p-2">Pris</th>
              <th className="border p-2">Tid</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">SJ Tåg</td>
              <td className="border p-2">95-195 kr</td>
              <td className="border p-2">38 min</td>
            </tr>
            <tr>
              <td className="border p-2">SL Pendeltåg</td>
              <td className="border p-2">65 kr</td>
              <td className="border p-2">55 min</td>
            </tr>
            <tr>
              <td className="border p-2">FlixBus</td>
              <td className="border p-2">49-99 kr</td>
              <td className="border p-2">1h 10min</td>
            </tr>
            <tr className="bg-green-50">
              <td className="border p-2 font-bold">Samåkning (VägVänner)</td>
              <td className="border p-2 font-bold">30-50 kr</td>
              <td className="border p-2">45 min</td>
            </tr>
          </tbody>
        </table>

        <h3>Stockholm - Göteborg</h3>
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Färdsätt</th>
              <th className="border p-2">Pris</th>
              <th className="border p-2">Tid</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">SJ Snabbtåg</td>
              <td className="border p-2">345-895 kr</td>
              <td className="border p-2">3h</td>
            </tr>
            <tr>
              <td className="border p-2">FlixBus</td>
              <td className="border p-2">199-399 kr</td>
              <td className="border p-2">6h 30min</td>
            </tr>
            <tr>
              <td className="border p-2">Flyg (SAS)</td>
              <td className="border p-2">598-1500 kr</td>
              <td className="border p-2">1h (+2h flygplats)</td>
            </tr>
            <tr className="bg-green-50">
              <td className="border p-2 font-bold">Samåkning (VägVänner)</td>
              <td className="border p-2 font-bold">150-250 kr</td>
              <td className="border p-2">5h</td>
            </tr>
          </tbody>
        </table>

        <h2>💰 Spartips för billiga resor</h2>
        <ol>
          <li><strong>Boka i förväg</strong> - Tågbiljetter kan vara 70% billigare</li>
          <li><strong>Res utanför rusningstid</strong> - Tisdagar och onsdagar är billigast</li>
          <li><strong>Använd studentrabatt</strong> - SJ ger 15%, många bussar 10%</li>
          <li><strong>Samåk!</strong> - Ofta billigast och mer flexibelt</li>
          <li><strong>Jämför alltid</strong> - Priserna varierar mycket</li>
        </ol>

        <h2>🚗 Varför välja samåkning?</h2>
        <ul>
          <li>✅ Upp till 80% billigare än tåg</li>
          <li>✅ Dörr-till-dörr (slipper lokaltrafik)</li>
          <li>✅ Flexibla tider</li>
          <li>✅ Trevligt sällskap</li>
          <li>✅ Miljövänligt</li>
        </ul>

        <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg my-6">
          <h3>🎉 Special erbjudande denna vecka!</h3>
          <p>Testa samåkning GRATIS på VägVänner</p>
          <p>Inga avgifter - begränsat antal platser</p>
          <Link to="/" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mt-2">
            Hitta billig resa nu →
          </Link>
        </div>

        <h2>Populära samåkningssträckor</h2>
        <ul>
          <li><Link to="/?from=Stockholm&to=Uppsala">Stockholm - Uppsala (30-50 kr)</Link></li>
          <li><Link to="/?from=Göteborg&to=Malmö">Göteborg - Malmö (150-200 kr)</Link></li>
          <li><Link to="/?from=Stockholm&to=Linköping">Stockholm - Linköping (100-150 kr)</Link></li>
          <li><Link to="/?from=Uppsala&to=Gävle">Uppsala - Gävle (80-120 kr)</Link></li>
        </ul>

        <h2>Vanliga frågor om billiga resor</h2>
        
        <h3>Vad är billigast - tåg, buss eller samåkning?</h3>
        <p>Samåkning är ofta billigast (30-60% av tågpriset), följt av buss. Tåg är snabbast men dyrast.</p>

        <h3>Hur hittar jag samåkning?</h3>
        <p>Använd <Link to="/">VägVänner</Link> - Sveriges nya samåkningsplattform. Helt gratis att testa!</p>

        <h3>Är samåkning säkert?</h3>
        <p>Ja! På VägVänner verifieras alla användare och du kan se omdömen innan du bokar.</p>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">
            Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')} | 
            Alla priser är ungefärliga och kan variera
          </p>
        </div>
      </article>
    </div>
  );
}