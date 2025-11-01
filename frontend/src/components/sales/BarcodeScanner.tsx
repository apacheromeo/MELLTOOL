'use client'

import { useState, useRef, useEffect } from 'react'

interface BarcodeScannerProps {
  isOpen: boolean
  onScan: (barcode: string) => void
  disabled?: boolean
}

/**
 * Barcode Scanner Component
 * Supports both manual input and camera scanning
 * For production, integrate with html5-qrcode or Quagga.js for camera support
 */
export default function BarcodeScanner({ isOpen, onScan, disabled }: BarcodeScannerProps) {
  const [manualInput, setManualInput] = useState('')
  const [lastScanned, setLastScanned] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when scanner opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  /**
   * Handle manual barcode entry
   */
  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim() || disabled) return

    onScan(manualInput.trim())
    setLastScanned(manualInput.trim())
    setManualInput('')
    
    // Refocus input for next scan
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  /**
   * Handle keyboard shortcuts for USB barcode scanners
   * Most USB scanners act as keyboards and send Enter after scanning
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && manualInput.trim()) {
      handleManualScan(e)
    }
  }

  if (!isOpen) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Scanner closed. Click &quot;Open Scanner&quot; to start scanning.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Manual Input / USB Scanner */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Scan or Enter Barcode
        </label>
        <form onSubmit={handleManualScan} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder="Scan barcode or type SKU..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono disabled:opacity-50"
            autoFocus
          />
          <button
            type="submit"
            disabled={disabled || !manualInput.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Use a USB barcode scanner for faster scanning. It will automatically input the code.
        </p>
      </div>

      {/* Last Scanned */}
      {lastScanned && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <div>
              <p className="text-sm font-medium text-green-800">Last Scanned:</p>
              <p className="text-sm text-green-700 font-mono">{lastScanned}</p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner Placeholder */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="text-4xl mb-3">📷</div>
        <p className="text-gray-600 font-medium mb-2">Camera Scanner</p>
        <p className="text-sm text-gray-500 mb-4">
          Camera scanning feature coming soon!
        </p>
        <p className="text-xs text-gray-400">
          For now, use manual input or USB scanner above
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📝 How to Use:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>USB Scanner:</strong> Simply scan - it will auto-add to cart</li>
          <li>• <strong>Manual Entry:</strong> Type SKU or barcode and press Enter or click Add</li>
          <li>• <strong>Product Barcode:</strong> Adds product to cart</li>
          <li>• <strong>Order Barcode:</strong> Links order number to sale</li>
        </ul>
      </div>
    </div>
  )
}

