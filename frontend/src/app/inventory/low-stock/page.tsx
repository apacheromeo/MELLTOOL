'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface LowStockProduct {
  id: string
  sku: string
  name: string
  nameTh: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  stockPercentage: number
  lastRestocked: string
  urgency: 'critical' | 'warning' | 'low'
  price: number
  supplier: string
}

export default function LowStockPage() {
  const router = useRouter()
  const [products, setProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUrgency, setFilterUrgency] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'urgency' | 'stock' | 'name'>('urgency')

  useEffect(() => {
    loadLowStockProducts()
  }, [])

  const loadLowStockProducts = () => {
    setLoading(true)
    setTimeout(() => {
      setProducts([
        {
          id: '1',
          sku: 'VAC-FILTER-001',
          name: 'HEPA Filter H13',
          nameTh: 'ฟิลเตอร์ HEPA H13',
          category: 'Filters',
          currentStock: 5,
          minStock: 20,
          maxStock: 100,
          stockPercentage: 5,
          lastRestocked: '2024-10-15',
          urgency: 'critical',
          price: 450,
          supplier: 'FilterPro Co.'
        },
        {
          id: '2',
          sku: 'VAC-BAT-002',
          name: 'Lithium Battery 2500mAh',
          nameTh: 'แบตเตอรี่ลิเธียม 2500mAh',
          category: 'Batteries',
          currentStock: 12,
          minStock: 30,
          maxStock: 150,
          stockPercentage: 8,
          lastRestocked: '2024-10-10',
          urgency: 'critical',
          price: 1200,
          supplier: 'PowerCell Ltd.'
        },
        {
          id: '3',
          sku: 'VAC-BRUSH-003',
          name: 'Rotating Brush Head',
          nameTh: 'หัวแปรงหมุน',
          category: 'Brushes',
          currentStock: 25,
          minStock: 50,
          maxStock: 200,
          stockPercentage: 12.5,
          lastRestocked: '2024-10-12',
          urgency: 'warning',
          price: 350,
          supplier: 'BrushMaster Inc.'
        },
        {
          id: '4',
          sku: 'VAC-MOTOR-004',
          name: 'DC Motor 1000W',
          nameTh: 'มอเตอร์ DC 1000W',
          category: 'Motors',
          currentStock: 8,
          minStock: 15,
          maxStock: 50,
          stockPercentage: 16,
          lastRestocked: '2024-10-08',
          urgency: 'warning',
          price: 2500,
          supplier: 'MotorWorks Co.'
        },
        {
          id: '5',
          sku: 'VAC-HOSE-005',
          name: 'Flexible Hose 2m',
          nameTh: 'ท่อยืดหยุ่น 2 เมตร',
          category: 'Parts',
          currentStock: 35,
          minStock: 60,
          maxStock: 300,
          stockPercentage: 11.7,
          lastRestocked: '2024-10-18',
          urgency: 'low',
          price: 280,
          supplier: 'HosePro Ltd.'
        },
        {
          id: '6',
          sku: 'VAC-WHEEL-006',
          name: 'Replacement Wheels Set',
          nameTh: 'ชุดล้อสำรอง',
          category: 'Parts',
          currentStock: 18,
          minStock: 40,
          maxStock: 120,
          stockPercentage: 15,
          lastRestocked: '2024-10-20',
          urgency: 'low',
          price: 180,
          supplier: 'WheelTech Co.'
        }
      ])
      setLoading(false)
    }, 500)
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return '🚨'
      case 'warning':
        return '⚠️'
      case 'low':
        return 'ℹ️'
      default:
        return '📊'
    }
  }

  const filteredProducts = products
    .filter(product => {
      if (filterUrgency !== 'all' && product.urgency !== filterUrgency) return false
      if (filterCategory !== 'all' && product.category !== filterCategory) return false
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !product.sku.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'urgency') {
        const urgencyOrder = { critical: 0, warning: 1, low: 2 }
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      } else if (sortBy === 'stock') {
        return a.stockPercentage - b.stockPercentage
      } else {
        return a.name.localeCompare(b.name)
      }
    })

  const categories = [...new Set(products.map(p => p.category))]
  const criticalCount = products.filter(p => p.urgency === 'critical').length
  const warningCount = products.filter(p => p.urgency === 'warning').length
  const lowCount = products.filter(p => p.urgency === 'low').length

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Low Stock Alerts</h1>
            <p className="text-gray-600 mt-1">Monitor products with low stock levels</p>
            <p className="text-sm text-gray-500">ตรวจสอบสินค้าที่มีสต็อกต่ำ</p>
          </div>
          <button
            onClick={() => router.push('/stock-in/new')}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Restock Products
          </button>
        </div>

        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Critical</p>
                <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
                <p className="text-xs text-gray-500 mt-1">&lt; 10% stock</p>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Warning</p>
                <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
                <p className="text-xs text-gray-500 mt-1">10-20% stock</p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low</p>
                <p className="text-3xl font-bold text-blue-600">{lowCount}</p>
                <p className="text-xs text-gray-500 mt-1">20-30% stock</p>
              </div>
              <div className="text-4xl">ℹ️</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Items</p>
                <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                <p className="text-xs text-gray-500 mt-1">Need attention</p>
              </div>
              <div className="text-4xl">📊</div>
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
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="select"
            >
              <option value="all">All Urgency Levels</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="low">Low</option>
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
              <option value="urgency">Sort by Urgency</option>
              <option value="stock">Sort by Stock %</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading low stock products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterUrgency !== 'all' || filterCategory !== 'all' 
                ? 'No Products Found' 
                : 'All Stock Levels Good!'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterUrgency !== 'all' || filterCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'All products have adequate stock levels'}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Urgency</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Min Stock</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Level</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getUrgencyIcon(product.urgency)}</span>
                          <span className={`badge ${getUrgencyColor(product.urgency)} capitalize`}>
                            {product.urgency}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.nameTh}</div>
                          <div className="text-xs text-gray-500">{product.sku}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-gray">{product.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${
                          product.urgency === 'critical' ? 'text-red-600' :
                          product.urgency === 'warning' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {product.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{product.minStock}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">{product.stockPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                product.urgency === 'critical' ? 'bg-red-500' :
                                product.urgency === 'warning' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(product.stockPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{product.supplier}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/stock-in/new?product=${product.id}`)}
                            className="btn-primary text-sm px-4 py-2"
                          >
                            Restock
                          </button>
                          <button
                            onClick={() => router.push(`/inventory/${product.id}`)}
                            className="btn-secondary text-sm px-4 py-2"
                          >
                            View
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

        {/* Quick Actions */}
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/stock-in/new')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <div className="text-2xl mb-2">📦</div>
              <div className="font-semibold text-gray-900 mb-1">Create Stock-In</div>
              <div className="text-sm text-gray-600">Add new inventory</div>
            </button>

            <button
              onClick={() => router.push('/stock-in/suppliers')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <div className="text-2xl mb-2">🏢</div>
              <div className="font-semibold text-gray-900 mb-1">Contact Suppliers</div>
              <div className="text-sm text-gray-600">Manage supplier info</div>
            </button>

            <button
              onClick={() => router.push('/inventory')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-gray-900 mb-1">View All Inventory</div>
              <div className="text-sm text-gray-600">Check full stock</div>
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
