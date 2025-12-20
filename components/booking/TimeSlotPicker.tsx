'use client'

import { useState, useEffect } from 'react'
import { HiClock, HiCalendar } from 'react-icons/hi'

interface TimeSlot {
  time: string
  available: boolean
}

interface OpeningHours {
  [key: string]: {
    open: string
    close: string
    closed: boolean
  }
}

interface TimeSlotPickerProps {
  selectedDate: string
  selectedTime: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  openingHours?: OpeningHours
  serviceDuration?: number
  existingBookings?: Array<{ date: string; time: string }>
}

export default function TimeSlotPicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  openingHours,
  serviceDuration = 30,
  existingBookings = []
}: TimeSlotPickerProps) {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])

  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots()
    }
  }, [selectedDate, openingHours, existingBookings, serviceDuration])

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr)
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }

  const generateTimeSlots = () => {
    if (!selectedDate || !openingHours) {
      // If no opening hours provided, use default slots
      setAvailableSlots(generateDefaultSlots())
      return
    }

    const dayName = getDayName(selectedDate)
    const dayHours = openingHours[dayName]

    if (!dayHours || dayHours.closed) {
      setAvailableSlots([])
      return
    }

    const slots: TimeSlot[] = []
    const [openHour, openMinute] = dayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)

    let currentHour = openHour
    let currentMinute = openMinute

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`
      
      // Check if this slot is already booked
      const isBooked = existingBookings.some(
        booking => booking.date === selectedDate && booking.time === timeStr
      )

      slots.push({
        time: timeStr,
        available: !isBooked
      })

      // Add service duration
      currentMinute += serviceDuration
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60)
        currentMinute = currentMinute % 60
      }
    }

    setAvailableSlots(slots)
  }

  const generateDefaultSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const times = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ]

    times.forEach(time => {
      const isBooked = existingBookings.some(
        booking => booking.date === selectedDate && booking.time === time
      )
      slots.push({ time, available: !isBooked })
    })

    return slots
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 90) // 90 days in advance
    return maxDate.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-4">
      {/* Date Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <HiCalendar className="inline w-4 h-4 mr-1" />
          Välj datum *
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          required
          min={getMinDate()}
          max={getMaxDate()}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
        />
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <HiClock className="inline w-4 h-4 mr-1" />
            Välj tid *
          </label>
          
          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => slot.available && onTimeChange(slot.time)}
                  disabled={!slot.available}
                  className={`px-4 py-3 rounded-lg font-medium transition ${
                    selectedTime === slot.time
                      ? 'bg-brand text-white'
                      : slot.available
                      ? 'bg-white border-2 border-gray-200 text-gray-700 hover:border-brand'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                {openingHours && getDayName(selectedDate) in openingHours && 
                 openingHours[getDayName(selectedDate)].closed
                  ? '❌ Stängt detta datum'
                  : '⚠️ Inga tillgängliga tider'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Helper Text */}
      {selectedDate && availableSlots.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {availableSlots.filter(s => s.available).length} av {availableSlots.length} tider tillgängliga
        </p>
      )}
    </div>
  )
}
