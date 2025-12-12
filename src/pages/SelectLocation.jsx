// src/pages/SelectLocation.jsx - Enhanced UI for PR #82
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import PageMeta from "../components/PageMeta";
import { getCitySuggestions } from "../utils/citySearch";
import { sanitizeInput } from "../utils/security";
import { extractCity } from "../utils/address";
import { 
  FaMapMarkerAlt, 
  FaLocationArrow, 
  FaSearch, 
  FaArrowRight, 
  FaArrowLeft,
  FaTimes,
  FaSpinner,
  FaCheck,
  FaInfoCircle
} from "react-icons/fa";

// Enhanced Swedish address parser
const parseSwedishAddress = (fullName) => {
  if (!fullName) return { city: "", street: "", region: "", postalCode: "" };
  
  const parts = fullName.split(",").map((p) => p.trim());
  
  // Swedish address patterns: "Street Number, PostalCode City, Region, Country"
  // or "City, Municipality, County, Country"
  
  let city = "";
  let street = "";
  let region = "";
  let postalCode = "";
  
  // Look for postal code pattern (5 digits followed by city name)
  const postalPattern = /(\d{3}\s?\d{2})\s+([^,]+)/;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const postalMatch = part.match(postalPattern);
    
    if (postalMatch) {
      postalCode = postalMatch[1].replace(/\s/g, '');
      city = postalMatch[2];
      // Street is usually the first part
      if (i > 0) street = parts.slice(0, i).join(", ");
      // Region is usually after city
      if (i + 1 < parts.length && !parts[i + 1].toLowerCase().includes('sweden')) {
        region = parts[i + 1];
      }
      break;
    }
  }
  
  // If no postal code found, use fallback logic
  if (!city) {
    // Try to find city from known Swedish patterns
    const cityPart = parts.find(p => 
      !p.toLowerCase().includes('sweden') && 
      !p.toLowerCase().includes('sverige') &&
      !p.match(/^\d/) && // Not starting with number
      p.length > 2
    );
    
    city = cityPart || parts[0] || "";
    
    // If first part looks like street (contains numbers), use it as street
    if (parts[0] && parts[0].match(/\d/)) {
      street = parts[0];
    }
    
    // Region is usually second to last (before country)
    if (parts.length > 2) {
      region = parts[parts.length - 2];
    }
  }
  
  return { 
    city: city.trim(), 
    street: street.trim(), 
    region: region.trim(),
    postalCode: postalCode.trim()
  };
};

// Suggestions are provided via utils/citySearch with cache, abort, and Fuse fallback

export default function SelectLocation() {
  /* ⚠️ Telefonverifiering tillåts senare i flödet (inte här) */

  const navigate = useNavigate();
  const [step, setStep] = useState("from");
  const [from, setFrom] = useState({ city: "", street: "", description: "" });
  const [to, setTo] = useState({ city: "", street: "", description: "" });
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef();
  const suggestionClicked = useRef(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const current = step === "from" ? from : to;
  const setCurrent = step === "from" ? setFrom : setTo;

  /* جلب مقترحات البحث (مؤخَّرة)  */
  const debouncedFetch = useCallback(
    debounce(async (q) => {
      if (!q || q.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const res = await getCitySuggestions(q);
        // Enhanced sorting for better accuracy
        const sortedRes = (res || []).sort((a, b) => {
          const aCity = a.label.split(',')[0]?.trim().toLowerCase() || '';
          const bCity = b.label.split(',')[0]?.trim().toLowerCase() || '';
          const queryLower = q.toLowerCase().trim();
          
          // Calculate relevance scores
          const getRelevanceScore = (cityName) => {
            let score = 0;
            
            // Exact match gets highest score
            if (cityName === queryLower) score += 1000;
            
            // Starts with query gets high score
            if (cityName.startsWith(queryLower)) score += 500;
            
            // Contains query gets medium score
            if (cityName.includes(queryLower)) score += 100;
            
            // Penalize very long names (less likely to be major cities)
            if (cityName.length > 15) score -= 50;
            
            // Bonus for shorter names (major cities tend to have shorter names)
            if (cityName.length <= 8) score += 50;
            
            return score;
          };
          
          const aScore = getRelevanceScore(aCity);
          const bScore = getRelevanceScore(bCity);
          
          // Sort by score (higher first), then by length (shorter first)
          if (aScore !== bScore) return bScore - aScore;
          return aCity.length - bCity.length;
        });
        
        setSuggestions(sortedRes.slice(0, 8)); // Limit to 8 best results
        setHighlightedIndex(sortedRes.length > 0 ? 0 : -1);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setHighlightedIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    // Only search if user is actively typing, not after selection
    if (suggestionClicked.current) {
      suggestionClicked.current = false;
      return;
    }
    
    if (query.length > 1) {
      debouncedFetch(query);
    } else {
      setSuggestions([]);
      setLoading(false);
    }
  }, [query, debouncedFetch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const handleSelect = (item) => {
    const { city, street, region, postalCode } = parseSwedishAddress(item.label);
    
    // Create comprehensive description
    let description = "";
    if (postalCode) description += `${postalCode} `;
    if (region && region !== city) description += `${region}`;
    
    // Update current location with parsed Swedish address
    setCurrent({ 
      ...current, 
      city: city, 
      street: street,
      description: description.trim()
    });
    
    // Set query to show the selected city
    setQuery(city);
    setSuggestions([]);
    suggestionClicked.current = true;
    setHighlightedIndex(-1);
    setError(""); 
    setLoading(false);
    
    // Visual feedback
    setTimeout(() => {
      inputRef.current?.blur();
      setSuggestions([]);
    }, 100);
  };

  const handleNext = () => {
    if (!current.city.trim()) {
      setError(step === "from" ? "Ange startpunkt för att fortsätta." : "Ange destination för att fortsätta.");
      return;
    }

    if (step === "from") {
      setStep("to");
      setQuery(to.city);
    } else {
      navigate("/create-ride", {
        state: {
          from: `${from.city}${from.street ? `, ${from.street}` : ""}`,
          fromDesc: from.description,
          to: `${to.city}${to.street ? `, ${to.street}` : ""}`,
          toDesc: to.description,
        },
      });
    }
    setError("");
  };

  const startGPS = () => {
    setGpsLoading(true);
    setError(""); // Clear any existing errors
    
    if (!navigator.geolocation) {
      setError("Din webbläsare stödjer inte platstjänster. Prova att ange plats manuellt.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Use Nominatim API to reverse geocode the coordinates
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=sv&addressdetails=1&zoom=10`;
          const res = await fetch(url, {
            headers: { 
              "User-Agent": "VagVanner/1.0 (https://vagvanner.se)",
              "Accept": "application/json"
            },
          });
          
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          
          const data = await res.json();
          
          if (!data || !data.display_name) {
            throw new Error("No address data received");
          }
          
          const { city, street } = parseSwedishAddress(data.display_name);
          
          if (!city) {
            throw new Error("Could not extract city from location data");
          }
          
          // Update current location with GPS data
          setCurrent({ 
            ...current, 
            city: city, 
            street: street || "",
            description: current.description // Keep existing description
          });
          setQuery(city);
          
          // Clear any errors on success
          setError("");
          
        } catch (e) {
          console.error("GPS location error:", e);
          setError("Kunde inte hämta din adress. Kontrollera din internetanslutning och försök igen.");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        let errorMessage = "Kunde inte hämta din plats.";
        
        if (err && err.code === 1) {
          errorMessage = "Åtkomst till plats nekades. Tillåt platsåtkomst i din webbläsare för att använda denna funktion.";
        } else if (err && err.code === 2) {
          errorMessage = "Din position är inte tillgänglig för tillfället. Kontrollera din internetanslutning och försök igen.";
        } else if (err && err.code === 3) {
          errorMessage = "Tidsgränsen för att hämta din plats nåddes. Försök igen eller ange plats manuellt.";
        }
        
        setError(errorMessage);
        setGpsLoading(false);
      },
      { 
        enableHighAccuracy: true, // Better accuracy
        timeout: 15000, // Longer timeout
        maximumAge: 60000 // Cache for 1 minute
      }
    );
  };

  const useGPS = () => {
    setShowConsent(true);
  };

  const handleBlur = () => {
    // Longer timeout to allow for suggestion clicks
    setTimeout(() => {
      if (!suggestionClicked.current) {
        setSuggestions([]);
        setLoading(false);
      }
      suggestionClicked.current = false;
    }, 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setHighlightedIndex((i) => {
        const nextIndex = i + 1;
        return nextIndex >= suggestions.length ? 0 : nextIndex;
      });
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setHighlightedIndex((i) => {
        return i <= 0 ? (suggestions.length - 1) : (i - 1);
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && highlightedIndex >= 0) {
        // Select from suggestions
        const suggestion = suggestions[highlightedIndex];
        if (suggestion) {
          handleSelect(suggestion);
        }
      } else if (query.trim()) {
        // Manual input - use typed text as city name
        setCurrent({ ...current, city: query.trim() });
        setSuggestions([]);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        setError(""); // Clear any errors
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSuggestions([]);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === "Tab") {
      // Allow tab to work normally but clear suggestions
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageMeta
        title="Välj plats - VägVänner"
        description="Välj startpunkt och destination på ett enkelt och professionellt sätt"
        noindex={true}
      />
      
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header بسيط ومحترف */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === "from" ? "Välj startpunkt" : "Välj destination"}
          </h1>
          <p className="text-base text-gray-600">
            {step === "from" 
              ? "Ange varifrån du vill resa eller erbjuda skjuts." 
              : "Ange vart du vill åka eller kan köra andra."
            }
          </p>
          <div className="mt-2 text-xs text-gray-500">
            {step === "from" ? "Steg 1 av 2" : "Steg 2 av 2"}
          </div>
        </div>

        {/* Main Card بسيط */}
        <div className="bg-white rounded-2xl shadow overflow-hidden border border-gray-200">
          <div className="p-6">
            {/* Error Message بسيط */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <FaInfoCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
                <button 
                  onClick={() => setError("")}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* City Input */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                {step === "from" ? "Startpunkt" : "Destination"} <span className="text-red-500">*</span>
                <div className="text-xs text-gray-500 font-normal mt-1">
                  Skriv stad, adress eller postnummer
                </div>
              </label>
              
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <FaSearch className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  ref={inputRef}
                  className="w-full pl-12 pr-20 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder={step === "from" ? "T.ex. Stockholm, Göteborg, 11122..." : "T.ex. Malmö, Drottninggatan 15, 41105..."}
                  value={query}
                  onChange={(e) => {
                    e.preventDefault();
                    const val = e.target.value;
                    setQuery(val);
                    setCurrent({ ...current, city: val });
                    setError("");
                    suggestionClicked.current = false;
                  }}
                  onFocus={() => {
                    // Clear suggestions when focusing unless there's a meaningful query
                    if (query.length <= 1) {
                      setSuggestions([]);
                      setLoading(false);
                    }
                  }}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  spellCheck="false"
                />
                
                {/* GPS Button محسن */}
                <button
                  onClick={useGPS}
                  disabled={gpsLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 shadow disabled:cursor-not-allowed"
                  title="Använd min nuvarande plats"
                >
                  {gpsLoading ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <FaLocationArrow className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Loading indicator محسن */}
              {loading && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  <span>Söker efter platser...</span>
                </div>
              )}
              
              {/* Suggestions محسن */}
              {suggestions.length > 0 && (
                <div className="mt-3 border-2 border-gray-100 rounded-xl bg-white shadow max-h-64 overflow-auto">
                  <div className="p-2 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FaSearch className="w-3 h-3" />
                      <span>{suggestions.length} resultat hittades</span>
                    </div>
                  </div>
                  {suggestions.map((s, i) => {
                    const { city, street, region, postalCode } = parseSwedishAddress(s.label);
                    
                    // Create display components
                    const primaryText = city || s.label.split(',')[0]?.trim() || '';
                    let secondaryText = "";
                    
                    // Build secondary text with Swedish address components
                    const parts = [];
                    if (street) parts.push(street);
                    if (postalCode) parts.push(postalCode);
                    if (region && region !== city) parts.push(region);
                    secondaryText = parts.join(", ");
                    
                    return (
                      <div
                        key={i}
                        className={`p-3 cursor-pointer border-b border-gray-50 last:border-b-0 transition-all duration-200 ${
                          i === highlightedIndex 
                            ? 'bg-blue-50 border-l-4 border-l-blue-500 transform translate-x-1' 
                            : 'hover:bg-gray-50 hover:transform hover:translate-x-0.5'
                        }`}
                        onMouseDown={() => handleSelect(s)}
                        onMouseEnter={() => setHighlightedIndex(i)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            i === highlightedIndex ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <FaMapMarkerAlt className={`w-3 h-3 ${
                              i === highlightedIndex ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm leading-tight">
                              {primaryText}
                            </div>
                            {secondaryText && (
                              <div className="text-xs text-gray-500 leading-tight mt-0.5" title={s.label}>
                                {secondaryText}
                              </div>
                            )}
                            {/* Show postal code prominently if available */}
                            {postalCode && (
                              <div className="text-xs text-blue-600 font-medium mt-0.5">
                                📮 {postalCode}
                              </div>
                            )}
                          </div>
                          {i === highlightedIndex && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs text-blue-600 font-medium">Välj</span>
                              <FaCheck className="w-3 h-3 text-blue-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="p-2 bg-gray-50 border-t border-gray-100">
                    <div className="text-xs text-gray-500 text-center mb-2">Använd piltangenterna för att navigera, Enter för att välja</div>
                    <button
                      type="button"
                      onClick={() => {
                        // Allow manual input - use current query as city name
                        if (query.trim()) {
                          setCurrent({ ...current, city: query.trim() });
                          setSuggestions([]);
                          setHighlightedIndex(-1);
                          inputRef.current?.blur();
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                      <span>Använd "{query}" som plats</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Avancerade fält (kولapsible) */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full text-left flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-900">Avancerade fält (valfritt)</span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              {showAdvanced && (
                <div className="mt-4 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Specifik adress (valfritt)</label>
                    <input
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="T.ex. Drottninggatan 15, Centralstationen, T-Centralen..."
                      value={current.street}
                      onChange={(e) => setCurrent({ ...current, street: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Ytterligare information (valfritt)</label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                      rows={3}
                      placeholder="T.ex. 'vid ICA-butiken', 'intill tunnelbanestation', 'parkeringsplats bakom huset'..."
                      value={current.description}
                      onChange={(e) => setCurrent({ ...current, description: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Description Input محسن */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Ytterligare information (valfritt)
                <div className="text-xs text-gray-500 font-normal mt-1">
                  Hjälp andra att hitta exakt rätt plats
                </div>
              </label>
              <textarea
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-100 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                rows={3}
                placeholder="T.ex. 'vid ICA-butiken', 'intill tunnelbanestation', 'röd tegelbyggnad', 'parkeringsplats bakom huset'..."
                value={current.description}
                onChange={(e) =>
                  setCurrent({ ...current, description: e.target.value })
                }
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {step === "to" && (
                <button
                  onClick={() => {
                    setStep("from");
                    setQuery(from.city);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  <FaArrowLeft className="w-4 h-4" />
                  Tillbaka till startpunkt
                </button>
              )}
              
              <button
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 text-white font-semibold rounded-xl shadow hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  !current.city.trim()
                    ? "bg-gray-400"
                    : step === "from"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                onClick={handleNext}
                disabled={!current.city.trim()}
              >
                <span className="text-base">{step === "from" ? "Fortsätt till destination" : "Bekräfta vald plats"}</span>
                <FaArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Info cards removed to keep page minimal and professional */}
      </div>

      {/* Consent Modal */}
      {showConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FaLocationArrow className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Använd din plats</h3>
                  <p className="text-sm text-gray-600">För att föreslå närliggande orter</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <FaInfoCircle className="w-4 h-4 inline mr-2" />
                  Vi använder endast din plats för att föreslå närliggande städer. Platsinformationen lagras inte.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConsent(false)} 
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Avbryt
                </button>
                <button 
                  onClick={() => { setShowConsent(false); startGPS(); }} 
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50" 
                  disabled={gpsLoading}
                >
                  {gpsLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      Hämtar...
                    </div>
                  ) : (
                    "Tillåt platsåtkomst"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
