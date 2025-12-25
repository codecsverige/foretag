'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  ownerId?: string
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
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-44 sm:h-52 md:h-60 lg:h-64 bg-gray-200" />
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          <div className="grid lg:grid-cols-12 gap-4 sm:gap-6">
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
                <div className="h-6 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
                <div className="h-4 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="h-10 bg-gray-100 rounded-xl" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
                <div className="h-5 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="space-y-3">
                  <div className="h-10 bg-gray-100 rounded-xl" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-gray-100 rounded-xl" />
                    <div className="h-10 bg-gray-100 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-gray-100 rounded-xl" />
                    <div className="h-10 bg-gray-100 rounded-xl" />
                  </div>
                  <div className="h-11 bg-gray-200 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
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
      {/* Hero Banner - Responsive avec cadrage amélioré */}
      <div className="relative h-44 sm:h-52 md:h-60 lg:h-64 bg-gray-900 overflow-hidden">
        <Image
          src={images[currentImageIndex]}
          alt={company.name}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          style={{ objectFit: 'cover' }}
        />
        {/* Overlay avec meilleur contraste */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
        
        {/* Navigation on banner */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-1.5 sm:gap-2 text-white/90 hover:text-white text-xs sm:text-sm font-medium bg-black/30 backdrop-blur-md px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all hover:bg-black/40"
            >
              <HiArrowLeft className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              Tillbaka
            </button>
            <button 
              onClick={handleShare}
              className="text-white/90 hover:text-white bg-black/30 backdrop-blur-md p-1.5 sm:p-2 rounded-lg transition-all hover:bg-black/40"
            >
              <HiShare className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Image navigation */}
        {images.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all"
            >
              <HiChevronLeft className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
            <button 
              onClick={() => setCurrentImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all"
            >
              <HiChevronRight className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </>
        )}

        {/* Company info on banner */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-4 sm:pb-6">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <span className="bg-white/20 backdrop-blur-md text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                {categoryName}
              </span>
              {company.verified && (
                <span className="bg-blue-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-0.5 sm:gap-1">
                  <HiBadgeCheck className="w-3 sm:w-4 h-3 sm:h-4" />
                  Verifierat företag
                </span>
              )}
              {company.premium && (
                <span className="bg-amber-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                  Premium
                </span>
              )}
              {isOpenNow && (
                <span className="bg-green-500 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-0.5 sm:gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Öppet nu
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1.5 sm:mt-2 text-white/90 text-xs sm:text-sm">
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

      {/* Miniatures des images - Galerie */}
      {images.length > 1 && (
        <div className="max-w-6xl mx-auto px-3 sm:px-4 -mt-8 relative z-10">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex 
                      ? 'border-blue-600 shadow-md scale-105' 
                      : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Image ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover object-center"
                    style={{ objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column - Info (3/5) */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {company.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                  >
                    <HiPhone className="w-4 sm:w-5 h-4 sm:h-5" />
                    Ring nu
                  </a>
                )}
                {company.email && (
                  <a
                    href={`mailto:${company.email}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all"
                  >
                    <HiMail className="w-4 sm:w-5 h-4 sm:h-5" />
                    E-posta
                  </a>
                )}
                {company.website && (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all"
                  >
                    <HiExternalLink className="w-4 sm:w-5 h-4 sm:h-5" />
                    Webbplats
                  </a>
                )}
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Om {company.name}</h2>
              
              {/* Images supplémentaires si disponibles */}
              {images.length > 1 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
                  {images.slice(1, 4).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx + 1)}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all group"
                    >
                      <Image
                        src={img}
                        alt={`${company.name} - Image ${idx + 2}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        quality={80}
                      />
                      <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl pointer-events-none" />
                    </button>
                  ))}
                </div>
              )}
              
              {company.description ? (
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">{company.description}</p>
              ) : (
                <p className="text-gray-400 italic">Ingen beskrivning tillgänglig.</p>
              )}
            </div>

            {/* Services */}
            {company.services && company.services.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Tjänster & Priser</h2>
                <div className="space-y-2 sm:space-y-3">
                  {company.services.filter(s => s.name).map((service, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all gap-2 sm:gap-0"
                    >
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">{service.name}</h3>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <HiClock className="w-4 h-4" />
                            {service.duration || 30} min
                          </span>
                          {service.description && (
                            <span>• {service.description}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">{service.price || 0} <span className="text-xs sm:text-sm font-normal text-gray-500">kr</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {company.openingHours && (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Öppettider</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                  {Object.entries(dayNames).map(([key, name]) => {
                    const hours = company.openingHours?.[key]
                    const isToday = key === today
                    return (
                      <div 
                        key={key} 
                        className={`flex justify-between p-2.5 sm:p-3 rounded-lg ${isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
                      >
                        <span className={`font-medium text-xs sm:text-sm ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                          {name}
                          {isToday && <span className="ml-1 sm:ml-2 text-xs">(idag)</span>}
                        </span>
                        <span className={`text-xs sm:text-sm ${hours?.closed ? 'text-gray-400' : 'text-gray-900'}`}>
                          {hours?.closed ? 'Stängt' : hours ? `${hours.open} - ${hours.close}` : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Contact & Location */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Kontakt & Plats</h2>
              <div className="space-y-2 sm:space-y-3">
                {company.address && (
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(company.address + ', ' + company.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 sm:gap-3 p-3 sm:p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <HiLocationMarker className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm sm:text-base text-gray-900">{company.address}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{company.city}</p>
                      <p className="text-xs sm:text-sm text-blue-600 mt-1 font-medium">Visa på karta →</p>
                    </div>
                  </a>
                )}
                {company.phone && (
                  <a 
                    href={`tel:${company.phone}`}
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <HiPhone className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base text-gray-900">{company.phone}</span>
                  </a>
                )}
                {company.email && (
                  <a 
                    href={`mailto:${company.email}`}
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <HiMail className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base text-gray-900 break-all">{company.email}</span>
                  </a>
                )}
                {company.website && (
                  <a 
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    <HiGlobe className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base text-blue-600 break-all">{company.website}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-2xl border border-gray-200 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1.5 sm:gap-2 font-medium">
                  <HiShieldCheck className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
                  Säker bokning
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2 font-medium">
                  <HiCalendar className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                  Gratis avbokning
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2 font-medium">
                  <HiCheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                  SMS-bekräftelse
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Booking (2/5) */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 lg:max-w-md lg:ml-auto">
              <BookingForm 
                services={company.services || []} 
                companyName={company.name}
                companyId={company.id}
                companyPhone={company.phone || ''}
                companyOwnerId={company.ownerId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
