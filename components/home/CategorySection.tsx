'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2'
import { getCategoryImage } from '@/lib/categoryImages'

// Main categories with photos
const mainCategories = [
  { id: 'stadning', name: 'Städning', category: 'stadning' },
  { id: 'flytt', name: 'Flytt & Transport', category: 'flytt' },
  { id: 'hantverk', name: 'Hantverk & Småjobb', category: 'hantverk' },
  { id: 'hem-fastighet', name: 'Hem & Fastighet', category: 'hem-fastighet' },
]

// Popular sub-services with photos
const popularServices = [
  { id: 'hemstadning', name: 'Hemstädning', category: 'stadning' },
  { id: 'storstadning', name: 'Storstädning', category: 'stadning' },
  { id: 'flyttstadning', name: 'Flyttstädning', category: 'stadning' },
  { id: 'fonsterputs', name: 'Fönsterputs', category: 'stadning' },
  { id: 'kontorsstadning', name: 'Kontorsstädning', category: 'stadning' },
  { id: 'flytthjalp', name: 'Flytthjälp', category: 'flytt' },
  { id: 'packning', name: 'Packning', category: 'flytt' },
  { id: 'transport', name: 'Transport', category: 'flytt' },
]

// Additional services (shown in list without photos)
const additionalServices = [
  { id: 'trappstadning', name: 'Trappstädning', category: 'stadning' },
  { id: 'byggstadning', name: 'Byggstädning', category: 'stadning' },
  { id: 'visningsstadning', name: 'Visningsstädning', category: 'stadning' },
  { id: 'golvvard', name: 'Golvvård', category: 'stadning' },
  { id: 'mattvatt', name: 'Mattvätt', category: 'stadning' },
  { id: 'bortforsling', name: 'Bortforsling', category: 'flytt' },
  { id: 'montering', name: 'Montering', category: 'hantverk' },
  { id: 'snickeri', name: 'Snickeri', category: 'hantverk' },
  { id: 'el', name: 'El & Elektriker', category: 'hantverk' },
  { id: 'vvs', name: 'VVS & Rörmokare', category: 'hantverk' },
  { id: 'malning', name: 'Målning', category: 'hantverk' },
  { id: 'grasklippning', name: 'Gräsklippning', category: 'hem-fastighet' },
  { id: 'tradgardsarbete', name: 'Trädgårdsarbete', category: 'hem-fastighet' },
  { id: 'snoskottning', name: 'Snöskottning', category: 'hem-fastighet' },
  { id: 'fastighetsskotsel', name: 'Fastighetsskötsel', category: 'hem-fastighet' },
]

export default function CategorySection() {
  const [showMore, setShowMore] = useState(false)

  return (
    <section className="py-10 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        {/* Main Categories */}
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Populära kategorier</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {mainCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/sok?kategori=${cat.category}`}
              className="group flex flex-col items-center p-3 sm:p-4 bg-gray-50 hover:bg-white border border-gray-200 hover:border-brand/30 rounded-xl sm:rounded-2xl text-center shadow-sm hover:shadow-md transition-all"
            >
              <div className="mb-2 sm:mb-3 relative w-full aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                <Image
                  src={getCategoryImage(cat.id)}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 45vw, 220px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority={false}
                />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-brand transition-colors line-clamp-1">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Popular Services */}
        <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Populära tjänster</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {popularServices.map((service) => (
            <Link
              key={service.id}
              href={`/sok?kategori=${service.category}&tjanst=${service.id}`}
              className="group flex flex-col items-center p-2.5 sm:p-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-brand/30 rounded-xl text-center shadow-sm hover:shadow-md transition-all"
            >
              <div className="mb-2 relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <Image
                  src={getCategoryImage(service.id)}
                  alt={service.name}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, 180px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority={false}
                />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-brand transition-colors line-clamp-1">
                {service.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Show More Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowMore(!showMore)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-brand bg-gray-100 hover:bg-gray-50 rounded-full transition-colors"
          >
            {showMore ? 'Visa mindre' : 'Visa fler tjänster'}
            {showMore ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Additional Services List (no photos) */}
        {showMore && (
          <div className="mt-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Fler tjänster</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {additionalServices.map((service) => (
                <Link
                  key={service.id}
                  href={`/sok?kategori=${service.category}&tjanst=${service.id}`}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-brand hover:bg-white rounded-lg transition-colors"
                >
                  {service.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
