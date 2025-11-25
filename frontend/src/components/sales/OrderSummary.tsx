'use client'

import { useState } from 'react'

interface OrderSummaryProps {
  order: any
  onConfirm: (paymentData: any) => void
  onCancel: () => void
  disabled?: boolean
}

/**
 * Order Summary Component
 * Shows order totals and payment options
 */
export default function OrderSummary({ order, onConfirm, onCancel, disabled }: OrderSummaryProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('SHOPEE')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const handleConfirm = () => {
    if (order.items.length === 0) {
      alert('Cannot confirm an empty order')
      return
    }

    onConfirm({
      paymentMethod,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
    })
  }

  const profitMargin = order.totalPrice > 0
    ? ((order.profit / order.totalPrice) * 100).toFixed(1)
    : '0'

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 sticky top-4">
      {/* Order Info */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Summary</h2>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order #:</span>
            <span className="font-mono font-semibold text-gray-900">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
              order.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Staff:</span>
            <span className="font-medium text-gray-900">{order.staff?.name}</span>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Items:</span>
            <span className="font-semibold">{order.items?.length || 0}</span>
          </div>
          
          <div className="flex justify-between text-gray-700">
            <span>Total Quantity:</span>
            <span className="font-semibold">
              {order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
            </span>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between text-gray-700 mb-2">
              <span>Subtotal:</span>
              <span className="font-semibold">฿{order.totalPrice.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Cost:</span>
              <span>฿{order.totalCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-3 border-t-2 border-gray-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-gray-900">
                ฿{order.totalPrice.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600 font-medium">Profit:</span>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  ฿{order.profit.toLocaleString()}
                </div>
                <div className="text-xs text-green-600">
                  {profitMargin}% margin
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        {showPaymentForm && (
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="SHOPEE">🛍️ Shopee</option>
                <option value="LAZADA">🛒 Lazada</option>
                <option value="TIKTOK">📱 TikTok Shop</option>
                <option value="CASH">💵 Cash</option>
                <option value="CARD">💳 Card</option>
                <option value="TRANSFER">🏦 Bank Transfer</option>
                <option value="QRCODE">📲 QR Code</option>
                <option value="OTHER">💰 Other Method</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-4">
          {!showPaymentForm ? (
            <>
              <button
                onClick={() => setShowPaymentForm(true)}
                disabled={disabled || order.items?.length === 0}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Complete Sale
              </button>
              <button
                onClick={onCancel}
                disabled={disabled}
                className="w-full px-6 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-50"
              >
                Cancel Order
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleConfirm}
                disabled={disabled}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold text-lg disabled:opacity-50"
              >
                ✓ Confirm Payment
              </button>
              <button
                onClick={() => setShowPaymentForm(false)}
                disabled={disabled}
                className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Back
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Stock will be automatically reduced after confirmation
          </p>
        </div>
      </div>
    </div>
  )
}



