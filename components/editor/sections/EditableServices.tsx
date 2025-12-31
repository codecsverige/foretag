'use client'

import { useState } from 'react'
import { HiPencil, HiPlus, HiTrash, HiDuplicate } from 'react-icons/hi'

interface Service {
  name: string
  price: number
  duration?: number
  category?: string
}

interface EditableServicesProps {
  services: Service[]
  isActive: boolean
  onActivate: () => void
  onUpdate: (services: Service[]) => void
}

export default function EditableServices({ services, isActive, onActivate, onUpdate }: EditableServicesProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleAddService = () => {
    const newService: Service = {
      name: 'Ny tjänst',
      price: 0,
      duration: 60
    }
    onUpdate([...services, newService])
    setEditingIndex(services.length)
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
    const serviceToDuplicate = { ...services[index] }
    onUpdate([...services, serviceToDuplicate])
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
          <h2 className="text-2xl font-bold text-gray-900">Tjänster</h2>
        </div>
        {isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAddService()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition font-medium"
          >
            <HiPlus className="w-5 h-5" />
            Lägg till tjänst
          </button>
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
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tjänstens namn
                      </label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => handleUpdateService(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pris (kr)
                        </label>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => handleUpdateService(index, 'price', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Tid (min)
                        </label>
                        <input
                          type="number"
                          value={service.duration || ''}
                          onChange={(e) => handleUpdateService(index, 'duration', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleDuplicateService(index)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                      >
                        <HiDuplicate className="w-4 h-4" />
                        Duplicera
                      </button>
                      <button
                        onClick={() => handleRemoveService(index)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                      >
                        <HiTrash className="w-4 h-4" />
                        Ta bort
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <span className="text-lg font-bold text-brand">{service.price} kr</span>
                    </div>
                    {service.duration && (
                      <p className="text-sm text-gray-500">{service.duration} min</p>
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
