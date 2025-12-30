'use client'

import { useState, useMemo } from 'react'
import { HiChevronLeft, HiChevronRight, HiX, HiPlus, HiTrash } from 'react-icons/hi'

interface AvailabilityManagerProps {
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>
  excludedDates: string[]
  excludedTimes: Record<string, string[]>
  onUpdateExcludedDates: (dates: string[]) => void
  onUpdateExcludedTimes: (times: Record<string, string[]>) => void
}

const dayKeyByIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const weekDays = ['Mån', 'Tis', 'Ons', 'Tors', 'Fre', 'Lör', 'Sön']
const monthNames = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
]

export default function AvailabilityManager({
  openingHours,
  excludedDates,
  excludedTimes,
  onUpdateExcludedDates,
  onUpdateExcludedTimes,
}: AvailabilityManagerProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showTimeManager, setShowTimeManager] = useState(false)

  const toIsoDate = (d: Date) => {
    const copy = new Date(d)
    copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset())
    return copy.toISOString().split('T')[0]
  }

  const todayIso = toIsoDate(today)

  // Generate time slots based on opening hours
  const getTimeSlotsForDate = (isoDate: string) => {
    if (!openingHours) return []
    const d = new Date(`${isoDate}T12:00:00`)
    const dayKey = dayKeyByIndex[d.getDay()]
    const hours = openingHours[dayKey]
    if (!hours || hours.closed) return []

    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return (h * 60) + m
    }

    const minutesToTime = (min: number) => {
      const h = Math.floor(min / 60)
      const m = min % 60
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const openMin = timeToMinutes(hours.open)
    const closeMin = timeToMinutes(hours.close)
    const slots: string[] = []
    for (let start = openMin; start < closeMin; start += 30) {
      slots.push(minutesToTime(start))
    }
    return slots
  }

  // Check if date is open
  const isDateOpen = (isoDate: string) => {
    if (!openingHours) return true
    const d = new Date(`${isoDate}T12:00:00`)
    const dayKey = dayKeyByIndex[d.getDay()]
    const hours = openingHours[dayKey]
    return hours && !hours.closed
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6
    
    const days: { date: number; iso: string; isCurrentMonth: boolean; isPast: boolean; isExcluded: boolean; hasExcludedTimes: boolean; isOpen: boolean }[] = []
    
    // Previous month days
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
        isPast: iso < todayIso,
        isExcluded: excludedDates.includes(iso),
        hasExcludedTimes: Boolean(excludedTimes[iso]?.length),
        isOpen: isDateOpen(iso),
      })
    }
    
    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(currentYear, currentMonth, day)
      const iso = toIsoDate(d)
      days.push({
        date: day,
        iso,
        isCurrentMonth: true,
        isPast: iso < todayIso,
        isExcluded: excludedDates.includes(iso),
        hasExcludedTimes: Boolean(excludedTimes[iso]?.length),
        isOpen: isDateOpen(iso),
      })
    }
    
    // Next month days
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const d = new Date(currentYear, currentMonth + 1, day)
      const iso = toIsoDate(d)
      days.push({
        date: day,
        iso,
        isCurrentMonth: false,
        isPast: iso < todayIso,
        isExcluded: excludedDates.includes(iso),
        hasExcludedTimes: Boolean(excludedTimes[iso]?.length),
        isOpen: isDateOpen(iso),
      })
    }
    
    return days
  }, [currentMonth, currentYear, excludedDates, excludedTimes, todayIso, openingHours])

  const toggleExcludeDate = (isoDate: string) => {
    if (excludedDates.includes(isoDate)) {
      onUpdateExcludedDates(excludedDates.filter(d => d !== isoDate))
      // Also remove any excluded times for this date
      const newExcludedTimes = { ...excludedTimes }
      delete newExcludedTimes[isoDate]
      onUpdateExcludedTimes(newExcludedTimes)
    } else {
      onUpdateExcludedDates([...excludedDates, isoDate])
    }
  }

  const toggleExcludeTime = (isoDate: string, time: string) => {
    const dateExcludedTimes = excludedTimes[isoDate] || []
    let newTimes: string[]
    if (dateExcludedTimes.includes(time)) {
      newTimes = dateExcludedTimes.filter(t => t !== time)
    } else {
      newTimes = [...dateExcludedTimes, time]
    }
    
    const newExcludedTimes = { ...excludedTimes }
    if (newTimes.length === 0) {
      delete newExcludedTimes[isoDate]
    } else {
      newExcludedTimes[isoDate] = newTimes
    }
    onUpdateExcludedTimes(newExcludedTimes)
  }

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

  const canGoPrev = currentYear > today.getFullYear() || 
    (currentYear === today.getFullYear() && currentMonth > today.getMonth())

  const selectedDateSlots = selectedDate ? getTimeSlotsForDate(selectedDate) : []
  const selectedDateExcludedTimes = selectedDate ? (excludedTimes[selectedDate] || []) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Hantera tillgänglighet</h3>
        <p className="text-sm text-gray-500 mt-1">
          Klicka på ett datum för att stänga hela dagen, eller klicka på kugghjulet för att stänga specifika tider.
        </p>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <HiChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h4 className="text-base font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h4>
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
            <div key={idx} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (!day.isPast && day.isCurrentMonth && day.isOpen) {
                    toggleExcludeDate(day.iso)
                  }
                }}
                disabled={day.isPast || !day.isCurrentMonth || !day.isOpen}
                className={`
                  w-full aspect-square flex items-center justify-center text-sm rounded-lg transition relative
                  ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                  ${day.isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                  ${!day.isOpen && day.isCurrentMonth && !day.isPast ? 'text-gray-400 bg-gray-100' : ''}
                  ${day.isExcluded ? 'bg-red-100 text-red-700 font-semibold' : ''}
                  ${day.hasExcludedTimes && !day.isExcluded ? 'bg-orange-100 text-orange-700' : ''}
                  ${day.isCurrentMonth && !day.isPast && day.isOpen && !day.isExcluded && !day.hasExcludedTimes ? 'hover:bg-gray-100 text-gray-900' : ''}
                `}
              >
                {day.date}
                {day.isExcluded && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
                {day.hasExcludedTimes && !day.isExcluded && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-orange-500 rounded-full"></span>
                )}
              </button>
              
              {/* Time manager button */}
              {day.isCurrentMonth && !day.isPast && day.isOpen && !day.isExcluded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDate(day.iso)
                    setShowTimeManager(true)
                  }}
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:opacity-100 transition"
                  style={{ opacity: selectedDate === day.iso ? 1 : undefined }}
                >
                  ⚙
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
            <span className="text-xs text-gray-500">Stängd dag</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300"></div>
            <span className="text-xs text-gray-500">Vissa tider stängda</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>
            <span className="text-xs text-gray-500">Ordinarie stängt</span>
          </div>
        </div>
      </div>

      {/* Quick actions for excluded dates */}
      {excludedDates.length > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <h4 className="font-semibold text-red-800 mb-3">Stängda datum ({excludedDates.length})</h4>
          <div className="flex flex-wrap gap-2">
            {excludedDates.sort().map((d) => (
              <span key={d} className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg text-sm text-red-700 border border-red-200">
                {new Date(`${d}T12:00:00`).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                <button
                  type="button"
                  onClick={() => toggleExcludeDate(d)}
                  className="ml-1 hover:text-red-900"
                >
                  <HiX className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Time manager modal */}
      {showTimeManager && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Hantera tider</h4>
                <p className="text-sm text-gray-500">
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('sv-SE', { 
                    weekday: 'long', day: 'numeric', month: 'long' 
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTimeManager(false)
                  setSelectedDate(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <HiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4">
              {selectedDateSlots.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    Klicka på tider för att stänga/öppna dem:
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedDateSlots.map((t) => {
                      const isExcluded = selectedDateExcludedTimes.includes(t)
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleExcludeTime(selectedDate, t)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                            isExcluded
                              ? 'bg-red-100 text-red-700 border border-red-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                          }`}
                        >
                          {t}
                        </button>
                      )
                    })}
                  </div>
                  
                  {selectedDateExcludedTimes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-red-600">
                        {selectedDateExcludedTimes.length} tid(er) stängda för detta datum
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Inga öppettider för detta datum.
                </p>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => toggleExcludeDate(selectedDate)}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
              >
                Stäng hela dagen
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTimeManager(false)
                  setSelectedDate(null)
                }}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
              >
                Klar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
