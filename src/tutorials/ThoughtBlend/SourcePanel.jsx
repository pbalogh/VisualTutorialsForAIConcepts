/**
 * SourcePanel - View and edit a source's properties
 */

import React from 'react'
import { getPositionColor, getOppositePosition } from './ColorWheel'

export default function SourcePanel({ 
  source, 
  position, 
  onMagnitudeChange, 
  onRemove,
  onClose 
}) {
  const color = getPositionColor(position)
  const oppositePos = getOppositePosition(position)
  
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
      {/* Header with source color */}
      <div 
        className="px-6 py-4 border-b border-white/10"
        style={{ backgroundColor: `${color}20` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                Position {position + 1}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {source.title || 'Untitled Source'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Source type & info */}
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Source</div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-lg">
              {source.type === 'url' ? '🔗' : source.type === 'file' ? '📄' : '📝'}
            </span>
            <span className="text-sm truncate">
              {source.url || source.filename || 'Manual entry'}
            </span>
          </div>
        </div>

        {/* Summary */}
        {source.summary && (
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Summary</div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {source.summary}
            </p>
          </div>
        )}

        {/* Stance */}
        {source.stance && (
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Stance</div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {source.stance}
            </p>
          </div>
        )}

        {/* Key themes */}
        {source.themes?.length > 0 && (
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Key Themes</div>
            <div className="flex flex-wrap gap-2">
              {source.themes.map((theme, i) => (
                <span 
                  key={i}
                  className="px-2.5 py-1 text-xs rounded-full"
                  style={{ 
                    backgroundColor: `${color}25`,
                    color: getPositionColor(position, 80, 75)
                  }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key points */}
        {source.keyPoints?.length > 0 && (
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Key Points</div>
            <ul className="space-y-1.5">
              {source.keyPoints.map((point, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-slate-500">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Magnitude slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              Influence
            </span>
            <span className="text-sm text-slate-300">
              {Math.round(source.magnitude * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={source.magnitude}
            onChange={(e) => onMagnitudeChange(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${color} ${source.magnitude * 100}%, rgba(255,255,255,0.1) ${source.magnitude * 100}%)`
            }}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Subtle</span>
            <span>Dominant</span>
          </div>
        </div>

        {/* Opposite source hint */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getPositionColor(oppositePos) }}
            />
            <span>
              Position {oppositePos + 1} is the natural opposite
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onRemove}
            className="flex-1 py-2 px-4 text-sm text-red-400 border border-red-400/30 
              rounded-lg hover:bg-red-400/10 transition-colors"
          >
            Remove
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 text-sm text-white bg-white/10 
              rounded-lg hover:bg-white/20 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
