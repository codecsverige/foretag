'use client'

import { HiArrowLeft } from 'react-icons/hi'
import HeroGallery from '@/components/company/HeroGallery'
import CompanyTabs from '@/components/company/CompanyTabs'

interface PreviewModeProps {
  company: any
  onBack: () => void
}

export default function PreviewMode({ company, onBack }: PreviewModeProps) {
  const images = Array.isArray(company.images) ? company.images : []
  const cleanedImages = images.map((img) => String(img || '').trim()).filter(Boolean)

  const showAbout = company.settings?.showAbout !== false
  const showReviews = company.settings?.showReviews !== false
  const showMap = company.settings?.showMap !== false
  const showContact = company.settings?.showContact !== false

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Header */}
      <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-amber-800 hover:text-amber-900 font-medium transition"
              >
                <HiArrowLeft className="w-5 h-5" />
                Tillbaka till redigeraren
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></div>
              <span className="font-medium">Förhandsgranskningsläge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="bg-white">
        <HeroGallery 
          images={cleanedImages.length > 0 ? cleanedImages : ['/placeholder.jpg']}
          companyName={company.name}
        />

        <div className="max-w-5xl mx-auto px-4 py-6">
          <CompanyTabs
            services={company.services || []}
            description={company.description}
            images={cleanedImages}
            companyName={company.name}
            rating={company.rating}
            reviewCount={company.reviewCount}
            reviews={[]}
            openingHours={company.openingHours}
            address={company.address}
            city={company.city}
            phone={company.phone}
            email={company.email}
            website={company.website}
            visibleSections={{
              about: showAbout,
              reviews: showReviews,
              contact: showContact,
            }}
          />

          {showMap && (company.address || company.city) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mt-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Hitta hit</h2>
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(
                    `${company.address || ''} ${company.city || ''}`
                  )}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
