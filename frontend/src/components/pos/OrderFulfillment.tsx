'use client'

import { useState, useRef, useEffect } from 'react'

interface OrderItem {
  id: string
  productName: string
  sku: string
  barcode?: string
  quantity: number
  unitPrice: number
  product: {
    barcode?: string
  }
}

interface Order {
  id: string
  orderNumber: string
  items: OrderItem[]
  customerName?: string
  customerPhone?: string
}

interface OrderFulfillmentProps {
  order: Order
  onItemScanned: (itemId: string, barcode: string) => void
  onComplete: () => void
  onCancel: () => void
  scannedItems: Record<string, number> // itemId -> scanned quantity
}

export default function OrderFulfillment({
  order,
  onItemScanned,
  onComplete,
  onCancel,
  scannedItems,
}: OrderFulfillmentProps) {
  const [barcode, setBarcode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcode.trim()) return

    setError(null)

    // Find matching item in order
    const matchingItem = order.items.find(
      (item) =>
        item.barcode === barcode.trim() ||
        item.product?.barcode === barcode.trim() ||
        item.sku === barcode.trim()
    )

    if (!matchingItem) {
      setError(`Item with barcode "${barcode}" not found in this order`)
      setBarcode('')
      return
    }

    const scannedQty = scannedItems[matchingItem.id] || 0
    if (scannedQty >= matchingItem.quantity) {
      setError(`All ${matchingItem.quantity} units of "${matchingItem.productName}" already scanned`)
      setBarcode('')
      return
    }

    onItemScanned(matchingItem.id, barcode.trim())
    setBarcode('')
    setError(null)
  }

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const scannedCount = Object.values(scannedItems).reduce((sum, qty) => sum + qty, 0)
  const allScanned = scannedCount >= totalItems

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Order Fulfillment</h2>
              <p className="text-green-100">Order #{order.orderNumber}</p>
              {order.customerName && (
                <p className="text-green-100 text-sm mt-1">
                  Customer: {order.customerName}
                  {order.customerPhone && ` - ${order.customerPhone}`}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {scannedCount}/{totalItems}
              </div>
              <div className="text-green-100 text-sm">Items Scanned</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-300"
            style={{ width: `${(scannedCount / totalItems) * 100}%` }}
          />
        </div>

        {/* Scanner */}
        <div className="p-8 border-b border-gray-200">
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Scan Item Barcode
              </label>
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan or enter barcode..."
                  className="flex-1 px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-500 focus:border-green-500"
                  disabled={allScanned}
                />
                <button
                  type="submit"
                  disabled={!barcode.trim() || allScanned}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Verify
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-900 font-medium">{error}</p>
              </div>
            )}

            {allScanned && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                <p className="text-green-900 font-bold">
                  ✓ All items scanned! Ready to complete order.
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Items Checklist */}
        <div className="p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item) => {
              const scannedQty = scannedItems[item.id] || 0
              const isComplete = scannedQty >= item.quantity
              const progress = (scannedQty / item.quantity) * 100

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    isComplete
                      ? 'bg-green-50 border-green-500'
                      : scannedQty > 0
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox Icon */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isComplete
                          ? 'bg-green-500'
                          : scannedQty > 0
                          ? 'bg-yellow-500'
                          : 'bg-gray-300'
                      }`}
                    >
                      {isComplete ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-white font-bold">{scannedQty}</span>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-lg mb-1">
                        {item.productName}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="font-mono">{item.sku}</span>
                        {item.barcode && (
                          <span className="font-mono text-xs">{item.barcode}</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Status */}
                    <div className="text-right flex-shrink-0">
                      <div
                        className={`text-2xl font-bold ${
                          isComplete
                            ? 'text-green-600'
                            : scannedQty > 0
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {scannedQty}/{item.quantity}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isComplete ? 'Complete' : scannedQty > 0 ? 'In Progress' : 'Pending'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {!isComplete && scannedQty > 0 && (
                    <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-yellow-500 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-8 bg-gray-50 border-t border-gray-200 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onComplete}
            disabled={!allScanned}
            className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
          >
            Complete Order
          </button>
        </div>
      </div>
    </div>
  )
}
