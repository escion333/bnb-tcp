import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface ToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

export function ToastItem({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const duration = toast.duration || 5000
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(toast.id), 300) // Allow fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }

  const colors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500', 
    warning: 'bg-yellow-600 border-yellow-500',
    info: 'bg-blue-600 border-blue-500'
  }

  const Icon = icons[toast.type]

  return (
    <div className={`
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${colors[toast.type]} 
      rounded-lg border p-4 shadow-lg max-w-sm
    `}>
      <div className="flex items-start gap-3">
        <Icon size={20} className="text-white flex-shrink-0 mt-0.5" />
        <p className="text-white text-sm flex-1">{toast.message}</p>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return { toasts, addToast, dismissToast }
} 