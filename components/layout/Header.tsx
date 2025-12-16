'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HiMenu, HiX, HiPlus, HiSearch } from 'react-icons/hi'

// ⚠️ TEMPORARY: No auth required
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

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
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
