'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import SidebarLayout from '@/components/SidebarLayout'

interface NotificationSettings {
  emailNotificationsEnabled: boolean
  lowStockEmailEnabled: boolean
  stockInApprovalEmailEnabled: boolean
}

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotificationsEnabled: true,
    lowStockEmailEnabled: false,
    stockInApprovalEmailEnabled: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getNotificationSettings()
      setSettings(data)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load notification settings'

      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        router.push('/login?redirect=/settings/notifications')
        return
      }

      setError(errorMessage)
      console.error('Failed to load notification settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)

      await api.updateNotificationSettings({ [key]: value })
      setSuccess('Settings updated successfully')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update settings')
      // Revert the change
      setSettings(settings)
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      await api.sendLowStockAlert()
      setSuccess('Test email sent! Check your inbox.')

      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      setError(err.message || 'Failed to send test email')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🔔</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
              <p className="text-gray-600 mt-1">การตั้งค่าการแจ้งเตือน</p>
            </div>
          </div>
          <p className="text-gray-600">
            Manage your email notification preferences
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="card p-4 mb-6 border-l-4 border-red-500 bg-red-50">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-900 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="card p-4 mb-6 border-l-4 border-green-500 bg-green-50">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-900 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="card p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        ) : (
          <>
            {/* Master Toggle */}
            <div className="card p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Email Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enable or disable all email notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    เปิดหรือปิดการแจ้งเตือนทางอีเมลทั้งหมด
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('emailNotificationsEnabled', !settings.emailNotificationsEnabled)}
                  disabled={saving}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.emailNotificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Individual Notification Settings */}
            <div className="card p-6 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Notification Types
              </h3>

              {/* Low Stock Alerts */}
              <div className="pb-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">📦</span>
                      <h4 className="text-md font-semibold text-gray-900">
                        Low Stock Alerts
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Receive daily email alerts when products are running low on stock
                    </p>
                    <p className="text-xs text-gray-500">
                      รับการแจ้งเตือนทางอีเมลเมื่อสินค้ามีจำนวนใกล้หมด
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('lowStockEmailEnabled', !settings.lowStockEmailEnabled)}
                    disabled={saving || !settings.emailNotificationsEnabled}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings.lowStockEmailEnabled && settings.emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    } ${saving || !settings.emailNotificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        settings.lowStockEmailEnabled && settings.emailNotificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {settings.lowStockEmailEnabled && settings.emailNotificationsEnabled && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-blue-900">
                          You'll receive email alerts every day at 9:00 AM (Bangkok time) if there are products with low stock.
                        </p>
                        <button
                          onClick={handleTestEmail}
                          disabled={saving}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Send Test Email
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock-In Approval Alerts */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">✅</span>
                      <h4 className="text-md font-semibold text-gray-900">
                        Stock-In Approval Alerts
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Get notified when a stock-in order requires your approval
                    </p>
                    <p className="text-xs text-gray-500">
                      รับการแจ้งเตือนเมื่อมีคำสั่งนำเข้าสินค้ารออนุมัติ
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('stockInApprovalEmailEnabled', !settings.stockInApprovalEmailEnabled)}
                    disabled={saving || !settings.emailNotificationsEnabled}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings.stockInApprovalEmailEnabled && settings.emailNotificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    } ${saving || !settings.emailNotificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        settings.stockInApprovalEmailEnabled && settings.emailNotificationsEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="mt-6 card p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl">💡</div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Email Configuration
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Email notifications are sent to your registered email address. Make sure your email settings are configured in the backend for notifications to work properly.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="/inventory/low-stock"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      View Low Stock
                    </a>
                    <a
                      href="/settings"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      All Settings
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  )
}



