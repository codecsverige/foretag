'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  HiArrowLeft, HiPhone, HiMail, HiLocationMarker, HiStar, HiShare,
  HiClock, HiCheckCircle, HiGlobe, HiCalendar, HiShieldCheck,
  HiChevronLeft, HiChevronRight, HiBadgeCheck, HiExternalLink
} from 'react-icons/hi'
import BookingForm from '@/components/booking/BookingForm'
import { getCompanyById } from '@/lib/companiesCache'
import { getCategoryImage, categoryNames } from '@/lib/categoryImages'
import { db } from '@/lib/firebase'
import { doc, updateDoc, increment } from 'firebase/firestore'

interface Service {
  name?: string
  price?: number
  duration?: number
  description?: string
}

interface Company {
  id: string
  name: string
  category?: string
  categoryName?: string
  city?: string
  address?: string
  description?: string
  phone?: string
  email?: string
  website?: string
  rating?: number
  reviewCount?: number
  services?: Service[]
  images?: string[]
  image?: string
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  verified?: boolean
  premium?: boolean
  bookingCount?: number
  createdAt?: any
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

export default function CompanyPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    let mounted = true

    async function fetchCompany() {
      if (!id) {
        setError(true)
        setLoading(false)
        return
      }

      try {
        const data = await getCompanyById(id)

        if (!data) {
          if (mounted) {
            setError(true)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setCompany(data)
          setLoading(false)
        }

        if (db) {
          updateDoc(doc(db, 'companies', id), { viewCount: increment(1) }).catch(() => {})
        }
      } catch (err) {
        console.error('Error:', err)
        if (mounted) {
          setError(true)
          setLoading(false)
        }
      }
    }

    fetchCompany()
    return () => { mounted = false }
  }, [id])

  const handleShare = useCallback(async () => {
    if (navigator.share && company) {
      try {
        await navigator.share({
          title: company.name,
          url: window.location.href,
        })
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Länk kopierad!')
    }
  }, [company])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Laddar företagssida...</p>
        </div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiLocationMarker className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Sidan hittades inte</h1>
          <p className="text-gray-500 text-sm mb-6">
            Företaget du söker finns inte eller har tagits bort.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            <HiArrowLeft className="w-4 h-4" />
            Tillbaka till startsidan
          </Link>
        </div>
      </div>
    )
  }

  // Get images - use own images or fallback to category
  const hasOwnImages = company.image || (company.images && company.images.length > 0)
  const images = hasOwnImages 
    ? (company.images || (company.image ? [company.image] : [])) 
    : [getCategoryImage(company.category)]
  
  const categoryName = company.categoryName || categoryNames[company.category || ''] || 'Företag'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const todayHours = company.openingHours?.[today]
  const isOpenNow = todayHours && !todayHours.closed
  const lowestPrice = company.services?.reduce((min, s) => (s.price || 0) < min ? (s.price || 0) : min, Infinity) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner - Compact */}
      <div className="relative h-48 md:h-56 lg:h-64 bg-gray-900">
        <img
          src={images[currentImageIndex]}
          alt={company.name}
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
        
        {/* Navigation on banner */}
        <div className="absolute top-0 left-0 right-0">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium bg-black/20 backdrop-blur-sm px-3 py-2 rounded-lg transition-colors"
            >
              <HiArrowLeft className="w-4 h-4" />
              Tillbaka
            </button>
            <button 
              onClick={handleShare}
              className="text-white/90 hover:text-white bg-black/20 backdrop-blur-sm p-2 rounded-lg transition-colors"
            >
              <HiShare className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image navigation */}
        {images.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Company info on banner */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-5xl mx-auto px-4 pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                {categoryName}
              </span>
              {company.verified && (
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <HiBadgeCheck className="w-4 h-4" />
                  Verifierat företag
                </span>
              )}
              {company.premium && (
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Premium
                </span>
              )}
              {isOpenNow && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Öppet nu
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-white">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-white/90 text-sm">
              <span className="flex items-center gap-1">
                <HiLocationMarker className="w-4 h-4" />
                {company.city || 'Sverige'}
              </span>
              {company.rating && company.rating > 0 && (
                <span className="flex items-center gap-1">
                  <HiStar className="w-4 h-4 text-amber-400" />
                  {company.rating.toFixed(1)} ({company.reviewCount || 0} omdömen)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column - Info (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap gap-3">
                {company.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    <HiPhone className="w-5 h-5" />
                    Ring nu
                  </a>
                )}
                {company.email && (
                  <a
                    href={`mailto:${company.email}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    <HiMail className="w-5 h-5" />
                    E-posta
                  </a>
                )}
                {company.website && (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
                  >
                    <HiExternalLink className="w-5 h-5" />
                    Webbplats
                  </a>
                )}
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Om {company.name}</h2>
              {company.description ? (
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{company.description}</p>
              ) : (
                <p className="text-gray-400 italic">Ingen beskrivning tillgänglig.</p>
              )}
            </div>

            {/* Services */}
            {company.services && company.services.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tjänster & Priser</h2>
                <div className="space-y-3">
                  {company.services.filter(s => s.name).map((service, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <HiClock className="w-4 h-4" />
                            {service.duration || 30} min
                          </span>
                          {service.description && (
                            <span>• {service.description}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xl font-bold text-gray-900">{service.price || 0} <span className="text-sm font-normal text-gray-500">kr</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {company.openingHours && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Öppettider</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(dayNames).map(([key, name]) => {
                    const hours = company.openingHours?.[key]
                    const isToday = key === today
                    return (
                      <div 
                        key={key} 
                        className={`flex justify-between p-3 rounded-lg ${isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
                      >
                        <span className={`font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                          {name}
                          {isToday && <span className="ml-2 text-xs">(idag)</span>}
                        </span>
                        <span className={hours?.closed ? 'text-gray-400' : 'text-gray-900'}>
                          {hours?.closed ? 'Stängt' : hours ? `${hours.open} - ${hours.close}` : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Contact & Location */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontakt & Plats</h2>
              <div className="space-y-4">
                {company.address && (
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(company.address + ', ' + company.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <HiLocationMarker className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{company.address}</p>
                      <p className="text-sm text-gray-500">{company.city}</p>
                      <p className="text-sm text-blue-600 mt-1">Visa på karta →</p>
                    </div>
                  </a>
                )}
                {company.phone && (
                  <a 
                    href={`tel:${company.phone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <HiPhone className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{company.phone}</span>
                  </a>
                )}
                {company.email && (
                  <a 
                    href={`mailto:${company.email}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <HiMail className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-900">{company.email}</span>
                  </a>
                )}
                {company.website && (
                  <a 
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <HiGlobe className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-blue-600">{company.website}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <HiShieldCheck className="w-5 h-5 text-green-600" />
                  Säker bokning
                </span>
                <span className="flex items-center gap-2">
                  <HiCalendar className="w-5 h-5 text-blue-600" />
                  Gratis avbokning
                </span>
                <span className="flex items-center gap-2">
                  <HiCheckCircle className="w-5 h-5 text-blue-600" />
                  SMS-bekräftelse
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Booking (2/5) */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <BookingForm 
                services={company.services || []} 
                companyName={company.name}
                companyId={company.id}
                companyPhone={company.phone || ''}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
