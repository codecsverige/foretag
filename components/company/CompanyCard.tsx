'use client'

import Image from 'next/image'
import { memo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HiStar, HiLocationMarker, HiBadgeCheck, HiClock } from 'react-icons/hi'
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
  logo?: string
  staffCount?: number
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
  variant?: 'row' | 'grid'
}

function CompanyCardComponent({ company, priority = false, variant = 'row' }: CompanyCardProps) {
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
  const staffCount = Number(company.staffCount || 0)
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

  const nextOpenInfo = (() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayNamesSv = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
    const now = new Date()
    const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const todayIndex = now.getDay()

    const canUseToday = Boolean(todayHours && !todayHours.closed && nowStr <= (todayHours?.close || '00:00'))
    const startOffset = canUseToday ? 0 : 1

    for (let offset = startOffset; offset < 7; offset++) {
      const idx = (todayIndex + offset) % 7
      const dayKey = days[idx]
      const hours = company.openingHours?.[dayKey]
      if (!hours || hours.closed) continue

      const label = offset === 0 ? 'Idag' : (offset === 1 ? 'Imorgon' : `På ${dayNamesSv[idx]}`)
      return { open: hours.open, label, offset }
    }
    return null
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
  const logoUrl: string = (company.logo || company.images?.[1] || imageUrl)

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
  const tiderTextClass = nextOpenInfo?.offset === 0 ? 'text-green-700 font-medium' : 'text-gray-600'

  // Formatage pro des prix en suédois (ex: 1 200)
  const formatKr = (n: number) => new Intl.NumberFormat('sv-SE').format(n)
  const hasMetaRight = Boolean(company.premium)
  const isGrid = variant === 'grid'

  // Description adaptable et professionnelle si aucune description n'est fournie
  const rawDescription = (company.description || '').trim()
  const looksBrokenDescription = /no such price|price_[a-z0-9]+/i.test(rawDescription)
  const hasDescription = rawDescription.length > 0 && !looksBrokenDescription
  const popularServicesText = topSubServices.length > 0 ? ` Populära tjänster: ${topSubServices.join(' · ')}.` : ''
  const fallbackDescription = `Hitta och boka ${categoryName.toLowerCase()}${city ? ` i ${city}` : ''}. Jämför företag, läs omdömen och boka enkelt online.${popularServicesText}`
  const descriptionText = hasDescription ? rawDescription : fallbackDescription
 
  return (
    <article
      itemScope
      itemType="https://schema.org/LocalBusiness"
      className={`group relative ${isGrid ? 'flex flex-col' : 'flex flex-row'} bg-white rounded-2xl border-2 border-gray-200 hover:border-brand/50 overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30`}
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
      {/* Image */}
      <div className={`relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 ${isGrid ? 'w-full aspect-[16/9] md:aspect-[4/3]' : 'w-40 sm:w-48 md:w-72 lg:w-80 aspect-[4/3] flex-shrink-0'}`}>
        <Image
          src={imageUrl}
          alt={company.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover brightness-110 contrast-[1.08] saturate-[1.05] group-hover:scale-110 transition-all duration-700 ease-out"
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          quality={90}
        />
        
        {/* Overlay gradient subtil pour meilleur contraste */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />
        
        {/* Badge réduction en haut à gauche */}
        {hasDiscount && (
          <div className="absolute top-3 left-3">
            <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-sm border border-red-400/30">
              {effectiveType === 'percent' ? `-${effectiveValue}%` : 'Rabatt'}
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
      </div>

      {/* Contenu */}
      <div className={`px-4 sm:px-5 md:px-6 py-4 md:py-5 flex-1 flex flex-col ${isGrid ? 'min-h-[120px]' : ''}`}>
        {/* Titre */}
        <div className="flex items-start justify-between gap-2">
          <h3 itemProp="name" className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-lg sm:text-xl md:text-2xl leading-tight line-clamp-1 md:line-clamp-2">
            <span className="inline-flex items-center gap-1.5">
              {company.name}
              {company.verified && (
                <HiBadgeCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-600 drop-shadow-sm" aria-label="Verifierad" />
              )}
            </span>
          </h3>
        </div>

        {/* Prix accessible uniquement (non affiché visuellement) */}
        {originalFrom > 0 && (
          <div className="sr-only">
            <span>Från {formatKr(showStrike ? discountedFrom : originalFrom)} kr</span>
          </div>
        )}

        {/* Bloc logo + infos (style Bokadirekt) */}
        <div className="flex items-start md:items-center gap-3 sm:gap-4 mt-3 md:mt-4">
          {/* Petit logo carré */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-white flex-shrink-0 border-2 border-gray-200 shadow-sm">
            <Image
              src={logoUrl}
              alt={`${company.name} logo`}
              fill
              sizes="(max-width: 768px) 56px, (max-width: 1024px) 64px, 72px"
              className="object-contain p-1"
              loading="lazy"
            />
          </div>

          {/* Infos à droite du logo */}
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
            {/* Adresse */}
            <div className="flex items-center gap-1.5 text-gray-700 text-sm sm:text-base">
              <HiLocationMarker className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-brand" />
              <span itemProp="address" className="truncate font-semibold">{locationLabel || city}</span>
            </div>

            {/* Rating (style Bokadirekt: note + 5 étoiles + nombre betyg) */}
            <div className="flex items-center gap-1.5 text-sm sm:text-base">
              {reviewCount > 0 ? (
                <>
                  <span className="font-bold text-gray-900 text-base sm:text-lg">{rating.toFixed(1)}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <HiStar
                        key={star}
                        className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${star <= filledStars ? 'text-amber-400 drop-shadow-sm' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-semibold">({reviewCount})</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <HiStar key={star} className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 drop-shadow-sm" />
                    ))}
                  </div>
                  <span className="text-sm sm:text-base text-blue-600 font-bold">Ny</span>
                </>
              )}
              <div className="sr-only" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                <meta itemProp="ratingValue" content={rating.toFixed(1)} />
                <meta itemProp="reviewCount" content={String(reviewCount)} />
              </div>
            </div>

            {/* Horaires (style Bokadirekt: Tider fr. HH:MM, Idag) */}
            {nextOpenInfo && (
              <div className="flex items-center gap-1.5 text-sm sm:text-base">
                <HiClock className="w-4 h-4 sm:w-5 sm:h-5 text-brand flex-shrink-0" />
                <span className={tiderTextClass}>Tider fr. {nextOpenInfo.open}, {nextOpenInfo.label}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description adaptée à toutes les catégories */}
        {descriptionText && (
          <p className={`mt-3 text-sm sm:text-base text-gray-700 leading-relaxed font-normal ${isGrid ? 'line-clamp-2' : 'line-clamp-2 md:line-clamp-3'}`}>{descriptionText}</p>
        )}

        {/* Badges en bas (style Bokadirekt: Qliro, Presentkort, Branschorg.) */}
        {(categoryName || showDiscountLabel || topSubServices.length > 0) && (
          <div className={`${isGrid ? 'mt-3 md:mt-4' : 'mt-auto pt-3 md:pt-4'} flex flex-wrap gap-2 sm:gap-2.5 items-center`}>
            {categoryName && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm bg-brand/10 text-brand border-2 border-brand/30 font-semibold shadow-sm">
                {categoryName}
              </span>
            )}
            {showDiscountLabel && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-50 text-red-600 border border-red-200 font-medium">
                {discountLabel}
              </span>
            )}
            {topSubServices.slice(0, 3).map((s) => (
              <span key={s} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
                {s}
              </span>
            ))}
            {company.premium && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Premium</span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default memo(CompanyCardComponent)
  