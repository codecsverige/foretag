'use client'

import { useState } from 'react'
import { HiCog, HiEye, HiOfficeBuilding } from 'react-icons/hi'

const allCities = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås',
  'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping',
  'Lund', 'Umeå', 'Gävle', 'Borås', 'Eskilstuna', 'Sundsvall',
  'Karlstad', 'Växjö', 'Halmstad', 'Trollhättan', 'Kalmar',
  'Kristianstad', 'Skellefteå', 'Uddevalla', 'Falun', 'Nyköping',
  'Varberg', 'Skövde', 'Östersund', 'Borlänge', 'Visby'
]

const paymentMethodOptions = [
  { value: 'swish', label: 'Swish' },
  { value: 'kort', label: 'Kort' },
  { value: 'faktura', label: 'Faktura' },
  { value: 'kontant', label: 'Kontant' }
]

interface EditSidebarProps {
  company: any
  activeSection: string | null
  onUpdate: (field: string, value: any) => void
  onSave: () => void
}

export default function EditSidebar({ company, activeSection, onUpdate, onSave }: EditSidebarProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'business' | 'visibility'>('settings')

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'settings'
              ? 'text-brand border-b-2 border-brand bg-brand/5'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <HiCog className="w-5 h-5 mx-auto mb-1" />
          Inställningar
        </button>
        <button
          onClick={() => setActiveTab('business')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'business'
              ? 'text-brand border-b-2 border-brand bg-brand/5'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <HiOfficeBuilding className="w-5 h-5 mx-auto mb-1" />
          Företag
        </button>
        <button
          onClick={() => setActiveTab('visibility')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'visibility'
              ? 'text-brand border-b-2 border-brand bg-brand/5'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <HiEye className="w-5 h-5 mx-auto mb-1" />
          Synlighet
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'settings' && (
          <SettingsTab company={company} onUpdate={onUpdate} />
        )}
        {activeTab === 'business' && (
          <BusinessTab company={company} onUpdate={onUpdate} />
        )}
        {activeTab === 'visibility' && (
          <VisibilityTab company={company} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  )
}

function SettingsTab({ company, onUpdate }: any) {
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

  return (
    <div className="space-y-6">
      <div>
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
      </div>
    </div>
  )
}
