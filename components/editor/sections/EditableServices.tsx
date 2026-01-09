'use client'

import { useState } from 'react'
import { HiPencil, HiPlus, HiTrash, HiDuplicate, HiClock, HiCurrencyDollar, HiChevronDown, HiChevronUp } from 'react-icons/hi'

interface ServiceOption {
  id: string
  name: string
  price: number
  included: boolean
}

interface Service {
  name: string
  price: number
  priceType?: 'fixed' | 'range' | 'quote'
  priceMax?: number
  duration?: number
  durationFlexible?: boolean
  category?: string
  description?: string
  options?: ServiceOption[]
}

// Common städ/cleaning service templates
const serviceTemplates = [
  { name: 'Hemstädning', price: 350, duration: 120, category: 'Städning' },
  { name: 'Flyttstädning', price: 2500, duration: 240, category: 'Städning' },
  { name: 'Storstädning', price: 1500, duration: 180, category: 'Städning' },
  { name: 'Kontorsstädning', price: 500, duration: 90, category: 'Städning' },
  { name: 'Fönsterputs', price: 200, duration: 60, category: 'Städning' },
  { name: 'Trappstädning', price: 300, duration: 45, category: 'Städning' },
  { name: 'Byggstädning', price: 3000, duration: 300, category: 'Städning' },
  { name: 'Golvvård', price: 400, duration: 90, category: 'Städning' },
]

// Common tillval/options for städ services
const optionTemplates = [
  { name: 'Fönsterputs', price: 200, included: false },
  { name: 'Strykning', price: 150, included: false },
  { name: 'Ugnsrengöring', price: 250, included: false },
  { name: 'Kylskåpsrengöring', price: 150, included: false },
  { name: 'Balkong/Uteplats', price: 200, included: false },
  { name: 'Tvättmaskin/Torktumlare', price: 100, included: false },
  { name: 'Garderober invändigt', price: 150, included: false },
  { name: 'Städmaterial ingår', price: 0, included: true },
]

interface EditableServicesProps {
  services: Service[]
  isActive: boolean
  onActivate: () => void
  onUpdate: (services: Service[]) => void
}

export default function EditableServices({ services, isActive, onActivate, onUpdate }: EditableServicesProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [expandedOptions, setExpandedOptions] = useState<number | null>(null)

  const handleAddService = () => {
    const newService: Service = {
      name: 'Ny tjänst',
      price: 0,
      priceType: 'fixed',
      duration: 60,
      durationFlexible: false,
      description: '',
      options: []
    }
    onUpdate([...services, newService])
    setEditingIndex(services.length)
  }

  const handleAddFromTemplate = (template: typeof serviceTemplates[0]) => {
    const newService: Service = {
      ...template,
      priceType: 'fixed',
      durationFlexible: false,
      description: '',
      options: []
    }
    onUpdate([...services, newService])
    setEditingIndex(services.length)
    setShowTemplates(false)
  }

  const handleUpdateService = (index: number, field: keyof Service, value: any) => {
    const updated = services.map((s, i) => 
      i === index ? { ...s, [field]: value } : s
    )
    onUpdate(updated)
  }

  const handleRemoveService = (index: number) => {
    onUpdate(services.filter((_, i) => i !== index))
  }

  const handleDuplicateService = (index: number) => {
    const serviceToDuplicate = { ...services[index], options: [...(services[index].options || [])] }
    onUpdate([...services, serviceToDuplicate])
  }

  // Option management
  const handleAddOption = (serviceIndex: number, template?: typeof optionTemplates[0]) => {
    const service = services[serviceIndex]
    const newOption: ServiceOption = template 
      ? { ...template, id: Date.now().toString() }
      : { id: Date.now().toString(), name: '', price: 0, included: false }
    
    handleUpdateService(serviceIndex, 'options', [...(service.options || []), newOption])
  }

  const handleUpdateOption = (serviceIndex: number, optionId: string, field: keyof ServiceOption, value: any) => {
    const service = services[serviceIndex]
    const updatedOptions = (service.options || []).map(opt => 
      opt.id === optionId ? { ...opt, [field]: value } : opt
    )
    handleUpdateService(serviceIndex, 'options', updatedOptions)
  }

  const handleRemoveOption = (serviceIndex: number, optionId: string) => {
    const service = services[serviceIndex]
    handleUpdateService(serviceIndex, 'options', (service.options || []).filter(opt => opt.id !== optionId))
  }

  // Format price for display
  const formatPrice = (service: Service) => {
    if (service.priceType === 'quote') return 'Offert'
    if (service.priceType === 'range' && service.priceMax) return `${service.price}-${service.priceMax} kr`
    return `${service.price} kr`
  }

  return (
    <div
      onClick={onActivate}
      className={`relative mb-8 rounded-2xl bg-white border-2 transition-all ${
        isActive ? 'border-brand shadow-xl' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {isActive && (
            <div className="bg-brand text-white px-3 py-1 rounded-full text-sm font-medium">
              <HiPencil className="inline w-4 h-4 mr-1" />
              Redigera
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900">Tjänster & Priser</h2>
          <span className="text-sm text-gray-500">({services.length} tjänster)</span>
        </div>
        {isActive && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTemplates(!showTemplates)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                🧹 Mallar
                <HiChevronDown className="w-4 h-4" />
              </button>
              {showTemplates && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  <div className="p-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-medium text-gray-500">Vanliga städtjänster</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {serviceTemplates.map((template, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddFromTemplate(template)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center justify-between"
                      >
                        <span className="font-medium text-gray-900">{template.name}</span>
                        <span className="text-sm text-gray-500">{template.price} kr</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleAddService()
              }}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition font-medium"
            >
              <HiPlus className="w-5 h-5" />
              Ny tjänst
            </button>
          </div>
        )}
      </div>

      {/* Services Grid */}
      <div className="p-6">
        {services.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">Inga tjänster ännu</p>
            {isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddService()
                }}
                className="text-brand hover:text-brand-dark font-medium"
              >
                Lägg till första tjänsten
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service, index) => (
              <div
                key={index}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  editingIndex === index
                    ? 'border-brand bg-brand/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={(e) => {
                  if (isActive) {
                    e.stopPropagation()
                    setEditingIndex(index)
                  }
                }}
              >
                {isActive && editingIndex === index ? (
                  <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* Service Name & Category */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Tjänstens namn *
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => handleUpdateService(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Kategori
                        </label>
                        <input
                          type="text"
                          value={service.category || ''}
                          onChange={(e) => handleUpdateService(index, 'category', e.target.value)}
                          placeholder="t.ex. Städning"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                        />
                      </div>
                    </div>

                    {/* Price Type Selection */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Pristyp</label>
                      <div className="flex gap-2">
                        {[
                          { id: 'fixed', label: '💵 Fast pris' },
                          { id: 'range', label: '📊 Prisintervall' },
                          { id: 'quote', label: '📋 Offert' },
                        ].map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => handleUpdateService(index, 'priceType', type.id)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition ${
                              (service.priceType || 'fixed') === type.id
                                ? 'bg-brand text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price & Duration */}
                    {(service.priceType || 'fixed') !== 'quote' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {service.priceType === 'range' ? 'Från (kr)' : 'Pris (kr)'}
                          </label>
                          <input
                            type="number"
                            value={service.price}
                            onChange={(e) => handleUpdateService(index, 'price', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                          />
                        </div>
                        {service.priceType === 'range' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Till (kr)</label>
                            <input
                              type="number"
                              value={service.priceMax || ''}
                              onChange={(e) => handleUpdateService(index, 'priceMax', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tid</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={service.duration || ''}
                          onChange={(e) => handleUpdateService(index, 'duration', Number(e.target.value))}
                          disabled={service.durationFlexible}
                          placeholder="60"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm disabled:bg-gray-100"
                        />
                        <span className="text-xs text-gray-500">min</span>
                        <label className="flex items-center gap-2 text-xs cursor-pointer px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                          <input
                            type="checkbox"
                            checked={service.durationFlexible || false}
                            onChange={(e) => handleUpdateService(index, 'durationFlexible', e.target.checked)}
                            className="w-3 h-3 rounded border-gray-300 text-brand"
                          />
                          Varierar
                        </label>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Beskrivning</label>
                      <textarea
                        value={service.description || ''}
                        onChange={(e) => handleUpdateService(index, 'description', e.target.value)}
                        placeholder="Beskriv vad som ingår i tjänsten..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm resize-none"
                      />
                    </div>

                    {/* Options/Tillval Section */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => setExpandedOptions(expandedOptions === index ? null : index)}
                          className="flex items-center gap-2 text-sm font-medium text-gray-700"
                        >
                          {expandedOptions === index ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
                          ⚙️ Tillval & Alternativ ({(service.options || []).length})
                        </button>
                        <button
                          onClick={() => handleAddOption(index)}
                          className="text-xs text-brand hover:text-brand-dark font-medium flex items-center gap-1"
                        >
                          <HiPlus className="w-3 h-3" /> Lägg till
                        </button>
                      </div>

                      {expandedOptions === index && (
                        <div className="space-y-3">
                          {/* Quick add from templates */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {optionTemplates.slice(0, 4).map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => handleAddOption(index, opt)}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
                              >
                                + {opt.name}
                              </button>
                            ))}
                          </div>

                          {/* Options list */}
                          {(service.options || []).map((opt) => (
                            <div key={opt.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <input
                                type="text"
                                value={opt.name}
                                onChange={(e) => handleUpdateOption(index, opt.id, 'name', e.target.value)}
                                placeholder="Tillvalsnamn"
                                className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded focus:border-brand outline-none"
                              />
                              <input
                                type="number"
                                value={opt.price}
                                onChange={(e) => handleUpdateOption(index, opt.id, 'price', Number(e.target.value))}
                                placeholder="0"
                                className="w-16 px-2 py-1.5 text-sm border border-gray-200 rounded focus:border-brand outline-none"
                              />
                              <span className="text-xs text-gray-500">kr</span>
                              <label className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer ${opt.included ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                <input
                                  type="checkbox"
                                  checked={opt.included}
                                  onChange={(e) => handleUpdateOption(index, opt.id, 'included', e.target.checked)}
                                  className="w-3 h-3"
                                />
                                {opt.included ? 'Ingår' : 'Tillägg'}
                              </label>
                              <button
                                onClick={() => handleRemoveOption(index, opt.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <HiTrash className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {(service.options || []).length === 0 && (
                            <p className="text-xs text-gray-400 italic text-center py-2">
                              Lägg till tillval som fönsterputs, strykning etc.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                      >
                        ✓ Klar
                      </button>
                      <button
                        onClick={() => handleDuplicateService(index)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                      >
                        <HiDuplicate className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveService(index)}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        {service.category && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{service.category}</span>
                        )}
                      </div>
                      <span className="text-lg font-bold text-brand">{formatPrice(service)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {service.durationFlexible ? (
                        <span>⏱️ Tid varierar</span>
                      ) : service.duration ? (
                        <span>⏱️ {service.duration} min</span>
                      ) : null}
                      {(service.options || []).length > 0 && (
                        <span>⚙️ {(service.options || []).length} tillval</span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{service.description}</p>
                    )}
                  </div>
                )}

                {isActive && editingIndex !== index && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingIndex(index)
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
                    >
                      <HiPencil className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
