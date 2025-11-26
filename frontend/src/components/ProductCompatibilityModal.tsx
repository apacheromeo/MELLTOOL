'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Product {
  id: string
  sku: string
  name: string
  nameTh?: string
  imageUrl?: string
  sellPrice?: number
  stockQty?: number
  brand?: { name: string }
  category?: { name: string }
}

interface CompatibleProduct extends Product {
  compatibilityId: string
  notes?: string
  createdAt: string
}

interface ProductCompatibilityModalProps {
  productId: string
  productName: string
  onClose: () => void
}

export default function ProductCompatibilityModal({
  productId,
  productName,
  onClose,
}: ProductCompatibilityModalProps) {
  const [compatibleProducts, setCompatibleProducts] = useState<CompatibleProduct[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [productId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [compatibilityData, productsData] = await Promise.all([
        api.getProductCompatibility(productId),
        api.getProducts({ page: 1, limit: 1000 }),
      ])

      setCompatibleProducts(compatibilityData.compatibleProducts || [])
      // Filter out the current product from the list
      setAllProducts((productsData.products || []).filter((p: Product) => p.id !== productId))
    } catch (err: any) {
      console.error('Failed to load compatibility data:', err)
      alert('Failed to load compatibility data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCompatibility = async () => {
    if (selectedProductIds.length === 0) {
      alert('Please select at least one product')
      return
    }

    try {
      setSaving(true)
      await api.addProductCompatibility(productId, selectedProductIds, notes || undefined)
      setSelectedProductIds([])
      setNotes('')
      setSearchTerm('')
      await loadData()
      alert('Compatible products added successfully')
    } catch (err: any) {
      console.error('Failed to add compatibility:', err)
      alert('Failed to add compatibility: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveCompatibility = async (compatibleProductId: string) => {
    if (!confirm('Remove this compatibility relationship?')) return

    try {
      await api.removeProductCompatibility(productId, compatibleProductId)
      await loadData()
    } catch (err: any) {
      console.error('Failed to remove compatibility:', err)
      alert('Failed to remove compatibility: ' + err.message)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // Filter products that are not already compatible
  const compatibleProductIds = compatibleProducts.map(cp => cp.id)
  const availableProducts = allProducts.filter(
    p => !compatibleProductIds.includes(p.id) &&
    (searchTerm === '' ||
     p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.nameTh?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null
    return imageUrl.startsWith('http')
      ? imageUrl
      : `https://melltool-backend.fly.dev${imageUrl}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Product Compatibility</h2>
              <p className="text-blue-100 mt-1">{productName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Current Compatible Products */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Currently Compatible Products ({compatibleProducts.length})
              </h3>

              {compatibleProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No compatible products yet. Add some below!
                </div>
              ) : (
                <div className="space-y-3">
                  {compatibleProducts.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                        {product.imageUrl ? (
                          <img
                            src={getImageUrl(product.imageUrl) || ''}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                        {product.nameTh && (
                          <div className="text-sm text-gray-600 truncate">{product.nameTh}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {product.sku} • {product.brand?.name} • {product.category?.name}
                        </div>
                        {product.notes && (
                          <div className="text-xs text-blue-600 mt-1 italic">Note: {product.notes}</div>
                        )}
                      </div>

                      {/* Price & Stock */}
                      <div className="text-right">
                        {product.sellPrice && (
                          <div className="font-semibold text-green-600">฿{product.sellPrice.toFixed(2)}</div>
                        )}
                        <div className="text-xs text-gray-500">Stock: {product.stockQty}</div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveCompatibility(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove compatibility"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Compatible Products */}
            <div className="border-t-2 border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Compatible Products</h3>

              {/* Search */}
              <input
                type="text"
                placeholder="Search products by name, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              />

              {/* Notes */}
              <input
                type="text"
                placeholder="Optional notes about compatibility (e.g., 'Compatible filter models')"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              />

              {/* Product Selection */}
              <div className="max-h-64 overflow-y-auto border-2 border-gray-200 rounded-xl p-2 mb-4">
                {availableProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No products found' : 'All products are already linked or none available'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableProducts.slice(0, 50).map(product => (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Product Image */}
                        <div className="w-12 h-12 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={getImageUrl(product.imageUrl) || ''}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{product.name}</div>
                          {product.nameTh && (
                            <div className="text-sm text-gray-600 truncate">{product.nameTh}</div>
                          )}
                          <div className="text-xs text-gray-500">{product.sku}</div>
                        </div>

                        {product.sellPrice && (
                          <div className="text-sm font-semibold text-green-600">
                            ฿{product.sellPrice.toFixed(2)}
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Count */}
              {selectedProductIds.length > 0 && (
                <div className="text-sm text-blue-600 mb-4">
                  {selectedProductIds.length} product{selectedProductIds.length > 1 ? 's' : ''} selected
                </div>
              )}

              {/* Add Button */}
              <button
                onClick={handleAddCompatibility}
                disabled={saving || selectedProductIds.length === 0}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {saving ? 'Adding...' : `Add ${selectedProductIds.length || ''} Compatible Product${selectedProductIds.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
