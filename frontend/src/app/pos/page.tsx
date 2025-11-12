'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import POSCart from '@/components/pos/POSCart'
import POSCheckout from '@/components/pos/POSCheckout'

interface Product {
  id: string
  sku: string
  name: string
  nameTh?: string
  barcode?: string
  sellPrice: number
  stockQty: number
  imageUrl?: string
  category?: { name: string }
  brand?: { name: string }
}

interface QuickStartData {
  trending: Product[]
  recent: Product[]
  categories: any[]
  brands: any[]
}

function POSPageContent() {
  const { user } = useAuth()

  // State
  const [quickStartData, setQuickStartData] = useState<QuickStartData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'products' | 'cart'>('products')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Load Quick Start data on mount
  useEffect(() => {
    loadQuickStart()
  }, [])

  // Update cart when order changes
  useEffect(() => {
    if (currentOrder?.items) {
      setCartItems(currentOrder.items)
    }
  }, [currentOrder])

  const loadQuickStart = async () => {
    try {
      setLoading(true)
      const data = await api.posQuickStart()
      setQuickStartData(data)
    } catch (err: any) {
      console.error('Failed to load POS data:', err)
      setError('Failed to load POS data')
    } finally {
      setLoading(false)
    }
  }

  // Debounced autocomplete search
  const handleSearchChange = useCallback(async (query: string) => {
    setSearchQuery(query)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 2) {
      setSearchResults([])
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await api.posAutocomplete(query)
        setSearchResults(results)
      } catch (err) {
        console.error('Search failed:', err)
      }
    }, 300)
  }, [])

  const handleStartNewOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const order = await api.startSale()
      setCurrentOrder(order)
    } catch (err: any) {
      setError(err.message || 'Failed to start order')
    } finally {
      setLoading(false)
    }
  }

  const handleProductSelect = async (product: Product) => {
    if (!currentOrder) {
      await handleStartNewOrder()
    }

    try {
      setLoading(true)
      setError(null)
      const updatedOrder = await api.addProductToSale(
        currentOrder?.id || (await api.startSale()).id,
        product.id
      )
      setCurrentOrder(updatedOrder)
      setSearchQuery('')
      setSearchResults([])
    } catch (err: any) {
      setError(err.message || 'Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      setLoading(true)
      const updatedOrder = await api.updateSalesItem(itemId, { quantity })
      setCurrentOrder(updatedOrder)
    } catch (err: any) {
      setError(err.message || 'Failed to update quantity')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      setLoading(true)
      const updatedOrder = await api.removeSalesItem(itemId)
      setCurrentOrder(updatedOrder)
    } catch (err: any) {
      setError(err.message || 'Failed to remove item')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async (paymentData: any) => {
    if (!currentOrder) return

    try {
      setLoading(true)
      setError(null)
      await api.confirmSale({
        orderId: currentOrder.id,
        ...paymentData,
      })

      setCurrentOrder(null)
      setCartItems([])
      setViewMode('products')
      alert('✅ Order completed successfully!')
      await loadQuickStart() // Reload to update trending/recent
    } catch (err: any) {
      setError(err.message || 'Failed to complete order')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!currentOrder) return
    if (!confirm('Cancel this order?')) return

    try {
      setLoading(true)
      await api.cancelSale(currentOrder.id)
      setCurrentOrder(null)
      setCartItems([])
      setViewMode('products')
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order')
    } finally {
      setLoading(false)
    }
  }

  const displayProducts = searchQuery.length >= 2
    ? searchResults
    : selectedCategory
    ? quickStartData?.trending.filter(p => p.category?.name === selectedCategory)
    : quickStartData?.trending || []

  const cartCount = cartItems.length
  const cartTotal = currentOrder?.totalPrice || 0

  if (!quickStartData && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading POS...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🛒 Smart POS</h1>
              {currentOrder && (
                <p className="text-sm text-gray-600">Order #{currentOrder.orderNumber}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentOrder && (
                <>
                  <button
                    onClick={() => setViewMode(viewMode === 'products' ? 'cart' : 'products')}
                    className="relative p-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95 shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="px-6 py-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="container mx-auto px-6 py-4">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center justify-between">
            <p className="text-red-900">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'products' ? (
        <div className="container mx-auto px-6 py-8">
          {/* Search Bar */}
          <div className="mb-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="🔍 Search products... (type at least 2 characters)"
              className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 shadow-lg"
              autoFocus
            />
            {searchQuery.length >= 2 && searchResults.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                Found {searchResults.length} products
              </p>
            )}
          </div>

          {/* Categories Filter */}
          {!searchQuery && quickStartData && (
            <div className="mb-8">
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                    !selectedCategory
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
                {quickStartData.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.name
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat.name} ({cat.productCount})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {!searchQuery && !selectedCategory && quickStartData && (
            <>
              {/* Trending Products */}
              {quickStartData.trending.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    🔥 Trending Products
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {quickStartData.trending.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={handleProductSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Products */}
              {quickStartData.recent.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    ⏱️ Your Recent Products
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {quickStartData.recent.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={handleProductSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Search/Filter Results */}
          {(searchQuery || selectedCategory) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {displayProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleProductSelect}
                />
              ))}
              {displayProducts.length === 0 && (
                <div className="col-span-full text-center py-20">
                  <p className="text-gray-600 text-lg">No products found</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="container mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <POSCart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                disabled={loading}
              />
            </div>
            <div>
              <POSCheckout
                order={currentOrder}
                onCheckout={handleCheckout}
                onBack={() => setViewMode('products')}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 font-medium">Processing...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Product Card Component
function ProductCard({ product, onSelect }: { product: Product; onSelect: (p: Product) => void }) {
  const inStock = product.stockQty > 0

  return (
    <button
      onClick={() => onSelect(product)}
      disabled={!inStock}
      className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl p-4 border-2 transition-all text-left ${
        inStock
          ? 'border-gray-200 hover:border-blue-500 active:scale-95'
          : 'border-red-200 opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Product Image */}
      <div className="w-full aspect-square rounded-xl mb-3 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {product.imageUrl ? (
          <img
            src={product.imageUrl.startsWith('http') ? product.imageUrl : `https://melltool-backend.fly.dev${product.imageUrl}`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )}
      </div>

      {/* Product Info */}
      <h3 className="font-bold text-gray-900 line-clamp-2 min-h-[2.5rem] text-sm group-hover:text-blue-600 transition-colors">
        {product.name}
      </h3>

      {/* Price */}
      <div className="text-lg font-bold text-green-600 mt-2">
        ฿{product.sellPrice?.toLocaleString()}
      </div>

      {/* Stock */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500 font-mono truncate">{product.sku}</span>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            !inStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {!inStock ? 'Out' : product.stockQty}
        </span>
      </div>
    </button>
  )
}

export default function POSPage() {
  return (
    <ProtectedRoute allowedRoles={["OWNER", "STAFF"]}>
      <POSPageContent />
    </ProtectedRoute>
  )
}
