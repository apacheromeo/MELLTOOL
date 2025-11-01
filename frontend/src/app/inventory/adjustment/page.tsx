'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface StockAdjustment {
  id: string
  productSku: string
  productName: string
  productNameTh: string
  type: 'increase' | 'decrease'
  reason: string
  quantity: number
  oldStock: number
  newStock: number
  adjustedBy: string
  notes?: string
  createdAt: string
}

export default function StockAdjustmentPage() {
  const router = useRouter()
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [formData, setFormData] = useState({
    productSku: '',
    productName: '',
    productNameTh: '',
    type: 'increase' as 'increase' | 'decrease',
    reason: '',
    quantity: 0,
    oldStock: 0,
    notes: ''
  })

  useEffect(() => {
    loadAdjustments()
  }, [])

  const loadAdjustments = () => {
    setLoading(true)
    setTimeout(() => {
      setAdjustments([
        {
          id: '1',
          productSku: 'VAC-FILTER-001',
          productName: 'HEPA Filter H13',
          productNameTh: 'ฟิลเตอร์ HEPA H13',
          type: 'decrease',
          reason: 'Damaged',
          quantity: 5,
          oldStock: 50,
          newStock: 45,
          adjustedBy: 'Admin',
          notes: 'Water damage during storage',
          createdAt: '2024-10-25 14:30'
        },
        {
          id: '2',
          productSku: 'VAC-BAT-002',
          productName: 'Lithium Battery 2500mAh',
          productNameTh: 'แบตเตอรี่ลิเธียม 2500mAh',
          type: 'increase',
          reason: 'Found',
          quantity: 3,
          oldStock: 12,
          newStock: 15,
          adjustedBy: 'Staff',
          notes: 'Found in warehouse B',
          createdAt: '2024-10-24 10:15'
        },
        {
          id: '3',
          productSku: 'VAC-BRUSH-003',
          productName: 'Rotating Brush Head',
          productNameTh: 'หัวแปรงหมุน',
          type: 'decrease',
          reason: 'Lost',
          quantity: 2,
          oldStock: 30,
          newStock: 28,
          adjustedBy: 'Manager',
          notes: 'Missing after inventory count',
          createdAt: '2024-10-23 16:45'
        },
        {
          id: '4',
          productSku: 'VAC-MOTOR-004',
          productName: 'DC Motor 1000W',
          productNameTh: 'มอเตอร์ DC 1000W',
          type: 'decrease',
          reason: 'Damaged',
          quantity: 1,
          oldStock: 10,
          newStock: 9,
          adjustedBy: 'Admin',
          notes: 'Defective unit',
          createdAt: '2024-10-22 09:20'
        }
      ])
      setLoading(false)
    }, 500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newAdjustment: StockAdjustment = {
      id: Date.now().toString(),
      ...formData,
      newStock: formData.type === 'increase' 
        ? formData.oldStock + formData.quantity 
        : formData.oldStock - formData.quantity,
      adjustedBy: 'Current User',
      createdAt: new Date().toLocaleString('en-GB', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }).replace(',', '')
    }
    
    setAdjustments([newAdjustment, ...adjustments])
    closeModal()
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({
      productSku: '',
      productName: '',
      productNameTh: '',
      type: 'increase',
      reason: '',
      quantity: 0,
      oldStock: 0,
      notes: ''
    })
  }

  const filteredAdjustments = adjustments.filter(adj => {
    if (filterType !== 'all' && adj.type !== filterType) return false
    if (searchTerm && !adj.productName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !adj.productSku.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const totalIncrease = adjustments.filter(a => a.type === 'increase').reduce((sum, a) => sum + a.quantity, 0)
  const totalDecrease = adjustments.filter(a => a.type === 'decrease').reduce((sum, a) => sum + a.quantity, 0)
  const netChange = totalIncrease - totalDecrease

  const reasonOptions = [
    { value: 'Damaged', label: 'Damaged / เสียหาย', icon: '💔' },
    { value: 'Lost', label: 'Lost / สูญหาย', icon: '❓' },
    { value: 'Found', label: 'Found / พบเพิ่ม', icon: '🔍' },
    { value: 'Expired', label: 'Expired / หมดอายุ', icon: '⏰' },
    { value: 'Returned', label: 'Returned / คืนสินค้า', icon: '↩️' },
    { value: 'Theft', label: 'Theft / ถูกขโมย', icon: '🚨' },
    { value: 'Correction', label: 'Inventory Correction / แก้ไขสต็อก', icon: '✏️' },
    { value: 'Other', label: 'Other / อื่นๆ', icon: '📝' }
  ]

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Adjustment</h1>
            <p className="text-gray-600 mt-1">Adjust stock for damaged, lost, or found items</p>
            <p className="text-sm text-gray-500">ปรับปรุงสต็อกสำหรับสินค้าที่เสียหาย สูญหาย หรือพบเพิ่ม</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Adjustment
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Adjustments</p>
                <p className="text-3xl font-bold text-gray-900">{adjustments.length}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Increased</p>
                <p className="text-3xl font-bold text-green-600">+{totalIncrease}</p>
                <p className="text-xs text-gray-500 mt-1">units added</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Decreased</p>
                <p className="text-3xl font-bold text-red-600">-{totalDecrease}</p>
                <p className="text-xs text-gray-500 mt-1">units removed</p>
              </div>
              <div className="text-4xl">📉</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Net Change</p>
                <p className={`text-3xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netChange >= 0 ? '+' : ''}{netChange}
                </p>
                <p className="text-xs text-gray-500 mt-1">overall</p>
              </div>
              <div className="text-4xl">⚖️</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name or SKU..."
                className="input pl-10"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select"
            >
              <option value="all">All Types</option>
              <option value="increase">Increase Only</option>
              <option value="decrease">Decrease Only</option>
            </select>
          </div>
        </div>

        {/* Adjustments Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading adjustments...</p>
          </div>
        ) : filteredAdjustments.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔧</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'No Adjustments Found' : 'No Adjustments Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first stock adjustment'}
            </p>
            {!searchTerm && filterType === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Adjustment
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Change</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Adjusted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAdjustments.map((adjustment) => (
                    <tr key={adjustment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{adjustment.createdAt}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{adjustment.productName}</div>
                          <div className="text-sm text-gray-600">{adjustment.productNameTh}</div>
                          <div className="text-xs text-gray-500">{adjustment.productSku}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          adjustment.type === 'increase' 
                            ? 'badge-green' 
                            : 'badge-red'
                        }`}>
                          {adjustment.type === 'increase' ? '📈 Increase' : '📉 Decrease'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-gray">{adjustment.reason}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${
                          adjustment.type === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {adjustment.type === 'increase' ? '+' : '-'}{adjustment.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="text-gray-500">{adjustment.oldStock}</span>
                          <svg className="inline-block w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="font-semibold text-gray-900">{adjustment.newStock}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{adjustment.adjustedBy}</span>
                        {adjustment.notes && (
                          <div className="text-xs text-gray-500 mt-1" title={adjustment.notes}>
                            📝 {adjustment.notes.substring(0, 30)}{adjustment.notes.length > 30 ? '...' : ''}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Adjustment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">New Stock Adjustment</h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product SKU *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.productSku}
                        onChange={(e) => setFormData({ ...formData, productSku: e.target.value })}
                        className="input"
                        placeholder="VAC-FILTER-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Stock *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.oldStock}
                        onChange={(e) => setFormData({ ...formData, oldStock: parseInt(e.target.value) || 0 })}
                        className="input"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      className="input"
                      placeholder="HEPA Filter H13"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name (Thai) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.productNameTh}
                      onChange={(e) => setFormData({ ...formData, productNameTh: e.target.value })}
                      className="input"
                      placeholder="ฟิลเตอร์ HEPA H13"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjustment Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'increase' })}
                        className={`p-4 rounded-lg border-2 transition ${
                          formData.type === 'increase'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">📈</div>
                        <div className="font-semibold text-gray-900">Increase</div>
                        <div className="text-xs text-gray-600">Add stock</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'decrease' })}
                        className={`p-4 rounded-lg border-2 transition ${
                          formData.type === 'decrease'
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">📉</div>
                        <div className="font-semibold text-gray-900">Decrease</div>
                        <div className="text-xs text-gray-600">Remove stock</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason *
                    </label>
                    <select
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="select"
                    >
                      <option value="">Select a reason...</option>
                      {reasonOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="input"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="textarea"
                      rows={3}
                      placeholder="Additional notes about this adjustment..."
                    />
                  </div>

                  {/* Preview */}
                  {formData.quantity > 0 && formData.oldStock > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Stock will change from:</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formData.oldStock}
                            <svg className="inline-block w-6 h-6 mx-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className={formData.type === 'increase' ? 'text-green-600' : 'text-red-600'}>
                              {formData.type === 'increase' 
                                ? formData.oldStock + formData.quantity 
                                : formData.oldStock - formData.quantity}
                            </span>
                          </p>
                        </div>
                        <div className="text-4xl">
                          {formData.type === 'increase' ? '📈' : '📉'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Create Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
