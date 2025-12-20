'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { HiPlus, HiTrash, HiCheck, HiExclamationCircle } from 'react-icons/hi'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

// ⚠️ TEMPORARY: Allow creating without login for testing
// Set to false to require authentication
const SKIP_AUTH = true

const categories = [
  { id: 'frisor', name: 'Frisör', emoji: '💇' },
  { id: 'massage', name: 'Massage', emoji: '💆' },
  { id: 'stadning', name: 'Städning', emoji: '🧹' },
  { id: 'bil', name: 'Bil & Motor', emoji: '🚗' },
  { id: 'halsa', name: 'Hälsa', emoji: '🏥' },
  { id: 'restaurang', name: 'Restaurang', emoji: '🍽️' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'utbildning', name: 'Utbildning', emoji: '📚' },
  { id: 'djur', name: 'Djur', emoji: '🐕' },
  { id: 'it', name: 'IT-tjänster', emoji: '💻' },
  { id: 'annat', name: 'Övrigt', emoji: '📋' },
]

const cities = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås',
  'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping',
  'Lund', 'Umeå', 'Gävle', 'Borås', 'Eskilstuna'
]

interface Service {
  id: string
  name: string
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
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [services, setServices] = useState<Service[]>([
    { id: '1', name: '', price: '', duration: '', description: '' }
  ])
  const [openingHours, setOpeningHours] = useState(defaultOpeningHours)

  const addService = () => {
    setServices([
      ...services,
      { id: Date.now().toString(), name: '', price: '', duration: '', description: '' }
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
    setIsSubmitting(true)
    setError('')
    
    try {
      // Prepare services data
      const validServices = services
        .filter(s => s.name && s.price)
        .map(s => ({
          name: s.name,
          price: parseInt(s.price) || 0,
          duration: parseInt(s.duration) || 30,
          description: s.description || '',
        }))

      // Create company document
      const companyData = {
        // Basic info
        name,
        category,
        categoryName: categories.find(c => c.id === category)?.name || category,
        emoji: categories.find(c => c.id === category)?.emoji || '📋',
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
        
        // Metadata - use authenticated user if available
        ownerId: user?.uid || 'anonymous',
        ownerName: user?.displayName || 'Anonymous',
        ownerEmail: user?.email || email || '',
        
        // Stats (initial)
        rating: 0,
        reviewCount: 0,
        views: 0,
        
        // Status
        status: 'active',
        premium: false,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Try to save to Firestore
      if (db) {
        try {
          const docRef = await addDoc(collection(db, 'companies'), companyData)
          setNewCompanyId(docRef.id)
          console.log('✅ Saved to Firestore:', docRef.id)
        } catch (firestoreError: any) {
          console.warn('⚠️ Firestore error, saving locally:', firestoreError.message)
          // Save to localStorage as backup
          const localId = 'local_' + Date.now()
          const savedCompanies = JSON.parse(localStorage.getItem('companies') || '[]')
          savedCompanies.push({ id: localId, ...companyData, createdAt: Date.now() })
          localStorage.setItem('companies', JSON.stringify(savedCompanies))
          setNewCompanyId(localId)
        }
      } else {
        // Save to localStorage
        const localId = 'local_' + Date.now()
        const savedCompanies = JSON.parse(localStorage.getItem('companies') || '[]')
        savedCompanies.push({ id: localId, ...companyData, createdAt: Date.now() })
        localStorage.setItem('companies', JSON.stringify(savedCompanies))
        setNewCompanyId(localId)
        console.log('💾 Saved locally:', localId)
      }
      
      setSubmitted(true)
      
    } catch (err: any) {
      console.error('Error creating company:', err)
      setError('Kunde inte skapa annonsen. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
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
            🎉 Annonsen skapad!
          </h1>
          <p className="text-gray-600 mb-2">
            Din företagsannons är nu skapad.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            ID: {newCompanyId}
          </p>
          <div className="space-y-3">
            {!newCompanyId.startsWith('local_') && (
              <Link
                href={`/foretag/${newCompanyId}`}
                className="block w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition"
              >
                Visa din sida
              </Link>
            )}
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
                setCity('')
                setAddress('')
                setDescription('')
                setPhone('')
                setEmail('')
                setWebsite('')
                setServices([{ id: '1', name: '', price: '', duration: '', description: '' }])
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
          {SKIP_AUTH && (
            <p className="text-xs text-orange-600 mt-2 bg-orange-50 inline-block px-3 py-1 rounded-full">
              ⚠️ Testläge: Inget login krävs
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s === step
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
                  onChange={(e) => setCategory(e.target.value)}
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
