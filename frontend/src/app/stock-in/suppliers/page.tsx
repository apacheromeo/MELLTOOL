'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface Supplier {
  id: string
  name: string
  nameTh: string
  contactPerson: string
  email: string
  phone: string
  address: string
  taxId: string
  paymentTerms: string
  rating: number
  totalOrders: number
  totalValue: number
  lastOrderDate: string
  status: 'active' | 'inactive'
  notes?: string
  createdAt: string
}

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    nameTh: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: '30',
    rating: 5,
    status: 'active' as 'active' | 'inactive',
    notes: ''
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = () => {
    setLoading(true)
    setTimeout(() => {
      setSuppliers([
        {
          id: '1',
          name: 'FilterPro Co., Ltd.',
          nameTh: 'ฟิลเตอร์โปร จำกัด',
          contactPerson: 'John Smith',
          email: 'sales@filterpro.com',
          phone: '+66-2-123-4567',
          address: '123 Industrial Rd, Bangkok 10110',
          taxId: '0105558123456',
          paymentTerms: '30',
          rating: 5,
          totalOrders: 45,
          totalValue: 1250000,
          lastOrderDate: '2024-10-20',
          status: 'active',
          notes: 'Reliable supplier for HEPA filters',
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'PowerCell Ltd.',
          nameTh: 'พาวเวอร์เซลล์ จำกัด',
          contactPerson: 'Sarah Johnson',
          email: 'contact@powercell.com',
          phone: '+66-2-234-5678',
          address: '456 Tech Park, Bangkok 10120',
          taxId: '0105559234567',
          paymentTerms: '45',
          rating: 4,
          totalOrders: 32,
          totalValue: 980000,
          lastOrderDate: '2024-10-18',
          status: 'active',
          notes: 'Battery specialist',
          createdAt: '2024-02-01'
        },
        {
          id: '3',
          name: 'BrushMaster Inc.',
          nameTh: 'บรัชมาสเตอร์ จำกัด',
          contactPerson: 'Mike Chen',
          email: 'info@brushmaster.com',
          phone: '+66-2-345-6789',
          address: '789 Factory Lane, Samut Prakan 10280',
          taxId: '0105560345678',
          paymentTerms: '30',
          rating: 5,
          totalOrders: 28,
          totalValue: 650000,
          lastOrderDate: '2024-10-15',
          status: 'active',
          createdAt: '2024-03-10'
        },
        {
          id: '4',
          name: 'MotorWorks Co.',
          nameTh: 'มอเตอร์เวิร์คส์ จำกัด',
          contactPerson: 'David Lee',
          email: 'sales@motorworks.com',
          phone: '+66-2-456-7890',
          address: '321 Motor St, Chonburi 20000',
          taxId: '0105561456789',
          paymentTerms: '60',
          rating: 3,
          totalOrders: 15,
          totalValue: 450000,
          lastOrderDate: '2024-09-25',
          status: 'inactive',
          notes: 'Slow delivery times',
          createdAt: '2024-04-20'
        }
      ])
      setLoading(false)
    }, 500)
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    if (filterStatus !== 'all' && supplier.status !== filterStatus) return false
    if (searchTerm && !supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !supplier.nameTh.includes(searchTerm) &&
        !supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingSupplier) {
      setSuppliers(suppliers.map(sup => 
        sup.id === editingSupplier.id 
          ? { 
              ...sup, 
              ...formData,
              totalOrders: sup.totalOrders,
              totalValue: sup.totalValue,
              lastOrderDate: sup.lastOrderDate
            }
          : sup
      ))
    } else {
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        ...formData,
        totalOrders: 0,
        totalValue: 0,
        lastOrderDate: '-',
        createdAt: new Date().toISOString().split('T')[0]
      }
      setSuppliers([newSupplier, ...suppliers])
    }
    
    closeModal()
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      nameTh: supplier.nameTh,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      taxId: supplier.taxId,
      paymentTerms: supplier.paymentTerms,
      rating: supplier.rating,
      status: supplier.status,
      notes: supplier.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      setSuppliers(suppliers.filter(sup => sup.id !== id))
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingSupplier(null)
    setFormData({
      name: '',
      nameTh: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      paymentTerms: '30',
      rating: 5,
      status: 'active',
      notes: ''
    })
  }

  const activeSuppliers = suppliers.filter(s => s.status === 'active').length
  const totalOrders = suppliers.reduce((sum, s) => sum + s.totalOrders, 0)
  const totalValue = suppliers.reduce((sum, s) => sum + s.totalValue, 0)

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers Management</h1>
            <p className="text-gray-600 mt-1">Manage your suppliers and vendor information</p>
            <p className="text-sm text-gray-500">จัดการข้อมูลซัพพลายเออร์และผู้จำหน่าย</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Supplier
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Suppliers</p>
                <p className="text-3xl font-bold text-gray-900">{suppliers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Suppliers</p>
                <p className="text-3xl font-bold text-green-600">{activeSuppliers}</p>
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
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-purple-600">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-yellow-600">฿{(totalValue / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                placeholder="Search suppliers..."
                className="input pl-10"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Suppliers Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading suppliers...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏢</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No Suppliers Found' : 'No Suppliers Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Add your first supplier to get started'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Supplier
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Value</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Order</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{supplier.name}</div>
                          <div className="text-sm text-gray-600">{supplier.nameTh}</div>
                          <div className="text-xs text-gray-500">{supplier.taxId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{supplier.contactPerson}</div>
                          <div className="text-xs text-gray-600">{supplier.email}</div>
                          <div className="text-xs text-gray-600">{supplier.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < supplier.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-blue">{supplier.totalOrders}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">฿{supplier.totalValue.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{supplier.lastOrderDate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          supplier.status === 'active' ? 'badge-green' : 'badge-gray'
                        }`}>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => router.push(`/stock-in/new?supplier=${supplier.id}`)}
                            className="p-2 hover:bg-green-50 rounded-lg transition"
                            title="Create Order"
                          >
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.id)}
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                        placeholder="FilterPro Co., Ltd."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name (Thai) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nameTh}
                        onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                        className="input"
                        placeholder="ฟิลเตอร์โปร จำกัด"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="input"
                        placeholder="John Smith"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        className="input"
                        placeholder="0105558123456"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input"
                        placeholder="sales@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input"
                        placeholder="+66-2-123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="textarea"
                      rows={2}
                      placeholder="123 Industrial Rd, Bangkok 10110"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Terms (Days) *
                      </label>
                      <select
                        required
                        value={formData.paymentTerms}
                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                        className="select"
                      >
                        <option value="0">Cash</option>
                        <option value="7">7 Days</option>
                        <option value="15">15 Days</option>
                        <option value="30">30 Days</option>
                        <option value="45">45 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating *
                      </label>
                      <select
                        required
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                        className="select"
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                        <option value="4">⭐⭐⭐⭐ (4)</option>
                        <option value="3">⭐⭐⭐ (3)</option>
                        <option value="2">⭐⭐ (2)</option>
                        <option value="1">⭐ (1)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                        className="select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
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
                      placeholder="Additional notes about this supplier..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingSupplier ? 'Update' : 'Create'} Supplier
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
