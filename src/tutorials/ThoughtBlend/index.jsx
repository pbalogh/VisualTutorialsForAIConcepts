/**
 * ThoughtBlend - Color Wheel Source Synthesis
 * 
 * A tool for exploring ideas through dialectical synthesis.
 * Users add sources as "color swatches" on a wheel, and the system
 * helps them find opposing/orthogonal sources to create rich mixtures.
 */

import React, { useState, useCallback, useEffect } from 'react'
import ColorWheel, { getOppositePosition } from './ColorWheel'
import SourcePanel from './SourcePanel'
import MixturePanel from './MixturePanel'
import SourceUploader from './SourceUploader'
import { API_BASE } from '../../config.js'

// Initial state with no sources
const createEmptyWheel = () => ({
  sources: {}, // keyed by position (0-11 for 12 positions around wheel)
  mixture: {
    acrimony: 0.5, // 0 = harmonious synthesis, 1 = heated debate
    mode: 'structured', // 'structured' | 'dialogue'
    output: null,
  }
})

export default function ThoughtBlend() {
  const [wheel, setWheel] = useState(createEmptyWheel)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  // Fetch suggestions when sources change
  const fetchSuggestions = useCallback(async (sources) => {
    const sourceList = Object.values(sources)
    if (sourceList.length === 0) {
      setSuggestions(null)
      return
    }
    
    // Use the first source (or the one with most content) to generate suggestions
    const primarySource = sourceList[0]
    
    setIsLoadingSuggestions(true)
    try {
      const response = await fetch(`${API_BASE}/thoughtblend/suggest-opposite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: primarySource })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])

  // Add a source at a position
  const addSource = useCallback((position, source) => {
    setWheel(prev => {
      const newSources = {
        ...prev.sources,
        [position]: {
          ...source,
          magnitude: 1.0, // default full strength
          addedAt: Date.now(),
        }
      }
      
      // Fetch suggestions after adding first source
      if (Object.keys(prev.sources).length === 0) {
        setTimeout(() => fetchSuggestions(newSources), 100)
      }
      
      return {
        ...prev,
        sources: newSources
      }
    })
    setIsUploading(false)
    setSelectedPosition(null)
  }, [fetchSuggestions])

  // Update source magnitude
  const updateMagnitude = useCallback((position, magnitude) => {
    setWheel(prev => ({
      ...prev,
      sources: {
        ...prev.sources,
        [position]: {
          ...prev.sources[position],
          magnitude: Math.max(0, Math.min(1, magnitude))
        }
      }
    }))
  }, [])

  // Remove a source
  const removeSource = useCallback((position) => {
    setWheel(prev => {
      const { [position]: removed, ...rest } = prev.sources
      return { ...prev, sources: rest }
    })
  }, [])

  // Update mixture settings
  const updateMixture = useCallback((updates) => {
    setWheel(prev => ({
      ...prev,
      mixture: { ...prev.mixture, ...updates }
    }))
  }, [])

  // Handle clicking a wheel position
  const handlePositionClick = useCallback((position) => {
    const existingSource = wheel.sources[position]
    if (existingSource) {
      setSelectedPosition(position)
      setIsUploading(false)
    } else {
      // Empty slot - open uploader
      setSelectedPosition(position)
      setIsUploading(true)
    }
  }, [wheel.sources])

  // Determine if this position should show suggestions (opposite or adjacent to existing sources)
  const getSuggestionsForPosition = useCallback((position) => {
    if (!suggestions || suggestions.length === 0) return null
    
    const sourcePositions = Object.keys(wheel.sources).map(Number)
    if (sourcePositions.length === 0) return null
    
    // Check if this is the opposite position of any source
    const isOpposite = sourcePositions.some(p => getOppositePosition(p) === position)
    
    // Check if this is adjacent to any source (within 2 positions)
    const isNearSource = sourcePositions.some(p => {
      const diff = Math.abs(p - position)
      return diff <= 2 || diff >= 10 // adjacent on the wheel (wraps around)
    })
    
    // Prioritize opposite positions, then adjacent
    if (isOpposite) {
      return suggestions // Show all suggestions for opposite
    } else if (isNearSource) {
      return suggestions.slice(0, 2) // Show fewer for adjacent
    }
    
    return null
  }, [suggestions, wheel.sources])

  // Count active sources
  const sourceCount = Object.keys(wheel.sources).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🎨</span>
                ThoughtBlend
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Synthesize perspectives through dialectical color mixing
              </p>
            </div>
            <div className="text-sm text-slate-400">
              {sourceCount === 0 
                ? 'Add your first source to begin'
                : `${sourceCount} source${sourceCount === 1 ? '' : 's'} loaded`
              }
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Color wheel */}
          <div className="lg:col-span-2 flex items-center justify-center">
            <ColorWheel
              sources={wheel.sources}
              selectedPosition={selectedPosition}
              onPositionClick={handlePositionClick}
              onMagnitudeChange={updateMagnitude}
            />
          </div>

          {/* Right: Panel */}
          <div className="space-y-6">
            {isUploading ? (
              <SourceUploader
                position={selectedPosition}
                existingSources={wheel.sources}
                onAdd={addSource}
                onCancel={() => {
                  setIsUploading(false)
                  setSelectedPosition(null)
                }}
                suggestions={getSuggestionsForPosition(selectedPosition)}
                isLoadingSuggestions={isLoadingSuggestions}
              />
            ) : selectedPosition !== null && wheel.sources[selectedPosition] ? (
              <SourcePanel
                source={wheel.sources[selectedPosition]}
                position={selectedPosition}
                onMagnitudeChange={(mag) => updateMagnitude(selectedPosition, mag)}
                onRemove={() => removeSource(selectedPosition)}
                onClose={() => setSelectedPosition(null)}
              />
            ) : sourceCount > 0 ? (
              <MixturePanel
                sources={wheel.sources}
                mixture={wheel.mixture}
                onUpdateMixture={updateMixture}
              />
            ) : (
              <GettingStarted onStart={() => {
                setSelectedPosition(0)
                setIsUploading(true)
              }} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// Getting started panel - collapsible
function GettingStarted({ onStart }) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header - always visible, clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">💡</span>
          <span className="text-white font-semibold">How it works</span>
        </div>
        <svg 
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Collapsible content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 space-y-3">
          {[
            { icon: '🟢', title: 'Add your first source', desc: 'an ebook, article, or URL' },
            { icon: '🔴', title: 'Find its opposite', desc: 'a contrasting perspective' },
            { icon: '🟡', title: 'Add orthogonal voices', desc: 'fill the space between' },
            { icon: '⚪', title: 'Generate synthesis', desc: 'blend into text or dialogue' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-lg flex-shrink-0">{step.icon}</span>
              <span className="text-white font-medium">{step.title}</span>
              <span className="text-slate-400">— {step.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA button - always visible */}
      <div className="px-5 pb-5">
        <button
          onClick={onStart}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 
            text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600
            transition-all duration-200 shadow-lg shadow-emerald-500/25"
        >
          Add your first source →
        </button>
      </div>
    </div>
  )
}
