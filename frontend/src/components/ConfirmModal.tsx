'use client'

import { useState } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmModalProps) {
  if (!isOpen) return null

  const config = {
    danger: {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      gradient: 'from-red-400 to-pink-600',
      confirmClass: 'from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
    },
    warning: {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      gradient: 'from-yellow-400 to-orange-600',
      confirmClass: 'from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700'
    },
    info: {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-blue-400 to-cyan-600',
      confirmClass: 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'
    }
  }

  const style = config[type]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative glass-card p-8 max-w-md w-full animate-scale-in shadow-2xl">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white mb-6 mx-auto shadow-lg`}>
          {style.icon}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
          <p className="text-glass-muted">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 glass rounded-xl border-glass text-white hover:bg-white/20 transition-all font-semibold"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 bg-gradient-to-r ${style.confirmClass} text-white rounded-xl transition-all font-semibold shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for using confirmation modals
export function useConfirm() {
  const [state, setState] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  const confirm = (
    title: string,
    message: string,
    options?: {
      confirmText?: string
      cancelText?: string
      type?: 'danger' | 'warning' | 'info'
    }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title,
        message,
        ...options,
        onConfirm: () => {
          setState(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        }
      })
    })
  }

  const handleCancel = () => {
    setState(prev => ({ ...prev, isOpen: false }))
  }

  const ConfirmDialog = () => (
    <ConfirmModal
      isOpen={state.isOpen}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      type={state.type}
      onConfirm={state.onConfirm || (() => {})}
      onCancel={handleCancel}
    />
  )

  return { confirm, ConfirmDialog }
}

