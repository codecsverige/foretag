import Link from 'next/link'
import { HiSearch, HiLocationMarker, HiArrowRight } from 'react-icons/hi'
import CompanyList from '@/components/company/CompanyList'
import CategoryGrid from '@/components/search/CategoryGrid'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// الفئات
const categories = [
  { id: 'frisor', name: 'Frisör', emoji: '💇', count: 0 },
  { id: 'massage', name: 'Massage', emoji: '💆', count: 0 },
  { id: 'stadning', name: 'Städning', emoji: '🧹', count: 0 },
  { id: 'bil', name: 'Bil & Motor', emoji: '🚗', count: 0 },
  { id: 'halsa', name: 'Hälsa', emoji: '🏥', count: 0 },
  { id: 'restaurang', name: 'Restaurang', emoji: '🍽️', count: 0 },
  { id: 'fitness', name: 'Fitness', emoji: '💪', count: 0 },
  { id: 'utbildning', name: 'Utbildning', emoji: '📚', count: 0 },
]

// Initialize Firebase for server-side
function getFirebaseDb() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  return getFirestore(app)
}

// Fetch companies from Firestore
async function getCompanies() {
  try {
    const db = getFirebaseDb()
    
    // Fetch premium companies
    const premiumQuery = query(
      collection(db, 'companies'),
      where('status', '==', 'active'),
      where('premium', '==', true),
      limit(6)
    )
    
    // Fetch latest companies
    const latestQuery = query(
      collection(db, 'companies'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(6)
    )
    
    const [premiumSnap, latestSnap] = await Promise.all([
      getDocs(premiumQuery).catch(() => ({ docs: [] })),
      getDocs(latestQuery).catch(() => ({ docs: [] }))
    ])
    
    const premiumCompanies = premiumSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      priceFrom: doc.data().services?.[0]?.price || 0,
    })) as any[]
    
    const latestCompanies = latestSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      priceFrom: doc.data().services?.[0]?.price || 0,
    })) as any[]
    
    return { premiumCompanies, latestCompanies }
  } catch (error) {
    console.error('Error fetching companies:', error)
    return { premiumCompanies: [], latestCompanies: [] }
  }
}

// Revalidate every 60 seconds to fetch fresh data
export const revalidate = 60

export default async function Home() {
  const { premiumCompanies, latestCompanies } = await getCompanies()
  
  // Show placeholder if no companies yet
  const showPlaceholder = premiumCompanies.length === 0 && latestCompanies.length === 0

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Hitta lokala tjänster
            <span className="block text-blue-200 text-2xl md:text-3xl font-normal mt-2">
              nära dig
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Upptäck företag i din stad. Boka frisör, massage, städning och mer – enkelt och snabbt.
          </p>

          {/* Search Box */}
          <form action="/sok" method="GET" className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  placeholder="Vad söker du? (t.ex. frisör, massage)"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="relative md:w-48">
                <HiLocationMarker className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select 
                  name="stad"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:outline-none appearance-none bg-white"
                >
                  <option value="">Alla städer</option>
                  <option value="stockholm">Stockholm</option>
                  <option value="goteborg">Göteborg</option>
                  <option value="malmo">Malmö</option>
                  <option value="uppsala">Uppsala</option>
                </select>
              </div>
              <button 
                type="submit"
                className="bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <HiSearch className="w-5 h-5" />
                Sök
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            📂 Populära kategorier
          </h2>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      {/* Featured Companies or Placeholder */}
      {showPlaceholder ? (
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="bg-blue-50 rounded-2xl p-8 md:p-12">
              <div className="text-6xl mb-4">🏢</div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Var först med att lista ditt företag!
              </h2>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                Inga företag har registrerats ännu. Bli den första och nå tusentals potentiella kunder.
              </p>
              <Link
                href="/skapa"
                className="inline-flex items-center gap-2 bg-brand text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-dark transition"
              >
                Skapa annons gratis
                <HiArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <CompanyList 
          initialPremiumCompanies={premiumCompanies}
          initialLatestCompanies={latestCompanies}
        />
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            🏢 Har du ett företag?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Skapa din gratis annons och nå tusentals nya kunder. Få bokningar direkt och SMS-påminnelser för att minska no-shows.
          </p>
          <Link
            href="/skapa"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 transition shadow-lg"
          >
            Skapa annons gratis
            <HiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand">Gratis</div>
              <div className="text-gray-600">Att lista företag</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand">SMS</div>
              <div className="text-gray-600">Påminnelser</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand">Enkelt</div>
              <div className="text-gray-600">Att boka</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-brand">Lokalt</div>
              <div className="text-gray-600">I din stad</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
