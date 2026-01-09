'use client'

import { useState, useCallback } from 'react'
import { updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import EditToolbar from './EditToolbar'
import EditSidebar from './EditSidebar'
import EditableHero from './sections/EditableHero'
import EditableServices from './sections/EditableServices'
import EditableAbout from './sections/EditableAbout'
import EditableContact from './sections/EditableContact'
import PreviewMode from './PreviewMode'
import EditableFAQ from './sections/EditableFAQ'

interface LiveEditorProps {
  company: any
  onUpdate: (company: any) => void
}

export default function LiveEditor({ company, onUpdate }: LiveEditorProps) {
  const [editMode, setEditMode] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [localChanges, setLocalChanges] = useState<any>({})
  const [showSidebar, setShowSidebar] = useState(true)

  // Auto-save changes
  const saveChanges = useCallback(async (updates: any) => {
    if (!db) return

    setIsSaving(true)
    try {
      const companyRef = doc(db, 'companies', company.id)
      await updateDoc(companyRef, {
        ...updates,
        updatedAt: new Date()
      })
      
      const updatedCompany = { ...company, ...updates }
      onUpdate(updatedCompany)
      setLocalChanges({})
      
      return true
    } catch (error) {
      console.error('Error saving:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [company, onUpdate])

  // Update local state and prepare for save
  const handleUpdate = useCallback((field: string, value: any) => {
    const updates = { ...localChanges, [field]: value }
    setLocalChanges(updates)
    
    // Debounced auto-save (1.5 seconds)
    const timeoutId = setTimeout(() => {
      saveChanges(updates)
    }, 1500)

    return () => clearTimeout(timeoutId)
  }, [localChanges, saveChanges])

  // Manual save
  const handleSave = useCallback(async () => {
    if (Object.keys(localChanges).length > 0) {
      await saveChanges(localChanges)
    }
  }, [localChanges, saveChanges])

  // Get current data (local changes override company data)
  const getCurrentData = () => ({
    ...company,
    ...localChanges
  })

  const currentData = getCurrentData()

  if (!editMode) {
    return <PreviewMode company={currentData} onBack={() => setEditMode(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <EditToolbar
        isSaving={isSaving}
        hasChanges={Object.keys(localChanges).length > 0}
        onSave={handleSave}
        onPreview={() => setEditMode(false)}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        companyId={company.id}
      />

      <div className="flex">
        {/* Main Editor Area */}
        <div className={`flex-1 transition-all duration-300 ${showSidebar ? 'mr-80' : ''}`}>
          <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Hero Section */}
            <EditableHero
              data={currentData}
              isActive={activeSection === 'hero'}
              onActivate={() => setActiveSection('hero')}
              onUpdate={handleUpdate}
            />

            {/* Services Section */}
            <EditableServices
              services={currentData.services || []}
              isActive={activeSection === 'services'}
              onActivate={() => setActiveSection('services')}
              onUpdate={(services) => handleUpdate('services', services)}
            />

            {/* About Section */}
            <EditableAbout
              description={currentData.description || ''}
              images={currentData.images || []}
              isActive={activeSection === 'about'}
              onActivate={() => setActiveSection('about')}
              onUpdate={handleUpdate}
            />

            <EditableFAQ
              faqs={currentData.faqs || []}
              isActive={activeSection === 'faq'}
              onActivate={() => setActiveSection('faq')}
              onUpdate={(faqs) => handleUpdate('faqs', faqs)}
            />

            {/* Contact Section */}
            <EditableContact
              data={currentData}
              isActive={activeSection === 'contact'}
              onActivate={() => setActiveSection('contact')}
              onUpdate={handleUpdate}
            />
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <EditSidebar
            company={currentData}
            activeSection={activeSection}
            onUpdate={handleUpdate}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  )
}
