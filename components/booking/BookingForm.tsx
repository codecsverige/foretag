'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { HiUser, HiPhone, HiCheck } from 'react-icons/hi'
import TimeSlotPicker from './TimeSlotPicker'

interface Service {
  name: string
  price: number
  duration: number
}

interface OpeningHours {
  [key: string]: {
    open: string
    close: string
    closed: boolean
  }
}

interface BookingFormProps {
  services: Service[]
  companyName: string
  companyId?: string
  openingHours?: OpeningHours
}

export default function BookingForm({ services, companyName, companyId, openingHours }: BookingFormProps) {
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
  const [smsReminder, setSmsReminder] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [existingBookings, setExistingBookings] = useState<Array<{ date: string; time: string }>>([])

  // Load existing bookings for the selected date
  useEffect(() => {
    if (companyId && date && db) {
      loadExistingBookings()
    }
  }, [companyId, date])

  const loadExistingBookings = async () => {
    if (!db || !companyId || !date) return

    try {
      const q = query(
        collection(db, 'bookings'),
        where('companyId', '==', companyId),
        where('date', '==', date),
        where('status', 'in', ['pending', 'confirmed'])
      )
      
      const snapshot = await getDocs(q)
      const bookings = snapshot.docs.map(doc => ({
        date: doc.data().date,
        time: doc.data().time
      }))
      
      setExistingBookings(bookings)
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  const getServiceDuration = () => {
    const service = services.find(s => `${s.name}-${s.price}` === selectedService)
    return service?.duration || 30
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!db) {
      setError('Databasanslutning saknas. Försök igen senare.')
      setIsSubmitting(false)
      return
    }

    try {
      const selectedServiceData = services.find(
        s => `${s.name}-${s.price}` === selectedService
      )

      const bookingData = {
        // Company info
        companyId: companyId || 'unknown',
        companyName,
        
        // Service
        service: selectedServiceData?.name || selectedService,
        servicePrice: selectedServiceData?.price || 0,
        serviceDuration: selectedServiceData?.duration || 30,
        
        // Customer
        customerName: name,
        customerPhone: phone,
        customerId: user?.uid || null,
        customerEmail: user?.email || null,
        
        // Booking details
        date,
        time,
        smsReminder,
        
        // Status
        status: 'pending', // pending, confirmed, cancelled, completed
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'bookings'), bookingData)
      setSubmitted(true)
      
    } catch (err: any) {
      console.error('Booking error:', err)
      setError('Kunde inte skicka bokningen. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiCheck className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Bokningsförfrågan skickad!</h3>
          <p className="text-gray-600 mb-4">
            {companyName} kommer att kontakta dig för att bekräfta din bokning.
          </p>
          {smsReminder && (
            <p className="text-sm text-gray-500">
              📱 Du kommer få en SMS-påminnelse innan din tid.
            </p>
          )}
          <button
            onClick={() => {
              setSubmitted(false)
              setSelectedService('')
              setDate('')
              setTime('')
              setName('')
              setPhone('')
            }}
            className="mt-4 text-brand hover:underline"
          >
            Boka en till tid
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Boka tid</h2>
      
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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
          >
            <option value="">Välj tjänst...</option>
            {services.map((service, index) => (
              <option key={index} value={`${service.name}-${service.price}`}>
                {service.name} - {service.price} kr ({service.duration} min)
              </option>
            ))}
          </select>
        </div>

        {/* Time Slot Picker */}
        <TimeSlotPicker
          selectedDate={date}
          selectedTime={time}
          onDateChange={setDate}
          onTimeChange={setTime}
          openingHours={openingHours}
          serviceDuration={getServiceDuration()}
          existingBookings={existingBookings}
        />

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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
          />
        </div>

        {/* SMS Reminder */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <input
            type="checkbox"
            id="smsReminder"
            checked={smsReminder}
            onChange={(e) => setSmsReminder(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-brand focus:ring-brand"
          />
          <label htmlFor="smsReminder" className="text-sm text-gray-700">
            📱 Skicka mig en SMS-påminnelse innan min tid
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand hover:bg-brand-dark text-white py-4 rounded-xl font-bold text-lg transition disabled:opacity-50"
        >
          {isSubmitting ? 'Skickar...' : '📅 Skicka bokningsförfrågan'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Företaget kontaktar dig för att bekräfta bokningen
        </p>
      </form>
    </div>
  )
}
