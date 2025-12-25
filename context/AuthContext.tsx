'use client'

/* ────────────────────────────────────────────────
   context/AuthContext.tsx
   نظام المصادقة - منسوخ من المشروع القديم مع تعديلات لـ Next.js
──────────────────────────────────────────────── */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !auth) {
      setLoading(false)
      return
    }
    
    console.log('🔄 Setting up auth listener...')
    
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log('🔄 Auth state changed:', fbUser ? 'User logged in' : 'No user')
      
      if (!fbUser) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        // Reload user data from Firebase Auth
        await fbUser.reload()
        const fresh = auth?.currentUser
        
        if (!fresh) {
          setUser(null)
          setLoading(false)
          return
        }

        // Set user immediately (don't wait for Firestore)
        setUser(fresh)
        
        // Sync with Firestore in background (non-blocking)
        if (db) {
          const ref = doc(db, 'users', fresh.uid)
          
          // Don't block page load for Firestore operations
          getDoc(ref)
            .then(snap => {
              if (!snap.exists()) {
                const userData = {
                  uid: fresh.uid,
                  email: fresh.email,
                  displayName: fresh.displayName,
                  photoURL: fresh.photoURL,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                }
                setDoc(ref, userData, { merge: true }).catch(console.warn)
              }
            })
            .catch((err) => console.warn('⚠️ Firestore sync error:', err.message))
        }
        
        console.log('✅ User set successfully')
      } catch (err: any) {
        console.warn('❗ Auth sync error:', err.message)
        // Set user even on error
        setUser(fbUser)
      } finally {
        setLoading(false)
        console.log('✅ Auth loading completed')
      }
    })

    return () => unsubscribe()
  }, [])

  // Google Sign In - نفس الطريقة من المشروع القديم
  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Auth not initialized')
    }
    
    console.log('🔐 Starting Google sign-in...')
    const provider = new GoogleAuthProvider()
    
    // Add scopes for better user info
    provider.addScope('email')
    provider.addScope('profile')
    
    // Force account selection
    provider.setCustomParameters({
      prompt: 'select_account'
    })
    
    await signInWithPopup(auth, provider)
    console.log('✅ Google sign-in successful')
  }

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error('Auth not initialized')
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    if (!auth) throw new Error('Auth not initialized')
    
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: name })
    
    // Create user document in Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: name,
          photoURL: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      } catch (e) {
        console.warn('Failed to create user document:', e)
      }
    }
  }

  const logout = async () => {
    if (!auth) return
    
    try {
      console.log('🚪 Logging out user...')
      // Clear user state immediately
      setUser(null)
      
      // Sign out from Firebase
      await signOut(auth)
      console.log('✅ Firebase signOut successful')
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        sessionStorage.clear()
      }
      
      console.log('✅ Logout completed successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if Firebase logout fails, clear local state
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
