import React from 'react'

/**
 * SharedUI Components - Design System v1.0
 * 
 * Updated 2026-02-05 with new typography and spacing scales.
 * All changes are backwards-compatible with existing tutorials.
 */

// =============================================================================
// BUTTON
// =============================================================================

export const Button = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary',
  size = 'md',
  ...props 
}) => {
  const baseClass = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  return (
    <button 
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// =============================================================================
// CARD
// =============================================================================

export const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md',
  ...props 
}) => {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm hover:shadow-md',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-200',
    subtle: 'bg-gray-50 border border-gray-100',
  }
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  return (
    <div 
      className={`rounded-xl transition-all duration-200 ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// =============================================================================
// CODE BLOCK
// =============================================================================

export const CodeBlock = ({ 
  code, 
  language = 'javascript', 
  className = '',
  showLineNumbers = false,
}) => {
  const lines = code.split('\n')
  
  return (
    <div className={`relative group ${className}`}>
      <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed">
        <code>
          {showLineNumbers ? (
            lines.map((line, i) => (
              <div key={i} className="table-row">
                <span className="table-cell pr-4 text-gray-500 select-none text-right w-8">
                  {i + 1}
                </span>
                <span className="table-cell">{line}</span>
              </div>
            ))
          ) : (
            code
          )}
        </code>
      </pre>
      {language && (
        <span className="absolute top-2 right-3 text-xs text-gray-500 font-mono uppercase tracking-wider">
          {language}
        </span>
      )}
    </div>
  )
}

// =============================================================================
// CONTAINER
// =============================================================================

export const Container = ({ 
  children, 
  className = '',
  size = 'default',
}) => {
  const sizes = {
    narrow: 'max-w-2xl',      // ~672px - tight prose
    default: 'max-w-4xl',     // ~896px - standard content
    wide: 'max-w-6xl',        // ~1152px - wide layouts
    full: 'max-w-7xl',        // ~1280px - full width
  }
  
  return (
    <div className={`mx-auto px-6 sm:px-8 ${sizes[size]} ${className}`}>
      {children}
    </div>
  )
}

// =============================================================================
// HEADER
// =============================================================================

export const Header = ({ 
  title, 
  subtitle, 
  className = '',
  align = 'left',
  size = 'default',
}) => {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }
  
  const titleSizes = {
    small: 'text-2xl sm:text-3xl',
    default: 'text-3xl sm:text-4xl lg:text-5xl',
    large: 'text-4xl sm:text-5xl lg:text-6xl',
  }
  
  return (
    <header className={`mb-10 ${alignments[align]} ${className}`}>
      <h1 className={`font-bold text-gray-900 tracking-tight leading-tight ${titleSizes[size]}`}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg sm:text-xl text-gray-500 mt-4 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </header>
  )
}

// =============================================================================
// SECTION HEADER (New - numbered sections like "01. Introduction")
// =============================================================================

export const SectionHeader = ({ 
  number, 
  title, 
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {number && (
        <span className="block text-sm font-mono text-gray-400 tracking-wider mb-1">
          {String(number).padStart(2, '0')}.
        </span>
      )}
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
        {title}
      </h2>
    </div>
  )
}

// =============================================================================
// PROSE (New - optimized reading container)
// =============================================================================

export const Prose = ({ children, className = '' }) => {
  return (
    <div className={`prose prose-lg prose-gray max-w-none ${className}`}>
      {children}
    </div>
  )
}

// =============================================================================
// DIVIDER (New)
// =============================================================================

export const Divider = ({ className = '' }) => {
  return (
    <hr className={`border-0 h-px bg-gray-200 my-12 ${className}`} />
  )
}

// =============================================================================
// BADGE (New)
// =============================================================================

export const Badge = ({ 
  children, 
  variant = 'default',
  className = '',
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-indigo-100 text-indigo-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// =============================================================================
// ICON BUTTON (New)
// =============================================================================

export const IconButton = ({ 
  children, 
  onClick, 
  className = '',
  label,
  ...props 
}) => {
  return (
    <button 
      className={`p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${className}`}
      onClick={onClick}
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  )
}

export default {
  Button,
  Card,
  CodeBlock,
  Container,
  Header,
  SectionHeader,
  Prose,
  Divider,
  Badge,
  IconButton,
}
