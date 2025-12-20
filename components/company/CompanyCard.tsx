import Link from 'next/link'
import { HiStar, HiLocationMarker } from 'react-icons/hi'
import { computeMinServicePrice } from '@/lib/utils'

interface Company {
  id: string
  name: string
  category?: string
  categoryName?: string
  emoji?: string
  city?: string
  rating?: number
  reviewCount?: number
  image?: string
  priceFrom?: number
  premium?: boolean
  services?: Array<{ price?: number }>
}

// Map category to emoji
const categoryEmojis: Record<string, string> = {
  frisor: '💇',
  massage: '💆',
  stadning: '🧹',
  bil: '🚗',
  halsa: '🏥',
  restaurang: '🍽️',
  fitness: '💪',
  utbildning: '📚',
}

export default function CompanyCard({ company }: { company: Company }) {
  // Handle missing data gracefully
  const emoji = company.emoji || categoryEmojis[company.category || ''] || '🏢'
  const categoryName = company.categoryName || company.category || 'Företag'
  const city = company.city || 'Sverige'
  const rating = company.rating || 0
  const reviewCount = company.reviewCount || 0
  
  // Compute price from services array robustly
  const priceFrom = company.priceFrom || computeMinServicePrice(company.services) || 0

  return (
    <Link href={`/foretag/${company.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
        {/* Image */}
        <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 relative">
          {company.image ? (
            <img
              src={company.image}
              alt={company.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {emoji}
            </div>
          )}
          {company.premium && (
            <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
              ⭐ Premium
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category Badge */}
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs mb-2">
            {emoji} {categoryName}
          </span>

          {/* Name */}
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-brand transition line-clamp-1">
            {company.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
            <HiLocationMarker className="w-4 h-4" />
            {city}
          </div>

          {/* Rating & Price */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              {rating > 0 ? (
                <>
                  <HiStar className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm">({reviewCount})</span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Nytt företag</span>
              )}
            </div>
            <div className="text-right">
              {priceFrom > 0 ? (
                <>
                  <span className="text-gray-400 text-xs">Från</span>
                  <span className="font-bold text-brand ml-1">{priceFrom} kr</span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Kontakta för pris</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
