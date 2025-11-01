'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface DailySales {
  date: string
  orders: number
  revenue: number
  profit: number
}

export default function SalesReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('week')
  const [dailySales, setDailySales] = useState<DailySales[]>([])

  useEffect(() => {
    loadReports()
  }, [dateRange])

  const loadReports = () => {
    setLoading(true)
    setTimeout(() => {
      setDailySales([
        { date: '2024-10-20', orders: 12, revenue: 15600, profit: 5200 },
        { date: '2024-10-21', orders: 15, revenue: 18900, profit: 6300 },
        { date: '2024-10-22', orders: 10, revenue: 12500, profit: 4100 },
        { date: '2024-10-23', orders: 18, revenue: 22400, profit: 7500 },
        { date: '2024-10-24', orders: 14, revenue: 17200, profit: 5700 },
        { date: '2024-10-25', orders: 16, revenue: 19800, profit: 6600 },
        { date: '2024-10-26', orders: 20, revenue: 24500, profit: 8200 }
      ])
      setLoading(false)
    }, 500)
  }

  const totalOrders = dailySales.reduce((sum, day) => sum + day.orders, 0)
  const totalRevenue = dailySales.reduce((sum, day) => sum + day.revenue, 0)
  const totalProfit = dailySales.reduce((sum, day) => sum + day.profit, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const maxRevenue = Math.max(...dailySales.map(d => d.revenue))

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Sales Reports</h1>
            <p className="text-gray-600 mt-1">View daily, weekly, and monthly sales reports</p>
            <p className="text-sm text-gray-500">ดูรายงานการขายรายวัน รายสัปดาห์ และรายเดือน</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
            <button className="btn-primary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="card p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange('week')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateRange === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateRange === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateRange === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Year
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Orders</p>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
            <p className="text-xs text-green-600 mt-1">↑ 12% vs last period</p>
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
            <p className="text-2xl font-bold text-gray-900">฿{(totalRevenue / 1000).toFixed(1)}K</p>
            <p className="text-xs text-green-600 mt-1">↑ 8% vs last period</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Profit</p>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">฿{(totalProfit / 1000).toFixed(1)}K</p>
            <p className="text-xs text-green-600 mt-1">↑ 15% vs last period</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Avg Order</p>
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">฿{avgOrderValue.toFixed(0)}</p>
            <p className="text-xs text-green-600 mt-1">↑ 5% vs last period</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Profit Margin</p>
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{profitMargin.toFixed(1)}%</p>
            <p className="text-xs text-green-600 mt-1">↑ 2% vs last period</p>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Revenue Trend</h3>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {dailySales.map((day, index) => (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600">{day.date}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end px-3 transition-all duration-500"
                          style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                        >
                          <span className="text-white text-sm font-semibold">
                            ฿{day.revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="w-20 text-sm text-gray-600">{day.orders} orders</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed Table */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dailySales.map((day) => {
                  const avgOrder = day.revenue / day.orders
                  const margin = (day.profit / day.revenue) * 100
                  return (
                    <tr key={day.date} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{day.date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-blue">{day.orders}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">฿{day.revenue.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-green-600">฿{day.profit.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">฿{avgOrder.toFixed(0)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-green">{margin.toFixed(1)}%</span>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-6 py-4 text-gray-900">Total</td>
                  <td className="px-6 py-4">
                    <span className="badge badge-blue">{totalOrders}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">฿{totalRevenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-green-600">฿{totalProfit.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-900">฿{avgOrderValue.toFixed(0)}</td>
                  <td className="px-6 py-4">
                    <span className="badge badge-green">{profitMargin.toFixed(1)}%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
