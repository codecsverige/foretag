'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { HiMenu, HiX, HiSearch, HiUser, HiLogout, HiOfficeBuilding, HiPlus } from 'react-icons/hi'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  let user = null
  let logout = async () => {}
  
  try {
    const auth = useAuth()
    user = auth.user
    logout = auth.logout
  } catch {
    // Auth not available
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-sm' : 'border-b border-gray-200'}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo - goes to dashboard if logged in, home if not */}
          <Link href={user ? "/konto" : "/"} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">BokaNära</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/sok" 
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <HiSearch className="w-4 h-4" />
              Sök företag
            </Link>

            <div className="w-px h-5 bg-gray-200 mx-2" />
            
            {user ? (
              <>
                <Link 
                  href="/konto" 
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <HiOfficeBuilding className="w-4 h-4" />
                  Mina företag
                </Link>
                
                <Link 
                  href="/skapa" 
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                >
                  <HiPlus className="w-4 h-4" />
                  Lägg till företag
                </Link>

                <div className="relative group ml-2">
                  <button className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <span className="text-sm font-medium text-gray-700">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </span>
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || 'Användare'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link href="/konto" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                        <HiUser className="w-4 h-4" />
                        Mitt konto
                      </Link>
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        <HiLogout className="w-4 h-4" />
                        Logga ut
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Logga in
                </Link>
                
                <Link 
                  href="/skapa" 
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                >
                  <HiPlus className="w-4 h-4" />
                  Registrera företag
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden py-3 border-t border-gray-100">
            <div className="space-y-1">
              <Link 
                href="/sok" 
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                <HiSearch className="w-4 h-4" />
                Sök företag
              </Link>

              {user ? (
                <>
                  <Link 
                    href="/konto" 
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiOfficeBuilding className="w-4 h-4" />
                    Mina företag
                  </Link>
                  <Link 
                    href="/skapa" 
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiPlus className="w-4 h-4" />
                    Lägg till företag
                  </Link>
                  <button 
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    <HiLogout className="w-4 h-4" />
                    Logga ut
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiUser className="w-4 h-4" />
                    Logga in
                  </Link>
                  <Link 
                    href="/skapa" 
                    className="flex items-center justify-center gap-2 mx-3 mt-2 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiPlus className="w-4 h-4" />
                    Registrera företag
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
