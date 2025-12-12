/* ═══════════════════════════════════════════════════════════
   🇸🇪 محتوى SEO سويدي مخصص - يظهر للزوار ومحركات البحث
   🎯 يركز على الكلمات المفتاحية الذهبية والمحتوى المفيد
   ═══════════════════════════════════════════════════════════ */

import React from 'react';

const SwedishSEOContent = () => {
  return (
    <div className="seo-content bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      {/* Hero Section محسن للـ SEO */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Sveriges <span className="text-blue-600">#1 Samåkning</span> 🚗
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Över <strong>50,000 nöjda resenärer</strong> sparar <strong>70% på sina resor</strong> genom 
            säker samåkning mellan svenska städer. Anslut dig till Sveriges största community för miljövänliga resor!
          </p>
          
          {/* Popular Routes - Rich Content */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100">
              <h3 className="text-xl font-bold text-blue-600 mb-3">
                🏆 Stockholm ⟷ Göteborg
              </h3>
              <p className="text-gray-700 mb-4">
                <strong>25,000+ sökningar/månad</strong><br/>
                Sveriges populäraste samåkningsrutt
              </p>
              <div className="text-sm text-blue-600 font-semibold">
                Från 180 SEK • 50+ resor/dag
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-green-100">
              <h3 className="text-xl font-bold text-green-600 mb-3">
                🎓 Uppsala ⟷ Stockholm  
              </h3>
              <p className="text-gray-700 mb-4">
                <strong>15,000+ pendlare/månad</strong><br/>
                Studenternas och arbetares favorit
              </p>
              <div className="text-sm text-green-600 font-semibold">
                Från 80 SEK • 80+ resor/dag
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-100">
              <h3 className="text-xl font-bold text-purple-600 mb-3">
                🌊 Malmö ⟷ Stockholm
              </h3>
              <p className="text-gray-700 mb-4">
                <strong>18,000+ sydsvenskar/månad</strong><br/>
                Bekväm resa genom hela Sverige
              </p>
              <div className="text-sm text-purple-600 font-semibold">
                Från 220 SEK • 35+ resor/dag
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section - SEO Rich */}
        <div className="grid md:grid-cols-2 gap-12 mt-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              🌍 Varför Välja VägVänner?
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">💰</span>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">Spara Upp Till 70%</h4>
                  <p className="text-gray-700">
                    Jämfört med tåg och flyg. Genomsnittlig besparing: <strong>1,200 SEK per resa</strong>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🌱</span>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">Miljövänligt</h4>
                  <p className="text-gray-700">
                    Minska CO2-utsläppen med <strong>60%</strong>. Varje delad resa räddar miljön!
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">100% Säkert</h4>
                  <p className="text-gray-700">
                    Verifierade förare, säker betalning och <strong>24/7 support</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              📊 Sveriges Statistik
            </h2>
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">50,000+</div>
                  <div className="text-sm text-gray-600">Aktiva Användare</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">10,000+</div>
                  <div className="text-sm text-gray-600">Resor/Månad</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">4.8★</div>
                  <div className="text-sm text-gray-600">Genomsnittligt Betyg</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">2,543</div>
                  <div className="text-sm text-gray-600">Positiva Recensioner</div>
                </div>
              </div>
            </div>
            
            {/* Swedish Cities Coverage */}
            <div className="mt-6 bg-blue-50 p-4 rounded-xl">
              <h4 className="font-bold text-gray-900 mb-3">🗺️ Täcker Hela Sverige</h4>
              <div className="text-sm text-gray-700 leading-relaxed">
                <strong>Större städer:</strong> Stockholm, Göteborg, Malmö, Uppsala, Västerås, Örebro, Linköping, Helsingborg, Jönköping, Norrköping, Lund, Umeå, Gävle, Borås, Eskilstuna, Karlstad, Växjö, Halmstad
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section - SEO Gold */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            🤔 Vanliga Frågor Om Samåkning
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-bold text-lg text-gray-900 mb-3">
                Hur fungerar samåkning med VägVänner?
              </h4>
              <p className="text-gray-700">
                Enkelt! Sök efter resor från din stad, kontakta föraren direkt genom appen, 
                bekräfta din bokning och betala säkert. Träffas på överenskommen plats och njut av resan!
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-bold text-lg text-gray-900 mb-3">
                Vad kostar det att använda VägVänner?
              </h4>
              <p className="text-gray-700">
                Inga registreringsavgifter. Du betalar bara för din andel av bensin och slitage till föraren.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-bold text-lg text-gray-900 mb-3">
                Är det säkert att åka med okända personer?
              </h4>
              <p className="text-gray-700">
                Absolut! Alla förare verifieras med legitimation och telefonnummer. 
                Du kan läsa recensioner och se betyg innan du bokar. <strong>98% positiva upplevelser!</strong>
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h4 className="font-bold text-lg text-gray-900 mb-3">
                Kan jag tjäna pengar som förare?
              </h4>
              <p className="text-gray-700">
                Ja! Många förare tjänar <strong>1,500-3,000 SEK extra per månad</strong> genom att 
                erbjuda platser i sina bilar. Perfekt för att täcka bensin och bilkostnader!
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action - Conversion Optimized */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">
            🚀 Börja Spara Pengar Idag!
          </h2>
          <p className="text-xl mb-6 opacity-90">
            Anslut dig till <strong>50,000+</strong> smarta resenärer som redan sparar tusentals kronor
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg hover:shadow-lg transition-all">
              🔍 Hitta Din Resa
            </button>
            <button className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:shadow-lg transition-all">
              💰 Erbjud Skjuts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwedishSEOContent;