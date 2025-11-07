'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import BarcodeScanner from '@/components/sales/BarcodeScanner'
import CartTable from '@/components/sales/CartTable'
import OrderSummary from '@/components/sales/OrderSummary'

export default function SalesPage() {
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Helper to detect connection errors
  const handleError = (err: any, defaultMessage: string) => {
    const isConnectionError = err.message?.includes('fetch') ||
                              err.message?.includes('NetworkError') ||
                              err.message?.includes('Failed to fetch') ||
                              !err.message

    if (isConnectionError) {
      setError('🔌 Backend API is offline. Please start the backend server on port 3001.')
    } else {
      setError(err.message || defaultMessage)
    }
  }

  const handleStartSale = async () => {
    try {
      setLoading(true)
      setError(null)
      const order = await api.startSale()
      setCurrentOrder(order)
      setScannerOpen(true)
    } catch (err: any) {
      handleError(err, 'Failed to start sale')
      console.error('Start sale error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBarcodeScan = async (barcode: string) => {
    if (!currentOrder) return

    try {
      setLoading(true)
      setError(null)
      const updatedOrder = await api.scanBarcode(currentOrder.id, barcode)
      setCurrentOrder(updatedOrder)
    } catch (err: any) {
      handleError(err, 'Failed to scan barcode')
      console.error('Scan error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      setLoading(true)
      setError(null)
      const updatedOrder = await api.updateSalesItem(itemId, { quantity })
      setCurrentOrder(updatedOrder)
    } catch (err: any) {
      handleError(err, 'Failed to update quantity')
      console.error('Update error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove this item from cart?')) return

    try {
      setLoading(true)
      setError(null)
      const updatedOrder = await api.removeSalesItem(itemId)
      setCurrentOrder(updatedOrder)
    } catch (err: any) {
      handleError(err, 'Failed to remove item')
      console.error('Remove error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSale = async (paymentData: any) => {
    if (!currentOrder) return

    try {
      setLoading(true)
      setError(null)
      await api.confirmSale({
        orderId: currentOrder.id,
        ...paymentData,
      })

      setCurrentOrder(null)
      setScannerOpen(false)
      alert('✅ Sale completed successfully!')
    } catch (err: any) {
      handleError(err, 'Failed to confirm sale')
      console.error('Confirm error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSale = async () => {
    if (!currentOrder) return
    if (!confirm('Cancel this sale? All items will be removed.')) return

    try {
      setLoading(true)
      setError(null)
      await api.cancelSale(currentOrder.id)
      setCurrentOrder(null)
      setScannerOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to cancel sale')
      console.error('Cancel error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await api.getProducts({ limit: 1000 })
      setProducts(data.products || [])
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  const handleAddProductManually = async (productId: string) => {
    if (!currentOrder) return

    try {
      setLoading(true)
      setError(null)
      const updatedOrder = await api.addProductToSale(currentOrder.id, productId)
      setCurrentOrder(updatedOrder)
      setShowProductSearch(false)
      setSearchTerm('')
    } catch (err: any) {
      setError(err.message || 'Failed to add product')
      console.error('Add product error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.nameTh && product.nameTh.includes(searchTerm)) ||
    (product.barcode && product.barcode.includes(searchTerm))
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-gray-600 mt-1">Quick checkout & inventory sync</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/sales/history'}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                History
              </button>
              {!currentOrder && (
                <button
                  onClick={handleStartSale}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 px-6"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Sale
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`card p-4 border-l-4 mb-6 ${error.includes('offline') ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'}`}>
            <div className="flex items-center gap-3">
              <svg className={`w-6 h-6 ${error.includes('offline') ? 'text-yellow-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className={`font-medium ${error.includes('offline') ? 'text-yellow-900' : 'text-red-900'}`}>{error}</p>
                {error.includes('offline') && (
                  <p className="text-sm text-yellow-700 mt-2">
                    The frontend is running, but the backend API needs to be started separately.
                    See <code className="bg-yellow-100 px-2 py-1 rounded">TESTING_GUIDE.md</code> for setup instructions.
                  </p>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                className={error.includes('offline') ? 'text-yellow-600 hover:text-yellow-800' : 'text-red-600 hover:text-red-800'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* No Active Sale - Empty State */}
        {!currentOrder && (
          <div className="text-center py-20">
            <div className="card max-w-2xl mx-auto p-12">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Sell</h3>
              <p className="text-gray-600 text-lg mb-8">
                Start a new sale to begin scanning products
              </p>
              <button
                onClick={handleStartSale}
                disabled={loading}
                className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {loading ? 'Starting...' : 'Start New Sale'}
              </button>
            </div>
          </div>
        )}

        {/* Active Sale */}
        {currentOrder && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Add Products</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowProductSearch(true)
                        loadProducts()
                      }}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search Products
                    </button>
                    <button
                      onClick={() => setScannerOpen(!scannerOpen)}
                      className="text-sm text-gray-600 hover:text-gray-900 px-3"
                    >
                      {scannerOpen ? 'Hide Scanner' : 'Show Scanner'}
                    </button>
                  </div>
                </div>
                <BarcodeScanner
                  isOpen={scannerOpen}
                  onScan={handleBarcodeScan}
                  disabled={loading}
                />
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Shopping Cart</h2>
                <CartTable
                  items={currentOrder.items || []}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <OrderSummary
                  order={currentOrder}
                  onConfirm={handleConfirmSale}
                  onCancel={handleCancelSale}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Product Search Modal */}
        {showProductSearch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Search Products</h2>
                <button
                  onClick={() => {
                    setShowProductSearch(false)
                    setSearchTerm('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, SKU, or barcode..."
                    className="input pl-12"
                    autoFocus
                  />
                  <svg
                    className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-gray-600">
                      {searchTerm ? 'No products found' : 'Start typing to search products'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleAddProductManually(product.id)}
                        disabled={loading || product.stockQty <= 0}
                        className="w-full text-left card p-4 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                {product.nameTh && (
                                  <p className="text-sm text-gray-600">{product.nameTh}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">SKU: <span className="font-mono">{product.sku}</span></span>
                              {product.barcode && (
                                <span className="text-gray-600">Barcode: <span className="font-mono">{product.barcode}</span></span>
                              )}
                              <span className={`badge ${product.stockQty > product.minStock ? 'badge-green' : 'badge-red'}`}>
                                Stock: {product.stockQty}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-gray-900">
                              ฿{product.sellPrice?.toLocaleString()}
                            </div>
                            {product.stockQty <= 0 && (
                              <span className="text-xs text-red-600">Out of stock</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
