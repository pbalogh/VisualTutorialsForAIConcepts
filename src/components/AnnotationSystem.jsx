import React, { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook to track text selection within a container
 */
export const useTextSelection = (containerRef) => {
  const [selection, setSelection] = useState(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection()
    
    console.log('📍 Selection event fired')
    console.log('  - sel:', sel)
    console.log('  - isCollapsed:', sel?.isCollapsed)
    console.log('  - toString:', sel?.toString())
    
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      console.log('  ❌ No valid selection (collapsed or empty)')
      // Don't clear immediately - let the popup handle clicks first
      return
    }

    // Check if selection is within our container
    if (containerRef?.current) {
      const range = sel.getRangeAt(0)
      const isInContainer = containerRef.current.contains(range.commonAncestorContainer)
      console.log('  - containerRef exists:', !!containerRef.current)
      console.log('  - commonAncestor:', range.commonAncestorContainer)
      console.log('  - isInContainer:', isInContainer)
      if (!isInContainer) {
        console.log('  ❌ Selection not in container')
        return
      }
    } else {
      console.log('  ⚠️ No containerRef')
    }

    const selectedText = sel.toString().trim()
    console.log('  - selectedText:', selectedText)
    console.log('  - length:', selectedText.length)
    
    if (selectedText.length < 3) {
      console.log('  ❌ Text too short (< 3 chars)')
      return // Ignore tiny selections
    }

    console.log('  ✅ Valid selection!')

    // Get position for popup
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    console.log('  - rect:', rect)
    
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
    
    console.log('  📦 Setting selection:', newSelection.text)
    console.log('  📍 Setting position:', newPosition)
    
    setSelection(newSelection)
    setPosition(newPosition)
  }, [containerRef])

  const clearSelection = useCallback(() => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    console.log('🎯 useTextSelection mounted, adding listeners')
    document.addEventListener('mouseup', handleSelectionChange)
    document.addEventListener('keyup', handleSelectionChange)
    
    return () => {
      console.log('🎯 useTextSelection unmounting, removing listeners')
      document.removeEventListener('mouseup', handleSelectionChange)
      document.removeEventListener('keyup', handleSelectionChange)
    }
  }, [handleSelectionChange])

  return { selection, position, clearSelection }
}

/**
 * Popup that appears when text is selected
 */
export const SelectionPopup = ({ 
  selection, 
  position, 
  onAction, 
  onClose,
  actions = ['explain', 'visualize', 'branch']
}) => {
  const popupRef = useRef(null)

  console.log('🎨 SelectionPopup render:', { 
    hasSelection: !!selection, 
    selectionText: selection?.text?.slice(0, 30),
    position 
  })

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        // Small delay to allow button clicks to register
        setTimeout(() => onClose?.(), 100)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (!selection) {
    console.log('🎨 SelectionPopup: no selection, returning null')
    return null
  }
  
  console.log('🎨 SelectionPopup: RENDERING popup at', position)

  const actionLabels = {
    explain: { icon: '💡', label: 'Explain' },
    visualize: { icon: '📊', label: 'Visualize' },
    branch: { icon: '🌿', label: 'Go Deeper' },
  }

  return (
    <div
      ref={popupRef}
      style={{ 
        position: 'fixed',
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px',
        zIndex: 9999,
      }}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-xl flex overflow-hidden">
        {actions.map((action) => (
          <button
            key={action}
            onClick={() => onAction(action, selection)}
            className="px-3 py-2 hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-sm font-medium border-r border-gray-700 last:border-r-0"
          >
            <span>{actionLabels[action]?.icon}</span>
            <span>{actionLabels[action]?.label}</span>
          </button>
        ))}
      </div>
      {/* Arrow pointer */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '100%' }}>
        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900" />
      </div>
    </div>
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
 * Loading state for when annotation is being generated
 */
export const AnnotationLoading = ({ type }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm text-gray-600 animate-pulse">
      <span className="animate-spin">⏳</span>
      <span>Generating {type}...</span>
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

  console.log('🔄 AnnotatableContent render:', { 
    hasSelection: !!selection, 
    selection: selection?.text?.slice(0, 30),
    position,
    tutorialId 
  })

  const handleAction = async (action, sel) => {
    console.log('Annotation requested:', { action, selection: sel, tutorialId })
    
    setLoading(action)
    clearSelection()

    try {
      await onAnnotationRequest?.({
        action,
        selectedText: sel.text,
        context: sel.context,
        tutorialId,
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
