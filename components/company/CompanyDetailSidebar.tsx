'use client'

import { HiPhone, HiMail, HiGlobe, HiClock, HiLocationMarker, HiShieldCheck, HiBadgeCheck, HiCreditCard, HiLockClosed } from 'react-icons/hi'
import Image from 'next/image'
import Link from 'next/link'

// Format phone number (hide middle digits for free users)
function formatPhoneDisplay(phone: string, showFull: boolean): string {
  if (!phone) return ''
  if (showFull) return phone
  
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 6) return phone
  
  const start = cleaned.slice(0, 3)
  const end = cleaned.slice(-2)
  
  if (cleaned.length === 10) {
    return `${start} XXX XX ${end}`
  }
  
  return `${start}${'X'.repeat(Math.max(0, cleaned.length - 5))}${end}`
}

interface CompanyDetailSidebarProps {
  company: {
    phone?: string
    email?: string
    website?: string
    address?: string
    city?: string
    serviceCities?: string[]
    openingHours?: Record<string, { open: string; close: string; closed: boolean }>
    rutAvdrag?: boolean
    rotAvdrag?: boolean
    paymentMethods?: string[]
    hasInsurance?: boolean
    insuranceInfo?: string
    guarantee?: string
    orgNumber?: string
    logo?: string
    ownerId?: string
    ownerPlan?: 'free' | 'pro' | 'premium'
    socialMedia?: {
      facebook?: string
      instagram?: string
    }
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

const paymentMethodLabels: Record<string, string> = {
  swish: 'Swish',
  kort: 'Kort',
  faktura: 'Faktura',
  kontant: 'Kontant',
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
        {/* Logo */}
        {company.logo && (
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100">
              <Image
                src={company.logo}
                alt="Företagslogo"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}

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

        {/* RUT/ROT Badges */}
        {(company.rutAvdrag || company.rotAvdrag) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {company.rutAvdrag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                RUT-avdrag
              </span>
            )}
            {company.rotAvdrag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                ROT-avdrag
              </span>
            )}
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
            (() => {
              const showFullPhone = company.ownerPlan === 'pro' || company.ownerPlan === 'premium'
              const displayPhone = formatPhoneDisplay(company.phone, showFullPhone)
              
              return showFullPhone ? (
                <a
                  href={`tel:${company.phone}`}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition"
                >
                  <HiPhone className="w-5 h-5" />
                  Ring {displayPhone}
                </a>
              ) : (
                <div className="w-full flex flex-col items-center gap-2 px-5 py-3 bg-gray-50 border-2 border-gray-200 text-gray-500 rounded-xl">
                  <div className="flex items-center gap-2">
                    <HiPhone className="w-5 h-5" />
                    <span className="font-medium">{displayPhone}</span>
                    <HiLockClosed className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-xs text-gray-400">Boka direkt via formuläret ovan</p>
                </div>
              )
            })()
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

          {/* Service Cities */}
          {company.serviceCities && company.serviceCities.length > 1 && (
            <div className="flex items-start gap-3">
              <HiLocationMarker className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-gray-500 text-xs mb-1">Verksam i:</p>
                <p className="text-gray-900">{company.serviceCities.join(', ')}</p>
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

          {/* Social Media */}
          {(company.socialMedia?.facebook || company.socialMedia?.instagram) && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 mt-3">
              {company.socialMedia.facebook && (
                <a
                  href={company.socialMedia.facebook.startsWith('http') ? company.socialMedia.facebook : `https://facebook.com/${company.socialMedia.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>
              )}
              {company.socialMedia.instagram && (
                <a
                  href={company.socialMedia.instagram.startsWith('http') ? company.socialMedia.instagram : `https://instagram.com/${company.socialMedia.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 transition"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  <span>Instagram</span>
                </a>
              )}
            </div>
          )}

          {/* Organization Number */}
          {company.orgNumber && (
            <div className="flex items-center gap-3 text-sm text-gray-500 pt-2 border-t border-gray-100 mt-3">
              <span className="text-xs">Org.nr: {company.orgNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment & Guarantee Card */}
      {(company.paymentMethods?.length || company.hasInsurance || company.guarantee) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiCreditCard className="w-5 h-5 text-gray-400" />
            Betalning & Garanti
          </h3>
          <div className="space-y-4">
            {/* Payment Methods */}
            {company.paymentMethods && company.paymentMethods.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Betalningsmetoder</p>
                <div className="flex flex-wrap gap-2">
                  {company.paymentMethods.map((method) => (
                    <span
                      key={method}
                      className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                    >
                      {paymentMethodLabels[method] || method}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Insurance */}
            {company.hasInsurance && (
              <div className="flex items-start gap-3">
                <HiShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-gray-900 font-medium">Försäkrad</p>
                  {company.insuranceInfo && (
                    <p className="text-gray-500 text-xs mt-0.5">{company.insuranceInfo}</p>
                  )}
                </div>
              </div>
            )}

            {/* Guarantee */}
            {company.guarantee && (
              <div className="flex items-start gap-3">
                <HiBadgeCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-gray-900 font-medium">Garanti</p>
                  <p className="text-gray-500 text-xs mt-0.5">{company.guarantee}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
