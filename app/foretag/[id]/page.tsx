'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { HiArrowLeft, HiPhone, HiMail, HiLocationMarker, HiStar, HiShare, HiHeart, HiGlobeAlt } from 'react-icons/hi'
import BookingForm from '@/components/booking/BookingForm'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { buildShareUrl, copyToClipboard } from '@/lib/utils'

// Types
interface Service {
  name: string
  price: number
  duration?: number
  description?: string
}

interface OpeningHours {
  [key: string]: {
    open: string
    close: string
    closed: boolean
  }
}

interface Company {
  id: string
  name: string
  category: string
  categoryName: string
  emoji: string
  city: string
  address?: string
  description: string
  phone?: string
  email?: string
  website?: string
  rating: number
  reviewCount: number
  services: Service[]
  openingHours?: OpeningHours
}

export default function CompanyPage({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    async function fetchCompany() {
      try {
        if (!db) {
          setLoading(false)
          return
        }

        const docRef = doc(db, 'companies', params.id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          setLoading(false)
          return
        }

        setCompany({
          id: docSnap.id,
          ...docSnap.data()
        } as Company)
      } catch (error) {
        console.error('Error fetching company:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [params.id])

  const handleShare = async () => {
    const shareUrl = buildShareUrl(params.id)
    try {
      await copyToClipboard(shareUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    )
  }

  if (!company) {
    notFound()
  }

  const dayNames: { [key: string]: string } = {
    monday: 'Måndag',
    tuesday: 'Tisdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag',
    saturday: 'Lördag',
    sunday: 'Söndag',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-brand">
            <HiArrowLeft className="w-5 h-5" />
            <span>Tillbaka</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
              title="Dela sida"
            >
              <HiShare className="w-5 h-5 text-gray-600" />
              {copySuccess && <span className="text-xs text-green-600">Kopierad!</span>}
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <HiHeart className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Company Header */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="h-48 md:h-64 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-8xl">{company.emoji}</span>
          </div>

          <div className="p-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                🏢 Företag
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                {company.emoji} {company.categoryName}
              </span>
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm">
                <HiLocationMarker className="w-4 h-4" />
                {company.city}
              </span>
            </div>

            {/* Name & Rating */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <HiStar className="w-5 h-5 text-yellow-400" />
                <span className="font-bold">{company.rating || 'Ny'}</span>
              </div>
              <span className="text-gray-400">({company.reviewCount || 0} omdömen)</span>
            </div>

            {/* Contact Buttons */}
            <div className="flex flex-wrap gap-3">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  <HiPhone className="w-5 h-5" />
                  Ring
                </a>
              )}
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  <HiMail className="w-5 h-5" />
                  E-post
                </a>
              )}
              {company.website && (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  <HiGlobeAlt className="w-5 h-5" />
                  Hemsida
                </a>
              )}
              {company.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(company.address + ', ' + company.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition"
                >
                  <HiLocationMarker className="w-5 h-5" />
                  Hitta hit
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Om oss</h2>
              <p className="text-gray-600 leading-relaxed">{company.description}</p>
            </section>

            {/* Services */}
            {company.services && company.services.length > 0 && (
              <section className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">💈 Tjänster & Priser</h2>
                <div className="space-y-4">
                  {company.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        {(service.description || service.duration) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {service.description && service.description}
                            {service.description && service.duration && ' • '}
                            {service.duration && `${service.duration} min`}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <span className="font-bold text-lg text-brand">{service.price} kr</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Opening Hours */}
            {company.openingHours && (
              <section className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">🕐 Öppettider</h2>
                <div className="space-y-2">
                  {Object.entries(company.openingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-600">{dayNames[day]}</span>
                      <span className={hours.closed ? 'text-red-500' : 'text-gray-900 font-medium'}>
                        {hours.closed ? 'Stängt' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location */}
            {company.address && (
              <section className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📍 Hitta hit</h2>
                <div className="bg-gray-200 h-48 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-gray-500">Karta kommer här</span>
                </div>
                <p className="text-gray-600">{company.address}, {company.city}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(company.address + ', ' + company.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand hover:underline mt-2"
                >
                  Öppna i Google Maps →
                </a>
              </section>
            )}

            {/* Contact Info */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📞 Kontakt</h2>
              <div className="space-y-2">
                {company.phone && (
                  <p className="text-gray-600">📞 {company.phone}</p>
                )}
                {company.email && (
                  <p className="text-gray-600">📧 {company.email}</p>
                )}
                {company.website && (
                  <p className="text-gray-600">
                    🌐 <a 
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {company.website}
                    </a>
                  </p>
                )}
                {!company.phone && !company.email && !company.website && (
                  <p className="text-gray-500 italic">Ingen kontaktinformation tillgänglig</p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-36">
              <BookingForm 
                services={company.services || []} 
                companyName={company.name}
                companyId={company.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
