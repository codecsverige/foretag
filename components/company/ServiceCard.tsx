'use client'

import { useState } from 'react'
import { HiClock, HiChevronDown, HiChevronUp } from 'react-icons/hi'

interface Service {
  name?: string
  price?: number
  duration?: number
  description?: string
  category?: string
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

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-3 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-sm">{service.name}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs sm:text-sm lg:text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <HiClock className="w-4 h-4" />
              {service.duration || 30} min
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
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {showStrike ? (
            <div className="text-right">
              <span className="text-lg lg:text-base font-bold text-green-600">{discountedPrice} kr</span>
              <span className="block text-sm lg:text-xs text-gray-400 line-through">{price} kr</span>
            </div>
          ) : price > 0 ? (
            <span className="text-lg lg:text-base font-bold text-gray-900">{price} kr</span>
          ) : null}
          
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
