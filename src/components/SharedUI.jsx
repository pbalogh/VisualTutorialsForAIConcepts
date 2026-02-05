import React from 'react'

export const Button = ({ children, onClick, className = '', variant = 'primary', ...props }) => {
  const baseClass = 'px-4 py-2 rounded font-medium transition-colors'
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }
  
  return (
    <button 
      className={`${baseClass} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CodeBlock = ({ code, language = 'javascript', className = '' }) => {
  return (
    <pre className={`bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm font-mono ${className}`}>
      <code>{code}</code>
    </pre>
  )
}

export const Container = ({ children, className = '' }) => {
  return (
    <div className={`max-w-6xl mx-auto px-6 ${className}`}>
      {children}
    </div>
  )
}

export const Header = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`mb-8 ${className}`}>
      <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-lg text-gray-600 mt-2">{subtitle}</p>}
    </div>
  )
}
