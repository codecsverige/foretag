import React from "react";

/**
 * مكون لعرض المحتوى الأساسي قبل تحميل JavaScript
 * يحل مشكلة الصفحات الفارغة ويحسن SEO
 */
export default function ServerSideContent({ pathname = "/" }) {
  // محتوى مخصص لكل صفحة
  const getPageContent = () => {
    switch (pathname) {
      case "/":
        return {
          title: "VägVänner – Samåkning & Skjuts i Sverige",
          description: "Sveriges ledande samåkningsplattform. Hitta billiga skjuts eller erbjud resor enkelt, säkert och miljövänligt.",
          content: (
            <div className="max-w-4xl mx-auto px-4 py-12">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                  VägVänner
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Sveriges smartaste samåkningsplattform
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <div className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold">
                    Hitta skjuts
                  </div>
                  <div className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold">
                    Erbjud skjuts
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <div className="text-3xl mb-4">🚗</div>
                  <h3 className="text-xl font-semibold mb-2">Enkel samåkning</h3>
                  <p className="text-gray-600">Hitta eller erbjud resor snabbt och enkelt</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-4">💰</div>
                  <h3 className="text-xl font-semibold mb-2">Spara pengar</h3>
                  <p className="text-gray-600">Dela resekostnaderna med andra</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-4">🌱</div>
                  <h3 className="text-xl font-semibold mb-2">Miljövänligt</h3>
                  <p className="text-gray-600">Minska ditt koldioxidavtryck</p>
                </div>
              </div>
            </div>
          )
        };
        
      case "/select-location":
        return {
          title: "Välj Plats – VägVänner",
          description: "Välj din start- och slutpunkt för att hitta eller erbjuda skjuts.",
          content: (
            <div className="max-w-2xl mx-auto px-4 py-12">
              <h1 className="text-3xl font-bold text-center mb-8">Välj din resa</h1>
              <div className="bg-gray-100 p-8 rounded-lg">
                <p className="text-center text-gray-600">
                  Ange din start- och slutpunkt för att hitta eller erbjuda skjuts
                </p>
              </div>
            </div>
          )
        };
        
      case "/my-rides":
        return {
          title: "Mina Resor – VägVänner",
          description: "Hantera dina bokade resor och erbjudna skjuts.",
          content: (
            <div className="max-w-4xl mx-auto px-4 py-12">
              <h1 className="text-3xl font-bold mb-8">Mina resor</h1>
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-600">Hantera dina bokade resor och erbjudna skjuts</p>
              </div>
            </div>
          )
        };
        
      case "/inbox":
        return {
          title: "Inkorg – VägVänner",
          description: "Dina meddelanden och notifikationer från VägVänner.",
          content: (
            <div className="max-w-4xl mx-auto px-4 py-12">
              <h1 className="text-3xl font-bold mb-8">Inkorg</h1>
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-600">Dina meddelanden och notifikationer</p>
              </div>
            </div>
          )
        };
        
      case "/create-ride":
        return {
          title: "Skapa Resa – VägVänner",
          description: "Erbjud skjuts och skapa en ny resa på VägVänner.",
          content: (
            <div className="max-w-2xl mx-auto px-4 py-12">
              <h1 className="text-3xl font-bold mb-8">Skapa en resa</h1>
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-600">Erbjud skjuts och dela din bil</p>
              </div>
            </div>
          )
        };
        
      case "/book-ride":
        return {
          title: "Boka Resa – VägVänner",
          description: "Hitta och boka skjuts på VägVänner.",
          content: (
            <div className="max-w-4xl mx-auto px-4 py-12">
              <h1 className="text-3xl font-bold mb-8">Boka en resa</h1>
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-600">Hitta och boka skjuts</p>
              </div>
            </div>
          )
        };
        
      default:
        return {
          title: "VägVänner – Samåkning i Sverige",
          description: "Sveriges ledande samåkningsplattform.",
          content: (
            <div className="max-w-4xl mx-auto px-4 py-12">
              <h1 className="text-3xl font-bold text-center mb-8">Välkommen till VägVänner</h1>
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-600">Sveriges smartaste samåkningsplattform</p>
              </div>
            </div>
          )
        };
    }
  };

  const pageContent = getPageContent();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">VägVänner</div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-blue-600">Hem</a>
              <a href="/select-location" className="text-gray-600 hover:text-blue-600">Sök</a>
              <a href="/create-ride" className="text-gray-600 hover:text-blue-600">Skapa</a>
              <a href="/my-rides" className="text-gray-600 hover:text-blue-600">Mina resor</a>
            </nav>
          </div>
        </div>
      </header>
      
      <main>
        {pageContent.content}
      </main>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p>&copy; 2025 VägVänner. Alla rättigheter förbehållna.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 