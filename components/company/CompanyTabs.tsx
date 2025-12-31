'use client'

import { useEffect, useState, useRef } from 'react'
import { HiClock, HiLocationMarker, HiPhone, HiMail, HiGlobe } from 'react-icons/hi'
import ServiceCard from './ServiceCard'
import ReviewSection from './ReviewSection'

interface Service {
  name?: string
  price?: number
  duration?: number
  description?: string
  category?: string
}

interface Review {
  id: string
  author: string
  rating: number
  comment: string
  date: string
}

interface CompanyTabsProps {
  services: Service[]
  description?: string
  images: string[]
  companyName: string
  rating: number
  reviewCount: number
  reviews?: Review[]
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  address?: string
  city?: string
  phone?: string
  email?: string
  website?: string
  requestedTab?: TabId
  requestedTabNonce?: number
  onBookService?: (service: Service) => void
  applyDiscount?: (price: number, serviceName?: string) => number
  hasDiscount?: boolean
  visibleSections?: {
    about?: boolean
    reviews?: boolean
    contact?: boolean
  }
}

const dayNames: Record<string, string> = {
  monday: 'Måndag',
  tuesday: 'Tisdag',
  wednesday: 'Onsdag',
  thursday: 'Torsdag',
  friday: 'Fredag',
  saturday: 'Lördag',
  sunday: 'Söndag',
}

type TabId = 'services' | 'about' | 'reviews' | 'contact'

export default function CompanyTabs({
  services,
  description,
  images,
  companyName,
  rating,
  reviewCount,
  reviews = [],
  openingHours,
  address,
  city,
  phone,
  email,
  website,
  requestedTab,
  requestedTabNonce,
  onBookService = () => {},
  applyDiscount = (price: number) => price,
  hasDiscount = false,
  visibleSections = { about: true, reviews: true, contact: true },
}: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('services')
  const [showHours, setShowHours] = useState(false)

  const servicesRef = useRef<HTMLDivElement | null>(null)
  const aboutRef = useRef<HTMLDivElement | null>(null)
  const reviewsRef = useRef<HTMLDivElement | null>(null)
  const contactRef = useRef<HTMLDivElement | null>(null)

  const scrollToSection = (tabId: TabId) => {
    const sectionMap: Record<TabId, { current: HTMLDivElement | null }> = {
      services: servicesRef,
      about: aboutRef,
      reviews: reviewsRef,
      contact: contactRef,
    }

    const sectionRef = sectionMap[tabId]
    const el = sectionRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const offset = window.scrollY + rect.top - 110

    window.scrollTo({
      top: offset,
      behavior: 'smooth',
    })

    setActiveTab(tabId)
  }

  useEffect(() => {
    if (!requestedTab) return
    scrollToSection(requestedTab)
  }, [requestedTab, requestedTabNonce])
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'services', label: 'Tjänster', count: services.length },
    ...(visibleSections.contact ? [{ id: 'contact' as const, label: 'Kontakt' }] : []),
    ...(visibleSections.about ? [{ id: 'about' as const, label: 'Om' }] : []),
    ...(visibleSections.reviews ? [{ id: 'reviews' as const, label: 'Omdömen', count: reviewCount }] : []),
  ]

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Övriga tjänster'
    if (!acc[category]) acc[category] = []
    acc[category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div id="company-tabs" className="scroll-mt-24">
      {/* Tabs Navigation */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`flex-shrink-0 whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4 lg:px-4 lg:py-2.5 text-sm lg:text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-2 hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content - all sections visible, menu used for quick navigation */}
      <div className="py-6 lg:py-5 space-y-10 lg:space-y-8">
        {/* Services Section */}
        <div ref={servicesRef} id="services-section" className="space-y-6 lg:space-y-5 px-4 sm:px-6">
          <h2 className="text-xl lg:text-lg font-bold text-gray-900">Tjänster</h2>
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category}>
              <h3 className="text-base lg:text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                {category}
                <span className="text-sm lg:text-xs font-normal text-gray-400">({categoryServices.length})</span>
              </h3>
              <div className="space-y-3 lg:space-y-2">
                {categoryServices.map((service, idx) => {
                  const price = service.price || 0
                  const discountedPrice = applyDiscount(price, service.name)
                  return (
                    <ServiceCard
                      key={idx}
                      service={service}
                      onBook={onBookService}
                      discountedPrice={discountedPrice}
                      hasDiscount={hasDiscount && discountedPrice < price}
                    />
                  )}
                )}
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Inga tjänster tillagda ännu.</p>
            </div>
          )}

          {/* Collapsible Öppettider - Mobile only */}
          {openingHours && (
            <div className="lg:hidden mt-6">
              <button
                onClick={() => setShowHours(!showHours)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2 font-semibold text-gray-900">
                  <HiClock className="w-5 h-5 text-brand" />
                  Öppettider
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-500 transition-transform ${showHours ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showHours && (
                <div className="mt-2 space-y-1.5 animate-fadeIn">
                  {Object.entries(dayNames).map(([key, name]) => {
                    const hours = openingHours?.[key]
                    const isToday = key === today
                    return (
                      <div 
                        key={key} 
                        className={`flex justify-between py-2 px-4 rounded-lg text-sm ${
                          isToday ? 'bg-brand/10 font-semibold' : 'bg-gray-50'
                        }`}
                      >
                        <span className={isToday ? 'text-brand' : 'text-gray-600'}>
                          {name}
                          {isToday && <span className="ml-1 text-xs">(idag)</span>}
                        </span>
                        <span className={hours?.closed ? 'text-red-500' : isToday ? 'text-brand' : 'text-gray-900'}>
                          {hours?.closed ? 'Stängt' : hours ? `${hours.open} – ${hours.close}` : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Section */}
        {visibleSections.contact && (
          <div ref={contactRef} id="contact-section" className="space-y-6 pt-6 border-t border-gray-200 px-4 sm:px-6">
          <h2 className="text-xl lg:text-lg font-bold text-gray-900">Kontakt</h2>
          <div className="space-y-3">
            {address && (
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(address + ', ' + city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 lg:p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
              >
                <HiLocationMarker className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{address}</p>
                  <p className="text-sm text-gray-500">{city}</p>
                  <p className="text-sm text-brand mt-1 font-medium">Visa på karta →</p>
                </div>
              </a>
            )}
            
            {phone && (
              <a 
                href={`tel:${phone}`}
                className="flex items-center gap-3 p-4 lg:p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
              >
                <HiPhone className="w-5 h-5 text-brand" />
                <span className="font-medium text-gray-900">{phone}</span>
              </a>
            )}
            
            {email && (
              <a 
                href={`mailto:${email}`}
                className="flex items-center gap-3 p-4 lg:p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
              >
                <HiMail className="w-5 h-5 text-brand" />
                <span className="font-medium text-gray-900">{email}</span>
              </a>
            )}
            
            {website && (
              <a 
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 lg:p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
              >
                <HiGlobe className="w-5 h-5 text-brand" />
                <span className="font-medium text-brand">{website}</span>
              </a>
            )}
          </div>
        </div>
        )}

        {/* About Section */}
        {visibleSections.about && (
          <div ref={aboutRef} id="about-section" className="space-y-6 pt-6 border-t border-gray-200 px-4 sm:px-6">
            <h2 className="text-xl lg:text-lg font-bold text-gray-900">Om oss</h2>
            
            {description && (
              <p className="text-gray-600 leading-relaxed whitespace-pre-line lg:text-sm">{description}</p>
            )}
          </div>
        )}

        {/* Reviews Section */}
        {visibleSections.reviews && (
          <div ref={reviewsRef} id="reviews-section" className="pt-6 border-t border-gray-200 px-4 sm:px-6">
            <h2 className="text-xl lg:text-lg font-bold text-gray-900 mb-4">Omdömen</h2>
            <ReviewSection 
              rating={rating} 
              reviewCount={reviewCount} 
              reviews={reviews}
            />
          </div>
        )}
      </div>
    </div>
  )
}
