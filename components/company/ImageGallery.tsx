'use client'

import { useState } from 'react'
import Image from 'next/image'
import { HiX, HiChevronLeft, HiChevronRight, HiPhotograph } from 'react-icons/hi'

interface ImageGalleryProps {
  images: string[]
  companyName: string
}

const MAX_GALLERY_IMAGES = 5

export default function ImageGallery({ images, companyName }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const allImages = (images || [])
    .map((img) => String(img || '').trim())
    .filter(Boolean)

  // Limit images to max 5 for performance
  const displayImages = allImages.slice(0, MAX_GALLERY_IMAGES)

  if (allImages.length === 0) return null

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const goToPrev = () => setCurrentIndex(i => (i === 0 ? allImages.length - 1 : i - 1))
  const goToNext = () => setCurrentIndex(i => (i === allImages.length - 1 ? 0 : i + 1))

  // Different layouts based on image count
  const getGridLayout = () => {
    switch (displayImages.length) {
      case 1:
        return 'grid-cols-1'
      case 2:
        return 'grid-cols-2'
      case 3:
        return 'grid-cols-2 sm:grid-cols-3'
      case 4:
        return 'grid-cols-2 sm:grid-cols-4'
      default:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
    }
  }

  return (
    <>
      {/* Gallery Grid - Optimized */}
      <div className={`grid ${getGridLayout()} gap-2`}>
        {displayImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => openLightbox(idx)}
            className={`relative rounded-xl overflow-hidden group ${
              displayImages.length === 1 ? 'aspect-video' : 'aspect-square'
            }`}
          >
            <Image
              src={img}
              alt={`${companyName} - Bild ${idx + 1}`}
              fill
              sizes={displayImages.length === 1 ? '100vw' : '(max-width: 640px) 50vw, 20vw'}
              quality={75}
              loading="lazy"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            {allImages.length > MAX_GALLERY_IMAGES && idx === displayImages.length - 1 && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-sm font-semibold">
                +{allImages.length - MAX_GALLERY_IMAGES}
              </div>
            )}
            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
              <HiPhotograph className="w-3 h-3 inline mr-0.5" />
              {idx + 1}/{allImages.length}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox - Optimized */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            aria-label="Stäng"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
          >
            <HiX className="w-8 h-8" />
          </button>

          {allImages.length > 1 && (
            <button
              aria-label="Föregående bild"
              onClick={(e) => { e.stopPropagation(); goToPrev() }}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            >
              <HiChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div 
            className="relative w-full max-w-3xl h-[70vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={allImages[currentIndex]}
              alt={`${companyName} - Bild ${currentIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              quality={90}
              className="object-contain"
              priority={true}
            />
          </div>

          {allImages.length > 1 && (
            <button
              aria-label="Nästa bild"
              onClick={(e) => { e.stopPropagation(); goToNext() }}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            >
              <HiChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {allImages.length}
          </div>
        </div>
      )}
    </>
  )
}
