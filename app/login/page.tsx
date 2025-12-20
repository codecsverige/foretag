'use client'

/* ────────────────────────────────────────────────
   app/login/page.tsx
   صفحة تسجيل الدخول - Using GoogleAuth component
──────────────────────────────────────────────── */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { HiMail, HiLockClosed, HiExclamationCircle } from 'react-icons/hi'
import GoogleAuth from '@/components/GoogleAuth'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  let signInWithEmail = async (email: string, password: string) => {}
  let user: any = null
  let loading = true
  
  try {
    const auth = useAuth()
    signInWithEmail = auth.signInWithEmail
    user = auth.user
    loading = auth.loading
  } catch (error) {
    loading = false
  }

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push(redirect)
    }
  }, [user, loading, router, redirect])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Fyll i alla fält')
      return
    }
    
    try {
      setError('')
      setIsLoading(true)
      await signInWithEmail(email, password)
      router.push(redirect)
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Ingen användare hittades med denna e-post')
      } else if (err.code === 'auth/wrong-password') {
        setError('Fel lösenord')
      } else if (err.code === 'auth/invalid-email') {
        setError('Ogiltig e-postadress')
      } else {
        setError('Kunde inte logga in. Försök igen.')
      }
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🏢</span>
            <span className="text-2xl font-bold text-brand">BokaNära</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Logga in</h1>
          <p className="text-gray-600 mt-2">
            Välkommen tillbaka! Logga in för att fortsätta.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Google Sign In - Using GoogleAuth component */}
          <GoogleAuth 
            redirectTo={redirect}
            buttonText="Logga in med Google"
            fullWidth
          />

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">eller</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-post
              </label>
              <div className="relative">
                <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.se"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lösenord
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand hover:bg-brand-dark text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
            >
              {isLoading ? 'Loggar in...' : 'Logga in'}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-gray-600">
            Har du inget konto?{' '}
            <Link href="/registrera" className="text-brand hover:underline font-medium">
              Registrera dig
            </Link>
          </p>
          
          {/* Security note - من المشروع القديم */}
          <p className="text-xs text-center text-gray-500">
            Vi använder ditt Google-konto för att autentisera dig på ett säkert sätt.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
