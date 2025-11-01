'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface Product {
  id: string
  sku: string
  name: string
  nameTh: string
  price: number
  selected: boolean
}

export default function BarcodePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128')
  const [includePrice, setIncludePrice] = useState(true)
  const [includeName, setIncludeName] = useState(true)
  const [copies, setCopies] = useState(1)
  const [paperSize, setPaperSize] = useState('AIMO-40x30')
  const printAreaRef = useRef<HTMLDivElement>(null)

  // Get label dimensions based on paper size
  const getLabelDimensions = () => {
    const sizes: Record<string, { width: string; height: string; fontSize: string }> = {
      'AIMO-40x30': { width: '40mm', height: '30mm', fontSize: '8px' },
      'AIMO-50x30': { width: '50mm', height: '30mm', fontSize: '9px' },
      'AIMO-40x60': { width: '40mm', height: '60mm', fontSize: '10px' },
      'AIMO-50x40': { width: '50mm', height: '40mm', fontSize: '10px' },
      'THERMAL-57x30': { width: '57mm', height: '30mm', fontSize: '9px' },
      'THERMAL-58x40': { width: '58mm', height: '40mm', fontSize: '10px' },
      'A4': { width: '210mm', height: '297mm', fontSize: '12px' },
      'Letter': { width: '8.5in', height: '11in', fontSize: '12px' },
      'Label': { width: '100mm', height: '50mm', fontSize: '11px' },
    }
    return sizes[paperSize] || sizes['AIMO-40x30']
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = () => {
    setLoading(true)
    setTimeout(() => {
      setProducts([
        {
          id: '1',
          sku: 'VAC-FILTER-001',
          name: 'HEPA Filter H13',
          nameTh: 'ฟิลเตอร์ HEPA H13',
          price: 450,
          selected: false
        },
        {
          id: '2',
          sku: 'VAC-BAT-002',
          name: 'Lithium Battery 2500mAh',
          nameTh: 'แบตเตอรี่ลิเธียม 2500mAh',
          price: 1200,
          selected: false
        },
        {
          id: '3',
          sku: 'VAC-BRUSH-003',
          name: 'Rotating Brush Head',
          nameTh: 'หัวแปรงหมุน',
          price: 350,
          selected: false
        },
        {
          id: '4',
          sku: 'VAC-MOTOR-004',
          name: 'DC Motor 1000W',
          nameTh: 'มอเตอร์ DC 1000W',
          price: 2500,
          selected: false
        },
        {
          id: '5',
          sku: 'VAC-HOSE-005',
          name: 'Flexible Hose 2m',
          nameTh: 'ท่อยืดหยุ่น 2 เมตร',
          price: 280,
          selected: false
        }
      ])
      setLoading(false)
    }, 500)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.nameTh.includes(searchTerm)
  )

  const selectedProducts = products.filter(p => p.selected)

  const toggleProduct = (id: string) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, selected: !p.selected } : p
    ))
  }

  const toggleAll = () => {
    const allSelected = filteredProducts.every(p => p.selected)
    setProducts(products.map(p => ({
      ...p,
      selected: filteredProducts.some(fp => fp.id === p.id) ? !allSelected : p.selected
    })))
  }

  const handlePrint = () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product')
      return
    }
    
    window.print()
  }

  const handleDownloadPDF = () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product')
      return
    }
    
    alert('PDF download functionality will be implemented with a PDF library')
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Barcode Generator</h1>
          <p className="text-gray-600 mt-1">Generate and print barcodes for your products</p>
          <p className="text-sm text-gray-500">สร้างและพิมพ์บาร์โค้ดสำหรับสินค้าของคุณ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4">
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-600 mb-1">Selected</p>
                <p className="text-2xl font-bold text-blue-600">{selectedProducts.length}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-600 mb-1">Total Labels</p>
                <p className="text-2xl font-bold text-green-600">{selectedProducts.length * copies}</p>
              </div>
            </div>

            {/* Search */}
            <div className="card p-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Product List */}
            <div className="card">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Select Products</h3>
                <button
                  onClick={toggleAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {filteredProducts.every(p => p.selected) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-600">No products found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={product.selected}
                        onChange={() => toggleProduct(product.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.nameTh}</div>
                        <div className="text-xs text-gray-500">{product.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">฿{product.price.toLocaleString()}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Settings & Preview */}
          <div className="space-y-6">
            {/* Settings */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Barcode Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={barcodeFormat}
                    onChange={(e) => setBarcodeFormat(e.target.value)}
                    className="select"
                  >
                    <option value="CODE128">CODE128 (Recommended)</option>
                    <option value="EAN13">EAN-13</option>
                    <option value="UPC">UPC-A</option>
                    <option value="QR">QR Code</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paper Size / Printer Type
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="select"
                  >
                    <optgroup label="Thermal Label Printers">
                      <option value="AIMO-40x30">Aimo D520 - 40×30mm (Recommended)</option>
                      <option value="AIMO-50x30">Aimo D520 - 50×30mm</option>
                      <option value="AIMO-40x60">Aimo D520 - 40×60mm</option>
                      <option value="AIMO-50x40">Aimo D520 - 50×40mm</option>
                      <option value="THERMAL-57x30">Thermal 57×30mm</option>
                      <option value="THERMAL-58x40">Thermal 58×40mm</option>
                    </optgroup>
                    <optgroup label="Standard Paper">
                      <option value="A4">A4 (210 × 297 mm)</option>
                      <option value="Letter">Letter (8.5 × 11 in)</option>
                      <option value="Label">Label Sticker Sheet</option>
                    </optgroup>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {paperSize.startsWith('AIMO') && '✓ Optimized for Aimo D520 thermal printer'}
                    {paperSize.startsWith('THERMAL') && '✓ Compatible with thermal label printers'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Copies per Product
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                    className="input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeName}
                      onChange={(e) => setIncludeName(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Include Product Name</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePrice}
                      onChange={(e) => setIncludePrice(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Include Price</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6 space-y-3">
              <button
                onClick={handlePrint}
                disabled={selectedProducts.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Barcodes
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={selectedProducts.length === 0}
                className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
            </div>

            {/* Preview */}
            {selectedProducts.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>
                <div className="space-y-4">
                  {selectedProducts.slice(0, 2).map((product) => (
                    <div key={product.id} className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {includeName && (
                        <div className="text-xs font-semibold text-gray-900 mb-2">
                          {product.name}
                        </div>
                      )}
                      <div className="bg-white p-2 inline-block">
                        <svg className="w-full h-12" viewBox="0 0 200 50">
                          {/* Simple barcode representation */}
                          <rect x="10" y="5" width="2" height="40" fill="black"/>
                          <rect x="15" y="5" width="4" height="40" fill="black"/>
                          <rect x="22" y="5" width="2" height="40" fill="black"/>
                          <rect x="27" y="5" width="6" height="40" fill="black"/>
                          <rect x="36" y="5" width="2" height="40" fill="black"/>
                          <rect x="41" y="5" width="4" height="40" fill="black"/>
                          <rect x="48" y="5" width="2" height="40" fill="black"/>
                          <rect x="53" y="5" width="6" height="40" fill="black"/>
                          <rect x="62" y="5" width="2" height="40" fill="black"/>
                          <rect x="67" y="5" width="4" height="40" fill="black"/>
                          <rect x="74" y="5" width="2" height="40" fill="black"/>
                          <rect x="79" y="5" width="6" height="40" fill="black"/>
                          <rect x="88" y="5" width="2" height="40" fill="black"/>
                          <rect x="93" y="5" width="4" height="40" fill="black"/>
                          <rect x="100" y="5" width="2" height="40" fill="black"/>
                          <rect x="105" y="5" width="6" height="40" fill="black"/>
                          <rect x="114" y="5" width="2" height="40" fill="black"/>
                          <rect x="119" y="5" width="4" height="40" fill="black"/>
                          <rect x="126" y="5" width="2" height="40" fill="black"/>
                          <rect x="131" y="5" width="6" height="40" fill="black"/>
                          <rect x="140" y="5" width="2" height="40" fill="black"/>
                          <rect x="145" y="5" width="4" height="40" fill="black"/>
                          <rect x="152" y="5" width="2" height="40" fill="black"/>
                          <rect x="157" y="5" width="6" height="40" fill="black"/>
                          <rect x="166" y="5" width="2" height="40" fill="black"/>
                          <rect x="171" y="5" width="4" height="40" fill="black"/>
                          <rect x="178" y="5" width="2" height="40" fill="black"/>
                          <rect x="183" y="5" width="6" height="40" fill="black"/>
                        </svg>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">{product.sku}</div>
                      {includePrice && (
                        <div className="text-sm font-bold text-gray-900 mt-1">
                          ฿{product.price.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                  {selectedProducts.length > 2 && (
                    <div className="text-center text-sm text-gray-500">
                      +{selectedProducts.length - 2} more products
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Print Area (Hidden) */}
        <div className="hidden print:block" ref={printAreaRef}>
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-area, .print-area * {
                visibility: visible;
              }
              .print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              @page {
                size: ${
                  paperSize.startsWith('AIMO') || paperSize.startsWith('THERMAL')
                    ? `${getLabelDimensions().width} ${getLabelDimensions().height}`
                    : paperSize === 'A4'
                    ? 'A4'
                    : paperSize === 'Letter'
                    ? 'letter'
                    : 'auto'
                };
                margin: ${paperSize.startsWith('AIMO') || paperSize.startsWith('THERMAL') ? '0' : '10mm'};
              }
              .label-item {
                width: ${getLabelDimensions().width};
                height: ${getLabelDimensions().height};
                font-size: ${getLabelDimensions().fontSize};
                page-break-after: always;
                padding: 2mm;
                box-sizing: border-box;
              }
            }
          `}</style>
          <div className="print-area">
            {selectedProducts.map((product) =>
              Array.from({ length: copies }).map((_, index) => (
                <div 
                  key={`${product.id}-${index}`} 
                  className="label-item border border-gray-300 text-center flex flex-col items-center justify-center"
                >
                  {includeName && (
                    <div className="font-semibold text-gray-900 mb-1 truncate w-full px-1" style={{ fontSize: getLabelDimensions().fontSize }}>
                      {product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}
                    </div>
                  )}
                  <div className="bg-white inline-block" style={{ width: '90%', height: 'auto' }}>
                    <svg className="w-full" viewBox="0 0 200 40" style={{ height: 'auto' }}>
                      {/* CODE128 Barcode representation */}
                      <rect x="10" y="2" width="2" height="36" fill="black"/>
                      <rect x="15" y="2" width="4" height="36" fill="black"/>
                      <rect x="22" y="2" width="2" height="36" fill="black"/>
                      <rect x="27" y="2" width="6" height="36" fill="black"/>
                      <rect x="36" y="2" width="2" height="36" fill="black"/>
                      <rect x="41" y="2" width="4" height="36" fill="black"/>
                      <rect x="48" y="2" width="2" height="36" fill="black"/>
                      <rect x="53" y="2" width="6" height="36" fill="black"/>
                      <rect x="62" y="2" width="2" height="36" fill="black"/>
                      <rect x="67" y="2" width="4" height="36" fill="black"/>
                      <rect x="74" y="2" width="2" height="36" fill="black"/>
                      <rect x="79" y="2" width="6" height="36" fill="black"/>
                      <rect x="88" y="2" width="2" height="36" fill="black"/>
                      <rect x="93" y="2" width="4" height="36" fill="black"/>
                      <rect x="100" y="2" width="2" height="36" fill="black"/>
                      <rect x="105" y="2" width="6" height="36" fill="black"/>
                      <rect x="114" y="2" width="2" height="36" fill="black"/>
                      <rect x="119" y="2" width="4" height="36" fill="black"/>
                      <rect x="126" y="2" width="2" height="36" fill="black"/>
                      <rect x="131" y="2" width="6" height="36" fill="black"/>
                      <rect x="140" y="2" width="2" height="36" fill="black"/>
                      <rect x="145" y="2" width="4" height="36" fill="black"/>
                      <rect x="152" y="2" width="2" height="36" fill="black"/>
                      <rect x="157" y="2" width="6" height="36" fill="black"/>
                      <rect x="166" y="2" width="2" height="36" fill="black"/>
                      <rect x="171" y="2" width="4" height="36" fill="black"/>
                      <rect x="178" y="2" width="2" height="36" fill="black"/>
                      <rect x="183" y="2" width="6" height="36" fill="black"/>
                    </svg>
                  </div>
                  <div className="text-gray-600 mt-1 font-mono" style={{ fontSize: `calc(${getLabelDimensions().fontSize} - 1px)` }}>
                    {product.sku}
                  </div>
                  {includePrice && (
                    <div className="font-bold text-gray-900 mt-1" style={{ fontSize: getLabelDimensions().fontSize }}>
                      ฿{product.price.toLocaleString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
