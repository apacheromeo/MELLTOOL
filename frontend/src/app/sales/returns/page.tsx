'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

export default function ReturnsManagementPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])

  // Search and filter state
  const [orderNumber, setOrderNumber] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnOrderId, setReturnOrderId] = useState('')
  const [returnForm, setReturnForm] = useState({
    shippingCost: '',
    reason: '',
  })

  useEffect(() => {
    loadOrders()
  }, [channelFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {
        status: 'CONFIRMED',
        limit: 100,
      }

      if (channelFilter !== 'ALL') {
        params.channel = channelFilter
      }

      if (orderNumber.trim()) {
        params.orderNumber = orderNumber.trim()
      }

      if (productSearch.trim()) {
        params.productSearch = productSearch.trim()
      }

      const data = await api.getSalesHistory(params)
      setOrders(data.orders || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadOrders()
  }

  const handleToggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)))
    }
  }

  const handleReturnSingle = (orderId: string) => {
    setReturnOrderId(orderId)
    setReturnForm({ shippingCost: '', reason: '' })
    setShowReturnModal(true)
  }

  const handleReturnSelected = async () => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order to return')
      return
    }

    if (!confirm(`Are you sure you want to return ${selectedOrders.size} order(s)?`)) {
      return
    }

    try {
      const promises = Array.from(selectedOrders).map(orderId =>
        api.returnOrder(orderId, { shippingCost: 0, reason: 'Batch return' })
      )

      await Promise.all(promises)
      alert(`Successfully returned ${selectedOrders.size} order(s)!`)
      setSelectedOrders(new Set())
      loadOrders()
    } catch (err: any) {
      alert('Failed to return some orders: ' + err.message)
    }
  }

  const handleConfirmReturn = async () => {
    if (!confirm('Are you sure you want to mark this order as returned?')) {
      return
    }

    try {
      await api.returnOrder(returnOrderId, {
        shippingCost: returnForm.shippingCost ? parseFloat(returnForm.shippingCost) : undefined,
        reason: returnForm.reason,
      })
      alert('Order marked as returned successfully!')
      setShowReturnModal(false)
      setSelectedOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(returnOrderId)
        return newSet
      })
      loadOrders()
    } catch (err: any) {
      alert('Failed to return order: ' + err.message)
    }
  }

  const channels = ['ALL', 'POS', 'SHOPEE', 'LAZADA', 'LINE', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'WEBSITE', 'OTHER']

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Returns Management</h1>
              <p className="text-gray-600 mt-1">Process order returns to warehouse</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Order Number Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Order Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter order number..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Product Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Product (SKU/Name)
              </label>
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter product SKU or name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </div>

          {/* Channel Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Channel
            </label>
            <div className="flex flex-wrap gap-2">
              {channels.map((channel) => (
                <button
                  key={channel}
                  onClick={() => setChannelFilter(channel)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    channelFilter === channel
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="card p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-blue-900">
                  {selectedOrders.size} order(s) selected
                </span>
              </div>
              <button
                onClick={handleReturnSelected}
                className="px-4 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                Return Selected Orders
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading orders...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card p-4 border-l-4 border-red-500 bg-red-50 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Orders List */}
        {!loading && !error && (
          <>
            {orders.length === 0 ? (
              <div className="card p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-xl font-medium text-gray-900 mb-2">No confirmed orders found</p>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="card p-4 mb-4 bg-gray-50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">
                      Select All ({orders.length} order{orders.length !== 1 ? 's' : ''})
                    </span>
                  </label>
                </div>

                {/* Orders Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {orders.map((order) => {
                    const isSelected = selectedOrders.has(order.id)
                    const totalItems = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0

                    return (
                      <div
                        key={order.id}
                        className={`card p-6 transition-all ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'card-hover'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <div className="flex-shrink-0 pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleOrder(order.id)}
                              className="w-6 h-6 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Order Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
                                  <span className="badge badge-blue">{order.channel || 'POS'}</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Staff: {order.staff?.name || 'Unknown'} •
                                  Created: {new Date(order.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div>
                                <span className="text-xs text-gray-600">Total Items:</span>
                                <p className="font-semibold text-gray-900">{totalItems}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Total Price:</span>
                                <p className="font-semibold text-gray-900">฿{order.totalPrice?.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Customer:</span>
                                <p className="font-semibold text-gray-900">{order.customerName || '-'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">Payment:</span>
                                <p className="font-semibold text-gray-900">{order.paymentMethod || '-'}</p>
                              </div>
                            </div>

                            {/* Products Preview */}
                            {order.items && order.items.length > 0 && (
                              <div className="border-t pt-3 mt-3">
                                <p className="text-xs font-medium text-gray-600 mb-2">Products:</p>
                                <div className="flex flex-wrap gap-2">
                                  {order.items.slice(0, 5).map((item: any) => (
                                    <span
                                      key={item.id}
                                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded"
                                    >
                                      {item.sku} × {item.quantity}
                                    </span>
                                  ))}
                                  {order.items.length > 5 && (
                                    <span className="text-xs text-gray-500">
                                      +{order.items.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => router.push(`/sales/${order.id}`)}
                              className="btn-secondary text-sm whitespace-nowrap"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleReturnSingle(order.id)}
                              className="px-3 py-2 rounded-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors text-sm whitespace-nowrap"
                            >
                              Return Order
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* Return Order Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Return Order to Warehouse</h3>
              <p className="text-gray-600 mb-4">
                Mark this order as returned to warehouse. Stock will be restored and shipping cost will be tracked for expense management.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost (฿)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={returnForm.shippingCost}
                    onChange={(e) => setReturnForm({ ...returnForm, shippingCost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Round trip shipping cost..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason</label>
                  <textarea
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Reason for return..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleConfirmReturn}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                >
                  Mark as Returned
                </button>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
