'use client'

import Link from 'next/link'
import { memo } from 'react'
import { HiStar, HiLocationMarker, HiBadgeCheck, HiArrowRight } from 'react-icons/hi'
import { getCategoryImage, categoryNames } from '@/lib/categoryImages'

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
  phone?: string
}

function CompanyCardComponent({ company }: { company: Company }) {
  const categoryName = company.categoryName || categoryNames[company.category || ''] || 'Företag'
  const city = company.city || 'Sverige'
  const rating = company.rating || 0
  const reviewCount = company.reviewCount || 0
  const priceFrom = company.priceFrom || company.services?.[0]?.price || 0
  
  const hasOwnImage = company.image || (company.images && company.images.length > 0)
  const imageUrl = hasOwnImage 
    ? (company.image || company.images?.[0]) 
    : getCategoryImage(company.category)

  return (
    <Link href={`/foretag/${company.id}`} prefetch={false} className="block h-full">
      <article className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 h-full flex flex-col">
        {/* Image - taille réduite */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={imageUrl}
            alt={company.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Badges en haut */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="flex gap-1.5">
              {company.premium && (
                <span className="bg-amber-500 text-white px-2 py-1 rounded text-xs font-medium shadow">
                  Premium
                </span>
              )}
              {company.verified && (
                <span className="bg-white text-blue-600 px-2 py-1 rounded text-xs font-medium shadow flex items-center gap-1">
                  <HiBadgeCheck className="w-3.5 h-3.5" />
                  Verifierad
                </span>
              )}
            </div>
            
            {rating > 0 && (
              <span className="bg-white/95 text-gray-900 px-2 py-1 rounded text-xs font-medium shadow flex items-center gap-1">
                <HiStar className="w-3.5 h-3.5 text-amber-500" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Catégorie en bas de l'image */}
          <div className="absolute bottom-3 left-3">
            <span className="bg-white/95 text-gray-700 px-2.5 py-1 rounded text-xs font-medium shadow">
              {categoryName}
            </span>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-base mb-1">
            {company.name}
          </h3>

          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <HiLocationMarker className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{city}</span>
          </div>

          {company.description && (
            <p className="text-gray-500 text-sm line-clamp-2 mt-2 flex-1">
              {company.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="text-sm">
              {rating > 0 ? (
                <span className="text-gray-500">
                  {reviewCount} {reviewCount === 1 ? 'omdöme' : 'omdömen'}
                </span>
              ) : (
                <span className="text-blue-600 text-xs font-medium">✨ Ny</span>
              )}
            </div>
            
            {priceFrom > 0 ? (
              <span className="text-sm">
                <span className="text-gray-400">Från </span>
                <span className="font-semibold text-gray-900">{priceFrom} kr</span>
              </span>
            ) : (
              <span className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Visa mer <HiArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

export default memo(CompanyCardComponent)
