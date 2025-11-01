'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface Category {
  id: string
  name: string
  nameTh: string
  description?: string
  productCount: number
  color: string
  icon: string
  createdAt: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    nameTh: '',
    description: '',
    color: '#3B82F6',
    icon: '📦'
  })

  // Mock data for demonstration
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setCategories([
        {
          id: '1',
          name: 'Vacuum Parts',
          nameTh: 'อะไหล่เครื่องดูดฝุ่น',
          description: 'Replacement parts for vacuum cleaners',
          productCount: 145,
          color: '#3B82F6',
          icon: '🔧',
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'Filters',
          nameTh: 'ฟิลเตอร์',
          description: 'HEPA and standard filters',
          productCount: 89,
          color: '#10B981',
          icon: '🌪️',
          createdAt: '2024-01-20'
        },
        {
          id: '3',
          name: 'Batteries',
          nameTh: 'แบตเตอรี่',
          description: 'Rechargeable batteries for cordless vacuums',
          productCount: 56,
          color: '#F59E0B',
          icon: '🔋',
          createdAt: '2024-02-01'
        },
        {
          id: '4',
          name: 'Brushes',
          nameTh: 'แปรง',
          description: 'Rotating brushes and attachments',
          productCount: 72,
          color: '#8B5CF6',
          icon: '🧹',
          createdAt: '2024-02-10'
        },
        {
          id: '5',
          name: 'Motors',
          nameTh: 'มอเตอร์',
          description: 'Replacement motors and fans',
          productCount: 34,
          color: '#EF4444',
          icon: '⚙️',
          createdAt: '2024-02-15'
        }
      ])
      setLoading(false)
    }, 500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCategory) {
      // Update existing category
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...formData, productCount: cat.productCount }
          : cat
      ))
    } else {
      // Create new category
      const newCategory: Category = {
        id: Date.now().toString(),
        ...formData,
        productCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      }
      setCategories([newCategory, ...categories])
    }
    
    closeModal()
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      nameTh: category.nameTh,
      description: category.description || '',
      color: category.color,
      icon: category.icon
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== id))
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      nameTh: '',
      description: '',
      color: '#3B82F6',
      icon: '📦'
    })
  }

  const iconOptions = ['📦', '🔧', '🌪️', '🔋', '🧹', '⚙️', '🔌', '💡', '🛠️', '📱', '💻', '🎮']

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Categories</h1>
            <p className="text-gray-600 mt-1">Organize your products into categories</p>
            <p className="text-sm text-gray-500">จัดระเบียบสินค้าของคุณเป็นหมวดหมู่</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Categories</p>
                <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">
                  {categories.reduce((sum, cat) => sum + cat.productCount, 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg per Category</p>
                <p className="text-3xl font-bold text-gray-900">
                  {categories.length > 0 ? Math.round(categories.reduce((sum, cat) => sum + cat.productCount, 0) / categories.length) : 0}
                </p>
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
                <p className="text-sm text-gray-600 mb-1">Most Popular</p>
                <p className="text-xl font-bold text-gray-900">
                  {categories.length > 0 ? categories.reduce((max, cat) => cat.productCount > max.productCount ? cat : max, categories[0]).name : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📁</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Categories Yet</h3>
            <p className="text-gray-600 mb-6">Create your first category to organize your products</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div key={category.id} className="card p-6 card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {category.icon}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Edit"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{category.nameTh}</p>
                {category.description && (
                  <p className="text-xs text-gray-500 mb-4">{category.description}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{category.productCount} products</span>
                  </div>
                  <span className="text-xs text-gray-500">{category.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                      Category Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="e.g., Vacuum Parts"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name (Thai) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nameTh}
                      onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                      className="input"
                      placeholder="เช่น อะไหล่เครื่องดูดฝุ่น"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="textarea"
                      rows={3}
                      placeholder="Brief description of this category"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {iconOptions.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`p-3 text-2xl rounded-lg border-2 transition ${
                            formData.icon === icon
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="flex gap-2">
                      {['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-10 h-10 rounded-lg border-2 transition ${
                            formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingCategory ? 'Update' : 'Create'} Category
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
