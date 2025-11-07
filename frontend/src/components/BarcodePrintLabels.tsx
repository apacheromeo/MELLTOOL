'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface LabelData {
  barcode: string
  name: string
  price?: number
  sku?: string
}

interface BarcodePrintLabelsProps {
  labels: LabelData[]
  onPrintComplete?: () => void
  autoPrint?: boolean
}

/**
 * Barcode Label Printer Component
 * Optimized for 30x20mm label paper in 3-column format
 */
export default function BarcodePrintLabels({
  labels,
  onPrintComplete,
  autoPrint = false
}: BarcodePrintLabelsProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])

  useEffect(() => {
    // Generate barcodes when component mounts
    labels.forEach((label, index) => {
      const canvas = canvasRefs.current[index]
      if (canvas && label.barcode) {
        try {
          JsBarcode(canvas, label.barcode, {
            format: 'CODE128',
            width: 1.5,
            height: 35,
            displayValue: true,
            fontSize: 10,
            margin: 2,
            background: '#ffffff',
            lineColor: '#000000',
          })
        } catch (error) {
          console.error('Failed to generate barcode for:', label.barcode, error)
        }
      }
    })

    // Auto-print if enabled
    if (autoPrint && labels.length > 0) {
      // Small delay to ensure barcodes are rendered
      setTimeout(() => {
        window.print()
        if (onPrintComplete) {
          onPrintComplete()
        }
      }, 500)
    }
  }, [labels, autoPrint, onPrintComplete])

  return (
    <>
      {/* Screen View - Preview */}
      <div className="print:hidden">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Barcode Labels Ready</h2>
              <p className="text-gray-600 mt-1">
                {labels.length} labels • 30x20mm • 3 columns
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Labels
            </button>
          </div>

          {/* Preview Grid */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
              {labels.map((label, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-300 p-2 rounded flex flex-col items-center justify-center"
                  style={{ minHeight: '80px' }}
                >
                  <canvas
                    ref={(el) => { canvasRefs.current[index] = el }}
                    className="max-w-full"
                  />
                  <div className="text-xs text-center mt-1 text-gray-700 font-medium truncate w-full px-1">
                    {label.name}
                  </div>
                  {label.price && (
                    <div className="text-xs font-bold text-gray-900">
                      ฿{label.price.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print View - Optimized for 30x20mm labels in 3 columns */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 5mm;
          }

          body {
            margin: 0;
            padding: 0;
          }

          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="hidden print:block">
        <div className="grid grid-cols-3" style={{
          gap: '2mm',
          padding: '0',
        }}>
          {labels.map((label, index) => (
            <div
              key={index}
              style={{
                width: '30mm',
                height: '20mm',
                border: '0.5pt solid #ddd',
                padding: '1mm',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                pageBreakInside: 'avoid',
                overflow: 'hidden',
              }}
            >
              <canvas
                ref={(el) => { canvasRefs.current[index] = el }}
                style={{
                  maxWidth: '28mm',
                  height: 'auto',
                }}
              />
              <div style={{
                fontSize: '5pt',
                textAlign: 'center',
                marginTop: '0.5mm',
                fontWeight: '600',
                lineHeight: '1.1',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                paddingLeft: '0.5mm',
                paddingRight: '0.5mm',
              }}>
                {label.name}
              </div>
              {label.price && (
                <div style={{
                  fontSize: '6pt',
                  fontWeight: 'bold',
                  marginTop: '0.2mm',
                }}>
                  ฿{label.price.toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
