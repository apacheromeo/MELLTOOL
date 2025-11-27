'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface MasterVariantManagementModalProps {
  onClose: () => void
  onUpdate: () => void
}

export default function MasterVariantManagementModal({ onClose, onUpdate }: MasterVariantManagementModalProps) {
  const [masterProducts, setMasterProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMaster, setSelectedMaster] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [showCreateVariant, setShowCreateVariant] = useState(false)
  const [showLinkExisting, setShowLinkExisting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [variantForm, setVariantForm] = useState({
    sku: '',
    name: '',
    nameTh: '',
    description: '',
    descriptionTh: '',
    barcode: '',
    sellPrice: '',
  })

  useEffect(() => {
    loadMasterProducts()
  }, [])

  const loadMasterProducts = async () => {
    try {
      setLoading(true)
      // Load all products and filter master products
      const response = await api.getProducts({ limit: 1000 })
      const masters = response.products.filter((p: any) => p.isMaster)
      setMasterProducts(masters)
    } catch (err) {
      console.error('Failed to load master products:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadVariants = async (masterId: string) => {
    try {
      const response = await api.getVariants(masterId)
      setVariants(response.variants || [])
    } catch (err) {
      console.error('Failed to load variants:', err)
      setVariants([])
    }
  }

  const handleSelectMaster = (master: any) => {
    setSelectedMaster(master)
    loadVariants(master.id)
    setShowCreateVariant(false)
    setShowLinkExisting(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSearchProducts = async (query: string) => {
    setSearchQuery(query)

    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const response = await api.getProducts({ search: query, limit: 20 })
      // Filter out: 1) master products, 2) products already linked as variants, 3) selected master
      const variantIds = variants.map(v => v.id)
      const filtered = response.products.filter((p: any) =>
        !p.isMaster &&
        !p.masterProductId &&
        !variantIds.includes(p.id) &&
        p.id !== selectedMaster?.id
      )
      setSearchResults(filtered)
    } catch (err) {
      console.error('Failed to search products:', err)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleLinkExistingProduct = async (productId: string) => {
    if (!selectedMaster) {
      alert('Please select a master product first')
      return
    }

    try {
      // Update the product to link it as a variant
      await api.updateProduct(productId, { masterProductId: selectedMaster.id })
      alert('Product linked as variant successfully!')

      // Reset and reload
      setShowLinkExisting(false)
      setSearchQuery('')
      setSearchResults([])
      loadVariants(selectedMaster.id)
      onUpdate()
    } catch (err: any) {
      alert('Failed to link product: ' + err.message)
    }
  }

  const handleToggleVisibility = async (master: any) => {
    try {
      const newVisibility = !master.isVisible
      await api.toggleMasterVisibility(master.id, newVisibility)
      alert(`Master product ${newVisibility ? 'shown' : 'hidden'} successfully!`)
      loadMasterProducts()
      if (selectedMaster?.id === master.id) {
        setSelectedMaster({ ...master, isVisible: newVisibility })
      }
      onUpdate()
    } catch (err: any) {
      alert('Failed to toggle visibility: ' + err.message)
    }
  }

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMaster) {
      alert('Please select a master product first')
      return
    }

    try {
      const data = {
        ...variantForm,
        sellPrice: variantForm.sellPrice ? parseFloat(variantForm.sellPrice) : undefined,
      }

      await api.createVariant(selectedMaster.id, data)
      alert('Variant created successfully!')

      // Reset form and reload
      setVariantForm({
        sku: '',
        name: '',
        nameTh: '',
        description: '',
        descriptionTh: '',
        barcode: '',
        sellPrice: '',
      })
      setShowCreateVariant(false)
      loadVariants(selectedMaster.id)
      onUpdate()
    } catch (err: any) {
      alert('Failed to create variant: ' + err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Master-Variant Product Management</h2>
            <p className="text-blue-100 text-sm mt-1">Manage shared inventory products</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel: Master Products List */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Master Products</h3>
                <span className="text-sm text-gray-500">{masterProducts.length} total</span>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading...</p>
                </div>
              ) : masterProducts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600">No master products found</p>
                  <p className="text-sm text-gray-500 mt-1">Create a product with "isMaster: true"</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {masterProducts.map((master) => (
                    <div
                      key={master.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMaster?.id === master.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                      onClick={() => handleSelectMaster(master)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{master.name}</h4>
                          {master.nameTh && (
                            <p className="text-sm text-gray-600">{master.nameTh}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">SKU: {master.sku}</p>
                          <p className="text-sm font-medium text-green-600 mt-2">
                            Stock: {master.stockQty} units
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`badge ${master.isVisible ? 'badge-green' : 'badge-gray'}`}>
                            {master.isVisible ? 'Visible' : 'Hidden'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleVisibility(master)
                            }}
                            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                              master.isVisible
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {master.isVisible ? 'Hide' : 'Show'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel: Variant Management */}
            <div>
              {selectedMaster ? (
                <>
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-1">Selected Master</h4>
                    <p className="text-blue-800">{selectedMaster.name}</p>
                    <p className="text-sm text-blue-600">Current Stock: {selectedMaster.stockQty} units</p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Variants</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowCreateVariant(!showCreateVariant)
                          if (!showCreateVariant) setShowLinkExisting(false)
                        }}
                        className={`text-sm px-4 py-2 rounded-lg font-semibold transition-colors ${
                          showCreateVariant
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {showCreateVariant ? 'Cancel' : '+ Create New'}
                      </button>
                      <button
                        onClick={() => {
                          setShowLinkExisting(!showLinkExisting)
                          if (!showLinkExisting) setShowCreateVariant(false)
                        }}
                        className={`text-sm px-4 py-2 rounded-lg font-semibold transition-colors ${
                          showLinkExisting
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {showLinkExisting ? 'Cancel' : '+ Link Existing'}
                      </button>
                    </div>
                  </div>

                  {showCreateVariant && (
                    <form onSubmit={handleCreateVariant} className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Create New Variant</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SKU <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            className="input-field"
                            value={variantForm.sku}
                            onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                            placeholder="e.g., HEPA-X20-PLUS"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            className="input-field"
                            value={variantForm.name}
                            onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                            placeholder="e.g., HEPA Filter for Xiaomi X20+"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Thai Name</label>
                          <input
                            type="text"
                            className="input-field"
                            value={variantForm.nameTh}
                            onChange={(e) => setVariantForm({ ...variantForm, nameTh: e.target.value })}
                            placeholder="e.g., ไส้กรอง HEPA สำหรับ Xiaomi X20+"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                          <input
                            type="text"
                            className="input-field"
                            value={variantForm.barcode}
                            onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })}
                            placeholder="e.g., 8859012345678"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sell Price (optional, inherits from master if not set)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="input-field"
                            value={variantForm.sellPrice}
                            onChange={(e) => setVariantForm({ ...variantForm, sellPrice: e.target.value })}
                            placeholder={`Default: ฿${selectedMaster.sellPrice || 0}`}
                          />
                        </div>
                        <button type="submit" className="w-full btn-success">
                          Create Variant
                        </button>
                      </div>
                    </form>
                  )}

                  {showLinkExisting && (
                    <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Link Existing Product as Variant</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search Products
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              className="input-field pr-10"
                              value={searchQuery}
                              onChange={(e) => handleSearchProducts(e.target.value)}
                              placeholder="Search by name, SKU, or barcode..."
                            />
                            {searching && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Type at least 2 characters to search. Only independent products (not already linked) will be shown.
                          </p>
                        </div>

                        {searchQuery.length >= 2 && (
                          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                            {searchResults.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                {searching ? 'Searching...' : 'No products found'}
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-200">
                                {searchResults.map((product) => (
                                  <div
                                    key={product.id}
                                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-start justify-between gap-3"
                                    onClick={() => {
                                      if (confirm(`Link "${product.name}" as a variant of "${selectedMaster.name}"?`)) {
                                        handleLinkExistingProduct(product.id)
                                      }
                                    }}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                      {product.nameTh && (
                                        <p className="text-sm text-gray-600 truncate">{product.nameTh}</p>
                                      )}
                                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                        <span>SKU: {product.sku}</span>
                                        {product.barcode && <span>Barcode: {product.barcode}</span>}
                                      </div>
                                      <p className="text-xs text-orange-600 mt-1">
                                        Stock: {product.stockQty} units (will be managed by master after linking)
                                      </p>
                                    </div>
                                    <button
                                      className="flex-shrink-0 px-3 py-1 text-xs font-semibold bg-green-600 text-white rounded hover:bg-green-700"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (confirm(`Link "${product.name}" as a variant?`)) {
                                          handleLinkExistingProduct(product.id)
                                        }
                                      }}
                                    >
                                      Link
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {variants.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-600">No variants yet</p>
                        <p className="text-sm text-gray-500 mt-1">Click "Add Variant" to create one</p>
                      </div>
                    ) : (
                      variants.map((variant) => (
                        <div key={variant.id} className="p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{variant.name}</h5>
                              {variant.nameTh && (
                                <p className="text-sm text-gray-600">{variant.nameTh}</p>
                              )}
                              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>SKU: {variant.sku}</span>
                                {variant.barcode && <span>Barcode: {variant.barcode}</span>}
                              </div>
                              {variant.sellPrice && (
                                <p className="text-sm font-medium text-green-600 mt-2">
                                  Price: ฿{variant.sellPrice.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <span className="badge badge-blue">Variant</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p>Select a master product to view and manage variants</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
