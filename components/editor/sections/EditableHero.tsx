'use client'

import { useState, useRef } from 'react'
import { HiPencil, HiPhotograph, HiTrash, HiPlus } from 'react-icons/hi'
import Image from 'next/image'
import { storage } from '@/lib/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '@/context/AuthContext'

interface EditableHeroProps {
  data: any
  isActive: boolean
  onActivate: () => void
  onUpdate: (field: string, value: any) => void
}

export default function EditableHero({ data, isActive, onActivate, onUpdate }: EditableHeroProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const images = Array.isArray(data.images) ? data.images : []

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !storage || !user) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
        const fileRef = storageRef(storage, `companies/${user.uid}/${fileId}`)
        await uploadBytes(fileRef, file)
        return await getDownloadURL(fileRef)
      })

      const newUrls = await Promise.all(uploadPromises)
      onUpdate('images', [...images, ...newUrls])
    } catch (error) {
      console.error('Upload error:', error)
      alert('Kunde inte ladda upp bilder')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onUpdate('images', newImages)
  }

  const handleReorderImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [removed] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, removed)
    onUpdate('images', newImages)
  }

  return (
    <div
      onClick={onActivate}
      className={`relative mb-8 rounded-2xl overflow-hidden transition-all ${
        isActive ? 'ring-4 ring-brand shadow-xl' : 'hover:ring-2 hover:ring-gray-300'
      }`}
    >
      {/* Active Badge */}
      {isActive && (
        <div className="absolute top-4 left-4 z-20 bg-brand text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          <HiPencil className="inline w-4 h-4 mr-1" />
          Redigera Hero
        </div>
      )}

      {/* Images Grid */}
      <div className="relative aspect-[21/9] bg-gradient-to-br from-brand/10 to-blue-50">
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 h-full p-4">
            {images.slice(0, 3).map((img: string, idx: number) => (
              <div key={idx} className="relative group">
                <Image
                  src={img}
                  alt={`${data.name} - ${idx + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                {isActive && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveImage(idx)
                      }}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                      <HiTrash className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <HiPhotograph className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Inga bilder uppladdade</p>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {isActive && (
          <div className="absolute bottom-4 right-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg shadow-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand"></div>
                  <span>Laddar upp...</span>
                </>
              ) : (
                <>
                  <HiPlus className="w-5 h-5" />
                  <span>Lägg till bilder</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Title Section */}
      <div className="p-6 bg-white">
        {isActive ? (
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => onUpdate('name', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="text-3xl font-bold text-gray-900 w-full border-2 border-brand/30 rounded-lg px-4 py-2 focus:outline-none focus:border-brand"
            placeholder="Företagsnamn"
          />
        ) : (
          <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
        )}

        <div className="flex items-center gap-4 mt-3 text-gray-600">
          {isActive ? (
            <>
              <input
                type="text"
                value={data.categoryName || data.category || ''}
                onChange={(e) => onUpdate('categoryName', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="Kategori"
              />
              <input
                type="text"
                value={data.city || ''}
                onChange={(e) => onUpdate('city', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="Stad"
              />
            </>
          ) : (
            <>
              <span>{data.categoryName || data.category}</span>
              <span>•</span>
              <span>{data.city}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
