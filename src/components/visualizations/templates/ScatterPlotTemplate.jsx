/**
 * ScatterPlotTemplate
 * 
 * Config-driven scatter plot with optional regression line and residuals
 */

import React, { useState, useMemo } from 'react'

function leastSquaresLine(points) {
  if (points.length < 2) return { m: 0, b: 0 }
  const n = points.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (const p of points) {
    sumX += p.x
    sumY += p.y
    sumXY += p.x * p.y
    sumX2 += p.x * p.x
  }
  const denom = n * sumX2 - sumX * sumX
  if (Math.abs(denom) < 0.0001) return { m: 0, b: sumY / n }
  const m = (n * sumXY - sumX * sumY) / denom
  const b = (sumY - m * sumX) / n
  return { m: isNaN(m) ? 0 : m, b: isNaN(b) ? 0 : b }
}

function sumSquaredResiduals(points, m, b) {
  return points.reduce((sum, p) => sum + Math.pow(p.y - (m * p.x + b), 2), 0)
}

export function ScatterPlotTemplate({
  points: initialPoints = [],
  showLine = true,
  showResiduals = false,
  interactive = true,
  lineColor = '#6366f1',
  pointColor = '#22c55e',
  width = 450,
  height = 350,
  annotation = null,
}) {
  const [points, setPoints] = useState(initialPoints.length > 0 ? initialPoints : [
    { x: 1, y: 2 }, { x: 2, y: 3.5 }, { x: 3, y: 4 },
    { x: 4, y: 5.5 }, { x: 5, y: 6 }
  ])
  
  const padding = 50
  
  // Compute bounds
  const allX = points.map(p => p.x)
  const allY = points.map(p => p.y)
  const xMin = points.length > 0 ? Math.min(0, ...allX) - 1 : 0
  const xMax = points.length > 0 ? Math.max(10, ...allX) + 1 : 10
  const yMin = points.length > 0 ? Math.min(0, ...allY) - 1 : 0
  const yMax = points.length > 0 ? Math.max(10, ...allY) + 1 : 10
  
  const scaleX = (x) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding)
  const scaleY = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding)
  
  const { m, b } = useMemo(() => leastSquaresLine(points), [points])
  const ssr = useMemo(() => sumSquaredResiduals(points, m, b), [points, m, b])
  
  const handleClick = (e) => {
    if (!interactive) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const x = xMin + ((px - padding) / (width - 2 * padding)) * (xMax - xMin)
    const y = yMin + ((height - py - padding) / (height - 2 * padding)) * (yMax - yMin)
    if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
      setPoints([...points, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }])
    }
  }
  
  return (
    <div className="bg-slate-900 rounded-xl p-4 my-4">
      <svg 
        width={width} 
        height={height} 
        className="rounded-lg"
        style={{ background: '#0f0f1a', cursor: interactive ? 'crosshair' : 'default' }}
        onClick={handleClick}
      >
        {/* Grid */}
        {[...Array(11)].map((_, i) => (
          <g key={i}>
            <line x1={scaleX(i)} y1={padding} x2={scaleX(i)} y2={height - padding} stroke="#2a2a4e" />
            <line x1={padding} y1={scaleY(i)} x2={width - padding} y2={scaleY(i)} stroke="#2a2a4e" />
          </g>
        ))}
        
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4a5568" strokeWidth={2} />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4a5568" strokeWidth={2} />
        
        {/* Axis labels */}
        <text x={width / 2} y={height - 10} fill="#888" fontSize={12} textAnchor="middle">x</text>
        <text x={15} y={height / 2} fill="#888" fontSize={12} textAnchor="middle" transform={`rotate(-90, 15, ${height/2})`}>y</text>
        
        {/* Regression line */}
        {showLine && points.length >= 2 && (
          <line
            x1={scaleX(xMin)}
            y1={scaleY(m * xMin + b)}
            x2={scaleX(xMax)}
            y2={scaleY(m * xMax + b)}
            stroke={lineColor}
            strokeWidth={2}
          />
        )}
        
        {/* Residuals */}
        {showResiduals && points.map((p, i) => (
          <line key={`res-${i}`}
            x1={scaleX(p.x)} y1={scaleY(p.y)}
            x2={scaleX(p.x)} y2={scaleY(m * p.x + b)}
            stroke="#ef4444" strokeWidth={2} strokeDasharray="4,2"
          />
        ))}
        
        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={6} fill={pointColor} stroke="#fff" strokeWidth={2} />
        ))}
        
        {/* Click instruction */}
        {interactive && points.length < 2 && (
          <text x={width / 2} y={height / 2} fill="#888" fontSize={14} textAnchor="middle">Click to add points</text>
        )}
      </svg>
      
      {/* Info panel */}
      <div className="mt-3 flex gap-4 flex-wrap text-sm">
        <div className="bg-slate-800 p-2 rounded-lg">
          <span className="text-slate-400">Line: </span>
          <span className="text-white font-mono">y = {m.toFixed(2)}x {b >= 0 ? '+' : '-'} {Math.abs(b).toFixed(2)}</span>
        </div>
        {showResiduals && (
          <div className="bg-slate-800 p-2 rounded-lg">
            <span className="text-slate-400">SSR: </span>
            <span className="text-amber-400 font-mono">{ssr.toFixed(3)}</span>
          </div>
        )}
        <div className="bg-slate-800 p-2 rounded-lg">
          <span className="text-slate-400">Points: </span>
          <span className="text-white">{points.length}</span>
        </div>
        {interactive && (
          <button 
            onClick={() => setPoints([])} 
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      {annotation && (
        <div className="mt-3 text-sm text-slate-400 italic">
          {annotation}
        </div>
      )}
    </div>
  )
}

export default ScatterPlotTemplate
