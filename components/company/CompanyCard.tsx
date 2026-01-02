'use client'

import Image from 'next/image'
import { memo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HiStar, HiLocationMarker, HiBadgeCheck, HiClock, HiPhone } from 'react-icons/hi'
import { getCategoryImage, categoryNames } from '@/lib/categoryImages'
import { getCompanyById } from '@/lib/companiesCache'

interface Company {
  id: string
  name: string
  category?: string
  categoryName?: string
  city?: string
  address?: string
  rating?: number
  reviewCount?: number
  image?: string
  images?: string[]
  priceFrom?: number
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
  premium?: boolean
  verified?: boolean
  services?: Array<{ price?: number; name?: string }>
  description?: string
  phone?: string
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  subServiceNames?: string[]
}

interface CompanyCardProps {
  company: Company
  priority?: boolean
}

function CompanyCardComponent({ company, priority = false }: CompanyCardProps) {
  const router = useRouter()
  const prefetched = useRef(false)

  const prefetch = useCallback(() => {
    if (prefetched.current) return
    prefetched.current = true
    router.prefetch(`/foretag/${company.id}`)
    getCompanyById(company.id).catch(() => {})
  }, [router, company.id])

  const categoryName = company.categoryName || categoryNames[company.category || ''] || 'Företag'
  const city = company.city || 'Sverige'
  const address = company.address
  const rating = company.rating || 0
  const reviewCount = company.reviewCount || 0
  const priceFrom = company.priceFrom || company.services?.[0]?.price || 0
  const locationLabel = [address?.trim(), city?.trim()].filter(Boolean).join(', ')
  const isNew = rating <= 0
  const topSubServices = (company.subServiceNames || []).slice(0, 2)
  const filledStars = reviewCount > 0 ? Math.round(rating) : 5

  // Calcul horaires d'ouverture
  const getDayKey = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()]
  }
  const todayKey = getDayKey()
  const todayHours = company.openingHours?.[todayKey]
  
  const isOpenNow = (() => {
    if (!todayHours || todayHours.closed) return false
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    return currentTime >= todayHours.open && currentTime <= todayHours.close
  })()

  const todayIso = new Date().toLocaleDateString('sv-SE')
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
  const discountLabel = ((discountCfg?.label || company.discountText || '').trim())
  const showDiscountLabel = hasDiscount && !!discountLabel

  const applyDiscountToPrice = (original: number, serviceName?: string) => {
    if (!hasDiscount || original <= 0) return original

    if (isDiscountCfgActive && discountCfg?.appliesTo === 'services') {
      const list = discountCfg.serviceNames || []
      if (!serviceName || !list.includes(serviceName)) return original
    }

    if (effectiveType === 'amount') {
      return Math.max(0, Math.round(original - effectiveValue))
    }
    return Math.max(0, Math.round(original * (100 - effectiveValue) / 100))
  }

  const servicePrices = (company.services || [])
    .map(s => ({ name: (s.name || '').trim(), price: Number(s.price || 0) }))
    .filter(s => s.price > 0)

  const originalFrom = servicePrices.length > 0
    ? Math.min(...servicePrices.map(s => s.price))
    : Number(priceFrom || 0)

  const discountedFrom = servicePrices.length > 0
    ? Math.min(...servicePrices.map(s => applyDiscountToPrice(s.price, s.name)))
    : applyDiscountToPrice(Number(priceFrom || 0))

  const showStrike = hasDiscount && discountedFrom > 0 && originalFrom > 0 && discountedFrom < originalFrom
  
  const imageUrl: string = (company.image || company.images?.[0] || getCategoryImage(company.category, company.id))

  // Texte d'état d'ouverture plus professionnel (Öppnar kl / Öppet till / Stängt idag)
  const openText: string = (() => {
    if (!todayHours) return ''
    if (todayHours.closed) return 'Stängt idag'
    const now = new Date()
    const hh = now.getHours().toString().padStart(2, '0')
    const mm = now.getMinutes().toString().padStart(2, '0')
    const nowStr = `${hh}:${mm}`
    if (nowStr < todayHours.open) return `Öppnar kl ${todayHours.open}`
    if (nowStr <= todayHours.close) return `Öppet till ${todayHours.close}`
    return 'Stängt'
  })()
  const openTextClass = openText.startsWith('Öppet')
    ? 'text-green-700 font-medium'
    : (openText.startsWith('Stäng') ? 'text-red-600 font-medium' : 'text-gray-600')

  // Formatage pro des prix en suédois (ex: 1 200)
  const formatKr = (n: number) => new Intl.NumberFormat('sv-SE').format(n)
  const hasMetaRight = Boolean(company.premium)
 
  return (
    <article
      itemScope
      itemType="https://schema.org/LocalBusiness"
      className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 h-full flex flex-row cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      onClick={() => router.push(`/foretag/${company.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/foretag/${company.id}`)
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Öppna ${company.name}`}
    >
      {/* Image - à gauche (horizontal) */}
      <div className="relative w-36 sm:w-44 md:w-52 aspect-[4/3] overflow-hidden bg-gray-100 flex-shrink-0">
        <Image
          src={imageUrl}
          alt={company.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          quality={85}
        />
        
        {/* Overlay gradient subtil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Badge réduction en haut à gauche */}
        {hasDiscount && (
          <div className="absolute top-3 left-3">
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">
              -{effectiveValue}{effectiveType === 'percent' ? '%' : ' kr'}
            </span>
          </div>
        )}

        {/* Badge vérifié en haut à droite */}
        {false && company.verified && (
          <div className="absolute top-3 right-3">
            <span className="bg-white text-blue-600 p-1.5 rounded-full shadow-md flex items-center justify-center">
              <HiBadgeCheck className="w-4 h-4" />
            </span>
          </div>
        )}

        {/* Catégorie en bas de l'image */}
        {false && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-medium px-2.5 py-1 rounded-lg shadow-sm">
              {categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="px-4 py-3 flex-1 flex flex-col min-h-[130px]">
        {/* En-tête: Titre + meta à droite (statut, premium, CTA) */}
        <div className={`flex items-start ${hasMetaRight ? 'justify-between' : ''} gap-3`}>
          <h3 itemProp="name" className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg sm:text-xl leading-tight line-clamp-2">
            <span className="inline-flex items-center gap-1.5">
              {company.name}
              {company.verified && (
                <HiBadgeCheck className="w-4 h-4 text-blue-600" aria-label="Verifierad" />
              )}
            </span>
          </h3>
          {company.premium && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Premium</span>
            </div>
          )}
        </div>

        {/* Prix sous le titre - masqué (affiché sur l'image) */}
        <div className="mt-1 sr-only">
          <span>Från {formatKr(showStrike ? discountedFrom : originalFrom)} kr</span>
        </div>

        {/* Catégorie discrète + éventuelle offre */}
        {(categoryName || showDiscountLabel) && (
          <div className="mt-1 flex flex-wrap gap-1.5 items-center">
            {categoryName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                {categoryName}
              </span>
            )}
            {showDiscountLabel && (
              <span className="text-xs font-medium text-red-600 truncate max-w-[60%]">
                {discountLabel}
              </span>
            )}
          </div>
        )}

        {/* Adresse */}
        <div className="flex items-center gap-1.5 text-gray-600 text-base mt-2">
          <HiLocationMarker className="w-4 h-4 flex-shrink-0 text-gray-400" />
          <span itemProp="address" className="truncate">{locationLabel || city}</span>
        </div>

        {company.phone && (
          <div className="flex items-center gap-1.5 text-gray-600 text-sm mt-1">
            <HiPhone className="w-4 h-4 flex-shrink-0 text-gray-400" />
            <span className="truncate">{company.phone}</span>
          </div>
        )}

        {/* Services clés (tags) */}
        {topSubServices.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topSubServices.map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Rating avec étoiles */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <HiStar
                key={star}
                className={`w-5 h-5 ${star <= filledStars ? 'text-amber-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
          {reviewCount > 0 ? (
            <>
              <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">· {reviewCount} {reviewCount === 1 ? 'omdöme' : 'omdömen'}</span>
            </>
          ) : (
            <span className="text-sm text-blue-600 font-medium">Ny</span>
          )}
          <div className="sr-only" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
            <meta itemProp="ratingValue" content={rating.toFixed(1)} />
            <meta itemProp="reviewCount" content={String(reviewCount)} />
          </div>
        </div>

        {/* Horaires d'ouverture */}
        {todayHours && (
          <div className="flex items-center gap-2 mt-2 text-sm sm:text-base">
            <HiClock className="w-4 h-4 text-gray-400" />
            {!todayHours.closed ? (
              <>
                <span className={openTextClass}>{openText}</span>
                <span className="text-xs sm:text-sm text-gray-500">· {todayHours.open} - {todayHours.close}</span>
              </>
            ) : (
              <span className={openTextClass}>{openText}</span>
            )}
          </div>
        )}

        {/* Description masquée sur la liste */}
        {false && company.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{company.description}</p>
        )}
      </div>
    </article>
  )
}

export default memo(CompanyCardComponent)
  