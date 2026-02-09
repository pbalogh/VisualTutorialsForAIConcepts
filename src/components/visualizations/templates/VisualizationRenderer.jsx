/**
 * VisualizationRenderer
 * 
 * Takes a visualization spec from AI and renders it inline.
 * Handles loading, error states, and the "can't visualize" case.
 */

import React from 'react'
import { renderVisualization } from './index.jsx'

export function VisualizationRenderer({ 
  result, 
  isLoading, 
  error, 
  onClose,
  onRetry 
}) {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-slate-800/95 rounded-xl p-6 my-4 border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full" />
          <span className="text-slate-300">Generating visualization...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-900/30 rounded-xl p-4 my-4 border border-red-700/50">
        <div className="flex items-start gap-3">
          <span className="text-red-400 text-lg">⚠️</span>
          <div className="flex-1">
            <p className="text-red-300 font-medium">Visualization failed</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="text-sm px-3 py-1 bg-red-800/50 hover:bg-red-800 text-red-200 rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  // No result yet
  if (!result) {
    return null
  }

  // Can't visualize
  if (!result.canVisualize) {
    return (
      <div className="bg-amber-900/30 rounded-xl p-4 my-4 border border-amber-700/50">
        <div className="flex items-start gap-3">
          <span className="text-amber-400 text-lg">💭</span>
          <div className="flex-1">
            <p className="text-amber-300 font-medium">Can't visualize this</p>
            <p className="text-amber-400/80 text-sm mt-1">{result.reason}</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-amber-400/60 hover:text-amber-400 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  // Render the visualization
  const visualization = renderVisualization({
    template: result.template,
    config: result.config
  })

  if (!visualization) {
    return (
      <div className="bg-red-900/30 rounded-xl p-4 my-4 border border-red-700/50">
        <p className="text-red-300">Unknown template: {result.template}</p>
      </div>
    )
  }

  return (
    <div className="relative my-4">
      {/* Close button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          ✕
        </button>
      )}
      
      {/* The visualization */}
      {visualization}
      
      {/* Explanation */}
      {result.explanation && (
        <div className="mt-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400">
          <span className="font-medium text-purple-600 dark:text-purple-400">💡 </span>
          {result.explanation}
        </div>
      )}
    </div>
  )
}

/**
 * Inline visualization that can be embedded in tutorial content
 */
export function InlineVisualization({ spec }) {
  if (!spec || !spec.template) {
    return null
  }

  const visualization = renderVisualization(spec)
  
  if (!visualization) {
    console.warn('Failed to render visualization:', spec)
    return null
  }

  return (
    <div className="inline-visualization my-4">
      {visualization}
      {spec.annotation && (
        <p className="text-sm text-slate-500 mt-2 italic">{spec.annotation}</p>
      )}
    </div>
  )
}

export default VisualizationRenderer
