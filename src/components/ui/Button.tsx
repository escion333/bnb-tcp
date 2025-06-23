import { type ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = ''
}: ButtonProps) {
  const baseClasses = 'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900'
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white disabled:bg-gray-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white disabled:bg-gray-700',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white disabled:bg-gray-600',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white disabled:bg-gray-600',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white disabled:bg-gray-600'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  )
} 