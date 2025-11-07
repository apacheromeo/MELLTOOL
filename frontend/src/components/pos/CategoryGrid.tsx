'use client'

import { useState, useRef, useEffect } from 'react'

interface CategoryGridProps {
  categories: any[]
  selectedBrand: any
  onSelectCategory: (category: any) => void
  onBarcodeScanned: (barcode: string) => void
}

export default function CategoryGrid({
  categories,
  selectedBrand,
  onSelectCategory,
  onBarcodeScanned,
}: CategoryGridProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [barcode, setBarcode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showScanner && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showScanner])

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (barcode.trim()) {
      onBarcodeScanned(barcode.trim())
      setBarcode('')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold text-blue-600">
              {selectedBrand?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{selectedBrand?.name}</h2>
            <p className="text-gray-600">Select a category</p>
          </div>
        </div>

        <button
          onClick={() => setShowScanner(!showScanner)}
          className={`px-6 py-4 rounded-2xl font-medium transition-all shadow-lg active:scale-95 ${
            showScanner
              ? 'bg-gray-200 text-gray-700'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            {showScanner ? 'Hide Scanner' : 'Scan Barcode'}
          </div>
        </button>
      </div>

      {/* Barcode Scanner */}
      {showScanner && (
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <form onSubmit={handleScan} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or enter product barcode..."
              className="flex-1 px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-green-500"
            />
            <button
              type="submit"
              disabled={!barcode.trim()}
              className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
            >
              Add to Cart
            </button>
          </form>
        </div>
      )}

      {/* Category Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">No categories available</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 border-2 border-gray-200 hover:border-purple-500 transition-all active:scale-95"
            >
              {/* Category Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>

              {/* Category Name */}
              <h3 className="text-xl font-bold text-gray-900 mb-1 text-center group-hover:text-purple-600 transition-colors">
                {category.name}
              </h3>
              {category.nameTh && (
                <p className="text-sm text-gray-600 text-center">{category.nameTh}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
