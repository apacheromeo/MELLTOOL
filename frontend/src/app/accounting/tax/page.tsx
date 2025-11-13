'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function TaxPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [taxData, setTaxData] = useState({
    salesRevenue: 0,
    vatCollected: 0,
    expenses: 0,
    vatPaid: 0,
    netVAT: 0,
  })

  useEffect(() => {
    fetchTaxData()
  }, [year, month])

  const fetchTaxData = async () => {
    try {
      setLoading(true)
      // Fetch profit/loss data to calculate VAT
      const report = await api.getProfitLossReport({ year, month })

      const VAT_RATE = 0.07 // 7% VAT in Thailand

      const salesRevenue = report.revenue.total
      const vatCollected = salesRevenue * VAT_RATE

      const expenses = report.expenses.total
      const vatPaid = expenses * VAT_RATE

      const netVAT = vatCollected - vatPaid

      setTaxData({
        salesRevenue,
        vatCollected,
        expenses,
        vatPaid,
        netVAT,
      })
    } catch (error: any) {
      console.error('Failed to fetch tax data:', error)
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('401')) {
        router.push('/login?redirect=/accounting/tax')
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tax report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tax Reports</h1>
        <p className="text-gray-600">รายงานภาษี - VAT 7%</p>
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
            onClick={fetchTaxData}
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* VAT Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">VAT Collected</p>
              <p className="text-sm text-gray-500">(ภาษีขาย)</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(taxData.vatCollected)}</p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">VAT Paid</p>
              <p className="text-sm text-gray-500">(ภาษีซื้อ)</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(taxData.vatPaid)}</p>
            </div>
            <div className="text-4xl">📉</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net VAT</p>
              <p className="text-sm text-gray-500">(ภาษีสุทธิ)</p>
              <p className={`text-2xl font-bold mt-2 ${taxData.netVAT >= 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                {formatCurrency(Math.abs(taxData.netVAT))}
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* VAT Report */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">VAT Report - {getMonthName(month)} {year}</h2>
          <p className="text-sm text-gray-600">รายงานภาษีมูลค่าเพิ่ม 7%</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Output VAT (Collected) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Output VAT - ภาษีขาย (Collected from Sales)</h3>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Sales Revenue</span>
                  <span className="font-medium">{formatCurrency(taxData.salesRevenue)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-semibold pt-2 border-t border-green-200">
                  <span>VAT @ 7%</span>
                  <span>{formatCurrency(taxData.vatCollected)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Input VAT (Paid) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Input VAT - ภาษีซื้อ (Paid on Expenses)</h3>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Expenses</span>
                  <span className="font-medium">{formatCurrency(taxData.expenses)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-semibold pt-2 border-t border-red-200">
                  <span>VAT @ 7%</span>
                  <span>({formatCurrency(taxData.vatPaid)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net VAT Payable/Refundable */}
          <div className={`p-6 rounded-lg border-2 ${taxData.netVAT >= 0 ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">
                  {taxData.netVAT >= 0 ? 'Net VAT Payable' : 'Net VAT Refundable'}
                </h3>
                <p className="text-sm text-gray-600">
                  {taxData.netVAT >= 0 ? 'ภาษีที่ต้องนำส่ง' : 'ภาษีที่ขอคืน'}
                </p>
              </div>
              <div className={`text-3xl font-bold ${taxData.netVAT >= 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                {formatCurrency(Math.abs(taxData.netVAT))}
              </div>
            </div>

            <div className="text-sm space-y-1 border-t pt-4">
              <div className="flex justify-between">
                <span>VAT Collected:</span>
                <span className="text-green-600">+{formatCurrency(taxData.vatCollected)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT Paid:</span>
                <span className="text-red-600">-{formatCurrency(taxData.vatPaid)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t">
                <span>Net:</span>
                <span className={taxData.netVAT >= 0 ? 'text-orange-600' : 'text-blue-600'}>
                  {formatCurrency(taxData.netVAT)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-800 space-y-2">
          <li>• This is a simplified VAT calculation at 7% based on your revenue and expenses</li>
          <li>• Actual VAT may differ based on specific tax rules and exemptions</li>
          <li>• Please consult with a tax professional for accurate filing</li>
          <li>• VAT returns must be filed monthly with the Revenue Department (กรมสรรพากร)</li>
          <li>• Keep all tax invoices (ใบกำกับภาษี) for documentation</li>
        </ul>
      </div>
    </div>
  )
}
