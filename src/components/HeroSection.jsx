import React from "react";
import { Link } from "react-router-dom";
import { HiArrowRight, HiUsers, HiClock, HiSparkles, HiCalendar, HiBuildingStorefront } from "react-icons/hi2";

export default function HeroSection({ onActionClick }) {
  
  const handleCreateAdClick = () => {
    if (onActionClick) onActionClick();
  };

  const handleSearchClick = () => {
    if (onActionClick) onActionClick();
    setTimeout(() => {
      document.querySelector('.search-bar input')?.focus();
    }, 100);
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white py-12 md:py-16 mb-6 md:mb-8 rounded-xl md:rounded-2xl mx-2 md:mx-4 mt-2 md:mt-4 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-white/5 bg-opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            BokaNära
            <span className="block text-lg md:text-3xl font-normal mt-1 md:mt-2 text-blue-100">
              Hitta och boka lokala tjänster enkelt
            </span>
          </h1>
          <p className="text-lg md:text-2xl mb-6 md:mb-8 opacity-90 max-w-3xl mx-auto leading-relaxed">
            Upptäck företag nära dig. Boka frisör, massage, städning och mer – allt på ett ställe med bekräftelse och påminnelser.
          </p>
        </div>

        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-8 md:mb-12">
          <Link 
            to="/create-ride"
            onClick={handleCreateAdClick}
            className="w-full sm:w-auto bg-white text-blue-600 px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 group transform"
          >
            <HiBuildingStorefront className="w-7 h-7" />
            <span>Skapa annons</span>
            <HiArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
          
          <div className="text-blue-100 font-semibold text-base md:text-lg bg-white/10 px-4 py-2 rounded-full">
            eller
          </div>
          
          <button 
            onClick={handleSearchClick}
            className="w-full sm:w-auto border-3 border-white bg-transparent text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl hover:bg-white hover:text-blue-600 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3 group transform"
          >
            <span className="text-2xl">🔍</span>
            <span>Hitta tjänster</span>
            <HiArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
            <HiUsers className="w-12 h-12 mx-auto mb-4 text-blue-200" />
            <div className="text-3xl font-bold mb-2">1000+</div>
            <div className="text-blue-100">Lokala företag</div>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
            <HiCalendar className="w-12 h-12 mx-auto mb-4 text-blue-200" />
            <div className="text-3xl font-bold mb-2">Enkelt</div>
            <div className="text-blue-100">Boka på sekunder</div>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
            <HiClock className="w-12 h-12 mx-auto mb-4 text-blue-200" />
            <div className="text-3xl font-bold mb-2">SMS</div>
            <div className="text-blue-100">Påminnelser automatiskt</div>
          </div>
        </div>

        {/* Popular categories */}
        <div className="text-center">
          <p className="text-blue-100 mb-4 text-lg">Populära kategorier:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { emoji: "💇", label: "Frisör" },
              { emoji: "💆", label: "Massage" },
              { emoji: "🧹", label: "Städning" },
              { emoji: "🚗", label: "Bil & Motor" },
              { emoji: "🏥", label: "Hälsa" },
              { emoji: "📚", label: "Utbildning" }
            ].map(({ emoji, label }, index) => (
              <button
                key={`${label}-${index}`}
                onClick={handleSearchClick}
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/30 hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
