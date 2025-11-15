'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface ABCProduct {
  id: string
  sku: string
  name: string
  nameTh: string
  category: string
  annualRevenue: number
  annualSales: number
  unitPrice: number
  revenueContribution: number
  cumulativeContribution: number
  abcClass: 'A' | 'B' | 'C'
  profitMargin: number
}

export default function ABCAnalysisPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ABCProduct[]>([])
  const [filterClass, setFilterClass] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadABCAnalysis()
  }, [])

  const loadABCAnalysis = () => {
    setLoading(true)
    setTimeout(() => {
      // Generate products with revenue data
      const baseProducts = [
        { id: '1', sku: 'VAC-PRO-001', name: 'ProClean X500 Robot', nameTh: 'หุ่นยนต์ดูดฝุ่น ProClean X500', category: 'Vacuum Cleaners', annualSales: 450, unitPrice: 15000, profitMargin: 35 },
        { id: '2', sku: 'VAC-PRO-002', name: 'SmartVac 3000', nameTh: 'SmartVac 3000', category: 'Vacuum Cleaners', annualSales: 380, unitPrice: 12000, profitMargin: 32 },
        { id: '3', sku: 'VAC-FILTER-001', name: 'HEPA Filter H13', nameTh: 'ฟิลเตอร์ HEPA H13', category: 'Filters', annualSales: 1825, unitPrice: 450, profitMargin: 45 },
        { id: '4', sku: 'VAC-BAT-002', name: 'Lithium Battery 2500mAh', nameTh: 'แบตเตอรี่ลิเธียม 2500mAh', category: 'Batteries', annualSales: 920, unitPrice: 1200, profitMargin: 38 },
        { id: '5', sku: 'VAC-BRUSH-003', name: 'Rotating Brush Head', nameTh: 'หัวแปรงหมุน', category: 'Brushes', annualSales: 1460, unitPrice: 350, profitMargin: 42 },
        { id: '6', sku: 'VAC-MOTOR-004', name: 'DC Motor 1000W', nameTh: 'มอเตอร์ DC 1000W', category: 'Motors', annualSales: 365, unitPrice: 2500, profitMargin: 28 },
        { id: '7', sku: 'VAC-HOSE-005', name: 'Flexible Hose 2m', nameTh: 'ท่อยืดหยุ่น 2 เมตร', category: 'Parts', annualSales: 2190, unitPrice: 280, profitMargin: 48 },
        { id: '8', sku: 'VAC-WHEEL-006', name: 'Replacement Wheels Set', nameTh: 'ชุดล้อสำรอง', category: 'Parts', annualSales: 730, unitPrice: 180, profitMargin: 50 },
        { id: '9', sku: 'VAC-SENSOR-007', name: 'Dust Sensor Module', nameTh: 'โมดูลเซ็นเซอร์ฝุ่น', category: 'Electronics', annualSales: 548, unitPrice: 850, profitMargin: 30 },
        { id: '10', sku: 'VAC-CHARGER-008', name: 'Fast Charger 3A', nameTh: 'ที่ชาร์จเร็ว 3A', category: 'Accessories', annualSales: 1095, unitPrice: 320, profitMargin: 40 },
        { id: '11', sku: 'VAC-BASIC-003', name: 'BasicClean 100', nameTh: 'BasicClean 100', category: 'Vacuum Cleaners', annualSales: 290, unitPrice: 4500, profitMargin: 25 },
        { id: '12', sku: 'VAC-CORD-009', name: 'Power Cord 3m', nameTh: 'สายไฟ 3 เมตร', category: 'Accessories', annualSales: 876, unitPrice: 120, profitMargin: 52 },
        { id: '13', sku: 'VAC-DUST-010', name: 'Dustbin Container', nameTh: 'ถังเก็บฝุ่น', category: 'Parts', annualSales: 657, unitPrice: 250, profitMargin: 46 },
        { id: '14', sku: 'VAC-REMOTE-011', name: 'Remote Control', nameTh: 'รีโมทคอนโทรล', category: 'Accessories', annualSales: 438, unitPrice: 180, profitMargin: 44 },
        { id: '15', sku: 'VAC-STAND-012', name: 'Charging Stand', nameTh: 'แท่นชาร์จ', category: 'Accessories', annualSales: 584, unitPrice: 280, profitMargin: 38 }
      ]

      // Calculate revenue and sort by revenue (descending)
      let productsWithRevenue = baseProducts.map(p => ({
        ...p,
        annualRevenue: p.annualSales * p.unitPrice
      })).sort((a, b) => b.annualRevenue - a.annualRevenue)

      // Calculate total revenue
      const totalRevenue = productsWithRevenue.reduce((sum, p) => sum + p.annualRevenue, 0)

      // Calculate cumulative contribution and assign ABC class
      let cumulativeRevenue = 0
      const productsWithABC: ABCProduct[] = productsWithRevenue.map((p, index) => {
        cumulativeRevenue += p.annualRevenue
        const revenueContribution = (p.annualRevenue / totalRevenue) * 100
        const cumulativeContribution = (cumulativeRevenue / totalRevenue) * 100

        // ABC Classification:
        // A: Top items contributing to 70% of revenue
        // B: Next items contributing to next 20% (70-90%)
        // C: Remaining items (90-100%)
        let abcClass: 'A' | 'B' | 'C'
        if (cumulativeContribution <= 70) {
          abcClass = 'A'
        } else if (cumulativeContribution <= 90) {
          abcClass = 'B'
        } else {
          abcClass = 'C'
        }

        return {
          ...p,
          revenueContribution,
          cumulativeContribution,
          abcClass
        }
      })

      setProducts(productsWithABC)
      setLoading(false)
    }, 500)
  }

  const getClassColor = (abcClass: string) => {
    switch (abcClass) {
      case 'A':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'B':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'C':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getClassIcon = (abcClass: string) => {
    switch (abcClass) {
      case 'A':
        return '⭐'
      case 'B':
        return '🔶'
      case 'C':
        return '🔹'
      default:
        return '📊'
    }
  }

  const filteredProducts = products.filter(product => {
    if (filterClass !== 'all' && product.abcClass !== filterClass) return false
    if (filterCategory !== 'all' && product.category !== filterCategory) return false
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !product.sku.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const categories = [...new Set(products.map(p => p.category))]
  const classAProducts = products.filter(p => p.abcClass === 'A')
  const classBProducts = products.filter(p => p.abcClass === 'B')
  const classCProducts = products.filter(p => p.abcClass === 'C')

  const classARevenue = classAProducts.reduce((sum, p) => sum + p.annualRevenue, 0)
  const classBRevenue = classBProducts.reduce((sum, p) => sum + p.annualRevenue, 0)
  const classCRevenue = classCProducts.reduce((sum, p) => sum + p.annualRevenue, 0)
  const totalRevenue = classARevenue + classBRevenue + classCRevenue

  const classAPercent = totalRevenue > 0 ? (classARevenue / totalRevenue) * 100 : 0
  const classBPercent = totalRevenue > 0 ? (classBRevenue / totalRevenue) * 100 : 0
  const classCPercent = totalRevenue > 0 ? (classCRevenue / totalRevenue) * 100 : 0

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ABC Analysis</h1>
            <p className="text-gray-600 mt-1">Classify products by value and importance</p>
            <p className="text-sm text-gray-500">จัดหมวดหมู่สินค้าตามมูลค่าและความสำคัญ</p>
          </div>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Class A Products</p>
                <p className="text-xs text-gray-500">Top 20% - 70% Revenue</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-2">{classAProducts.length}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-semibold text-gray-900">฿{(classARevenue / 1000).toFixed(0)}K</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${classAPercent}%` }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{classAPercent.toFixed(1)}% of total revenue</p>
          </div>

          <div className="card p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Class B Products</p>
                <p className="text-xs text-gray-500">Next 30% - 20% Revenue</p>
              </div>
              <div className="text-4xl">🔶</div>
            </div>
            <p className="text-3xl font-bold text-yellow-600 mb-2">{classBProducts.length}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-semibold text-gray-900">฿{(classBRevenue / 1000).toFixed(0)}K</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${classBPercent}%` }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{classBPercent.toFixed(1)}% of total revenue</p>
          </div>

          <div className="card p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Class C Products</p>
                <p className="text-xs text-gray-500">Bottom 50% - 10% Revenue</p>
              </div>
              <div className="text-4xl">🔹</div>
            </div>
            <p className="text-3xl font-bold text-gray-600 mb-2">{classCProducts.length}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Revenue:</span>
              <span className="font-semibold text-gray-900">฿{(classCRevenue / 1000).toFixed(0)}K</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${classCPercent}%` }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">{classCPercent.toFixed(1)}% of total revenue</p>
          </div>

          <div className="card p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-xs text-gray-500">Annual</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
            <p className="text-2xl font-bold text-blue-600 mb-2">฿{(totalRevenue / 1000000).toFixed(2)}M</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Products:</span>
              <span className="font-semibold text-gray-900">{products.length}</span>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Avg: ฿{products.length > 0 ? (totalRevenue / products.length / 1000).toFixed(0) : 0}K/product
            </div>
          </div>
        </div>

        {/* Distribution Visualization */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">ABC Distribution</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart Representation */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                  {/* Class A - Green */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="40"
                    strokeDasharray={`${classAPercent * 5.027} 502.7`}
                    className="transition-all duration-500"
                  />
                  {/* Class B - Yellow */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="40"
                    strokeDasharray={`${classBPercent * 5.027} 502.7`}
                    strokeDashoffset={`-${classAPercent * 5.027}`}
                    className="transition-all duration-500"
                  />
                  {/* Class C - Gray */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="40"
                    strokeDasharray={`${classCPercent * 5.027} 502.7`}
                    strokeDashoffset={`-${(classAPercent + classBPercent) * 5.027}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{products.length}</div>
                    <div className="text-sm text-gray-600">Products</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2 w-full max-w-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-sm text-gray-700">Class A</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{classAPercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500"></div>
                    <span className="text-sm text-gray-700">Class B</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{classBPercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-500"></div>
                    <span className="text-sm text-gray-700">Class C</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{classCPercent.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Class A - High Priority</h4>
                    <p className="text-sm text-green-800 mb-2">
                      {classAProducts.length} products generating {classAPercent.toFixed(0)}% of revenue
                    </p>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Maintain high stock levels</li>
                      <li>• Monitor daily or weekly</li>
                      <li>• Strong supplier relationships</li>
                      <li>• Premium customer service</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔶</span>
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Class B - Medium Priority</h4>
                    <p className="text-sm text-yellow-800 mb-2">
                      {classBProducts.length} products generating {classBPercent.toFixed(0)}% of revenue
                    </p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Moderate stock levels</li>
                      <li>• Monitor monthly</li>
                      <li>• Standard reorder processes</li>
                      <li>• Regular review for promotion</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔹</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Class C - Low Priority</h4>
                    <p className="text-sm text-gray-800 mb-2">
                      {classCProducts.length} products generating {classCPercent.toFixed(0)}% of revenue
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Minimal stock levels</li>
                      <li>• Monitor quarterly</li>
                      <li>• Consider discontinuation</li>
                      <li>• Low inventory investment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="select"
            >
              <option value="all">All Classes</option>
              <option value="A">Class A</option>
              <option value="B">Class B</option>
              <option value="C">Class C</option>
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
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading ABC analysis...</p>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Annual Sales</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Annual Revenue</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue %</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cumulative %</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getClassIcon(product.abcClass)}</span>
                          <span className={`badge ${getClassColor(product.abcClass)} text-sm font-bold`}>
                            {product.abcClass}
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
                        <span className="text-gray-900 font-semibold">{product.annualSales.toLocaleString()}</span>
                        <div className="text-xs text-gray-500">units/year</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">฿{product.unitPrice.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-blue-600">
                          ฿{(product.annualRevenue / 1000).toFixed(0)}K
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-[60px]">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  product.abcClass === 'A' ? 'bg-green-500' :
                                  product.abcClass === 'B' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`}
                                style={{ width: `${Math.min(product.revenueContribution * 5, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {product.revenueContribution.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-blue">
                          {product.cumulativeContribution.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-green">
                          {product.profitMargin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
