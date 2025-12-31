'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import LiveEditor from '@/components/editor/LiveEditor'
import { HiArrowLeft, HiLockClosed } from 'react-icons/hi'
import Link from 'next/link'

type CompanyDoc = {
  ownerId?: string
  [key: string]: unknown
}

export default function EditCompanyPage() {
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const id = params?.id as string

  useEffect(() => {
    async function loadCompany() {
      if (!id || !db || authLoading) return

      try {
        const docRef = doc(db, 'companies', id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          setError('Företaget hittades inte')
          setLoading(false)
          return
        }

        const raw = docSnap.data() as CompanyDoc
        const data = { id: docSnap.id, ...raw } as CompanyDoc & { id: string }
        
        // Check if user is owner
        if (!user || data.ownerId !== user.uid) {
          setError('Du har inte behörighet att redigera detta företag')
          setLoading(false)
          return
        }

        setCompany(data)
        setLoading(false)
      } catch (err) {
        console.error('Error loading company:', err)
        setError('Kunde inte ladda företaget')
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadCompany()
    }
  }, [id, user, authLoading])

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar redigerare...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiLockClosed className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Åtkomst nekad</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/konto"
            className="inline-flex items-center gap-2 text-brand hover:text-brand-dark font-medium"
          >
            <HiArrowLeft className="w-4 h-4" />
            Tillbaka till instrumentpanelen
          </Link>
        </div>
      </div>
    )
  }

  if (!company) return null

  return <LiveEditor company={company} onUpdate={setCompany} />
}
