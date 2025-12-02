'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import ProductCompatibilityModal from '@/components/ProductCompatibilityModal'
import MasterVariantManagementModal from '@/components/MasterVariantManagementModal'

export default function InventoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { hasAccess } = useRoleGuard(['OWNER', 'MOD'])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    nameTh: '',
    description: '',
    categoryId: '',
    brandId: '',
    costPrice: '',
    sellPrice: '',
    stockQty: '',
    minStock: '',
    barcode: '',
    imageUrl: '',
    isMaster: false,
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false)
  const [compatibilityProduct, setCompatibilityProduct] = useState<any>(null)
  const [showMasterVariantModal, setShowMasterVariantModal] = useState(false)

  useEffect(() => {
    // Read filters from URL on mount
    const categoryId = searchParams.get('category')
    const brandId = searchParams.get('brand')
    if (categoryId) setCategoryFilter(categoryId)
    if (brandId) setBrandFilter(brandId)
  }, [searchParams])

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, categoryFilter, brandFilter])

  useEffect(() => {
    loadCategoriesAndBrands()
  }, [])

  const loadCategoriesAndBrands = async () => {
    try {
      const [categoriesData, brandsData] = await Promise.all([
        api.getCategories(),
        api.getBrands(),
      ])
      setCategories(categoriesData || [])
      setBrands(brandsData || [])
    } catch (err: any) {
      console.error('Failed to load categories/brands:', err)
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getProducts({
        page,
        limit: 21,
        search,
        category: categoryFilter || undefined,
        brand: brandFilter || undefined
      })

      // Debug: Log products with masterProductId to see API response
      const variantProducts = (data.products || []).filter((p: any) => p.masterProductId)
      if (variantProducts.length > 0) {
        console.log('📦 API Response - Variant Products:', variantProducts.map((p: any) => ({
          sku: p.sku,
          masterProductId: p.masterProductId,
          hasMasterData: !!p.masterProduct,
          masterProduct: p.masterProduct
        })))
      }

      setProducts(data.products || [])
      setPagination(data.pagination)
    } catch (err: any) {
      // Detect if it's a connection error (backend offline)
      const isConnectionError = err.message?.includes('fetch') ||
                                err.message?.includes('NetworkError') ||
                                err.message?.includes('Failed to fetch') ||
                                !err.message

      if (isConnectionError) {
        setError('🔌 Backend API is offline. Please start the backend server on port 3001.')
      } else {
        setError(err.message || 'Failed to load products')
      }
      console.error('Products error:', err)
      // Set empty state instead of staying in loading
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await api.deleteProduct(id)
      loadProducts()
    } catch (err: any) {
      alert('Failed to delete product: ' + err.message)
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setFormData({
      sku: product.sku || '',
      name: product.name || '',
      nameTh: product.nameTh || '',
      description: product.description || '',
      categoryId: product.categoryId || '',
      brandId: product.brandId || '',
      costPrice: product.costPrice?.toString() || '',
      sellPrice: product.sellPrice?.toString() || '',
      stockQty: product.stockQty?.toString() || '',
      minStock: product.minStock?.toString() || '',
      barcode: product.barcode || '',
      imageUrl: product.imageUrl || '',
      isMaster: product.isMaster || false,
    })
    // Show existing image as preview, but no file selected yet
    const fullImageUrl = product.imageUrl
      ? (product.imageUrl.startsWith('http') ? product.imageUrl : `https://melltool-backend.fly.dev${product.imageUrl}`)
      : null
    setImagePreview(fullImageUrl)
    setImageFile(null)
    setShowModal(true)
  }

  const handleCompatibility = (product: any) => {
    setCompatibilityProduct(product)
    setShowCompatibilityModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const productData: any = {
        ...formData,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellPrice: parseFloat(formData.sellPrice) || 0,
        stockQty: parseInt(formData.stockQty) || 0,
        minStock: parseInt(formData.minStock) || 0,
      }

      // Remove imageUrl from product data (images should be uploaded separately via the upload endpoint)
      delete productData.imageUrl

      // Remove empty categoryId and brandId to avoid foreign key constraint errors
      if (!productData.categoryId) {
        delete productData.categoryId
      }
      if (!productData.brandId) {
        delete productData.brandId
      }

      let productId: string
      if (editingProduct) {
        const savedProduct = await api.updateProduct(editingProduct.id, productData)
        productId = savedProduct?.id || editingProduct.id
      } else {
        const savedProduct = await api.createProduct(productData)
        productId = savedProduct?.id
      }

      // Upload image if a new one was selected
      if (imageFile && productId) {
        try {
          await api.uploadProductImage(productId, imageFile)
        } catch (imgErr: any) {
          console.error('Failed to upload image:', imgErr)
          alert('Product saved but image upload failed: ' + imgErr.message)
        }
      }

      closeModal()
      loadProducts()
    } catch (err: any) {
      alert(`Failed to ${editingProduct ? 'update' : 'create'} product: ` + err.message)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Store the file for upload
      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setImagePreview(null)
    setImageFile(null)
    setFormData({
      sku: '',
      name: '',
      nameTh: '',
      description: '',
      categoryId: '',
      brandId: '',
      costPrice: '',
      sellPrice: '',
      stockQty: '',
      minStock: '',
      barcode: '',
      imageUrl: '',
      isMaster: false,
    })
  }

  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a file to import')
      return
    }

    try {
      setImporting(true)
      setImportResult(null)
      const result = await api.importProducts(importFile, {
        updateExisting,
        skipErrors: true,
      })
      setImportResult(result)
      if (result.success > 0) {
        loadProducts()
      }
    } catch (err: any) {
      alert('Failed to import products: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      console.log('Starting template download...')
      await api.downloadImportTemplate()
      console.log('Template download successful')
    } catch (err: any) {
      console.error('Template download error details:', err)
      alert('Failed to download template: ' + (err.message || 'Unknown error'))
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
              <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
              <p className="text-gray-600 mt-1">Manage your products and stock levels</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  console.log('Import button clicked')
                  setShowImportModal(true)
                }}
                className="px-4 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import from Excel
              </button>
              {(user?.role === 'OWNER' || user?.role === 'MOD') && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('auth_token')
                      if (!token) {
                        alert('You must be logged in to export stock data')
                        return
                      }

                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://melltool-backend.fly.dev'}/inventory/products/export/stock`, {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      })

                      if (!response.ok) {
                        const errorText = await response.text()
                        console.error('Export failed:', response.status, errorText)
                        throw new Error(`Export failed: ${response.status}`)
                      }

                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `stock-export-${new Date().toISOString().split('T')[0]}.xlsx`
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    } catch (err: any) {
                      console.error('Export error:', err)
                      alert('Failed to export stock data: ' + (err.message || 'Unknown error'))
                    }
                  }}
                  className="px-4 py-2.5 bg-green-600 border-2 border-green-600 text-white rounded-xl font-semibold hover:bg-green-700 hover:border-green-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Stock
                </button>
              )}
              {hasAccess && (
                <button
                  type="button"
                  onClick={() => setShowMasterVariantModal(true)}
                  className="px-4 py-2.5 bg-purple-600 border-2 border-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 hover:border-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  Master-Variant
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input pl-12"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {(categoryFilter || brandFilter) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Active Filters:</span>
            {categoryFilter && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                Category: {categories.find(c => c.id === categoryFilter)?.name || 'Unknown'}
                <button
                  onClick={() => {
                    setCategoryFilter(null)
                    setPage(1)
                    router.push('/inventory')
                  }}
                  className="hover:text-blue-900"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {brandFilter && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                Brand: {brands.find(b => b.id === brandFilter)?.name || 'Unknown'}
                <button
                  onClick={() => {
                    setBrandFilter(null)
                    setPage(1)
                    router.push('/inventory')
                  }}
                  className="hover:text-purple-900"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setCategoryFilter(null)
                setBrandFilter(null)
                setPage(1)
                router.push('/inventory')
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`card p-6 border-l-4 mb-6 ${error.includes('offline') ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'}`}>
            <div className="flex items-center gap-3">
              <svg className={`w-6 h-6 ${error.includes('offline') ? 'text-yellow-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <button onClick={loadProducts} className="btn-secondary">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-10 bg-gray-200 rounded mt-4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onCompatibility={handleCompatibility}
                  userRole={user?.role}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex flex-col items-center gap-4">
                {/* Page Numbers */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {page > 3 && (
                      <>
                        <button
                          onClick={() => setPage(1)}
                          className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
                        >
                          1
                        </button>
                        {page > 4 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                      </>
                    )}

                    {/* Pages around current page */}
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(p => {
                        // Show current page and 2 pages before/after
                        return p >= page - 2 && p <= page + 2
                      })
                      .map(p => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-4 py-2 rounded-lg border transition ${
                            p === page
                              ? 'border-blue-500 bg-blue-500 text-white font-semibold'
                              : 'border-gray-300 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}

                    {/* Last page */}
                    {page < pagination.pages - 2 && (
                      <>
                        {page < pagination.pages - 3 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setPage(pagination.pages)}
                          className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
                        >
                          {pagination.pages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Page info */}
                <div className="text-sm text-gray-600">
                  Showing page {page} of {pagination.pages} ({pagination.total} products total)
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <div className="card max-w-2xl mx-auto p-12">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {search ? 'No products found' : 'No products yet'}
              </h3>
              <p className="text-gray-600 text-lg mb-8">
                {search ? 'Try a different search term' : 'Get started by adding your first product'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Product
                </button>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
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
                    {/* Product Image Upload */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Image
                      </label>
                      <div className="flex items-center gap-4">
                        {imagePreview ? (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Product preview"
                              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null)
                                setImageFile(null)
                                setFormData({ ...formData, imageUrl: '' })
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="product-image"
                          />
                          <label
                            htmlFor="product-image"
                            className="btn-secondary cursor-pointer inline-flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload Image
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* SKU */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SKU *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          className="input"
                          placeholder="e.g., VAC-001"
                        />
                      </div>

                  {/* Barcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="input"
                      placeholder="e.g., 8850123456789"
                    />
                  </div>

                  {/* Product Name (English) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="e.g., Dyson V11 HEPA Filter"
                    />
                  </div>

                  {/* Product Name (Thai) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name (Thai)
                    </label>
                    <input
                      type="text"
                      value={formData.nameTh}
                      onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                      className="input"
                      placeholder="e.g., แผ่นกรอง HEPA Dyson V11"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="textarea"
                      rows={3}
                      placeholder="Product description..."
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="select"
                    >
                      <option value="">Select category...</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                      className="select"
                    >
                      <option value="">Select brand...</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cost Price - Only for OWNER and MOD */}
                  {(user?.role === 'OWNER' || user?.role === 'MOD') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cost Price (฿) *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        className="input"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {/* Sell Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sell Price (฿) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.sellPrice}
                      onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.stockQty}
                      onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                      className="input"
                      placeholder="0"
                    />
                  </div>

                  {/* Minimum Stock */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Stock *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      className="input"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Master Product Option */}
                {hasAccess && (
                  <div className="mt-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="isMaster"
                        checked={formData.isMaster}
                        onChange={(e) => setFormData({ ...formData, isMaster: e.target.checked })}
                        className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                      />
                      <div className="flex-1">
                        <label htmlFor="isMaster" className="block text-sm font-semibold text-purple-900 cursor-pointer">
                          Master Product (Shared Inventory)
                        </label>
                        <p className="text-xs text-purple-700 mt-1">
                          Enable this for products that will have multiple variants sharing the same physical stock.
                          <br />
                          <span className="font-medium">Example:</span> One HEPA filter that fits multiple vacuum models.
                        </p>
                        {formData.isMaster && (
                          <div className="mt-2 p-2 bg-purple-100 rounded text-xs text-purple-800">
                            💡 After creating this master product, use the <strong>"Master-Variant"</strong> panel to add variant products.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Profit Preview - Only for OWNER and MOD */}
                {(user?.role === 'OWNER' || user?.role === 'MOD') && formData.costPrice && formData.sellPrice && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Profit per unit:</span>
                      <span className="text-lg font-bold text-blue-600">
                        ฿{(parseFloat(formData.sellPrice) - parseFloat(formData.costPrice)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-gray-700">Profit margin:</span>
                      <span className="text-lg font-bold text-green-600">
                        {((parseFloat(formData.sellPrice) - parseFloat(formData.costPrice)) / parseFloat(formData.sellPrice) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingProduct ? 'Update' : 'Create'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Products Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Import Products from Excel/CSV</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportResult(null)
                    setUpdateExisting(false)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {!importResult ? (
                  <>
                    <div className="mb-6">
                      <p className="text-gray-600 mb-4">
                        Import products from Excel (.xlsx, .xls) or CSV files. Make sure your file has the required columns.
                      </p>
                      
                      <button
                        onClick={handleDownloadTemplate}
                        className="btn-secondary flex items-center gap-2 mb-4"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Template
                      </button>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-blue-900 mb-2">Required Columns:</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• <strong>sku</strong> - Product SKU (required)</li>
                          <li>• <strong>name</strong> - Product name (required)</li>
                          <li>• <strong>costPrice</strong> - Cost price (required)</li>
                          <li>• <strong>category</strong> - Category name (required)</li>
                          <li>• <strong>brand</strong> - Brand name (required)</li>
                          <li>• <strong>sellPrice</strong> - Selling price (optional)</li>
                          <li>• <strong>stockQty</strong> - Stock quantity (optional)</li>
                          <li>• <strong>nameTh</strong>, <strong>description</strong>, <strong>weight</strong>, etc. (optional)</li>
                        </ul>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select File (.xlsx, .xls, or .csv)
                        </label>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                          className="input"
                        />
                        {importFile && (
                          <p className="text-sm text-gray-600 mt-2">
                            Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                          </p>
                        )}
                      </div>

                      <div className="mb-6">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={updateExisting}
                            onChange={(e) => setUpdateExisting(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">
                              Update existing products (if SKU matches)
                            </span>
                            <p className="text-xs text-gray-600 mt-1">
                              ✓ Stock quantities will be <strong>added</strong> to existing stock (e.g., 10 + 5 = 15)
                            </p>
                            <p className="text-xs text-gray-600">
                              ✓ Other fields (name, price, category, etc.) will be updated
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowImportModal(false)
                            setImportFile(null)
                            setImportResult(null)
                          }}
                          className="btn-secondary flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleImport}
                          disabled={!importFile || importing}
                          className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {importing ? (
                            <>
                              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Importing...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Import Products
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Import Results</h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{importResult.success}</div>
                        <div className="text-sm text-green-700 mt-1">Success</div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-red-600">{importResult.failed}</div>
                        <div className="text-sm text-red-700 mt-1">Failed</div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-yellow-600">{importResult.skipped || 0}</div>
                        <div className="text-sm text-yellow-700 mt-1">Skipped</div>
                      </div>
                    </div>

                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Errors ({importResult.errors.length}) - Scroll to see all
                        </h4>
                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-2 text-left">Row</th>
                                <th className="px-4 py-2 text-left">SKU</th>
                                <th className="px-4 py-2 text-left">Name</th>
                                <th className="px-4 py-2 text-left">Error</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {importResult.errors.map((error: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2">{error.row}</td>
                                  <td className="px-4 py-2 font-mono text-xs">{error.sku || '-'}</td>
                                  <td className="px-4 py-2">{error.name || '-'}</td>
                                  <td className="px-4 py-2 text-red-600">{error.error}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowImportModal(false)
                          setImportFile(null)
                          setImportResult(null)
                          setUpdateExisting(false)
                        }}
                        className="btn-primary flex-1"
                      >
                        Close
                      </button>
                      {importResult.success > 0 && (
                        <button
                          onClick={() => {
                            setShowImportModal(false)
                            setImportFile(null)
                            setImportResult(null)
                            setUpdateExisting(false)
                            loadProducts()
                          }}
                          className="btn-secondary flex-1"
                        >
                          View Products
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product Compatibility Modal */}
        {showCompatibilityModal && compatibilityProduct && (
          <ProductCompatibilityModal
            productId={compatibilityProduct.id}
            productName={compatibilityProduct.name}
            onClose={() => {
              setShowCompatibilityModal(false)
              setCompatibilityProduct(null)
            }}
          />
        )}

        {/* Master-Variant Management Modal */}
        {showMasterVariantModal && (
          <MasterVariantManagementModal
            onClose={() => setShowMasterVariantModal(false)}
            onUpdate={() => loadProducts()}
          />
        )}
      </main>
    </div>
  )
}

function ProductCard({ product, onDelete, onEdit, onCompatibility, userRole }: any) {
  // Debug logging for master-variant stock
  if (product.masterProductId) {
    console.log('🔍 Variant Product Debug:', {
      sku: product.sku,
      name: product.name,
      masterProductId: product.masterProductId,
      hasMasterProductData: !!product.masterProduct,
      masterProduct: product.masterProduct,
      ownStockQty: product.stockQty,
      masterStockQty: product.masterProduct?.stockQty
    })
  }

  // For variants, use master's stock; otherwise use product's own stock
  const actualStock = product.masterProductId && product.masterProduct
    ? product.masterProduct.stockQty
    : product.stockQty

  const actualMinStock = product.masterProductId && product.masterProduct
    ? 0  // Variants don't have their own minStock threshold
    : product.minStock

  const stockStatus = actualStock <= actualMinStock ? 'low' : 'good'
  const canSeeCost = userRole === 'OWNER' || userRole === 'MOD' // OWNER and MOD can see cost/profit

  // Calculate percentage: if minStock is 0 or undefined, show 100% if stock exists, else 0%
  // Otherwise, show current stock as percentage of (minStock * 2) for visual representation
  const stockPercentage = actualMinStock > 0
    ? Math.min((actualStock / (actualMinStock * 2)) * 100, 100)
    : (actualStock > 0 ? 100 : 0)
  
  return (
    <div className="card p-6 card-hover">
      {/* Product Image */}
      <div className="mb-4 w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl.startsWith('http') ? product.imageUrl : `https://melltool-backend.fly.dev${product.imageUrl}`}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Show placeholder if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `<svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>`
              }
            }}
          />
        ) : (
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
          {product.nameTh && (
            <p className="text-sm text-gray-600 mb-2">{product.nameTh}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 font-mono">{product.sku}</span>
            {product.isMaster && (
              <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Master
              </span>
            )}
            {product.masterProductId && (
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-semibold">
                Variant
              </span>
            )}
          </div>
        </div>
        <span className={`badge ${
          stockStatus === 'low' ? 'badge-red' : 'badge-green'
        }`}>
          {stockStatus === 'low' ? 'Low Stock' : 'In Stock'}
        </span>
      </div>

      {/* Stock Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Stock Level</span>
          <span className="font-semibold text-gray-900">{actualStock} units</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              stockStatus === 'low' ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="space-y-2 mb-4">
        {canSeeCost && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cost Price:</span>
            <span className="font-semibold text-gray-900">฿{product.costPrice?.toLocaleString()}</span>
          </div>
        )}
        {product.sellPrice && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sell Price:</span>
            <span className="font-semibold text-green-600">฿{product.sellPrice?.toLocaleString()}</span>
          </div>
        )}
        {canSeeCost && product.sellPrice && product.costPrice && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Profit Margin:</span>
            <span className="font-semibold text-blue-600">
              {((((product.sellPrice - product.costPrice) / product.sellPrice) * 100) || 0).toFixed(1)}%
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Brand:</span>
          <span className="font-medium text-gray-900">{product.brand?.name || 'N/A'}</span>
        </div>
      </div>

      {/* Barcode */}
      {product.barcode && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-xs text-gray-600 mb-1">Barcode</p>
          <p className="text-sm font-mono text-gray-900 font-semibold">{product.barcode}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="btn-danger flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => onCompatibility(product)}
          className="w-full btn-secondary flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Compatible Products
        </button>
      </div>
    </div>
  )
}
