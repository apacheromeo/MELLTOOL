'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface PromotionEvent {
  id: string
  name: string
  nameTh: string
  date: string
  multiplier: number
  icon: string
  color: string
}

interface CategoryForecast {
  category: string
  normalSales: number
  forecastSales: number
  stockNeeded: number
}

export default function PromotionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string>('1111')
  const [categoryForecasts, setCategoryForecasts] = useState<CategoryForecast[]>([])

  const promotionEvents: PromotionEvent[] = [
    {
      id: '1111',
      name: '11/11 Shopping Day',
      nameTh: '11/11 วันช้อปปิ้ง',
      date: '2024-11-11',
      multiplier: 3.5,
      icon: '🛍️',
      color: 'orange'
    },
    {
      id: 'blackfriday',
      name: 'Black Friday',
      nameTh: 'แบล็คฟรายเดย์',
      date: '2024-11-29',
      multiplier: 4.2,
      icon: '🏷️',
      color: 'gray'
    },
    {
      id: 'cybermonday',
      name: 'Cyber Monday',
      nameTh: 'ไซเบอร์มันเดย์',
      date: '2024-12-02',
      multiplier: 3.8,
      icon: '💻',
      color: 'blue'
    },
    {
      id: '1212',
      name: '12/12 Sale',
      nameTh: '12/12 เซล',
      date: '2024-12-12',
      multiplier: 3.2,
      icon: '🎁',
      color: 'red'
    },
    {
      id: 'newyear',
      name: 'New Year Sale',
      nameTh: 'เซลปีใหม่',
      date: '2025-01-01',
      multiplier: 2.8,
      icon: '🎊',
      color: 'purple'
    },
    {
      id: 'cny',
      name: 'Chinese New Year',
      nameTh: 'ตรุษจีน',
      date: '2025-01-29',
      multiplier: 3.0,
      icon: '🧧',
      color: 'yellow'
    }
  ]

  useEffect(() => {
    loadForecast()
  }, [selectedEvent])

  const loadForecast = () => {
    setLoading(true)
    setTimeout(() => {
      setCategoryForecasts([
        {
          category: 'Vacuum Cleaners',
          normalSales: 45,
          forecastSales: 0,
          stockNeeded: 0
        },
        {
          category: 'Filters & Parts',
          normalSales: 120,
          forecastSales: 0,
          stockNeeded: 0
        },
        {
          category: 'Batteries',
          normalSales: 80,
          forecastSales: 0,
          stockNeeded: 0
        },
        {
          category: 'Brushes & Accessories',
          normalSales: 95,
          forecastSales: 0,
          stockNeeded: 0
        },
        {
          category: 'Motors & Electronics',
          normalSales: 35,
          forecastSales: 0,
          stockNeeded: 0
        }
      ])
      setLoading(false)
    }, 500)
  }

  const currentEvent = promotionEvents.find(e => e.id === selectedEvent)!

  const forecastsWithCalculations = categoryForecasts.map(cat => ({
    ...cat,
    forecastSales: Math.round(cat.normalSales * currentEvent.multiplier),
    stockNeeded: Math.round(cat.normalSales * currentEvent.multiplier * 1.2) // 20% buffer
  }))

  const totalNormalSales = forecastsWithCalculations.reduce((sum, cat) => sum + cat.normalSales, 0)
  const totalForecastSales = forecastsWithCalculations.reduce((sum, cat) => sum + cat.forecastSales, 0)
  const totalStockNeeded = forecastsWithCalculations.reduce((sum, cat) => sum + cat.stockNeeded, 0)

  const avgPrice = 1250
  const forecastRevenue = totalForecastSales * avgPrice
  const normalRevenue = totalNormalSales * avgPrice
  const revenueIncrease = forecastRevenue - normalRevenue

  const maxForecast = Math.max(...forecastsWithCalculations.map(c => c.forecastSales))

  const daysUntilEvent = Math.ceil((new Date(currentEvent.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  const preparationTasks = [
    { task: 'Confirm stock levels', taskTh: 'ตรวจสอบสต็อก', deadline: 14, status: daysUntilEvent > 14 ? 'pending' : daysUntilEvent > 7 ? 'in-progress' : 'urgent' },
    { task: 'Order additional inventory', taskTh: 'สั่งสต็อกเพิ่ม', deadline: 10, status: daysUntilEvent > 10 ? 'pending' : daysUntilEvent > 5 ? 'in-progress' : 'urgent' },
    { task: 'Prepare marketing materials', taskTh: 'เตรียมสื่อการตลาด', deadline: 7, status: daysUntilEvent > 7 ? 'pending' : daysUntilEvent > 3 ? 'in-progress' : 'urgent' },
    { task: 'Train staff on promotions', taskTh: 'ฝึกอบรมพนักงาน', deadline: 5, status: daysUntilEvent > 5 ? 'pending' : daysUntilEvent > 2 ? 'in-progress' : 'urgent' },
    { task: 'Set up special displays', taskTh: 'จัดโชว์พิเศษ', deadline: 3, status: daysUntilEvent > 3 ? 'pending' : daysUntilEvent > 1 ? 'in-progress' : 'urgent' },
    { task: 'Final inventory check', taskTh: 'ตรวจสอบสต็อกครั้งสุดท้าย', deadline: 1, status: daysUntilEvent > 1 ? 'pending' : 'urgent' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getEventColor = (color: string) => {
    const colors: Record<string, string> = {
      orange: 'bg-orange-500',
      gray: 'bg-gray-800',
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500'
    }
    return colors[color] || 'bg-blue-500'
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Promotion Forecasts</h1>
            <p className="text-gray-600 mt-1">Predict demand for special events and sales</p>
            <p className="text-sm text-gray-500">พยากรณ์ความต้องการสำหรับกิจกรรมพิเศษ</p>
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

        {/* Event Selector */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Promotion Event</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {promotionEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event.id)}
                className={`p-4 rounded-lg border-2 transition ${
                  selectedEvent === event.id
                    ? `border-${event.color}-500 bg-${event.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">{event.icon}</div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{event.name}</div>
                <div className="text-xs text-gray-600 mb-2">{event.nameTh}</div>
                <div className="text-xs text-gray-500">{event.date}</div>
                <div className={`mt-2 text-xs font-bold px-2 py-1 rounded ${getEventColor(event.color)} text-white`}>
                  {event.multiplier}x Sales
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Expected Sales</p>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalForecastSales}</p>
            <p className="text-xs text-green-600 mt-1">↑ {((totalForecastSales / totalNormalSales - 1) * 100).toFixed(0)}% vs normal</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Forecast Revenue</p>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">฿{(forecastRevenue / 1000).toFixed(0)}K</p>
            <p className="text-xs text-green-600 mt-1">+฿{(revenueIncrease / 1000).toFixed(0)}K extra</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Stock Needed</p>
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalStockNeeded}</p>
            <p className="text-xs text-orange-600 mt-1">+20% safety buffer</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Days Until Event</p>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{daysUntilEvent}</p>
            <p className="text-xs text-gray-600 mt-1">{currentEvent.date}</p>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Sales Forecast</h3>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {forecastsWithCalculations.map((category, index) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-500">Normal: {category.normalSales}</span>
                      <span className="text-blue-600 font-semibold">Forecast: {category.forecastSales}</span>
                      <span className="text-orange-600">Stock: {category.stockNeeded}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end px-3 transition-all duration-500"
                        style={{ width: `${(category.forecastSales / maxForecast) * 100}%` }}
                      >
                        <span className="text-white text-sm font-semibold">
                          {category.forecastSales} units
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preparation Timeline */}
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Preparation Timeline</h3>
          <div className="space-y-3">
            {preparationTasks.map((task, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  task.status === 'urgent' ? 'border-red-300 bg-red-50' :
                  task.status === 'in-progress' ? 'border-yellow-300 bg-yellow-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex-shrink-0">
                  {task.status === 'urgent' ? (
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">!</div>
                  ) : task.status === 'in-progress' ? (
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white">○</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{task.task}</div>
                  <div className="text-sm text-gray-600">{task.taskTh}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    task.status === 'urgent' ? 'text-red-600' :
                    task.status === 'in-progress' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {task.deadline} days before
                  </div>
                  <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full border ${getStatusColor(task.status)}`}>
                    {task.status === 'urgent' ? 'Urgent' : task.status === 'in-progress' ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Table */}
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Category Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Normal Sales</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Multiplier</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Forecast Sales</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock Needed</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {forecastsWithCalculations.map((category) => {
                  const growth = ((category.forecastSales / category.normalSales - 1) * 100)
                  return (
                    <tr key={category.category} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{category.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{category.normalSales} units</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-blue">{currentEvent.multiplier}x</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-blue-600">{category.forecastSales} units</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-orange-600">{category.stockNeeded} units</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-green">+{growth.toFixed(0)}%</span>
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-6 py-4 text-gray-900">Total</td>
                  <td className="px-6 py-4 text-gray-900">{totalNormalSales} units</td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4 text-blue-600">{totalForecastSales} units</td>
                  <td className="px-6 py-4 text-orange-600">{totalStockNeeded} units</td>
                  <td className="px-6 py-4">
                    <span className="badge badge-green">+{((totalForecastSales / totalNormalSales - 1) * 100).toFixed(0)}%</span>
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
