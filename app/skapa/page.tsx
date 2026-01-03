'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { db, storage } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { HiPlus, HiTrash, HiCheck, HiExclamationCircle, HiLockClosed, HiEye, HiSave } from 'react-icons/hi'

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

const allCities = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås',
  'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping',
  'Lund', 'Umeå', 'Gävle', 'Borås', 'Eskilstuna', 'Sundsvall',
  'Karlstad', 'Växjö', 'Halmstad', 'Trollhättan', 'Kalmar',
  'Kristianstad', 'Skellefteå', 'Uddevalla', 'Falun', 'Nyköping',
  'Varberg', 'Skövde', 'Östersund', 'Borlänge', 'Visby'
]

const paymentMethods = [
  { id: 'swish', name: 'Swish', icon: '📱' },
  { id: 'kort', name: 'Kort', icon: '💳' },
  { id: 'faktura', name: 'Faktura', icon: '📄' },
  { id: 'kontant', name: 'Kontant', icon: '💵' },
]

interface Service {
  id: string
  name: string
  category: string
  priceType: 'fixed' | 'range' | 'quote'
  price: string
  priceMax: string
  duration: string
  durationFlexible: boolean
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

const DRAFT_KEY = 'bokanara_draft_company'

export default function CreatePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [newCompanyId, setNewCompanyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Step 1: Basic info
  const [name, setName] = useState('')
  const [orgNumber, setOrgNumber] = useState('')
  const [category, setCategory] = useState('')
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [customSubServices, setCustomSubServices] = useState<string[]>([''])
  const [selectedSubServices, setSelectedSubServices] = useState<string[]>([])
  const [serviceCities, setServiceCities] = useState<string[]>([])
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [facebook, setFacebook] = useState('')
  const [instagram, setInstagram] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerBio, setOwnerBio] = useState('')
  
  // New fields
  const [rutAvdrag, setRutAvdrag] = useState(false)
  const [rotAvdrag, setRotAvdrag] = useState(false)
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])
  const [hasInsurance, setHasInsurance] = useState(false)
  const [insuranceInfo, setInsuranceInfo] = useState('')
  const [guarantee, setGuarantee] = useState('')
  
  // Images
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  
  // Services
  const [services, setServices] = useState<Service[]>([
    { id: '1', name: '', category: '', priceType: 'fixed', price: '', priceMax: '', duration: '', durationFlexible: false, description: '' }
  ])
  const [openingHours, setOpeningHours] = useState(defaultOpeningHours)

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const draft = JSON.parse(saved)
        if (draft.name) setName(draft.name)
        if (draft.orgNumber) setOrgNumber(draft.orgNumber)
        if (draft.category) setCategory(draft.category)
        if (draft.serviceCities) setServiceCities(draft.serviceCities)
        if (draft.address) setAddress(draft.address)
        if (draft.description) setDescription(draft.description)
        if (draft.phone) setPhone(draft.phone)
        if (draft.email) setEmail(draft.email)
        if (draft.website) setWebsite(draft.website)
        if (draft.facebook) setFacebook(draft.facebook)
        if (draft.instagram) setInstagram(draft.instagram)
        if (draft.rutAvdrag) setRutAvdrag(draft.rutAvdrag)
        if (draft.rotAvdrag) setRotAvdrag(draft.rotAvdrag)
        if (draft.selectedPaymentMethods) setSelectedPaymentMethods(draft.selectedPaymentMethods)
        if (draft.hasInsurance) setHasInsurance(draft.hasInsurance)
        if (draft.insuranceInfo) setInsuranceInfo(draft.insuranceInfo)
        if (draft.guarantee) setGuarantee(draft.guarantee)
        if (draft.services) setServices(draft.services)
        if (draft.openingHours) setOpeningHours(draft.openingHours)
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [])

  // Save draft
  const saveDraft = () => {
    const draft = {
      name, orgNumber, category, serviceCities, address, description,
      phone, email, website, facebook, instagram,
      rutAvdrag, rotAvdrag, selectedPaymentMethods,
      hasInsurance, insuranceInfo, guarantee,
      services, openingHours
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
  }

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
      { id: Date.now().toString(), name: '', category: '', priceType: 'fixed', price: '', priceMax: '', duration: '', durationFlexible: false, description: '' }
    ])
  }

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter(s => s.id !== id))
    }
  }

  const updateService = (id: string, field: keyof Service, value: any) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const updateHours = (day: string, field: string, value: string | boolean) => {
    setOpeningHours({
      ...openingHours,
      [day]: { ...openingHours[day as keyof typeof openingHours], [field]: value }
    })
  }

  const toggleCity = (city: string) => {
    setServiceCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    )
  }

  const togglePaymentMethod = (id: string) => {
    setSelectedPaymentMethods(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    )
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.size <= 2 * 1024 * 1024) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    } else if (file) {
      alert('Logotypen är för stor (max 2 MB)')
    }
  }

  const handleSubmit = async (asDraft = false) => {
    if (!user) {
      setError('Du måste vara inloggad för att skapa en annons.')
      router.push('/login?redirect=/skapa')
      return
    }

    // Validate all required fields before submit
    const validationErrors: string[] = []
    if (!name.trim()) validationErrors.push('Företagsnamn saknas')
    if (!category) validationErrors.push('Kategori saknas')
    if (serviceCities.length === 0) validationErrors.push('Serviceområden saknas')
    if (!description.trim() || description.trim().length < 20) validationErrors.push('Beskrivning saknas eller är för kort')
    if (!phone.trim() || phone.trim().length < 8) validationErrors.push('Telefonnummer saknas eller är ogiltigt')
    
    const hasValidService = services.some(s => s.name.trim() && (s.price || s.priceType === 'quote'))
    if (!hasValidService) validationErrors.push('Minst en tjänst med namn och pris krävs')

    if (validationErrors.length > 0 && !asDraft) {
      setError(`Kan inte publicera: ${validationErrors.join(', ')}`)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      let uploadedImages: string[] = []
      let uploadedLogo: string | null = null

      if (storage) {
        const storageInstance = storage
        // Upload logo
        if (logoFile) {
          const logoId = `logo-${Date.now()}-${Math.random().toString(36).slice(2)}`
          const logoRef = storageRef(storageInstance, `companies/${user.uid}/${logoId}`)
          await uploadBytes(logoRef, logoFile)
          uploadedLogo = await getDownloadURL(logoRef)
        }

        // Upload images
        if (imageFiles.length > 0) {
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
      }

      // Prepare services data
      const validServices = services
        .filter(s => s.name && (s.price || s.priceType === 'quote'))
        .map(s => ({
          name: s.name,
          category: (s.category || '').trim(),
          priceType: s.priceType,
          price: s.priceType === 'quote' ? 0 : parseInt(s.price) || 0,
          priceMax: s.priceType === 'range' ? parseInt(s.priceMax) || 0 : null,
          duration: s.durationFlexible ? null : (parseInt(s.duration) || 30),
          durationFlexible: s.durationFlexible,
          description: s.description || '',
        }))

      const selectedCat = categories.find(c => c.id === category)
      const isCustomCategory = category === 'annat'
      
      const finalSubServices = isCustomCategory 
        ? customSubServices.filter(s => s.trim()) 
        : selectedSubServices
      const subServiceNames = isCustomCategory
        ? customSubServices.filter(s => s.trim())
        : selectedSubServices.map(id => selectedCat?.subServices.find(s => s.id === id)?.name || id)
      
      const companyData = {
        name,
        orgNumber: orgNumber || null,
        category: isCustomCategory ? 'annat' : category,
        categoryName: isCustomCategory ? customCategoryName : (selectedCat?.name || category),
        customCategory: isCustomCategory,
        emoji: selectedCat?.emoji || '📋',
        subServices: finalSubServices,
        subServiceNames,
        
        // Location
        city: serviceCities[0] || '',
        serviceCities,
        address,
        description,

        // Contact
        phone,
        email: email || '',
        website,
        socialMedia: {
          facebook: facebook || null,
          instagram: instagram || null,
        },

        // Business info
        rutAvdrag,
        rotAvdrag,
        paymentMethods: selectedPaymentMethods,
        hasInsurance,
        insuranceInfo: hasInsurance ? insuranceInfo : null,
        guarantee: guarantee || null,

        // Services & Hours
        services: validServices,
        openingHours,

        // Images
        logo: uploadedLogo,
        ...(uploadedImages.length > 0 ? { images: uploadedImages, image: uploadedImages[0] } : {}),

        // Metadata
        ownerId: user.uid,
        ownerName: ownerName || user.displayName || user.email || '',
        ownerBio: ownerBio || '',
        ownerEmail: user.email || email || '',

        // Stats
        rating: 0,
        reviewCount: 0,
        viewCount: 0,
        bookingCount: 0,
        verified: false,
        premium: false,
        
        // Status
        status: asDraft ? 'draft' : 'active',
        published: !asDraft,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      if (!db) throw new Error('Database not available')
      const docRef = await addDoc(collection(db, 'companies'), companyData)
      
      clearDraft()
      setNewCompanyId(docRef.id)
      setSubmitted(true)
    } catch (err: any) {
      console.error('Error creating company:', err)
      setError(err.message || 'Kunde inte skapa annonsen. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <HiLockClosed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Logga in krävs</h1>
          <p className="text-gray-600 mb-6">
            Du måste vara inloggad för att skapa en annons.
          </p>
          <Link
            href="/login?redirect=/skapa"
            className="inline-block bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            Logga in
          </Link>
        </div>
      </div>
    )
  }

  if (submitted && newCompanyId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiCheck className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Annonsen är skapad!</h1>
          <p className="text-gray-600 mb-6">
            Din annons är nu publicerad och synlig för alla.
          </p>
          <div className="space-y-3">
            <Link
              href={`/foretag/${newCompanyId}`}
              className="block w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-xl font-semibold transition"
            >
              Visa din annons
            </Link>
            <Link
              href="/konto"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition"
            >
              Gå till mitt konto
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Preview Modal
  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-brand text-white p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Förhandsgranskning</h2>
              <button onClick={() => setShowPreview(false)} className="text-white/80 hover:text-white">
                Stäng ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Preview content */}
              <div className="flex items-start gap-4">
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo" width={80} height={80} className="rounded-xl object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center text-2xl">
                    {categories.find(c => c.id === category)?.emoji || '🏢'}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{name || 'Företagsnamn'}</h1>
                  <p className="text-gray-500">{categories.find(c => c.id === category)?.name || 'Kategori'}</p>
                  {orgNumber && <p className="text-sm text-gray-400">Org.nr: {orgNumber}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Städer</p>
                  <p className="text-gray-600">{serviceCities.join(', ') || 'Ej angiven'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">Telefon</p>
                  <p className="text-gray-600">{phone || 'Ej angiven'}</p>
                </div>
              </div>

              {(rutAvdrag || rotAvdrag) && (
                <div className="flex gap-2">
                  {rutAvdrag && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">RUT-avdrag</span>}
                  {rotAvdrag && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">ROT-avdrag</span>}
                </div>
              )}

              {selectedPaymentMethods.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Betalningsmetoder</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPaymentMethods.map(id => {
                      const method = paymentMethods.find(p => p.id === id)
                      return method ? (
                        <span key={id} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                          {method.icon} {method.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {services.filter(s => s.name).length > 0 && (
                <div>
                  <p className="font-medium mb-2">Tjänster</p>
                  <div className="space-y-2">
                    {services.filter(s => s.name).map(s => (
                      <div key={s.id} className="bg-gray-50 p-3 rounded-lg flex justify-between">
                        <span>{s.name}</span>
                        <span className="font-medium">
                          {s.priceType === 'quote' ? 'Enligt offert' : 
                           s.priceType === 'range' ? `${s.price} - ${s.priceMax} kr` : 
                           `${s.price} kr`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold"
              >
                ← Fortsätt redigera
              </button>
              <button
                onClick={() => { setShowPreview(false); handleSubmit() }}
                disabled={isSubmitting}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold"
              >
                🚀 Publicera
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Skapa ny annons</h1>
          <p className="text-gray-600 mt-1">Fyll i information om ditt företag</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                step >= s ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-brand' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Save draft button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={saveDraft}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand"
          >
            <HiSave className="w-4 h-4" />
            {draftSaved ? 'Sparat!' : 'Spara utkast'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">📋 Grundläggande info</h2>

              {/* Company name & Org number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Företagsnamn *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (e.target.value.trim()) setFieldErrors(prev => ({ ...prev, name: '' }))
                    }}
                    placeholder="t.ex. Städ & Flytt AB"
                    className={`w-full px-4 py-3 border rounded-xl focus:border-brand outline-none ${fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organisationsnummer</label>
                  <input
                    type="text"
                    value={orgNumber}
                    onChange={(e) => setOrgNumber(e.target.value)}
                    placeholder="XXXXXX-XXXX"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori *</label>
                {fieldErrors.category && <p className="text-red-500 text-xs mb-2">{fieldErrors.category}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        category === cat.id
                          ? 'border-brand bg-brand/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <p className="font-medium text-sm mt-1">{cat.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service cities (multiple) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serviceområden * (välj minst en stad)</label>
                {fieldErrors.serviceCities && <p className="text-red-500 text-xs mb-2">{fieldErrors.serviceCities}</p>}
                <div className={`max-h-48 overflow-y-auto border rounded-xl p-3 ${fieldErrors.serviceCities ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allCities.map((city) => (
                      <label key={city} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={serviceCities.includes(city)}
                          onChange={() => toggleCity(city)}
                          className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                        />
                        <span className="text-sm">{city}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {serviceCities.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">Valt: {serviceCities.join(', ')}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adress</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Gatuadress 123"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivning * (minst 20 tecken)</label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (e.target.value.trim().length >= 20) setFieldErrors(prev => ({ ...prev, description: '' }))
                  }}
                  placeholder="Berätta om ditt företag..."
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:border-brand outline-none resize-none ${fieldErrors.description ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {fieldErrors.description && <p className="text-red-500 text-xs mt-1">{fieldErrors.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{description.length}/20 tecken minimum</p>
              </div>

              {/* RUT/ROT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skatteavdrag</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rutAvdrag}
                      onChange={(e) => setRutAvdrag(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="font-medium">RUT-avdrag</span>
                    <span className="text-xs text-gray-500">(Hushållstjänster)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rotAvdrag}
                      onChange={(e) => setRotAvdrag(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">ROT-avdrag</span>
                    <span className="text-xs text-gray-500">(Renovering)</span>
                  </label>
                </div>
              </div>

              {/* Payment methods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Betalningsmetoder</label>
                <div className="flex flex-wrap gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => togglePaymentMethod(method.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition ${
                        selectedPaymentMethods.includes(method.id)
                          ? 'border-brand bg-brand/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span>{method.icon}</span>
                      <span className="text-sm font-medium">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  const errors: Record<string, string> = {}
                  if (!name.trim()) errors.name = 'Företagsnamn krävs'
                  if (!category) errors.category = 'Välj en kategori'
                  if (serviceCities.length === 0) errors.serviceCities = 'Välj minst en stad'
                  if (!description.trim() || description.trim().length < 20) errors.description = 'Beskrivning måste vara minst 20 tecken'
                  
                  setFieldErrors(errors)
                  if (Object.keys(errors).length === 0) {
                    setStep(2)
                  }
                }}
                className="w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition"
              >
                Nästa: Kontakt & Media →
              </button>
            </div>
          )}

          {/* Step 2: Contact & Media */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">📞 Kontakt & Media</h2>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logotyp</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <Image src={logoPreview} alt="Logo" width={80} height={80} className="rounded-xl object-cover" />
                      <button
                        onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <HiTrash className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-brand">
                      <HiPlus className="w-6 h-6 text-gray-400" />
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </label>
                  )}
                  <p className="text-sm text-gray-500">Max 2 MB. Rekommenderat: 200x200px</p>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bilder (max 5)</label>
                {imageFiles.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative w-24 h-24">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Bild ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <HiTrash className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {imageFiles.length < 5 && (
                  <label className="block w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand flex items-center justify-center">
                    <div className="text-center">
                      <HiPlus className="w-6 h-6 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-500 mt-1">{imageFiles.length}/5 bilder</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).filter(f => f.size <= 5 * 1024 * 1024)
                        const newFiles = [...imageFiles, ...files].slice(0, 5)
                        setImageFiles(newFiles)
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Contact fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (e.target.value.trim().length >= 8) setFieldErrors(prev => ({ ...prev, phone: '' }))
                    }}
                    placeholder="08-123 45 67"
                    className={`w-full px-4 py-3 border rounded-xl focus:border-brand outline-none ${fieldErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@example.se"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hemsida</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="www.example.se"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                </div>
              </div>

              {/* Social media */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="facebook.com/dittforetag"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="instagram.com/dittforetag"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                </div>
              </div>

              {/* Insurance */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasInsurance}
                    onChange={(e) => setHasInsurance(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand"
                  />
                  <span className="font-medium">Företaget har försäkring</span>
                </label>
                {hasInsurance && (
                  <input
                    type="text"
                    value={insuranceInfo}
                    onChange={(e) => setInsuranceInfo(e.target.value)}
                    placeholder="t.ex. Ansvarsförsäkring via Trygg Hansa"
                    className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                  />
                )}
              </div>

              {/* Guarantee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Garanti</label>
                <input
                  type="text"
                  value={guarantee}
                  onChange={(e) => setGuarantee(e.target.value)}
                  placeholder="t.ex. 100% nöjd-garanti"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
                  ← Tillbaka
                </button>
                <button
                  onClick={() => {
                    const errors: Record<string, string> = {}
                    if (!phone.trim() || phone.trim().length < 8) errors.phone = 'Ange ett giltigt telefonnummer (minst 8 siffror)'
                    
                    setFieldErrors(errors)
                    if (Object.keys(errors).length === 0) {
                      setStep(3)
                    }
                  }}
                  className="flex-1 bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition"
                >
                  Nästa: Tjänster →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Services */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">💈 Tjänster & Priser</h2>

              {services.map((service, index) => (
                <div key={service.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Tjänst {index + 1}</span>
                    {services.length > 1 && (
                      <button onClick={() => removeService(service.id)} className="text-red-500 hover:text-red-700">
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
                    placeholder="Kategori (t.ex. Städning, Flytthjälp)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                  />

                  {/* Price type */}
                  <div className="flex gap-2">
                    {[
                      { id: 'fixed', label: 'Fast pris' },
                      { id: 'range', label: 'Prisintervall' },
                      { id: 'quote', label: 'Enligt offert' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateService(service.id, 'priceType', type.id)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          service.priceType === type.id
                            ? 'bg-brand text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>

                  {service.priceType !== 'quote' && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={service.price}
                        onChange={(e) => updateService(service.id, 'price', e.target.value)}
                        placeholder={service.priceType === 'range' ? 'Från (SEK)' : 'Pris (SEK)'}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                      />
                      {service.priceType === 'range' && (
                        <input
                          type="number"
                          value={service.priceMax}
                          onChange={(e) => updateService(service.id, 'priceMax', e.target.value)}
                          placeholder="Till (SEK)"
                          className="px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={service.duration}
                      onChange={(e) => updateService(service.id, 'duration', e.target.value)}
                      placeholder="Tid (min)"
                      disabled={service.durationFlexible}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-brand outline-none disabled:bg-gray-100"
                    />
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={service.durationFlexible}
                        onChange={(e) => updateService(service.id, 'durationFlexible', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-brand"
                      />
                      Varierar
                    </label>
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
                <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
                  ← Tillbaka
                </button>
                <button
                  onClick={() => {
                    const hasValidService = services.some(s => s.name.trim() && (s.price || s.priceType === 'quote'))
                    if (!hasValidService) {
                      setFieldErrors({ services: 'Lägg till minst en tjänst med namn och pris' })
                      return
                    }
                    setFieldErrors({})
                    setStep(4)
                  }}
                  className="flex-1 bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition"
                >
                  Nästa: Öppettider →
                </button>
              </div>
              {fieldErrors.services && <p className="text-red-500 text-sm text-center mt-2">{fieldErrors.services}</p>}
            </div>
          )}

          {/* Step 4: Opening Hours & Publish */}
          {step === 4 && (
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
                    {hours.closed && <span className="text-red-500 text-sm">Stängt</span>}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
                  ← Tillbaka
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition flex items-center justify-center gap-2"
                >
                  <HiEye className="w-5 h-5" />
                  Förhandsgranska
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                  💾 Spara som utkast
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition"
                >
                  {isSubmitting ? 'Publicerar...' : '🚀 Publicera'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
