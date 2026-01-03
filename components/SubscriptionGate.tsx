'use client'

import { HiLockClosed, HiStar, HiSparkles } from 'react-icons/hi'
import Link from 'next/link'

interface SubscriptionGateProps {
  type: 'booking' | 'edit' | 'delete' | 'discount' | 'phone'
  lockedCount?: number
  currentPlan?: string
  children?: React.ReactNode
}

export default function SubscriptionGate({ type, lockedCount = 0, currentPlan = 'free' }: SubscriptionGateProps) {
  const messages = {
    booking: {
      title: 'Nya bokningar väntar!',
      description: `Du har ${lockedCount} låsta bokningar. Uppgradera för att se alla dina kunder.`,
      icon: HiLockClosed,
      color: 'amber'
    },
    edit: {
      title: 'Redigeringsgräns nådd',
      description: 'Du har använt din gratis redigering. Uppgradera för obegränsade ändringar.',
      icon: HiLockClosed,
      color: 'blue'
    },
    delete: {
      title: 'Borttagningsgräns nådd',
      description: 'Du har använt din gratis borttagning. Uppgradera för att ta bort fler annonser.',
      icon: HiLockClosed,
      color: 'red'
    },
    discount: {
      title: 'Premium-funktion',
      description: 'Kampanjer och rabatter är tillgängliga för Premium-användare.',
      icon: HiSparkles,
      color: 'purple'
    },
    phone: {
      title: 'Telefonnummer dolt',
      description: 'Uppgradera till Pro för att visa ditt telefonnummer helt för kunder.',
      icon: HiLockClosed,
      color: 'green'
    }
  }

  const { title, description, icon: Icon, color } = messages[type]

  const colorClasses = {
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    green: 'bg-green-50 border-green-200 text-green-800'
  }

  const buttonClasses = {
    amber: 'bg-amber-500 hover:bg-amber-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    red: 'bg-red-500 hover:bg-red-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    green: 'bg-green-500 hover:bg-green-600'
  }

  return (
    <div className={`rounded-xl border-2 p-6 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full bg-white/50`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          <p className="text-sm opacity-80 mb-4">{description}</p>
          
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/konto?tab=subscription" 
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition ${buttonClasses[color as keyof typeof buttonClasses]}`}
            >
              <HiStar className="w-4 h-4" />
              Uppgradera nu
            </Link>
            
            {type === 'booking' && (
              <span className="inline-flex items-center px-3 py-2 rounded-lg bg-white/50 text-sm font-medium">
                Från 199 kr/mån
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Locked booking card component
export function LockedBookingCard({ index }: { index: number }) {
  return (
    <div className="bg-gray-100 rounded-xl p-4 border-2 border-dashed border-gray-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200/50 to-transparent" />
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
          <HiLockClosed className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-48" />
        </div>
        <div className="text-right">
          <div className="h-4 bg-gray-300 rounded w-20 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
        <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1.5">
          <HiLockClosed className="w-4 h-4" />
          Bokning #{index + 1} - Låst
        </span>
      </div>
    </div>
  )
}

// Phone number display component
export function PhoneDisplay({ phone, showFull, onUpgrade }: { phone: string; showFull: boolean; onUpgrade?: () => void }) {
  const formatPhone = (phone: string, full: boolean): string => {
    if (!phone) return ''
    if (full) return phone
    
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 6) return phone
    
    const start = cleaned.slice(0, 2)
    const end = cleaned.slice(-2)
    
    if (cleaned.length === 10) {
      return `${start}X XXX XX ${end}`
    }
    
    return `${start}${'X'.repeat(cleaned.length - 4)}${end}`
  }

  return (
    <div className="flex items-center gap-2">
      <span className={showFull ? '' : 'text-gray-500'}>{formatPhone(phone, showFull)}</span>
      {!showFull && (
        <button 
          onClick={onUpgrade}
          className="text-xs text-brand hover:text-brand-dark font-medium flex items-center gap-1"
        >
          <HiLockClosed className="w-3 h-3" />
          Visa helt
        </button>
      )}
    </div>
  )
}

// Edit limit warning component
export function EditLimitWarning({ editsUsed, maxEdits }: { editsUsed: number; maxEdits: number }) {
  const remaining = maxEdits - editsUsed
  
  if (remaining > 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <div className="text-amber-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-amber-800">
            Du har <strong>{remaining}</strong> gratis redigering{remaining !== 1 ? 'ar' : ''} kvar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        <HiLockClosed className="w-5 h-5 text-red-600" />
        <div className="flex-1">
          <p className="text-sm text-red-800 font-medium">Redigeringsgränsen nådd</p>
          <p className="text-xs text-red-600">Uppgradera för obegränsade redigeringar</p>
        </div>
        <Link 
          href="/konto?tab=subscription" 
          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 transition"
        >
          Uppgradera
        </Link>
      </div>
    </div>
  )
}
