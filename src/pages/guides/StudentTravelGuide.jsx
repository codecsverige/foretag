import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

export default function StudentTravelGuide() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Helmet>
        <title>Studentguide: Billiga resor för studenter 2024 | VägVänner</title>
        <meta name="description" content="Guide för studenter: res billigt mellan universitet. Uppsala, Lund, Stockholm, Göteborg. Spara pengar på pendling. Tips och rabatter." />
      </Helmet>

      <article className="prose prose-lg max-w-none">
        <h1>🎓 Studentguide: Res billigt mellan universiteten</h1>
        
        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <p className="font-bold">CSN räcker längre med smart resande!</p>
          <p>Spara hundratals kronor varje månad på resor</p>
        </div>

        <h2>Populära studentresor och priser</h2>
        
        <h3>Uppsala Universitet ↔️ Stockholm</h3>
        <div className="bg-gray-50 p-4 rounded mb-4">
          <p><strong>Avstånd:</strong> 71 km</p>
          <p><strong>SL Pendeltåg:</strong> 65 kr (student: 48 kr med rabatt)</p>
          <p><strong>SJ:</strong> 95-195 kr</p>
          <p className="text-green-600 font-bold">
            <strong>Samåkning:</strong> 30-40 kr (spara 70%!)
          </p>
          <Link to="/?from=Uppsala&to=Stockholm" className="text-blue-600">
            → Hitta samåkning Uppsala-Stockholm
          </Link>
        </div>

        <h3>Lund ↔️ Malmö</h3>
        <div className="bg-gray-50 p-4 rounded mb-4">
          <p><strong>Avstånd:</strong> 18 km</p>
          <p><strong>Pågatågen:</strong> 35 kr</p>
          <p><strong>Skånetrafiken buss:</strong> 35 kr</p>
          <p className="text-green-600 font-bold">
            <strong>Samåkning:</strong> 15-20 kr
          </p>
          <Link to="/?from=Lund&to=Malmö" className="text-blue-600">
            → Hitta samåkning Lund-Malmö
          </Link>
        </div>

        <h3>KTH/SU Stockholm ↔️ Linköping Universitet</h3>
        <div className="bg-gray-50 p-4 rounded mb-4">
          <p><strong>Avstånd:</strong> 200 km</p>
          <p><strong>SJ:</strong> 195-395 kr</p>
          <p><strong>FlixBus:</strong> 99-199 kr</p>
          <p className="text-green-600 font-bold">
            <strong>Samåkning:</strong> 80-120 kr
          </p>
          <Link to="/?from=Stockholm&to=Linköping" className="text-blue-600">
            → Hitta samåkning Stockholm-Linköping
          </Link>
        </div>

        <h2>💡 Smarta tips för studenter</h2>
        
        <h3>1. Planera hemresor tillsammans</h3>
        <p>Många studenter åker hem samtidigt - fredag eftermiddag och söndag kväll. 
        Samordna med kursare!</p>

        <h3>2. Använd studentrabatter smart</h3>
        <ul>
          <li>SJ: 15% rabatt med Mecenat/Studentkortet</li>
          <li>Vissa busskort ger extra rabatt</li>
          <li>Men samåkning är ofta billigare än rabatterat pris!</li>
        </ul>

        <h3>3. Terminskortet vs samåkning</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Sträcka</th>
              <th className="border p-2">Terminskort/månad</th>
              <th className="border p-2">Samåkning 20 resor</th>
              <th className="border p-2">Du sparar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">Uppsala-Stockholm</td>
              <td className="border p-2">2,195 kr</td>
              <td className="border p-2">700 kr</td>
              <td className="border p-2 text-green-600 font-bold">1,495 kr!</td>
            </tr>
          </tbody>
        </table>

        <h2>🏫 Universitet och högskolor</h2>
        
        <h3>Uppsala</h3>
        <ul>
          <li>45,000 studenter</li>
          <li>Många pendlar från Stockholm</li>
          <li>Studentbostadsbrist = mycket pendling</li>
          <li><Link to="/?to=Uppsala">Alla resor till Uppsala →</Link></li>
        </ul>

        <h3>Lund</h3>
        <ul>
          <li>42,000 studenter</li>
          <li>Nära Malmö och Köpenhamn</li>
          <li>Populärt att bo i Malmö</li>
          <li><Link to="/?to=Lund">Alla resor till Lund →</Link></li>
        </ul>

        <h3>Stockholm (KTH, SU, KI)</h3>
        <ul>
          <li>80,000+ studenter totalt</li>
          <li>Dyra bostäder = pendling från kranskommuner</li>
          <li><Link to="/?to=Stockholm">Alla resor till Stockholm →</Link></li>
        </ul>

        <h2>📱 Studenttips för samåkning</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3>Skapa studiegrupp-resor!</h3>
          <p>Åker ni samma tider varje vecka? Skapa återkommande resor och spara ännu mer.</p>
        </div>

        <h3>Checklista för smart studentresande:</h3>
        <ul className="list-none">
          <li>✅ Kolla samåkning först - ofta 50-70% billigare</li>
          <li>✅ Boka hemresor tidigt</li>
          <li>✅ Res tillsammans med kursare</li>
          <li>✅ Utnyttja lugna tider (inte måndag morgon/fredag kväll)</li>
          <li>✅ Överväg veckoboende + hemresor</li>
        </ul>

        <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg my-6">
          <h3>🎉 Studentkampanj!</h3>
          <p className="font-bold">Första 5 resorna GRATIS för studenter</p>
          <p>Verifiera med din .edu-mail</p>
          <Link to="/" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 mt-2">
            Aktivera studentrabatt →
          </Link>
        </div>

        <h2>Vanliga frågor från studenter</h2>
        
        <h3>Kan jag ta med extra bagage?</h3>
        <p>Ja! Till skillnad från buss/tåg är samåkning flexibel. Perfekt för tvätt eller när du flyttar.</p>

        <h3>Tänk om föreläsningen blir inställd?</h3>
        <p>Många förare är också studenter och förstår. Kommunicera tidigt så löser det sig ofta.</p>

        <h3>Är det säkert?</h3>
        <p>Alla användare verifieras. Du ser omdömen och kan välja att bara åka med andra studenter.</p>

        <div className="mt-8 p-4 bg-purple-100 rounded-lg">
          <p className="font-bold">💜 Skapat av studenter, för studenter</p>
          <p>VägVänner startades av en student som var trött på dyra tågbiljetter!</p>
        </div>
      </article>
    </div>
  );
}