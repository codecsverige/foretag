'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { HiMail, HiLockClosed, HiUser, HiExclamationCircle } from 'react-icons/hi'
import { FcGoogle } from 'react-icons/fc'

export default function RegisterPage() {
  const router = useRouter()
  const { signInWithGoogle, signUpWithEmail, user, loading } = useAuth()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already logged in
  if (user && !loading) {
    router.push('/')
    return null
  }

  const handleGoogleSignIn = async () => {
    try {
      setError('')
      setIsLoading(true)
      await signInWithGoogle()
      router.push('/')
    } catch (err: any) {
      setError('Kunde inte registrera med Google. Försök igen.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Fyll i alla fält')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte')
      return
    }
    
    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken')
      return
    }
    
    try {
      setError('')
      setIsLoading(true)
      await signUpWithEmail(email, password, name)
      router.push('/')
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('E-postadressen används redan')
      } else if (err.code === 'auth/invalid-email') {
        setError('Ogiltig e-postadress')
      } else if (err.code === 'auth/weak-password') {
        setError('Lösenordet är för svagt')
      } else {
        setError('Kunde inte skapa konto. Försök igen.')
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🏢</span>
            <span className="text-2xl font-bold text-brand">BokaNära</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Skapa konto</h1>
          <p className="text-gray-600 mt-2">
            Registrera dig för att skapa annonser och boka tjänster.
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            <FcGoogle className="w-6 h-6" />
            <span className="font-medium text-gray-700">Fortsätt med Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">eller</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Namn
              </label>
              <div className="relative">
                <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ditt namn"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                />
              </div>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bekräfta lösenord
              </label>
              <div className="relative">
                <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? 'Skapar konto...' : 'Skapa konto'}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            Genom att registrera dig godkänner du våra{' '}
            <Link href="/villkor" className="text-brand hover:underline">användarvillkor</Link>
            {' '}och{' '}
            <Link href="/integritet" className="text-brand hover:underline">integritetspolicy</Link>.
          </p>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600">
            Har du redan ett konto?{' '}
            <Link href="/login" className="text-brand hover:underline font-medium">
              Logga in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
