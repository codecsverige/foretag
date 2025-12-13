import React, { useState } from "react";
import { HiShieldCheck, HiUsers, HiStar, HiCalendar, HiChevronDown, HiChevronUp, HiClock, HiBuildingStorefront } from "react-icons/hi2";

export default function TrustSection() {
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  
  const trustStats = [
    {
      icon: HiBuildingStorefront,
      number: "1,000+",
      label: "Lokala företag",
      description: "Över 1,000 företag listar sina tjänster på BokaNära"
    },
    {
      icon: HiStar,
      number: "4.9/5",
      label: "Genomsnittligt betyg",
      description: "Högt betyg från nöjda kunder"
    },
    {
      icon: HiCalendar,
      number: "10,000+",
      label: "Bokningar/månad",
      description: "Tusentals bokningar genomförs varje månad"
    },
    {
      icon: HiClock,
      number: "SMS",
      label: "Automatiska påminnelser",
      description: "Aldrig missa en tid med SMS-påminnelser"
    }
  ];

  const testimonials = [
    {
      name: "Emma S.",
      location: "Stockholm",
      business: "Frisör",
      text: "BokaNära har förändrat hur jag driver min salong. Mina kunder bokar enkelt och jag slipper missade tider!",
      rating: 5
    },
    {
      name: "Johan K.",
      location: "Göteborg", 
      business: "Kund",
      text: "Så smidigt att hitta och boka tjänster i min stad. Sparar massor av tid!",
      rating: 5
    },
    {
      name: "Sara L.",
      location: "Malmö",
      business: "Massage",
      text: "Jag har fått 30% fler kunder sen jag började använda BokaNära. Rekommenderar starkt!",
      rating: 5
    }
  ];

  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Varför väljer företag och kunder BokaNära?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sveriges smartaste plattform för att hitta och boka lokala tjänster
          </p>
        </div>

        {/* Trust Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {trustStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center group">
                <div className="bg-blue-50 rounded-2xl p-6 mb-4 group-hover:bg-blue-100 transition-colors">
                  <IconComponent className="w-8 h-8 md:w-12 md:h-12 mx-auto text-blue-600 mb-3" />
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm md:text-base font-semibold text-gray-700 mb-1">
                    {stat.label}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500 hidden md:block">
                    {stat.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonials - Collapsible */}
        <div className="bg-gray-50 rounded-3xl p-6 md:p-8">
          <button
            onClick={() => setShowTestimonials(!showTestimonials)}
            className="flex items-center justify-center gap-2 mx-auto text-gray-900 hover:text-blue-600 font-bold text-xl md:text-2xl transition-colors mb-4"
          >
            <span>💬 Vad säger våra användare?</span>
            {showTestimonials ? (
              <HiChevronUp className="w-6 h-6" />
            ) : (
              <HiChevronDown className="w-6 h-6" />
            )}
          </button>
          
          {showTestimonials && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <HiStar key={i} className="w-5 h-5 text-yellow-400" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-gray-700 mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.location} • {testimonial.business}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features for Businesses - Collapsible */}
        <div className="mt-12">
          <button
            onClick={() => setShowSecurity(!showSecurity)}
            className="flex items-center justify-center gap-2 mx-auto text-gray-900 hover:text-blue-600 font-bold text-xl md:text-2xl transition-colors mb-6"
          >
            <span>🏢 För företag</span>
            {showSecurity ? (
              <HiChevronUp className="w-6 h-6" />
            ) : (
              <HiChevronDown className="w-6 h-6" />
            )}
          </button>
          
          {showSecurity && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center bg-white rounded-xl p-6 shadow-sm">
                <div className="bg-green-100 p-4 rounded-full mb-4">
                  <HiUsers className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Nå nya kunder</h4>
                <p className="text-gray-600 text-sm text-center">Tusentals potentiella kunder söker tjänster varje dag</p>
              </div>
              
              <div className="flex flex-col items-center bg-white rounded-xl p-6 shadow-sm">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">SMS-påminnelser</h4>
                <p className="text-gray-600 text-sm text-center">Automatiska påminnelser minskar no-shows med 80%</p>
              </div>
              
              <div className="flex flex-col items-center bg-white rounded-xl p-6 shadow-sm">
                <div className="bg-purple-100 p-4 rounded-full mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Enkel hantering</h4>
                <p className="text-gray-600 text-sm text-center">Hantera alla bokningar från en översiktlig dashboard</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
