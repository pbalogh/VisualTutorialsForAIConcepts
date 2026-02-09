/**
 * VisualizableContent
 * 
 * Wraps AnnotatableContent to add visualization capability.
 * When user selects text and clicks "Visualize", generates and displays
 * an inline visualization.
 */

import React, { useState, useRef, useCallback } from 'react'
import { useTextSelection, SelectionPopup, AnnotationLoading } from './AnnotationSystem'
import { useMockVisualize } from './visualizations/templates/useVisualize'
import { VisualizationRenderer } from './visualizations/templates/VisualizationRenderer'

export function VisualizableContent({
  children,
  onAnnotationRequest,
  tutorialId,
  className = '',
  // Enable real AI endpoint vs mock (default: mock for development)
  useRealApi = false,
  apiEndpoint = '/api/visualize',
}) {
  const containerRef = useRef(null)
  const { selection, position, clearSelection } = useTextSelection(containerRef)
  const [loading, setLoading] = useState(null)
  
  // Visualization state
  const [visualizations, setVisualizations] = useState([]) // Array of { id, result, text }
  const { visualize, isLoading: vizLoading, result: vizResult } = useMockVisualize()
  const [pendingViz, setPendingViz] = useState(null) // Holds the selection while loading

  const handleAction = useCallback(async (action, sel, question = null) => {
    console.log('Action requested:', { action, selection: sel, tutorialId, question })
    
    // Handle visualize action specially
    if (action === 'visualize') {
      setPendingViz({ text: sel.text, context: sel.context })
      clearSelection()
      
      const result = await visualize(sel.text, sel.context)
      
      if (result) {
        const vizId = Date.now()
        setVisualizations(prev => [...prev, {
          id: vizId,
          result,
          text: sel.text.slice(0, 50) + (sel.text.length > 50 ? '...' : '')
        }])
      }
      setPendingViz(null)
      return
    }
    
    // Pass other actions to the normal handler
    setLoading(action)
    clearSelection()

    try {
      await onAnnotationRequest?.({
        action,
        selectedText: sel.text,
        context: sel.context,
        tutorialId,
        question,
      })
    } catch (err) {
      console.error('Annotation error:', err)
    } finally {
      setLoading(null)
    }
  }, [onAnnotationRequest, tutorialId, clearSelection, visualize])

  const removeVisualization = useCallback((id) => {
    setVisualizations(prev => prev.filter(v => v.id !== id))
  }, [])

  return (
    <div ref={containerRef} className={`visualizable-content ${className}`}>
      {children}
      
      {/* Inline visualizations */}
      {visualizations.length > 0 && (
        <div className="visualizations-container mt-6 space-y-4">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Generated Visualizations
          </div>
          {visualizations.map(viz => (
            <div key={viz.id} className="relative">
              <div className="text-xs text-slate-400 mb-1">
                From: "{viz.text}"
              </div>
              <VisualizationRenderer
                result={viz.result}
                isLoading={false}
                onClose={() => removeVisualization(viz.id)}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Selection popup */}
      <SelectionPopup
        selection={selection}
        position={position}
        onAction={handleAction}
        onClose={clearSelection}
        actions={['explain', 'visualize', 'branch', 'ask', 'footnote', 'source']}
      />
      
      {/* Loading indicator */}
      {(loading || pendingViz) && (
        <div className="fixed bottom-4 right-4 z-50">
          <AnnotationLoading type={loading || 'visualize'} />
        </div>
      )}
    </div>
  )
}

export default VisualizableContent
