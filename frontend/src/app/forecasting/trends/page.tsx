'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface MonthlyData {
  month: string
  sales: number
  revenue: number
  orders: number
}

interface ProductTrend {
  id: string
  sku: string
  name: string
  nameTh: string
  category: string
  currentMonthSales: number
  lastMonthSales: number
  threeMonthAvg: number
  growthRate: number
  trend: 'up' | 'down' | 'stable'
  seasonalPattern: 'high' | 'medium' | 'low'
}

export default function TrendsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'6months' | '12months' | '24months'>('12months')
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [productTrends, setProductTrends] = useState<ProductTrend[]>([])
  const [filterTrend, setFilterTrend] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTrendData()
  }, [timeRange])

  const loadTrendData = () => {
    setLoading(true)
    setTimeout(() => {
      // Generate monthly data
      const months = timeRange === '6months' ? 6 : timeRange === '12months' ? 12 : 24
      const monthlyData: MonthlyData[] = []

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const currentMonth = new Date().getMonth()

      for (let i = months - 1; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12
        const baseValue = 100 + Math.sin(monthIndex / 2) * 30
        const growth = (months - i) * 2
        const random = Math.random() * 20

        monthlyData.push({
          month: monthNames[monthIndex],
          sales: Math.round(baseValue + growth + random),
          revenue: Math.round((baseValue + growth + random) * 1200),
          orders: Math.round((baseValue + growth + random) * 0.8)
        })
      }

      setMonthlyData(monthlyData)

      // Generate product trends
      const products: ProductTrend[] = [
        {
          id: '1',
          sku: 'VAC-PRO-001',
          name: 'ProClean X500 Robot',
          nameTh: 'หุ่นยนต์ดูดฝุ่น ProClean X500',
          category: 'Vacuum Cleaners',
          currentMonthSales: 52,
          lastMonthSales: 45,
          threeMonthAvg: 46,
          growthRate: 15.6,
          trend: 'up',
          seasonalPattern: 'high'
        },
        {
          id: '2',
          sku: 'VAC-FILTER-001',
          name: 'HEPA Filter H13',
          nameTh: 'ฟิลเตอร์ HEPA H13',
          category: 'Filters',
          currentMonthSales: 165,
          lastMonthSales: 158,
          threeMonthAvg: 160,
          growthRate: 4.4,
          trend: 'up',
          seasonalPattern: 'high'
        },
        {
          id: '3',
          sku: 'VAC-BAT-002',
          name: 'Lithium Battery 2500mAh',
          nameTh: 'แบตเตอรี่ลิเธียม 2500mAh',
          category: 'Batteries',
          currentMonthSales: 78,
          lastMonthSales: 85,
          threeMonthAvg: 82,
          growthRate: -8.2,
          trend: 'down',
          seasonalPattern: 'medium'
        },
        {
          id: '4',
          sku: 'VAC-BRUSH-003',
          name: 'Rotating Brush Head',
          nameTh: 'หัวแปรงหมุน',
          category: 'Brushes',
          currentMonthSales: 122,
          lastMonthSales: 118,
          threeMonthAvg: 120,
          growthRate: 3.4,
          trend: 'stable',
          seasonalPattern: 'high'
        },
        {
          id: '5',
          sku: 'VAC-HOSE-005',
          name: 'Flexible Hose 2m',
          nameTh: 'ท่อยืดหยุ่น 2 เมตร',
          category: 'Parts',
          currentMonthSales: 185,
          lastMonthSales: 175,
          threeMonthAvg: 180,
          growthRate: 5.7,
          trend: 'up',
          seasonalPattern: 'medium'
        },
        {
          id: '6',
          sku: 'VAC-MOTOR-004',
          name: 'DC Motor 1000W',
          nameTh: 'มอเตอร์ DC 1000W',
          category: 'Motors',
          currentMonthSales: 28,
          lastMonthSales: 32,
          threeMonthAvg: 30,
          growthRate: -12.5,
          trend: 'down',
          seasonalPattern: 'low'
        },
        {
          id: '7',
          sku: 'VAC-CHARGER-008',
          name: 'Fast Charger 3A',
          nameTh: 'ที่ชาร์จเร็ว 3A',
          category: 'Accessories',
          currentMonthSales: 92,
          lastMonthSales: 90,
          threeMonthAvg: 91,
          growthRate: 2.2,
          trend: 'stable',
          seasonalPattern: 'medium'
        },
        {
          id: '8',
          sku: 'VAC-SENSOR-007',
          name: 'Dust Sensor Module',
          nameTh: 'โมดูลเซ็นเซอร์ฝุ่น',
          category: 'Electronics',
          currentMonthSales: 45,
          lastMonthSales: 38,
          threeMonthAvg: 42,
          growthRate: 18.4,
          trend: 'up',
          seasonalPattern: 'medium'
        }
      ]

      setProductTrends(products)
      setLoading(false)
    }, 500)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
      default: return '📊'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'stable': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getSeasonalColor = (pattern: string) => {
    switch (pattern) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const filteredProducts = productTrends.filter(product => {
    if (filterTrend !== 'all' && product.trend !== filterTrend) return false
    if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !product.sku.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  }).sort((a, b) => Math.abs(b.growthRate) - Math.abs(a.growthRate))

  const totalSales = monthlyData.reduce((sum, m) => sum + m.sales, 0)
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0)
  const avgMonthlySales = monthlyData.length > 0 ? totalSales / monthlyData.length : 0

  const recentMonths = monthlyData.slice(-3)
  const olderMonths = monthlyData.slice(-6, -3)
  const recentAvg = recentMonths.reduce((sum, m) => sum + m.sales, 0) / Math.max(recentMonths.length, 1)
  const olderAvg = olderMonths.reduce((sum, m) => sum + m.sales, 0) / Math.max(olderMonths.length, 1)
  const overallGrowth = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0

  const maxSales = Math.max(...monthlyData.map(m => m.sales))
  const upTrendCount = productTrends.filter(p => p.trend === 'up').length
  const downTrendCount = productTrends.filter(p => p.trend === 'down').length
  const stableTrendCount = productTrends.filter(p => p.trend === 'stable').length

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trend Analysis</h1>
            <p className="text-gray-600 mt-1">Analyze sales trends and seasonal patterns</p>
            <p className="text-sm text-gray-500">วิเคราะห์แนวโน้มการขายและรูปแบบตามฤดูกาล</p>
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

        {/* Time Range Selector */}
        <div className="card p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('6months')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === '6months'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setTimeRange('12months')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === '12months'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              12 Months
            </button>
            <button
              onClick={() => setTimeRange('24months')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === '24months'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              24 Months
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Sales</p>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalSales.toLocaleString()}</p>
            <p className="text-xs text-gray-600 mt-1">{timeRange === '6months' ? '6' : timeRange === '12months' ? '12' : '24'} months period</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Avg Monthly Sales</p>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{avgMonthlySales.toFixed(0)}</p>
            <p className="text-xs text-gray-600 mt-1">units per month</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Growth Rate</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                overallGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-5 h-5 ${overallGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className={`text-3xl font-bold ${overallGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallGrowth >= 0 ? '+' : ''}{overallGrowth.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600 mt-1">last 3 months vs previous</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">฿{(totalRevenue / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-gray-600 mt-1">{timeRange === '6months' ? '6' : timeRange === '12months' ? '12' : '24'} months period</p>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Sales Trend</h3>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyData.map((month, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-gray-700">{month.month}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end px-3 transition-all duration-500"
                          style={{ width: `${(month.sales / maxSales) * 100}%` }}
                        >
                          <span className="text-white text-sm font-semibold">
                            {month.sales} units
                          </span>
                        </div>
                      </div>
                      <div className="w-28 text-sm text-gray-600">
                        ฿{(month.revenue / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trend Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Growing</p>
                <p className="text-3xl font-bold text-green-600">{upTrendCount}</p>
                <p className="text-xs text-gray-500 mt-1">products trending up</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Declining</p>
                <p className="text-3xl font-bold text-red-600">{downTrendCount}</p>
                <p className="text-xs text-gray-500 mt-1">products trending down</p>
              </div>
              <div className="text-4xl">📉</div>
            </div>
          </div>

          <div className="card p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Stable</p>
                <p className="text-3xl font-bold text-gray-600">{stableTrendCount}</p>
                <p className="text-xs text-gray-500 mt-1">products stable</p>
              </div>
              <div className="text-4xl">➡️</div>
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
                placeholder="Search products..."
                className="input pl-10"
              />
            </div>

            <select
              value={filterTrend}
              onChange={(e) => setFilterTrend(e.target.value)}
              className="select"
            >
              <option value="all">All Trends</option>
              <option value="up">Growing</option>
              <option value="down">Declining</option>
              <option value="stable">Stable</option>
            </select>
          </div>
        </div>

        {/* Product Trends Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading trend analysis...</p>
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
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Product Performance Trends</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trend</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Month</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Month</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">3-Month Avg</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Growth Rate</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Seasonal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getTrendIcon(product.trend)}</span>
                          <span className={`font-semibold ${getTrendColor(product.trend)} capitalize`}>
                            {product.trend}
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
                        <span className="text-lg font-bold text-blue-600">{product.currentMonthSales}</span>
                        <div className="text-xs text-gray-500">units</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700 font-semibold">{product.lastMonthSales}</span>
                        <div className="text-xs text-gray-500">units</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{product.threeMonthAvg.toFixed(0)}</span>
                        <div className="text-xs text-gray-500">units</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            product.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {product.growthRate >= 0 ? '+' : ''}{product.growthRate.toFixed(1)}%
                          </span>
                          <div className="flex-1 min-w-[80px]">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  product.growthRate >= 0 ? 'bg-green-500' : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.min(Math.abs(product.growthRate) * 3, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${getSeasonalColor(product.seasonalPattern)} capitalize`}>
                          {product.seasonalPattern}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights Card */}
        <div className="mt-8 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Top Performers</h4>
              <div className="space-y-2">
                {productTrends
                  .filter(p => p.growthRate > 0)
                  .sort((a, b) => b.growthRate - a.growthRate)
                  .slice(0, 3)
                  .map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-600">{product.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">+{product.growthRate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">{product.currentMonthSales} units</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Need Attention</h4>
              <div className="space-y-2">
                {productTrends
                  .filter(p => p.growthRate < 0)
                  .sort((a, b) => a.growthRate - b.growthRate)
                  .slice(0, 3)
                  .map((product, index) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-600">{product.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">{product.growthRate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">{product.currentMonthSales} units</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
