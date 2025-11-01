'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SidebarLayout from '@/components/SidebarLayout'

interface Brand {
  id: string
  name: string
  nameTh: string
  description?: string
  website?: string
  logo?: string
  productCount: number
  country: string
  createdAt: string
}

export default function BrandsPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    nameTh: '',
    description: '',
    website: '',
    logo: '',
    country: 'Thailand'
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [useEmojiLogo, setUseEmojiLogo] = useState(true)

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = () => {
    setLoading(true)
    setTimeout(() => {
      setBrands([
        {
          id: '1',
          name: 'Dyson',
          nameTh: 'ไดสัน',
          description: 'Premium vacuum cleaner manufacturer',
          website: 'https://www.dyson.com',
          logo: '🌀',
          productCount: 45,
          country: 'United Kingdom',
          createdAt: '2024-01-10'
        },
        {
          id: '2',
          name: 'Xiaomi',
          nameTh: 'เสี่ยวมี่',
          description: 'Smart home and electronics',
          website: 'https://www.mi.com',
          logo: '📱',
          productCount: 67,
          country: 'China',
          createdAt: '2024-01-15'
        },
        {
          id: '3',
          name: 'Electrolux',
          nameTh: 'อีเล็กโทรลักซ์',
          description: 'Home appliances and professional products',
          website: 'https://www.electrolux.com',
          logo: '⚡',
          productCount: 89,
          country: 'Sweden',
          createdAt: '2024-01-20'
        },
        {
          id: '4',
          name: 'Samsung',
          nameTh: 'ซัมซุง',
          description: 'Electronics and home appliances',
          website: 'https://www.samsung.com',
          logo: '📺',
          productCount: 52,
          country: 'South Korea',
          createdAt: '2024-02-01'
        },
        {
          id: '5',
          name: 'Philips',
          nameTh: 'ฟิลิปส์',
          description: 'Health technology and consumer electronics',
          website: 'https://www.philips.com',
          logo: '💡',
          productCount: 38,
          country: 'Netherlands',
          createdAt: '2024-02-05'
        }
      ])
      setLoading(false)
    }, 500)
  }

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.nameTh.includes(searchTerm) ||
    brand.country.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingBrand) {
      setBrands(brands.map(brand => 
        brand.id === editingBrand.id 
          ? { ...brand, ...formData, productCount: brand.productCount }
          : brand
      ))
    } else {
      const newBrand: Brand = {
        id: Date.now().toString(),
        ...formData,
        productCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      }
      setBrands([newBrand, ...brands])
    }
    
    closeModal()
  }

  const handleLogoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
        setFormData({ ...formData, logo: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    const isEmoji = brand.logo && brand.logo.length <= 2
    setUseEmojiLogo(isEmoji)
    setFormData({
      name: brand.name,
      nameTh: brand.nameTh,
      description: brand.description || '',
      website: brand.website || '',
      logo: brand.logo || '🏷️',
      country: brand.country
    })
    if (!isEmoji) {
      setLogoPreview(brand.logo || null)
    }
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      setBrands(brands.filter(brand => brand.id !== id))
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBrand(null)
    setLogoPreview(null)
    setUseEmojiLogo(true)
    setFormData({
      name: '',
      nameTh: '',
      description: '',
      website: '',
      logo: '🏷️',
      country: 'Thailand'
    })
  }

  const logoOptions = ['🏷️', '🌀', '📱', '⚡', '📺', '💡', '🔧', '🛠️', '⚙️', '🎯', '🌟', '💼']

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Brands</h1>
            <p className="text-gray-600 mt-1">Manage product brands and manufacturers</p>
            <p className="text-sm text-gray-500">จัดการแบรนด์สินค้าและผู้ผลิต</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Brand
          </button>
        </div>

        {/* Search Bar */}
        <div className="card p-4 mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search brands by name or country..."
              className="input pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Brands</p>
                <p className="text-3xl font-bold text-gray-900">{brands.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">
                  {brands.reduce((sum, brand) => sum + brand.productCount, 0)}
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
                <p className="text-sm text-gray-600 mb-1">Top Brand</p>
                <p className="text-xl font-bold text-gray-900">
                  {brands.length > 0 ? brands.reduce((max, brand) => brand.productCount > max.productCount ? brand : max, brands[0]).name : 'N/A'}
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

        {/* Brands Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading brands...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏷️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No Brands Found' : 'No Brands Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try a different search term' : 'Add your first brand to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Brand
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Products</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Website</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBrands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-xl overflow-hidden">
                            {brand.logo && brand.logo.startsWith('data:image') ? (
                              <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{brand.logo}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{brand.name}</div>
                            <div className="text-sm text-gray-600">{brand.nameTh}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{brand.country}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge badge-blue">{brand.productCount} items</span>
                      </td>
                      <td className="px-6 py-4">
                        {brand.website ? (
                          <a
                            href={brand.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            Visit
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{brand.createdAt}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(brand)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(brand.id)}
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
                  {editingBrand ? 'Edit Brand' : 'Add New Brand'}
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
                      Brand Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      placeholder="e.g., Dyson"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Name (Thai) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nameTh}
                      onChange={(e) => setFormData({ ...formData, nameTh: e.target.value })}
                      className="input"
                      placeholder="เช่น ไดสัน"
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
                      placeholder="Brief description of the brand"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="input"
                      placeholder="https://www.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="select"
                    >
                      <option value="Thailand">Thailand</option>
                      <option value="China">China</option>
                      <option value="Japan">Japan</option>
                      <option value="South Korea">South Korea</option>
                      <option value="United States">United States</option>
                      <option value="Germany">Germany</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Sweden">Sweden</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo/Icon
                    </label>
                    
                    {/* Toggle between Emoji and Image */}
                    <div className="flex gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setUseEmojiLogo(true)
                          setLogoPreview(null)
                          setFormData({ ...formData, logo: '🏷️' })
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          useEmojiLogo
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Use Emoji
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseEmojiLogo(false)
                          setFormData({ ...formData, logo: '' })
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          !useEmojiLogo
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Upload Image
                      </button>
                    </div>

                    {useEmojiLogo ? (
                      <div className="grid grid-cols-6 gap-2">
                        {logoOptions.map((logo) => (
                          <button
                            key={logo}
                            type="button"
                            onClick={() => setFormData({ ...formData, logo })}
                            className={`p-3 text-2xl rounded-lg border-2 transition ${
                              formData.logo === logo
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {logo}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        {logoPreview ? (
                          <div className="relative">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setLogoPreview(null)
                                setFormData({ ...formData, logo: '' })
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoImageChange}
                            className="hidden"
                            id="brand-logo"
                          />
                          <label
                            htmlFor="brand-logo"
                            className="btn-secondary cursor-pointer inline-flex items-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload Logo
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            PNG, JPG up to 2MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingBrand ? 'Update' : 'Create'} Brand
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
