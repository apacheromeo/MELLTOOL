'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import BarcodePrintLabels from '@/components/BarcodePrintLabels'
import { exportStockMovementReportPDF } from '@/lib/pdf-export'
import { Html5Qrcode } from 'html5-qrcode'

interface StockInItem {
  productId: string
  qty: number
  unitCost: number
}

export default function StockInPage() {
  const [stockIns, setStockIns] = useState<any[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedStockIn, setSelectedStockIn] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [items, setItems] = useState<StockInItem[]>([])
  const [formData, setFormData] = useState({
    reference: `SI-${Date.now()}`,
    supplier: '',
    notes: '',
  })
  const [printLabels, setPrintLabels] = useState<any[]>([])
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [scannerItemIndex, setScannerItemIndex] = useState<number | null>(null)
  const [productSearch, setProductSearch] = useState<string[]>([])

  // New: Filter and autocomplete states
  const [brands, setBrands] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showProductSelector, setShowProductSelector] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadStockIns()
    loadProducts()
    loadBrands()
    loadCategories()
    loadUserProfile()
    loadPendingApprovals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reload products when filters change
  useEffect(() => {
    if (showProductSelector) {
      loadProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrand, selectedCategory, showProductSelector])

  const loadStockIns = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getStockIns({ limit: 50 })
      setStockIns(data.stockIns || [])
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load stock-ins'

      // If authentication failed, redirect to login
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401') || errorMessage.includes('Authentication failed')) {
        router.push('/login?redirect=/stock-in')
        return
      }

      // Detect if it's a connection error (backend offline)
      const isConnectionError = errorMessage.includes('fetch') ||
                                errorMessage.includes('NetworkError') ||
                                errorMessage.includes('Failed to fetch')

      if (isConnectionError) {
        setError('🔌 Backend API is offline. Please start the backend server.')
      } else {
        setError(errorMessage)
      }
      console.error('Stock-ins error:', err)
      // Set empty state instead of staying in loading
      setStockIns([])
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const params: any = { limit: 1000 }
      if (selectedBrand) params.brand = selectedBrand
      if (selectedCategory) params.category = selectedCategory

      console.log('📦 Loading products with params:', params)
      const data = await api.getProducts(params)
      console.log('✅ Products loaded:', data.products?.length || 0, 'products')
      console.log('Sample product:', data.products?.[0])
      setProducts(data.products || [])

      if (!data.products || data.products.length === 0) {
        console.warn('⚠️ No products returned from API')
      }
    } catch (err: any) {
      console.error('❌ Failed to load products:', err)
      console.error('Error details:', err.message)
      setProducts([])
    }
  }

  const loadBrands = async () => {
    try {
      const data = await api.getBrands()
      setBrands(data.filter((b: any) => b.isActive))
    } catch (err) {
      console.error('Failed to load brands:', err)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
      setCategories(data.filter((c: any) => c.isActive))
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  // Add product from grid view
  const handleAddProductFromGrid = (product: any) => {
    // Check if product already exists in items
    const existingIndex = items.findIndex(item => item.productId === product.id)

    if (existingIndex >= 0) {
      // Increment quantity if already exists
      const newItems = [...items]
      newItems[existingIndex].qty += 1
      setItems(newItems)
      alert(`✓ Increased quantity of ${product.name}`)
    } else {
      // Add new item
      const newItem: StockInItem = {
        productId: product.id,
        qty: 1,
        unitCost: product.costPrice || 0
      }
      setItems([...items, newItem])
      setProductSearch([...productSearch, product.name])
    }
  }

  // Get filtered products based on selected filters and search
  const getFilteredProducts = () => {
    let filtered = products
    console.log('🔍 Filtering from', products.length, 'total products')

    if (selectedBrand) {
      filtered = filtered.filter(p => p.brandId === selectedBrand)
      console.log('  → After brand filter:', filtered.length, 'products')
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.categoryId === selectedCategory)
      console.log('  → After category filter:', filtered.length, 'products')
    }

    if (searchQuery.trim()) {
      // Improved search: split query into words and match any word
      const searchTerms = searchQuery
        .toLowerCase()
        .replace(/[\/\-_.,()]/g, ' ') // Replace special chars with spaces
        .split(/\s+/) // Split by whitespace
        .filter(term => term.length > 0) // Remove empty strings

      console.log('  → Search terms:', searchTerms)

      filtered = filtered.filter(p => {
        // Combine all searchable fields
        const searchableText = [
          p.name,
          p.nameTh || '',
          p.sku,
          p.barcode || '',
          p.category?.name || '',
          p.brand?.name || ''
        ].join(' ').toLowerCase().replace(/[\/\-_.,()]/g, ' ')

        // Match if ANY search term appears in the searchable text
        const matches = searchTerms.some(term => searchableText.includes(term))

        if (matches) {
          console.log('  ✓ Match:', p.name, '| SKU:', p.sku)
        }

        return matches
      })

      console.log('  → After search filter:', filtered.length, 'products')

      // Sort results: exact matches first, then partial matches
      const queryLower = searchQuery.toLowerCase()
      filtered.sort((a, b) => {
        const aNameLower = a.name.toLowerCase()
        const bNameLower = b.name.toLowerCase()

        // Exact match in name comes first
        const aExact = aNameLower === queryLower ? 0 : 1
        const bExact = bNameLower === queryLower ? 0 : 1
        if (aExact !== bExact) return aExact - bExact

        // Starts with query comes next
        const aStarts = aNameLower.startsWith(queryLower) ? 0 : 1
        const bStarts = bNameLower.startsWith(queryLower) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts

        // Alphabetical as fallback
        return aNameLower.localeCompare(bNameLower)
      })
    }

    console.log('🎯 Final filtered count:', filtered.length)
    return filtered
  }

  const loadUserProfile = async () => {
    try {
      const profile = await api.getProfile()
      setUserRole(profile.role)
    } catch (err) {
      console.error('Failed to load user profile:', err)
    }
  }

  const loadPendingApprovals = async () => {
    try {
      const data = await api.getPendingApprovals()
      setPendingApprovals(data.pendingApprovals || [])
    } catch (err) {
      console.error('Failed to load pending approvals:', err)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this stock-in order?')) return

    try {
      await api.approveStockIn(id)
      alert('✅ Stock-in approved successfully!')
      loadStockIns()
      loadPendingApprovals()
    } catch (err: any) {
      alert('Failed to approve stock-in: ' + err.message)
    }
  }

  const handleReject = async () => {
    if (!selectedStockIn) return

    try {
      await api.rejectStockIn(selectedStockIn.id, rejectionReason || undefined)
      alert('❌ Stock-in rejected')
      setShowRejectModal(false)
      setSelectedStockIn(null)
      setRejectionReason('')
      loadStockIns()
      loadPendingApprovals()
    } catch (err: any) {
      alert('Failed to reject stock-in: ' + err.message)
    }
  }

  const handleReceive = async (id: string) => {
    if (!confirm('Mark this stock-in as received and print barcode labels?')) return

    try {
      // Find the stock-in to get its items
      const stockIn = stockIns.find(s => s.id === id)
      if (!stockIn || !stockIn.items) {
        alert('Could not find stock-in items')
        return
      }

      // Generate labels: one label per unit (quantity)
      const labels: any[] = []
      stockIn.items.forEach((item: any) => {
        const product = item.product
        if (!product) return

        // Create one label for each unit in the quantity
        for (let i = 0; i < item.qty; i++) {
          labels.push({
            barcode: product.barcode || product.sku,
            name: product.name,
            price: product.sellPrice,
            sku: product.sku,
          })
        }
      })

      // Mark as received
      await api.receiveStockIn(id)
      loadStockIns()

      // Show print dialog with labels
      if (labels.length > 0) {
        setPrintLabels(labels)
        setShowPrintModal(true)
      } else {
        alert('✅ Stock-in received! (No barcodes available for printing)')
      }
    } catch (err: any) {
      alert('Failed to receive stock-in: ' + err.message)
    }
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
    setProductSearch(productSearch.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof StockInItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.qty * item.unitCost), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      alert('Please add at least one item')
      return
    }

    if (items.some(item => !item.productId || item.qty <= 0 || item.unitCost <= 0)) {
      alert('Please fill in all item details correctly')
      return
    }

    try {
      const payload = {
        reference: formData.reference,
        supplier: formData.supplier || undefined,
        notes: formData.notes || undefined,
        items: items.map(item => ({
          productId: item.productId,
          qty: item.qty,
          unitCost: item.unitCost,
        })),
      }

      await api.createStockIn(payload)
      closeModal()
      loadStockIns()
    } catch (err: any) {
      alert('Failed to create stock-in: ' + err.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setItems([])
    setProductSearch([])
    setSelectedBrand('')
    setSelectedCategory('')
    setSearchQuery('')
    setShowProductSelector(false)
    setFormData({
      reference: `SI-${Date.now()}`,
      supplier: '',
      notes: '',
    })
  }

  const openScanner = (index: number) => {
    setScannerItemIndex(index)
    setShowScannerModal(true)
  }

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader")
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanError
      )
    } catch (err) {
      console.error("Failed to start scanner:", err)
      alert("Failed to start camera. Please check camera permissions.")
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
      } catch (err) {
        console.error("Failed to stop scanner:", err)
      }
    }
    setShowScannerModal(false)
    setScannerItemIndex(null)
  }

  const onScanSuccess = (decodedText: string) => {
    // Find product by barcode or SKU
    const product = products.find(
      (p) => p.barcode === decodedText || p.sku === decodedText
    )

    if (product && scannerItemIndex !== null) {
      updateItem(scannerItemIndex, 'productId', product.id)

      // Update search to show product name
      const newSearch = [...productSearch]
      newSearch[scannerItemIndex] = product.name
      setProductSearch(newSearch)

      // Auto-fill price with buy price if available
      if (product.buyPrice) {
        updateItem(scannerItemIndex, 'unitCost', product.buyPrice)
      }

      alert(`✅ Product found: ${product.name}`)
      stopScanner()
    } else {
      alert(`❌ No product found with barcode/SKU: ${decodedText}`)
    }
  }

  const onScanError = (error: any) => {
    // Ignore common scanning errors
    if (!error.includes("NotFoundException")) {
      console.warn("Scan error:", error)
    }
  }

  useEffect(() => {
    if (showScannerModal) {
      // Start scanner after modal is rendered
      setTimeout(() => startScanner(), 100)
    }
    return () => {
      if (scannerRef.current) {
        stopScanner()
      }
    }
  }, [showScannerModal])

  const handleExportPDF = async () => {
    try {
      // Format stock movements for PDF
      const movements = stockIns.flatMap(stockIn =>
        (stockIn.items || []).map((item: any) => ({
          date: stockIn.createdAt || new Date().toISOString(),
          type: 'IN' as const,
          product: item.product?.name || 'Unknown Product',
          quantity: item.qty || 0,
          reference: stockIn.reference || 'N/A',
          notes: stockIn.notes || stockIn.supplier || '',
        }))
      )

      await exportStockMovementReportPDF({
        movements,
        dateRange: 'Recent Stock In Records',
      })
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stock In</h1>
              <p className="text-gray-600 mt-1">Track incoming inventory and purchases</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="btn-secondary flex items-center gap-2"
                disabled={loading || stockIns.length === 0}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Stock In
              </button>
            </div>
          </div>
        </div>

        {/* Pending Approvals Section (OWNER Only) */}
        {userRole === 'OWNER' && pendingApprovals.length > 0 && (
          <div className="mb-8">
            <div className="card p-6 border-l-4 border-orange-500 bg-orange-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-orange-900">Pending Approvals</h3>
                  <p className="text-sm text-orange-700">{pendingApprovals.length} stock-in order{pendingApprovals.length > 1 ? 's' : ''} waiting for your approval</p>
                </div>
              </div>

              <div className="space-y-3">
                {pendingApprovals.map((stockIn) => (
                  <div key={stockIn.id} className="card p-4 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-900">{stockIn.reference}</h4>
                          <span className="badge badge-yellow">Pending Approval</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Created by <span className="font-medium text-gray-900">{stockIn.user?.name}</span> ({stockIn.user?.role})
                        </p>
                        {stockIn.supplier && (
                          <p className="text-sm text-gray-600">Supplier: {stockIn.supplier}</p>
                        )}
                        <p className="text-sm font-bold text-gray-900 mt-2">
                          Total: ฿{stockIn.totalCost?.toLocaleString()} ({stockIn.items?.length || 0} items)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(stockIn.id)}
                          className="btn-success flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStockIn(stockIn)
                            setShowRejectModal(true)
                          }}
                          className="btn-danger flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`card p-6 border-l-4 mb-8 ${error.includes('offline') ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'}`}>
            <div className="flex items-center gap-3">
              <svg className={`w-8 h-8 ${error.includes('offline') ? 'text-yellow-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className={`font-medium ${error.includes('offline') ? 'text-yellow-900' : 'text-red-900'}`}>{error}</p>
                {error.includes('offline') && (
                  <p className="text-sm text-yellow-700 mt-2">
                    The frontend is running, but the backend API needs to be started separately.
                    See <code className="bg-yellow-100 px-2 py-1 rounded">TESTING_GUIDE.md</code> for setup instructions.
                  </p>
                )}
              </div>
              <button onClick={loadStockIns} className="btn-secondary">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Stock-ins List */}
        {!loading && stockIns.length > 0 && (
          <div className="space-y-6">
            {stockIns.map((stockIn) => (
              <StockInCard
                key={stockIn.id}
                stockIn={stockIn}
                onReceive={handleReceive}
                onApprove={handleApprove}
                onReject={(stockIn) => {
                  setSelectedStockIn(stockIn)
                  setShowRejectModal(true)
                }}
                userRole={userRole}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && stockIns.length === 0 && (
          <div className="text-center py-20">
            <div className="card max-w-2xl mx-auto p-12">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No stock-ins yet</h3>
              <p className="text-gray-600 text-lg mb-8">
                Create your first stock-in record to track incoming inventory
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Stock In
              </button>
            </div>
          </div>
        )}

        {/* New Stock-In Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">New Stock In</h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="input"
                      placeholder="SI-12345"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="input"
                      placeholder="Supplier name"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="textarea"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Items */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Items ({items.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (!showProductSelector) {
                          // Reset filters when opening selector
                          setSearchQuery('')
                          setSelectedBrand('')
                          setSelectedCategory('')
                        }
                        setShowProductSelector(!showProductSelector)
                      }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {showProductSelector ? 'Hide Products' : 'Add Products'}
                    </button>
                  </div>

                  {/* Product Selector - POS Style */}
                  {showProductSelector && (
                    <div className="mb-6 border-2 border-blue-200 rounded-xl p-4 bg-blue-50">
                      {/* Search Bar */}
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="🔍 Search: type any part of name, SKU, barcode... (e.g., 'autobot', 'lazer', 'storm')"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input w-full text-lg border-2 border-blue-300 focus:border-blue-500"
                        />

                        {/* Search Status */}
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <div className="text-gray-600">
                            {searchQuery ? (
                              <span className="font-medium">
                                🔍 Found {getFilteredProducts().length} products matching "{searchQuery}"
                              </span>
                            ) : (
                              <span>
                                📦 {products.length} total products loaded
                                {(selectedBrand || selectedCategory) && ` • Filters active`}
                              </span>
                            )}
                          </div>
                          {(searchQuery || selectedBrand || selectedCategory) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery('')
                                setSelectedBrand('')
                                setSelectedCategory('')
                              }}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Clear all
                            </button>
                          )}
                        </div>

                        {searchQuery && (
                          <p className="text-xs text-gray-600 mt-1">
                            💡 Tip: Search works with partial words. Try "autobot" or "storm" or "1/2/3/4"
                          </p>
                        )}
                      </div>

                      {/* Brand Filter */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              console.log('🔄 Clearing brand filter')
                              setSelectedBrand('')
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition ${selectedBrand === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                          >
                            All
                          </button>
                          {brands.map((brand) => (
                            <button
                              key={brand.id}
                              type="button"
                              onClick={() => {
                                console.log('🔄 Filtering by brand:', brand.name)
                                setSelectedBrand(brand.id)
                              }}
                              className={`px-4 py-2 rounded-lg font-medium transition ${selectedBrand === brand.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                            >
                              {brand.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Category Filter */}
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              console.log('🔄 Clearing category filter')
                              setSelectedCategory('')
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition ${selectedCategory === '' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                          >
                            All
                          </button>
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => {
                                console.log('🔄 Filtering by category:', category.name)
                                setSelectedCategory(category.id)
                              }}
                              className={`px-4 py-2 rounded-lg font-medium transition ${selectedCategory === category.id ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Product Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-2">
                        {getFilteredProducts().slice(0, 200).map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleAddProductFromGrid(product)}
                            className="card p-3 hover:shadow-lg transition-all hover:scale-105 bg-white border-2 border-transparent hover:border-blue-500"
                          >
                            {/* Product Image */}
                            <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl.startsWith('http') ? product.imageUrl : `https://melltool-backend.fly.dev${product.imageUrl}`}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="text-left">
                              <h4 className="font-semibold text-sm text-gray-900 truncate mb-1">{product.name}</h4>
                              <p className="text-xs text-gray-600 truncate mb-1">{product.sku}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-blue-600">฿{product.costPrice?.toLocaleString() || 'N/A'}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${product.stockQty > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {product.stockQty}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {getFilteredProducts().length > 200 && (
                        <p className="text-sm text-gray-600 mt-3 text-center">
                          Showing first 200 of {getFilteredProducts().length} products. Use search to narrow down results.
                        </p>
                      )}

                      {getFilteredProducts().length > 0 && getFilteredProducts().length <= 200 && (
                        <p className="text-sm text-green-600 mt-3 text-center font-medium">
                          ✓ Showing all {getFilteredProducts().length} matching products
                        </p>
                      )}

                      {getFilteredProducts().length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No products found. Try different filters or search terms.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Items List */}
                  {items.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-600 text-lg mb-3">No items added yet</p>
                      <p className="text-gray-500 text-sm">Click "Add Products" above to select items</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => {
                        const product = products.find(p => p.id === item.productId)
                        return (
                          <div key={index} className="card p-4 bg-white">
                            <div className="flex items-start gap-4">
                              {/* Product Image */}
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {product?.imageUrl ? (
                                  <img
                                    src={product.imageUrl.startsWith('http') ? product.imageUrl : `https://melltool-backend.fly.dev${product.imageUrl}`}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                )}
                              </div>

                              {/* Product Info and Inputs */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-1 truncate">{product?.name || 'Unknown Product'}</h4>
                                <p className="text-sm text-gray-600 mb-3">{product?.sku}</p>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                      type="number"
                                      required
                                      min="1"
                                      value={item.qty}
                                      onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                                      className="input w-full"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost (฿)</label>
                                    <input
                                      type="number"
                                      required
                                      min="0"
                                      step="0.01"
                                      value={item.unitCost}
                                      onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                      className="input w-full"
                                    />
                                  </div>
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Subtotal:</span>
                                  <span className="font-bold text-lg text-gray-900">
                                    ฿{(item.qty * item.unitCost).toLocaleString()}
                                  </span>
                                </div>
                              </div>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Remove item"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            {/* Hidden validation field */}
                            <input type="hidden" required value={item.productId} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Total */}
                {items.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-700">Total Cost:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ฿{calculateTotal().toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-semibold text-gray-900">{items.length}</span>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Create Stock In
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Barcode Print Modal */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900">Print Barcode Labels</h2>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <BarcodePrintLabels
                  labels={printLabels}
                  autoPrint={true}
                  onPrintComplete={() => {
                    // Optional: close modal after print
                    // setShowPrintModal(false)
                  }}
                />
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedStockIn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Reject Stock In</h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedStockIn(null)
                    setRejectionReason('')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 mb-2">
                    Are you sure you want to reject stock-in order <span className="font-bold">{selectedStockIn.reference}</span>?
                  </p>
                  <p className="text-sm text-gray-600">
                    This will prevent the stock from being received.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (optional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="textarea"
                    rows={4}
                    placeholder="Provide a reason for rejection..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false)
                      setSelectedStockIn(null)
                      setRejectionReason('')
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    className="btn-danger flex-1"
                  >
                    Reject Stock In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barcode Scanner Modal */}
        {showScannerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Scan Barcode/QR Code</h2>
                <button
                  onClick={stopScanner}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 mb-2">
                    Point your camera at the barcode or QR code
                  </p>
                  <p className="text-sm text-gray-600">
                    The product will be automatically selected when detected
                  </p>
                </div>

                {/* Scanner container */}
                <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden mb-4">
                  <div id="qr-reader" className="w-full h-full"></div>
                </div>

                <button
                  onClick={stopScanner}
                  className="btn-secondary w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function StockInCard({ stockIn, onReceive, onApprove, onReject, userRole }: any) {
  const getApprovalBadge = () => {
    if (stockIn.approvalStatus === 'APPROVED') {
      return <span className="badge badge-green">Approved</span>
    } else if (stockIn.approvalStatus === 'REJECTED') {
      return <span className="badge badge-red">Rejected</span>
    } else {
      return <span className="badge badge-yellow">Pending Approval</span>
    }
  }

  return (
    <div className="card p-6 card-hover">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-bold text-xl text-gray-900">{stockIn.reference}</h3>
            <span className={`badge ${
              stockIn.status === 'RECEIVED' ? 'badge-green' :
              stockIn.status === 'PENDING' ? 'badge-yellow' :
              'badge-red'
            }`}>
              {stockIn.status}
            </span>
            {getApprovalBadge()}
          </div>
          {stockIn.supplier && (
            <p className="text-sm text-gray-600 mb-2">
              Supplier: <span className="font-medium text-gray-900">{stockIn.supplier}</span>
            </p>
          )}
          <p className="text-sm text-gray-600 mb-1">
            Created by <span className="font-medium text-gray-900">{stockIn.user?.name || 'Unknown'}</span> ({stockIn.user?.role}) on {new Date(stockIn.createdAt).toLocaleDateString()}
          </p>
          {stockIn.approver && (
            <p className="text-sm text-gray-600">
              {stockIn.approvalStatus === 'APPROVED' ? 'Approved' : 'Rejected'} by <span className="font-medium text-gray-900">{stockIn.approver.name}</span> on {new Date(stockIn.approvedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            ฿{stockIn.totalCost?.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">{stockIn._count?.items || 0} items</div>
        </div>
      </div>

      {/* Items Preview */}
      {stockIn.items && stockIn.items.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm font-semibold text-gray-900 mb-3">Items:</div>
          <div className="space-y-2">
            {stockIn.items.slice(0, 3).map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.product?.name || 'Unknown Product'}</span>
                <span className="font-semibold text-gray-900">
                  {item.qty} units @ ฿{item.unitCost}
                </span>
              </div>
            ))}
            {stockIn.items.length > 3 && (
              <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                + {stockIn.items.length - 3} more items
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {stockIn.notes && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">{stockIn.notes}</p>
        </div>
      )}

      {/* Rejection Reason */}
      {stockIn.approvalStatus === 'REJECTED' && stockIn.rejectionReason && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
          <p className="text-sm text-red-700">{stockIn.rejectionReason}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {/* Approval Actions - OWNER only */}
        {userRole === 'OWNER' && stockIn.approvalStatus === 'PENDING_APPROVAL' && stockIn.status !== 'CANCELLED' && (
          <>
            <button
              onClick={() => onApprove(stockIn.id)}
              className="btn-success flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </button>
            <button
              onClick={() => onReject(stockIn)}
              className="btn-danger flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </>
        )}

        {/* Receive Action - Only if approved */}
        {stockIn.status === 'PENDING' && stockIn.approvalStatus === 'APPROVED' && (
          <button
            onClick={() => onReceive(stockIn.id)}
            className="btn-success flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mark as Received
          </button>
        )}

        {/* View Details - Always available */}
        <button
          onClick={() => window.location.href = `/stock-in/${stockIn.id}`}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Details
        </button>
      </div>
    </div>
  )
}
