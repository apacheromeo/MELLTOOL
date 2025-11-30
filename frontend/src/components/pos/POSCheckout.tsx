'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface POSCheckoutProps {
  order: any
  onCheckout: (paymentData: any) => void
  onBack: () => void
  disabled?: boolean
}

const PAYMENT_METHODS = [
  // Main e-commerce platforms (top priority)
  { id: 'SHOPEE', label: 'Shopee', icon: '🛍️' },
  { id: 'LAZADA', label: 'Lazada', icon: '🛒' },
  { id: 'TIKTOK', label: 'TikTok Shop', icon: '📱' },
  // Traditional payment methods
  { id: 'CASH', label: 'Cash', icon: '💵' },
  { id: 'CARD', label: 'Card', icon: '💳' },
  { id: 'TRANSFER', label: 'Transfer', icon: '🏦' },
  { id: 'QRCODE', label: 'QR Code', icon: '📲' },
  { id: 'OTHER', label: 'Other Method', icon: '💰' },
]

export default function POSCheckout({
  order,
  onCheckout,
  onBack,
  disabled,
}: POSCheckoutProps) {
  const { user } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState('SHOPEE')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [showCustomerInfo, setShowCustomerInfo] = useState(false)

  const handleCheckout = () => {
    if (!paymentMethod) {
      alert('Please select a payment method')
      return
    }

    const paymentData: any = {
      paymentMethod,
    }

    if (showCustomerInfo) {
      if (customerName) paymentData.customerName = customerName
      if (customerPhone) paymentData.customerPhone = customerPhone
    }

    onCheckout(paymentData)
  }

  const totalItems = order?.items?.length || 0
  const totalCost = order?.totalCost || 0
  const totalPrice = order?.totalPrice || 0
  const profit = order?.profit || 0
  const profitMargin = totalPrice > 0 ? ((profit / totalPrice) * 100).toFixed(1) : '0.0'

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden sticky top-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white">Order Summary</h2>
        <p className="text-green-100">Order #{order?.orderNumber}</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Order Stats */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-gray-700">
            <span>Items:</span>
            <span className="font-bold">{totalItems}</span>
          </div>
          <div className="flex justify-between items-center text-gray-700">
            <span>Subtotal:</span>
            <span className="font-bold">฿{totalPrice.toLocaleString()}</span>
          </div>
          <div className="border-t-2 border-gray-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-gray-900">Total:</span>
              <span className="text-3xl font-bold text-green-600">
                ฿{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Profit Info - Only visible to OWNER and MOD */}
        {(user?.role === 'OWNER' || user?.role === 'MOD') && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-900 font-medium">Cost:</span>
              <span className="text-sm font-bold text-blue-900">฿{totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-900 font-medium">Profit:</span>
              <span className="text-sm font-bold text-green-600">฿{profit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-900 font-medium">Margin:</span>
              <span className="text-sm font-bold text-blue-900">{profitMargin}%</span>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`p-3 rounded-xl border-2 font-medium transition-all ${
                  paymentMethod === method.id
                    ? 'border-green-500 bg-green-50 text-green-900 shadow-lg'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="text-xl mb-1">{method.icon}</div>
                <div className="text-xs font-bold">{method.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Customer Info Toggle */}
        <div>
          <button
            onClick={() => setShowCustomerInfo(!showCustomerInfo)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-bold text-gray-700">
              Customer Information (Optional)
            </span>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${
                showCustomerInfo ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCustomerInfo && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleCheckout}
            disabled={disabled || totalItems === 0}
            className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-98"
          >
            Complete Order
          </button>
          <button
            onClick={onBack}
            disabled={disabled}
            className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
