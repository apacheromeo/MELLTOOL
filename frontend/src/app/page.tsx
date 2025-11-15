'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  // Redirect based on role after authentication
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'STAFF') {
        router.push('/pos')
      } else {
        router.push('/dashboard')
      }
    }
  }, [loading, isAuthenticated, user, router])

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [API_URL])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show nothing (will redirect to login)
  if (!isAuthenticated) {
    return null
  }

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI Forecasting',
      titleTh: 'พยากรณ์ด้วย AI',
      description: 'Smart stock prediction with promotion templates',
      descriptionTh: 'ทำนายสต็อกอัจฉริยะพร้อมเทมเพลตโปรโมชั่น'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Shopee Integration',
      titleTh: 'เชื่อมต่อ Shopee',
      description: 'Seamless catalog and stock synchronization',
      descriptionTh: 'ซิงค์สินค้าและสต็อกอัตโนมัติ'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Real-time Analytics',
      titleTh: 'วิเคราะห์แบบเรียลไทม์',
      description: 'Live dashboard with key metrics',
      descriptionTh: 'แดชบอร์ดสดพร้อมตัวชี้วัดสำคัญ'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'Inventory Management',
      titleTh: 'จัดการคลังสินค้า',
      description: 'Complete product and stock control',
      descriptionTh: 'ควบคุมสินค้าและสต็อกครบวงจร'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Sales / POS',
      titleTh: 'ระบบขายหน้าร้าน',
      description: 'Point of sale with barcode scanning',
      descriptionTh: 'ขายสินค้าพร้อมสแกนบาร์โค้ด'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Barcode Printing',
      titleTh: 'พิมพ์บาร์โค้ด',
      description: 'Generate and print barcode labels',
      descriptionTh: 'สร้างและพิมพ์ฉลากบาร์โค้ด'
    }
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to StockFlow
          </h1>
          <p className="text-lg text-gray-600">
            Thai E-commerce Inventory Management with AI-Powered Forecasting
          </p>
          <p className="text-gray-500">
            ระบบจัดการสต็อกสินค้าด้วย AI สำหรับอีคอมเมิร์ซไทย
          </p>
        </div>

        {/* System Status */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Frontend</span>
                <span className="badge badge-green">Running</span>
              </div>
              <p className="text-xs text-gray-600">http://localhost:3002</p>
            </div>
            <div className={`p-4 border rounded-lg ${
              apiStatus === 'online' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Backend API</span>
                <span className={`badge ${
                  apiStatus === 'online' ? 'badge-green' : 'badge-red'
                }`}>
                  {apiStatus === 'online' ? 'Running' : 'Not Running'}
                </span>
              </div>
              <p className="text-xs text-gray-600">{API_URL}</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 card-hover">
                <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                <p className="text-xs text-gray-500">{feature.descriptionTh}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/dashboard" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                📊 Dashboard
              </div>
              <div className="text-xs text-gray-600">View analytics and metrics</div>
            </Link>
            <Link href="/inventory" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                📦 Inventory
              </div>
              <div className="text-xs text-gray-600">Manage products and stock</div>
            </Link>
            <Link href="/sales" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                💳 Sales / POS
              </div>
              <div className="text-xs text-gray-600">Point of sale system</div>
            </Link>
            <Link href="/forecasting" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                🤖 AI Forecasting
              </div>
              <div className="text-xs text-gray-600">Stock predictions</div>
            </Link>
            <Link href="/stock-in" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                📥 Stock In
              </div>
              <div className="text-xs text-gray-600">Record incoming inventory</div>
            </Link>
            <Link href="/settings" className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                ⚙️ Settings
              </div>
              <div className="text-xs text-gray-600">Configure preferences</div>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Built with ❤️ for Thai E-commerce Success</p>
          <p className="mt-1">Next.js + NestJS + AI-Powered Forecasting</p>
        </div>
      </main>
    </div>
  )
}
