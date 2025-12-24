'use client'

import Link from 'next/link'
import { memo } from 'react'
import { HiStar, HiLocationMarker, HiPhone, HiBadgeCheck } from 'react-icons/hi'
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
  
  // Use company image, or fallback to category image
  const hasOwnImage = company.image || (company.images && company.images.length > 0)
  const imageUrl = hasOwnImage 
    ? (company.image || company.images?.[0]) 
    : getCategoryImage(company.category)

  return (
    <Link href={`/foretag/${company.id}`} prefetch={false}>
      <article className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={company.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
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

          {/* Category on image */}
          <div className="absolute bottom-3 left-3">
            <span className="bg-white/95 backdrop-blur-sm text-gray-700 px-2.5 py-1 rounded text-xs font-medium shadow">
              {categoryName}
            </span>
          </div>

          {/* Rating on image */}
          {rating > 0 && (
            <div className="absolute bottom-3 right-3">
              <span className="bg-white/95 backdrop-blur-sm text-gray-900 px-2 py-1 rounded text-xs font-medium shadow flex items-center gap-1">
                <HiStar className="w-3.5 h-3.5 text-amber-500" />
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Name */}
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-base">
            {company.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
            <HiLocationMarker className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{city}</span>
          </div>

          {/* Description */}
          {company.description && (
            <p className="text-gray-500 text-sm line-clamp-2 mt-2 flex-1">
              {company.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-sm">
              {rating > 0 ? (
                <span className="text-gray-500">
                  {reviewCount} {reviewCount === 1 ? 'omdöme' : 'omdömen'}
                </span>
              ) : (
                <span className="text-gray-400 text-xs">Ny på BokaNära</span>
              )}
            </div>
            
            {priceFrom > 0 ? (
              <span className="text-sm">
                <span className="text-gray-400">Från </span>
                <span className="font-semibold text-gray-900">{priceFrom} kr</span>
              </span>
            ) : (
              <span className="text-blue-600 text-sm font-medium group-hover:underline">
                Visa mer →
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

export default memo(CompanyCardComponent)
