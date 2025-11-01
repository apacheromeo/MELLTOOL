'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastProps {
  toast: ToastMessage
  onClose: (id: string) => void
}

function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => onClose(toast.id), 300)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast, onClose])

  const config = {
    success: {
      bg: 'bg-green-500/30',
      border: 'border-green-400/50',
      text: 'text-green-200',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    error: {
      bg: 'bg-red-500/30',
      border: 'border-red-400/50',
      text: 'text-red-200',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-500/30',
      border: 'border-yellow-400/50',
      text: 'text-yellow-200',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-500/30',
      border: 'border-blue-400/50',
      text: 'text-blue-200',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }

  const style = config[toast.type]

  return (
    <div
      className={`glass p-4 rounded-xl border ${style.border} ${style.bg} backdrop-blur-xl shadow-2xl transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={style.text}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${style.text} mb-1`}>{toast.title}</h4>
          {toast.message && (
            <p className="text-sm text-glass-muted">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => {
            setIsExiting(true)
            setTimeout(() => onClose(toast.id), 300)
          }}
          className={`${style.text} hover:opacity-70 transition`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    // Listen for toast events
    const handleToast = (event: CustomEvent<ToastMessage>) => {
      setToasts(prev => [...prev, event.detail])
    }

    window.addEventListener('show-toast' as any, handleToast)
    return () => window.removeEventListener('show-toast' as any, handleToast)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  )
}

// Helper function to show toasts
export function showToast(type: ToastType, title: string, message?: string, duration?: number) {
  const event = new CustomEvent('show-toast', {
    detail: {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      duration
    }
  })
  window.dispatchEvent(event)
}



