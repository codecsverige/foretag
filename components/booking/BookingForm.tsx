'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { HiCalendar, HiClock, HiUser, HiPhone, HiCheck } from 'react-icons/hi'
import Link from 'next/link'

interface Service {
  name: string
  price: number
  duration: number
}

interface BookingFormProps {
  services: Service[]
  companyName: string
  companyId?: string
  companyPhone?: string
}

export default function BookingForm({ services, companyName, companyId, companyPhone }: BookingFormProps) {
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
            <p className="text-sm text-gray-500 mb-4">
              📱 Du kommer få en SMS-påminnelse innan din tid.
            </p>
          )}
          
          {/* Cancellation Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 text-left">
            <h4 className="font-semibold text-orange-800 mb-2">
              ℹ️ Behöver du avboka eller ändra?
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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
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
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
          >
            <option value="">Välj tid...</option>
            {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
              '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

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
