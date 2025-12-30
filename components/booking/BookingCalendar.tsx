'use client'

import { useState, useEffect, useMemo } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'

interface BookingCalendarProps {
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  excludedDates?: string[]
  bookedDates?: string[]
  selectedDate: string
  onSelectDate: (date: string) => void
  minDate?: string
}

const dayKeyByIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const weekDays = ['Mån', 'Tis', 'Ons', 'Tors', 'Fre', 'Lör', 'Sön']
const monthNames = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
]

export default function BookingCalendar({
  openingHours,
  excludedDates = [],
  bookedDates = [],
  selectedDate,
  onSelectDate,
  minDate,
}: BookingCalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const toIsoDate = (d: Date) => {
    const copy = new Date(d)
    copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset())
    return copy.toISOString().split('T')[0]
  }

  const todayIso = toIsoDate(today)
  const minDateIso = minDate || todayIso

  // Check if a date is available for booking
  const isDateAvailable = (isoDate: string) => {
    // Check if date is in the past
    if (isoDate < minDateIso) return false
    
    // Check if date is excluded by owner
    if (excludedDates.includes(isoDate)) return false
    
    // Check if company is open on this day
    if (openingHours) {
      const d = new Date(`${isoDate}T12:00:00`)
      const dayKey = dayKeyByIndex[d.getDay()]
      const hours = openingHours[dayKey]
      if (!hours || hours.closed) return false
    }
    
    return true
  }

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    
    // Get the day of week for first day (0 = Sunday, convert to Monday = 0)
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6
    
    const days: { date: number; iso: string; isCurrentMonth: boolean; isAvailable: boolean; isToday: boolean; isSelected: boolean }[] = []
    
    // Add days from previous month
    const prevMonth = new Date(currentYear, currentMonth, 0)
    const prevMonthDays = prevMonth.getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      const d = new Date(currentYear, currentMonth - 1, day)
      const iso = toIsoDate(d)
      days.push({
        date: day,
        iso,
        isCurrentMonth: false,
        isAvailable: isDateAvailable(iso),
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      })
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(currentYear, currentMonth, day)
      const iso = toIsoDate(d)
      days.push({
        date: day,
        iso,
        isCurrentMonth: true,
        isAvailable: isDateAvailable(iso),
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      })
    }
    
    // Add days from next month to fill the grid (6 rows * 7 days = 42)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const d = new Date(currentYear, currentMonth + 1, day)
      const iso = toIsoDate(d)
      days.push({
        date: day,
        iso,
        isCurrentMonth: false,
        isAvailable: isDateAvailable(iso),
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
      })
    }
    
    return days
  }, [currentMonth, currentYear, selectedDate, excludedDates, openingHours, minDateIso, todayIso])

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Don't allow navigating to past months
  const canGoPrev = currentYear > today.getFullYear() || 
    (currentYear === today.getFullYear() && currentMonth > today.getMonth())

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPrevMonth}
          disabled={!canGoPrev}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <HiChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-base font-semibold text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <HiChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => day.isAvailable && day.isCurrentMonth && onSelectDate(day.iso)}
            disabled={!day.isAvailable || !day.isCurrentMonth}
            className={`
              aspect-square flex items-center justify-center text-sm rounded-lg transition
              ${!day.isCurrentMonth ? 'text-gray-300' : ''}
              ${day.isCurrentMonth && !day.isAvailable ? 'text-gray-300 cursor-not-allowed' : ''}
              ${day.isCurrentMonth && day.isAvailable ? 'text-gray-900 hover:bg-brand/10 hover:text-brand cursor-pointer' : ''}
              ${day.isSelected ? 'bg-brand text-white hover:bg-brand-dark hover:text-white font-semibold' : ''}
              ${day.isToday && !day.isSelected ? 'ring-2 ring-brand/30 font-semibold' : ''}
            `}
          >
            {day.date}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-brand"></div>
          <span className="text-xs text-gray-500">Vald</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded ring-2 ring-brand/30"></div>
          <span className="text-xs text-gray-500">Idag</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-200"></div>
          <span className="text-xs text-gray-500">Stängt</span>
        </div>
      </div>
    </div>
  )
}
