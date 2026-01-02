'use client'

import { useState } from 'react'
import Image from 'next/image'
import { HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi'

interface HeroGalleryProps {
  images: string[]
  companyName: string
}

export default function HeroGallery({ images, companyName }: HeroGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (!images || images.length === 0) return null

  const displayImages = images.slice(0, 5)
  const hasMoreImages = images.length > 5

  const desktopCount = displayImages.length

  const desktopGridClass =
    desktopCount === 1
      ? 'md:grid-cols-1'
      : desktopCount === 2
        ? 'md:grid-cols-2'
        : desktopCount === 3
          ? 'md:grid-cols-3 md:grid-rows-2'
          : desktopCount === 4
            ? 'md:grid-cols-2 md:grid-rows-2'
            : 'md:grid-cols-4 md:grid-rows-2'

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <>
      {/* Desktop Gallery Grid - Style Airbnb */}
      <div className={`hidden md:grid gap-2 rounded-2xl overflow-hidden h-[220px] lg:h-[220px] xl:h-[240px] ${desktopGridClass}`}>
        {desktopCount === 1 && (
          <button
            onClick={() => openLightbox(0)}
            className="relative group overflow-hidden bg-gray-100"
          >
            <Image
              src={displayImages[0]}
              alt={`${companyName} - Photo principale`}
              fill
              sizes="(max-width: 768px) 100vw, 80vw"
              quality={85}
              priority={true}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        )}

        {desktopCount === 2 &&
          displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => openLightbox(idx)}
              className="relative group overflow-hidden bg-gray-100"
            >
              <Image
                src={img}
                alt={`${companyName} - Photo ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                quality={80}
                priority={idx === 0}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </button>
          ))}

        {desktopCount === 3 && (
          <>
            <button
              onClick={() => openLightbox(0)}
              className="relative col-span-2 row-span-2 group overflow-hidden bg-gray-100"
            >
              <Image
                src={displayImages[0]}
                alt={`${companyName} - Photo principale`}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                quality={85}
                priority={true}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </button>
            {displayImages.slice(1).map((img, idx) => (
              <button
                key={idx + 1}
                onClick={() => openLightbox(idx + 1)}
                className="relative group overflow-hidden bg-gray-100"
              >
                <Image
                  src={img}
                  alt={`${companyName} - Photo ${idx + 2}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 34vw"
                  quality={78}
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </>
        )}

        {desktopCount === 4 &&
          displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => openLightbox(idx)}
              className="relative group overflow-hidden bg-gray-100"
            >
              <Image
                src={img}
                alt={`${companyName} - Photo ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                quality={78}
                priority={idx === 0}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </button>
          ))}

        {desktopCount >= 5 && (
          <>
            <button
              onClick={() => openLightbox(0)}
              className="relative col-span-2 row-span-2 group overflow-hidden bg-gray-100"
            >
              <Image
                src={displayImages[0]}
                alt={`${companyName} - Photo principale`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={85}
                priority={true}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </button>

            {displayImages.slice(1, 5).map((img, idx) => (
              <button
                key={idx + 1}
                onClick={() => openLightbox(idx + 1)}
                className="relative group overflow-hidden bg-gray-100"
              >
                <Image
                  src={img}
                  alt={`${companyName} - Photo ${idx + 2}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  quality={75}
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {idx === 3 && hasMoreImages && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      +{images.length - 5}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Mobile Gallery - Single large image with counter */}
      <div className="md:hidden relative h-[300px] bg-gray-100 rounded-2xl overflow-hidden">
        <Image
          src={displayImages[lightboxIndex % displayImages.length] || displayImages[0]}
          alt={`${companyName} - Photo ${lightboxIndex + 1}`}
          fill
          sizes="100vw"
          quality={85}
          priority={true}
          className="object-cover"
        />
        
        {/* Navigation arrows for mobile */}
        {images.length > 1 && (
          <>
            <button
              aria-label="Föregående bild"
              onClick={() => setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/95 rounded-full shadow-lg hover:bg-white"
            >
              <HiChevronLeft className="w-5 h-5" />
            </button>
            <button
              aria-label="Nästa bild"
              onClick={() => setLightboxIndex((prev) => (prev + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/95 rounded-full shadow-lg hover:bg-white"
            >
              <HiChevronRight className="w-5 h-5" />
            </button>
            
            {/* Image counter */}
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
              {lightboxIndex + 1} / {images.length}
            </div>
          </>
        )}

        {/* View all button for mobile */}
        <button
          onClick={() => openLightbox(lightboxIndex)}
          className="absolute bottom-4 left-4 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-gray-50"
        >
          Visa alla bilder
        </button>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Close button */}
          <button
            aria-label="Stäng"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-10"
          >
            <HiX className="w-6 h-6" />
          </button>

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                aria-label="Föregående bild"
                onClick={prevImage}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-10"
              >
                <HiChevronLeft className="w-6 h-6" />
              </button>
              <button
                aria-label="Nästa bild"
                onClick={nextImage}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition z-10"
              >
                <HiChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Main lightbox image */}
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
            <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
              <Image
                src={images[lightboxIndex]}
                alt={`${companyName} - Photo ${lightboxIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 90vw"
                quality={90}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Thumbnail strip at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                    idx === lightboxIndex
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    sizes="64px"
                    quality={60}
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
