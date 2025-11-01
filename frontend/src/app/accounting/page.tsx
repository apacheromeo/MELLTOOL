'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

export default function AccountingPage() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getAccountingOverview()
      setOverview(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load accounting data')
      console.error('Accounting error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="card p-6 border-l-4 border-red-500 bg-red-50">
            <p className="text-red-900 font-medium">{error}</p>
            <button onClick={loadData} className="mt-4 btn-primary">
              Try Again
            </button>
          </div>
        </main>
      </div>
    )
  }

  const { overview: stats, expensesByCategory, recentExpenses } = overview

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Accounting & Finance</h1>
              <p className="text-gray-600 mt-1">Financial overview and expense management</p>
            </div>
            <div className="flex gap-3">
              <Link href="/accounting/expenses" className="btn-secondary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Expenses
              </Link>
              <Link href="/accounting/reports" className="btn-secondary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Reports
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={`฿${stats.totalRevenue.toLocaleString()}`}
            icon="💰"
            color="green"
            trend="+12.5%"
          />
          <MetricCard
            title="Total Expenses"
            value={`฿${stats.totalExpenses.toLocaleString()}`}
            icon="💸"
            color="red"
            trend={`${stats.expenseCount} items`}
          />
          <MetricCard
            title="Net Profit"
            value={`฿${stats.netProfit.toLocaleString()}`}
            icon="📈"
            color="blue"
            trend={`${stats.profitMargin}% margin`}
          />
          <MetricCard
            title="Pending Expenses"
            value={stats.pendingExpenses}
            icon="⏳"
            color="yellow"
            trend="Needs approval"
          />
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Financial Summary</h2>
            <div className="space-y-4">
              <SummaryRow label="Revenue" value={stats.totalRevenue} color="text-green-600" />
              <SummaryRow label="Cost of Goods" value={stats.totalCost} color="text-orange-600" />
              <div className="border-t border-gray-200 pt-4">
                <SummaryRow label="Gross Profit" value={stats.grossProfit} color="text-blue-600" bold />
              </div>
              <SummaryRow label="Operating Expenses" value={stats.totalExpenses} color="text-red-600" />
              <div className="border-t-2 border-gray-300 pt-4">
                <SummaryRow label="Net Profit" value={stats.netProfit} color="text-green-700" bold large />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Expenses by Category</h2>
            <div className="space-y-3">
              {expensesByCategory
                .filter((item: any) => item.total > 0)
                .sort((a: any, b: any) => b.total - a.total)
                .slice(0, 6)
                .map((item: any) => (
                  <div key={item.category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${item.category.color}20` }}
                      >
                        {item.category.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.category.name}</div>
                        <div className="text-xs text-gray-600">{item.category.nameTh}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">฿{item.total.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">{item.count} items</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
            <Link href="/accounting/expenses" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentExpenses.map((expense: any) => (
              <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">{expense.title}</div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      {expense.category.icon} {expense.category.name}
                    </span>
                    <span>•</span>
                    <span>{expense.vendor}</span>
                    <span>•</span>
                    <span>{new Date(expense.expenseDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-gray-900 text-lg">฿{expense.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">{expense.paymentMethod.name}</div>
                  </div>
                  <span className={`badge ${
                    expense.status === 'PAID' ? 'badge-green' :
                    expense.status === 'APPROVED' ? 'badge-blue' :
                    expense.status === 'PENDING' ? 'badge-yellow' :
                    'badge-red'
                  }`}>
                    {expense.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function MetricCard({ title, value, icon, color, trend }: any) {
  const colorClasses: Record<string, string> = {
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-rose-600',
    blue: 'from-blue-500 to-indigo-600',
    yellow: 'from-yellow-500 to-orange-500',
  }

  return (
    <div className="card p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl shadow-lg`}>
          {icon}
        </div>
        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{trend}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  )
}

function SummaryRow({ label, value, color, bold, large }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${bold ? 'font-semibold' : ''} ${large ? 'text-lg' : 'text-sm'} text-gray-700`}>
        {label}
      </span>
      <span className={`${color} ${bold ? 'font-bold' : 'font-semibold'} ${large ? 'text-2xl' : 'text-base'}`}>
        ฿{value.toLocaleString()}
      </span>
    </div>
  )
}



