'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { addDoc, collection, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import { HiCalendar, HiClock, HiUser, HiPhone, HiCheck, HiArrowLeft, HiChevronRight } from 'react-icons/hi'
import BookingCalendar from './BookingCalendar'

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

interface BookingFormWizardProps {
  services: Service[]
  companyName: string
  companyId?: string
  companyPhone?: string
  companyOwnerId?: string
  preselectedService?: string
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  excludedDates?: string[]
  excludedTimes?: Record<string, string[]>
  discount?: DiscountConfig
  discountPercent?: number
  discountText?: string
}

const dayNames: Record<string, string> = {
  monday: 'Måndag',
  tuesday: 'Tisdag',
  wednesday: 'Onsdag',
  thursday: 'Torsdag',
  friday: 'Fredag',
  saturday: 'Lördag',
  sunday: 'Söndag',
}

type Step = 'idle' | 'date' | 'time' | 'form' | 'success'

export default function BookingFormWizard({ 
  services, 
  companyName, 
  companyId, 
  companyPhone, 
  companyOwnerId, 
  preselectedService, 
  openingHours,
  excludedDates = [],
  excludedTimes = {},
  discount, 
  discountPercent, 
  discountText 
}: BookingFormWizardProps) {
  let user = null
  try {
    const auth = useAuth()
    user = auth.user
  } catch (error) {
    // Auth not available
  }
  
  const [step, setStep] = useState<Step>('idle')
  const [selectedService, setSelectedService] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [takenBookings, setTakenBookings] = useState<Array<{ time: string; duration: number }>>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // When preselectedService changes, start the booking flow
  useEffect(() => {
    if (!preselectedService) return
    const exists = services.some(s => `${s.name || ''}-${s.price || 0}` === preselectedService)
    if (!exists) return
    setError('')
    setSelectedService(preselectedService)
    setDate('')
    setTime('')
    setStep('date')
  }, [preselectedService, services])

  const toIsoDate = (d: Date) => {
    const copy = new Date(d)
    copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset())
    return copy.toISOString().split('T')[0]
  }

  const todayIso = toIsoDate(new Date())
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

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '')
    const mobileRegex = /^(\+46|0)7[0-9]{8}$/
    return mobileRegex.test(cleaned)
  }

  const normalizePhone = (phone: string) => phone.replace(/[\s-]/g, '')

  const makeSlotId = (date: string, time: string) => `${date}_${String(time || '').replace(':', '-')}`

  const dayKeyByIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  const timeToMinutes = (t: string) => {
    const [h, m] = String(t || '').split(':').map(Number)
    if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
    return (h * 60) + m
  }

  const minutesToTime = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const getDayKeyForIsoDate = (isoDate: string) => {
    const d = new Date(`${isoDate}T12:00:00`)
    return dayKeyByIndex[d.getDay()] || 'monday'
  }

  const selectedServiceData = services.find(
    s => `${s.name || ''}-${s.price || 0}` === selectedService
  )
  const selectedServiceDuration = Math.max(15, Number(selectedServiceData?.duration || 30))

  const isTimeBlocked = (candidateTime: string) => {
    const start = timeToMinutes(candidateTime)
    const end = start + selectedServiceDuration
    return takenBookings.some((b) => {
      const bStart = timeToMinutes(b.time)
      const bEnd = bStart + Math.max(15, Number(b.duration || 30))
      return start < bEnd && bStart < end
    })
  }

  const isTimeInPast = (isoDate: string, candidateTime: string) => {
    if (!isoDate) return false
    const today = toIsoDate(new Date())
    if (isoDate !== today) return false
    const now = new Date()
    const nowMin = (now.getHours() * 60) + now.getMinutes()
    return timeToMinutes(candidateTime) < nowMin
  }

  // Get next 14 days with open hours
  const availableDates = (() => {
    if (!openingHours) return [] as { iso: string; dayName: string; date: number; month: string }[]
    const result: { iso: string; dayName: string; date: number; month: string }[] = []
    const base = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      const iso = toIsoDate(d)
      const dayKey = dayKeyByIndex[d.getDay()]
      const hours = openingHours?.[dayKey]
      if (!hours || hours.closed) continue
      result.push({
        iso,
        dayName: d.toLocaleDateString('sv-SE', { weekday: 'short' }),
        date: d.getDate(),
        month: d.toLocaleDateString('sv-SE', { month: 'short' }),
      })
      if (result.length >= 14) break
    }
    return result
  })()

  const timeSlots = (() => {
    if (!date || !openingHours) return [] as string[]
    const dayKey = getDayKeyForIsoDate(date)
    const hours = openingHours?.[dayKey]
    if (!hours || hours.closed) return [] as string[]
    const openMin = timeToMinutes(hours.open)
    const closeMin = timeToMinutes(hours.close)

    const slots: string[] = []
    const step = 30
    for (let start = openMin; start + selectedServiceDuration <= closeMin; start += step) {
      slots.push(minutesToTime(start))
    }
    return slots
  })()

  // Fetch taken bookings when date changes
  useEffect(() => {
    let mounted = true

    async function fetchTakenTimes() {
      if (!db || !companyId || !date) {
        if (mounted) setTakenBookings([])
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
        const items = snap.docs
          .map(d => {
            const data: any = d.data() || {}
            return {
              time: String(data?.time || ''),
              duration: Math.max(15, Number(data?.serviceDuration || data?.duration || 30)),
            }
          })
          .filter(b => b.time)
        if (mounted) setTakenBookings(items)
      } catch (e) {
        if (mounted) setTakenBookings([])
      }
    }

    fetchTakenTimes()
    return () => { mounted = false }
  }, [companyId, date])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!companyId) {
      setError('Bokning kan inte skickas just nu.')
      return
    }

    if (!validatePhone(phone)) {
      setError('Ange ett giltigt svenskt mobilnummer (07X XXX XX XX)')
      return
    }

    if (name.trim().length < 2) {
      setError('Ange ditt fullständiga namn')
      return
    }

    setIsSubmitting(true)

    try {
      const originalServicePrice = Number(selectedServiceData?.price || 0)
      const selectedServiceName = String(selectedServiceData?.name || selectedService).trim()
      const finalServicePrice = applyDiscountToPrice(originalServicePrice, selectedServiceName)

      const bookingData = {
        companyId,
        companyName,
        companyOwnerId: companyOwnerId || null,
        slotId: makeSlotId(date, time),
        service: selectedServiceData?.name || selectedService,
        serviceName: selectedServiceData?.name || selectedService,
        serviceOriginalPrice: originalServicePrice,
        servicePrice: finalServicePrice,
        serviceDuration: selectedServiceData?.duration || 30,
        discountApplied: Boolean(hasDiscount && finalServicePrice < originalServicePrice),
        discountType: hasDiscount ? effectiveType : null,
        discountValue: hasDiscount ? effectiveValue : 0,
        discountLabel: hasDiscount ? (effectiveLabel || null) : null,
        customerName: name,
        customerPhone: normalizePhone(phone),
        customerMessage: message.trim() || null,
        customerId: user?.uid || null,
        customerEmail: user?.email || null,
        date,
        time,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      if (!db) throw new Error('Database not available')
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
        if (d.status && d.status !== 'cancelled') break
      }

      if (slotConflict) {
        setError('Den här tiden blev precis bokad. Välj en annan tid.')
        setStep('time')
        return
      }

      setStep('success')
      
    } catch (err: any) {
      console.error('Booking error:', err)
      setError('Kunde inte skicka bokningen. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetBooking = () => {
    setStep('idle')
    setSelectedService('')
    setDate('')
    setTime('')
    setName('')
    setPhone('')
    setMessage('')
    setError('')
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  // STEP: idle - Show service selection
  if (step === 'idle') {
    return (
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">Välj en tjänst för att boka:</p>
        
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {services.filter(s => s.name).map((service, idx) => {
            const original = Number(service.price || 0)
            const discounted = applyDiscountToPrice(original, service.name)
            const showDiscount = hasDiscount && original > 0 && discounted < original
            
            return (
              <button
                key={idx}
                onClick={() => {
                  const key = `${service.name || ''}-${service.price || 0}`
                  setSelectedService(key)
                  setStep('date')
                }}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-brand hover:bg-brand/5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.duration || 30} min</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {showDiscount ? (
                      <>
                        <p className="font-bold text-brand">{discounted} kr</p>
                        <p className="text-xs text-gray-400 line-through">{original} kr</p>
                      </>
                    ) : (
                      <p className="font-bold text-gray-900">{original} kr</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        
        {services.length === 0 && (
          <p className="text-center text-gray-500 py-8">Inga tjänster tillgängliga.</p>
        )}
      </div>
    )
  }

  // STEP: success - Booking confirmed
  if (step === 'success') {
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
          
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm text-gray-600">
              <strong>Tjänst:</strong> {selectedServiceData?.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Datum:</strong> {new Date(`${date}T12:00:00`).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Tid:</strong> {time}
            </p>
          </div>
          
          {companyPhone && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-left">
              <h4 className="font-semibold text-orange-800 mb-2">
                Behöver du avboka eller ändra?
              </h4>
              <a
                href={`tel:${companyPhone}`}
                className="inline-flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-lg font-medium transition"
              >
                <HiPhone className="w-5 h-5" />
                Ring {companyPhone}
              </a>
            </div>
          )}
          
          <button
            onClick={resetBooking}
            className="text-brand hover:underline"
          >
            Boka en till tid
          </button>
        </div>
      </div>
    )
  }

  // STEP: date - Select date with real calendar
  if (step === 'date') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={resetBooking}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Välj datum</h3>
            <p className="text-sm text-gray-500">{selectedServiceData?.name}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <BookingCalendar
          openingHours={openingHours}
          excludedDates={excludedDates}
          selectedDate={date}
          onSelectDate={(selectedIso) => {
            setDate(selectedIso)
            setTime('')
            setError('')
            setStep('time')
          }}
        />
      </div>
    )
  }

  // STEP: time - Select time
  if (step === 'time') {
    const selectedDateObj = new Date(`${date}T12:00:00`)
    const selectedDateFormatted = selectedDateObj.toLocaleDateString('sv-SE', { 
      weekday: 'long', day: 'numeric', month: 'long' 
    })
    
    // Check if time is excluded by owner
    const isTimeExcludedByOwner = (t: string) => {
      const dateExcludedTimes = excludedTimes[date] || []
      return dateExcludedTimes.includes(t)
    }
    
    const availableSlots = timeSlots.filter(t => 
      !isTimeBlocked(t) && !isTimeInPast(date, t) && !isTimeExcludedByOwner(t)
    )
    const unavailableSlots = timeSlots.filter(t => 
      isTimeBlocked(t) || isTimeInPast(date, t) || isTimeExcludedByOwner(t)
    )

    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setStep('date')
              setTime('')
              setError('')
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Välj tid</h3>
            <p className="text-sm text-gray-500">
              {selectedServiceData?.name} • {selectedDateFormatted}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {availableSlots.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTime(t)
                  setError('')
                  setStep('form')
                }}
                className="py-3 px-4 rounded-xl border border-gray-200 hover:border-brand hover:bg-brand/5 transition font-medium text-gray-900"
              >
                {t}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            Inga lediga tider för detta datum.
          </p>
        )}

        {unavailableSlots.length > 0 && availableSlots.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Upptagna tider:</p>
            <div className="flex flex-wrap gap-1">
              {unavailableSlots.map((t) => (
                <span key={t} className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // STEP: form - Enter details
  if (step === 'form') {
    const formDateObj = new Date(`${date}T12:00:00`)
    const formDateFormatted = formDateObj.toLocaleDateString('sv-SE', { 
      weekday: 'long', day: 'numeric', month: 'long' 
    })
    const originalPrice = Number(selectedServiceData?.price || 0)
    const discountedPrice = applyDiscountToPrice(originalPrice, selectedServiceData?.name)
    const showDiscount = hasDiscount && originalPrice > 0 && discountedPrice < originalPrice

    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              setStep('time')
              setError('')
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Bekräfta bokning</h3>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{selectedServiceData?.name}</p>
              <p className="text-sm text-gray-500">{selectedServiceData?.duration} min</p>
            </div>
            <div className="text-right">
              {showDiscount ? (
                <>
                  <p className="font-bold text-brand">{discountedPrice} kr</p>
                  <p className="text-xs text-gray-400 line-through">{originalPrice} kr</p>
                </>
              ) : (
                <p className="font-bold text-gray-900">{originalPrice} kr</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <HiCalendar className="w-4 h-4 text-brand" />
              <span className="text-sm text-gray-700 capitalize">
                {formDateFormatted}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HiClock className="w-4 h-4 text-brand" />
              <span className="text-sm text-gray-700">{time}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-xl font-bold text-base transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Skickar...' : (
              <>
                Skicka bokningsförfrågan
                <HiChevronRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Företaget kontaktar dig efter bokningen
          </p>
        </form>
      </div>
    )
  }

  return null
}
