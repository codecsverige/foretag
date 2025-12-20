import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { HiArrowLeft, HiPhone, HiMail, HiLocationMarker, HiShare, HiHeart } from 'react-icons/hi'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

// Types
interface Service {
  name: string
  price: number
  duration: number
  description?: string
}

interface Ad {
  id: string
  companyName: string
  category: string
  categoryName: string
  emoji: string
  city: string
  address?: string
  description: string
  phone: string
  email?: string
  website?: string
  services: Service[]
  images?: string[]
  status: string
}

// Fetch ad from Firestore
async function getAd(id: string): Promise<Ad | null> {
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
    
    const docRef = doc(db, 'ads', id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Ad
  } catch (error) {
    console.error('Error fetching ad:', error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const ad = await getAd(params.id)
  
  if (!ad) {
    return {
      title: 'Annons hittades inte | BokaNära',
    }
  }
  
  return {
    title: `${ad.companyName} - ${ad.categoryName} i ${ad.city} | BokaNära`,
    description: ad.description?.substring(0, 150) || `${ad.companyName} i ${ad.city}`,
    openGraph: {
      title: `${ad.companyName} - ${ad.categoryName}`,
      description: ad.description || `${ad.companyName} i ${ad.city}`,
      type: 'website',
    },
  }
}

export default async function AdPage({ params }: { params: { id: string } }) {
  const ad = await getAd(params.id)

  if (!ad) {
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
        {/* Ad Header */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Image Gallery */}
          <div className="h-48 md:h-64 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center relative">
            {ad.images && ad.images.length > 0 ? (
              <img
                src={ad.images[0]}
                alt={ad.companyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-8xl">{ad.emoji}</span>
            )}
          </div>

          <div className="p-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                📢 Annons
              </span>
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                {ad.emoji} {ad.categoryName}
              </span>
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm">
                <HiLocationMarker className="w-4 h-4" />
                {ad.city}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{ad.companyName}</h1>

            {/* Contact Buttons */}
            <div className="flex flex-wrap gap-3">
              {ad.phone && (
                <a
                  href={`tel:${ad.phone}`}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  <HiPhone className="w-5 h-5" />
                  Ring
                </a>
              )}
              {ad.email && (
                <a
                  href={`mailto:${ad.email}`}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  <HiMail className="w-5 h-5" />
                  E-post
                </a>
              )}
              {ad.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(ad.address + ', ' + ad.city)}`}
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
              <p className="text-gray-600 leading-relaxed">{ad.description}</p>
            </section>

            {/* Services */}
            {ad.services && ad.services.length > 0 && (
              <section className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">💈 Tjänster & Priser</h2>
                <div className="space-y-4">
                  {ad.services.map((service, index) => (
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

            {/* Image Gallery */}
            {ad.images && ad.images.length > 1 && (
              <section className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📷 Bilder</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ad.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${ad.companyName} bild ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Location */}
            {ad.address && (
              <section className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📍 Hitta hit</h2>
                <div className="bg-gray-200 h-48 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-gray-500">Karta kommer här</span>
                </div>
                <p className="text-gray-600">{ad.address}, {ad.city}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(ad.address + ', ' + ad.city)}`}
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
                {ad.phone && (
                  <p className="text-gray-600">📞 {ad.phone}</p>
                )}
                {ad.email && (
                  <p className="text-gray-600">📧 {ad.email}</p>
                )}
                {ad.website && (
                  <p className="text-gray-600">🌐 {ad.website}</p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar - Call to Action */}
          <div className="lg:col-span-1">
            <div className="sticky top-36 bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Intresserad?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Kontakta {ad.companyName} direkt för mer information eller för att boka.
              </p>
              {ad.phone && (
                <a
                  href={`tel:${ad.phone}`}
                  className="block w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition text-center mb-3"
                >
                  <HiPhone className="inline w-5 h-5 mr-2" />
                  Ring nu
                </a>
              )}
              {ad.email && (
                <a
                  href={`mailto:${ad.email}`}
                  className="block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition text-center"
                >
                  <HiMail className="inline w-5 h-5 mr-2" />
                  Skicka e-post
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
