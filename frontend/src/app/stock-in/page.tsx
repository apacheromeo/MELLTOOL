'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import BarcodePrintLabels from '@/components/BarcodePrintLabels'

interface StockInItem {
  productId: string
  quantity: number
  unitCost: number
}

export default function StockInPage() {
  const [stockIns, setStockIns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [items, setItems] = useState<StockInItem[]>([])
  const [formData, setFormData] = useState({
    reference: `SI-${Date.now()}`,
    supplier: '',
    notes: '',
  })
  const [printLabels, setPrintLabels] = useState<any[]>([])
  const [showPrintModal, setShowPrintModal] = useState(false)

  useEffect(() => {
    loadStockIns()
    loadProducts()
  }, [])

  const loadStockIns = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getStockIns({ limit: 50 })
      setStockIns(data.stockIns || [])
    } catch (err: any) {
      // Detect if it's a connection error (backend offline)
      const isConnectionError = err.message?.includes('fetch') ||
                                err.message?.includes('NetworkError') ||
                                err.message?.includes('Failed to fetch') ||
                                !err.message

      if (isConnectionError) {
        setError('🔌 Backend API is offline. Please start the backend server on port 3001.')
      } else {
        setError(err.message || 'Failed to load stock-ins')
      }
      console.error('Stock-ins error:', err)
      // Set empty state instead of staying in loading
      setStockIns([])
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

  const handleReceive = async (id: string) => {
    if (!confirm('Mark this stock-in as received and print barcode labels?')) return

    try {
      // Find the stock-in to get its items
      const stockIn = stockIns.find(s => s.id === id)
      if (!stockIn || !stockIn.items) {
        alert('Could not find stock-in items')
        return
      }

      // Generate labels: one label per unit (quantity)
      const labels: any[] = []
      stockIn.items.forEach((item: any) => {
        const product = item.product
        if (!product) return

        // Create one label for each unit in the quantity
        for (let i = 0; i < item.quantity; i++) {
          labels.push({
            barcode: product.barcode || product.sku,
            name: product.name,
            price: product.sellPrice,
            sku: product.sku,
          })
        }
      })

      // Mark as received
      await api.receiveStockIn(id)
      loadStockIns()

      // Show print dialog with labels
      if (labels.length > 0) {
        setPrintLabels(labels)
        setShowPrintModal(true)
      } else {
        alert('✅ Stock-in received! (No barcodes available for printing)')
      }
    } catch (err: any) {
      alert('Failed to receive stock-in: ' + err.message)
    }
  }

  const addItem = () => {
    setItems([...items, { productId: '', quantity: 1, unitCost: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof StockInItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      alert('Please add at least one item')
      return
    }

    if (items.some(item => !item.productId || item.quantity <= 0 || item.unitCost <= 0)) {
      alert('Please fill in all item details correctly')
      return
    }

    try {
      const payload = {
        reference: formData.reference,
        supplier: formData.supplier || undefined,
        notes: formData.notes || undefined,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      }

      await api.createStockIn(payload)
      closeModal()
      loadStockIns()
    } catch (err: any) {
      alert('Failed to create stock-in: ' + err.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setItems([])
    setFormData({
      reference: `SI-${Date.now()}`,
      supplier: '',
      notes: '',
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stock In</h1>
              <p className="text-gray-600 mt-1">Track incoming inventory and purchases</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Stock In
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className={`card p-6 border-l-4 mb-8 ${error.includes('offline') ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'}`}>
            <div className="flex items-center gap-3">
              <svg className={`w-8 h-8 ${error.includes('offline') ? 'text-yellow-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <button onClick={loadStockIns} className="btn-secondary">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Stock-ins List */}
        {!loading && stockIns.length > 0 && (
          <div className="space-y-6">
            {stockIns.map((stockIn) => (
              <StockInCard
                key={stockIn.id}
                stockIn={stockIn}
                onReceive={handleReceive}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && stockIns.length === 0 && (
          <div className="text-center py-20">
            <div className="card max-w-2xl mx-auto p-12">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No stock-ins yet</h3>
              <p className="text-gray-600 text-lg mb-8">
                Create your first stock-in record to track incoming inventory
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Stock In
              </button>
            </div>
          </div>
        )}

        {/* New Stock-In Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">New Stock In</h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="input"
                      placeholder="SI-12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="input"
                      placeholder="Supplier name"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="textarea"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Items */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Item
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-600 mb-4">No items added yet</p>
                      <button
                        type="button"
                        onClick={addItem}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add First Item
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div key={index} className="card p-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Product *
                              </label>
                              <select
                                required
                                value={item.productId}
                                onChange={(e) => updateItem(index, 'productId', e.target.value)}
                                className="select text-sm"
                              >
                                <option value="">Select product...</option>
                                {products.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Quantity *
                              </label>
                              <input
                                type="number"
                                required
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                className="input text-sm"
                                placeholder="0"
                              />
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Unit Cost (฿) *
                              </label>
                              <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value))}
                                className="input text-sm"
                                placeholder="0.00"
                              />
                            </div>

                            <div className="md:col-span-1 flex items-end">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="btn-danger w-full"
                                title="Remove"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {item.productId && item.quantity > 0 && item.unitCost > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="font-bold text-gray-900">
                                ฿{(item.quantity * item.unitCost).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                {items.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-700">Total Cost:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ฿{calculateTotal().toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-semibold text-gray-900">{items.length}</span>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Create Stock In
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Barcode Print Modal */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900">Print Barcode Labels</h2>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <BarcodePrintLabels
                  labels={printLabels}
                  autoPrint={true}
                  onPrintComplete={() => {
                    // Optional: close modal after print
                    // setShowPrintModal(false)
                  }}
                />
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Again
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function StockInCard({ stockIn, onReceive }: any) {
  return (
    <div className="card p-6 card-hover">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-bold text-xl text-gray-900">{stockIn.reference}</h3>
            <span className={`badge ${
              stockIn.status === 'RECEIVED' ? 'badge-green' :
              stockIn.status === 'PENDING' ? 'badge-yellow' :
              'badge-red'
            }`}>
              {stockIn.status}
            </span>
          </div>
          {stockIn.supplier && (
            <p className="text-sm text-gray-600 mb-2">
              Supplier: <span className="font-medium text-gray-900">{stockIn.supplier}</span>
            </p>
          )}
          <p className="text-sm text-gray-600">
            Created by <span className="font-medium text-gray-900">{stockIn.user?.name || 'Unknown'}</span> on {new Date(stockIn.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            ฿{stockIn.totalCost?.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">{stockIn._count?.items || 0} items</div>
        </div>
      </div>

      {/* Items Preview */}
      {stockIn.items && stockIn.items.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm font-semibold text-gray-900 mb-3">Items:</div>
          <div className="space-y-2">
            {stockIn.items.slice(0, 3).map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.product?.name || 'Unknown Product'}</span>
                <span className="font-semibold text-gray-900">
                  {item.quantity} units @ ฿{item.unitCost}
                </span>
              </div>
            ))}
            {stockIn.items.length > 3 && (
              <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                + {stockIn.items.length - 3} more items
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {stockIn.notes && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">{stockIn.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {stockIn.status === 'PENDING' && (
          <button
            onClick={() => onReceive(stockIn.id)}
            className="btn-success flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mark as Received
          </button>
        )}
        <button
          onClick={() => window.location.href = `/stock-in/${stockIn.id}`}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>
      </div>
    </div>
  )
}
