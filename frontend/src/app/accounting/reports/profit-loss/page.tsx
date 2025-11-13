'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

interface ProfitLossData {
  period: {
    year: number
    month: number
    startDate: string
    endDate: string
  }
  revenue: {
    sales: number
    other: number
    total: number
  }
  costs: {
    cogs: number
    total: number
  }
  grossProfit: number
  expenses: {
    rent: number
    utilities: number
    salaries: number
    marketing: number
    other: number
    total: number
  }
  netProfit: number
  profitMargin: string
}

export default function ProfitLossPage() {
  const router = useRouter()
  const [data, setData] = useState<ProfitLossData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchData()
  }, [year, month])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.getProfitLossReport({ year, month })
      setData(response)
    } catch (error: any) {
      console.error('Failed to fetch profit & loss report:', error)
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('401')) {
        router.push('/login?redirect=/accounting/reports/profit-loss')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount)
  }

  const getMonthName = (m: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[m - 1]
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-0 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Statement</h1>
        <p className="text-gray-600">งบกำไรขาดทุน</p>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{getMonthName(m)}</option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchData}
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {data && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">
              {getMonthName(data.period.month)} {data.period.year}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Revenue Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Revenue (รายได้)</h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between">
                  <span className="text-gray-700">Sales</span>
                  <span className="font-medium">{formatCurrency(data.revenue.sales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Other Income</span>
                  <span className="font-medium">{formatCurrency(data.revenue.other)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Total Revenue</span>
                  <span>{formatCurrency(data.revenue.total)}</span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost of Goods Sold (ต้นทุนขาย)</h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between font-semibold">
                  <span>Total COGS</span>
                  <span className="text-red-600">({formatCurrency(data.costs.cogs)})</span>
                </div>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span>Gross Profit (กำไรขั้นต้น)</span>
                <span className={data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(data.grossProfit)}
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Operating Expenses (ค่าใช้จ่าย)</h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between">
                  <span className="text-gray-700">Rent</span>
                  <span className="text-red-600">({formatCurrency(data.expenses.rent)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Utilities</span>
                  <span className="text-red-600">({formatCurrency(data.expenses.utilities)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Salaries</span>
                  <span className="text-red-600">({formatCurrency(data.expenses.salaries)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Marketing</span>
                  <span className="text-red-600">({formatCurrency(data.expenses.marketing)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Other</span>
                  <span className="text-red-600">({formatCurrency(data.expenses.other)})</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Total Expenses</span>
                  <span className="text-red-600">({formatCurrency(data.expenses.total)})</span>
                </div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-bold">Net Profit (กำไรสุทธิ)</div>
                  <div className="text-sm text-gray-600">Profit Margin: {data.profitMargin}%</div>
                </div>
                <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netProfit)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  )
}
