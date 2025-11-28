'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
              <p className="text-gray-600 mt-1">View past sales and daily reports</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => window.location.href = '/sales'}
                className="btn-primary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to POS
              </button>
            </div>
          </div>
        </div>

        {/* Daily Report Summary */}
        {dailyReport && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="text-sm text-gray-600 mb-1">Today&apos;s Orders</div>
              <div className="text-3xl font-bold text-gray-900">{dailyReport.totalOrders}</div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
              <div className="text-3xl font-bold text-green-600">
                ฿{dailyReport.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-gray-600 mb-1">Total Profit</div>
              <div className="text-3xl font-bold text-blue-600">
                ฿{dailyReport.totalProfit.toLocaleString()}
              </div>
            </div>
            <div className="card p-6">
              <div className="text-sm text-gray-600 mb-1">Items Sold</div>
              <div className="text-3xl font-bold text-purple-600">{dailyReport.totalItemsSold}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {['ALL', 'DRAFT', 'CONFIRMED', 'CANCELED', 'RETURNED'].map((status) => (
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
          <div className="card p-4 border-l-4 border-red-500 bg-red-50 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-900">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="card p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading sales history...</p>
          </div>
        )}

        {/* Orders List */}
        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card p-6 card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                      <span className={`badge ${
                        order.status === 'CONFIRMED' ? 'badge-green' :
                        order.status === 'DRAFT' ? 'badge-yellow' :
                        order.status === 'RETURNED' ? 'badge-blue' :
                        'badge-red'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Staff:</span>
                        <span className="ml-2 font-medium">{order.staff?.name || 'Unknown'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Items:</span>
                        <span className="ml-2 font-medium">{order._count?.items || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="ml-2 font-medium">฿{order.totalPrice?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Profit:</span>
                        <span className="ml-2 font-medium text-green-600">฿{order.profit?.toLocaleString()}</span>
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
                      className="btn-primary"
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
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sales found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'ALL' ? 'No sales have been made yet' : `No ${filter.toLowerCase()} orders found`}
            </p>
            <button
              onClick={() => window.location.href = '/sales'}
              className="btn-primary"
            >
              Start a New Sale
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

