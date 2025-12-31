'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useUpdateCompany } from '@/lib/hooks/useCompanies'
import { HiExclamationCircle } from 'react-icons/hi'
import CompanyTabs from '@/components/company/CompanyTabs'
import HeroGallery from '@/components/company/HeroGallery'

interface CompanyClientProps {
  company: any
  reviews: any[]
}

export default function CompanyClient({ company, reviews }: CompanyClientProps) {
  const { user } = useAuth()
  const updateCompany = useUpdateCompany()
  const [localCompany, setLocalCompany] = useState(company)

  const isOwner = user && localCompany?.ownerId && user.uid === localCompany.ownerId
  
  const showAbout = localCompany?.settings?.showAbout !== false
  const showReviews = localCompany?.settings?.showReviews !== false
  const showMap = localCompany?.settings?.showMap !== false
  const showContact = localCompany?.settings?.showContact !== false

  const handlePublish = async () => {
    if (!localCompany || !user) return
    
    try {
      await updateCompany.mutateAsync({
        id: localCompany.id,
        data: {
          status: 'active',
          published: true,
        },
      })
      setLocalCompany((prev: any) => ({ ...prev, status: 'active', published: true }))
      alert('Din annons är nu publicerad!')
    } catch (err) {
      console.error('Error publishing:', err)
      alert('Kunde inte publicera annonsen. Försök igen.')
    }
  }

  // Draft banner for owners
  const draftBanner = localCompany.status === 'draft' && isOwner && (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sticky top-16 z-20">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-800">
          <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Utkast - Endast synlig för dig</span>
        </div>
        <button 
          onClick={handlePublish}
          disabled={updateCompany.isPending}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
        >
          {updateCompany.isPending ? 'Publicerar...' : 'Publicera nu'}
        </button>
      </div>
    </div>
  )

  const images = Array.isArray(localCompany.images) ? localCompany.images : []
  const cleanedImages = images
    .map((img: string) => String(img || '').trim())
    .filter(Boolean)

  return (
    <>
      {draftBanner}
      
      <HeroGallery 
        images={cleanedImages.length > 0 ? cleanedImages : ['/placeholder.jpg']}
        companyName={localCompany.name}
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <CompanyTabs
          services={localCompany.services || []}
          description={localCompany.description}
          images={cleanedImages}
          companyName={localCompany.name}
          rating={localCompany.rating}
          reviewCount={localCompany.reviewCount}
          reviews={reviews}
          openingHours={localCompany.openingHours}
          address={localCompany.address}
          city={localCompany.city}
          phone={localCompany.phone}
          email={localCompany.email}
          website={localCompany.website}
          visibleSections={{
            about: showAbout,
            reviews: showReviews,
            contact: showContact,
          }}
        />

        {showMap && (localCompany.address || localCompany.city) && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mt-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Hitta hit</h2>
            <div className="aspect-video rounded-xl overflow-hidden">
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(
                  `${localCompany.address || ''} ${localCompany.city || ''}`
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
    </>
  )
}
