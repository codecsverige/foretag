'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { addDoc, collection, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { HiCalendar, HiClock, HiUser, HiPhone, HiCheck } from 'react-icons/hi'

interface Service {
  name?: string
  price?: number
  duration?: number
}

type DiscountConfig = {
  enabled?: boolean
  label?: string
  type?: 'percent' | 'amount'
  value?: number
  appliesTo?: 'all' | 'services'
  serviceNames?: string[]
  startDate?: string
  endDate?: string
  showBadge?: boolean
}

interface BookingFormProps {
  services: Service[]
  companyName: string
  companyId?: string
  companyPhone?: string
  companyOwnerId?: string
  discount?: DiscountConfig
  discountPercent?: number
  discountText?: string
}

export default function BookingForm({ services, companyName, companyId, companyPhone, companyOwnerId, discount, discountPercent, discountText }: BookingFormProps) {
  let user = null
  try {
    const auth = useAuth()
    user = auth.user
  } catch (error) {
    // Auth not available
  }
  
  const [selectedService, setSelectedService] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [takenTimes, setTakenTimes] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const todayIso = new Date().toLocaleDateString('sv-SE')
  const discountCfg = discount
  const isDiscountCfgActive = Boolean(
    discountCfg?.enabled &&
      (discountCfg.showBadge !== false) &&
      Number(discountCfg.value || 0) > 0 &&
      (!discountCfg.startDate || todayIso >= discountCfg.startDate) &&
      (!discountCfg.endDate || todayIso <= discountCfg.endDate)
  )
  const legacyPercent = Number(discountPercent || 0)
  const hasLegacyDiscount = legacyPercent > 0
  const hasDiscount = isDiscountCfgActive || hasLegacyDiscount
  const effectiveType: 'percent' | 'amount' = (isDiscountCfgActive ? (discountCfg?.type || 'percent') : 'percent')
  const effectiveValue = isDiscountCfgActive ? Number(discountCfg?.value || 0) : legacyPercent
  const effectiveLabel = (isDiscountCfgActive ? (discountCfg?.label || '') : (discountText || '')).trim()
  const appliesToServices = Boolean(isDiscountCfgActive && discountCfg?.appliesTo === 'services')
  const selectedServiceNames = (discountCfg?.serviceNames || []).map(s => String(s || '').trim()).filter(Boolean)

  const applyDiscountToPrice = (original: number, serviceName?: string) => {
    if (!hasDiscount || original <= 0) return original
    if (appliesToServices) {
      if (!serviceName || !selectedServiceNames.includes(serviceName)) return original
    }
    if (effectiveType === 'amount') return Math.max(0, Math.round(original - effectiveValue))
    return Math.max(0, Math.round(original * (100 - effectiveValue) / 100))
  }

  // Validate Swedish phone number
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '')
    // Swedish mobile: 07X XXX XX XX or +467X XXX XX XX
    const mobileRegex = /^(\+46|0)7[0-9]{8}$/
    return mobileRegex.test(cleaned)
  }

  const normalizePhone = (phone: string) => phone.replace(/[\s-]/g, '')

  const makeSlotId = (date: string, time: string) => `${date}_${String(time || '').replace(':', '-')}`

  useEffect(() => {
    let mounted = true

    async function fetchTakenTimes() {
      if (!db || !companyId || !date) {
        if (mounted) setTakenTimes([])
        return
      }
      try {
        const bookingsRef = collection(db, 'bookings')
        const snap = await getDocs(query(
          bookingsRef,
          where('companyId', '==', companyId),
          where('date', '==', date),
          where('status', 'in', ['pending', 'confirmed'])
        ))
        const times = snap.docs.map(d => (d.data() as any)?.time).filter(Boolean)
        if (mounted) setTakenTimes(times)
      } catch (e) {
        if (mounted) setTakenTimes([])
      }
    }

    fetchTakenTimes()
    return () => { mounted = false }
  }, [companyId, date])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!companyId) {
      setError('Bokning kan inte skickas just nu. Försök igen om en stund.')
      return
    }

    if (!selectedService) {
      setError('Välj en tjänst')
      return
    }

    if (!date) {
      setError('Välj ett datum')
      return
    }

    if (!time) {
      setError('Välj en tid')
      return
    }

    if (takenTimes.includes(time)) {
      setError('Den här tiden är redan bokad. Välj en annan tid.')
      return
    }

    // Validate phone number
    if (!validatePhone(phone)) {
      setError('Ange ett giltigt svenskt mobilnummer (07X XXX XX XX)')
      return
    }

    // Validate name (at least 2 characters)
    if (name.trim().length < 2) {
      setError('Ange ditt fullständiga namn')
      return
    }

    if (message.trim().length > 500) {
      setError('Meddelandet får vara max 500 tecken')
      return
    }

    setIsSubmitting(true)

    if (!db) {
      setError('Databasanslutning saknas. Försök igen senare.')
      setIsSubmitting(false)
      return
    }

    try {
      const selectedServiceData = services.find(
        s => `${s.name || ''}-${s.price || 0}` === selectedService
      )

      const originalServicePrice = Number(selectedServiceData?.price || 0)
      const selectedServiceName = String(selectedServiceData?.name || selectedService).trim()
      const finalServicePrice = applyDiscountToPrice(originalServicePrice, selectedServiceName)

      const cleanedPhone = normalizePhone(phone)

      const slotId = makeSlotId(date, time)

      const bookingData = {
        // Company info
        companyId,
        companyName,
        companyOwnerId: companyOwnerId || null,
        slotId,
        
        // Service
        service: selectedServiceData?.name || selectedService,
        serviceName: selectedServiceData?.name || selectedService,
        serviceOriginalPrice: originalServicePrice,
        servicePrice: finalServicePrice,
        serviceDuration: selectedServiceData?.duration || 30,
        discountApplied: Boolean(hasDiscount && finalServicePrice < originalServicePrice),
        discountType: hasDiscount ? effectiveType : null,
        discountValue: hasDiscount ? effectiveValue : 0,
        discountLabel: hasDiscount ? (effectiveLabel || null) : null,
        
        // Customer
        customerName: name,
        customerPhone: cleanedPhone,
        customerMessage: message.trim() || null,
        customerId: user?.uid || null,
        customerEmail: user?.email || null,
        
        // Booking details
        date,
        time,
        
        // Status
        status: 'pending', // pending, confirmed, cancelled, completed
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData)

      let slotConflict = false
      for (let i = 0; i < 6; i++) {
        await new Promise(resolve => setTimeout(resolve, 350))
        const snap = await getDoc(bookingRef).catch(() => null)
        const d: any = snap?.data?.() || null
        if (!d) continue

        if (d.status === 'cancelled' && d.cancelReason === 'slot_taken') {
          slotConflict = true
          break
        }

        if (d.status && d.status !== 'cancelled') {
          break
        }
      }

      if (slotConflict) {
        setError('Den här tiden blev precis bokad. Välj en annan tid.')
        return
      }

      setSubmitted(true)
      
    } catch (err: any) {
      console.error('Booking error:', err)
      if (String(err?.message || err).includes('slot_taken')) {
        setError('Den här tiden blev precis bokad. Välj en annan tid.')
      } else {
        setError('Kunde inte skicka bokningen. Försök igen.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiCheck className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Bokningsförfrågan skickad!</h3>
          <p className="text-gray-600 mb-4">
            {companyName} kommer att kontakta dig.
          </p>
          
          {/* Cancellation Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-left">
            <h4 className="font-semibold text-orange-800 mb-2">
              Behöver du avboka eller ändra?
            </h4>
            <p className="text-sm text-orange-700 mb-3">
              Kontakta företaget direkt:
            </p>
            {companyPhone ? (
              <a
                href={`tel:${companyPhone}`}
                className="inline-flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-lg font-medium transition"
              >
                <HiPhone className="w-5 h-5" />
                Ring {companyPhone}
              </a>
            ) : (
              <p className="text-sm text-orange-600">
                Se kontaktuppgifter på företagets sida.
              </p>
            )}
          </div>
          
          <button
            onClick={() => {
              setSubmitted(false)
              setSelectedService('')
              setDate('')
              setTime('')
              setName('')
              setPhone('')
              setMessage('')
            }}
            className="text-brand hover:underline"
          >
            Boka en till tid
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Boka tid</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Välj tjänst *
          </label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
          >
            <option value="">Välj tjänst...</option>
            {services.filter(s => s.name).map((service, index) => (
              <option key={index} value={`${service.name || ''}-${service.price || 0}`}>
                {(() => {
                  const name = String(service.name || '').trim()
                  const original = Number(service.price || 0)
                  const discounted = applyDiscountToPrice(original, name)
                  return discounted < original && original > 0
                    ? `${name} - ${discounted} kr (ord ${original} kr) (${service.duration || 30} min)`
                    : `${name} - ${original} kr (${service.duration || 30} min)`
                })()}
              </option>
            ))}
          </select>

          {(() => {
            const selectedServiceData = services.find(
              s => `${s.name || ''}-${s.price || 0}` === selectedService
            )
            const name = String(selectedServiceData?.name || '').trim()
            const original = Number(selectedServiceData?.price || 0)
            const discounted = applyDiscountToPrice(original, name)
            const show = hasDiscount && original > 0 && discounted < original

            if (!show) return null

            return (
              <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-green-800">Kampanj</p>
                  <span className="text-xs font-semibold text-white bg-green-600 px-2 py-0.5 rounded-full">
                    {effectiveType === 'amount' ? `-${effectiveValue} kr` : `-${effectiveValue}%`}
                  </span>
                </div>
                <p className="text-sm text-green-800 mt-1">
                  Pris: <span className="font-bold">{discounted} kr</span>{' '}
                  <span className="text-green-700 line-through">{original} kr</span>
                  {effectiveLabel ? <span className="text-green-700"> • {effectiveLabel}</span> : null}
                </p>
              </div>
            )
          })()}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <HiCalendar className="inline w-4 h-4 mr-1" />
              Datum *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <HiClock className="inline w-4 h-4 mr-1" />
              Tid *
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            >
              <option value="">Välj tid...</option>
              {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
                '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'].map(t => (
                  <option key={t} value={t} disabled={takenTimes.includes(t)}>
                    {t}{takenTimes.includes(t) ? ' (bokad)' : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <HiUser className="inline w-4 h-4 mr-1" />
              Ditt namn *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Förnamn Efternamn"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <HiPhone className="inline w-4 h-4 mr-1" />
              Telefonnummer *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="07X XXX XX XX"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meddelande (valfritt)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Skriv ett kort meddelande till företaget..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none resize-none"
          />
          <p className="mt-1 text-xs text-gray-500 text-right">
            {message.length}/500
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-xl font-bold text-base transition disabled:opacity-50"
        >
          {isSubmitting ? 'Skickar...' : 'Skicka bokningsförfrågan'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Företaget kontaktar dig efter bokningen
        </p>
      </form>
    </div>
  )
}
