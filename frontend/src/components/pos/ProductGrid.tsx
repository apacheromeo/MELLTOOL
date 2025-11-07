'use client'

import { useState, useRef, useEffect } from 'react'

interface ProductGridProps {
  products: any[]
  loading: boolean
  onSelectProduct: (product: any) => void
  onBarcodeScanned: (barcode: string) => void
}

export default function ProductGrid({
  products,
  loading,
  onSelectProduct,
  onBarcodeScanned,
}: ProductGridProps) {
  const [showScanner, setShowScanner] = useState(true) // Show scanner by default on products page
  const [barcode, setBarcode] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
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

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      product.name?.toLowerCase().includes(search) ||
      product.nameTh?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search) ||
      product.barcode?.toLowerCase().includes(search)
    )
  })

  return (
    <div>
      {/* Header with Search and Scanner */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`px-6 py-4 rounded-2xl font-medium transition-all shadow-lg active:scale-95 whitespace-nowrap ${
              showScanner
                ? 'bg-gray-200 text-gray-700'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              {showScanner ? 'Hide' : 'Scan'}
            </div>
          </button>
        </div>

        {/* Barcode Scanner */}
        {showScanner && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <form onSubmit={handleScan} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="🔍 Scan or enter product barcode..."
                className="flex-1 px-6 py-4 text-lg border-2 border-green-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-green-500 bg-white"
              />
              <button
                type="submit"
                disabled={!barcode.trim()}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
              >
                Add to Cart
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading products...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'No products found matching your search' : 'No products available'}
          </p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && filteredProducts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.map((product) => {
            const inStock = product.stockQty > 0
            const lowStock = product.stockQty <= product.minStock

            return (
              <button
                key={product.id}
                onClick={() => onSelectProduct(product)}
                disabled={!inStock}
                className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl p-6 border-2 transition-all ${
                  inStock
                    ? 'border-gray-200 hover:border-blue-500 active:scale-95'
                    : 'border-red-200 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Product Image */}
                <div className={`w-full aspect-square rounded-xl mb-4 flex items-center justify-center overflow-hidden ${
                  inStock ? 'bg-gradient-to-br from-gray-100 to-gray-200' : 'bg-gray-100'
                }`}>
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl.startsWith('http') ? product.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${product.imageUrl}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  {product.nameTh && (
                    <p className="text-sm text-gray-600 line-clamp-1">{product.nameTh}</p>
                  )}

                  {/* Price */}
                  <div className="text-2xl font-bold text-green-600">
                    ฿{product.sellPrice?.toLocaleString()}
                  </div>

                  {/* Stock Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500 font-mono">{product.sku}</span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        !inStock
                          ? 'bg-red-100 text-red-700'
                          : lowStock
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {!inStock ? 'Out of Stock' : `Stock: ${product.stockQty}`}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
