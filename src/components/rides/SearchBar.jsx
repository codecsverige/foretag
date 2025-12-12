import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { HiMagnifyingGlass, HiClock, HiMapPin } from "react-icons/hi2";

/**
 * SearchBar مع autocomplete
 */
export default function SearchBar({ value, onChange, placeholder }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vagvanner_recent_searches') || '[]');
    } catch {
      return [];
    }
  });
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const swedishCities = [
    "Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås", "Örebro",
    "Linköping", "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå",
    "Gävle", "Borås", "Eskilstuna", "Södertälje", "Karlstad", "Täby",
    "Växjö", "Halmstad", "Sundsvall", "Luleå", "Trollhättan", "Östersund",
    "Borlänge", "Falun", "Skövde", "Karlskrona", "Kristianstad", "Kalmar"
  ];

  const popularRoutes = [
    "Stockholm Göteborg", "Malmö Stockholm", "Uppsala Stockholm",
    "Göteborg Malmö", "Stockholm Malmö", "Linköping Stockholm",
    "Västerås Stockholm", "Stockholm Uppsala", "Göteborg Stockholm"
  ];

  const getSuggestions = () => {
    if (!value) {
      return [
        ...recentSearches.slice(0, 3).map(search => ({ type: 'recent', text: search })),
        ...popularRoutes.slice(0, 4).map(route => ({ type: 'popular', text: route }))
      ];
    }

    const filtered = swedishCities
      .filter(city => city.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 6)
      .map(city => ({ type: 'city', text: city }));

    const routeFiltered = popularRoutes
      .filter(route => route.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 3)
      .map(route => ({ type: 'route', text: route }));

    return [...filtered, ...routeFiltered];
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    
    // Save to recent searches
    const updated = [suggestion.text, ...recentSearches.filter(s => s !== suggestion.text)].slice(0, 5);
    localStorage.setItem('vagvanner_recent_searches', JSON.stringify(updated));
  };

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleBlur = (e) => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget)) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  const suggestions = getSuggestions();

  return (
    <div className="relative max-w-2xl w-full mx-auto search-bar">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || "Sök resor: t.ex. Stockholm → Göteborg, Malmö, Uppsala..."}
          className="w-full border-2 border-gray-200 rounded-2xl py-4 pl-6 pr-14 shadow-lg
                     text-base focus:ring-4 focus:ring-blue-600/20 focus:border-brand
                     dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700
                     transition-all duration-200 hover:shadow-xl bg-white"
          autoComplete="off"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand text-white p-2 rounded-xl">
          <HiMagnifyingGlass className="w-5 h-5" />
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl mt-2 max-h-80 overflow-y-auto z-50"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                {suggestion.type === 'recent' && (
                  <HiClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                {suggestion.type === 'city' && (
                  <HiMapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
                {(suggestion.type === 'popular' || suggestion.type === 'route') && (
                  <span className="text-orange-500 text-sm flex-shrink-0">🔥</span>
                )}
                
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{suggestion.text}</div>
                  <div className="text-xs text-gray-500">
                    {suggestion.type === 'recent' && 'Senaste sökning'}
                    {suggestion.type === 'city' && 'Stad'}
                    {suggestion.type === 'popular' && 'Populär rutt'}
                    {suggestion.type === 'route' && 'Rutt'}
                  </div>
                </div>
              </button>
            ))}
            
            {/* Tip at bottom */}
            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
              💡 Tips: Använd "Stockholm Göteborg" för bästa resultat
            </div>
          </div>
        )}
      </div>
      
      {!showSuggestions && (
        <div className="text-center mt-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            💡 Tips: Klicka för förslag eller skriv stad/rutt
          </span>
        </div>
      )}
    </div>
  );
}
SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};
