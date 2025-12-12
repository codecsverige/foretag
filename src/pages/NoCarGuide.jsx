import React from "react";
import { Link } from "react-router-dom";
import { HiNoSymbol, HiCurrencyEuro, HiCheckCircle, HiClock, HiShieldCheck, HiUsers } from "react-icons/hi2";
import PageMeta from "../components/PageMeta.jsx";

export default function NoCarGuide() {
  const alternatives = [
    {
      icon: HiCurrencyEuro,
      title: "Ekonomisk frihet",
      description: "Inga bilkostnader som försäkring, bensin, service, parkering eller billån",
      savings: "15,000-40,000 kr/år",
      color: "green"
    },
    {
      icon: HiClock,
      title: "Produktiv restid",
      description: "Som passagerare kan du jobba, läsa, vila eller socialisera under resan",
      savings: "Mer fritid",
      color: "blue"
    },
    {
      icon: HiShieldCheck,
      title: "Säker transport",
      description: "Verifierade förare och tryggt betalningssystem via appen",
      savings: "Trygg känsla",
      color: "purple"
    }
  ];

  const scenarios = [
    {
      title: "🎓 Student utan bil",
      description: "Res hem till familjen eller mellan universitetsstäder",
      routes: ["Uppsala → Stockholm", "Lund → Göteborg", "Stockholm → Malmö"],
      savings: "Spara 8,000-15,000 kr/år jämfört med tåg"
    },
    {
      title: "💼 Arbetspendlare utan bil",
      description: "Pendla bekvämt till jobbet i annan stad",
      routes: ["Västerås → Stockholm", "Uppsala → Stockholm", "Malmö → Lund"],
      savings: "Spara 20,000-35,000 kr/år jämfört med att äga bil"
    },
    {
      title: "🏠 Vardagsresor",
      description: "Handla, besöka vänner eller utforska Sverige",
      routes: ["Centrum → köpcentra", "Stad → stad", "Lokala utflykter"],
      savings: "Bil när du behöver den"
    },
    {
      title: "✈️ Till/från flygplatser",
      description: "Bekvämt alternativ till dyra flygplatstransporter",
      routes: ["Stockholm → Arlanda", "Göteborg → Landvetter", "Malmö → Sturup"],
      savings: "Halvera kostnaden jämfört med taxi"
    }
  ];

  const tips = [
    {
      emoji: "📱",
      title: "Använd bevakningar",
      content: "Skapa automatiska notifieringar för dina vanliga rutter. Vi meddelar när någon lägger upp matchande resor."
    },
    {
      emoji: "⭐",
      title: "Bygg ditt rykte",
      content: "Som pålitlig passagerare får du bättre betyg och förare vill gärna ta dig med igen."
    },
    {
      emoji: "💬",
      title: "Kommunicera tydligt",
      content: "Berätta var du vill bli uppsatt och avlämnad. Förbered för enkel kommunikation."
    },
    {
      emoji: "🎒",
      title: "Packa smart",
      content: "Ta med bara det du behöver. Kom ihåg att du delar utrymme med andra."
    },
    {
      emoji: "⏰",
      title: "Var punktlig",
      content: "Respektera förarens och andra passagerares tid. Kom i tid till upphämtningsplatsen."
    },
    {
      emoji: "🤝",
      title: "Var social och trevlig",
      content: "Samåkning handlar om gemenskap. En trevlig attityd gör resan bättre för alla."
    }
  ];

  const costComparison = [
    {
      category: "Äga bil (småbil)",
      yearly: "35,000-50,000 kr/år",
      monthly: "~3,000-4,200 kr/månad",
      details: ["Billån/avskrivning", "Försäkring", "Bensin", "Service & reparationer", "Parkering", "Besiktning"]
    },
    {
      category: "Samåkning (regelbunden)",
      yearly: "12,000-20,000 kr/år",
      monthly: "~1,000-1,700 kr/månad", 
      details: ["Endast resornas kostnad", "Ingen försäkring", "Ingen service", "Ingen parkering", "Flexibelt", "Miljövänligt"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <PageMeta
        title="Resa utan Bil - Guide för Samåkning | VägVänner"
        description="Komplett guide för dig som inte har bil. Resa bekvämt och billigt med samåkning. Spara tiotusentals kronor årligen jämfört med att äga bil."
        canonical="https://vagvanner.se/no-car-guide"
      />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">🚫🚗→🚗✨</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ingen bil? Inga problem!
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Upptäck friheten i att resa utan att äga bil. Samåkning ger dig tillgång till bekväm transport 
            när du behöver det, utan de enorma kostnaderna och ansvaret som kommer med bilägande.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/select-location"
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              🔍 Hitta resor nu
            </Link>
            <Link 
              to="/commuter-guide"
              className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all duration-300"
            >
              💼 För arbetspendlare
            </Link>
          </div>
        </div>

        {/* Fördelar med att inte äga bil */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Fördelarna med att inte äga bil
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {alternatives.map((alt, index) => {
              const IconComponent = alt.icon;
              const colorClasses = {
                green: "bg-green-100 text-green-600",
                blue: "bg-blue-100 text-blue-600", 
                purple: "bg-purple-100 text-purple-600"
              };
              
              return (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className={`rounded-full p-4 w-16 h-16 flex items-center justify-center mb-6 ${colorClasses[alt.color]}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{alt.title}</h3>
                  <p className="text-gray-600 mb-6">{alt.description}</p>
                  
                  <div className="bg-yellow-50 text-yellow-800 text-sm font-semibold px-4 py-3 rounded-lg text-center">
                    💰 {alt.savings}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Kostnadsjämförelse */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Kostnadsjämförelse: Äga bil vs Samåkning
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {costComparison.map((cost, index) => (
              <div key={index} className={`rounded-2xl p-8 shadow-lg ${index === 0 ? 'bg-red-50 border-2 border-red-200' : 'bg-green-50 border-2 border-green-200'}`}>
                <h3 className={`text-2xl font-bold mb-4 ${index === 0 ? 'text-red-800' : 'text-green-800'}`}>
                  {cost.category}
                </h3>
                
                <div className="mb-6">
                  <div className={`text-3xl font-bold ${index === 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {cost.yearly}
                  </div>
                  <div className="text-gray-600 text-lg">{cost.monthly}</div>
                </div>
                
                <ul className="space-y-2">
                  {cost.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-700">
                      {index === 0 ? (
                        <span className="text-red-500">❌</span>
                      ) : (
                        <HiCheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-6 py-4 rounded-xl font-bold text-xl">
              🎉 Du kan spara 15,000-30,000 kr per år!
            </div>
          </div>
        </section>

        {/* Scenarion för olika användare */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Olika sätt att använda samåkning
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {scenarios.map((scenario, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{scenario.title}</h3>
                <p className="text-gray-600 mb-4">{scenario.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Populära rutter:</h4>
                  <div className="flex flex-wrap gap-2">
                    {scenario.routes.map((route, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                        {route}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-green-50 text-green-800 text-sm font-semibold px-3 py-2 rounded-lg">
                  💚 {scenario.savings}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tips för passagerare */}
        <section className="bg-white rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            🎯 Tips för att vara en bra passagerare
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="text-2xl mb-2">{tip.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-gray-600 text-sm">{tip.content}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 bg-indigo-50 rounded-xl p-6 text-center">
            <h3 className="text-lg font-bold text-indigo-900 mb-2">
              🌟 Kom ihåg: Du är inte bara passagerare - du är resekamrat!
            </h3>
            <p className="text-indigo-800">
              Samåkning handlar om gemenskap. En positiv attityd och respekt för andra 
              gör resan trevligare för alla och ökar chansen att hitta regelbundna resenärer.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}