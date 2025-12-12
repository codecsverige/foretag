import React from "react";
import { Link } from "react-router-dom";
import { HiBriefcase, HiClock, HiCurrencyEuro, HiMapPin, HiUsers, HiCheckCircle } from "react-icons/hi2";
import PageMeta from "../components/PageMeta.jsx";

export default function CommuterGuide() {
  const commuterRoutes = [
    { from: "Västerås", to: "Stockholm", description: "Daglig pendling för Västerås-bor som arbetar i Stockholm", time: "1.5h", cost: "50-80 kr" },
    { from: "Uppsala", to: "Stockholm", description: "Populär arbetspendling, billigare än tåg", time: "45min", cost: "40-70 kr" },
    { from: "Södertälje", to: "Stockholm", description: "Ekonomiskt alternativ till kollektivtrafik", time: "40min", cost: "35-60 kr" },
    { from: "Norrköping", to: "Stockholm", description: "Veckocommuting för flexarbete", time: "2h", cost: "80-120 kr" },
    { from: "Göteborg", to: "Borås", description: "Kortare arbetspendling mellan städerna", time: "1h", cost: "40-70 kr" },
    { from: "Malmö", to: "Lund", description: "Snabb och billig arbetspendling", time: "20min", cost: "25-40 kr" }
  ];

  const targetGroups = [
    {
      icon: HiBriefcase,
      title: "Arbetspendlare",
      description: "Du som arbetar i en annan stad än där du bor",
      benefits: ["Spara tusentals kronor per månad", "Flexibla arbetstider", "Mindre stress än kollektivtrafik"],
      highlight: "Perfekt för daglig pendling"
    },
    {
      icon: HiMapPin,
      title: "Utan egen bil",
      description: "Du som inte har körkort eller egen bil",
      benefits: ["Inga bilkostnader (försäkring, bensin, service)", "Bekvämt och säkert", "Dörr-till-dörr transport"],
      highlight: "Bil utan att äga en"
    },
    {
      icon: HiUsers,
      title: "Flexarbetare",
      description: "Du som arbetar remote/hybrid och reser några dagar i veckan",
      benefits: ["Resa när det passar dig", "Jobba under resan", "Träffa andra yrkesverksamma"],
      highlight: "Optimalt för hybridarbete"
    }
  ];

  const monthlySavings = [
    { 
      scenario: "Pendling Stockholm-Uppsala (5 dagar/vecka)",
      kollektivtrafik: "SL + UL månadskort: ~2,400 kr",
      samåkning: "Samåkning: ~1,200 kr/månad",
      savings: "1,200 kr/månad"
    },
    { 
      scenario: "Arbetspendling Västerås-Stockholm (3 dagar/vecka)",
      kollektivtrafik: "Tåg pendlarkort: ~3,200 kr",
      samåkning: "Samåkning: ~1,400 kr/månad", 
      savings: "1,800 kr/månad"
    },
    { 
      scenario: "Göteborg-Borås dagligen",
      kollektivtrafik: "Västtrafik periodkort: ~1,800 kr",
      samåkning: "Samåkning: ~900 kr/månad",
      savings: "900 kr/månad"
    }
  ];

  const tips = [
    {
      title: "🕐 Planera i förväg",
      content: "Skapa bevakningar för dina vanliga rutter. Många pendlare kör samma sträcka varje dag."
    },
    {
      title: "🤝 Bygg relationer", 
      content: "Hitta en regelbunden förare för din arbetspendling. Många kör samma tider varje dag."
    },
    {
      title: "💼 Jobba under resan",
      content: "Som passagerare kan du jobba, läsa eller bara vila under resan. Produktiv tid!"
    },
    {
      title: "🌱 Miljöval som imponerar",
      content: "Visa arbetsgivaren och kollegorna att du tänker miljösmart. Många företag uppskattar det."
    },
    {
      title: "📱 Använd bevakningar",
      content: "Sätt upp automatiska notifieringar för dina rutter. Vi meddelar när någon lägger upp matchande resor."
    },
    {
      title: "💰 Förhandla månadspriser",
      content: "Om du åker med samma förare ofta, kan ni komma överens om ett fast månadspris."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <PageMeta
        title="Pendlarguide - Arbetspendling & Samåkning utan Bil | VägVänner"
        description="Guide för arbetspendlare och de utan egen bil. Resa billigt till jobbet med samåkning. Spara tusentals kronor per månad på pendlingen."
        canonical="https://vagvanner.se/commuter-guide"
      />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">💼🚗</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Arbetspendling: Smart & Ekonomiskt
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Pendla till jobbet utan att ruinera ekonomin. Perfekt för dig som arbetar i annan stad, 
            inte har egen bil, eller vill spara pengar på dyra månadskort och kollektivtrafik.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/select-location"
              className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              🔍 Hitta pendlarresor
            </Link>
            <Link 
              to="/create-ride"
              className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition-all duration-300"
            >
              🚗 Erbjud pendling
            </Link>
          </div>
        </div>

        {/* Målgrupper */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Är du en av dessa? VägVänner är perfekt för dig!
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {targetGroups.map((group, index) => {
              const IconComponent = group.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="bg-green-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-6">
                    <IconComponent className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{group.title}</h3>
                  <p className="text-gray-600 mb-6">{group.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    {group.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <HiCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-green-50 text-green-800 text-sm font-semibold px-4 py-3 rounded-lg text-center">
                    ✨ {group.highlight}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Månatliga besparingar */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Så mycket sparar du per månad
          </h2>
          
          <div className="space-y-6">
            {monthlySavings.map((saving, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{saving.scenario}</h3>
                
                <div className="grid md:grid-cols-3 gap-4 items-center">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Kollektivtrafik</div>
                    <div className="text-lg font-bold text-red-600">{saving.kollektivtrafik}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl">vs</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Samåkning</div>
                    <div className="text-lg font-bold text-green-600">{saving.samåkning}</div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold">
                    💰 Du sparar: {saving.savings}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Populära pendlarrutter */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Populära arbetspendlings-rutter
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {commuterRoutes.map((route, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">💼</div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {route.from} → {route.to}
                  </h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{route.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <HiClock className="w-4 h-4" />
                    <span>{route.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                    <HiCurrencyEuro className="w-4 h-4" />
                    <span>{route.cost}</span>
                  </div>
                </div>
                
                <Link 
                  to={`/select-location?from=${route.from}&to=${route.to}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-sm w-full justify-center bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
                >
                  Sök pendlarresor →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Tips för pendlare */}
        <section className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            💡 Profi-tips för smarta pendlare
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-gray-600 text-sm">{tip.content}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 bg-blue-50 rounded-xl p-6 text-center">
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              🎯 Särskilt för dig utan egen bil
            </h3>
            <p className="text-blue-800">
              Ingen bil? Inga problem! Som passagerare kan du resa bekvämt utan bilkostnader, 
              försäkringar eller parkeringsavgifter. Du betalar bara för resan och kan jobba eller vila under färden.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}