import React, { useState } from 'react'

/**
 * Sidebar/Note Component - Collapsible callout boxes like textbook margin notes
 * 
 * Types:
 * - note: General informational aside (blue)
 * - definition: Term definition (purple - shifted from violet for distinction)  
 * - warning: Caution/gotcha (amber)
 * - deeper: "Go deeper" expanded content (emerald)
 * - historical: Background/context (slate)
 */

const ChevronRight = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const typeStyles = {
  note: {
    container: 'border-blue-200 bg-blue-50/50',
    header: 'text-blue-900 bg-blue-100/60',
    headerHover: 'hover:bg-blue-100',
    icon: '💡',
    iconBg: 'bg-blue-100 text-blue-600',
    content: 'text-blue-900',
    accent: 'border-l-blue-400',
    focusRing: 'focus-visible:ring-blue-400',
  },
  definition: {
    container: 'border-purple-200 bg-purple-50/50',  // Changed from violet to purple
    header: 'text-purple-900 bg-purple-100/60',
    headerHover: 'hover:bg-purple-100',
    icon: '📖',
    iconBg: 'bg-purple-100 text-purple-600',
    content: 'text-purple-900',
    accent: 'border-l-purple-400',
    focusRing: 'focus-visible:ring-purple-400',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50/50',
    header: 'text-amber-900 bg-amber-100/60',
    headerHover: 'hover:bg-amber-100',
    icon: '⚠️',
    iconBg: 'bg-amber-100 text-amber-600',
    content: 'text-amber-900',
    accent: 'border-l-amber-400',
    focusRing: 'focus-visible:ring-amber-400',
  },
  deeper: {
    container: 'border-emerald-200 bg-emerald-50/50',
    header: 'text-emerald-900 bg-emerald-100/60',
    headerHover: 'hover:bg-emerald-100',
    icon: '🔬',
    iconBg: 'bg-emerald-100 text-emerald-600',
    content: 'text-emerald-900',
    accent: 'border-l-emerald-400',
    focusRing: 'focus-visible:ring-emerald-400',
  },
  historical: {
    container: 'border-slate-200 bg-slate-50/50',
    header: 'text-slate-700 bg-slate-100/60',
    headerHover: 'hover:bg-slate-100',
    icon: '📜',
    iconBg: 'bg-slate-100 text-slate-500',
    content: 'text-slate-700',
    accent: 'border-l-slate-400',
    focusRing: 'focus-visible:ring-slate-400',
  },
}

export default function Sidebar({ 
  type = 'note',
  title,
  children,
  defaultExpanded = false,
  className = '',
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const styles = typeStyles[type] || typeStyles.note
  
  return (
    <aside 
      className={`
        my-4 rounded-lg border overflow-hidden
        transition-all duration-200 ease-out
        ${styles.container}
        ${styles.accent} border-l-4
        ${className}
      `}
    >
      {/* Header - always visible, clickable to toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className={`
          w-full px-4 py-3 flex items-center gap-3
          text-left cursor-pointer
          transition-colors duration-150
          ${styles.header} ${styles.headerHover}
          focus:outline-none focus-visible:ring-2 focus-visible:ring-inset ${styles.focusRing}
        `}
      >
        {/* Icon */}
        <span className={`
          w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0
          ${styles.iconBg}
        `}>
          {styles.icon}
        </span>
        
        {/* Title */}
        <span className="flex-1 font-medium text-sm">
          {title || getDefaultTitle(type)}
        </span>
        
        {/* Expand/collapse chevron with rotation animation */}
        <ChevronRight 
          className={`
            w-4 h-4 flex-shrink-0
            transition-transform duration-200 ease-out
            ${expanded ? 'rotate-90' : ''}
          `}
        />
      </button>
      
      {/* Collapsible content with smooth animation */}
      <div 
        className={`
          overflow-hidden transition-all duration-200 ease-out
          ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className={`
          px-4 py-3 text-sm leading-relaxed
          border-t border-current/10
          ${styles.content}
        `}>
          {children}
        </div>
      </div>
    </aside>
  )
}

function getDefaultTitle(type) {
  switch (type) {
    case 'note': return 'Note'
    case 'definition': return 'Definition'
    case 'warning': return 'Heads Up'
    case 'deeper': return 'Going Deeper'
    case 'historical': return 'Background'
    default: return 'Note'
  }
}

// Export types for use elsewhere
export const SIDEBAR_TYPES = Object.keys(typeStyles)
