'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [profitLoss, setProfitLoss] = useState<any>(null)
  const [cashFlow, setCashFlow] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [year, setYear] = useState(2025)
  const [month, setMonth] = useState<number | null>(1)

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  const loadReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const [plData, cfData] = await Promise.all([
        api.getProfitLossReport({ year, month: month || undefined }),
        api.getCashFlowReport({ year, month: month || undefined }),
      ])
      setProfitLoss(plData)
      setCashFlow(cfData)
    } catch (err: any) {
      setError(err.message || 'Failed to load reports')
      console.error('Reports error:', err)
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-96 bg-gray-200 rounded-2xl"></div>
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
            <button onClick={loadReports} className="mt-4 btn-primary">
              Try Again
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-gray-600 mt-1">Profit & Loss and Cash Flow statements</p>
            </div>
            <div className="flex gap-3">
              <select
                value={month || ''}
                onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
                className="select"
              >
                <option value="">All Year</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {new Date(2025, m - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="select"
              >
                {[2025, 2024, 2023].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profit & Loss Statement */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profit & Loss Statement</h2>
            <div className="space-y-4">
              {/* Revenue */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">REVENUE</div>
                <div className="space-y-2 pl-4">
                  <ReportRow label="Sales Revenue" value={profitLoss.revenue.sales} />
                  <ReportRow label="Other Income" value={profitLoss.revenue.other} />
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <ReportRow label="Total Revenue" value={profitLoss.revenue.total} bold color="text-green-600" />
                  </div>
                </div>
              </div>

              {/* Cost of Goods Sold */}
              <div className="pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">COST OF GOODS SOLD</div>
                <div className="space-y-2 pl-4">
                  <ReportRow label="Product Costs" value={profitLoss.costs.cogs} />
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <ReportRow label="Total COGS" value={profitLoss.costs.total} bold color="text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <ReportRow label="GROSS PROFIT" value={profitLoss.grossProfit} bold large color="text-blue-700" />
              </div>

              {/* Operating Expenses */}
              <div className="pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">OPERATING EXPENSES</div>
                <div className="space-y-2 pl-4">
                  <ReportRow label="Rent" value={profitLoss.expenses.rent} />
                  <ReportRow label="Utilities" value={profitLoss.expenses.utilities} />
                  <ReportRow label="Salaries" value={profitLoss.expenses.salaries} />
                  <ReportRow label="Marketing" value={profitLoss.expenses.marketing} />
                  <ReportRow label="Other" value={profitLoss.expenses.other} />
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <ReportRow label="Total Expenses" value={profitLoss.expenses.total} bold color="text-red-600" />
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                <ReportRow label="NET PROFIT" value={profitLoss.netProfit} bold large color="text-green-700" />
                <div className="text-sm text-gray-600 mt-2">
                  Profit Margin: <span className="font-semibold text-green-700">{profitLoss.profitMargin}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow Statement */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Cash Flow Statement</h2>
            <div className="space-y-4">
              {/* Opening Balance */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <ReportRow label="Opening Balance" value={cashFlow.openingBalance} bold color="text-gray-700" />
              </div>

              {/* Cash In */}
              <div className="pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">CASH IN</div>
                <div className="space-y-2 pl-4">
                  <ReportRow label="Sales" value={cashFlow.cashIn.sales} color="text-green-600" />
                  <ReportRow label="Other Income" value={cashFlow.cashIn.other} color="text-green-600" />
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <ReportRow label="Total Cash In" value={cashFlow.cashIn.total} bold color="text-green-600" />
                  </div>
                </div>
              </div>

              {/* Cash Out */}
              <div className="pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">CASH OUT</div>
                <div className="space-y-2 pl-4">
                  <ReportRow label="Expenses" value={cashFlow.cashOut.expenses} color="text-red-600" />
                  <ReportRow label="Purchases" value={cashFlow.cashOut.purchases} color="text-red-600" />
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <ReportRow label="Total Cash Out" value={cashFlow.cashOut.total} bold color="text-red-600" />
                  </div>
                </div>
              </div>

              {/* Net Cash Flow */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <ReportRow
                  label="Net Cash Flow"
                  value={cashFlow.netCashFlow}
                  bold
                  large
                  color={cashFlow.netCashFlow >= 0 ? 'text-blue-700' : 'text-red-700'}
                />
              </div>

              {/* Closing Balance */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border-2 border-indigo-200">
                <ReportRow label="CLOSING BALANCE" value={cashFlow.closingBalance} bold large color="text-indigo-700" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ReportRow({ label, value, bold, large, color = 'text-gray-900' }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${bold ? 'font-semibold' : ''} ${large ? 'text-lg' : 'text-sm'} text-gray-700`}>
        {label}
      </span>
      <span className={`${color} ${bold ? 'font-bold' : 'font-medium'} ${large ? 'text-2xl' : 'text-base'}`}>
        ฿{value.toLocaleString()}
      </span>
    </div>
  )
}

