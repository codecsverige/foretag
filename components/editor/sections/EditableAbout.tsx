'use client'

import { HiPencil } from 'react-icons/hi'

interface EditableAboutProps {
  description: string
  images: string[]
  isActive: boolean
  onActivate: () => void
  onUpdate: (field: string, value: any) => void
}

export default function EditableAbout({ description, images, isActive, onActivate, onUpdate }: EditableAboutProps) {
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
        <h2 className="text-2xl font-bold text-gray-900">Om oss</h2>
      </div>

      {/* Content */}
      <div className="p-6">
        {isActive ? (
          <div onClick={(e) => e.stopPropagation()}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beskrivning
            </label>
            <textarea
              value={description}
              onChange={(e) => onUpdate('description', e.target.value)}
              placeholder="Berätta om ditt företag, era tjänster och vad som gör er unika..."
              rows={8}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            />
            <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
              <span>{description.length} tecken</span>
              <span>Max 2000 tecken rekommenderas</span>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none">
            {description ? (
              <p className="text-gray-700 whitespace-pre-line">{description}</p>
            ) : (
              <p className="text-gray-400 italic">Ingen beskrivning ännu. Klicka för att lägga till.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
