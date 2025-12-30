'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { HiCalendar, HiClock, HiCog, HiArrowLeft } from 'react-icons/hi'
import Link from 'next/link'
import AvailabilityManager from '@/components/dashboard/AvailabilityManager'

interface Company {
  id: string
  name: string
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  excludedDates?: string[]
  excludedTimes?: Record<string, string[]>
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [excludedDates, setExcludedDates] = useState<string[]>([])
  const [excludedTimes, setExcludedTimes] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }

    async function fetchCompany() {
      if (!db || !user) return
      
      try {
        const companiesRef = collection(db, 'companies')
        const q = query(companiesRef, where('ownerId', '==', user.uid))
        const snap = await getDocs(q)
        
        if (!snap.empty) {
          const doc = snap.docs[0]
          const data = doc.data()
          const companyData: Company = {
            id: doc.id,
            name: data.name || '',
            openingHours: data.openingHours,
            excludedDates: data.excludedDates || [],
            excludedTimes: data.excludedTimes || {},
          }
          setCompany(companyData)
          setExcludedDates(companyData.excludedDates || [])
          setExcludedTimes(companyData.excludedTimes || {})
        }
      } catch (err) {
        console.error('Error fetching company:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [user, authLoading, router])

  const handleSave = async () => {
    if (!db || !company) return
    
    setSaving(true)
    try {
      const companyRef = doc(db, 'companies', company.id)
      await updateDoc(companyRef, {
        excludedDates,
        excludedTimes,
      })
      alert('Tillgänglighet sparad!')
    } catch (err) {
      console.error('Error saving availability:', err)
      alert('Kunde inte spara. Försök igen.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <HiCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Inget företag hittat</h1>
            <p className="text-gray-600 mb-6">
              Du har inte skapat något företag ännu.
            </p>
            <Link
              href="/skapa"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              Skapa företag
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/foretag/${company.id}`}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">{company.name}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-4">
            <nav className="flex gap-4">
              <button className="py-4 px-2 border-b-2 border-brand text-brand font-medium text-sm">
                <HiCalendar className="inline w-4 h-4 mr-1.5" />
                Tillgänglighet
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            <AvailabilityManager
              openingHours={company.openingHours}
              excludedDates={excludedDates}
              excludedTimes={excludedTimes}
              onUpdateExcludedDates={setExcludedDates}
              onUpdateExcludedTimes={setExcludedTimes}
            />

            {/* Save button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-xl font-semibold transition disabled:opacity-50"
              >
                {saving ? 'Sparar...' : 'Spara ändringar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
