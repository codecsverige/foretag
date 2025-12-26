'use client'

import Link from 'next/link'
import Image from 'next/image'
import { memo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HiStar, HiLocationMarker, HiBadgeCheck, HiArrowRight } from 'react-icons/hi'
import { getCategoryImage, categoryNames } from '@/lib/categoryImages'
import { getCompanyById } from '@/lib/companiesCache'

interface Company {
  id: string
  name: string
  category?: string
  categoryName?: string
  city?: string
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
}

interface CompanyCardProps {
  company: Company
}

function CompanyCardComponent({ company }: CompanyCardProps) {
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
  const rating = company.rating || 0
  const reviewCount = company.reviewCount || 0
  const priceFrom = company.priceFrom || company.services?.[0]?.price || 0

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
  const effectiveLabel = (isDiscountCfgActive ? (discountCfg?.label || '') : (company.discountText || '')).trim()

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
  
  const hasOwnImage = company.image || (company.images && company.images.length > 0)
  const imageUrl: string = (company.image || company.images?.[0] || getCategoryImage(company.category))

  return (
    <Link href={`/foretag/${company.id}`} className="block h-full" onMouseEnter={prefetch} onFocus={prefetch} onTouchStart={prefetch}>
      <article className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-200 active:scale-[0.99] h-full flex flex-col">
        {/* Image avec aspect-ratio fixe pour meilleur cadrage */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={company.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
              style={{ objectFit: 'cover' }}
              loading="lazy"
              quality={75}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Bordure interne pour effet de cadre */}
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-t-2xl pointer-events-none" />
          
          {/* Badges en haut */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 flex items-start justify-between">
            <div className="flex gap-1 sm:gap-1.5 flex-wrap">
              {company.premium && (
                <span className="bg-amber-500 text-white px-2 py-0.5 sm:py-1 rounded text-xs font-medium shadow-md">
                  Premium
                </span>
              )}
              {company.verified && (
                <span className="bg-white text-blue-600 px-2 py-0.5 sm:py-1 rounded text-xs font-medium shadow-md flex items-center gap-0.5 sm:gap-1">
                  <HiBadgeCheck className="w-3.5 h-3.5" />
                  Verifierad
                </span>
              )}
              {hasDiscount && (
                <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-0.5 sm:py-1 rounded text-xs font-semibold shadow-md ring-1 ring-white/20">
                  {effectiveType === 'amount' ? `-${effectiveValue} kr` : `-${effectiveValue}%`}{effectiveLabel ? ` ${effectiveLabel}` : ''}
                </span>
              )}
            </div>
            
            {rating > 0 && (
              <span className="bg-white/95 text-gray-900 px-2 py-0.5 sm:py-1 rounded text-xs font-medium shadow-md flex items-center gap-0.5 sm:gap-1">
                <HiStar className="w-3.5 h-3.5 text-amber-500" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Catégorie en bas de l'image */}
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3">
            <span className="bg-white/95 text-gray-700 px-2.5 py-1 rounded text-xs font-medium shadow">
              {categoryName}
            </span>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-sm sm:text-base mb-1">
            {company.name}
          </h3>

          <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm">
            <HiLocationMarker className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{city}</span>
          </div>

          {company.description && (
            <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 mt-2 flex-1">
              {company.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
            <div className="text-xs sm:text-sm">
              {rating > 0 ? (
                <span className="text-gray-500">
                  {reviewCount} {reviewCount === 1 ? 'omdöme' : 'omdömen'}
                </span>
              ) : (
                <span className="text-blue-600 text-xs font-medium">✨ Ny</span>
              )}
            </div>
            
            {originalFrom > 0 ? (
              <span className="text-xs sm:text-sm whitespace-nowrap">
                <span className="text-gray-400">Från </span>
                <span className="font-semibold text-gray-900">{showStrike ? discountedFrom : originalFrom} kr</span>
                {showStrike && (
                  <span className="ml-1.5 text-gray-400 line-through font-medium">{originalFrom} kr</span>
                )}
              </span>
            ) : (
              <span className="text-blue-600 text-xs sm:text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all whitespace-nowrap">
                Visa mer <HiArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

export default memo(CompanyCardComponent)
