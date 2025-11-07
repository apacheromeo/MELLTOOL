'use client'

import { useState, useEffect } from 'react'
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

type ViewMode = 'scanner' | 'fulfillment' | 'brands' | 'categories' | 'products' | 'cart'

function POSPageContent() {
  const { user } = useAuth()
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
  const [existingOrder, setExistingOrder] = useState<any>(null) // For fulfillment mode
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({}) // item ID -> scanned qty

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadBrands()
  }, [])

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

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
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
      setProducts(data.products || [])
    } catch (err) {
      console.error('Failed to load products:', err)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderScanned = async (orderData: any) => {
    try {
      setLoading(true)
      setError(null)

      // Try to load existing order first
      if (orderData.orderNumber) {
        try {
          const existingOrder = await api.getSalesOrderByNumber(orderData.orderNumber)

          // Order found! Enter fulfillment mode
          setExistingOrder(existingOrder)
          setScannedItems({})
          setViewMode('fulfillment')
          return
        } catch (fetchErr: any) {
          // Order not found, create new one
          console.log('Order not found, creating new:', fetchErr.message)
        }

        // Create new order with this order number
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
    await loadCategories()
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

      // Add product to order
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

      // Reset state
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
    if (viewMode === 'products') {
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

  // Fulfillment mode handlers
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
