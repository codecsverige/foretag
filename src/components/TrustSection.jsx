import React, { useState } from "react";
import { HiShieldCheck, HiUsers, HiStar, HiGlobeAlt, HiChevronDown, HiChevronUp } from "react-icons/hi2";

export default function TrustSection() {
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const trustStats = [
    {
      icon: HiUsers,
      number: "50,000+",
      label: "Nöjda resenärer",
      description: "Över 50,000 personer har rest säkert med VägVänner"
    },
    {
      icon: HiStar,
      number: "4.8/5",
      label: "Genomsnittligt betyg",
      description: "Högt betyg från våra användare"
    },
    {
      icon: HiShieldCheck,
      number: "100%",
      label: "Säker plattform",
      description: "Verifierade profiler och säkra betalningar"
    },
    {
      icon: HiGlobeAlt,
      number: "5+",
      label: "År av erfarenhet",
      description: "Sveriges mest pålitliga samåkningsplattform"
    }
  ];

  const testimonials = [
    {
      name: "Anna L.",
      location: "Stockholm",
      text: "Fantastisk service! Sparade över 2000 kr per månad på mina resor till jobbet.",
      rating: 5
    },
    {
      name: "Erik M.",
      location: "Göteborg", 
      text: "Enkelt att hitta resenärer och alltid trevligt sällskap på långa resor.",
      rating: 5
    },
    {
      name: "Maria S.",
      location: "Malmö",
      text: "Miljövänligt och ekonomiskt smart. Använder VägVänner varje vecka!",
      rating: 5
    }
  ];

  return (
    <section className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Varför väljer 50,000+ svenskar VägVänner?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sveriges mest pålitliga och populära plattform för samåkning
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
                        {testimonial.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Features - Collapsible */}
        <div className="mt-12">
          <button
            onClick={() => setShowSecurity(!showSecurity)}
            className="flex items-center justify-center gap-2 mx-auto text-gray-900 hover:text-blue-600 font-bold text-xl md:text-2xl transition-colors mb-6"
          >
            <span>🛡️ Din säkerhet är vår prioritet</span>
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
                  <HiShieldCheck className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Verifierade profiler</h4>
                <p className="text-gray-600 text-sm text-center">Alla användare verifieras för din trygghet</p>
              </div>
              
              <div className="flex flex-col items-center bg-white rounded-xl p-6 shadow-sm">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Säkra betalningar</h4>
                <p className="text-gray-600 text-sm text-center">Krypterade transaktioner och datasäkerhet</p>
              </div>
              
              <div className="flex flex-col items-center bg-white rounded-xl p-6 shadow-sm">
                <div className="bg-purple-100 p-4 rounded-full mb-4">
                  <span className="text-2xl">📞</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">24/7 Support</h4>
                <p className="text-gray-600 text-sm text-center">Vi finns här för dig när du behöver hjälp</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}