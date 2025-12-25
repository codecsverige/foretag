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
  HiOutlineStar, HiCheck, HiX, HiOutlinePause, HiOutlinePlay, HiOutlineMail
} from 'react-icons/hi'

interface Company {
  id: string; name: string; category: string; categoryName: string; city: string
  status: string; createdAt: any; viewCount?: number; bookingCount?: number
  images?: string[]; phone?: string; rating?: number
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

type TabType = 'overview' | 'companies' | 'bookings' | 'analytics' | 'subscription' | 'settings'

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Översikt', icon: HiOutlineChartBar },
  { id: 'companies', label: 'Mina företag', icon: HiOutlineOfficeBuilding },
  { id: 'bookings', label: 'Bokningar', icon: HiOutlineClipboardList },
  { id: 'analytics', label: 'Statistik', icon: HiOutlineTrendingUp },
  { id: 'subscription', label: 'Abonnemang', icon: HiOutlineCreditCard },
  { id: 'settings', label: 'Inställningar', icon: HiOutlineCog },
]

const PLANS = [
  { id: 'free', name: 'Gratis', price: 0, period: '', features: ['1 företag', 'Grundläggande statistik', 'E-postnotifieringar'], popular: false },
  { id: 'pro', name: 'Pro', price: 299, period: '/mån', features: ['5 företag', 'Avancerad statistik', 'SMS-notifieringar', 'Prioriterad support'], popular: true },
  { id: 'premium', name: 'Premium', price: 599, period: '/mån', features: ['Obegränsade företag', 'Full statistik', 'API-åtkomst', 'Dedikerad support', 'Prioriterad placering'], popular: false }
]

function AccountPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, logout } = useAuth()
  
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'overview')
  const [companies, setCompanies] = useState<Company[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all')

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab && tabs.some(t => t.id === tab)) setActiveTab(tab)
  }, [searchParams])

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

  const filtered = useMemo(() => bookingFilter === 'all' ? bookings : bookings.filter(b => b.status === bookingFilter), [bookings, bookingFilter])

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

  const statusConfig = (s: string) => {
    const map: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
      pending: { label: 'Väntar', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: HiOutlineClock },
      confirmed: { label: 'Bekräftad', bg: 'bg-green-100', text: 'text-green-700', icon: HiCheck },
      completed: { label: 'Slutförd', bg: 'bg-blue-100', text: 'text-blue-700', icon: HiOutlineCheckCircle },
      cancelled: { label: 'Avbokad', bg: 'bg-red-100', text: 'text-red-700', icon: HiX },
    }
    return map[s] || { label: s, bg: 'bg-gray-100', text: 'text-gray-700', icon: HiOutlineClock }
  }

  const plan = userData?.plan || 'free'
  const since = userData?.createdAt?.toDate?.() || user?.metadata?.creationTime
  const memberSince = since ? new Date(since).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' }) : null

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:bg-white lg:border-r">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            {user.photoURL ? <Image src={user.photoURL} alt="" width={48} height={48} className="w-12 h-12 rounded-xl" /> : 
              <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-white font-bold">{user.displayName?.charAt(0) || '?'}</div>}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user.displayName || 'Företagare'}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${plan === 'premium' ? 'bg-purple-100 text-purple-700' : plan === 'pro' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-600'}`}>
                {PLANS.find(p => p.id === plan)?.name}
              </span>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${activeTab === t.id ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <t.icon className="w-5 h-5" />
              <span className="font-medium flex-1 text-left">{t.label}</span>
              {t.id === 'bookings' && stats.pending > 0 && <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === t.id ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>{stats.pending}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t">
          <div className="bg-brand/5 rounded-xl p-3 mb-3">
            <p className="text-xs text-gray-500 mb-2">Denna månad</p>
            <div className="flex justify-between text-sm">
              <div><p className="font-bold text-brand">{stats.total}</p><p className="text-xs text-gray-500">Bokningar</p></div>
              <div className="text-right"><p className="font-bold text-green-600">{stats.revenue} kr</p><p className="text-xs text-gray-500">Intäkter</p></div>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition">
            <HiOutlineLogout className="w-5 h-5" /><span className="font-medium">Logga ut</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-64">
        {/* Mobile nav */}
        <div className="lg:hidden sticky top-16 z-40 bg-white border-b px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${activeTab === t.id ? 'bg-brand text-white' : 'bg-gray-100'}`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
          
          {/* OVERVIEW */}
          {activeTab === 'overview' && <>
            <h1 className="text-2xl font-bold">Välkommen, {user.displayName?.split(' ')[0] || 'Företagare'}!</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: HiOutlineOfficeBuilding, value: stats.companies, label: 'Företag', color: 'text-brand' },
                { icon: HiOutlineEye, value: stats.views, label: 'Visningar', color: 'text-purple-500' },
                { icon: HiOutlineClipboardList, value: stats.total, label: 'Bokningar', color: 'text-green-500', badge: stats.pending },
                { icon: HiOutlineCreditCard, value: `${stats.revenue} kr`, label: 'Intäkter', color: 'text-emerald-600', gradient: true },
              ].map((s, i) => (
                <div key={i} className={`${s.gradient ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-white border'} rounded-2xl p-4`}>
                  <s.icon className={`w-7 h-7 mb-2 ${s.gradient ? 'text-white/80' : s.color}`} />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className={`text-sm ${s.gradient ? 'text-white/80' : 'text-gray-500'}`}>{s.label}</p>
                  {s.badge && s.badge > 0 && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{s.badge} nya</span>}
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border p-5">
              <h3 className="font-semibold mb-4">Snabbåtgärder</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Link href="/skapa" className="flex flex-col items-center gap-2 p-4 bg-brand text-white rounded-xl"><HiOutlinePlus className="w-6 h-6" /><span className="text-sm font-medium">Ny annons</span></Link>
                <button onClick={() => setActiveTab('bookings')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 relative">
                  <HiOutlineClipboardList className="w-6 h-6 text-gray-600" /><span className="text-sm">Bokningar</span>
                  {stats.pending > 0 && <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{stats.pending}</span>}
                </button>
                <button onClick={() => setActiveTab('analytics')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100"><HiOutlineTrendingUp className="w-6 h-6 text-gray-600" /><span className="text-sm">Statistik</span></button>
                <button onClick={() => setActiveTab('settings')} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100"><HiOutlineCog className="w-6 h-6 text-gray-600" /><span className="text-sm">Inställningar</span></button>
              </div>
            </div>
            {bookings.length > 0 && <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-4 border-b flex justify-between"><h3 className="font-semibold">Senaste bokningar</h3><button onClick={() => setActiveTab('bookings')} className="text-brand text-sm">Visa alla →</button></div>
              {bookings.slice(0, 4).map(b => { const s = statusConfig(b.status); return (
                <div key={b.id} className="p-4 border-b last:border-0 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.bg}`}><s.icon className={`w-5 h-5 ${s.text}`} /></div>
                  <div className="flex-1"><p className="font-medium">{b.customerName || 'Kund'}</p><p className="text-sm text-gray-500">{b.service || b.serviceName}</p></div>
                  <div className="text-right text-sm"><p>{b.date}</p><p className="text-gray-500">{b.time}</p></div>
                </div>
              )})}
            </div>}
          </>}

          {/* COMPANIES */}
          {activeTab === 'companies' && <>
            <div className="flex justify-between items-center">
              <div><h1 className="text-2xl font-bold">Mina företag</h1><p className="text-gray-500">{companies.length} annonser</p></div>
              <Link href="/skapa" className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl"><HiOutlinePlus className="w-5 h-5" />Ny annons</Link>
            </div>
            {companies.length > 0 ? companies.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border overflow-hidden">
                <div className="p-5 flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">{c.images?.[0] ? <Image src={c.images[0]} alt="" width={64} height={64} className="w-full h-full object-cover rounded-xl" /> : <HiOutlineOfficeBuilding className="w-8 h-8 text-gray-400" />}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><h3 className="font-semibold">{c.name}</h3><span className={`px-2 py-0.5 text-xs rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{c.status === 'active' ? 'Aktiv' : 'Utkast'}</span></div>
                    <p className="text-sm text-gray-500">{c.categoryName} • {c.city}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><HiOutlineEye className="w-4 h-4" />{c.viewCount || 0}</span>
                      <span className="flex items-center gap-1"><HiOutlineCalendar className="w-4 h-4" />{c.bookingCount || 0}</span>
                      {c.rating && <span className="flex items-center gap-1"><HiOutlineStar className="w-4 h-4 text-yellow-500" />{c.rating.toFixed(1)}</span>}
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3 bg-gray-50 border-t flex gap-2">
                  <Link href={`/foretag/${c.id}`} className="px-3 py-1.5 text-sm text-gray-600 hover:text-brand rounded-lg hover:bg-white"><HiOutlineEye className="w-4 h-4 inline mr-1" />Visa</Link>
                  <Link href={`/redigera/${c.id}`} className="px-3 py-1.5 text-sm text-gray-600 hover:text-brand rounded-lg hover:bg-white"><HiOutlinePencil className="w-4 h-4 inline mr-1" />Redigera</Link>
                  <button onClick={() => handleToggle(c.id, c.status)} disabled={updating === c.id} className={`px-3 py-1.5 text-sm rounded-lg ${c.status === 'active' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                    {updating === c.id ? '...' : c.status === 'active' ? <><HiOutlinePause className="w-4 h-4 inline mr-1" />Pausa</> : <><HiOutlinePlay className="w-4 h-4 inline mr-1" />Publicera</>}
                  </button>
                  <div className="flex-1" />
                  {deleteConfirm === c.id ? <><button onClick={() => handleDelete(c.id)} className="p-1.5 bg-red-600 text-white rounded-lg"><HiCheck className="w-4 h-4" /></button><button onClick={() => setDeleteConfirm(null)} className="p-1.5 bg-gray-200 rounded-lg"><HiX className="w-4 h-4" /></button></> : <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 text-gray-400 hover:text-red-500"><HiOutlineTrash className="w-5 h-5" /></button>}
                </div>
              </div>
            )) : <div className="bg-white rounded-2xl border p-12 text-center"><HiOutlineOfficeBuilding className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">Skapa ditt första företag</h3><Link href="/skapa" className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-semibold"><HiOutlinePlus className="w-5 h-5" />Skapa annons</Link></div>}
          </>}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && <>
            <h1 className="text-2xl font-bold">Bokningar</h1>
            <div className="grid grid-cols-4 gap-3">
              {(['all', 'pending', 'confirmed', 'completed'] as const).map(f => (
                <button key={f} onClick={() => setBookingFilter(f)} className={`p-3 rounded-xl text-center ${bookingFilter === f ? (f === 'pending' ? 'bg-yellow-500 text-white' : f === 'confirmed' ? 'bg-green-500 text-white' : f === 'completed' ? 'bg-blue-500 text-white' : 'bg-brand text-white') : 'bg-white border'}`}>
                  <p className="text-xl font-bold">{f === 'all' ? stats.total : stats[f]}</p>
                  <p className="text-xs">{f === 'all' ? 'Alla' : f === 'pending' ? 'Väntar' : f === 'confirmed' ? 'Bekräftade' : 'Slutförda'}</p>
                </button>
              ))}
            </div>
            {filtered.length > 0 ? filtered.map(b => { const s = statusConfig(b.status); return (
              <div key={b.id} className="bg-white rounded-2xl border overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} flex-shrink-0`}>
                    <s.icon className={`w-6 h-6 ${s.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold truncate">{b.customerName || 'Kund'}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{b.service || b.serviceName}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                          <span className="whitespace-nowrap"><HiOutlineCalendar className="w-4 h-4 inline mr-1" />{b.date}</span>
                          <span className="whitespace-nowrap"><HiOutlineClock className="w-4 h-4 inline mr-1" />{b.time}</span>
                          {b.customerPhone && (
                            <a href={`tel:${b.customerPhone}`} className="text-brand whitespace-nowrap">
                              <HiOutlinePhone className="w-4 h-4 inline mr-1" />{b.customerPhone}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col sm:items-end gap-2 sm:gap-1">
                        {b.servicePrice ? (
                          <p className="text-lg font-bold text-brand whitespace-nowrap">{b.servicePrice} kr</p>
                        ) : (
                          <p className="text-sm text-gray-500 whitespace-nowrap">—</p>
                        )}
                        <Link href={`/foretag/${b.companyId}`} className="text-sm text-brand hover:underline whitespace-nowrap">
                          Visa annons →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {b.status === 'pending' && (
                  <div className="px-4 sm:px-5 py-3 bg-yellow-50 border-t flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button onClick={() => handleBooking(b.id, 'confirmed')} disabled={updating === b.id} className="flex-1 py-2 bg-green-500 text-white rounded-xl font-medium">
                      <HiCheck className="w-5 h-5 inline mr-1" />Bekräfta
                    </button>
                    <button onClick={() => handleBooking(b.id, 'cancelled')} disabled={updating === b.id} className="flex-1 py-2 border border-red-200 text-red-600 rounded-xl font-medium bg-white">
                      <HiX className="w-5 h-5 inline mr-1" />Avböj
                    </button>
                  </div>
                )}
                {b.status === 'confirmed' && (
                  <div className="px-4 sm:px-5 py-3 bg-green-50 border-t">
                    <button onClick={() => handleBooking(b.id, 'completed')} disabled={updating === b.id} className="w-full py-2 bg-blue-500 text-white rounded-xl font-medium">
                      <HiOutlineCheckCircle className="w-5 h-5 inline mr-1" />Markera slutförd
                    </button>
                  </div>
                )}
              </div>
            )}) : <div className="bg-white rounded-2xl border p-12 text-center"><HiOutlineClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Inga bokningar</p></div>}
          </>}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && <>
            <h1 className="text-2xl font-bold">Statistik</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border"><p className="text-sm text-gray-500">Visningar</p><p className="text-3xl font-bold">{stats.views}</p></div>
              <div className="bg-white rounded-xl p-4 border"><p className="text-sm text-gray-500">Konvertering</p><p className="text-3xl font-bold">{stats.views ? ((stats.total / stats.views) * 100).toFixed(1) : 0}%</p></div>
              <div className="bg-white rounded-xl p-4 border"><p className="text-sm text-gray-500">Snittorder</p><p className="text-3xl font-bold">{stats.completed ? Math.round(stats.revenue / stats.completed) : 0} kr</p></div>
              <div className="bg-white rounded-xl p-4 border"><p className="text-sm text-gray-500">Betyg</p><p className="text-3xl font-bold flex items-center gap-1">{(companies.reduce((s, c) => s + (c.rating || 0), 0) / (companies.length || 1)).toFixed(1)}<HiOutlineStar className="w-6 h-6 text-yellow-500" /></p></div>
            </div>
            <div className="bg-white rounded-xl p-5 border"><h3 className="font-semibold mb-4">Bokningar per vecka</h3><div className="h-48 flex items-end justify-around">{[30, 50, 40, 70, 60, 80, 55].map((h, i) => <div key={i} className="flex flex-col items-center gap-2"><div className="w-8 bg-brand rounded-t" style={{ height: `${h}%` }} /><span className="text-xs text-gray-500">V{i + 1}</span></div>)}</div></div>
          </>}

          {/* SUBSCRIPTION */}
          {activeTab === 'subscription' && <>
            <h1 className="text-2xl font-bold">Abonnemang</h1>
            <div className="bg-gradient-to-r from-brand to-brand-dark rounded-2xl p-5 text-white flex justify-between items-center">
              <div><p className="text-white/80 text-sm">Nuvarande plan</p><p className="text-2xl font-bold">{PLANS.find(p => p.id === plan)?.name}</p></div>
              <HiOutlineCreditCard className="w-12 h-12 text-white/50" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.map(p => (
                <div key={p.id} className={`bg-white rounded-2xl border-2 p-5 ${p.id === plan ? 'border-brand' : 'border-gray-200'} ${p.popular ? 'ring-2 ring-brand ring-offset-2' : ''} relative`}>
                  {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-xs px-3 py-1 rounded-full">Populärast</span>}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="mt-2"><span className="text-3xl font-bold">{p.price}</span>{p.price > 0 && <span className="text-gray-500"> kr{p.period}</span>}</p>
                  <ul className="mt-4 space-y-2">{p.features.map((f, i) => <li key={i} className="flex items-center gap-2 text-sm"><HiCheck className="w-4 h-4 text-green-500" />{f}</li>)}</ul>
                  <button disabled={p.id === plan} className={`w-full mt-4 py-2.5 rounded-xl font-medium ${p.id === plan ? 'bg-gray-100 text-gray-400' : p.popular ? 'bg-brand text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{p.id === plan ? 'Nuvarande' : 'Uppgradera'}</button>
                </div>
              ))}
            </div>
          </>}

          {/* SETTINGS */}
          {activeTab === 'settings' && <>
            <h1 className="text-2xl font-bold">Inställningar</h1>
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2"><HiOutlineUser className="w-5 h-5 text-brand" /><h3 className="font-semibold">Profil</h3></div>
              <div className="p-5 flex gap-5">
                {user.photoURL ? <Image src={user.photoURL} alt="" width={64} height={64} className="w-16 h-16 rounded-xl" /> : <div className="w-16 h-16 rounded-xl bg-brand flex items-center justify-center text-white text-xl font-bold">{user.displayName?.charAt(0) || '?'}</div>}
                <div className="space-y-2">
                  <div><p className="text-xs text-gray-500">Namn</p><p className="font-medium">{user.displayName || '-'}</p></div>
                  <div><p className="text-xs text-gray-500">E-post</p><p className="font-medium">{user.email}</p></div>
                  {memberSince && <div><p className="text-xs text-gray-500">Medlem sedan</p><p className="font-medium">{memberSince}</p></div>}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2"><HiOutlineBell className="w-5 h-5 text-brand" /><h3 className="font-semibold">Notifieringar</h3></div>
              <div className="p-5 space-y-4">
                {[{ label: 'E-post vid bokningar', on: true }, { label: 'SMS vid bokningar', on: false, pro: true }].map((n, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <p className="font-medium">{n.label} {n.pro && <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full ml-2">Pro</span>}</p>
                    <div className={`w-10 h-5 rounded-full ${n.on ? 'bg-brand' : 'bg-gray-200'} relative`}><span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition ${n.on ? 'translate-x-5' : ''}`} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-100 p-5 flex items-center justify-between">
              <div><p className="font-medium text-red-700">Logga ut</p><p className="text-sm text-red-600">Avsluta sessionen</p></div>
              <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium"><HiOutlineLogout className="w-5 h-5 inline mr-1" />Logga ut</button>
            </div>
          </>}
        </div>
      </main>
    </div>
  )
}

export default function AccountPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>}><AccountPageContent /></Suspense>
}
