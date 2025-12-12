import React from "react";
import { useNavigate } from "react-router-dom";
import { HiArrowUpRight } from "react-icons/hi2";

export default function SEOSection({ hasRides = true }) {
  const navigate = useNavigate();

  // Features array moved to useMemo for better performance
  const features = React.useMemo(() => [
    {
      icon: "🚗",
      title: "Enkel samåkning",
      description: "Hitta eller erbjud resor snabbt och enkelt. Miljövänligt alternativ till att köra ensam."
    },
    {
      icon: "💰",
      title: "Ekonomiskt smart",
      description: "Dela resekostnaderna med andra och få mycket mer för pengarna än kollektivtrafik eller taxi."
    },
    {
      icon: "🌱",
      title: "Miljövänligt",
      description: "Minska ditt koldioxidavtryck genom att dela bil med andra som åker samma väg."
    },
    {
      icon: "🤝",
      title: "Säker community",
      description: "Verifierade användare och betygsystem för trygga resor tillsammans."
    },
    {
      icon: "📱",
      title: "Alltid tillgängligt",
      description: "Sök och boka resor när som helst via vår mobilvänliga plattform."
    },
    {
      icon: "⚡",
      title: "Snabb bokning",
      description: "Enkel bokningsprocess som tar bara några klick att genomföra."
    }
  ], []);

  const popularRoutes = React.useMemo(() => [
    "Stockholm - Göteborg",
    "Malmö - Stockholm", 
    "Uppsala - Stockholm",
    "Göteborg - Malmö",
    "Linköping - Stockholm",
    "Västerås - Stockholm"
  ], []);

  // Section spéciale quand il n'y a pas de trajets
  if (!hasRides) {
    return (
      <section className="bg-gradient-to-br from-blue-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Message principal pour page vide */}
          <div className="mb-12">
            <div className="text-6xl mb-6">🚗✨</div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Bli en del av Sveriges största samåkningscommunity
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Över 50,000 svenskar har redan upptäckt fördelarna med samåkning. Ekonomiskt smart, miljövänligt och socialt - allt samtidigt.
            </p>
          </div>

          {/* Boutons principaux améliorés */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <button 
              onClick={() => navigate("/create-ride")}
              className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 px-8 py-6 flex items-center justify-center gap-4 min-w-[250px]"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                  <span className="text-2xl">🚗</span>
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 dark:text-white text-lg">
                    Erbjud resa
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Dela din bil och få hjälp med kostnaderna
                  </div>
                </div>
              </div>
              <HiArrowUpRight className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform ml-2" />
            </button>
            <button 
              onClick={() => navigate("/")}
              className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 px-8 py-6 flex items-center justify-center gap-4 min-w-[250px]"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-xl">
                  <span className="text-2xl">🔍</span>
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 dark:text-white text-lg">
                    Hitta resa
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Res ekonomiskt och bekvämt
                  </div>
                </div>
              </div>
              <HiArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform ml-2" />
            </button>
          </div>

          {/* Statistiques compactes pour page vide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                50,000+
              </div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">
                Genomförda resor
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                25,000+
              </div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">
                Aktiva användare
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                2M+
              </div>
              <div className="text-gray-600 dark:text-gray-300 font-medium">
                Sparade kronor
              </div>
            </div>
          </div>

          {/* Message encourageant */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Varför vänta? Starta din resa idag!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Gå med i Sveriges växande community av smarta resenärer. Ekonomiskt smart, miljövänligt och socialt.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                ✅ Säkra betalningar
              </span>
              <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full">
                ✅ Verifierade användare
              </span>
              <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full">
                ✅ 24/7 support
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Section normale quand il y a des trajets
  return (
    <section className="bg-gradient-to-br from-blue-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Séparateur visuel subtil */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-8"></div>
        
        {/* Boutons d'action directement sous les trajets */}
        <div className="text-center mb-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate("/create-ride")}
              className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 px-6 py-4 flex items-center justify-center gap-3 min-w-[200px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <span className="text-xl">🚗</span>
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    Publicera samåkning
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Erbjud platser i din bil
                  </div>
                </div>
              </div>
              <HiArrowUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform ml-2" />
            </button>
            <button 
              onClick={() => navigate("/")}
              className="group bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 px-6 py-4 flex items-center justify-center gap-3 min-w-[200px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                  <span className="text-xl">🔍</span>
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900 dark:text-white text-sm">
                    Sök resor
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Hitta en plats att åka med
                  </div>
                </div>
              </div>
              <HiArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform ml-2" />
            </button>
          </div>
        </div>

        {/* Populära rutter - version compacte */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Populära rutter i Sverige
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {popularRoutes.map((route, index) => (
              <div 
                key={index}
                className="bg-gray-50 dark:bg-slate-700 rounded-md p-3 text-center hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-200"
              >
                <span className="text-gray-800 dark:text-gray-200 font-medium text-sm">
                  {route}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Statistik - version compacte */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              50,000+
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-xs">
              Genomförda resor
            </div>
          </div>
          <div className="text-center bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              25,000+
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-xs">
              Aktiva användare
            </div>
          </div>
          <div className="text-center bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              2M+
            </div>
            <div className="text-gray-600 dark:text-gray-300 text-xs">
              Sparade kronor
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
