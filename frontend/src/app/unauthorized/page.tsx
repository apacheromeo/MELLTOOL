'use client'

import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-200 text-center">
          {/* Error Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            You don't have permission to access this page.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Go Back
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              Go to Dashboard
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            Contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    </div>
  )
}
