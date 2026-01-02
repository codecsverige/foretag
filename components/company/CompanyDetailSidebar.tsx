'use client'

import { HiPhone, HiMail, HiGlobe, HiClock, HiLocationMarker } from 'react-icons/hi'

interface CompanyDetailSidebarProps {
  company: {
    phone?: string
    email?: string
    website?: string
    address?: string
    city?: string
    openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  }
  lowestPrice?: number
  discountedPrice?: number
  hasDiscount?: boolean
  onBookingClick?: () => void
  isOpenNow?: boolean
  todayHours?: { open: string; close: string; closed: boolean }
}

const dayNames: Record<string, string> = {
  monday: 'Mån',
  tuesday: 'Tis',
  wednesday: 'Ons',
  thursday: 'Tor',
  friday: 'Fre',
  saturday: 'Lör',
  sunday: 'Sön',
}

export default function CompanyDetailSidebar({
  company,
  lowestPrice,
  discountedPrice,
  hasDiscount,
  onBookingClick,
  isOpenNow,
  todayHours,
}: CompanyDetailSidebarProps) {
  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      {/* Pricing & Booking Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {/* Price */}
        {lowestPrice && lowestPrice > 0 && (
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              {hasDiscount && discountedPrice && discountedPrice < lowestPrice ? (
                <>
                  <span className="text-3xl font-bold text-gray-900">{discountedPrice} kr</span>
                  <span className="text-lg text-gray-400 line-through">{lowestPrice} kr</span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900">{lowestPrice} kr</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Från pris per tjänst</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onBookingClick}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all"
          >
            Boka nu
          </button>
          
          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition"
            >
              <HiPhone className="w-5 h-5" />
              Ring {company.phone}
            </a>
          )}
        </div>

        {/* Status Badge */}
        {todayHours && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <HiClock className="w-5 h-5 text-gray-400" />
              {!todayHours.closed ? (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isOpenNow ? (
                      <span className="text-sm font-semibold text-green-700">Öppet nu</span>
                    ) : (
                      <span className="text-sm font-semibold text-red-600">Stängt</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {todayHours.open} - {todayHours.close}
                  </p>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-500">Stängt idag</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Opening Hours Card */}
      {company.openingHours && Object.keys(company.openingHours).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiClock className="w-5 h-5 text-gray-400" />
            Öppettider
          </h3>
          <div className="space-y-2">
            {Object.entries(company.openingHours).map(([day, hours]) => (
              <div key={day} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">{dayNames[day] || day}</span>
                {hours.closed ? (
                  <span className="text-gray-500">Stängt</span>
                ) : (
                  <span className="text-gray-900">
                    {hours.open} - {hours.close}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Kontakt</h3>
        <div className="space-y-3">
          {company.address && (
            <div className="flex items-start gap-3">
              <HiLocationMarker className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-gray-900">{company.address}</p>
                {company.city && <p className="text-gray-500">{company.city}</p>}
              </div>
            </div>
          )}
          
          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              className="flex items-center gap-3 text-sm text-gray-900 hover:text-blue-600 transition"
            >
              <HiPhone className="w-5 h-5 text-gray-400" />
              <span>{company.phone}</span>
            </a>
          )}
          
          {company.email && (
            <a
              href={`mailto:${company.email}`}
              className="flex items-center gap-3 text-sm text-gray-900 hover:text-blue-600 transition"
            >
              <HiMail className="w-5 h-5 text-gray-400" />
              <span>{company.email}</span>
            </a>
          )}
          
          {company.website && (
            <a
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-gray-900 hover:text-blue-600 transition"
            >
              <HiGlobe className="w-5 h-5 text-gray-400" />
              <span>Webbplats</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
