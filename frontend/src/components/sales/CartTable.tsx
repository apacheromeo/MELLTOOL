'use client'

import { useState } from 'react'

interface CartItem {
  id: string
  productName: string
  sku: string
  barcode?: string
  quantity: number
  unitPrice: number
  unitCost: number
  subtotal: number
  profit: number
  product?: {
    name: string
    nameTh?: string
    stockQty: number
  }
}

interface CartTableProps {
  items: CartItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  disabled?: boolean
}

/**
 * Cart Table Component
 * Displays items in the current sale with editable quantities
 */
export default function CartTable({ items, onUpdateQuantity, onRemoveItem, disabled }: CartTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleStartEdit = (item: CartItem) => {
    setEditingId(item.id)
    setEditValue(item.quantity.toString())
  }

  const handleSaveEdit = (itemId: string) => {
    const newQty = parseInt(editValue)
    if (newQty > 0) {
      onUpdateQuantity(itemId, newQty)
    }
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-5xl mb-3">🛒</div>
        <p className="font-medium">Cart is empty</p>
        <p className="text-sm mt-1">Scan products to add them to the cart</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Product</th>
            <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">SKU</th>
            <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Qty</th>
            <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Price</th>
            <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Subtotal</th>
            <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
              {/* Product Name */}
              <td className="py-3 px-2">
                <div>
                  <div className="font-medium text-gray-900">{item.productName}</div>
                  {item.product?.nameTh && (
                    <div className="text-sm text-gray-600">{item.product.nameTh}</div>
                  )}
                  {item.product && (
                    <div className="text-xs text-gray-500 mt-1">
                      Stock: {item.product.stockQty} units
                    </div>
                  )}
                </div>
              </td>

              {/* SKU */}
              <td className="py-3 px-2">
                <div className="text-sm font-mono text-gray-700">{item.sku}</div>
                {item.barcode && (
                  <div className="text-xs text-gray-500 font-mono">{item.barcode}</div>
                )}
              </td>

              {/* Quantity (Editable) */}
              <td className="py-3 px-2 text-center">
                {editingId === item.id ? (
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(item.id)
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className="w-16 px-2 py-1 border border-blue-500 rounded text-center"
                      min="1"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      className="text-green-600 hover:text-green-800"
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-red-600 hover:text-red-800"
                      title="Cancel"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEdit(item)}
                    disabled={disabled}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded font-medium disabled:opacity-50"
                  >
                    {item.quantity}
                  </button>
                )}
              </td>

              {/* Unit Price */}
              <td className="py-3 px-2 text-right">
                <div className="font-medium text-gray-900">
                  ฿{item.unitPrice.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Cost: ฿{item.unitCost.toLocaleString()}
                </div>
              </td>

              {/* Subtotal */}
              <td className="py-3 px-2 text-right">
                <div className="font-semibold text-gray-900">
                  ฿{item.subtotal.toLocaleString()}
                </div>
                <div className="text-xs text-green-600">
                  +฿{item.profit.toLocaleString()}
                </div>
              </td>

              {/* Actions */}
              <td className="py-3 px-2 text-center">
                <button
                  onClick={() => onRemoveItem(item.id)}
                  disabled={disabled}
                  className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium disabled:opacity-50"
                  title="Remove item"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Row */}
      <div className="mt-4 pt-4 border-t-2 border-gray-300">
        <div className="flex justify-between items-center">
          <div className="text-gray-700 font-medium">
            Total Items: <span className="text-gray-900">{items.length}</span>
          </div>
          <div className="text-gray-700 font-medium">
            Total Quantity: <span className="text-gray-900">
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}



