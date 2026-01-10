'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { HiMenu, HiX, HiSearch, HiUser, HiLogout, HiOfficeBuilding, HiPlus } from 'react-icons/hi'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  
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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === '/sok') return pathname.startsWith('/sok')
    return pathname === href
  }

  return (
    <header className={`sticky top-0 z-40 border-b border-gray-200/80 backdrop-blur-md transition-all ${scrolled ? 'bg-white/95 shadow-sm' : 'bg-white/90'}`}>
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - goes to dashboard if logged in, home if not */}
          <Link href={user ? "/konto" : "/"} className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 tracking-tight">BokaNära</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/sok" 
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${isActive('/sok') ? 'bg-brand/10 text-brand' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              <HiSearch className="w-4 h-4" />
              Sök företag
            </Link>

            <div className="w-px h-5 bg-gray-200 mx-2" />
            
            {user ? (
              <>
                <Link 
                  href="/konto" 
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${isActive('/konto') ? 'bg-brand/10 text-brand' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  <HiOfficeBuilding className="w-4 h-4" />
                  Mina företag
                </Link>
                
                <Link 
                  href="/skapa" 
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand text-white hover:bg-brand-dark rounded-xl transition-colors shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                >
                  <HiPlus className="w-4 h-4" />
                  Lägg till företag
                </Link>

                <div className="relative group ml-2">
                  <button aria-label="Användarmeny" className="flex items-center justify-center w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20">
                    <span className="text-sm font-medium text-gray-700">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </span>
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || 'Användare'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link href="/konto" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl">
                        <HiUser className="w-4 h-4" />
                        Mitt konto
                      </Link>
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
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
                  className={`px-3 py-2 text-sm rounded-xl transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${isActive('/login') ? 'bg-brand/10 text-brand' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  Logga in
                </Link>
                
                <Link 
                  href="/skapa" 
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-brand text-white hover:bg-brand-dark rounded-xl transition-colors shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                >
                  <HiPlus className="w-4 h-4" />
                  Registrera företag
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Stäng meny' : 'Öppna meny'}
          >
            {menuOpen ? <HiX className="w-5 h-5" /> : <HiMenu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Stäng meny"
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl border-l border-gray-200 p-5 animate-slideInRight overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Link href={user ? "/konto" : "/"} className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-base">B</span>
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">BokaNära</span>
              </Link>
              <button
                className="p-2.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Stäng meny"
                onClick={() => setMenuOpen(false)}
              >
                <HiX className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* User Info (if logged in) */}
            {user && (
              <div className="mb-6 p-4 bg-gradient-to-br from-brand/5 to-brand/10 rounded-xl border border-brand/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-lg">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || 'Användare'}</p>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Link
                href="/sok"
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${isActive('/sok') ? 'bg-brand text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'}`}
                onClick={() => setMenuOpen(false)}
              >
                <HiSearch className="w-5 h-5" />
                <span>Sök företag</span>
              </Link>

              {user ? (
                <>
                  <Link
                    href="/konto"
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${isActive('/konto') ? 'bg-brand text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiOfficeBuilding className="w-5 h-5" />
                    <span>Mina företag</span>
                  </Link>

                  <Link
                    href="/skapa"
                    className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-brand to-blue-600 text-white hover:from-brand-dark hover:to-blue-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiPlus className="w-5 h-5" />
                    <span>Lägg till företag</span>
                  </Link>

                  <div className="border-t border-gray-200 my-3" />

                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-all"
                  >
                    <HiLogout className="w-5 h-5" />
                    <span>Logga ut</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${isActive('/login') ? 'bg-brand text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiUser className="w-5 h-5" />
                    <span>Logga in</span>
                  </Link>

                  <Link
                    href="/skapa"
                    className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-brand to-blue-600 text-white hover:from-brand-dark hover:to-blue-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-2"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HiPlus className="w-5 h-5" />
                    <span>Registrera företag</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
