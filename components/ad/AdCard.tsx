import Link from 'next/link'
import { HiStar, HiLocationMarker } from 'react-icons/hi'

interface Ad {
  id: string
  companyName: string
  category?: string
  categoryName?: string
  emoji?: string
  city?: string
  description?: string
  services?: Array<{ price?: number }>
  images?: string[]
  status?: string
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

export default function AdCard({ ad }: { ad: Ad }) {
  // Handle missing data gracefully
  const emoji = ad.emoji || categoryEmojis[ad.category || ''] || '📢'
  const categoryName = ad.categoryName || ad.category || 'Annons'
  const city = ad.city || 'Sverige'
  const priceFrom = ad.services?.[0]?.price || 0

  return (
    <Link href={`/ad/${ad.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
        {/* Image */}
        <div className="h-48 bg-gradient-to-br from-purple-50 to-pink-100 relative">
          {ad.images && ad.images.length > 0 ? (
            <img
              src={ad.images[0]}
              alt={ad.companyName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {emoji}
            </div>
          )}
          <span className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            📢 Annons
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category Badge */}
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs mb-2">
            {emoji} {categoryName}
          </span>

          {/* Name */}
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-brand transition line-clamp-1">
            {ad.companyName}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
            <HiLocationMarker className="w-4 h-4" />
            {city}
          </div>

          {/* Description Preview */}
          {ad.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {ad.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {ad.services?.length || 0} tjänster
            </span>
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

          {/* View Details Button */}
          <button className="w-full mt-3 bg-brand text-white py-2 rounded-lg font-semibold hover:bg-brand-dark transition text-sm">
            Visa detaljer
          </button>
        </div>
      </div>
    </Link>
  )
}
