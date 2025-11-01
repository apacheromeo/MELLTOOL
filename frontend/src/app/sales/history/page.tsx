'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Navigation from '@/components/Navigation'

export default function SalesHistoryPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('ALL')
  const [dailyReport, setDailyReport] = useState<any>(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [historyData, reportData] = await Promise.all([
        api.getSalesHistory({ 
          status: filter === 'ALL' ? undefined : filter,
          limit: 50 
        }),
        api.getDailySalesReport(),
      ])
      
      setOrders(historyData.orders || [])
      setDailyReport(reportData)
    } catch (err: any) {
      setError(err.message || 'Failed to load sales history')
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Sales History</h1>
              <p className="text-gray-600 mt-1">View past sales and daily reports</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => window.location.href = '/sales'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                ← Back to POS
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Daily Report Summary */}
        {dailyReport && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-gray-600 mb-1">Today&apos;s Orders</div>
              <div className="text-3xl font-bold text-gray-900">{dailyReport.totalOrders}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
              <div className="text-3xl font-bold text-green-600">
                ฿{dailyReport.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-gray-600 mb-1">Total Profit</div>
              <div className="text-3xl font-bold text-blue-600">
                ฿{dailyReport.totalProfit.toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-sm text-gray-600 mb-1">Items Sold</div>
              <div className="text-3xl font-bold text-purple-600">{dailyReport.totalItemsSold}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {['ALL', 'DRAFT', 'CONFIRMED', 'CANCELED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading sales history...</p>
          </div>
        )}

        {/* Orders List */}
        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        order.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        order.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Staff:</span>
                        <span className="ml-2 font-medium">{order.staff?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Items:</span>
                        <span className="ml-2 font-medium">{order._count?.items || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="ml-2 font-medium">฿{order.totalPrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Profit:</span>
                        <span className="ml-2 font-medium text-green-600">฿{order.profit.toLocaleString()}</span>
                      </div>
                    </div>

                    {order.customerName && (
                      <div className="mt-2 text-sm text-gray-600">
                        Customer: {order.customerName}
                        {order.customerPhone && ` • ${order.customerPhone}`}
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => window.location.href = `/sales/${order.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sales found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'ALL' ? 'No sales have been made yet' : `No ${filter.toLowerCase()} orders found`}
            </p>
            <button
              onClick={() => window.location.href = '/sales'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Start a New Sale
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

