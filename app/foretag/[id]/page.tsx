import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { HiArrowLeft, HiPhone, HiMail, HiLocationMarker, HiStar, HiShare, HiHeart } from 'react-icons/hi'
import BookingForm from '@/components/booking/BookingForm'
import ReviewSection from '@/components/company/ReviewSection'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

// Types
interface Service {
  name: string
  price: number
  duration: number
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
  phone: string
  email?: string
  website?: string
  rating: number
  reviewCount: number
  services: Service[]
  openingHours: OpeningHours
}

// Fetch company from Firestore
async function getCompany(id: string): Promise<Company | null> {
  try {
    // For server-side, we need to initialize Firebase differently
    const { initializeApp, getApps } = await import('firebase/app')
    const { getFirestore, doc, getDoc } = await import('firebase/firestore')
    
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
    
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    const db = getFirestore(app)
    
    const docRef = doc(db, 'companies', id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Company
  } catch (error) {
    console.error('Error fetching company:', error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const company = await getCompany(params.id)
  
  if (!company) {
    return {
      title: 'Företag hittades inte | BokaNära',
    }
  }
  
  return {
    title: `${company.name} - ${company.categoryName} i ${company.city} | BokaNära`,
    description: company.description?.substring(0, 150) || `${company.name} i ${company.city}`,
    openGraph: {
      title: `${company.name} - ${company.categoryName}`,
      description: company.description || `${company.name} i ${company.city}`,
      type: 'website',
    },
  }
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

export default async function CompanyPage({ params }: { params: { id: string } }) {
  const company = await getCompany(params.id)

  if (!company) {
    notFound()
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
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <HiShare className="w-5 h-5 text-gray-600" />
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
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-500">
                          {service.description && `${service.description} • `}
                          {service.duration} min
                        </p>
                      </div>
                      <div className="text-right">
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
                  <p className="text-gray-600">🌐 {company.website}</p>
                )}
              </div>
            </section>

            {/* Reviews */}
            <ReviewSection companyId={company.id} companyName={company.name} />
          </div>

          {/* Sidebar - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-36">
              <BookingForm 
                services={company.services || []} 
                companyName={company.name}
                companyId={company.id}
                openingHours={company.openingHours}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
