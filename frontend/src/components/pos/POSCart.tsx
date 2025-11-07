'use client'

import { useState } from 'react'

interface POSCartProps {
  items: any[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  disabled?: boolean
}

export default function POSCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  disabled,
}: POSCartProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(1)

  const handleStartEdit = (itemId: string, currentQty: number) => {
    setEditingItem(itemId)
    setEditQuantity(currentQty)
  }

  const handleSaveEdit = (itemId: string) => {
    if (editQuantity > 0) {
      onUpdateQuantity(itemId, editQuantity)
    }
    setEditingItem(null)
  }

  const handleQuickAdjust = (itemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change
    if (newQty > 0) {
      onUpdateQuantity(itemId, newQty)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-200">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Cart is Empty</h3>
          <p className="text-gray-600">Add products to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white">Shopping Cart</h2>
        <p className="text-blue-100">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Cart Items */}
      <div className="divide-y divide-gray-200">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-6">
              {/* Product Image Placeholder */}
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {item.productName}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                  <span className="font-mono">{item.sku}</span>
                  {item.barcode && (
                    <span className="font-mono text-xs">{item.barcode}</span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  {editingItem === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                        className="w-24 px-3 py-2 border-2 border-blue-500 rounded-lg text-center font-bold"
                        min="1"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(item.id)
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleQuickAdjust(item.id, item.quantity, -1)}
                        disabled={disabled || item.quantity <= 1}
                        className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-bold text-gray-700"
                      >
                        −
                      </button>
                      <button
                        onClick={() => handleStartEdit(item.id, item.quantity)}
                        className="min-w-[4rem] px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 font-bold text-blue-900 transition-colors"
                      >
                        {item.quantity}
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(item.id, item.quantity, 1)}
                        disabled={disabled}
                        className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-bold text-gray-700"
                      >
                        +
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Price and Actions */}
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  ฿{item.subtotal?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  ฿{item.unitPrice?.toLocaleString()} × {item.quantity}
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  disabled={disabled}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
