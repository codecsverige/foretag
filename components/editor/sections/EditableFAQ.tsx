'use client'

import { useState } from 'react'
import { HiPencil, HiPlus, HiTrash } from 'react-icons/hi'

export interface FAQItem {
  id: string
  question: string
  answer: string
}

interface EditableFAQProps {
  faqs: FAQItem[]
  isActive: boolean
  onActivate: () => void
  onUpdate: (faqs: FAQItem[]) => void
}

export default function EditableFAQ({ faqs, isActive, onActivate, onUpdate }: EditableFAQProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleAdd = () => {
    const newItem: FAQItem = {
      id: Date.now().toString(),
      question: '',
      answer: ''
    }
    onUpdate([...(faqs || []), newItem])
    setEditingIndex((faqs || []).length)
  }

  const handleUpdate = (index: number, field: keyof FAQItem, value: string) => {
    const updated = (faqs || []).map((f, i) => (i === index ? { ...f, [field]: value } : f))
    onUpdate(updated)
  }

  const handleRemove = (index: number) => {
    const updated = (faqs || []).filter((_, i) => i !== index)
    onUpdate(updated)
    setEditingIndex(null)
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
          <h2 className="text-2xl font-bold text-gray-900">Frågor & Svar (FAQ)</h2>
          <span className="text-sm text-gray-500">({faqs?.length || 0})</span>
        </div>
        {isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAdd()
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition font-medium"
          >
            <HiPlus className="w-5 h-5" />
            Ny fråga
          </button>
        )}
      </div>

      {/* List */}
      <div className="p-6 space-y-4">
        {(faqs || []).length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Inga frågor ännu. Lägg till vanliga frågor dina kunder brukar ställa.
          </div>
        )}

        {(faqs || []).map((item, index) => (
          <div
            key={item.id}
            className={`group relative rounded-xl border ${
              isActive && editingIndex === index ? 'border-brand' : 'border-gray-200 hover:border-gray-300'
            } bg-white p-4`}
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fråga</label>
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => handleUpdate(index, 'question', e.target.value)}
                    placeholder="t.ex. Ingår fönsterputs i flyttstädning?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Svar</label>
                  <textarea
                    value={item.answer}
                    onChange={(e) => handleUpdate(index, 'answer', e.target.value)}
                    placeholder="Beskriv svaret tydligt..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="px-3 py-2 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                  >
                    ✓ Klar
                  </button>
                  <button
                    onClick={() => handleRemove(index)}
                    className="px-3 py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-1"
                  >
                    <HiTrash className="w-4 h-4" /> Ta bort
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-gray-900">{item.question || 'Ny fråga'}</h3>
                </div>
                {item.answer && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.answer}</p>
                )}
                {isActive && editingIndex !== index && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingIndex(index)
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      Redigera
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
