'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, deleteDoc, orderBy } from 'firebase/firestore'
import { HiPlus, HiPencil, HiTrash, HiClock, HiPhone, HiStar, HiEye } from 'react-icons/hi'

interface Company {
  id: string
  name: string
  category: string
  categoryName: string
  city: string
  status: string
  createdAt: any
  viewCount?: number
  bookingCount?: number
}

interface Booking {
  id: string
  companyName: string
  serviceName: string
  date: string
  time: string
  status: string
  createdAt: any
}

export default function AccountPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'companies' | 'bookings'>('companies')
  const [companies, setCompanies] = useState<Company[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  
  let user: any = null
  let authLoading = true
  let logout = async () => {}
  
  try {
    const auth = useAuth()
    user = auth.user
    authLoading = auth.loading
    logout = auth.logout
  } catch (error) {
    authLoading = false
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/konto')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function fetchUserData() {
      if (!user || !db) {
        setLoading(false)
        return
      }
      
      setLoading(true)
      try {
        // Fetch user's companies
        const companiesQuery = query(
          collection(db, 'companies'),
          where('ownerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        const companiesSnap = await getDocs(companiesQuery)
        const companiesData = companiesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Company[]
        setCompanies(companiesData)

        // Fetch user's bookings
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('customerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        const bookingsSnap = await getDocs(bookingsQuery).catch(() => ({ docs: [] }))
        const bookingsData = bookingsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Booking[]
        setBookings(bookingsData)
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchUserData()
    }
  }, [user])

  const handleDeleteCompany = async (companyId: string) => {
    if (!db) return
    if (!confirm('Är du säker på att du vill radera denna annons?')) return
    
    try {
      await deleteDoc(doc(db, 'companies', companyId))
      setCompanies(companies.filter(c => c.id !== companyId))
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Kunde inte radera annonsen. Försök igen.')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.displayName || 'Användare'}
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Logga ut
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('companies')}
                className={`flex-1 px-6 py-4 text-center font-medium transition ${
                  activeTab === 'companies'
                    ? 'text-brand border-b-2 border-brand bg-brand/5'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏢 Mina företag ({companies.length})
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex-1 px-6 py-4 text-center font-medium transition ${
                  activeTab === 'bookings'
                    ? 'text-brand border-b-2 border-brand bg-brand/5'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📅 Mina bokningar ({bookings.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'companies' && (
              <>
                {/* Add Company Button */}
                <div className="mb-6">
                  <Link
                    href="/skapa"
                    className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-dark transition"
                  >
                    <HiPlus className="w-5 h-5" />
                    Skapa ny annons
                  </Link>
                </div>

                {/* Companies List */}
                {companies.length > 0 ? (
                  <div className="space-y-4">
                    {companies.map((company) => (
                      <div
                        key={company.id}
                        className="border rounded-xl p-4 hover:border-brand/30 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{company.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                company.status === 'active' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {company.status === 'active' ? 'Aktiv' : 'Granskas'}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm">
                              {company.categoryName} • {company.city}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <HiEye className="w-4 h-4" />
                                {company.viewCount || 0} visningar
                              </span>
                              <span className="flex items-center gap-1">
                                <HiClock className="w-4 h-4" />
                                {company.bookingCount || 0} bokningar
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/foretag/${company.id}`}
                              className="p-2 text-gray-600 hover:text-brand hover:bg-brand/10 rounded-lg transition"
                              title="Visa"
                            >
                              <HiEye className="w-5 h-5" />
                            </Link>
                            <Link
                              href={`/redigera/${company.id}`}
                              className="p-2 text-gray-600 hover:text-brand hover:bg-brand/10 rounded-lg transition"
                              title="Redigera"
                            >
                              <HiPencil className="w-5 h-5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteCompany(company.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Radera"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">🏢</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Du har inga företag ännu
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Skapa din första annons och nå tusentals kunder.
                    </p>
                    <Link
                      href="/skapa"
                      className="inline-flex items-center gap-2 text-brand hover:underline"
                    >
                      <HiPlus className="w-4 h-4" />
                      Skapa annons
                    </Link>
                  </div>
                )}
              </>
            )}

            {activeTab === 'bookings' && (
              <>
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{booking.companyName}</h3>
                            <p className="text-gray-600 text-sm">{booking.serviceName}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <HiClock className="w-4 h-4" />
                                {booking.date} kl {booking.time}
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status === 'confirmed' ? 'Bekräftad' : 
                             booking.status === 'pending' ? 'Väntar' : 'Avslutad'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📅</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Du har inga bokningar ännu
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Sök efter tjänster och boka din första tid.
                    </p>
                    <Link
                      href="/sok"
                      className="inline-flex items-center gap-2 text-brand hover:underline"
                    >
                      Hitta tjänster
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
