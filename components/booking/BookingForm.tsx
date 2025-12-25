'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { HiCalendar, HiClock, HiUser, HiPhone, HiCheck } from 'react-icons/hi'

interface Service {
  name?: string
  price?: number
  duration?: number
}

interface BookingFormProps {
  services: Service[]
  companyName: string
  companyId?: string
  companyPhone?: string
  companyOwnerId?: string
}

export default function BookingForm({ services, companyName, companyId, companyPhone, companyOwnerId }: BookingFormProps) {
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

  // Validate Swedish phone number
  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s-]/g, '')
    // Swedish mobile: 07X XXX XX XX or +467X XXX XX XX
    const mobileRegex = /^(\+46|0)7[0-9]{8}$/
    return mobileRegex.test(cleaned)
  }

  const normalizePhone = (phone: string) => phone.replace(/[\s-]/g, '')

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

      const cleanedPhone = normalizePhone(phone)

      const bookingData = {
        // Company info
        companyId,
        companyName,
        companyOwnerId: companyOwnerId || null,
        
        // Service
        service: selectedServiceData?.name || selectedService,
        serviceName: selectedServiceData?.name || selectedService,
        servicePrice: selectedServiceData?.price || 0,
        serviceDuration: selectedServiceData?.duration || 30,
        
        // Customer
        customerName: name,
        customerPhone: cleanedPhone,
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

      updateDoc(doc(db, 'companies', companyId), { bookingCount: increment(1) }).catch(() => {})
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiCheck className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Bokningsförfrågan skickad!</h3>
          <p className="text-gray-600 mb-4">
            {companyName} kommer att kontakta dig för att bekräfta din bokning.
          </p>
          {smsReminder && (
            <p className="text-sm text-gray-500 mb-4">
              Du kommer få en SMS-påminnelse innan din tid.
            </p>
          )}
          
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
                {service.name} - {service.price || 0} kr ({service.duration || 30} min)
              </option>
            ))}
          </select>
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
                <option key={t} value={t}>{t}</option>
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
            Skicka mig en SMS-påminnelse innan min tid
          </label>
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
          Företaget kontaktar dig för att bekräfta bokningen
        </p>
      </form>
    </div>
  )
}
