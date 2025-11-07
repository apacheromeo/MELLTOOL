'use client'

import { useState, useRef } from 'react'
import CameraQRScanner from './CameraQRScanner'

interface QRScannerProps {
  onOrderScanned: (orderData: any) => void
  onStartNew: () => void
}

export default function QRScanner({ onOrderScanned, onStartNew }: QRScannerProps) {
  const [manualInput, setManualInput] = useState('')
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim()) return

    // Parse QR code data (assuming it contains order number)
    onOrderScanned({ orderNumber: manualInput.trim() })
    setManualInput('')
  }

  const handleCameraScan = (decodedText: string) => {
    // Parse QR code data from camera
    onOrderScanned({ orderNumber: decodedText.trim() })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-200">
        {/* Icon */}
        <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>

        <h2 className="text-4xl font-bold text-center text-gray-900 mb-3">
          Scan Order QR Code
        </h2>
        <p className="text-center text-gray-600 text-lg mb-8">
          Scan the order QR code or enter order number manually
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-3 mb-8">
          <button
            type="button"
            onClick={() => setScanMode('manual')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              scanMode === 'manual'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ⌨️ Manual Input
          </button>
          <button
            type="button"
            onClick={() => setScanMode('camera')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              scanMode === 'camera'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📷 Camera Scanner
          </button>
        </div>

        {/* Manual Input */}
        {scanMode === 'manual' && (
          <form onSubmit={handleManualInput} className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Order Number
            </label>
            <input
              ref={inputRef}
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter order number or scan QR code..."
              className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-98"
          >
            Match Order
          </button>
        </form>
        )}

        {/* Camera Scanner */}
        {scanMode === 'camera' && (
          <div className="mb-8">
            <CameraQRScanner onScan={handleCameraScan} />
          </div>
        )}

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
          </div>
        </div>

        {/* Start New Order */}
        <button
          onClick={onStartNew}
          className="w-full py-5 bg-white border-2 border-gray-300 text-gray-700 text-xl font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-lg active:scale-98"
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Order
          </div>
        </button>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3 text-lg">📱 How to use:</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Scan the order QR code sent to customer</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Or enter order number manually</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Or start a new order without matching</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
