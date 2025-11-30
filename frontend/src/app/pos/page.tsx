'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import QRScanner from '@/components/pos/QRScanner'
import OrderFulfillment from '@/components/pos/OrderFulfillment'
import BrandGrid from '@/components/pos/BrandGrid'
import CategoryGrid from '@/components/pos/CategoryGrid'
import ProductGrid from '@/components/pos/ProductGrid'
import POSCart from '@/components/pos/POSCart'
import POSCheckout from '@/components/pos/POSCheckout'

type ViewMode = 'scanner' | 'fulfillment' | 'brands' | 'categories' | 'products' | 'cart' | 'orders'

function POSPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('scanner')
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)

  // Data state
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  // Order state
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [existingOrder, setExistingOrder] = useState<any>(null)
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({})
  const [ordersList, setOrdersList] = useState<any[]>([])

  // Search state - NEW!
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadBrands()
  }, [])

  // Reset state when component mounts or user changes
  useEffect(() => {
    // Check if returning from order detail page
    const viewParam = searchParams.get('view')
    if (viewParam === 'orders') {
      setViewMode('orders')
      loadOrders()
    } else {
      // Reset to scanner view on mount to prevent getting stuck
      setViewMode('scanner')
      setExistingOrder(null)
      setCurrentOrder(null)
      setScannedItems({})
      setCartItems([])
      setSelectedBrand(null)
      setSelectedCategory(null)
    }
  }, [user?.id, searchParams])

  // Update cart items when order changes
  useEffect(() => {
    if (currentOrder?.items) {
      setCartItems(currentOrder.items)
    }
  }, [currentOrder])

  const loadBrands = async () => {
    try {
      const data = await api.getBrands()
      setBrands(data.filter((b: any) => b.isActive))
    } catch (err) {
      console.error('Failed to load brands:', err)
    }
  }

  const loadCategories = async (brandId?: string) => {
    try {
      const data = await api.getCategories(brandId)
      setCategories(data.filter((c: any) => c.isActive))
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const loadProducts = async (brandId?: string, categoryId?: string) => {
    try {
      setLoading(true)
      const params: any = { limit: 100 }
      if (brandId) params.brand = brandId
      if (categoryId) params.category = categoryId

      const data = await api.getProducts(params)
      // Filter out master products that are not visible (hide master variants in POS)
      const filteredProducts = (data.products || []).filter((p: any) => {
        // Show the product if:
        // 1. It's not a master product (isMaster = false), OR
        // 2. It's a master product but visible (isMaster = true AND isVisible = true)
        return !p.isMaster || (p.isMaster && p.isVisible)
      })
      setProducts(filteredProducts)
    } catch (err) {
      console.error('Failed to load products:', err)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await api.getSalesOrders({ limit: 50 })
      setOrdersList(data.orders || [])
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  // NEW: Autocomplete search handler
  const handleSearchChange = useCallback(async (query: string) => {
    setSearchQuery(query)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await api.posAutocomplete(query)
        setSearchResults(results)
        setShowSearchResults(true)
      } catch (err) {
        console.error('Search failed:', err)
      }
    }, 300)
  }, [])

  // NEW: Quick add from search
  const handleSearchProductSelect = async (product: any) => {
    if (!currentOrder) {
      // Auto-start order if none exists
      try {
        const order = await api.startSale()
        setCurrentOrder(order)
      } catch (err: any) {
        setError(err.message || 'Failed to start order')
        return
      }
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
      setShowSearchResults(false)
    } catch (err: any) {
      setError(err.message || 'Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderScanned = async (orderData: any) => {
    try {
      setLoading(true)
      setError(null)

      if (orderData.orderNumber) {
        try {
          const existingOrder = await api.getSalesOrderByNumber(orderData.orderNumber)

          // Check order status
          if (existingOrder.status === 'DRAFT') {
            // For DRAFT orders, load as current order so staff can continue adding items
            setCurrentOrder(existingOrder)
            setExistingOrder(null)
            setScannedItems({})
            setViewMode('brands')
          } else {
            // For CONFIRMED/other orders, go to fulfillment mode
            setExistingOrder(existingOrder)
            setCurrentOrder(null)
            setScannedItems({})
            setViewMode('fulfillment')
          }
          return
        } catch (fetchErr: any) {
          console.log('Order not found, creating new:', fetchErr.message)
        }

        const order = await api.startSale({ orderNumber: orderData.orderNumber })
        setCurrentOrder(order)
        setViewMode('brands')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process order')
    } finally {
      setLoading(false)
    }
  }

  const handleStartNewOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const order = await api.startSale()
      setCurrentOrder(order)
      setViewMode('brands')
    } catch (err: any) {
      setError(err.message || 'Failed to start order')
    } finally {
      setLoading(false)
    }
  }

  const handleBrandSelect = async (brand: any) => {
    setSelectedBrand(brand)
    await loadCategories(brand.id)
    setViewMode('categories')
  }

  const handleCategorySelect = async (category: any) => {
    setSelectedCategory(category)
    await loadProducts(selectedBrand?.id, category?.id)
    setViewMode('products')
  }

  const handleProductSelect = async (product: any) => {
    if (!currentOrder) return

    try {
      setLoading(true)
      setError(null)
      const updatedOrder = await api.addProductToSale(currentOrder.id, product.id)
      setCurrentOrder(updatedOrder)
    } catch (err: any) {
      setError(err.message || 'Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  const handleBarcodeScanned = async (barcode: string) => {
    if (!currentOrder) return

    try {
      setLoading(true)
      setError(null)
      const updatedOrder = await api.scanBarcode(currentOrder.id, barcode)
      setCurrentOrder(updatedOrder)
    } catch (err: any) {
      setError(err.message || 'Failed to scan barcode')
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
      setSelectedBrand(null)
      setSelectedCategory(null)
      setViewMode('scanner')

      alert('✅ Order completed successfully!')

    } catch (err: any) {
      setError(err.message || 'Failed to complete order')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (viewMode === 'fulfillment') {
      // Go back to scanner from fulfillment
      setExistingOrder(null)
      setScannedItems({})
      setViewMode('scanner')
    } else if (viewMode === 'orders') {
      setViewMode('scanner')
    } else if (viewMode === 'products') {
      setViewMode('categories')
      setSelectedCategory(null)
    } else if (viewMode === 'categories') {
      setViewMode('brands')
      setSelectedCategory(null)
    } else if (viewMode === 'brands') {
      setViewMode('scanner')
      setSelectedBrand(null)
    } else if (viewMode === 'cart') {
      setViewMode('brands')
    }
  }

  const handleCancelOrder = async () => {
    if (!currentOrder) return
    if (!confirm('Cancel this order? All items will be removed.')) return

    try {
      setLoading(true)
      await api.cancelSale(currentOrder.id)
      setCurrentOrder(null)
      setCartItems([])
      setSelectedBrand(null)
      setSelectedCategory(null)
      setViewMode('scanner')
    } catch (err: any) {
      setError(err.message || 'Failed to cancel order')
    } finally {
      setLoading(false)
    }
  }

  const handleFulfillmentItemScanned = (itemId: string, barcode: string) => {
    setScannedItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }))
  }

  const handleFulfillmentComplete = async () => {
    if (!existingOrder) return

    try {
      setLoading(true)
      setError(null)

      await api.confirmSale({
        orderId: existingOrder.id,
      })

      alert('✅ Order fulfilled and completed successfully!')
      setExistingOrder(null)
      setScannedItems({})
      setViewMode('scanner')

    } catch (err: any) {
      setError(err.message || 'Failed to complete order')
    } finally {
      setLoading(false)
    }
  }

  const handleFulfillmentCancel = () => {
    if (confirm('Cancel fulfillment? You will return to the scanner.')) {
      setExistingOrder(null)
      setScannedItems({})
      setViewMode('scanner')
    }
  }

  const handleRequestCancellation = async (orderId: string) => {
    const reason = prompt('Please provide a reason for cancellation:')
    if (!reason || !reason.trim()) {
      alert('Cancellation reason is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await api.requestCancellation(orderId, reason.trim())
      alert('✅ Cancellation request submitted successfully! Waiting for owner approval.')
      loadOrders() // Refresh orders list
    } catch (err: any) {
      setError(err.message || 'Failed to request cancellation')
      alert('Failed to request cancellation: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDraftOrder = async (orderId: string) => {
    if (!confirm('Delete this draft order? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      await api.cancelSale(orderId)
      alert('✅ Draft order deleted successfully!')
      loadOrders() // Refresh orders list
    } catch (err: any) {
      setError(err.message || 'Failed to delete draft order')
      alert('Failed to delete draft order: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const cartCount = cartItems.length
  const cartTotal = currentOrder?.totalPrice || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {viewMode !== 'scanner' && (
                <button
                  onClick={handleBack}
                  className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">POS System</h1>
                {currentOrder && (
                  <p className="text-sm text-gray-600">Order #{currentOrder.orderNumber}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View Orders Button */}
              {viewMode === 'scanner' && (
                <button
                  onClick={() => {
                    loadOrders()
                    setViewMode('orders')
                  }}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all active:scale-95 shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Orders
                </button>
              )}

              {/* Cart Button */}
              {currentOrder && (
                <button
                  onClick={() => setViewMode('cart')}
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
              )}

              {/* Cancel Order */}
              {currentOrder && (
                <button
                  onClick={handleCancelOrder}
                  className="px-6 py-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-all active:scale-95"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* NEW: Search Bar - Always visible when order exists */}
          {currentOrder && viewMode !== 'cart' && (
            <div className="mt-4 relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="🔍 Quick search: Type product name, SKU, or barcode..."
                  className="w-full px-6 py-4 text-lg border-2 border-blue-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                      setShowSearchResults(false)
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-blue-200 max-h-96 overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSearchProductSelect(product)}
                      disabled={product.stockQty === 0}
                      className="w-full p-4 hover:bg-blue-50 transition-colors flex items-center gap-4 border-b border-gray-100 last:border-b-0 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl.startsWith('http') ? product.imageUrl : `https://melltool-backend.fly.dev${product.imageUrl}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{product.sku}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="font-bold text-green-600">฿{product.sellPrice?.toLocaleString()}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${product.stockQty > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {product.stockQty > 0 ? `Stock: ${product.stockQty}` : 'Out of Stock'}
                          </span>
                        </div>
                      </div>

                      {/* Add Icon */}
                      {product.stockQty > 0 && (
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="container mx-auto px-6 py-4">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-900 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {viewMode === 'scanner' && (
          <QRScanner
            onOrderScanned={handleOrderScanned}
            onStartNew={handleStartNewOrder}
          />
        )}

        {viewMode === 'fulfillment' && existingOrder && (
          <OrderFulfillment
            order={existingOrder}
            onItemScanned={handleFulfillmentItemScanned}
            onComplete={handleFulfillmentComplete}
            onCancel={handleFulfillmentCancel}
            scannedItems={scannedItems}
          />
        )}

        {viewMode === 'brands' && (
          <BrandGrid
            brands={brands}
            onSelectBrand={handleBrandSelect}
            onBarcodeScanned={handleBarcodeScanned}
            currentOrder={currentOrder}
          />
        )}

        {viewMode === 'categories' && (
          <CategoryGrid
            categories={categories}
            selectedBrand={selectedBrand}
            onSelectCategory={handleCategorySelect}
            onBarcodeScanned={handleBarcodeScanned}
          />
        )}

        {viewMode === 'products' && (
          <ProductGrid
            products={products}
            loading={loading}
            onSelectProduct={handleProductSelect}
            onBarcodeScanned={handleBarcodeScanned}
          />
        )}

        {viewMode === 'cart' && (
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
                onBack={() => setViewMode('brands')}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {viewMode === 'orders' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Orders List</h2>
                <p className="text-purple-100">View and manage sales orders</p>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  <p className="text-gray-600 mt-4">Loading orders...</p>
                </div>
              ) : ordersList.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-600">There are no orders to display</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Order #</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ordersList.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <span className="font-mono font-semibold text-gray-900">{order.orderNumber}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700">{order.items?.length || 0} items</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-900">฿{order.totalPrice?.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{order.paymentMethod || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              order.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => router.push(`/sales/${order.id}?returnTo=pos-orders`)}
                                className="btn-secondary text-xs px-3 py-1.5"
                              >
                                View
                              </button>
                              {order.status === 'DRAFT' && user?.role === 'STAFF' && (
                                <button
                                  onClick={() => handleDeleteDraftOrder(order.id)}
                                  className="btn-secondary text-xs px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                >
                                  Delete
                                </button>
                              )}
                              {order.status === 'CONFIRMED' && user?.role === 'STAFF' && (
                                <button
                                  onClick={() => handleRequestCancellation(order.id)}
                                  className="btn-secondary text-xs px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200"
                                >
                                  Request Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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


export default function POSPage() {
  return (
    <ProtectedRoute allowedRoles={["OWNER", "STAFF"]}>
      <POSPageContent />
    </ProtectedRoute>
  )
}
