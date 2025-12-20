'use client'

/* ────────────────────────────────────────────────
   components/GoogleAuth.tsx
   Reusable Google Authentication Component
   Adapted for Next.js with TypeScript
──────────────────────────────────────────────── */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface GoogleAuthProps {
  /** Redirect path after successful login */
  redirectTo?: string
  /** Button text */
  buttonText?: string
  /** Full width button */
  fullWidth?: boolean
  /** Custom className for styling */
  className?: string
  /** Callback after successful login */
  onSuccess?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Show loading state */
  showLoading?: boolean
}

/**
 * GoogleAuth Component
 * 
 * A reusable Google authentication button component that integrates
 * with Firebase Authentication. Supports customization through props
 * and maintains responsive design with TailwindCSS.
 * 
 * @example
 * ```tsx
 * <GoogleAuth 
 *   redirectTo="/konto" 
 *   buttonText="Sign in with Google"
 *   fullWidth
 * />
 * ```
 */
export default function GoogleAuth({
  redirectTo = '/',
  buttonText = 'Logga in med Google',
  fullWidth = false,
  className = '',
  onSuccess,
  onError,
  showLoading = true,
}: GoogleAuthProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Get auth functions from context - must be called unconditionally
  const auth = useAuth()
  const signInWithGoogle = auth.signInWithGoogle

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      await signInWithGoogle()
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
      
      // Navigate to redirect path
      router.push(redirectTo)
    } catch (err: any) {
      console.error('Google sign-in error:', err)
      
      // Format error message based on error code
      let errorMessage = 'Kunde inte logga in med Google. Försök igen.'
      
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Inloggningsfönstret stängdes. Försök igen.'
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup-fönster blockerades. Vänligen tillåt popup-fönster.'
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domänen är inte auktoriserad. Kontakta support.'
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Nätverksfel. Kontrollera din internetanslutning.'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'För många försök. Vänta en stund och försök igen.'
      }
      
      setError(errorMessage)
      
      // Call error callback if provided
      if (onError) {
        onError(err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const widthClass = fullWidth ? 'w-full' : 'w-auto'
  const loadingText = showLoading && isLoading ? 'Loggar in...' : buttonText

  return (
    <div className={className}>
      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={`
          ${widthClass}
          flex items-center justify-center gap-3
          border border-gray-300 rounded-xl
          py-3 px-6
          hover:bg-gray-50 hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label="Sign in with Google"
      >
        {/* Google Icon - Built with Tailwind CSS */}
        <div className="w-5 h-5 relative flex-shrink-0" aria-hidden="true">
          <div className="absolute w-2.5 h-2.5 bg-[#EA4335] rounded top-0 left-0"></div>
          <div className="absolute w-2.5 h-2.5 bg-[#FBBC04] rounded top-0 right-0"></div>
          <div className="absolute w-2.5 h-2.5 bg-[#34A853] rounded bottom-0 left-0"></div>
          <div className="absolute w-2.5 h-2.5 bg-[#4285F4] rounded bottom-0 right-0"></div>
        </div>

        <span className="text-sm font-medium text-gray-700">
          {loadingText}
        </span>
      </button>

      {/* Error Message */}
      {error && (
        <div 
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  )
}
