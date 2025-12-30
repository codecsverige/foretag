'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { db, storage } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { HiPlus, HiTrash, HiCheck, HiExclamationCircle, HiLockClosed } from 'react-icons/hi'
import Link from 'next/link'

const categories = [
  { 
    id: 'stadning', 
    name: 'Städning', 
    emoji: '🧼',
    subServices: [
      { id: 'hemstadning', name: 'Hemstädning' },
      { id: 'flyttstadning', name: 'Flyttstädning' },
      { id: 'kontorsstadning', name: 'Kontorsstädning' },
      { id: 'trappstadning', name: 'Trappstädning' },
      { id: 'byggstadning', name: 'Byggstädning' },
      { id: 'fonsterputs', name: 'Fönsterputs' },
    ]
  },
  { 
    id: 'flytt', 
    name: 'Flytt & Transport', 
    emoji: '🚚',
    subServices: [
      { id: 'flytthjalp', name: 'Flytthjälp' },
      { id: 'flytt-stadning', name: 'Flytt med städning' },
      { id: 'transport', name: 'Transport småjobb' },
      { id: 'bortforsling', name: 'Bortforsling' },
    ]
  },
  { 
    id: 'hantverk', 
    name: 'Hantverk & Småjobb', 
    emoji: '🔧',
    subServices: [
      { id: 'montering', name: 'Montering (möbler, TV)' },
      { id: 'snickeri', name: 'Snickeri småjobb' },
      { id: 'el', name: 'El småjobb' },
      { id: 'vvs', name: 'VVS småjobb' },
    ]
  },
  { 
    id: 'hem-fastighet', 
    name: 'Hem & Fastighet', 
    emoji: '🏠',
    subServices: [
      { id: 'grasklippning', name: 'Gräsklippning' },
      { id: 'snoskottning', name: 'Snöskottning' },
      { id: 'tradgardsarbete', name: 'Trädgårdsarbete' },
      { id: 'fastighetsskotsel', name: 'Fastighetsskötsel' },
    ]
  },
  { 
    id: 'annat', 
    name: 'Annat', 
    emoji: '📋',
    subServices: []
  },
]

const cities = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås',
  'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping',
  'Lund', 'Umeå', 'Gävle', 'Borås', 'Eskilstuna'
]

interface Service {
  id: string
  name: string
  category: string
  price: string
  duration: string
  description: string
}

const defaultOpeningHours = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '10:00', close: '16:00', closed: false },
  sunday: { open: '', close: '', closed: true },
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

export default function CreatePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [newCompanyId, setNewCompanyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Form data
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [customSubServices, setCustomSubServices] = useState<string[]>([''])
  const [selectedSubServices, setSelectedSubServices] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerBio, setOwnerBio] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [services, setServices] = useState<Service[]>([
    { id: '1', name: '', category: '', price: '', duration: '', description: '' }
  ])
  const [openingHours, setOpeningHours] = useState(defaultOpeningHours)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/skapa')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    setOwnerName((prev) => prev || user.displayName || user.email || '')
  }, [user])

  const addService = () => {
    setServices([
      ...services,
      { id: Date.now().toString(), name: '', category: '', price: '', duration: '', description: '' }
    ])
  }

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter(s => s.id !== id))
    }
  }

  const updateService = (id: string, field: keyof Service, value: string) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const updateHours = (day: string, field: string, value: string | boolean) => {
    setOpeningHours({
      ...openingHours,
      [day]: { ...openingHours[day as keyof typeof openingHours], [field]: value }
    })
  }

  const handleSubmit = async () => {
    // Security check - must be logged in
    if (!user) {
      setError('Du måste vara inloggad för att skapa en annons.')
      router.push('/login?redirect=/skapa')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      let uploadedImages: string[] = []
      if (imageFiles.length > 0) {
        if (!storage) {
          throw new Error('Bilduppladdning är inte tillgänglig just nu. Försök igen senare.')
        }
        const storageInstance = storage
        uploadedImages = await Promise.all(
          imageFiles.map(async (file, index) => {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
            const fileId = `${Date.now()}-${index}-${Math.random().toString(36).slice(2)}-${safeName}`
            const fileRef = storageRef(storageInstance, `companies/${user.uid}/${fileId}`)
            await uploadBytes(fileRef, file)
            return await getDownloadURL(fileRef)
          })
        )
      }

      // Prepare services data
      const validServices = services
        .filter(s => s.name && s.price)
        .map(s => ({
          name: s.name,
          category: (s.category || '').trim(),
          price: parseInt(s.price) || 0,
          duration: parseInt(s.duration) || 30,
          description: s.description || '',
        }))

      // Create company document
      const selectedCat = categories.find(c => c.id === category)
      const isCustomCategory = category === 'annat'
      
      // Handle sub-services based on category type
      const finalSubServices = isCustomCategory 
        ? customSubServices.filter(s => s.trim()) 
        : selectedSubServices
      const subServiceNames = isCustomCategory
        ? customSubServices.filter(s => s.trim())
        : selectedSubServices.map(id => selectedCat?.subServices.find(s => s.id === id)?.name || id)
      
      const companyData = {
        // Basic info
        name,
        category: isCustomCategory ? 'annat' : category,
        categoryName: isCustomCategory ? customCategoryName : (selectedCat?.name || category),
        customCategory: isCustomCategory,
        emoji: selectedCat?.emoji || '📋',
        subServices: finalSubServices,
        subServiceNames,
        city,
        address,
        description,

        // Contact
        phone,
        email: email || '',
        website,

        // Services & Hours
        services: validServices,
        openingHours,

        ...(uploadedImages.length > 0 ? { images: uploadedImages, image: uploadedImages[0] } : {}),

        // Metadata - linked to authenticated user
        ownerId: user?.uid || '',
        ownerName: ownerName || user?.displayName || user?.email || '',
        ownerBio: ownerBio || '',
        ownerEmail: user?.email || email || '',

        // Stats (initial - honest values)
        rating: 0,
        reviewCount: 0,
        views: 0,

        // Status - initially draft
        status: 'draft',
        published: false,
        premium: false,
        verified: false,

        // Content visibility settings
        settings: {
          showAbout: true,
          showReviews: true,
          showMap: true,
          showContact: true,
        },

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Save to Firestore (mandatory)
      if (!db) {
        throw new Error('Firebase är inte konfigurerat. Kontakta support.')
      }

      const docRef = await addDoc(collection(db, 'companies'), companyData)
      setNewCompanyId(docRef.id)
      setSubmitted(true)
      console.log('✅ Saved to Firestore:', docRef.id)

      setImageFiles([])

    } catch (err: any) {
      console.error('Error creating company:', err)
      setError(err.message || 'Kunde inte skapa annonsen. Kontrollera din anslutning och försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Laddar...</p>
        </div>
      </div>
    )
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiLockClosed className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Logga in för att fortsätta
          </h1>
          <p className="text-gray-600 mb-6">
            Du måste vara inloggad för att skapa en företagsannons.
          </p>
          <div className="space-y-3">
            <Link
              href="/login?redirect=/skapa"
              className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Logga in
            </Link>
            <Link
              href="/registrera"
              className="block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Skapa konto
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (submitted && newCompanyId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiCheck className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🎉 Annons skapad (Utkast)
          </h1>
          <p className="text-gray-600 mb-2">
            Din företagsannons är nu skapad som ett utkast. Du kan granska den och publicera när du är redo.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            ID: {newCompanyId}
          </p>
          <div className="space-y-3">
            <Link
              href={`/foretag/${newCompanyId}`}
              className="block w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition"
            >
              Granska och Publicera
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Tillbaka till startsidan
            </Link>
            <button
              onClick={() => {
                setSubmitted(false)
                setNewCompanyId(null)
                setStep(1)
                setName('')
                setCategory('')
                setCustomCategoryName('')
                setCustomSubServices([''])
                setSelectedSubServices([])
                setCity('')
                setAddress('')
                setDescription('')
                setPhone('')
                setEmail('')
                setWebsite('')
                setOwnerName(user?.displayName || user?.email || '')
                setOwnerBio('')
                setImageFiles([])
                setServices([{ id: '1', name: '', category: '', price: '', duration: '', description: '' }])
              }}
              className="block w-full text-brand hover:underline py-2"
            >
              Skapa en till annons
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏢 Skapa din företagsannons
          </h1>
          <p className="text-gray-600">
            Gratis! Nå tusentals nya kunder.
          </p>
          {user && (
            <p className="text-xs text-green-600 mt-2 bg-green-50 inline-block px-3 py-1 rounded-full">
              ✓ Inloggad som {user.displayName || user.email}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${s === step
                ? 'bg-brand text-white'
                : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
                }`}
            >
              {s < step ? <HiCheck className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">📋 Grundläggande information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Företagsnamn *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="t.ex. Salon Nora"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    setSelectedSubServices([])
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                >
                  <option value="">Välj kategori...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom category name for "Annat" */}
              {category === 'annat' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beskriv din kategori *
                  </label>
                  <input
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="t.ex. Trädgårdstjänster, Målning..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              )}

              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stad *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  >
                    <option value="">Välj stad...</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adress
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Gatuadress 123"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beskrivning *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Berätta om ditt företag..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal / Ansvarig
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="t.ex. Nora"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kort bio (valfritt)
                  </label>
                  <textarea
                    value={ownerBio}
                    onChange={(e) => setOwnerBio(e.target.value)}
                    rows={3}
                    placeholder="t.ex. Certifierad och erfaren..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bilder (max 5 bilder, valfritt)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Första bilden används som huvudbild. Max 5 MB per bild.
                </p>
                
                {/* Image previews */}
                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                    {imageFiles.map((file, idx) => (
                      <div key={idx} className="relative group aspect-square">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl border border-gray-200"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-brand text-white text-xs px-2 py-0.5 rounded-full">
                            Huvud
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = [...imageFiles]
                            newFiles.splice(idx, 1)
                            setImageFiles(newFiles)
                          }}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = [...imageFiles]
                              const temp = newFiles[idx]
                              newFiles[idx] = newFiles[idx - 1]
                              newFiles[idx - 1] = temp
                              setImageFiles(newFiles)
                            }}
                            className="absolute bottom-1 left-1 bg-gray-800/70 hover:bg-gray-800 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
                            title="Flytta uppåt"
                          >
                            ←
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {imageFiles.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand hover:bg-brand/5 transition">
                    <div className="flex flex-col items-center justify-center py-4">
                      <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">
                        <span className="text-brand font-medium">Ladda upp</span> eller dra bilder hit
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {imageFiles.length}/5 bilder • PNG, JPG, WEBP
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024) // 5MB max
                        const totalAllowed = 5 - imageFiles.length
                        const newFiles = [...imageFiles, ...validFiles.slice(0, totalAllowed)]
                        setImageFiles(newFiles.slice(0, 5))
                        if (files.some(f => f.size > 5 * 1024 * 1024)) {
                          alert('Vissa bilder var för stora (max 5 MB) och lades inte till.')
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
                
                {imageFiles.length >= 5 && (
                  <p className="text-sm text-orange-600 mt-2">
                    Max antal bilder uppnått (5). Ta bort en bild för att lägga till fler.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08-123 45 67"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-post
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@example.se"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hemsida
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="www.example.se"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!name || !category || !city || !description || !phone}
                className="w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Nästa: Tjänster →
              </button>
            </div>
          )}

          {/* Step 2: Services */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">💈 Tjänster & Priser</h2>
              <p className="text-gray-600 text-sm">Lägg till minst en tjänst som du erbjuder.</p>

              {services.map((service, index) => (
                <div key={service.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Tjänst {index + 1}</span>
                    {services.length > 1 && (
                      <button
                        onClick={() => removeService(service.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => updateService(service.id, 'name', e.target.value)}
                    placeholder="Namn på tjänsten"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                  />

                  <input
                    type="text"
                    value={service.category}
                    onChange={(e) => updateService(service.id, 'category', e.target.value)}
                    placeholder="Kategori (t.ex. Klippning, Massage)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={service.price}
                      onChange={(e) => updateService(service.id, 'price', e.target.value)}
                      placeholder="Pris (SEK)"
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                    />
                    <input
                      type="number"
                      value={service.duration}
                      onChange={(e) => updateService(service.id, 'duration', e.target.value)}
                      placeholder="Tid (min)"
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                    />
                  </div>

                  <input
                    type="text"
                    value={service.description}
                    onChange={(e) => updateService(service.id, 'description', e.target.value)}
                    placeholder="Kort beskrivning (valfritt)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                  />
                </div>
              ))}

              <button
                onClick={addService}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-brand hover:text-brand transition flex items-center justify-center gap-2"
              >
                <HiPlus className="w-5 h-5" />
                Lägg till tjänst
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  ← Tillbaka
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!services.some(s => s.name && s.price)}
                  className="flex-1 bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Nästa: Öppettider →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Opening Hours */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">🕐 Öppettider</h2>

              <div className="space-y-3">
                {Object.entries(openingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-24 font-medium text-gray-700">{dayNames[day]}</div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => updateHours(day, 'closed', !e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-gray-600">Öppet</span>
                    </label>
                    {!hours.closed && (
                      <>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateHours(day, 'open', e.target.value)}
                          className="px-3 py-1 border border-gray-200 rounded-lg text-sm"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateHours(day, 'close', e.target.value)}
                          className="px-3 py-1 border border-gray-200 rounded-lg text-sm"
                        />
                      </>
                    )}
                    {hours.closed && (
                      <span className="text-red-500 text-sm">Stängt</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  ← Tillbaka
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Publicerar...' : '🚀 Publicera annons'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
