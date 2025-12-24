'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore'
import { 
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineClock, HiOutlineEye,
  HiOutlineOfficeBuilding, HiOutlineCalendar, HiOutlineChartBar, HiOutlineCog,
  HiOutlineLogout, HiOutlineClipboardList, HiOutlineCheckCircle, HiOutlineExclamationCircle,
  HiOutlinePhone, HiOutlineCreditCard, HiOutlineBell, HiOutlineUser, HiOutlineTrendingUp,
  HiOutlineStar, HiCheck, HiX, HiOutlinePause, HiOutlinePlay, HiOutlineMail,
  HiOutlineExternalLink, HiOutlineLocationMarker
} from 'react-icons/hi'

interface Company {
  id: string; name: string; category: string; categoryName: string; city: string
  status: string; createdAt: any; viewCount?: number; bookingCount?: number
  images?: string[]; phone?: string; rating?: number; description?: string
}

interface Booking {
  id: string; companyId: string; companyName: string; customerName?: string
  customerPhone?: string; customerEmail?: string; service?: string; serviceName?: string
  servicePrice?: number; date: string; time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'; createdAt: any
}

interface UserData {
  displayName?: string; email?: string; photoURL?: string; createdAt?: any
  plan?: 'free' | 'pro' | 'premium'
}

function AccountPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, logout } = useAuth()
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?redirect=/konto')
  }, [user, authLoading, router])

  useEffect(() => {
    async function fetchData() {
      if (!user || !db) { setLoading(false); return }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid)).catch(() => null)
        if (userDoc?.exists()) setUserData(userDoc.data() as UserData)

        const companiesSnap = await getDocs(query(collection(db, 'companies'), where('ownerId', '==', user.uid)))
        const companiesData = companiesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Company[]
        companiesData.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
        setCompanies(companiesData)

        if (companiesData.length > 0) {
          const allBookings: Booking[] = []
          for (let i = 0; i < companiesData.length; i += 10) {
            const chunk = companiesData.slice(i, i + 10).map(c => c.id)
            const snap = await getDocs(query(collection(db, 'bookings'), where('companyId', 'in', chunk))).catch(() => ({ docs: [] }))
            snap.docs.forEach(d => allBookings.push({ id: d.id, ...d.data() } as Booking))
          }
          allBookings.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
          setBookings(allBookings)
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    if (user) fetchData()
  }, [user])

  const stats = useMemo(() => ({
    companies: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    views: companies.reduce((s, c) => s + (c.viewCount || 0), 0),
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.servicePrice || 0), 0),
  }), [companies, bookings])

  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending').slice(0, 5), [bookings])

  const handleDelete = async (id: string) => {
    if (!db) return
    await deleteDoc(doc(db, 'companies', id))
    setCompanies(companies.filter(c => c.id !== id))
    setDeleteConfirm(null)
  }

  const handleToggle = async (id: string, status: string) => {
    if (!db) return
    setUpdating(id)
    const newStatus = status === 'active' ? 'draft' : 'active'
    await updateDoc(doc(db, 'companies', id), { status: newStatus })
    setCompanies(companies.map(c => c.id === id ? { ...c, status: newStatus } : c))
    setUpdating(null)
  }

  const handleBooking = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    if (!db) return
    setUpdating(id)
    await updateDoc(doc(db, 'bookings', id), { status, updatedAt: new Date() })
    setBookings(bookings.map(b => b.id === id ? { ...b, status } : b))
    setUpdating(null)
  }

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Laddar din instrumentpanel...</p>
      </div>
    </div>
  )

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Välkommen, {user.displayName?.split(' ')[0] || 'Företagare'}! 👋
              </h1>
              <p className="text-gray-500 mt-1">Hantera dina företag och bokningar</p>
            </div>
            <Link 
              href="/skapa"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-600/25"
            >
              <HiOutlinePlus className="w-5 h-5" />
              Skapa ny annons
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <HiOutlineOfficeBuilding className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-500 text-sm">Företag</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.companies}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.active} aktiva</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <HiOutlineEye className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-500 text-sm">Visningar</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.views}</p>
            <p className="text-xs text-gray-400 mt-1">totalt</p>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-md transition-shadow relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <HiOutlineClipboardList className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-gray-500 text-sm">Bokningar</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            {stats.pending > 0 && (
              <span className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {stats.pending} nya
              </span>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <HiOutlineCreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-white/80 text-sm">Intäkter</span>
            </div>
            <p className="text-3xl font-bold">{stats.revenue} kr</p>
            <p className="text-xs text-white/60 mt-1">denna månad</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column - Companies (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* My Companies Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">📋 Mina företag</h2>
                  <p className="text-sm text-gray-500">{companies.length} {companies.length === 1 ? 'annons' : 'annonser'}</p>
                </div>
                <Link 
                  href="/skapa"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                  Ny annons
                </Link>
              </div>
              
              {companies.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {companies.map(company => (
                    <div key={company.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex gap-4">
                        {/* Company Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          {company.images?.[0] ? (
                            <img src={company.images[0]} alt={company.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <HiOutlineOfficeBuilding className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        
                        {/* Company Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-gray-900">{company.name}</h3>
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                  company.status === 'active' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {company.status === 'active' ? '✓ Aktiv' : 'Utkast'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {company.categoryName} • {company.city}
                              </p>
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <HiOutlineEye className="w-4 h-4" />
                              {company.viewCount || 0} visningar
                            </span>
                            <span className="flex items-center gap-1">
                              <HiOutlineCalendar className="w-4 h-4" />
                              {company.bookingCount || 0} bokningar
                            </span>
                            {company.rating && company.rating > 0 && (
                              <span className="flex items-center gap-1">
                                <HiOutlineStar className="w-4 h-4 text-amber-500" />
                                {company.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 mt-4">
                            <Link 
                              href={`/foretag/${company.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                            >
                              <HiOutlineExternalLink className="w-4 h-4" />
                              Visa
                            </Link>
                            <Link 
                              href={`/redigera/${company.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg transition-colors"
                            >
                              <HiOutlinePencil className="w-4 h-4" />
                              Redigera
                            </Link>
                            <button 
                              onClick={() => handleToggle(company.id, company.status)}
                              disabled={updating === company.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                company.status === 'active'
                                  ? 'bg-orange-50 hover:bg-orange-100 text-orange-600'
                                  : 'bg-green-50 hover:bg-green-100 text-green-600'
                              }`}
                            >
                              {updating === company.id ? '...' : company.status === 'active' ? (
                                <><HiOutlinePause className="w-4 h-4" />Pausa</>
                              ) : (
                                <><HiOutlinePlay className="w-4 h-4" />Publicera</>
                              )}
                            </button>
                            
                            {/* Delete */}
                            {deleteConfirm === company.id ? (
                              <div className="flex items-center gap-1 ml-auto">
                                <button 
                                  onClick={() => handleDelete(company.id)}
                                  className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                  <HiCheck className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirm(null)}
                                  className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                >
                                  <HiX className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setDeleteConfirm(company.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 ml-auto transition-colors"
                              >
                                <HiOutlineTrash className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HiOutlineOfficeBuilding className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Skapa ditt första företag</h3>
                  <p className="text-gray-500 mb-6">Börja ta emot bokningar idag!</p>
                  <Link 
                    href="/skapa"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    <HiOutlinePlus className="w-5 h-5" />
                    Skapa annons
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Bookings & Actions (1/3) */}
          <div className="space-y-6">
            
            {/* Pending Bookings */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">📅 Bokningar</h2>
                  {stats.pending > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      {stats.pending}
                    </span>
                  )}
                </div>
              </div>
              
              {pendingBookings.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {pendingBookings.map(booking => (
                    <div key={booking.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{booking.customerName || 'Kund'}</p>
                          <p className="text-sm text-gray-500">{booking.service || booking.serviceName}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span>{booking.date}</span>
                            <span>•</span>
                            <span>{booking.time}</span>
                          </div>
                        </div>
                        {booking.servicePrice && (
                          <span className="text-sm font-semibold text-gray-900">{booking.servicePrice} kr</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => handleBooking(booking.id, 'confirmed')}
                          disabled={updating === booking.id}
                          className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <HiCheck className="w-4 h-4" />
                          Bekräfta
                        </button>
                        <button 
                          onClick={() => handleBooking(booking.id, 'cancelled')}
                          disabled={updating === booking.id}
                          className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <HiX className="w-4 h-4" />
                          Avböj
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <HiOutlineCheckCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Inga väntande bokningar</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">⚡ Snabbåtgärder</h2>
              <div className="space-y-2">
                <Link 
                  href="/skapa"
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <HiOutlinePlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Ny annons</p>
                    <p className="text-xs text-gray-500">Skapa ett nytt företag</p>
                  </div>
                </Link>
                
                <Link 
                  href="/"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <HiOutlineEye className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Se hemsidan</p>
                    <p className="text-xs text-gray-500">Visa den publika sidan</p>
                  </div>
                </Link>
                
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <HiOutlineLogout className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-600">Logga ut</p>
                    <p className="text-xs text-gray-500">Avsluta sessionen</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-lg font-bold">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold">{user.displayName || 'Företagare'}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-1">Din plan</p>
                <p className="font-medium">Gratis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  )
}
