import React, { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook to track text selection within a container
 */
export const useTextSelection = (containerRef) => {
  const [selection, setSelection] = useState(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection()
    
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      return
    }

    // Check if selection is within our container
    if (containerRef?.current) {
      const range = sel.getRangeAt(0)
      const isInContainer = containerRef.current.contains(range.commonAncestorContainer)
      if (!isInContainer) {
        return
      }
    }

    const selectedText = sel.toString().trim()
    
    if (selectedText.length < 3) {
      return // Ignore tiny selections
    }

    // Get position for popup
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    // Get surrounding context (parent paragraph or nearby text)
    const container = range.commonAncestorContainer
    const contextNode = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container
    const context = contextNode?.textContent?.slice(0, 500) || ''

    const newSelection = {
      text: selectedText,
      context,
      range: range.cloneRange(),
    }
    
    const newPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top,
    }
    
    setSelection(newSelection)
    setPosition(newPosition)
  }, [containerRef])

  const clearSelection = useCallback(() => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleSelectionChange)
    document.addEventListener('keyup', handleSelectionChange)
    
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange)
      document.removeEventListener('keyup', handleSelectionChange)
    }
  }, [handleSelectionChange])

  return { selection, position, clearSelection }
}

// CSS animation keyframes (injected once)
const popupStyles = `
  @keyframes popup-enter {
    0% {
      opacity: 0;
      transform: translate(-50%, -100%) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -100%) scale(1);
    }
  }
  .popup-animate-in {
    animation: popup-enter 150ms ease-out forwards;
  }
`

/**
 * Premium popup that appears when text is selected
 * - Glassmorphism with 85% opacity (shows blur through)
 * - Pre-tinted accent colors that brighten on hover
 * - Entrance animation (fade + scale)
 * - Click feedback with scale
 */
export const SelectionPopup = ({ 
  selection, 
  position, 
  onAction, 
  onClose,
  actions = ['explain', 'branch', 'ask'] // Added 'ask'
}) => {
  const popupRef = useRef(null)
  const inputRef = useRef(null)
  const [isAskExpanded, setIsAskExpanded] = useState(false)
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setTimeout(() => onClose?.(), 100)
      }
    }
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isAskExpanded) {
          setIsAskExpanded(false)
          setQuestion('')
        } else {
          onClose?.()
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, isAskExpanded])

  // Focus input when expanded
  useEffect(() => {
    if (isAskExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAskExpanded])

  if (!selection) {
    return null
  }

  const handleAskSubmit = async () => {
    if (!question.trim()) return
    setIsSubmitting(true)
    await onAction('ask', selection, question.trim())
    setIsSubmitting(false)
    setIsAskExpanded(false)
    setQuestion('')
  }

  const actionConfig = {
    explain: { 
      icon: '💡', 
      label: 'Explain',
      restingText: 'text-blue-300/80',
      hoverText: 'group-hover:text-blue-300',
      hoverBg: 'hover:bg-blue-500/20',
    },
    visualize: { 
      icon: '📊', 
      label: 'Visualize',
      restingText: 'text-purple-300/60',
      hoverText: 'group-hover:text-purple-300',
      hoverBg: 'hover:bg-purple-500/10',
      disabled: true,
    },
    branch: { 
      icon: '🌿', 
      label: 'Go Deeper',
      restingText: 'text-emerald-300/80',
      hoverText: 'group-hover:text-emerald-300',
      hoverBg: 'hover:bg-emerald-500/20',
    },
    ask: { 
      icon: '❓', 
      label: 'Ask',
      restingText: 'text-amber-300/80',
      hoverText: 'group-hover:text-amber-300',
      hoverBg: 'hover:bg-amber-500/20',
    },
  }

  return (
    <>
      <style>{popupStyles}</style>
      <div
        ref={popupRef}
        style={{ 
          position: 'fixed',
          left: `${position.x}px`, 
          top: `${position.y}px`,
          marginTop: '-12px',
          zIndex: 9999,
        }}
        className="popup-animate-in"
      >
        {/* Main container with glassmorphism */}
        <div className="bg-gray-900/85 backdrop-blur-xl rounded-xl 
          shadow-[0_4px_30px_rgba(0,0,0,0.4),0_0_60px_rgba(99,102,241,0.08)]
          border border-white/10 overflow-hidden">
          
          {/* Button row */}
          <div className="flex">
            {actions.map((action, i) => {
              const config = actionConfig[action]
              const isDisabled = config?.disabled
              const isAsk = action === 'ask'
              
              return (
                <button
                  key={action}
                  onClick={() => {
                    if (isDisabled) return
                    if (isAsk) {
                      setIsAskExpanded(!isAskExpanded)
                    } else {
                      onAction(action, selection)
                    }
                  }}
                  disabled={isDisabled}
                  title={isDisabled ? 'Coming soon' : undefined}
                  className={`
                    group px-4 py-2.5 transition-all duration-200 
                    flex items-center gap-2.5 text-sm font-medium
                    ${config?.hoverBg}
                    ${i < actions.length - 1 ? 'border-r border-white/10' : ''}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}
                    ${isAsk && isAskExpanded ? 'bg-amber-500/20' : ''}
                  `}
                >
                  <span className={`text-lg transition-transform duration-200 
                    ${!isDisabled && 'group-hover:scale-110'}`}>
                    {config?.icon}
                  </span>
                  <span className={`transition-colors duration-200 
                    ${config?.restingText} ${config?.hoverText}`}>
                    {config?.label}
                  </span>
                </button>
              )
            })}
          </div>
          
          {/* Expandable question input */}
          {isAskExpanded && (
            <div className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAskSubmit()
                    }
                  }}
                  placeholder="What would you like to know?"
                  className="flex-1 bg-gray-800/50 text-white text-sm px-3 py-2 rounded-lg
                    border border-white/10 focus:border-amber-500/50 focus:outline-none
                    placeholder:text-gray-500"
                  disabled={isSubmitting}
                />
                <button
                  onClick={handleAskSubmit}
                  disabled={!question.trim() || isSubmitting}
                  className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 
                    text-amber-300 rounded-lg text-sm font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                >
                  {isSubmitting ? '...' : '→'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Ask any question about "{selection.slice(0, 30)}{selection.length > 30 ? '...' : ''}"
              </p>
            </div>
          )}
        </div>
        
        {/* No arrow - cleaner look (Medium-style) */}
      </div>
    </>
  )
}

/**
 * Expandable annotation component (for explain/branch results)
 */
export const Annotation = ({ 
  id, 
  type = 'explain', 
  trigger, 
  children, 
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  const typeStyles = {
    explain: 'border-blue-200 bg-blue-50',
    visualize: 'border-purple-200 bg-purple-50',
    branch: 'border-green-200 bg-green-50',
  }

  const typeIcons = {
    explain: '💡',
    visualize: '📊',
    branch: '🌿',
  }

  return (
    <span className="annotation-wrapper inline">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-sm bg-yellow-100 hover:bg-yellow-200 rounded border border-yellow-300 transition-colors mx-1"
        title={`${isOpen ? 'Hide' : 'Show'} ${type}`}
      >
        <span>{typeIcons[type]}</span>
        <span className="underline decoration-dotted">{trigger}</span>
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className={`annotation-content block my-3 p-4 rounded-lg border-l-4 ${typeStyles[type]}`}>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
            <span>{typeIcons[type]}</span>
            <span className="capitalize">{type}</span>
          </div>
          <div className="text-gray-800">{children}</div>
        </div>
      )}
    </span>
  )
}

/**
 * Footnote-style annotation (less intrusive)
 */
export const FootnoteAnnotation = ({ id, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <sup 
        className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        [{id}]
      </sup>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 p-6 max-h-[80vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-medium text-gray-500">Annotation [{id}]</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Premium loading state for when annotation is being generated
 */
export const AnnotationLoading = ({ type }) => {
  const typeConfig = {
    explain: { icon: '💡', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    visualize: { icon: '📊', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    branch: { icon: '🌿', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  }
  const config = typeConfig[type] || typeConfig.explain
  
  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm 
      ${config.bg} border ${config.border} shadow-lg backdrop-blur-sm`}>
      <span className="animate-spin text-lg">⏳</span>
      <span className={`font-medium ${config.color}`}>
        Generating {type}...
      </span>
    </div>
  )
}

/**
 * Container wrapper that enables annotation on its children
 */
export const AnnotatableContent = ({ 
  children, 
  onAnnotationRequest,
  tutorialId,
  className = '' 
}) => {
  const containerRef = useRef(null)
  const { selection, position, clearSelection } = useTextSelection(containerRef)
  const [loading, setLoading] = useState(null)

  const handleAction = async (action, sel, question = null) => {
    console.log('Annotation requested:', { action, selection: sel, tutorialId, question })
    
    setLoading(action)
    clearSelection()

    try {
      await onAnnotationRequest?.({
        action,
        selectedText: sel.text,
        context: sel.context,
        tutorialId,
        question, // Pass the question for 'ask' action
      })
    } catch (err) {
      console.error('Annotation error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div ref={containerRef} className={`annotatable-content ${className}`}>
      {children}
      
      <SelectionPopup
        selection={selection}
        position={position}
        onAction={handleAction}
        onClose={clearSelection}
      />
      
      {loading && (
        <div className="fixed bottom-4 right-4 z-50">
          <AnnotationLoading type={loading} />
        </div>
      )}
    </div>
  )
}

export default {
  useTextSelection,
  SelectionPopup,
  Annotation,
  FootnoteAnnotation,
  AnnotationLoading,
  AnnotatableContent,
}
