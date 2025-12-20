'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HiMenu, HiX, HiPlus, HiSearch, HiUser, HiLogout } from 'react-icons/hi'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Get auth state
  let user: any = null
  let loading = true
  let logout = async () => {}
  
  try {
    const auth = useAuth()
    user = auth.user
    loading = auth.loading
    logout = auth.logout
  } catch (error) {
    loading = false
  }

  const handleLogout = async () => {
    await logout()
    setMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            <span className="text-xl font-bold text-brand">BokaNära</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/sok" className="flex items-center gap-1 text-gray-600 hover:text-brand transition">
              <HiSearch className="w-5 h-5" />
              Hitta tjänster
            </Link>
            
            <Link href="/skapa" className="flex items-center gap-1 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition">
              <HiPlus className="w-5 h-5" />
              Skapa annons
            </Link>
            
            {/* Auth buttons */}
            {!loading && (
              user ? (
                <>
                  <Link href="/konto" className="flex items-center gap-1 text-gray-600 hover:text-brand transition">
                    <HiUser className="w-5 h-5" />
                    <span>{user.displayName || 'Mitt konto'}</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition"
                  >
                    <HiLogout className="w-5 h-5" />
                    Logga ut
                  </button>
                </>
              ) : (
                <Link href="/login" className="flex items-center gap-1 text-gray-600 hover:text-brand transition">
                  <HiUser className="w-5 h-5" />
                  Logga in
                </Link>
              )
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <Link 
                href="/sok" 
                className="flex items-center gap-2 text-gray-600 hover:text-brand transition"
                onClick={() => setMenuOpen(false)}
              >
                <HiSearch className="w-5 h-5" />
                Hitta tjänster
              </Link>
              
              <Link 
                href="/skapa" 
                className="flex items-center gap-1 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition w-fit"
                onClick={() => setMenuOpen(false)}
              >
                <HiPlus className="w-5 h-5" />
                Skapa annons
              </Link>
              
              {/* Auth buttons */}
              {!loading && (
                user ? (
                  <>
                    <Link 
                      href="/konto" 
                      className="flex items-center gap-2 text-gray-600 hover:text-brand transition"
                      onClick={() => setMenuOpen(false)}
                    >
                      <HiUser className="w-5 h-5" />
                      {user.displayName || 'Mitt konto'}
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition w-fit"
                    >
                      <HiLogout className="w-5 h-5" />
                      Logga ut
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/login" 
                    className="flex items-center gap-2 text-gray-600 hover:text-brand transition"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiUser className="w-5 h-5" />
                    Logga in
                  </Link>
                )
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
