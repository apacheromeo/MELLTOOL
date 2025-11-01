'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getDashboardOverview()
      setOverview(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here&apos;s your inventory overview</p>
            </div>
            <button
              onClick={loadDashboard}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="stat-card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="card p-6 border-l-4 border-red-500 bg-red-50">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="metric-card border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {overview?.inventory?.totalProducts || 0}
                </div>
                <div className="text-sm text-gray-600">Total Products</div>
                <div className="text-xs text-green-600 mt-2">+12% from last month</div>
              </div>

              <div className="metric-card border-yellow-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {overview?.inventory?.lowStockCount || 0}
                </div>
                <div className="text-sm text-gray-600">Low Stock Items</div>
                <div className="text-xs text-yellow-600 mt-2">Needs attention</div>
              </div>

              <div className="metric-card border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ฿{(overview?.inventory?.totalValue || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
                <div className="text-xs text-green-600 mt-2">+8% from last month</div>
              </div>

              <div className="metric-card border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {overview?.inventory?.healthScore || 0}%
                </div>
                <div className="text-sm text-gray-600">Health Score</div>
                <div className="text-xs text-green-600 mt-2">Excellent</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Stock-Ins */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Stock-Ins</h2>
                {overview?.stockIns?.recent && overview.stockIns.recent.length > 0 ? (
                  <div className="space-y-3">
                    {overview.stockIns.recent.map((stockIn: any) => (
                      <div key={stockIn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div>
                          <div className="font-medium text-gray-900">{stockIn.reference}</div>
                          <div className="text-sm text-gray-600">
                            {stockIn._count?.items || 0} items • {stockIn.user?.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${
                            stockIn.status === 'RECEIVED' ? 'badge-green' :
                            stockIn.status === 'PENDING' ? 'badge-yellow' :
                            'badge-gray'
                          }`}>
                            {stockIn.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(stockIn.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>No recent stock-ins</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  <a href="/inventory/new" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center group">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Add Product</div>
                  </a>
                  <a href="/stock-in/new" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-center group">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <div className="text-sm font-medium text-gray-700 group-hover:text-green-600">Stock In</div>
                  </a>
                  <a href="/sales" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-center group">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className="text-sm font-medium text-gray-700 group-hover:text-purple-600">New Sale</div>
                  </a>
                  <a href="/forecasting" className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-center group">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div className="text-sm font-medium text-gray-700 group-hover:text-orange-600">AI Forecast</div>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
