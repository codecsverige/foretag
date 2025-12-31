'use client'

import { HiArrowLeft, HiEye, HiSave, HiCog, HiMenu, HiCheckCircle } from 'react-icons/hi'
import Link from 'next/link'

interface EditToolbarProps {
  isSaving: boolean
  hasChanges: boolean
  onSave: () => void
  onPreview: () => void
  onToggleSidebar: () => void
  companyId: string
}

export default function EditToolbar({
  isSaving,
  hasChanges,
  onSave,
  onPreview,
  onToggleSidebar,
  companyId
}: EditToolbarProps) {
  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-full mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <Link
              href="/konto"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <HiArrowLeft className="w-5 h-5" />
              <span className="font-medium">Tillbaka</span>
            </Link>

            <div className="h-6 w-px bg-gray-300"></div>

            <h1 className="text-lg font-bold text-gray-900">
              Redigera din sida
            </h1>
          </div>

          {/* Center Section - Status */}
          <div className="flex items-center gap-2">
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
                <span>Sparar...</span>
              </div>
            )}
            {!isSaving && hasChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                <span>Osparade ändringar</span>
              </div>
            )}
            {!isSaving && !hasChanges && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <HiCheckCircle className="w-4 h-4" />
                <span>Allt sparat</span>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="Visa/dölj sidopanel"
            >
              <HiMenu className="w-5 h-5" />
            </button>

            <button
              onClick={onPreview}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
            >
              <HiEye className="w-5 h-5" />
              <span>Förhandsgranska</span>
            </button>

            {hasChanges && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-white hover:bg-brand-dark rounded-lg font-medium transition disabled:opacity-50"
              >
                <HiSave className="w-5 h-5" />
                <span>{isSaving ? 'Sparar...' : 'Spara nu'}</span>
              </button>
            )}

            <Link
              href={`/foretag/${companyId}`}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
            >
              <span>Visa publik sida</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
