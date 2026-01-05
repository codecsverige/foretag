'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { HiCheckCircle, HiSparkles } from 'react-icons/hi'
import confetti from 'canvas-confetti'

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    // Simulate loading
    setTimeout(() => setLoading(false), 1500)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Aktiverar ditt abonnemang...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <HiCheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Välkommen till Pro! 🎉
        </h1>
        
        <p className="text-gray-600 mb-8">
          Ditt abonnemang är nu aktiverat. Du har nu tillgång till alla Pro-funktioner.
        </p>

        <div className="bg-gradient-to-r from-brand/10 to-purple-100 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
            <HiSparkles className="w-5 h-5 text-brand" />
            Vad du nu kan göra
          </h2>
          <ul className="text-left space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
              Se alla dina bokningar utan begränsning
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
              Ditt telefonnummer visas nu helt för kunder
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
              Redigera dina annonser obegränsat
            </li>
            <li className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
              Få tillgång till avancerad statistik
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/konto?tab=bookings"
            className="block w-full bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-dark transition"
          >
            Se dina bokningar
          </Link>
          <Link
            href="/konto"
            className="block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Gå till kontrollpanelen
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Du kan hantera ditt abonnemang när som helst från kontosidan.
        </p>
      </div>
    </div>
  )
}

function SubscriptionSuccessFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Laddar...</p>
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<SubscriptionSuccessFallback />}>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}
