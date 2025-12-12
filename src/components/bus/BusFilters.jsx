import React, { useState } from 'react';
import { BUS_ROUTES_CONFIG } from '../../config/busRoutes.config';
import { HiMagnifyingGlass as HiSearch, HiChevronDown, HiChevronUp } from 'react-icons/hi2';

export default function BusFilters({ filters, onFiltersChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleAmenityToggle = (amenity) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    
    handleChange('amenities', newAmenities);
  };

  return (
    <div className="space-y-4">
      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sök (stad, bolag, nummer)
          </label>
          <input
            type="text"
            value={filters.q || ''}
            onChange={(e) => handleChange('q', e.target.value)}
            placeholder="Skriv vad du söker..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Från
          </label>
          <select
            value={filters.from}
            onChange={(e) => handleChange('from', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alla städer</option>
            {BUS_ROUTES_CONFIG.cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Till
          </label>
          <select
            value={filters.to}
            onChange={(e) => handleChange('to', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alla städer</option>
            {BUS_ROUTES_CONFIG.cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datum
          </label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <HiSearch className="w-5 h-5" />
            Sök
          </button>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdvanced ? <HiChevronUp /> : <HiChevronDown />}
          Avancerade filter
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Bus Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bussbolag
            </label>
            <div className="space-y-2">
              {BUS_ROUTES_CONFIG.allowedCompanies.map(company => (
                <label key={company} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="company"
                    value={company}
                    checked={filters.company === company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    className="text-blue-600"
                  />
                  <span>{company}</span>
                </label>
              ))}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="company"
                  value=""
                  checked={filters.company === ''}
                  onChange={(e) => handleChange('company', '')}
                  className="text-blue-600"
                />
                <span>Alla bolag</span>
              </label>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bekvämligheter
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(BUS_ROUTES_CONFIG.amenities).map(([key, amenity]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(key)}
                    onChange={() => handleAmenityToggle(key)}
                    className="text-blue-600"
                  />
                  <span className="text-lg" title={amenity.label}>
                    {amenity.icon}
                  </span>
                  <span className="text-sm">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <button
              onClick={() => onFiltersChange({
                from: '',
                to: '',
                date: '',
                company: '',
                amenities: []
              })}
              className="text-gray-600 hover:text-gray-800"
            >
              Rensa filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}