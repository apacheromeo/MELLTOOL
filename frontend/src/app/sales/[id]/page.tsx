'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

export default function SalesOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // Edit order modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    paymentMethod: '',
    notes: '',
  })

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Return order modal state
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnForm, setReturnForm] = useState({
    shippingCost: '',
    reason: '',
  })

  useEffect(() => {
    loadOrder()
    loadUserProfile()
  }, [orderId])

  const loadOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getSalesOrder(orderId)
      setOrder(data)
      setEditForm({
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        paymentMethod: data.paymentMethod || '',
        notes: data.notes || '',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      const profile = await api.getProfile()
      setUser(profile)
    } catch (err) {
      console.error('Failed to load user profile:', err)
    }
  }

  const handleUpdateOrder = async () => {
    try {
      await api.updateOrder(orderId, editForm)
      alert('Order updated successfully!')
      setShowEditModal(false)
      loadOrder()
    } catch (err: any) {
      alert('Failed to update order: ' + err.message)
    }
  }

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason')
      return
    }

    const confirmMessage = user?.role === 'STAFF'
      ? 'Submit cancellation request for approval?'
      : 'Are you sure you want to cancel this order?'

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      if (user?.role === 'STAFF') {
        // STAFF users create a cancellation request
        await api.requestCancellation(orderId, cancelReason)
        alert('Cancellation request submitted successfully! Awaiting admin approval.')
      } else {
        // OWNER/MOD can cancel directly
        await api.cancelSale(orderId, {
          reason: cancelReason,
          requiresApproval: false,
        })
        alert('Order canceled successfully!')
      }
      setShowCancelModal(false)
      setCancelReason('')
      loadOrder()
    } catch (err: any) {
      alert('Failed to process cancellation: ' + err.message)
    }
  }

  const handleReturnOrder = async () => {
    if (!confirm('Are you sure you want to mark this order as returned?')) {
      return
    }

    try {
      await api.returnOrder(orderId, {
        shippingCost: returnForm.shippingCost ? parseFloat(returnForm.shippingCost) : undefined,
        reason: returnForm.reason,
      })
      alert('Order marked as returned successfully!')
      setShowReturnModal(false)
      loadOrder()
    } catch (err: any) {
      alert('Failed to return order: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading order details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
          <div className="card p-4 border-l-4 border-red-500 bg-red-50">
            <p className="text-red-900">{error || 'Order not found'}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="btn-secondary mt-4"
          >
            Go Back
          </button>
        </main>
      </div>
    )
  }

  const canEdit = user?.role === 'OWNER' || user?.role === 'MOD'
  const canCancel = user?.role === 'OWNER' || user?.role === 'MOD' || user?.role === 'STAFF'
  const canReturn = user?.role === 'OWNER' || user?.role === 'MOD'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600 mt-1">{order.orderNumber}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Order Status & Actions */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className={`badge text-lg ${
                order.status === 'CONFIRMED' ? 'badge-green' :
                order.status === 'DRAFT' ? 'badge-yellow' :
                order.status === 'RETURNED' ? 'badge-blue' :
                'badge-red'
              }`}>
                {order.status}
              </span>
              {order.status === 'RETURNED' && order.returnedAt && (
                <p className="text-sm text-gray-600 mt-2">
                  Returned on {new Date(order.returnedAt).toLocaleString()}
                </p>
              )}
              {order.cancellationReason && (
                <p className="text-sm text-gray-600 mt-2">
                  Reason: {order.cancellationReason}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              {canEdit && order.status !== 'CANCELED' && order.status !== 'RETURNED' && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn-secondary"
                >
                  Edit Order
                </button>
              )}

              {canCancel && order.status !== 'CANCELED' && order.status !== 'RETURNED' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Cancel Order
                </button>
              )}

              {canReturn && order.status === 'CONFIRMED' && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="px-4 py-2 rounded-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  Return to Warehouse
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Order Number:</span>
                <p className="font-medium">{order.orderNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Staff:</span>
                <p className="font-medium">{order.staff?.name || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              {order.confirmedAt && (
                <div>
                  <span className="text-sm text-gray-600">Confirmed:</span>
                  <p className="font-medium">{new Date(order.confirmedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <p className="font-medium">{order.customerName || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <p className="font-medium">{order.customerPhone || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Payment Method:</span>
                <p className="font-medium">{order.paymentMethod || '-'}</p>
              </div>
              {order.notes && (
                <div>
                  <span className="text-sm text-gray-600">Notes:</span>
                  <p className="font-medium">{order.notes}</p>
                </div>
              )}
              {order.shippingCost && (
                <div>
                  <span className="text-sm text-gray-600">Shipping Cost:</span>
                  <p className="font-medium">฿{order.shippingCost.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product?.name || 'Unknown Product'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.product?.sku || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ฿{item.unitPrice?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      ฿{item.subtotal?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-medium">{order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Cost:</span>
              <span className="font-medium">฿{order.totalCost?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Price:</span>
              <span className="font-medium">฿{order.totalPrice?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Profit:</span>
              <span className="text-green-600">฿{order.profit?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Edit Order Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Order</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                  <input
                    type="text"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <input
                    type="text"
                    value={editForm.paymentMethod}
                    onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateOrder}
                  className="btn-primary flex-1"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Order Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
              <p className="text-gray-600 mb-4">
                {user?.role === 'STAFF'
                  ? 'This will require admin approval. Please provide a reason for cancellation.'
                  : 'Are you sure you want to cancel this order? This action will restore stock if the order is confirmed.'}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter reason for cancellation..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancelOrder}
                  className="flex-1 px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Confirm Cancel
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="btn-secondary flex-1"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
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
                  onClick={handleReturnOrder}
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
