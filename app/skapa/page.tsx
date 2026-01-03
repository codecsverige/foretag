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
  const [city, setCity] = useState('')
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
        if (draft.city) setCity(draft.city)
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
      name, orgNumber, category, city, serviceCities, address, description,
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
        city: city || serviceCities[0] || '',
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

  // Preview Modal - Complete preview of the ad before publishing
  if (showPreview) {
    const selectedCat = categories.find(c => c.id === category)
    const previewImages = imageFiles.length > 0 ? imageFiles.map(f => URL.createObjectURL(f)) : []
    
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-brand text-white p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">👁️ Förhandsgranskning av din annons</h2>
              <button onClick={() => setShowPreview(false)} className="text-white/80 hover:text-white text-xl">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Images Preview */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previewImages.map((img, i) => (
                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <Image src={img} alt={`Bild ${i + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Company Header */}
              <div className="flex items-start gap-4 pb-4 border-b">
                {logoPreview ? (
                  <Image src={logoPreview} alt="Logo" width={80} height={80} className="rounded-xl object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center text-3xl">
                    {selectedCat?.emoji || '🏢'}
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{name || 'Företagsnamn'}</h1>
                  <p className="text-brand font-medium">{selectedCat?.name || 'Kategori'}</p>
                  {orgNumber && <p className="text-sm text-gray-400 mt-1">Org.nr: {orgNumber}</p>}
                </div>
              </div>

              {/* Description */}
              {description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">📝 Om företaget</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{description}</p>
                </div>
              )}

              {/* Location & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">📍 Plats & Kontakt</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Städer:</span> <span className="font-medium">{serviceCities.join(', ') || 'Ej angiven'}</span></p>
                    {address && <p><span className="text-gray-500">Adress:</span> <span className="font-medium">{address}</span></p>}
                    <p><span className="text-gray-500">Telefon:</span> <span className="font-medium">{phone || 'Ej angiven'}</span></p>
                    {email && <p><span className="text-gray-500">E-post:</span> <span className="font-medium">{email}</span></p>}
                    {website && <p><span className="text-gray-500">Hemsida:</span> <span className="font-medium">{website}</span></p>}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">ℹ️ Företagsinfo</h3>
                  <div className="space-y-2 text-sm">
                    {(rutAvdrag || rotAvdrag) && (
                      <div className="flex gap-2 flex-wrap">
                        {rutAvdrag && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">RUT-avdrag</span>}
                        {rotAvdrag && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">ROT-avdrag</span>}
                      </div>
                    )}
                    {hasInsurance && <p><span className="text-gray-500">Försäkring:</span> <span className="font-medium text-green-600">✓ {insuranceInfo || 'Ja'}</span></p>}
                    {guarantee && <p><span className="text-gray-500">Garanti:</span> <span className="font-medium">{guarantee}</span></p>}
                    {(facebook || instagram) && (
                      <div className="flex gap-2 mt-2">
                        {facebook && <span className="text-blue-600 text-xs">📘 Facebook</span>}
                        {instagram && <span className="text-pink-600 text-xs">📷 Instagram</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              {selectedPaymentMethods.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">💳 Betalningsmetoder</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPaymentMethods.map(id => {
                      const method = paymentMethods.find(p => p.id === id)
                      return method ? (
                        <span key={id} className="bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium">
                          {method.icon} {method.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}

              {/* Services */}
              {services.filter(s => s.name).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">💼 Tjänster & Priser</h3>
                  <div className="space-y-2">
                    {services.filter(s => s.name).map(s => (
                      <div key={s.id} className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-medium">{s.name}</p>
                          {s.category && <p className="text-xs text-gray-500">{s.category}</p>}
                          {s.description && <p className="text-sm text-gray-600 mt-1">{s.description}</p>}
                          {(s.duration || s.durationFlexible) && (
                            <p className="text-xs text-gray-400 mt-1">
                              ⏱️ {s.durationFlexible ? 'Tid varierar' : `${s.duration} min`}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-brand text-lg">
                          {s.priceType === 'quote' ? 'Offert' : 
                           s.priceType === 'range' ? `${s.price}-${s.priceMax} kr` : 
                           `${s.price} kr`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opening Hours */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">🕐 Öppettider</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(openingHours).map(([day, hours]) => (
                    <div key={day} className={`p-2 rounded-lg text-center text-sm ${hours.closed ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                      <p className="font-medium">{dayNames[day]}</p>
                      <p>{hours.closed ? 'Stängt' : `${hours.open}-${hours.close}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-gray-50 border-t space-y-3">
              <p className="text-center text-sm text-gray-600">
                Granska din annons noggrant innan du publicerar
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  ← Redigera
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition"
                >
                  💾 Spara utkast
                </button>
                <button
                  onClick={() => { setShowPreview(false); handleSubmit(false) }}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition"
                >
                  {isSubmitting ? '...' : '🚀 Publicera'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Professional Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand to-blue-600 rounded-2xl shadow-lg shadow-brand/30 mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Skapa din företagsannons</h1>
          <p className="text-gray-600 mt-2 max-w-lg mx-auto">Fyll i all information om ditt företag för att nå tusentals potentiella kunder</p>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Grundinfo', icon: '📋' },
              { num: 2, label: 'Kontakt', icon: '📞' },
              { num: 3, label: 'Tjänster', icon: '💼' },
              { num: 4, label: 'Publicera', icon: '🚀' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <button
                  onClick={() => s.num < step && setStep(s.num)}
                  disabled={s.num > step}
                  className={`flex flex-col items-center gap-1 transition-all ${s.num <= step ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                    step === s.num 
                      ? 'bg-gradient-to-br from-brand to-blue-600 text-white shadow-lg shadow-brand/30 scale-110' 
                      : step > s.num 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s.num ? '✓' : s.icon}
                  </div>
                  <span className={`text-xs font-medium ${step === s.num ? 'text-brand' : 'text-gray-500'}`}>
                    {s.label}
                  </span>
                </button>
                {i < 3 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${step > s.num ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save draft & status bar */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
              Steg {step} av 4
            </span>
            {draftSaved && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                ✓ Utkast sparat
              </span>
            )}
          </div>
          <button
            onClick={saveDraft}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand hover:bg-brand/5 rounded-lg transition"
          >
            <HiSave className="w-4 h-4" />
            Spara utkast
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 shadow-sm">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <HiExclamationCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Något gick fel</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Section Header */}
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">📋</span>
                  Grundläggande info
                </h2>
                <p className="text-gray-500 mt-1 ml-13">Berätta om ditt företag och vad ni erbjuder</p>
              </div>

              {/* Company Identity Section */}
              <div className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">🏢</span> Företagsidentitet
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Företagsnamn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (e.target.value.trim()) setFieldErrors(prev => ({ ...prev, name: '' }))
                      }}
                      placeholder="t.ex. Städ & Flytt AB"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition ${fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                    />
                    {fieldErrors.name && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><HiExclamationCircle className="w-3 h-3" />{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Organisationsnummer <span className="text-gray-400 text-xs">(valfritt)</span>
                    </label>
                    <input
                      type="text"
                      value={orgNumber}
                      onChange={(e) => setOrgNumber(e.target.value)}
                      placeholder="XXXXXX-XXXX"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Category Section */}
              <div className="bg-gradient-to-br from-blue-50/50 to-white p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">📂</span> Kategori <span className="text-red-500">*</span>
                </h3>
                {fieldErrors.category && (
                  <p className="text-red-500 text-xs mb-3 flex items-center gap-1 bg-red-50 p-2 rounded-lg">
                    <HiExclamationCircle className="w-4 h-4" />{fieldErrors.category}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                        category === cat.id
                          ? 'border-brand bg-brand/5 shadow-md shadow-brand/10'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      <p className={`font-medium text-sm mt-2 ${category === cat.id ? 'text-brand' : 'text-gray-700'}`}>{cat.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-gradient-to-br from-green-50/50 to-white p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">📍</span> Plats & Område
                </h3>
                
                {/* Service cities */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serviceområden <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(välj minst en stad)</span>
                  </label>
                  {fieldErrors.serviceCities && (
                    <p className="text-red-500 text-xs mb-2 flex items-center gap-1 bg-red-50 p-2 rounded-lg">
                      <HiExclamationCircle className="w-4 h-4" />{fieldErrors.serviceCities}
                    </p>
                  )}
                  <div className={`max-h-48 overflow-y-auto border-2 rounded-xl p-4 transition ${fieldErrors.serviceCities ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {allCities.map((city) => (
                        <label key={city} className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition ${serviceCities.includes(city) ? 'bg-brand/10' : 'hover:bg-gray-50'}`}>
                          <input
                            type="checkbox"
                            checked={serviceCities.includes(city)}
                            onChange={() => toggleCity(city)}
                            className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                          />
                          <span className={`text-sm ${serviceCities.includes(city) ? 'font-medium text-brand' : ''}`}>{city}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {serviceCities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {serviceCities.map(city => (
                        <span key={city} className="inline-flex items-center gap-1 px-3 py-1 bg-brand/10 text-brand rounded-full text-sm font-medium">
                          {city}
                          <button onClick={() => toggleCity(city)} className="hover:bg-brand/20 rounded-full p-0.5">
                            <HiX className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Main City */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Huvudstad <span className="text-gray-400 text-xs">(var företaget är baserat)</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300 bg-white"
                  >
                    <option value="">Välj huvudstad...</option>
                    {allCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Adress <span className="text-gray-400 text-xs">(valfritt)</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Gatuadress 123, Postnummer Stad"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-gradient-to-br from-purple-50/50 to-white p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">📝</span> Beskrivning <span className="text-red-500">*</span>
                </h3>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    if (e.target.value.trim().length >= 20) setFieldErrors(prev => ({ ...prev, description: '' }))
                  }}
                  placeholder="Berätta om ditt företag, era tjänster och vad som gör er unika..."
                  rows={5}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none resize-none transition ${fieldErrors.description ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                />
                {fieldErrors.description && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <HiExclamationCircle className="w-3 h-3" />{fieldErrors.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">{description.length} tecken</p>
                  <p className={`text-xs ${description.length >= 20 ? 'text-green-600' : 'text-amber-600'}`}>
                    {description.length >= 20 ? '✓ Minimum uppnått' : `${20 - description.length} tecken kvar`}
                  </p>
                </div>
              </div>

              {/* Business Features Section */}
              <div className="bg-gradient-to-br from-amber-50/50 to-white p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">💰</span> Betalning & Skatteavdrag
                </h3>
                
                {/* RUT/ROT */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Erbjuder ni skatteavdrag?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${rutAvdrag ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="checkbox"
                        checked={rutAvdrag}
                        onChange={(e) => setRutAvdrag(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <span className="font-semibold text-green-700">RUT-avdrag</span>
                        <p className="text-xs text-gray-500">Hushållstjänster (städ, trädgård)</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${rotAvdrag ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="checkbox"
                        checked={rotAvdrag}
                        onChange={(e) => setRotAvdrag(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-semibold text-blue-700">ROT-avdrag</span>
                        <p className="text-xs text-gray-500">Renovering & reparation</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Payment methods */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Accepterade betalningsmetoder</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => togglePaymentMethod(method.id)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                          selectedPaymentMethods.includes(method.id)
                            ? 'border-brand bg-brand/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl">{method.icon}</span>
                        <span className={`text-sm font-medium ${selectedPaymentMethods.includes(method.id) ? 'text-brand' : ''}`}>{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Next Button */}
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
            <div className="space-y-8">
              {/* Section Header */}
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">📞</span>
                  Kontakt & Media
                </h2>
                <p className="text-gray-500 mt-1 ml-13">Lägg till bilder och kontaktuppgifter för ditt företag</p>
              </div>

              {/* Media Section */}
              <div className="bg-gradient-to-br from-pink-50/50 to-white p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">🖼️</span> Bilder & Logotyp
                </h3>

                {/* Logo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Företagslogotyp</label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative group">
                        <Image src={logoPreview} alt="Logo" width={80} height={80} className="rounded-xl object-cover border-2 border-gray-200" />
                        <button
                          onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <HiTrash className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5 transition group">
                        <HiPlus className="w-6 h-6 text-gray-400 group-hover:text-brand" />
                        <span className="text-xs text-gray-400 mt-1">Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                    )}
                    <div className="text-sm text-gray-500">
                      <p className="font-medium text-gray-700">Ladda upp din logotyp</p>
                      <p className="text-xs">Max 2 MB • Rekommenderat: 200×200 px</p>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Galleri <span className="text-gray-400 font-normal">(max 5 bilder)</span>
                  </label>
                  <div className="grid grid-cols-5 gap-3 mb-3">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative aspect-square group">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Bild ${index + 1}`}
                          fill
                          className="object-cover rounded-xl border-2 border-gray-200"
                        />
                        <button
                          onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition"
                        >
                          <HiTrash className="w-3 h-3" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">Huvudbild</span>
                        )}
                      </div>
                    ))}
                    {imageFiles.length < 5 && (
                      <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand hover:bg-brand/5 flex flex-col items-center justify-center transition group">
                        <HiPlus className="w-6 h-6 text-gray-400 group-hover:text-brand" />
                        <span className="text-xs text-gray-400 mt-1">{imageFiles.length}/5</span>
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
                  <p className="text-xs text-gray-500">💡 Tips: Ladda upp högkvalitativa bilder av era tjänster, lokaler eller team</p>
                </div>
              </div>

              {/* Contact Section */}
              <div className="bg-gradient-to-br from-blue-50/50 to-white p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">📱</span> Kontaktuppgifter
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Telefon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        if (e.target.value.trim().length >= 8) setFieldErrors(prev => ({ ...prev, phone: '' }))
                      }}
                      placeholder="08-123 45 67"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition ${fieldErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                    />
                    {fieldErrors.phone && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><HiExclamationCircle className="w-3 h-3" />{fieldErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      E-post <span className="text-gray-400 text-xs">(valfritt)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="info@example.se"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Hemsida <span className="text-gray-400 text-xs">(valfritt)</span>
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.example.se"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Section */}
              <div className="bg-gradient-to-br from-indigo-50/50 to-white p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">🌐</span> Sociala medier
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <span className="text-blue-600">📘</span> Facebook
                    </label>
                    <input
                      type="url"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="facebook.com/dittforetag"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition hover:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                      <span className="text-pink-600">📷</span> Instagram
                    </label>
                    <input
                      type="url"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="instagram.com/dittforetag"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition hover:border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Trust & Guarantee Section */}
              <div className="bg-gradient-to-br from-green-50/50 to-white p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">🛡️</span> Försäkring & Garanti
                </h3>
                
                {/* Insurance */}
                <div className="mb-4">
                  <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${hasInsurance ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={hasInsurance}
                      onChange={(e) => setHasInsurance(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <span className="font-semibold text-gray-800">Företaget har försäkring</span>
                      <p className="text-xs text-gray-500">Ger kunderna extra trygghet</p>
                    </div>
                  </label>
                  {hasInsurance && (
                    <input
                      type="text"
                      value={insuranceInfo}
                      onChange={(e) => setInsuranceInfo(e.target.value)}
                      placeholder="t.ex. Ansvarsförsäkring via Trygg Hansa, 10 MSEK"
                      className="w-full mt-3 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                    />
                  )}
                </div>

                {/* Guarantee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Garanti <span className="text-gray-400 text-xs">(valfritt)</span>
                  </label>
                  <input
                    type="text"
                    value={guarantee}
                    onChange={(e) => setGuarantee(e.target.value)}
                    placeholder="t.ex. 100% nöjd-garanti, omgörning utan kostnad"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2">
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
                  className="flex-1 bg-gradient-to-r from-brand to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-brand-dark hover:to-blue-700 transition shadow-lg shadow-brand/30 flex items-center justify-center gap-2"
                >
                  Nästa: Tjänster →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Services */}
          {step === 3 && (
            <div className="space-y-8">
              {/* Section Header */}
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">�</span>
                  Tjänster & Priser
                </h2>
                <p className="text-gray-500 mt-1 ml-13">Lägg till de tjänster ditt företag erbjuder</p>
              </div>

              {/* Services List */}
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={service.id} className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center text-brand font-bold text-sm">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {service.name || `Tjänst ${index + 1}`}
                        </span>
                      </div>
                      {services.length > 1 && (
                        <button 
                          onClick={() => removeService(service.id)} 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tjänstens namn *</label>
                          <input
                            type="text"
                            value={service.name}
                            onChange={(e) => updateService(service.id, 'name', e.target.value)}
                            placeholder="t.ex. Hemstädning"
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
                          <input
                            type="text"
                            value={service.category}
                            onChange={(e) => updateService(service.id, 'category', e.target.value)}
                            placeholder="t.ex. Städning"
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                          />
                        </div>
                      </div>

                      {/* Price type */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Pristyp</label>
                        <div className="flex gap-2">
                          {[
                            { id: 'fixed', label: '💵 Fast pris', desc: 'Ett fast pris' },
                            { id: 'range', label: '📊 Prisintervall', desc: 'Från-till' },
                            { id: 'quote', label: '📋 Offert', desc: 'Enligt offert' },
                          ].map((type) => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => updateService(service.id, 'priceType', type.id)}
                              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                                service.priceType === type.id
                                  ? 'bg-brand text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {service.priceType !== 'quote' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              {service.priceType === 'range' ? 'Från (SEK)' : 'Pris (SEK)'}
                            </label>
                            <input
                              type="number"
                              value={service.price}
                              onChange={(e) => updateService(service.id, 'price', e.target.value)}
                              placeholder="0"
                              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                            />
                          </div>
                          {service.priceType === 'range' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Till (SEK)</label>
                              <input
                                type="number"
                                value={service.priceMax}
                                onChange={(e) => updateService(service.id, 'priceMax', e.target.value)}
                                placeholder="0"
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tid (minuter)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={service.duration}
                              onChange={(e) => updateService(service.id, 'duration', e.target.value)}
                              placeholder="60"
                              disabled={service.durationFlexible}
                              className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-brand outline-none disabled:bg-gray-100 transition hover:border-gray-300"
                            />
                            <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                              <input
                                type="checkbox"
                                checked={service.durationFlexible}
                                onChange={(e) => updateService(service.id, 'durationFlexible', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-brand"
                              />
                              Varierar
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Beskrivning</label>
                          <input
                            type="text"
                            value={service.description}
                            onChange={(e) => updateService(service.id, 'description', e.target.value)}
                            placeholder="Kort beskrivning..."
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition hover:border-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addService}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-brand hover:text-brand hover:bg-brand/5 transition flex items-center justify-center gap-2 font-medium"
              >
                <HiPlus className="w-5 h-5" />
                Lägg till ny tjänst
              </button>

              {fieldErrors.services && (
                <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl flex items-center justify-center gap-2">
                  <HiExclamationCircle className="w-4 h-4" />{fieldErrors.services}
                </p>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition">
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
                  className="flex-1 bg-gradient-to-r from-brand to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-brand-dark hover:to-blue-700 transition shadow-lg shadow-brand/30"
                >
                  Nästa: Öppettider →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Opening Hours & Publish */}
          {step === 4 && (
            <div className="space-y-8">
              {/* Section Header */}
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">�</span>
                  Öppettider & Publicera
                </h2>
                <p className="text-gray-500 mt-1 ml-13">Ange era öppettider och publicera din annons</p>
              </div>

              {/* Opening Hours Section */}
              <div className="bg-gradient-to-br from-cyan-50/50 to-white p-5 rounded-xl border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">🕐</span> Öppettider
                </h3>
                <div className="space-y-2">
                  {Object.entries(openingHours).map(([day, hours]) => (
                    <div key={day} className={`flex items-center gap-3 p-3 rounded-xl transition ${hours.closed ? 'bg-gray-50' : 'bg-green-50/50 border border-green-100'}`}>
                      <div className="w-20 font-semibold text-gray-700">{dayNames[day]}</div>
                      <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition ${!hours.closed ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                        <input
                          type="checkbox"
                          checked={!hours.closed}
                          onChange={(e) => updateHours(day, 'closed', !e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium">{hours.closed ? 'Stängt' : 'Öppet'}</span>
                      </label>
                      {!hours.closed && (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => updateHours(day, 'open', e.target.value)}
                            className="px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:border-brand outline-none"
                          />
                          <span className="text-gray-400 font-medium">→</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => updateHours(day, 'close', e.target.value)}
                            className="px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm focus:border-brand outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-brand/5 to-blue-50 p-5 rounded-xl border border-brand/20">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span> Sammanfattning
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">Företag</p>
                    <p className="font-semibold text-gray-800 truncate">{name || '—'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">Kategori</p>
                    <p className="font-semibold text-gray-800">{categories.find(c => c.id === category)?.name || '—'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">Tjänster</p>
                    <p className="font-semibold text-gray-800">{services.filter(s => s.name).length} st</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">Bilder</p>
                    <p className="font-semibold text-gray-800">{imageFiles.length} st</p>
                  </div>
                </div>
              </div>

              {/* Preview Button */}
              <button
                onClick={() => setShowPreview(true)}
                className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold hover:from-gray-900 hover:to-black transition flex items-center justify-center gap-2 shadow-lg"
              >
                <HiEye className="w-5 h-5" />
                👁️ Förhandsgranska din annons
              </button>

              {/* Navigation & Publish Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(3)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition">
                  ← Tillbaka
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-500 text-white py-3.5 rounded-xl font-semibold hover:bg-amber-600 transition flex items-center justify-center gap-2"
                >
                  💾 Spara utkast
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? '⏳ Publicerar...' : '🚀 Publicera'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>🔒 Dina uppgifter är säkra och skyddas enligt GDPR</p>
        </div>
      </div>
    </div>
  )
}
