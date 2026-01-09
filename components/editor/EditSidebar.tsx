'use client'

import { useState, useRef } from 'react'
import { HiCog, HiEye, HiOfficeBuilding, HiPhotograph, HiTrash, HiSparkles, HiClock, HiPlus } from 'react-icons/hi'
import Image from 'next/image'
import { storage } from '@/lib/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '@/context/AuthContext'

const allCities = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås',
  'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping',
  'Lund', 'Umeå', 'Gävle', 'Borås', 'Eskilstuna', 'Sundsvall',
  'Karlstad', 'Växjö', 'Halmstad', 'Trollhättan', 'Kalmar',
  'Kristianstad', 'Skellefteå', 'Uddevalla', 'Falun', 'Nyköping',
  'Varberg', 'Skövde', 'Östersund', 'Borlänge', 'Visby'
]

const paymentMethodOptions = [
  { value: 'swish', label: '📱 Swish', icon: '📱' },
  { value: 'kort', label: '💳 Kort', icon: '💳' },
  { value: 'faktura', label: '📄 Faktura', icon: '📄' },
  { value: 'kontant', label: '💵 Kontant', icon: '💵' },
  { value: 'klarna', label: '🛒 Klarna', icon: '🛒' },
]

// Städ-specific features
const stadFeatures = [
  { id: 'eco_friendly', label: '🌿 Miljövänliga produkter', description: 'Vi använder miljövänliga städprodukter' },
  { id: 'own_equipment', label: '🧹 Egen utrustning', description: 'Vi tar med all städutrustning' },
  { id: 'flexible_booking', label: '📅 Flexibel bokning', description: 'Samma dag bokning möjlig' },
  { id: 'satisfaction_guarantee', label: '✨ Nöjdhetsgaranti', description: 'Vi åtgärdar utan extra kostnad' },
  { id: 'key_service', label: '🔑 Nyckelservice', description: 'Vi kan städa när du inte är hemma' },
  { id: 'recurring', label: '🔄 Abonnemangstjänster', description: 'Vecko- eller månadsstädning' },
  { id: 'weekend_service', label: '📆 Helgservice', description: 'Vi städar även på helger' },
  { id: 'emergency_service', label: '🚨 Akuttjänst', description: 'Snabb utryckning vid behov' },
]

// Equipment that company provides
const equipmentOptions = [
  { id: 'vacuum', label: 'Dammsugare' },
  { id: 'mop', label: 'Mopp & hink' },
  { id: 'cleaning_products', label: 'Rengöringsmedel' },
  { id: 'window_cleaning', label: 'Fönsterputsverktyg' },
  { id: 'steam_cleaner', label: 'Ångtvättare' },
  { id: 'floor_machine', label: 'Golvvårdsmaskin' },
]

// Opening hours days
const weekDays = [
  { key: 'monday', label: 'Måndag' },
  { key: 'tuesday', label: 'Tisdag' },
  { key: 'wednesday', label: 'Onsdag' },
  { key: 'thursday', label: 'Torsdag' },
  { key: 'friday', label: 'Fredag' },
  { key: 'saturday', label: 'Lördag' },
  { key: 'sunday', label: 'Söndag' },
]

interface EditSidebarProps {
  company: any
  activeSection: string | null
  onUpdate: (field: string, value: any) => void
  onSave: () => void
}

export default function EditSidebar({ company, activeSection, onUpdate, onSave }: EditSidebarProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'business' | 'stad' | 'hours' | 'visibility'>('settings')

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
      {/* Tabs - 2 rows for better organization */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === 'settings'
                ? 'text-brand border-b-2 border-brand bg-brand/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HiCog className="w-4 h-4 mx-auto mb-0.5" />
            Grundinfo
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === 'business'
                ? 'text-brand border-b-2 border-brand bg-brand/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HiOfficeBuilding className="w-4 h-4 mx-auto mb-0.5" />
            Företag
          </button>
          <button
            onClick={() => setActiveTab('stad')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === 'stad'
                ? 'text-brand border-b-2 border-brand bg-brand/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HiSparkles className="w-4 h-4 mx-auto mb-0.5" />
            Städtjänst
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === 'hours'
                ? 'text-brand border-b-2 border-brand bg-brand/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HiClock className="w-4 h-4 mx-auto mb-0.5" />
            Öppettider
          </button>
          <button
            onClick={() => setActiveTab('visibility')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition ${
              activeTab === 'visibility'
                ? 'text-brand border-b-2 border-brand bg-brand/5'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <HiEye className="w-4 h-4 mx-auto mb-0.5" />
            Synlighet
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'settings' && (
          <SettingsTab company={company} onUpdate={onUpdate} />
        )}
        {activeTab === 'business' && (
          <BusinessTab company={company} onUpdate={onUpdate} />
        )}
        {activeTab === 'stad' && (
          <StadTab company={company} onUpdate={onUpdate} />
        )}
        {activeTab === 'hours' && (
          <OpeningHoursTab company={company} onUpdate={onUpdate} />
        )}
        {activeTab === 'visibility' && (
          <VisibilityTab company={company} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  )
}

function SettingsTab({ company, onUpdate }: any) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const serviceCities = company.serviceCities || []

  const handleCityToggle = (city: string) => {
    const updated = serviceCities.includes(city)
      ? serviceCities.filter((c: string) => c !== city)
      : [...serviceCities, city]
    onUpdate('serviceCities', updated)
  }

  const handleSocialMediaUpdate = (field: string, value: string) => {
    onUpdate('socialMedia', {
      ...(company.socialMedia || {}),
      [field]: value
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !storage || !user) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Logotypen får max vara 2 MB')
      return
    }

    setUploading(true)
    try {
      const storageInstance = storage as NonNullable<typeof storage>
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileId = `logo-${Date.now()}-${safeName}`
      const fileRef = storageRef(storageInstance, `companies/${user.uid}/${fileId}`)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      onUpdate('logo', url)
    } catch (error) {
      console.error('Logo upload error:', error)
      alert('Kunde inte ladda upp logotypen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Logotyp</h3>
        <div className="flex items-center gap-4">
          {company.logo ? (
            <div className="relative group">
              <Image 
                src={company.logo} 
                alt="Logo" 
                width={64} 
                height={64} 
                className="rounded-xl object-cover border-2 border-gray-200" 
              />
              <button
                onClick={() => onUpdate('logo', null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              >
                <HiTrash className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => logoInputRef.current?.click()}
              className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5 transition"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand"></div>
              ) : (
                <HiPhotograph className="w-6 h-6 text-gray-400" />
              )}
            </div>
          )}
          <div className="flex-1">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploading}
              className="text-sm text-brand hover:text-brand-dark font-medium disabled:opacity-50"
            >
              {uploading ? 'Laddar upp...' : company.logo ? 'Byt logotyp' : 'Ladda upp'}
            </button>
            <p className="text-xs text-gray-500 mt-1">Max 2 MB</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Grundinformation</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Företagsnamn
            </label>
            <input
              type="text"
              value={company.name || ''}
              onChange={(e) => onUpdate('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Org.nr
            </label>
            <input
              type="text"
              value={company.orgNumber || ''}
              onChange={(e) => onUpdate('orgNumber', e.target.value)}
              placeholder="XXXXXX-XXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Huvudstad
            </label>
            <input
              type="text"
              value={company.city || ''}
              onChange={(e) => onUpdate('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adress
            </label>
            <input
              type="text"
              value={company.address || ''}
              onChange={(e) => onUpdate('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Ägare / Kontaktperson</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Namn
            </label>
            <input
              type="text"
              value={company.ownerName || ''}
              onChange={(e) => onUpdate('ownerName', e.target.value)}
              placeholder="Ditt namn"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Om ägaren
            </label>
            <textarea
              value={company.ownerBio || ''}
              onChange={(e) => onUpdate('ownerBio', e.target.value)}
              placeholder="Kort beskrivning om dig eller företagets grundare..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Servicestäder</h3>
        <p className="text-xs text-gray-500 mb-3">Välj städer där ni erbjuder tjänster</p>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
          {allCities.map((city) => (
            <label key={city} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={serviceCities.includes(city)}
                onChange={() => handleCityToggle(city)}
                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
              />
              <span className="text-sm text-gray-700">{city}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Kontaktinformation</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              type="tel"
              value={company.phone || ''}
              onChange={(e) => onUpdate('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-post
            </label>
            <input
              type="email"
              value={company.email || ''}
              onChange={(e) => onUpdate('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webbplats
            </label>
            <input
              type="url"
              value={company.website || ''}
              onChange={(e) => onUpdate('website', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">SEO</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SEO Titel</label>
            <input
              type="text"
              value={company.seoTitle || ''}
              onChange={(e) => onUpdate('seoTitle', e.target.value)}
              placeholder="Titel som visas i Google"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta beskrivning</label>
            <textarea
              value={company.seoDescription || ''}
              onChange={(e) => onUpdate('seoDescription', e.target.value)}
              placeholder="Kort beskrivning (max ~160 tecken)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL-slug</label>
            <input
              type="text"
              value={company.slug || ''}
              onChange={(e) => onUpdate('slug', e.target.value.replace(/\s+/g, '-').toLowerCase())}
              placeholder="t.ex. rent-och-fint-ab"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Sociala medier</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facebook
            </label>
            <input
              type="url"
              value={company.socialMedia?.facebook || ''}
              onChange={(e) => handleSocialMediaUpdate('facebook', e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram
            </label>
            <input
              type="url"
              value={company.socialMedia?.instagram || ''}
              onChange={(e) => handleSocialMediaUpdate('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={company.status === 'active'}
              onChange={(e) => onUpdate('status', e.target.checked ? 'active' : 'draft')}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Publicerad</div>
              <div className="text-xs text-gray-500">Synlig för alla besökare</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

function BusinessTab({ company, onUpdate }: any) {
  const paymentMethods = company.paymentMethods || []

  const handlePaymentMethodToggle = (method: string) => {
    const updated = paymentMethods.includes(method)
      ? paymentMethods.filter((m: string) => m !== method)
      : [...paymentMethods, method]
    onUpdate('paymentMethods', updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">RUT/ROT-avdrag</h3>
        <p className="text-xs text-gray-500 mb-3">Markera om ni erbjuder RUT eller ROT-avdrag</p>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={company.rutAvdrag || false}
              onChange={(e) => onUpdate('rutAvdrag', e.target.checked)}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">RUT-avdrag</div>
              <div className="text-xs text-gray-500">Hushållsnära tjänster</div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={company.rotAvdrag || false}
              onChange={(e) => onUpdate('rotAvdrag', e.target.checked)}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">ROT-avdrag</div>
              <div className="text-xs text-gray-500">Renovering, ombyggnad, tillbyggnad</div>
            </div>
          </label>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Betalningsmetoder</h3>
        <p className="text-xs text-gray-500 mb-3">Välj vilka betalningsmetoder ni accepterar</p>
        
        <div className="space-y-2">
          {paymentMethodOptions.map((method) => (
            <label key={method.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={paymentMethods.includes(method.value)}
                onChange={() => handlePaymentMethodToggle(method.value)}
                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
              />
              <span className="text-sm text-gray-700">{method.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Försäkring</h3>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={company.hasInsurance || false}
              onChange={(e) => onUpdate('hasInsurance', e.target.checked)}
              className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Har försäkring</div>
              <div className="text-xs text-gray-500">Företaget har ansvarsförsäkring</div>
            </div>
          </label>

          {company.hasInsurance && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Försäkringsinformation
              </label>
              <input
                type="text"
                value={company.insuranceInfo || ''}
                onChange={(e) => onUpdate('insuranceInfo', e.target.value)}
                placeholder="T.ex. försäkringsbolag, belopp"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Garanti</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Garantivillkor
          </label>
          <input
            type="text"
            value={company.guarantee || ''}
            onChange={(e) => onUpdate('guarantee', e.target.value)}
            placeholder="T.ex. 2 års garanti på arbetet"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
      </div>

      {/* Policies */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Policyer</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Avbokningspolicy</label>
            <textarea
              value={company.cancellationPolicy || ''}
              onChange={(e) => onUpdate('cancellationPolicy', e.target.value)}
              placeholder="Villkor för avbokning och ombokning"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Villkor</label>
            <textarea
              value={company.terms || ''}
              onChange={(e) => onUpdate('terms', e.target.value)}
              placeholder="Kortfattade villkor för tjänsterna"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Integritetspolicy</label>
            <textarea
              value={company.privacyPolicy || ''}
              onChange={(e) => onUpdate('privacyPolicy', e.target.value)}
              placeholder="Hur ni hanterar personuppgifter (GDPR)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function VisibilityTab({ company, onUpdate }: any) {
  const settings = company.settings || {}

  const handleToggle = (key: string, value: boolean) => {
    onUpdate('settings', {
      ...settings,
      [key]: value
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Sektioner att visa</h3>
        <p className="text-xs text-gray-500 mb-4">
          Välj vilka sektioner som ska visas på din publika sida
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Om oss</div>
              <div className="text-xs text-gray-500">Beskrivning och bilder</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.showAbout !== false}
            onChange={(e) => handleToggle('showAbout', e.target.checked)}
            className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Kontakt</div>
              <div className="text-xs text-gray-500">Kontaktinformation och öppettider</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.showContact !== false}
            onChange={(e) => handleToggle('showContact', e.target.checked)}
            className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Karta</div>
              <div className="text-xs text-gray-500">Google Maps</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.showMap !== false}
            onChange={(e) => handleToggle('showMap', e.target.checked)}
            className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Omdömen</div>
              <div className="text-xs text-gray-500">Recensioner från kunder</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.showReviews !== false}
            onChange={(e) => handleToggle('showReviews', e.target.checked)}
            className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Frågor & Svar (FAQ)</div>
              <div className="text-xs text-gray-500">Vanliga frågor från kunder</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.showFAQ !== false}
            onChange={(e) => handleToggle('showFAQ', e.target.checked)}
            className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
          />
        </label>
      </div>
    </div>
  )
}

// New StadTab for städ/cleaning specific features
function StadTab({ company, onUpdate }: any) {
  const features = company.stadFeatures || []
  const equipment = company.equipment || []
  const [customFeature, setCustomFeature] = useState('')

  const handleFeatureToggle = (featureId: string) => {
    const updated = features.includes(featureId)
      ? features.filter((f: string) => f !== featureId)
      : [...features, featureId]
    onUpdate('stadFeatures', updated)
  }

  const handleEquipmentToggle = (equipmentId: string) => {
    const updated = equipment.includes(equipmentId)
      ? equipment.filter((e: string) => e !== equipmentId)
      : [...equipment, equipmentId]
    onUpdate('equipment', updated)
  }

  const handleAddCustomFeature = () => {
    if (!customFeature.trim()) return
    const customFeatures = company.customFeatures || []
    onUpdate('customFeatures', [...customFeatures, customFeature.trim()])
    setCustomFeature('')
  }

  const handleRemoveCustomFeature = (index: number) => {
    const customFeatures = company.customFeatures || []
    onUpdate('customFeatures', customFeatures.filter((_: string, i: number) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Städ Features */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">🧹 Städtjänst-funktioner</h3>
        <p className="text-xs text-gray-500 mb-3">Markera vad som gäller för ert företag</p>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stadFeatures.map((feature) => (
            <label 
              key={feature.id} 
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                features.includes(feature.id) ? 'bg-brand/10 border border-brand/30' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <input
                type="checkbox"
                checked={features.includes(feature.id)}
                onChange={() => handleFeatureToggle(feature.id)}
                className="w-4 h-4 mt-0.5 text-brand border-gray-300 rounded focus:ring-brand"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{feature.label}</div>
                <div className="text-xs text-gray-500">{feature.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Features */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">✨ Egna funktioner</h3>
        <p className="text-xs text-gray-500 mb-3">Lägg till egna unika funktioner</p>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={customFeature}
            onChange={(e) => setCustomFeature(e.target.value)}
            placeholder="T.ex. Allergivänlig städning"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomFeature()}
          />
          <button
            onClick={handleAddCustomFeature}
            className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition"
          >
            <HiPlus className="w-4 h-4" />
          </button>
        </div>

        {(company.customFeatures || []).length > 0 && (
          <div className="space-y-2">
            {(company.customFeatures || []).map((feature: string, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-900">✓ {feature}</span>
                <button
                  onClick={() => handleRemoveCustomFeature(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">🧰 Utrustning vi tar med</h3>
        <p className="text-xs text-gray-500 mb-3">Markera vilken utrustning ni tillhandahåller</p>
        
        <div className="grid grid-cols-2 gap-2">
          {equipmentOptions.map((item) => (
            <label 
              key={item.id}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition ${
                equipment.includes(item.id) ? 'bg-brand/10 text-brand font-medium' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <input
                type="checkbox"
                checked={equipment.includes(item.id)}
                onChange={() => handleEquipmentToggle(item.id)}
                className="w-3 h-3 text-brand border-gray-300 rounded focus:ring-brand"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      {/* Minimum booking */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📏 Minsta bokning</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Minsta antal timmar</label>
            <select
              value={company.minHours || ''}
              onChange={(e) => onUpdate('minHours', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
            >
              <option value="">Ingen gräns</option>
              <option value="1">1 timme</option>
              <option value="2">2 timmar</option>
              <option value="3">3 timmar</option>
              <option value="4">4 timmar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Minsta yta (kvm)</label>
            <input
              type="number"
              value={company.minArea || ''}
              onChange={(e) => onUpdate('minArea', e.target.value)}
              placeholder="T.ex. 40"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
            />
          </div>
        </div>
      </div>

      {/* Pricing info */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">💰 Prisinformation</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Timpris (från)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={company.hourlyRate || ''}
                onChange={(e) => onUpdate('hourlyRate', Number(e.target.value))}
                placeholder="350"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
              />
              <span className="text-sm text-gray-500">kr/tim</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pris per kvm (från)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={company.sqmRate || ''}
                onChange={(e) => onUpdate('sqmRate', Number(e.target.value))}
                placeholder="5"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
              />
              <span className="text-sm text-gray-500">kr/kvm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Opening Hours Tab
function OpeningHoursTab({ company, onUpdate }: any) {
  const openingHours = company.openingHours || {}

  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    const currentDay = openingHours[day] || { open: '08:00', close: '17:00', closed: false }
    onUpdate('openingHours', {
      ...openingHours,
      [day]: { ...currentDay, [field]: value }
    })
  }

  const applyToAllWeekdays = () => {
    const mondayHours = openingHours.monday || { open: '08:00', close: '17:00', closed: false }
    const updated: any = {}
    weekDays.forEach(day => {
      if (day.key !== 'saturday' && day.key !== 'sunday') {
        updated[day.key] = { ...mondayHours }
      } else {
        updated[day.key] = openingHours[day.key] || { open: '10:00', close: '15:00', closed: true }
      }
    })
    onUpdate('openingHours', updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">🕐 Öppettider</h3>
        <button
          onClick={applyToAllWeekdays}
          className="text-xs text-brand hover:text-brand-dark font-medium"
        >
          Kopiera mån till vardagar
        </button>
      </div>
      <p className="text-xs text-gray-500">Ange era öppettider för varje dag</p>

      <div className="space-y-3">
        {weekDays.map((day) => {
          const hours = openingHours[day.key] || { open: '08:00', close: '17:00', closed: false }
          return (
            <div 
              key={day.key} 
              className={`p-3 rounded-lg ${hours.closed ? 'bg-gray-100' : 'bg-green-50 border border-green-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{day.label}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className={`text-xs ${hours.closed ? 'text-red-600' : 'text-green-600'}`}>
                    {hours.closed ? 'Stängt' : 'Öppet'}
                  </span>
                  <div 
                    onClick={() => handleHoursChange(day.key, 'closed', !hours.closed)}
                    className={`relative w-10 h-5 rounded-full cursor-pointer transition ${
                      hours.closed ? 'bg-gray-300' : 'bg-green-500'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      hours.closed ? 'left-0.5' : 'left-5'
                    }`} />
                  </div>
                </label>
              </div>
              
              {!hours.closed && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleHoursChange(day.key, 'open', e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:border-brand outline-none"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleHoursChange(day.key, 'close', e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:border-brand outline-none"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick presets */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs font-medium text-gray-700 mb-2">Snabbval</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              const preset: any = {}
              weekDays.forEach(day => {
                preset[day.key] = day.key === 'saturday' || day.key === 'sunday'
                  ? { open: '10:00', close: '15:00', closed: true }
                  : { open: '08:00', close: '17:00', closed: false }
              })
              onUpdate('openingHours', preset)
            }}
            className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Vardagar 8-17
          </button>
          <button
            onClick={() => {
              const preset: any = {}
              weekDays.forEach(day => {
                preset[day.key] = { open: '07:00', close: '19:00', closed: false }
              })
              onUpdate('openingHours', preset)
            }}
            className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Alla dagar 7-19
          </button>
          <button
            onClick={() => {
              const preset: any = {}
              weekDays.forEach(day => {
                preset[day.key] = { open: '06:00', close: '22:00', closed: false }
              })
              onUpdate('openingHours', preset)
            }}
            className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Utökad 6-22
          </button>
          <button
            onClick={() => {
              const preset: any = {}
              weekDays.forEach(day => {
                preset[day.key] = { open: '00:00', close: '23:59', closed: false }
              })
              onUpdate('openingHours', preset)
            }}
            className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Dygnet runt
          </button>
        </div>
      </div>
    </div>
  )
}
