'use client'

import { useState } from 'react'
import { HiClock, HiChevronDown, HiChevronUp } from 'react-icons/hi'

interface ServiceOption {
  name: string
  price: number
  included: boolean
}

interface Service {
  name?: string
  price?: number
  priceType?: 'fixed' | 'range' | 'quote'
  priceMax?: number
  duration?: number
  durationFlexible?: boolean
  description?: string
  category?: string
  options?: ServiceOption[]
}

interface ServiceCardProps {
  service: Service
  onBook: (service: Service) => void
  discountedPrice?: number
  hasDiscount?: boolean
}

export default function ServiceCard({ service, onBook, discountedPrice, hasDiscount }: ServiceCardProps) {
  const [expanded, setExpanded] = useState(false)
  const price = service.price || 0
  const showStrike = hasDiscount && discountedPrice && discountedPrice < price

  // Format price display based on price type
  const formatPrice = () => {
    if (service.priceType === 'quote') {
      return <span className="text-base lg:text-sm font-semibold text-gray-700">Enligt offert</span>
    }
    if (service.priceType === 'range' && service.priceMax) {
      return <span className="text-lg lg:text-base font-bold text-gray-900">{price} - {service.priceMax} kr</span>
    }
    if (showStrike) {
      return (
        <div className="text-right">
          <span className="text-lg lg:text-base font-bold text-green-600">{discountedPrice} kr</span>
          <span className="block text-sm lg:text-xs text-gray-400 line-through">{price} kr</span>
        </div>
      )
    }
    return price > 0 ? <span className="text-lg lg:text-base font-bold text-gray-900">{price} kr</span> : null
  }

  // Format duration display
  const formatDuration = () => {
    if (service.durationFlexible) {
      return 'Tid varierar'
    }
    return `${service.duration || 30} min`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-3 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-sm">{service.name}</h3>
            {service.category && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{service.category}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm lg:text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <HiClock className="w-4 h-4" />
              {formatDuration()}
            </span>
          </div>
          
          {service.description && (
            <div className="mt-2">
              <p className={`text-sm lg:text-xs text-gray-600 ${expanded ? '' : 'line-clamp-2'}`}>
                {service.description}
              </p>
              {service.description.length > 100 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-brand text-sm lg:text-xs font-medium mt-1 flex items-center gap-1 hover:underline"
                >
                  {expanded ? (
                    <>Visa mindre <HiChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Läs mer <HiChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Service Options Display */}
          {service.options && service.options.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Tillval & alternativ:</p>
              <div className="flex flex-wrap gap-1.5">
                {service.options.map((option, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      option.included 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {option.included ? '✓' : '+'} {option.name}
                    {!option.included && option.price > 0 && (
                      <span className="font-medium">+{option.price} kr</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {formatPrice()}
          
          <button
            onClick={() => onBook(service)}
            className="bg-brand hover:bg-brand-dark text-white px-4 py-2 lg:px-3 lg:py-1.5 rounded-lg text-sm lg:text-xs font-medium transition-colors"
          >
            Boka
          </button>
        </div>
      </div>
    </div>
  )
}
