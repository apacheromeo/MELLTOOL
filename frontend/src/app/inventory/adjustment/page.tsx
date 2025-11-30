'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'
import { api } from '@/lib/api'

interface StockAdjustment {
  id: string
  product: {
    sku: string
    name: string
    imageUrl?: string
  }
  type: 'INCREASE' | 'DECREASE'
  reason: string
  quantity: number
  oldStock: number
  newStock: number
  adjustedUser: {
    name: string
    email: string
  }
  notes?: string
  createdAt: string
}

interface Product {
  id: string
  sku: string
  name: string
  nameTh: string
  stockQty: number
  imageUrl?: string
}

export default function StockAdjustmentPage() {
  const router = useRouter()
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  // Product search for the form
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchingProducts, setSearchingProducts] = useState(false)

  const [formData, setFormData] = useState({
    type: 'INCREASE' as 'INCREASE' | 'DECREASE',
    reason: '' as 'DAMAGED' | 'LOST' | 'FOUND' | 'EXPIRED' | 'STOLEN' | 'INVENTORY_COUNT' | 'OTHER' | '',
    quantity: 0,
    notes: ''
  })

  useEffect(() => {
    loadAdjustments()
  }, [])

  useEffect(() => {
    if (productSearch.length >= 2) {
      searchProducts()
    } else {
      setProductResults([])
    }
  }, [productSearch])

  const loadAdjustments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getStockAdjustments({ limit: 100 })
      setAdjustments(response.adjustments || [])
    } catch (err: any) {
      console.error('Failed to load adjustments:', err)
      setError(err.message || 'Failed to load stock adjustments')
    } finally {
      setLoading(false)
    }
  }

  const searchProducts = async () => {
    try {
      setSearchingProducts(true)
      const response = await api.getProducts({ search: productSearch, limit: 20 })
      setProductResults(response.products || [])
    } catch (err) {
      console.error('Failed to search products:', err)
      setProductResults([])
    } finally {
      setSearchingProducts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProduct) {
      alert('Please select a product')
      return
    }

    if (!formData.reason) {
      alert('Please select a reason')
      return
    }

    if (formData.quantity <= 0) {
      alert('Quantity must be greater than 0')
      return
    }

    try {
      setLoading(true)
      await api.createStockAdjustment({
        productId: selectedProduct.id,
        type: formData.type,
        reason: formData.reason as any,
        quantity: formData.quantity,
        notes: formData.notes || undefined,
      })

      alert('✅ Stock adjustment created successfully!')
      closeModal()
      loadAdjustments()
    } catch (err: any) {
      console.error('Failed to create adjustment:', err)
      alert('Failed to create stock adjustment: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedProduct(null)
    setProductSearch('')
    setProductResults([])
    setFormData({
      type: 'INCREASE',
      reason: '',
      quantity: 0,
      notes: ''
    })
  }

  const filteredAdjustments = adjustments.filter(adj => {
    const typeFilter = filterType === 'all' || adj.type === filterType.toUpperCase()
    const searchFilter = !searchTerm ||
      adj.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    return typeFilter && searchFilter
  })

  const totalIncrease = adjustments.filter(a => a.type === 'INCREASE').reduce((sum, a) => sum + a.quantity, 0)
  const totalDecrease = adjustments.filter(a => a.type === 'DECREASE').reduce((sum, a) => sum + a.quantity, 0)
  const netChange = totalIncrease - totalDecrease

  const reasonOptions = [
    { value: 'DAMAGED', label: 'Damaged / เสียหาย', icon: '💔' },
    { value: 'LOST', label: 'Lost / สูญหาย', icon: '❓' },
    { value: 'FOUND', label: 'Found / พบเพิ่ม', icon: '🔍' },
    { value: 'EXPIRED', label: 'Expired / หมดอายุ', icon: '⏰' },
    { value: 'STOLEN', label: 'Stolen / ถูกขโมย', icon: '🚨' },
    { value: 'INVENTORY_COUNT', label: 'Inventory Count / นับสต็อก', icon: '✏️' },
    { value: 'OTHER', label: 'Other / อื่นๆ', icon: '📝' }
  ]

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Adjustment</h1>
            <p className="text-gray-600 mt-1">Adjust stock for damaged, lost, or found items</p>
            <p className="text-sm text-gray-500">ปรับปรุงสต็อกสำหรับสินค้าที่เสียหาย สูญหาย หรือพบเพิ่ม</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Adjustment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Adjustments</p>
                <p className="text-3xl font-bold text-gray-900">{adjustments.length}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Increased</p>
                <p className="text-3xl font-bold text-green-600">+{totalIncrease}</p>
                <p className="text-xs text-gray-500 mt-1">units added</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Decreased</p>
                <p className="text-3xl font-bold text-red-600">-{totalDecrease}</p>
                <p className="text-xs text-gray-500 mt-1">units removed</p>
              </div>
              <div className="text-4xl">📉</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Net Change</p>
                <p className={`text-3xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netChange >= 0 ? '+' : ''}{netChange}
                </p>
                <p className="text-xs text-gray-500 mt-1">overall</p>
              </div>
              <div className="text-4xl">⚖️</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name or SKU..."
                className="input pl-10"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select"
            >
              <option value="all">All Types</option>
              <option value="increase">Increase Only</option>
              <option value="decrease">Decrease Only</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Adjustments Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading adjustments...</p>
          </div>
        ) : filteredAdjustments.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔧</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'No Adjustments Found' : 'No Adjustments Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first stock adjustment'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Adjustment
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Change</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Adjusted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAdjustments.map((adjustment) => {
                    const date = new Date(adjustment.createdAt)
                    const formattedDate = date.toLocaleString('en-GB', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })

                    return (
                      <tr key={adjustment.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{formattedDate}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {adjustment.product.imageUrl && (
                              <img
                                src={adjustment.product.imageUrl}
                                alt={adjustment.product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-gray-900">{adjustment.product.name}</div>
                              <div className="text-xs text-gray-500">{adjustment.product.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${
                            adjustment.type === 'INCREASE'
                              ? 'badge-green'
                              : 'badge-red'
                          }`}>
                            {adjustment.type === 'INCREASE' ? '📈 Increase' : '📉 Decrease'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="badge badge-gray">{adjustment.reason.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-lg font-bold ${
                            adjustment.type === 'INCREASE' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {adjustment.type === 'INCREASE' ? '+' : '-'}{adjustment.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <span className="text-gray-500">{adjustment.oldStock}</span>
                            <svg className="inline-block w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="font-semibold text-gray-900">{adjustment.newStock}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{adjustment.adjustedUser.name}</span>
                          {adjustment.notes && (
                            <div className="text-xs text-gray-500 mt-1" title={adjustment.notes}>
                              📝 {adjustment.notes.substring(0, 30)}{adjustment.notes.length > 30 ? '...' : ''}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Adjustment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">New Stock Adjustment</h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Product Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Product *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="input"
                        placeholder="Search by SKU or name..."
                        disabled={!!selectedProduct}
                      />
                      {searchingProducts && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>

                    {/* Product Search Results */}
                    {productResults.length > 0 && !selectedProduct && (
                      <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        {productResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              setSelectedProduct(product)
                              setProductSearch('')
                              setProductResults([])
                            }}
                            className="w-full p-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 text-left"
                          >
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-600">{product.nameTh}</div>
                              <div className="text-xs text-gray-500">
                                {product.sku} • Stock: {product.stockQty}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected Product Display */}
                    {selectedProduct && (
                      <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {selectedProduct.imageUrl && (
                              <img
                                src={selectedProduct.imageUrl}
                                alt={selectedProduct.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-gray-900">{selectedProduct.name}</div>
                              <div className="text-sm text-gray-600">{selectedProduct.nameTh}</div>
                              <div className="text-xs text-gray-500">
                                {selectedProduct.sku} • Current Stock: {selectedProduct.stockQty}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedProduct(null)}
                            className="p-2 hover:bg-white rounded-lg transition"
                          >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjustment Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'INCREASE' })}
                        className={`p-4 rounded-lg border-2 transition ${
                          formData.type === 'INCREASE'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">📈</div>
                        <div className="font-semibold text-gray-900">Increase</div>
                        <div className="text-xs text-gray-600">Add stock</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'DECREASE' })}
                        className={`p-4 rounded-lg border-2 transition ${
                          formData.type === 'DECREASE'
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">📉</div>
                        <div className="font-semibold text-gray-900">Decrease</div>
                        <div className="text-xs text-gray-600">Remove stock</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason *
                    </label>
                    <select
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="select"
                    >
                      <option value="">Select a reason...</option>
                      {reasonOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="input"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="textarea"
                      rows={3}
                      placeholder="Additional notes about this adjustment..."
                    />
                  </div>

                  {/* Preview */}
                  {formData.quantity > 0 && selectedProduct && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Stock will change from:</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedProduct.stockQty}
                            <svg className="inline-block w-6 h-6 mx-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className={formData.type === 'INCREASE' ? 'text-green-600' : 'text-red-600'}>
                              {formData.type === 'INCREASE'
                                ? selectedProduct.stockQty + formData.quantity
                                : selectedProduct.stockQty - formData.quantity}
                            </span>
                          </p>
                        </div>
                        <div className="text-4xl">
                          {formData.type === 'INCREASE' ? '📈' : '📉'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Create Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
