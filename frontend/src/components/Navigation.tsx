'use client'

import { useState } from 'react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Inventory', href: '/inventory', icon: '📦' },
    { name: 'Stock In', href: '/stock-in', icon: '📥' },
    { name: 'Sales / POS', href: '/sales', icon: '💳' },
    { name: 'AI Forecasting', href: '/forecasting', icon: '🤖' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ]

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition group">
            <div className="text-2xl animate-float">📦</div>
            <span className="text-xl font-bold text-white heading-glass">
              StockFlow
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-white hover:bg-white/20 transition flex items-center gap-2 font-medium backdrop-blur-sm"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/20 transition text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/20 rounded-lg transition"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
