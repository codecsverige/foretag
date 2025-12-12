import React from "react";
import { Link } from "react-router-dom";
import { HiLightBulb, HiShieldCheck, HiCurrencyEuro, HiUsers, HiClock, HiHeart } from "react-icons/hi2";
import PageMeta from "../components/PageMeta.jsx";

export default function TravelTips() {
  const tipCategories = [
    {
      icon: HiCurrencyEuro,
      title: "Ekonomiska tips",
      color: "green",
      tips: [
        {
          title: "Skapa bevakningar för vanliga rutter",
          content: "Istället för att söka manuellt varje dag, skapa automatiska bevakningar för dina vardagsresor. Du får notifikationer när någon lägger upp matchande resor.",
          savings: "Spara tid och hitta de bästa dealsen"
        },
        {
          title: "Jämför med kollektivtrafik och taxi",
          content: "Innan du bokar, kolla vad samma resa skulle kosta med tåg, buss eller taxi. Oftast är samåkning 50-70% billigare.",
          savings: "Medvetenhet om hur mycket du sparar"
        },
        {
          title: "Förhandla månadspriser",
          content: "Om du åker samma rutt regelbundet, kontakta föraren för att diskutera ett fast månadspris. Många är öppna för detta.",
          savings: "Extra rabatter för regelbundna resor"
        },
        {
          title: "Resa utanför rusningstid",
          content: "Resor utanför rusningstid är ofta billigare och mindre stressiga. Flexibla tider ger fler alternativ.",
          savings: "Lägre kostnader och mer komfort"
        }
      ]
    },
    {
      icon: HiShieldCheck,
      title: "Säkerhetstips",
      color: "blue",
      tips: [
        {
          title: "Kontrollera förarens profil",
          content: "Läs betyg från tidigare passagerare, kolla hur länge föraren varit aktiv och se om de har verifierat telefonnummer.",
          importance: "Grundläggande säkerhet"
        },
        {
          title: "Dela din resa med vänner",
          content: "Meddela alltid någon om din resplan - vilken tid du åker, med vem och förväntat ankomsttid.",
          importance: "Extra trygghet"
        },
        {
          title: "Möts på offentliga platser",
          content: "Avtala upphämtning vid lättidentifierbara, offentliga platser som busshållplatser eller järnvägsstationer.",
          importance: "Säker mötesplats"
        },
        {
          title: "Lita på din magkänsla",
          content: "Om något känns fel, avboka resan. Det är alltid bättre att vara säker än ledsen.",
          importance: "Intuition är viktig"
        }
      ]
    },
    {
      icon: HiUsers,
      title: "Sociala tips",
      color: "purple",
      tips: [
        {
          title: "Var trevlig och respektfull",
          content: "En positiv attityd gör resan trevligare för alla. Hälsa, presentera dig och visa intresse för dina medresenärer.",
          benefit: "Bättre reseupplevelse"
        },
        {
          title: "Respektera förarens regler",
          content: "Vissa förare har regler om musik, mat eller samtal. Fråga istället för att anta.",
          benefit: "Ömsesidig respekt"
        },
        {
          title: "Kom i tid",
          content: "Var alltid punktlig. Om du blir försenad, meddela så fort som möjligt via appen.",
          benefit: "Bygger förtroende"
        },
        {
          title: "Erbjud dig att dela körningen",
          content: "Om du har körkort och föraren är ok med det, erbjud dig att köra en sträcka. Många uppskattar detta.",
          benefit: "Blir en uppskattad passagerare"
        }
      ]
    }
  ];

  const targetAudienceTips = [
    {
      audience: "🎓 För studenter",
      tips: [
        "Skapa grupper med andra studenter från samma universitet",
        "Planera hemresor i god tid, särskilt inför lov och tentaperioder",
        "Använd studentrabatter på andra transportmedel som jämförelse",
        "Bygg relationer - dina medstudenter kan bli framtida kollegor",
        "Packa smart - tänk på att du delar utrymme med andra"
      ]
    },
    {
      audience: "💼 För arbetspendlare",
      tips: [
        "Hitta förare med liknande arbetstider för regelbunden pendling",
        "Använd restiden produktivt - jobba, läs eller vila",
        "Diskutera flexibilitet för övertid eller ändrade arbetstider",
        "Jämför månadskostnader med kollektivtrafik och parkeringsavgifter",
        "Bygg professionella nätverk under resorna"
      ]
    },
    {
      audience: "🚫🚗 För dig utan bil",
      tips: [
        "Se samåkning som din personliga chaufför utan bilkostnaderna",
        "Lär dig använda kollektivtrafik för att ta dig till mötesplatser",
        "Ha alltid backup-planer för återresan",
        "Uppskatta friheten från bilägande - försäkringar, service, parkering",
        "Använd tiden som passagerare för avkoppling eller produktivitet"
      ]
    }
  ];

  const seasonalAdvice = [
    {
      season: "🌸 Vinter (December - Februari)",
      advice: [
        "Kolla väderprognoser innan resan och var beredd på förseningar",
        "Ha extra kläder och eventuellt snacks ifall ni fastnar",
        "Vinterresor kan ta längre tid - planera med marginal",
        "Skidresor till Åre, Sälen är populära - boka i förväg"
      ]
    },
    {
      season: "🌺 Vår (Mars - Maj)",
      advice: [
        "Perfekt tid för att upptäcka Sverige - vädret blir bättre",
        "Påsklov innebär många resor - skapa bevakningar tidigt",
        "Vårstäd hemma? Samåk till återvinningscentralen eller IKEA",
        "Studenter flyttar ofta under våren - hjälp varandra"
      ]
    },
    {
      season: "☀️ Sommar (Juni - Augusti)",
      advice: [
        "Midsommar, semester och festival-resor är populära",
        "Resor till sommarstugor och Gotland ökar markant",
        "Längre dagsljus ger fler resmöjligheter",
        "Tänk på att många har semester - planera sommarsemestern i förväg"
      ]
    },
    {
      season: "🍂 Höst (September - November)",
      advice: [
        "Nya terminen börjar - många studenter behöver transport",
        "Kräftskiva och Lucia-resor blir vanligare",
        "Förbered dig för växlande väder och kortare dagar",
        "Bra tid att etablera nya rutiner för arbetspendling"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <PageMeta
        title="Resenärstips - Så Reser du Smart & Säkert | VägVänner"
        description="Komplett guide med tips för samåkning i Sverige. Spara pengar, resa säkert och få ut det mesta av din reseupplevelse. För studenter, arbetspendlare och alla utan bil."
        canonical="https://vagvanner.se/travel-tips"
      />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">💡✨</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Smarta tips för alla resenärer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Från våra mest erfarna användare - så här får du ut det mesta av samåkning. 
            Spara mer pengar, res säkrare och njut av varje resa.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/student-guide"
              className="bg-blue-100 text-blue-800 px-6 py-3 rounded-xl font-semibold hover:bg-blue-200 transition-colors"
            >
              🎓 Tips för studenter
            </Link>
            <Link 
              to="/commuter-guide"
              className="bg-green-100 text-green-800 px-6 py-3 rounded-xl font-semibold hover:bg-green-200 transition-colors"
            >
              💼 Tips för arbetspendlare
            </Link>
            <Link 
              to="/no-car-guide"
              className="bg-purple-100 text-purple-800 px-6 py-3 rounded-xl font-semibold hover:bg-purple-200 transition-colors"
            >
              🚫🚗 Tips utan bil
            </Link>
          </div>
        </div>

        {/* Huvudkategorier */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Grundläggande tips för alla
          </h2>
          
          <div className="space-y-12">
            {tipCategories.map((category, categoryIndex) => {
              const IconComponent = category.icon;
              const colorClasses = {
                green: "from-green-500 to-emerald-500",
                blue: "from-blue-500 to-cyan-500",
                purple: "from-purple-500 to-pink-500"
              };
              
              return (
                <div key={categoryIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className={`bg-gradient-to-r ${colorClasses[category.color]} text-white p-6`}>
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 rounded-full p-3">
                        <IconComponent className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold">{category.title}</h3>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {category.tips.map((tip, tipIndex) => (
                        <div key={tipIndex} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <h4 className="font-bold text-gray-900 mb-2">{tip.title}</h4>
                          <p className="text-gray-600 text-sm mb-3 leading-relaxed">{tip.content}</p>
                          <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            category.color === 'green' ? 'bg-green-100 text-green-800' :
                            category.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            ✨ {tip.savings || tip.importance || tip.benefit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tips för olika målgrupper */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Specialiserade tips för din situation
          </h2>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {targetAudienceTips.map((group, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{group.audience}</h3>
                <ul className="space-y-3">
                  {group.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-3">
                      <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                      <span className="text-gray-600 text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Säsongsanpassade råd */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Reseråd för olika årstider
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {seasonalAdvice.map((season, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{season.season}</h3>
                <ul className="space-y-2">
                  {season.advice.map((advice, adviceIndex) => (
                    <li key={adviceIndex} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1 text-sm flex-shrink-0">•</span>
                      <span className="text-gray-600 text-sm">{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold mb-4">Redo att sätta igång?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Nu när du har alla tips du behöver - hitta din nästa resa eller erbjud en plats i din bil!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/select-location"
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors"
            >
              🔍 Hitta resa
            </Link>
            <Link 
              to="/create-ride"
              className="border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-colors"
            >
              🚗 Erbjud resa
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}