/**
 * SourceUploader - Upload or select a new source
 */

import React, { useState, useRef } from 'react'
import { getPositionColor, getOppositePosition } from './ColorWheel'

const API_BASE = 'http://localhost:5190'

export default function SourceUploader({ 
  position, 
  existingSources,
  onAdd, 
  onCancel,
  suggestions 
}) {
  const [mode, setMode] = useState('upload') // 'upload' | 'url' | 'paste'
  const [url, setUrl] = useState('')
  const [pastedText, setPastedText] = useState('')
  const [title, setTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  
  const color = getPositionColor(position)
  const sourceCount = Object.keys(existingSources).length
  const isFirstSource = sourceCount === 0
  const oppositePosition = getOppositePosition(position)
  const hasOpposite = existingSources[oppositePosition]

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setProcessingStatus('Reading file...')
    setError(null)

    try {
      const text = await file.text()
      const fileTitle = title || file.name.replace(/\.[^/.]+$/, '')
      
      setProcessingStatus('Analyzing content...')
      
      // Call API to analyze content
      const response = await fetch(`${API_BASE}/thoughtblend/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: text.slice(0, 50000),
          title: fileTitle
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Analysis failed')
      }
      
      const analysis = await response.json()
      
      onAdd(position, {
        type: 'file',
        title: fileTitle,
        filename: file.name,
        content: text.slice(0, 50000),
        summary: analysis.summary,
        themes: analysis.themes || [],
        stance: analysis.stance,
        keyPoints: analysis.keyPoints || [],
      })
    } catch (err) {
      setError('Failed to process file: ' + err.message)
      setIsProcessing(false)
    }
  }

  const handleUrlSubmit = async () => {
    if (!url.trim()) return
    
    setIsProcessing(true)
    setProcessingStatus('Fetching URL...')
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/thoughtblend/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch URL')
      }
      
      const data = await response.json()
      
      onAdd(position, {
        type: 'url',
        title: title || data.title,
        url: url.trim(),
        content: data.content,
        summary: data.summary,
        themes: data.themes || [],
        stance: data.stance,
        keyPoints: data.keyPoints || [],
      })
    } catch (err) {
      setError(err.message)
      setIsProcessing(false)
    }
  }

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) return
    
    setIsProcessing(true)
    setProcessingStatus('Analyzing content...')
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/thoughtblend/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: pastedText.trim(),
          title: title || 'Pasted text'
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Analysis failed')
      }
      
      const analysis = await response.json()
      
      onAdd(position, {
        type: 'text',
        title: title || 'Pasted text',
        content: pastedText.trim(),
        summary: analysis.summary,
        themes: analysis.themes || [],
        stance: analysis.stance,
        keyPoints: analysis.keyPoints || [],
      })
    } catch (err) {
      setError('Failed to analyze: ' + err.message)
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div 
        className="px-6 py-4 border-b border-white/10"
        style={{ backgroundColor: `${color}15` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-white font-medium">
              {isFirstSource 
                ? 'Add your first source'
                : `Add source at position ${position + 1}`
              }
            </span>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Context hint */}
        {!isFirstSource && !hasOpposite && position === oppositePosition && (
          <p className="text-xs text-slate-400 mt-2">
            💡 This is the opposite position — perfect for a contrasting view
          </p>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Mode tabs */}
        <div className="flex gap-2">
          {[
            { id: 'upload', label: 'Upload', icon: '📄' },
            { id: 'url', label: 'URL', icon: '🔗' },
            { id: 'paste', label: 'Paste', icon: '📋' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              disabled={isProcessing}
              className={`flex-1 py-2.5 px-3 text-sm rounded-lg flex items-center justify-center gap-2 transition-all border
                ${mode === tab.id 
                  ? 'bg-white/15 text-white border-white/20 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Title input (optional) */}
        <div>
          <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this source a name..."
            disabled={isProcessing}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg
              text-white placeholder-slate-400 text-sm
              focus:outline-none focus:border-white/30
              disabled:opacity-50"
          />
        </div>

        {/* Upload mode */}
        {mode === 'upload' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.epub,.html"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-8 border-2 border-dashed border-white/25 rounded-xl
                text-slate-300 hover:text-white hover:border-white/40 hover:bg-white/5
                transition-colors flex flex-col items-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm">{processingStatus}</span>
                </>
              ) : (
                <>
                  <span className="text-3xl">📁</span>
                  <span className="text-sm">Click to upload a file</span>
                  <span className="text-xs text-slate-400">
                    .txt, .md, .pdf, .epub, .html
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* URL mode */}
        {mode === 'url' && (
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg
                text-white placeholder-slate-400 text-sm
                focus:outline-none focus:border-white/30
                disabled:opacity-50"
            />
            <button
              onClick={handleUrlSubmit}
              disabled={!url.trim() || isProcessing}
              className="w-full py-2 bg-white/10 text-white text-sm rounded-lg
                hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {processingStatus}
                </>
              ) : 'Fetch & Analyze URL'}
            </button>
          </div>
        )}

        {/* Paste mode */}
        {mode === 'paste' && (
          <div className="space-y-3">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste text content here..."
              rows={6}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg
                text-white placeholder-slate-400 text-sm resize-none
                focus:outline-none focus:border-white/30
                disabled:opacity-50"
            />
            <button
              onClick={handlePasteSubmit}
              disabled={!pastedText.trim() || isProcessing}
              className="w-full py-2 bg-white/10 text-white text-sm rounded-lg
                hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {processingStatus}
                </>
              ) : 'Analyze & Add Text'}
            </button>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Suggestions (for opposite/orthogonal sources) */}
        {suggestions && suggestions.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
              Suggested contrasts
            </div>
            <div className="space-y-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMode('url')
                    setUrl(sug.searchQuery || '')
                    setTitle(sug.title)
                  }}
                  className="w-full p-3 bg-white/5 rounded-lg text-left hover:bg-white/10 transition-colors"
                >
                  <div className="text-sm text-white font-medium">{sug.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{sug.author || sug.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
