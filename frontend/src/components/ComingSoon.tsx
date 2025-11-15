'use client'

import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Link from 'next/link'

interface ComingSoonProps {
  title: string
  titleTh: string
  description: string
  descriptionTh: string
  icon?: string
  relatedLinks?: Array<{
    name: string
    href: string
    description: string
  }>
}

export default function ComingSoon({
  title,
  titleTh,
  description,
  descriptionTh,
  icon = '🚧',
  relatedLinks = []
}: ComingSoonProps) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-0 lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Coming Soon Card */}
          <div className="card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">{icon}</span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{title}</h1>
            <p className="text-2xl text-gray-600 mb-6">{titleTh}</p>
            
            <div className="max-w-2xl mx-auto mb-8">
              <p className="text-lg text-gray-700 mb-2">{description}</p>
              <p className="text-base text-gray-600">{descriptionTh}</p>
            </div>

            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-blue-700 font-semibold">Coming Soon</span>
            </div>
          </div>

          {/* Related Links */}
          {relatedLinks.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Related Pages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="card p-4 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600">{link.name}</div>
                        <div className="text-sm text-gray-600">{link.description}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.back()}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

