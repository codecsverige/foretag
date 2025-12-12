import React from "react";
import { Link } from "react-router-dom";
import { HiAcademicCap, HiCurrencyEuro, HiBuildingLibrary, HiUsers } from "react-icons/hi2";
import PageMeta from "../components/PageMeta.jsx";

export default function StudentGuide() {
  const studentRoutes = [
    { from: "Stockholm", to: "Lund", description: "Populär bland KTH och SU studenter som studerar i Lund" },
    { from: "Uppsala", to: "Stockholm", description: "Daglig pendling för Uppsala universitet studenter" },
    { from: "Göteborg", to: "Stockholm", description: "Chalmers och GU studenter som åker hem på helger" },
    { from: "Linköping", to: "Stockholm", description: "LiU studenter - ekonomiskt smart alternativ" },
    { from: "Malmö", to: "Lund", description: "Kort resa mellan studentstäderna" },
    { from: "Stockholm", to: "Göteborg", description: "Återresa efter lov eller praktik" }
  ];

  const tips = [
    {
      icon: HiCurrencyEuro,
      title: "Ekonomiska fördelar",
      content: "Som student kan du spara betydligt på månadsbudgeten. Istället för dyra tågbiljetter delar du kostnaderna med andra.",
      highlight: "Spara 60-80% jämfört med SJ"
    },
    {
      icon: HiAcademicCap,
      title: "Flexibla resor",
      content: "Perfekt för terminsstarter, tentaperioder och helgbesök hemma. Hitta resor som passar ditt schema.",
      highlight: "Anpassa efter dina behov"
    },
    {
      icon: HiUsers,
      title: "Träffa andra studenter",
      content: "Många av våra användare är studenter. Du kan hitta resenärer från samma universitet eller program.",
      highlight: "Bygg ditt studentnätverk"
    },
    {
      icon: HiBuildingLibrary,
      title: "Universitetsrutter",
      content: "Vi har särskilt många resor mellan de stora universitetsstäderna Stockholm, Göteborg, Lund och Uppsala.",
      highlight: "Optimerat för studenter"
    }
  ];

  const savings = [
    { route: "Stockholm-Lund", trainPrice: "800-1200 kr", sharePrice: "250-400 kr", savings: "70%" },
    { route: "Uppsala-Stockholm", trainPrice: "150-200 kr", sharePrice: "50-80 kr", savings: "65%" },
    { route: "Göteborg-Stockholm", trainPrice: "600-900 kr", sharePrice: "200-350 kr", savings: "60%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <PageMeta
        title="Studentguide - Resa Billigt mellan Universitet | VägVänner"
        description="Komplett guide för studenter som vill resa billigt mellan svenska universitet. Spara pengar på resor Stockholm-Lund, Uppsala-Göteborg och mer."
        canonical="https://vagvanner.se/student-guide"
      />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">🎓📚</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Studentguide: Resa Smart & Billigt
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Som student behöver du inte välja mellan att resa och att ha råd med mat. 
            Här är din kompletta guide till ekonomisk och smart resande mellan Sveriges universitet.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/select-location"
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              🔍 Hitta studentresor
            </Link>
            <Link 
              to="/create-ride"
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300"
            >
              🚗 Erbjud resa
            </Link>
          </div>
        </div>

        {/* Tips för studenter */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Varför väljer 15,000+ studenter VägVänner?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tips.map((tip, index) => {
              const IconComponent = tip.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-blue-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{tip.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{tip.content}</p>
                  <div className="bg-green-50 text-green-800 text-sm font-semibold px-3 py-2 rounded-lg">
                    ✅ {tip.highlight}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Jämförelse av priser */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Så mycket sparar du som student
          </h2>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <h3 className="text-2xl font-bold text-center">Prisjämförelse: Tåg vs Samåkning</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Rutt</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Tåg (SJ)</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Samåkning</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Du sparar</th>
                  </tr>
                </thead>
                <tbody>
                  {savings.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.route}</td>
                      <td className="px-6 py-4 text-center text-red-600 font-semibold">{item.trainPrice}</td>
                      <td className="px-6 py-4 text-center text-green-600 font-semibold">{item.sharePrice}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">
                          {item.savings}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Populära studentrutter */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Populära rutter mellan universitet
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentRoutes.map((route, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🎓</div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {route.from} → {route.to}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">{route.description}</p>
                <Link 
                  to={`/select-location?from=${route.from}&to=${route.to}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm"
                >
                  Sök resor →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Tips för säker resande */}
        <section className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            🛡️ Säkerhetstips för studenter
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Innan resan:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Kontrollera förarens profil och betyg</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Meddela vänner om din resa</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Spara förarens kontaktuppgifter</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Under resan:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Använd bilbälte hela resan</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Var vänlig och respektfull</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Dela gärna körning om du har körkort</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}