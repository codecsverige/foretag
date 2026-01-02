'use client'

import Image from 'next/image'
import { memo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { HiStar, HiLocationMarker, HiBadgeCheck } from 'react-icons/hi'
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
  premium?: boolean
  verified?: boolean
  services?: Array<{ price?: number; name?: string }>
  description?: string
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
  const rating = company.rating || 0
  const reviewCount = company.reviewCount || 0
  const priceFrom = company.priceFrom || company.services?.[0]?.price || 0
  
  const imageUrl: string = company.image || company.images?.[0] || getCategoryImage(company.category, company.id)

  return (
    <article
      className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200 h-full flex flex-col cursor-pointer"
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onClick={() => router.push(`/foretag/${company.id}`)}
      role="link"
      tabIndex={0}
    >
      {/* Image - format vertical compact */}
      <div className="relative h-36 sm:h-40 overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={company.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
        />
        
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Badges en haut */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <div className="flex gap-1.5">
            {company.premium && (
              <span className="bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded shadow">
                Premium
              </span>
            )}
            {company.verified && (
              <span className="bg-white text-blue-600 text-xs font-medium px-2 py-0.5 rounded shadow flex items-center gap-1">
                <HiBadgeCheck className="w-3 h-3" />
                Verifierad
              </span>
            )}
          </div>
          
          {rating > 0 && (
            <span className="bg-white/95 text-gray-900 text-xs font-medium px-2 py-0.5 rounded shadow flex items-center gap-1">
              <HiStar className="w-3 h-3 text-amber-500" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Catégorie en bas */}
        <div className="absolute bottom-2 left-2">
          <span className="bg-white/95 text-gray-700 text-xs font-medium px-2 py-0.5 rounded shadow">
            {categoryName}
          </span>
        </div>
      </div>

      {/* Contenu compact */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Nom */}
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base line-clamp-1">
          {company.name}
        </h3>

        {/* Ville */}
        <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm mt-1">
          <HiLocationMarker className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{city}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {reviewCount > 0 ? (
              <span>{reviewCount} omdömen</span>
            ) : (
              <span className="text-blue-600 font-medium">Ny</span>
            )}
          </div>
          
          {priceFrom > 0 && (
            <span className="text-sm">
              <span className="text-gray-400 text-xs">Från </span>
              <span className="font-semibold text-gray-900">{priceFrom} kr</span>
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export default memo(CompanyCardComponent)
