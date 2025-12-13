'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { HiMenu, HiX, HiUser, HiPlus, HiLogout, HiLogin } from 'react-icons/hi'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, loading, logout } = useAuth()

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
            <Link href="/sok" className="text-gray-600 hover:text-brand transition">
              Hitta tjänster
            </Link>
            
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user ? (
              <>
                <Link href="/skapa" className="flex items-center gap-1 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition">
                  <HiPlus className="w-5 h-5" />
                  Skapa annons
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-brand transition">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center">
                        <HiUser className="w-5 h-5 text-brand" />
                      </div>
                    )}
                    <span className="max-w-[100px] truncate">{user.displayName || 'Konto'}</span>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-2">
                      <Link href="/konto" className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                        <HiUser className="w-5 h-5" />
                        Mitt konto
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <HiLogout className="w-5 h-5" />
                        Logga ut
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-brand transition">
                  Logga in
                </Link>
                <Link href="/registrera" className="flex items-center gap-1 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition">
                  Skapa konto
                </Link>
              </>
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
                className="text-gray-600 hover:text-brand transition"
                onClick={() => setMenuOpen(false)}
              >
                Hitta tjänster
              </Link>
              
              {user ? (
                <>
                  <Link 
                    href="/skapa" 
                    className="flex items-center gap-1 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition w-fit"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiPlus className="w-5 h-5" />
                    Skapa annons
                  </Link>
                  <Link 
                    href="/konto" 
                    className="flex items-center gap-2 text-gray-600 hover:text-brand transition"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiUser className="w-5 h-5" />
                    Mitt konto
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 transition"
                  >
                    <HiLogout className="w-5 h-5" />
                    Logga ut
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="flex items-center gap-1 text-gray-600 hover:text-brand transition"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiLogin className="w-5 h-5" />
                    Logga in
                  </Link>
                  <Link 
                    href="/registrera" 
                    className="flex items-center gap-1 bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition w-fit"
                    onClick={() => setMenuOpen(false)}
                  >
                    Skapa konto
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
