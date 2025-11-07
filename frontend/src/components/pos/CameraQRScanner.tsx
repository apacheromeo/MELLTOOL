'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface CameraQRScannerProps {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
}

export default function CameraQRScanner({ onScan, onError }: CameraQRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const qrCodeRegionId = 'qr-reader'

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Create scanner instance
      scannerRef.current = new Html5Qrcode(qrCodeRegionId)

      // Configuration
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      // Start scanning
      await scannerRef.current.start(
        { facingMode: 'environment' }, // Use rear camera
        config,
        (decodedText) => {
          // Success callback
          onScan(decodedText)
          stopScanning()
        },
        (errorMessage) => {
          // Error callback (called continuously while scanning)
          // We don't show these as they're normal scanning attempts
        }
      )
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to start camera'
      setError(errorMsg)
      if (onError) onError(errorMsg)
      setIsScanning(false)
    }
  }

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
      }
      setIsScanning(false)
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Scanner Container */}
      <div className="relative">
        <div
          id={qrCodeRegionId}
          className={`w-full rounded-xl overflow-hidden ${
            isScanning ? 'block' : 'hidden'
          }`}
          style={{ minHeight: '300px' }}
        />

        {/* Placeholder when not scanning */}
        {!isScanning && (
          <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-gray-600 font-medium">Camera Scanner Ready</p>
              <p className="text-sm text-gray-500 mt-1">
                Click start to enable QR scanning
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-red-900 font-medium">{error}</p>
              <p className="text-sm text-red-700 mt-1">
                Make sure camera permissions are enabled
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
              </svg>
              Start Camera Scanner
            </div>
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 py-4 bg-red-600 text-white text-lg font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Stop Scanner
            </div>
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📸 Camera Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Hold camera steady over QR code</li>
          <li>• Ensure good lighting</li>
          <li>• Keep QR code in center of frame</li>
          <li>• Scanner stops automatically after successful scan</li>
        </ul>
      </div>
    </div>
  )
}
