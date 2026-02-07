/**
 * ThoughtBlend - Color Wheel Source Synthesis
 * 
 * A tool for exploring ideas through dialectical synthesis.
 * Users add sources as "color swatches" on a wheel, and the system
 * helps them find opposing/orthogonal sources to create rich mixtures.
 */

import React, { useState, useCallback } from 'react'
import ColorWheel from './ColorWheel'
import SourcePanel from './SourcePanel'
import MixturePanel from './MixturePanel'
import SourceUploader from './SourceUploader'

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

  // Add a source at a position
  const addSource = useCallback((position, source) => {
    setWheel(prev => ({
      ...prev,
      sources: {
        ...prev.sources,
        [position]: {
          ...source,
          magnitude: 1.0, // default full strength
          addedAt: Date.now(),
        }
      }
    }))
    setIsUploading(false)
    setSelectedPosition(null)
  }, [])

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
    } else {
      // Empty slot - open uploader
      setSelectedPosition(position)
      setIsUploading(true)
    }
  }, [wheel.sources])

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
                suggestions={suggestions}
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

// Getting started panel
function GettingStarted({ onStart }) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
      <h2 className="text-xl font-bold text-white mb-4">How it works</h2>
      
      <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
        <div className="flex gap-3">
          <span className="text-2xl">🟢</span>
          <p>
            <strong className="text-white">Add your first source</strong> — 
            an ebook, article, or URL that represents one perspective.
          </p>
        </div>
        
        <div className="flex gap-3">
          <span className="text-2xl">🔴</span>
          <p>
            <strong className="text-white">Find its opposite</strong> — 
            we'll suggest sources that contradict or challenge your first one.
          </p>
        </div>
        
        <div className="flex gap-3">
          <span className="text-2xl">🟡</span>
          <p>
            <strong className="text-white">Add orthogonal voices</strong> — 
            fill in the wheel with perspectives that span the space between.
          </p>
        </div>
        
        <div className="flex gap-3">
          <span className="text-2xl">⚪</span>
          <p>
            <strong className="text-white">Generate a synthesis</strong> — 
            the center of the wheel blends all voices into structured text or dialogue.
          </p>
        </div>
      </div>

      <button
        onClick={onStart}
        className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 
          text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600
          transition-all duration-200 shadow-lg shadow-emerald-500/25"
      >
        Add your first source →
      </button>
    </div>
  )
}
