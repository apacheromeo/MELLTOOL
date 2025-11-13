'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import Sidebar from '@/components/Sidebar'

interface CashFlowData {
  openingBalance: number
  cashIn: {
    sales: number
    other: number
    total: number
  }
  cashOut: {
    expenses: number
    purchases: number
    total: number
  }
  netCashFlow: number
  closingBalance: number
}

export default function CashFlowPage() {
  const router = useRouter()
  const [data, setData] = useState<CashFlowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchData()
  }, [year, month])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.getCashFlowReport({ year, month })
      setData(response)
    } catch (error: any) {
      console.error('Failed to fetch cash flow report:', error)
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('401')) {
        router.push('/login?redirect=/accounting/reports/cash-flow')
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
        <h1 className="text-3xl font-bold text-gray-900">Cash Flow Statement</h1>
        <p className="text-gray-600">งบกระแสเงินสด</p>
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
              {getMonthName(month)} {year}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Opening Balance */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Opening Balance (ยอดยกมา)</span>
                <span className="text-xl font-bold">{formatCurrency(data.openingBalance)}</span>
              </div>
            </div>

            {/* Cash Inflows */}
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-3">Cash Inflows (เงินสดรับ)</h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between">
                  <span className="text-gray-700">Sales Revenue</span>
                  <span className="text-green-600 font-medium">{formatCurrency(data.cashIn.sales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Other Income</span>
                  <span className="text-green-600 font-medium">{formatCurrency(data.cashIn.other)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Total Cash In</span>
                  <span className="text-green-600">{formatCurrency(data.cashIn.total)}</span>
                </div>
              </div>
            </div>

            {/* Cash Outflows */}
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-3">Cash Outflows (เงินสดจ่าย)</h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between">
                  <span className="text-gray-700">Operating Expenses</span>
                  <span className="text-red-600 font-medium">({formatCurrency(data.cashOut.expenses)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Inventory Purchases</span>
                  <span className="text-red-600 font-medium">({formatCurrency(data.cashOut.purchases)})</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Total Cash Out</span>
                  <span className="text-red-600">({formatCurrency(data.cashOut.total)})</span>
                </div>
              </div>
            </div>

            {/* Net Cash Flow */}
            <div className={`p-4 rounded-lg ${data.netCashFlow >= 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Net Cash Flow (กระแสเงินสดสุทธิ)</span>
                <span className={`text-2xl font-bold ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.netCashFlow)}
                </span>
              </div>
            </div>

            {/* Closing Balance */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Closing Balance (ยอดคงเหลือ)</span>
                <span className={`text-3xl font-bold ${data.closingBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(data.closingBalance)}
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Opening Balance: {formatCurrency(data.openingBalance)}</div>
                <div className="text-green-600">+ Cash In: {formatCurrency(data.cashIn.total)}</div>
                <div className="text-red-600">- Cash Out: {formatCurrency(data.cashOut.total)}</div>
                <div className="font-semibold text-gray-900 pt-1 border-t">
                  = Closing Balance: {formatCurrency(data.closingBalance)}
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
