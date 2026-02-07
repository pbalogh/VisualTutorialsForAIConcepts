/**
 * MixturePanel - Configure and generate the synthesis
 */

import React, { useState } from 'react'
import { getPositionColor } from './ColorWheel'

export default function MixturePanel({ 
  sources, 
  mixture, 
  onUpdateMixture 
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutput, setGeneratedOutput] = useState(null)
  
  const sourceList = Object.entries(sources)
  const totalMagnitude = sourceList.reduce((sum, [_, s]) => sum + (s.magnitude || 1), 0)

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    // Simulate generation (in production, this would call an AI API)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setGeneratedOutput({
      title: 'Synthesized Perspectives',
      content: `# Synthesized Perspectives\n\nThis synthesis combines ${sourceList.length} sources with ${mixture.mode === 'dialogue' ? 'a dialogic' : 'a structured'} approach and ${Math.round(mixture.acrimony * 100)}% dialectical tension.\n\n## Key Tensions\n\n*Content would be generated here based on the actual sources...*`,
      generatedAt: Date.now(),
    })
    
    setIsGenerating(false)
    onUpdateMixture({ output: generatedOutput })
  }

  const handleDownload = () => {
    if (!generatedOutput) return
    
    const blob = new Blob([generatedOutput.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'thoughtblend-synthesis.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <h2 className="text-xl font-bold text-white">Mixture Settings</h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure how sources blend together
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Source breakdown */}
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Source Composition
          </div>
          <div className="space-y-2">
            {sourceList.map(([pos, source]) => {
              const percent = ((source.magnitude || 1) / totalMagnitude * 100).toFixed(0)
              return (
                <div key={pos} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getPositionColor(parseInt(pos)) }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {source.title || `Source ${parseInt(pos) + 1}`}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 w-10 text-right">
                    {percent}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Acrimony slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              Dialectical Tension
            </span>
            <span className="text-sm text-slate-400">
              {mixture.acrimony < 0.3 
                ? 'Harmonious' 
                : mixture.acrimony < 0.7 
                  ? 'Balanced'
                  : 'Contentious'
              }
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={mixture.acrimony}
            onChange={(e) => onUpdateMixture({ acrimony: parseFloat(e.target.value) })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                hsl(120, 50%, 40%) 0%, 
                hsl(60, 50%, 45%) 50%, 
                hsl(0, 60%, 50%) 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>🕊️ Synthesis</span>
            <span>⚔️ Debate</span>
          </div>
        </div>

        {/* Output mode */}
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Output Style
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onUpdateMixture({ mode: 'structured' })}
              className={`p-4 rounded-xl border text-left transition-all
                ${mixture.mode === 'structured'
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
            >
              <div className="text-2xl mb-2">📑</div>
              <div className="text-sm font-medium">Structured</div>
              <div className="text-xs text-slate-500 mt-1">
                Organized essay blending perspectives
              </div>
            </button>
            <button
              onClick={() => onUpdateMixture({ mode: 'dialogue' })}
              className={`p-4 rounded-xl border text-left transition-all
                ${mixture.mode === 'dialogue'
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
            >
              <div className="text-2xl mb-2">💬</div>
              <div className="text-sm font-medium">Dialogue</div>
              <div className="text-xs text-slate-500 mt-1">
                Turn-by-turn conversation between voices
              </div>
            </button>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || sourceList.length < 2}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 
            text-white font-medium rounded-xl 
            hover:from-indigo-600 hover:to-purple-600
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg shadow-indigo-500/25
            flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating synthesis...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate Synthesis
            </>
          )}
        </button>

        {sourceList.length < 2 && (
          <p className="text-xs text-center text-slate-500">
            Add at least 2 sources to generate a synthesis
          </p>
        )}

        {/* Generated output */}
        {generatedOutput && (
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Generated Output
              </span>
              <span className="text-xs text-slate-500">
                {new Date(generatedOutput.generatedAt).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg max-h-48 overflow-y-auto">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">
                {generatedOutput.content}
              </pre>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 py-2 px-4 text-sm text-white bg-white/10 
                  rounded-lg hover:bg-white/20 transition-colors
                  flex items-center justify-center gap-2"
              >
                <span>⬇️</span>
                Download
              </button>
              <button
                className="flex-1 py-2 px-4 text-sm text-white bg-white/10 
                  rounded-lg hover:bg-white/20 transition-colors
                  flex items-center justify-center gap-2"
              >
                <span>🌳</span>
                Tree View
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
