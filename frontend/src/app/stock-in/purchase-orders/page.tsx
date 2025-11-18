'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface PurchaseOrder {
  id: string
  poNumber: string
  supplier: string
  supplierTh: string
  orderDate: string
  expectedDate: string
  actualDate?: string
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'cancelled'
  totalItems: number
  totalQuantity: number
  totalAmount: number
  paidAmount: number
  notes?: string
  createdBy: string
}

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = () => {
    setLoading(true)
    setTimeout(() => {
      setOrders([
        {
          id: '1',
          poNumber: 'PO-2024-001',
          supplier: 'FilterPro Co., Ltd.',
          supplierTh: 'ฟิลเตอร์โปร จำกัด',
          orderDate: '2024-10-20',
          expectedDate: '2024-10-27',
          actualDate: '2024-10-26',
          status: 'received',
          totalItems: 5,
          totalQuantity: 150,
          totalAmount: 67500,
          paidAmount: 67500,
          notes: 'Urgent order for HEPA filters',
          createdBy: 'Admin'
        },
        {
          id: '2',
          poNumber: 'PO-2024-002',
          supplier: 'PowerCell Ltd.',
          supplierTh: 'พาวเวอร์เซลล์ จำกัด',
          orderDate: '2024-10-22',
          expectedDate: '2024-10-29',
          status: 'confirmed',
          totalItems: 3,
          totalQuantity: 100,
          totalAmount: 120000,
          paidAmount: 0,
          notes: 'Battery restock',
          createdBy: 'Manager'
        },
        {
          id: '3',
          poNumber: 'PO-2024-003',
          supplier: 'BrushMaster Inc.',
          supplierTh: 'บรัชมาสเตอร์ จำกัด',
          orderDate: '2024-10-23',
          expectedDate: '2024-10-30',
          actualDate: '2024-10-28',
          status: 'partial',
          totalItems: 4,
          totalQuantity: 80,
          totalAmount: 28000,
          paidAmount: 14000,
          notes: 'Partial delivery expected',
          createdBy: 'Staff'
        },
        {
          id: '4',
          poNumber: 'PO-2024-004',
          supplier: 'MotorWorks Co.',
          supplierTh: 'มอเตอร์เวิร์คส์ จำกัด',
          orderDate: '2024-10-24',
          expectedDate: '2024-11-03',
          status: 'sent',
          totalItems: 2,
          totalQuantity: 20,
          totalAmount: 50000,
          paidAmount: 0,
          notes: 'Waiting for confirmation',
          createdBy: 'Admin'
        },
        {
          id: '5',
          poNumber: 'PO-2024-005',
          supplier: 'HosePro Ltd.',
          supplierTh: 'โฮสโปร จำกัด',
          orderDate: '2024-10-25',
          expectedDate: '2024-11-01',
          status: 'draft',
          totalItems: 6,
          totalQuantity: 200,
          totalAmount: 56000,
          paidAmount: 0,
          notes: 'Draft - needs review',
          createdBy: 'Staff'
        }
      ])
      setLoading(false)
    }, 500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'received':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return '📝'
      case 'sent':
        return '📤'
      case 'confirmed':
        return '✅'
      case 'partial':
        return '⚠️'
      case 'received':
        return '📦'
      case 'cancelled':
        return '❌'
      default:
        return '📋'
    }
  }

  const filteredOrders = orders
    .filter(order => {
      if (filterStatus !== 'all' && order.status !== filterStatus) return false
      if (searchTerm && !order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !order.supplier.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      } else if (sortBy === 'amount') {
        return b.totalAmount - a.totalAmount
      } else {
        return a.status.localeCompare(b.status)
      }
    })

  const statusCounts = {
    draft: orders.filter(o => o.status === 'draft').length,
    sent: orders.filter(o => o.status === 'sent').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    partial: orders.filter(o => o.status === 'partial').length,
    received: orders.filter(o => o.status === 'received').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  }

  const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0)
  const totalPending = totalAmount - totalPaid

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-1">Create and manage purchase orders to suppliers</p>
            <p className="text-sm text-gray-500">สร้างและจัดการใบสั่งซื้อไปยังซัพพลายเออร์</p>
          </div>
          <button
            onClick={() => router.push('/stock-in')}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create PO
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">฿{(totalAmount / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Paid</p>
                <p className="text-2xl font-bold text-green-600">฿{(totalPaid / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">฿{(totalPending / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'draft'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📝 Draft ({statusCounts.draft})
            </button>
            <button
              onClick={() => setFilterStatus('sent')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📤 Sent ({statusCounts.sent})
            </button>
            <button
              onClick={() => setFilterStatus('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'confirmed'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ Confirmed ({statusCounts.confirmed})
            </button>
            <button
              onClick={() => setFilterStatus('partial')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'partial'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚠️ Partial ({statusCounts.partial})
            </button>
            <button
              onClick={() => setFilterStatus('received')}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                filterStatus === 'received'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📦 Received ({statusCounts.received})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by PO number or supplier..."
                className="input pl-10"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="select"
            >
              <option value="date">Sort by Date (Newest)</option>
              <option value="amount">Sort by Amount (Highest)</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading purchase orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No Orders Found' : 'No Purchase Orders Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first purchase order'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => router.push('/stock-in')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First PO
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PO Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expected</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{order.poNumber}</div>
                        <div className="text-xs text-gray-500">by {order.createdBy}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.supplier}</div>
                        <div className="text-sm text-gray-600">{order.supplierTh}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{order.orderDate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{order.expectedDate}</span>
                        {order.actualDate && (
                          <div className="text-xs text-green-600">Arrived: {order.actualDate}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">{order.totalItems} items</div>
                          <div className="text-gray-600">{order.totalQuantity} units</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">฿{order.totalAmount.toLocaleString()}</div>
                          {order.paidAmount > 0 && (
                            <div className="text-green-600">Paid: ฿{order.paidAmount.toLocaleString()}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getStatusIcon(order.status)}</span>
                          <span className={`badge ${getStatusColor(order.status)} capitalize`}>
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/stock-in/${order.id}`)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            className="p-2 hover:bg-green-50 rounded-lg transition"
                            title="Print"
                          >
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
