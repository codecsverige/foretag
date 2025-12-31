'use client'

import { HiPencil, HiPhone, HiMail, HiGlobe, HiLocationMarker, HiClock } from 'react-icons/hi'

interface EditableContactProps {
  data: any
  isActive: boolean
  onActivate: () => void
  onUpdate: (field: string, value: any) => void
}

export default function EditableContact({ data, isActive, onActivate, onUpdate }: EditableContactProps) {
  const openingHours = data.openingHours || {}

  const handleHoursUpdate = (day: string, field: 'open' | 'close' | 'closed', value: any) => {
    const updated = {
      ...openingHours,
      [day]: {
        ...openingHours[day],
        [field]: field === 'closed' ? value : value,
      }
    }
    onUpdate('openingHours', updated)
  }

  const days = [
    { key: 'monday', label: 'Måndag' },
    { key: 'tuesday', label: 'Tisdag' },
    { key: 'wednesday', label: 'Onsdag' },
    { key: 'thursday', label: 'Torsdag' },
    { key: 'friday', label: 'Fredag' },
    { key: 'saturday', label: 'Lördag' },
    { key: 'sunday', label: 'Söndag' },
  ]

  return (
    <div
      onClick={onActivate}
      className={`relative mb-8 rounded-2xl bg-white border-2 transition-all ${
        isActive ? 'border-brand shadow-xl' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-200">
        {isActive && (
          <div className="bg-brand text-white px-3 py-1 rounded-full text-sm font-medium">
            <HiPencil className="inline w-4 h-4 mr-1" />
            Redigera
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900">Kontakt & Öppettider</h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isActive ? 'bg-gray-50' : ''}`}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <HiLocationMarker className="w-5 h-5 text-gray-400" />
              Adress
            </label>
            {isActive ? (
              <input
                type="text"
                value={data.address || ''}
                onChange={(e) => onUpdate('address', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="Gatuadress"
              />
            ) : (
              <p className="text-gray-900">{data.address || 'Ingen adress angiven'}</p>
            )}
          </div>

          <div className={`p-4 rounded-xl ${isActive ? 'bg-gray-50' : ''}`}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <HiPhone className="w-5 h-5 text-gray-400" />
              Telefon
            </label>
            {isActive ? (
              <input
                type="tel"
                value={data.phone || ''}
                onChange={(e) => onUpdate('phone', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="070-123 45 67"
              />
            ) : (
              <p className="text-gray-900">{data.phone || 'Inget telefonnummer'}</p>
            )}
          </div>

          <div className={`p-4 rounded-xl ${isActive ? 'bg-gray-50' : ''}`}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <HiMail className="w-5 h-5 text-gray-400" />
              E-post
            </label>
            {isActive ? (
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => onUpdate('email', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="info@foretag.se"
              />
            ) : (
              <p className="text-gray-900">{data.email || 'Ingen e-post'}</p>
            )}
          </div>

          <div className={`p-4 rounded-xl ${isActive ? 'bg-gray-50' : ''}`}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <HiGlobe className="w-5 h-5 text-gray-400" />
              Webbplats
            </label>
            {isActive ? (
              <input
                type="url"
                value={data.website || ''}
                onChange={(e) => onUpdate('website', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="https://foretag.se"
              />
            ) : (
              <p className="text-gray-900">{data.website || 'Ingen webbplats'}</p>
            )}
          </div>
        </div>

        {/* Opening Hours */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <HiClock className="w-6 h-6 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Öppettider</h3>
          </div>

          <div className="space-y-3">
            {days.map(({ key, label }) => {
              const hours = openingHours[key] || { open: '09:00', close: '17:00', closed: false }
              
              return (
                <div
                  key={key}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    isActive ? 'bg-gray-50' : ''
                  }`}
                  onClick={(e) => isActive && e.stopPropagation()}
                >
                  <div className="w-28 flex-shrink-0">
                    <span className="font-medium text-gray-900">{label}</span>
                  </div>

                  {isActive ? (
                    <>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(e) => handleHoursUpdate(key, 'closed', e.target.checked)}
                          className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                        />
                        <span className="text-sm text-gray-600">Stängt</span>
                      </label>

                      {!hours.closed && (
                        <>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleHoursUpdate(key, 'open', e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleHoursUpdate(key, 'close', e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex-1">
                      {hours.closed ? (
                        <span className="text-gray-500">Stängt</span>
                      ) : (
                        <span className="text-gray-900">{hours.open} - {hours.close}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
