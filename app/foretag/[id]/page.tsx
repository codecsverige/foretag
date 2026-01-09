'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Head from 'next/head'
import { 
  HiArrowLeft, HiPhone, HiMail, HiLocationMarker, HiStar, HiShare,
  HiClock, HiCheckCircle, HiGlobe, HiCalendar, HiShieldCheck,
  HiChevronLeft, HiChevronRight, HiBadgeCheck, HiExternalLink,
  HiExclamationCircle, HiLockClosed
} from 'react-icons/hi'
import dynamic from 'next/dynamic'
import CompanyTabs from '@/components/company/CompanyTabs'
import HeroGallery from '@/components/company/HeroGallery'
import CompanyDetailSidebar from '@/components/company/CompanyDetailSidebar'
import { clearCache, getCompanyById } from '@/lib/companiesCache'
import { getCategoryImage, categoryNames } from '@/lib/categoryImages'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, doc, updateDoc, increment, getDoc } from 'firebase/firestore'

const BookingFormWizard = dynamic(() => import('@/components/booking/BookingFormWizard'), { ssr: false })

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

interface FAQItem {
  id: string
  question: string
  answer: string
}

interface Company {
  id: string
  name: string
  ownerId?: string
  ownerName?: string
  ownerBio?: string
  category?: string
  categoryName?: string
  city?: string
  serviceCities?: string[]
  address?: string
  description?: string
  seoTitle?: string
  seoDescription?: string
  slug?: string
  phone?: string
  email?: string
  website?: string
  socialMedia?: {
    facebook?: string
    instagram?: string
  }
  rating?: number
  reviewCount?: number
  discountPercent?: number
  discountText?: string
  discount?: {
    enabled?: boolean
    label?: string
    type?: 'percent' | 'amount'
    value?: number
    appliesTo?: 'all' | 'services'
    serviceNames?: string[]
    startDate?: string
    endDate?: string
    showBadge?: boolean
  }
  services?: Service[]
  faqs?: FAQItem[]
  status?: 'active' | 'draft' | 'archived'
  published?: boolean
  settings?: {
    showAbout?: boolean
    showReviews?: boolean
    showMap?: boolean
    showContact?: boolean
    showFAQ?: boolean
  }
  image?: string
  images?: string[]
  logo?: string
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  excludedDates?: string[]
  excludedTimes?: Record<string, string[]>
  verified?: boolean
  premium?: boolean
  bookingCount?: number
  createdAt?: any
  // Business info
  rutAvdrag?: boolean
  rotAvdrag?: boolean
  paymentMethods?: string[]
  hasInsurance?: boolean
  insuranceInfo?: string
  guarantee?: string
  orgNumber?: string
  // Policies
  cancellationPolicy?: string
  terms?: string
  privacyPolicy?: string
}

interface Review {
  id: string
  author: string
  rating: number
  comment: string
  date: string
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

type RequestedTab = 'services' | 'about' | 'reviews' | 'contact'

export default function CompanyPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params?.id as string
  
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [preselectedService, setPreselectedService] = useState('')
  const [requestedTab, setRequestedTab] = useState<RequestedTab | undefined>(undefined)
  const [requestedTabNonce, setRequestedTabNonce] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsRating, setReviewsRating] = useState(0)
  const [reviewsCount, setReviewsCount] = useState(0)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showMobileHours, setShowMobileHours] = useState(false)

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
          
          // Save to recently viewed
          try {
            const viewed = JSON.parse(localStorage.getItem('recentlyViewedCompanies') || '[]')
            const filtered = viewed.filter((vid: string) => vid !== id)
            const updated = [id, ...filtered].slice(0, 10)
            localStorage.setItem('recentlyViewedCompanies', JSON.stringify(updated))
          } catch {}
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

  useEffect(() => {
    let mounted = true

    async function fetchReviews() {
      if (!db || !id) {
        if (mounted) {
          setReviews([])
          setReviewsRating(0)
          setReviewsCount(0)
        }
        return
      }

      try {
        const reviewsRef = collection(db, 'companies', id, 'reviews')
        const snap = await getDocs(query(reviewsRef, orderBy('createdAt', 'desc')))

        const items: Review[] = snap.docs.map((d) => {
          const data: any = d.data() || {}
          const rating = Number(data?.rating || 0)
          const author = String(data?.author || data?.customerName || data?.name || 'Anonym').trim() || 'Anonym'
          const comment = String(data?.comment || data?.text || '').trim()

          const createdAt = data?.createdAt
          const date = typeof data?.date === 'string'
            ? data.date
            : createdAt?.toDate
              ? createdAt.toDate().toLocaleDateString('sv-SE')
              : typeof createdAt === 'number'
                ? new Date(createdAt).toLocaleDateString('sv-SE')
                : ''

          return {
            id: d.id,
            author,
            rating: Number.isFinite(rating) ? rating : 0,
            comment,
            date,
          }
        })

        const count = items.length
        const avg = count > 0
          ? (items.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count)
          : 0

        if (mounted) {
          setReviews(items)
          setReviewsCount(count)
          setReviewsRating(avg)
        }
      } catch (e) {
        if (mounted) {
          setReviews([])
          setReviewsRating(0)
          setReviewsCount(0)
        }
      }
    }

    fetchReviews()
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

  const scrollToTabs = useCallback((tab: RequestedTab) => {
    setRequestedTab(tab)
    setRequestedTabNonce((n) => n + 1)
    const el = document.getElementById('company-tabs')
    el?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const scrollToBooking = useCallback(() => {
    const bookingSection = document.getElementById('booking-form')
    bookingSection?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-44 sm:h-52 md:h-60 lg:h-64 bg-gray-200" />
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
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
  const rawImages = Array.isArray(company.images) ? company.images : []
  const cleanedImages = rawImages
    .map((img) => String(img || '').trim())
    .filter(Boolean)
  const primaryImage = String(company.image || '').trim()
  const images = cleanedImages.length > 0
    ? cleanedImages
    : primaryImage
      ? [primaryImage]
      : [getCategoryImage(company.category, company.id)]
  
  const categoryName = company.categoryName || categoryNames[company.category || ''] || 'Företag'
  const now = new Date()
  const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const todayHours = company.openingHours?.[today]
  const metaTitle = (company.seoTitle || `${company.name} – ${categoryName} i ${company.city || 'Sverige'}`)
  const metaDescription = (company.seoDescription || company.description || `${company.name} – ${categoryName}.`).slice(0, 160)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const canonicalUrl = `${origin}/foretag/${company.slug || company.id}`
  const siteName = typeof window !== 'undefined' ? window.location.hostname : 'Website'
  const dayKeyToSchema: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  }
  const openingHoursSpecification = company.openingHours
    ? Object.entries(company.openingHours).filter(([_, v]) => v && !v.closed).map(([k, v]) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayKeyToSchema[k] || k,
        opens: v.open,
        closes: v.close,
      }))
    : undefined
  const offers = (company.services || [])
    .filter((s) => Number(s.price || 0) > 0)
    .map((s) => ({
      '@type': 'Offer',
      priceCurrency: 'SEK',
      price: Number(s.price || 0),
      itemOffered: {
        '@type': 'Service',
        name: s.name,
        description: s.description,
      },
    }))
  const ldLocalBusiness: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: company.name,
    image: images && images[0],
    address: (company.address || company.city) ? {
      '@type': 'PostalAddress',
      streetAddress: company.address,
      addressLocality: company.city,
      addressCountry: 'SE',
    } : undefined,
    telephone: company.phone,
    url: company.website,
    openingHoursSpecification,
    makesOffer: offers.length > 0 ? offers : undefined,
  }
  const faqsData = (company.faqs || []).filter((f: any) => f && f.question && f.answer)
  const ldFAQ = faqsData.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqsData.map((f: any) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  } : null
  
  // Check if currently open based on actual time
  const checkIsOpenNow = () => {
    if (!todayHours || todayHours.closed) return false
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [openH, openM] = (todayHours.open || '00:00').split(':').map(Number)
    const [closeH, closeM] = (todayHours.close || '00:00').split(':').map(Number)
    const openTime = openH * 60 + openM
    const closeTime = closeH * 60 + closeM
    return currentTime >= openTime && currentTime < closeTime
  }
  const isOpenNow = checkIsOpenNow()

  const servicePrices = (company.services || [])
    .map((s) => ({
      name: String(s.name || '').trim(),
      price: Number(s.price || 0),
    }))
    .filter((s) => Number.isFinite(s.price) && s.price > 0)

  const lowestPrice = servicePrices.length > 0
    ? Math.min(...servicePrices.map((s) => s.price))
    : 0
  const isOwner = user && company?.ownerId && user.uid === company.ownerId
  
  const showAbout = company?.settings?.showAbout !== false
  const showReviews = company?.settings?.showReviews !== false
  const showMap = company?.settings?.showMap !== false
  const showContact = company?.settings?.showContact !== false
  const showFAQ = company?.settings?.showFAQ !== false

  const handlePublish = async () => {
    if (!company || !user || !db) return
    try {
      await updateDoc(doc(db, 'companies', company.id), {
        status: 'active',
        published: true
      })
      setCompany(prev => prev ? { ...prev, status: 'active', published: true } : null)
      clearCache()
      alert('Din annons är nu publicerad!')
    } catch (err) {
      console.error('Error publishing:', err)
      alert('Kunde inte publicera annonsen. Försök igen.')
    }
  }

  if (company?.status === 'draft' && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiLockClosed className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Utkast</h1>
          <p className="text-gray-500 text-sm mb-6">
            Denna sida är inte publicerad än.
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
  
  const todayIso = new Date().toISOString().split('T')[0]
  const discountCfg = company.discount
  const isDiscountCfgActive = Boolean(
    discountCfg?.enabled &&
      (discountCfg.showBadge !== false) &&
      Number(discountCfg.value || 0) > 0 &&
      (!discountCfg.startDate || todayIso >= discountCfg.startDate) &&
      (!discountCfg.endDate || todayIso <= discountCfg.endDate)
  )

  const legacyPercent = Number(company.discountPercent || 0)
  const hasLegacyDiscount = legacyPercent > 0

  const hasDiscount = isDiscountCfgActive || hasLegacyDiscount
  const effectiveType: 'percent' | 'amount' = (isDiscountCfgActive ? (discountCfg?.type || 'percent') : 'percent')
  const effectiveValue = isDiscountCfgActive ? Number(discountCfg?.value || 0) : legacyPercent
  const effectiveLabel = (isDiscountCfgActive ? (discountCfg?.label || '') : (company.discountText || '')).trim()

  const appliesToServices = Boolean(isDiscountCfgActive && discountCfg?.appliesTo === 'services')
  const selectedServiceNames = (discountCfg?.serviceNames || []).map(s => String(s || '').trim()).filter(Boolean)

  const applyDiscountToPrice = (original: number, serviceName?: string) => {
    if (!hasDiscount || original <= 0) return original
    if (appliesToServices) {
      if (!serviceName || !selectedServiceNames.includes(serviceName)) return original
    }
    if (effectiveType === 'amount') return Math.max(0, Math.round(original - effectiveValue))
    return Math.max(0, Math.round(original * (100 - effectiveValue) / 100))
  }

  // Compute OG image params after discount vars are initialized
  const discountBadge = (() => {
    if (!hasDiscount) return ''
    const value = effectiveValue
    const label = effectiveLabel
    return (effectiveType === 'amount' ? `-${value} kr` : `-${value}%`) + (label ? ` ${label}` : '')
  })()
  const ogParams = new URLSearchParams({
    n: company.name || '',
    c: company.city || '',
    r: reviewsRating ? reviewsRating.toFixed(1) : '',
    rc: String(reviewsCount || 0),
    d: discountBadge,
    cat: categoryName,
  })
  const ogImage = `${canonicalUrl}/opengraph-image?${ogParams.toString()}`

  const discountedLowestPrice = hasDiscount && servicePrices.length > 0
    ? Math.min(...servicePrices.map((s) => applyDiscountToPrice(s.price, s.name)))
    : 0

  const showDiscountFromPrice = hasDiscount && discountedLowestPrice > 0 && lowestPrice > 0 && discountedLowestPrice < lowestPrice

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{metaTitle}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={metaTitle} />
        {metaDescription && <meta property="og:description" content={metaDescription} />}
        {ogImage && <meta property="og:image" content={ogImage} />}        
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="sv_SE" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        {metaDescription && <meta name="twitter:description" content={metaDescription} />}
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        {ogImage && <meta name="twitter:image:alt" content={`${company.name} – ${categoryName}`} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldLocalBusiness) }}
        />
        {ldFAQ && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ldFAQ) }}
          />
        )}
      </Head>
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm transition"
          >
            <HiArrowLeft className="w-4 h-4" />
            Tillbaka
          </button>
          <button 
            onClick={handleShare}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
          >
            <HiShare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Draft Banner */}
      {company.status === 'draft' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sticky top-16 z-20">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-800">
              <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Utkast - Endast synlig för dig</span>
            </div>
            <button 
              onClick={handlePublish}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
            >
              Publicera nu
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 lg:py-4">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Gallery + Company Info + Tabs */}
          <div className="lg:col-span-8 space-y-4">
            {/* Hero Photo Gallery */}
            <HeroGallery images={images} companyName={company.name} />

            {/* Company Info Section */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 mb-3">
                {company.name}
              </h1>
              
              {/* Info chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  {categoryName}
                </span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                  <HiLocationMarker className="w-4 h-4" />
                  {company.city || 'Sverige'}
                </span>
                {isOpenNow ? (
                  <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Öppet nu
                  </span>
                ) : (
                  <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    Stängt
                  </span>
                )}
                {reviewsCount > 0 && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                    <HiStar className="w-4 h-4 text-amber-400" />
                    {reviewsRating.toFixed(1)}
                    <span className="text-gray-500">({reviewsCount})</span>
                  </span>
                )}
                {company.verified && (
                  <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                    <HiBadgeCheck className="w-4 h-4" />
                    Verifierad
                  </span>
                )}
                {company.premium && (
                  <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium">
                    Premium
                  </span>
                )}
                {hasDiscount && (
                  <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                    {effectiveType === 'amount' ? `-${effectiveValue} kr` : `-${effectiveValue}%`}{effectiveLabel ? ` ${effectiveLabel}` : ''}
                  </span>
                )}
              </div>

              {showDiscountFromPrice && (
                <div className="text-sm font-semibold text-green-700">
                  Från {discountedLowestPrice} kr
                  <span className="text-gray-400 line-through font-normal ml-2">{lowestPrice} kr</span>
                </div>
              )}
            </div>

            {/* Company Tabs */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <CompanyTabs
                services={company.services || []}
                description={company.description}
                images={images}
                companyName={company.name}
                rating={reviewsRating}
                reviewCount={reviewsCount}
                reviews={reviews}
                faqs={company.faqs || []}
                cancellationPolicy={company.cancellationPolicy}
                terms={company.terms}
                privacyPolicy={company.privacyPolicy}
                openingHours={company.openingHours}
                address={company.address}
                city={company.city}
                phone={company.phone}
                email={company.email}
                website={company.website}
                requestedTab={requestedTab}
                requestedTabNonce={requestedTabNonce}
                onBookService={(service) => {
                  const key = `${service.name || ''}-${service.price || 0}`
                  setPreselectedService(key)
                  setShowBookingModal(true)
                }}
                applyDiscount={applyDiscountToPrice}
                hasDiscount={hasDiscount}
                visibleSections={{
                  about: showAbout,
                  reviews: showReviews,
                  contact: showContact,
                  faq: showFAQ
                }}
              />
            </div>

            {/* Map Section */}
            {showMap && (company.address || company.city) && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HiLocationMarker className="w-5 h-5 text-brand" />
                  Adress & Karta
                </h3>
                <div className="space-y-3">
                  {(company.address || company.city) && (
                    <div className="text-sm text-gray-600">
                      {company.address && <p className="font-medium text-gray-900">{company.address}</p>}
                      {company.city && <p>{company.city}</p>}
                    </div>
                  )}
                  
                  {/* Embedded Map */}
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        `${company.address || ''}, ${company.city || ''}`
                      )}&t=m&z=16&output=embed&iwloc=near`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      className="w-full h-full"
                    />
                  </div>
                  
                  {/* Get Directions Button */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${company.address || ''} ${company.city || ''}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                  >
                    <HiExternalLink className="w-4 h-4" />
                    Visa på Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Trust Badges */}
            <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-2xl border border-gray-200 p-3 sm:p-4 mt-6">
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

          {/* Right Column - Sticky Sidebar (Desktop only) */}
          <div className="hidden lg:block lg:col-span-4">
            <CompanyDetailSidebar
              company={{
                phone: company.phone,
                email: company.email,
                website: company.website,
                address: company.address,
                city: company.city,
                serviceCities: company.serviceCities,
                openingHours: company.openingHours,
                rutAvdrag: company.rutAvdrag,
                rotAvdrag: company.rotAvdrag,
                paymentMethods: company.paymentMethods,
                hasInsurance: company.hasInsurance,
                insuranceInfo: company.insuranceInfo,
                guarantee: company.guarantee,
                orgNumber: company.orgNumber,
                logo: company.logo,
                socialMedia: company.socialMedia,
              }}
              lowestPrice={lowestPrice}
              discountedPrice={discountedLowestPrice}
              hasDiscount={hasDiscount && showDiscountFromPrice}
              onBookingClick={() => setShowBookingModal(true)}
              isOpenNow={isOpenNow}
              todayHours={todayHours}
            />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-40 safe-area-bottom">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div>
            <p className="text-xs text-gray-500">Pris från</p>
            <p className="text-lg font-bold text-gray-900">
              {showDiscountFromPrice ? (
                <span>
                  <span className="text-brand">{discountedLowestPrice} kr</span>
                  <span className="text-sm text-gray-400 line-through ml-2">{lowestPrice} kr</span>
                </span>
              ) : `${lowestPrice} kr`}
            </p>
          </div>
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex-shrink-0 bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-xl font-bold transition"
          >
            Boka nu
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center">
          <div 
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-auto rounded-t-3xl lg:rounded-2xl animate-slide-up lg:animate-fade-in"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">Boka tid</h2>
              <button
                onClick={() => {
                  setShowBookingModal(false)
                  setPreselectedService('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4">
              <BookingFormWizard 
                services={company.services || []} 
                companyName={company.name}
                companyId={company.id}
                companyPhone={company.phone || ''}
                companyOwnerId={company.ownerId}
                preselectedService={preselectedService}
                openingHours={company.openingHours}
                excludedDates={company.excludedDates}
                excludedTimes={company.excludedTimes}
                discount={company.discount}
                discountPercent={company.discountPercent}
                discountText={company.discountText}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
