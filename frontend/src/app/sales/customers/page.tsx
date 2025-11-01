'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  notes?: string
  createdAt: string
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = () => {
    setLoading(true)
    setTimeout(() => {
      setCustomers([
        {
          id: '1',
          name: 'Somchai Prasert',
          phone: '+66-81-234-5678',
          email: 'somchai@email.com',
          address: '123 Main St, Bangkok',
          totalOrders: 25,
          totalSpent: 45000,
          lastOrderDate: '2024-10-26',
          tier: 'gold',
          notes: 'VIP customer',
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'Suda Wongsakul',
          phone: '+66-82-345-6789',
          email: 'suda@email.com',
          totalOrders: 12,
          totalSpent: 18000,
          lastOrderDate: '2024-10-25',
          tier: 'silver',
          createdAt: '2024-03-20'
        },
        {
          id: '3',
          name: 'Niran Chaiyaporn',
          phone: '+66-83-456-7890',
          totalOrders: 8,
          totalSpent: 12000,
          lastOrderDate: '2024-10-24',
          tier: 'bronze',
          createdAt: '2024-05-10'
        },
        {
          id: '4',
          name: 'Preecha Suksan',
          phone: '+66-84-567-8901',
          email: 'preecha@email.com',
          address: '456 Business Rd, Bangkok',
          totalOrders: 45,
          totalSpent: 120000,
          lastOrderDate: '2024-10-26',
          tier: 'platinum',
          notes: 'Wholesale customer',
          createdAt: '2023-12-01'
        }
      ])
      setLoading(false)
    }, 500)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return '💎'
      case 'gold':
        return '🥇'
      case 'silver':
        return '🥈'
      case 'bronze':
        return '🥉'
      default:
        return '👤'
    }
  }

  const filteredCustomers = customers.filter(customer => {
    if (filterTier !== 'all' && customer.tier !== filterTier) return false
    if (searchTerm && !customer.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !customer.phone.includes(searchTerm)) return false
    return true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCustomer) {
      setCustomers(customers.map(cust => 
        cust.id === editingCustomer.id 
          ? { 
              ...cust, 
              ...formData,
              totalOrders: cust.totalOrders,
              totalSpent: cust.totalSpent,
              lastOrderDate: cust.lastOrderDate,
              tier: cust.tier
            }
          : cust
      ))
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        ...formData,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: '-',
        tier: 'bronze',
        createdAt: new Date().toISOString().split('T')[0]
      }
      setCustomers([newCustomer, ...customers])
    }
    
    closeModal()
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(cust => cust.id !== id))
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCustomer(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    })
  }

  const totalCustomers = customers.length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgSpent = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600 mt-1">Manage customer information and purchase history</p>
            <p className="text-sm text-gray-500">จัดการข้อมูลลูกค้าและประวัติการซื้อ</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">฿{(totalRevenue / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Spent</p>
                <p className="text-2xl font-bold text-purple-600">฿{avgSpent.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">VIP Customers</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {customers.filter(c => c.tier === 'gold' || c.tier === 'platinum').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
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
                placeholder="Search customers..."
                className="input pl-10"
              />
            </div>

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="select"
            >
              <option value="all">All Tiers</option>
              <option value="platinum">💎 Platinum</option>
              <option value="gold">🥇 Gold</option>
              <option value="silver">🥈 Silver</option>
              <option value="bronze">🥉 Bronze</option>
            </select>
          </div>
        </div>

        {/* Customers Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Customers Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterTier !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Add your first customer'}
            </p>
            {!searchTerm && filterTier === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Spent</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Order</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{customer.name}</div>
                        {customer.notes && (
                          <div className="text-xs text-gray-500">{customer.notes}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{customer.phone}</div>
                        {customer.email && (
                          <div className="text-xs text-gray-500">{customer.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getTierIcon(customer.tier)}</span>
                          <span className={`badge ${getTierColor(customer.tier)} capitalize`}>
                            {customer.tier}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-blue">{customer.totalOrders}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">฿{customer.totalSpent.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{customer.lastOrderDate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="Somchai Prasert"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                      placeholder="+66-81-234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      placeholder="customer@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address (Optional)
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="textarea"
                      rows={2}
                      placeholder="123 Main St, Bangkok"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="textarea"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingCustomer ? 'Update' : 'Create'} Customer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
