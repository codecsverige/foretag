'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { serverTimestamp, doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getAuth } from 'firebase/auth'
import { useAuth } from '@/context/AuthContext'
import { HiExclamationCircle, HiCheckCircle } from 'react-icons/hi'

/**
 * New Ad Creation Page
 * Creates ads in Firestore with status='active' so they appear immediately
 * on home page, search page, and company page (if companyId is set)
 */

async function createAdInFirestore(payload: any) {
  if (!db) throw new Error('Firestore not initialized')
  
  const auth = getAuth()
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')

  // Create a new doc id up front so we can use it in the UI immediately
  const ref = doc(collection(db, 'ads'))
  const now = serverTimestamp()

  const ad = {
    ...payload,
    id: ref.id,
    ownerId: uid,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }

  await setDoc(ref, ad, { merge: false })
  return ref.id
}

// Fetch user's companies
async function fetchUserCompanies(uid: string) {
  if (!db) return []
  
  try {
    const q = query(
      collection(db, 'companies'),
      where('ownerId', '==', uid)
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (error) {
    console.error('Error fetching companies:', error)
    return []
  }
}

export default function NewAdPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  
  const [companies, setCompanies] = useState<any[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Load user's companies when authenticated
  useEffect(() => {
    if (user?.uid) {
      setLoadingCompanies(true)
      fetchUserCompanies(user.uid)
        .then(setCompanies)
        .finally(() => setLoadingCompanies(false))
    }
  }, [user?.uid])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Check authentication
    if (!user) {
      setError('Du måste vara inloggad för att skapa en annons.')
      return
    }

    // Validate required fields
    if (!title.trim()) {
      setError('Titel är obligatorisk')
      return
    }
    
    if (!description.trim()) {
      setError('Beskrivning är obligatorisk')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Map from form values to Firestore document shape
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        companyId: companyId || null,
        location: location || null,
        price: price || null,
        contactEmail: contactEmail || user.email || null,
      }

      // Create ad in Firestore
      const adId = await createAdInFirestore(payload)

      // Show success message
      setSuccess(true)
      
      // Navigate to home page after 1.5 seconds
      setTimeout(() => {
        router.push('/')
      }, 1500)
      
    } catch (err: any) {
      console.error('Error creating ad:', err)
      
      if (err.message === 'Not authenticated') {
        setError('Du är inte inloggad. Vänligen logga in för att fortsätta.')
      } else {
        setError('Ett fel uppstod vid skapande av annons. Försök igen.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    )
  }

  // Show auth prompt if not logged in
  if (!user) {
    return (
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <HiExclamationCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                Inloggning krävs
              </h2>
              <p className="text-yellow-800 mb-4">
                Du måste vara inloggad för att skapa en annons.
              </p>
              <Link
                href={`/login?redirect=${encodeURIComponent('/annonser/ny')}`}
                className="inline-block bg-brand hover:bg-brand-dark text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Logga in
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Skapa ny annons</h1>
        <p className="text-gray-600 mt-2">
          Fyll i formuläret för att skapa en ny annons
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
          <HiCheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Annons skapad!</p>
            <p className="text-sm">Du omdirigeras till startsidan...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white rounded-lg border p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Titel <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="T.ex. Säljer begagnad kontorsstol"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Beskrivning <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskriv din annons..."
            rows={5}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Company Selection */}
        {loadingCompanies ? (
          <div className="text-sm text-gray-600">Laddar företag...</div>
        ) : companies.length > 0 ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              Företag (valfritt)
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none"
              disabled={isSubmitting}
            >
              <option value="">Välj företag (valfritt)</option>
              {companies.map((company: any) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Kategori
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="T.ex. Möbler, Elektronik, Tjänster"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Plats
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="T.ex. Stockholm, Göteborg"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Pris (SEK)
          </label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="T.ex. 500"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Kontakt e-post
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={user?.email || 'din@email.se'}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || success}
            className="flex-1 bg-brand hover:bg-brand-dark text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Skapar annons...' : 'Skapa annons'}
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-200 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Avbryt
          </Link>
        </div>
      </form>
    </main>
  )
}
