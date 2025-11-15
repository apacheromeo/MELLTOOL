'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface ReorderProduct {
  id: string
  sku: string
  name: string
  nameTh: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  reorderPoint: number
  optimalOrderQty: number
  leadTimeDays: number
  dailyDemand: number
  unitCost: number
  orderingCost: number
  holdingCostPercent: number
  status: 'ok' | 'near-reorder' | 'reorder-now' | 'critical'
}

export default function ReorderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ReorderProduct[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'status' | 'stock' | 'name'>('status')

  useEffect(() => {
    loadReorderPoints()
  }, [])

  const loadReorderPoints = () => {
    setLoading(true)
    setTimeout(() => {
      // Generate products with EOQ calculation
      const baseProducts = [
        {
          id: '1',
          sku: 'VAC-FILTER-001',
          name: 'HEPA Filter H13',
          nameTh: 'ฟิลเตอร์ HEPA H13',
          category: 'Filters',
          currentStock: 45,
          minStock: 20,
          maxStock: 100,
          leadTimeDays: 7,
          dailyDemand: 5,
          unitCost: 450,
          orderingCost: 200,
          holdingCostPercent: 20
        },
        {
          id: '2',
          sku: 'VAC-BAT-002',
          name: 'Lithium Battery 2500mAh',
          nameTh: 'แบตเตอรี่ลิเธียม 2500mAh',
          category: 'Batteries',
          currentStock: 18,
          minStock: 30,
          maxStock: 150,
          leadTimeDays: 10,
          dailyDemand: 8,
          unitCost: 1200,
          orderingCost: 300,
          holdingCostPercent: 25
        },
        {
          id: '3',
          sku: 'VAC-BRUSH-003',
          name: 'Rotating Brush Head',
          nameTh: 'หัวแปรงหมุน',
          category: 'Brushes',
          currentStock: 75,
          minStock: 50,
          maxStock: 200,
          leadTimeDays: 5,
          dailyDemand: 12,
          unitCost: 350,
          orderingCost: 150,
          holdingCostPercent: 18
        },
        {
          id: '4',
          sku: 'VAC-MOTOR-004',
          name: 'DC Motor 1000W',
          nameTh: 'มอเตอร์ DC 1000W',
          category: 'Motors',
          currentStock: 22,
          minStock: 15,
          maxStock: 50,
          leadTimeDays: 14,
          dailyDemand: 3,
          unitCost: 2500,
          orderingCost: 400,
          holdingCostPercent: 30
        },
        {
          id: '5',
          sku: 'VAC-HOSE-005',
          name: 'Flexible Hose 2m',
          nameTh: 'ท่อยืดหยุ่น 2 เมตร',
          category: 'Parts',
          currentStock: 120,
          minStock: 60,
          maxStock: 300,
          leadTimeDays: 7,
          dailyDemand: 15,
          unitCost: 280,
          orderingCost: 180,
          holdingCostPercent: 15
        },
        {
          id: '6',
          sku: 'VAC-WHEEL-006',
          name: 'Replacement Wheels Set',
          nameTh: 'ชุดล้อสำรอง',
          category: 'Parts',
          currentStock: 55,
          minStock: 40,
          maxStock: 120,
          leadTimeDays: 8,
          dailyDemand: 6,
          unitCost: 180,
          orderingCost: 120,
          holdingCostPercent: 12
        },
        {
          id: '7',
          sku: 'VAC-SENSOR-007',
          name: 'Dust Sensor Module',
          nameTh: 'โมดูลเซ็นเซอร์ฝุ่น',
          category: 'Electronics',
          currentStock: 8,
          minStock: 25,
          maxStock: 80,
          leadTimeDays: 12,
          dailyDemand: 4,
          unitCost: 850,
          orderingCost: 250,
          holdingCostPercent: 22
        },
        {
          id: '8',
          sku: 'VAC-CHARGER-008',
          name: 'Fast Charger 3A',
          nameTh: 'ที่ชาร์จเร็ว 3A',
          category: 'Accessories',
          currentStock: 92,
          minStock: 35,
          maxStock: 150,
          leadTimeDays: 6,
          dailyDemand: 10,
          unitCost: 320,
          orderingCost: 160,
          holdingCostPercent: 16
        }
      ]

      const productsWithCalculations: ReorderProduct[] = baseProducts.map(p => {
        // Calculate EOQ (Economic Order Quantity)
        // EOQ = sqrt((2 * D * S) / H)
        // D = Annual demand, S = Ordering cost, H = Holding cost per unit per year
        const annualDemand = p.dailyDemand * 365
        const holdingCostPerUnit = p.unitCost * (p.holdingCostPercent / 100)
        const eoq = Math.round(Math.sqrt((2 * annualDemand * p.orderingCost) / holdingCostPerUnit))

        // Reorder Point = (Lead Time × Daily Demand) + Safety Stock
        // Using 50% of lead time demand as safety stock
        const reorderPoint = Math.round((p.leadTimeDays * p.dailyDemand) * 1.5)

        // Determine status
        let status: 'ok' | 'near-reorder' | 'reorder-now' | 'critical'
        if (p.currentStock < p.minStock) {
          status = 'critical'
        } else if (p.currentStock <= reorderPoint) {
          status = 'reorder-now'
        } else if (p.currentStock <= reorderPoint * 1.2) {
          status = 'near-reorder'
        } else {
          status = 'ok'
        }

        return {
          ...p,
          reorderPoint,
          optimalOrderQty: eoq,
          status
        }
      })

      setProducts(productsWithCalculations)
      setLoading(false)
    }, 500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'reorder-now':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'near-reorder':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'ok':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return '🚨'
      case 'reorder-now':
        return '📍'
      case 'near-reorder':
        return '⚠️'
      case 'ok':
        return '✅'
      default:
        return '📊'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical':
        return 'Critical'
      case 'reorder-now':
        return 'Reorder Now'
      case 'near-reorder':
        return 'Near Reorder Point'
      case 'ok':
        return 'OK'
      default:
        return 'Unknown'
    }
  }

  const filteredProducts = products
    .filter(product => {
      if (filterStatus !== 'all' && product.status !== filterStatus) return false
      if (filterCategory !== 'all' && product.category !== filterCategory) return false
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !product.sku.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'status') {
        const statusOrder = { critical: 0, 'reorder-now': 1, 'near-reorder': 2, ok: 3 }
        return statusOrder[a.status] - statusOrder[b.status]
      } else if (sortBy === 'stock') {
        return a.currentStock - b.currentStock
      } else {
        return a.name.localeCompare(b.name)
      }
    })

  const categories = [...new Set(products.map(p => p.category))]
  const criticalCount = products.filter(p => p.status === 'critical').length
  const reorderNowCount = products.filter(p => p.status === 'reorder-now').length
  const nearReorderCount = products.filter(p => p.status === 'near-reorder').length
  const okCount = products.filter(p => p.status === 'ok').length

  const totalReorderValue = filteredProducts
    .filter(p => p.status === 'reorder-now' || p.status === 'critical')
    .reduce((sum, p) => sum + (p.optimalOrderQty * p.unitCost), 0)

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reorder Points</h1>
            <p className="text-gray-600 mt-1">Optimal reorder points and quantities for each product</p>
            <p className="text-sm text-gray-500">จุดสั่งซื้อและปริมาณที่เหมาะสมสำหรับแต่ละสินค้า</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/forecasting')}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Forecasting
            </button>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="card p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Critical</p>
                <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
                <p className="text-xs text-gray-500 mt-1">Below minimum</p>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Reorder Now</p>
                <p className="text-3xl font-bold text-orange-600">{reorderNowCount}</p>
                <p className="text-xs text-gray-500 mt-1">At reorder point</p>
              </div>
              <div className="text-4xl">📍</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Near Reorder</p>
                <p className="text-3xl font-bold text-yellow-600">{nearReorderCount}</p>
                <p className="text-xs text-gray-500 mt-1">Close to point</p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">OK</p>
                <p className="text-3xl font-bold text-green-600">{okCount}</p>
                <p className="text-xs text-gray-500 mt-1">Adequate stock</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Reorder Value</p>
                <p className="text-2xl font-bold text-blue-600">฿{(totalReorderValue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500 mt-1">Total needed</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select"
            >
              <option value="all">All Status</option>
              <option value="critical">Critical</option>
              <option value="reorder-now">Reorder Now</option>
              <option value="near-reorder">Near Reorder Point</option>
              <option value="ok">OK</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="select"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="select"
            >
              <option value="status">Sort by Status</option>
              <option value="stock">Sort by Stock Level</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading reorder points...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Min / Max</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reorder Point</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">EOQ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead Time</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getStatusIcon(product.status)}</span>
                          <span className={`badge ${getStatusColor(product.status)} text-xs`}>
                            {getStatusText(product.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.nameTh}</div>
                          <div className="text-xs text-gray-500">{product.sku}</div>
                          <span className="badge badge-gray text-xs mt-1">{product.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={`text-2xl font-bold ${
                            product.status === 'critical' ? 'text-red-600' :
                            product.status === 'reorder-now' ? 'text-orange-600' :
                            product.status === 'near-reorder' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {product.currentStock}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {product.dailyDemand}/day demand
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-700">Min: <span className="font-semibold">{product.minStock}</span></div>
                          <div className="text-gray-700">Max: <span className="font-semibold">{product.maxStock}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-blue-600">{product.reorderPoint}</span>
                          {product.currentStock <= product.reorderPoint && (
                            <span className="text-red-500">⚠️</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {product.currentStock > product.reorderPoint
                            ? `${product.currentStock - product.reorderPoint} above`
                            : `${product.reorderPoint - product.currentStock} below`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-lg font-bold text-purple-600">{product.optimalOrderQty}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            ฿{(product.optimalOrderQty * product.unitCost).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-gray">{product.leadTimeDays} days</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {(product.status === 'critical' || product.status === 'reorder-now') && (
                            <button
                              onClick={() => router.push(`/stock-in/new?product=${product.id}&qty=${product.optimalOrderQty}`)}
                              className="btn-primary text-sm px-4 py-2"
                            >
                              Order Now
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/inventory/${product.id}`)}
                            className="btn-secondary text-sm px-4 py-2"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EOQ Information Card */}
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Economic Order Quantity (EOQ) Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">How EOQ is Calculated:</h4>
              <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                <div>EOQ = √((2 × D × S) / H)</div>
                <div className="text-xs text-gray-600 mt-2">
                  <div>D = Annual demand</div>
                  <div>S = Ordering cost per order</div>
                  <div>H = Holding cost per unit per year</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Reorder Point Formula:</h4>
              <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                <div>ROP = (Lead Time × Daily Demand) + Safety Stock</div>
                <div className="text-xs text-gray-600 mt-2">
                  <div>Safety Stock = 50% of lead time demand</div>
                  <div>Ensures buffer during lead time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
