'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { HiPlus, HiTrash, HiCheck, HiExclamationCircle, HiClipboard } from 'react-icons/hi'
import Link from 'next/link'
import { buildShareUrl, copyToClipboard } from '@/lib/utils'

// ⚠️ TEMPORARY: Allow creating without login
// Set to false when Firebase Auth is configured
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

export default function CreatePage() {
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [newCompanyId, setNewCompanyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)

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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    
    try {
      // Validate: at least one service with name and price
      const hasValidService = services.some(s => s.name && s.price)
      if (!hasValidService) {
        setError('Du måste lägga till minst en tjänst med namn och pris.')
        setIsSubmitting(false)
        return
      }

      // Prepare services data - duration is optional
      const validServices = services
        .filter(s => s.name && s.price)
        .map(s => {
          const serviceData: {
            name: string
            price: number
            description: string
            duration?: number
          } = {
            name: s.name,
            price: parseInt(s.price) || 0,
            description: s.description || '',
          }
          // Only include duration if provided
          if (s.duration) {
            serviceData.duration = parseInt(s.duration) || 30
          }
          return serviceData
        })

      // Create company document
      const companyData = {
        // Basic info
        name,
        category,
        categoryName: categories.find(c => c.id === category)?.name || category,
        emoji: categories.find(c => c.id === category)?.emoji || '📋',
        city,
        address: address || '',
        description,
        
        // Contact
        phone,
        email: email || '',
        website: website || '',
        
        // Services
        services: validServices,
        
        // Metadata - temporary anonymous
        ownerId: 'anonymous',
        ownerName: 'Anonymous',
        ownerEmail: email || '',
        
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
    const shareUrl = buildShareUrl(newCompanyId)
    
    const handleCopyLink = async () => {
      try {
        await copyToClipboard(shareUrl)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiCheck className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🎉 Annonsen publicerad!
          </h1>
          <p className="text-gray-600 mb-6">
            Din företagsannons är nu synlig för alla. Dela länken för att nå fler kunder!
          </p>
          <div className="space-y-3">
            {!newCompanyId.startsWith('local_') && (
              <>
                <Link
                  href={`/foretag/${newCompanyId}`}
                  className="block w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition"
                >
                  Visa din sida
                </Link>
                <button
                  onClick={handleCopyLink}
                  className="w-full bg-blue-50 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                >
                  <HiClipboard className="w-5 h-5" />
                  {copySuccess ? '✓ Länk kopierad!' : 'Kopiera delningslänk'}
                </button>
              </>
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
                setCopySuccess(false)
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

        {/* Step Labels */}
        <div className="flex justify-center gap-8 mb-8 text-sm">
          <div className={`text-center ${step === 1 ? 'text-brand font-semibold' : 'text-gray-500'}`}>
            Grundinfo
          </div>
          <div className={`text-center ${step === 2 ? 'text-brand font-semibold' : 'text-gray-500'}`}>
            Tjänster
          </div>
          <div className={`text-center ${step === 3 ? 'text-brand font-semibold' : 'text-gray-500'}`}>
            Kontakt
          </div>
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
                    Adress (valfritt)
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
                  placeholder="Berätta om ditt företag och vad som gör er unika..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tips: Beskriv era tjänster, er expertis och varför kunder ska välja er.
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!name || !category || !city || !description}
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
              <p className="text-gray-600 text-sm">
                Lägg till minst en tjänst. Ange tid om det är en tidsbokad tjänst (t.ex. frisör, massage). 
                Lämna tid tom för tjänster som utförs på plats (t.ex. städning, bilservice).
              </p>

              {services.map((service, index) => (
                <div key={service.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Tjänst {index + 1}</span>
                    {services.length > 1 && (
                      <button
                        onClick={() => removeService(service.id)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => updateService(service.id, 'name', e.target.value)}
                      placeholder="Namn på tjänsten *"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        value={service.price}
                        onChange={(e) => updateService(service.id, 'price', e.target.value)}
                        placeholder="Pris (SEK) *"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={service.duration}
                        onChange={(e) => updateService(service.id, 'duration', e.target.value)}
                        placeholder="Tid (min, valfritt)"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      value={service.description}
                      onChange={(e) => updateService(service.id, 'description', e.target.value)}
                      placeholder="Kort beskrivning (valfritt)"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                    />
                  </div>
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
                  onClick={() => {
                    const hasValidService = services.some(s => s.name && s.price)
                    if (!hasValidService) {
                      setError('Lägg till minst en tjänst med namn och pris.')
                    } else {
                      setError('')
                      setStep(3)
                    }
                  }}
                  className="flex-1 bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition"
                >
                  Nästa: Kontakt →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Publish */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">📞 Kontaktuppgifter</h2>
              <p className="text-gray-600 text-sm">
                Lägg till minst en kontaktväg så att kunder kan nå er.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08-123 45 67 eller 070-123 45 67"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Obligatoriskt för att kunder ska kunna boka</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-post (valfritt)
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
                  Hemsida (valfritt)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.example.se"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Sammanfattning</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Företag: {name}</li>
                  <li>✓ Kategori: {categories.find(c => c.id === category)?.name}</li>
                  <li>✓ Stad: {city}</li>
                  <li>✓ Tjänster: {services.filter(s => s.name && s.price).length} st</li>
                </ul>
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
                  disabled={isSubmitting || !phone}
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
