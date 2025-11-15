'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function SettingsPage() {
  const [language, setLanguage] = useState('en')
  const [notifications, setNotifications] = useState(true)
  const [autoSync, setAutoSync] = useState(true)

  const handleSave = () => {
    alert('Settings saved successfully!')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your application preferences</p>
        </div>

        <div className="max-w-4xl space-y-6">
          {/* Language Settings */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Language / ภาษา</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interface Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="select w-full"
              >
                <option value="en">English</option>
                <option value="th">ไทย (Thai)</option>
              </select>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900 mb-1">Low Stock Alerts</div>
                <div className="text-sm text-gray-600">
                  Get notified when products are running low
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                  notifications ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all shadow-md ${
                    notifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sync Settings */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Synchronization</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900 mb-1">Auto Sync with Shopee</div>
                <div className="text-sm text-gray-600">
                  Automatically sync inventory with Shopee every hour
                </div>
              </div>
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                  autoSync ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all shadow-md ${
                    autoSync ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Shopee Integration */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shopee Integration</h2>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Connection Status</span>
                <span className="badge badge-green">Connected</span>
              </div>
              <p className="text-sm text-gray-600">
                Your Shopee shop is connected and syncing
              </p>
            </div>
            <button className="btn-primary w-full">
              Manage Shopee Connections
            </button>
          </div>

          {/* System Information */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-600">Version:</span>
                <span className="font-semibold text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-600">Environment:</span>
                <span className="font-semibold text-blue-600">Development</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-600">API Status:</span>
                <span className="font-semibold text-green-600">● Online</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-gray-600">Theme:</span>
                <span className="font-semibold text-gray-900">Clean White Design</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 btn-primary"
            >
              Save Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
