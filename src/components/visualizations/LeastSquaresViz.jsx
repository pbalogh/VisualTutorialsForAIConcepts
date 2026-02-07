/**
 * Least Squares Visualization Components
 * Extracted/simplified from LeastSquares.jsx for the JSON-driven tutorial engine
 */
import React, { useState, useMemo } from 'react'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

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
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const b = (sumY - m * sumX) / n
  return { m: isNaN(m) ? 0 : m, b: isNaN(b) ? 0 : b }
}

function calculateResiduals(points, m, b) {
  return points.map(p => ({
    x: p.x,
    y: p.y,
    predicted: m * p.x + b,
    residual: p.y - (m * p.x + b)
  }))
}

function sumSquaredResiduals(points, m, b) {
  return points.reduce((sum, p) => sum + Math.pow(p.y - (m * p.x + b), 2), 0)
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScatterPlot({ points, setPoints, showLine, showResiduals, m, b }) {
  const width = 500, height = 400, padding = 50
  
  const allX = points.map(p => p.x)
  const allY = points.map(p => p.y)
  const xMin = Math.min(0, ...allX) - 1, xMax = Math.max(10, ...allX) + 1
  const yMin = Math.min(0, ...allY) - 1, yMax = Math.max(10, ...allY) + 1
  
  const scaleX = (x) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding)
  const scaleY = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding)
  
  const handleClick = (e) => {
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
    <svg width={width} height={height} style={{ background: '#0f0f1a', borderRadius: 8, cursor: 'crosshair' }} onClick={handleClick}>
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
          stroke="#6366f1"
          strokeWidth={2}
        />
      )}
      
      {/* Residuals */}
      {showResiduals && points.map((p, i) => (
        <line key={i}
          x1={scaleX(p.x)} y1={scaleY(p.y)}
          x2={scaleX(p.x)} y2={scaleY(m * p.x + b)}
          stroke="#ef4444" strokeWidth={2} strokeDasharray="4,2"
        />
      ))}
      
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={6} fill="#22c55e" stroke="#fff" strokeWidth={2} />
      ))}
      
      {/* Click instruction */}
      {points.length < 2 && (
        <text x={width / 2} y={height / 2} fill="#888" fontSize={14} textAnchor="middle">Click to add points</text>
      )}
    </svg>
  )
}

function EquationDisplay({ m, b, ssr }) {
  return (
    <div style={{ background: '#1a1a2e', padding: '1rem', borderRadius: 8 }}>
      <h4 style={{ color: '#6366f1', margin: '0 0 0.5rem 0' }}>Best Fit Line</h4>
      <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#e8e8e8' }}>
        y = {m.toFixed(3)}x {b >= 0 ? '+' : '-'} {Math.abs(b).toFixed(3)}
      </div>
      <div style={{ color: '#888', marginTop: '0.5rem', fontSize: '0.9rem' }}>
        Sum of Squared Residuals: <span style={{ color: '#f59e0b' }}>{ssr.toFixed(4)}</span>
      </div>
    </div>
  )
}

function ManualControls({ m, b, setM, setB, bestM, bestB }) {
  return (
    <div style={{ background: '#1a1a3e', padding: '1rem', borderRadius: 8 }}>
      <h4 style={{ color: '#f59e0b', margin: '0 0 1rem 0' }}>Adjust Line Manually</h4>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#888', display: 'block', marginBottom: '0.25rem' }}>Slope (m): {m.toFixed(2)}</label>
        <input type="range" min="-2" max="3" step="0.1" value={m} onChange={(e) => setM(parseFloat(e.target.value))} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#888', display: 'block', marginBottom: '0.25rem' }}>Intercept (b): {b.toFixed(2)}</label>
        <input type="range" min="-3" max="5" step="0.1" value={b} onChange={(e) => setB(parseFloat(e.target.value))} style={{ width: '100%' }} />
      </div>
      <button onClick={() => { setM(bestM); setB(bestB) }} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer', width: '100%' }}>
        Snap to Best Fit
      </button>
    </div>
  )
}

// ============================================================================
// MAIN EXPORTED COMPONENT
// ============================================================================

export function LeastSquaresPlayground() {
  const [points, setPoints] = useState([
    { x: 1, y: 2.1 }, { x: 2, y: 3.8 }, { x: 3, y: 4.2 },
    { x: 4, y: 5.5 }, { x: 5, y: 6.9 }, { x: 6, y: 7.2 }
  ])
  const [showLine, setShowLine] = useState(true)
  const [showResiduals, setShowResiduals] = useState(true)
  const [manualMode, setManualMode] = useState(false)
  const [manualM, setManualM] = useState(1)
  const [manualB, setManualB] = useState(1)
  
  const bestFit = useMemo(() => leastSquaresLine(points), [points])
  const activeLine = manualMode ? { m: manualM, b: manualB } : bestFit
  const ssr = useMemo(() => sumSquaredResiduals(points, activeLine.m, activeLine.b), [points, activeLine])
  const bestSsr = useMemo(() => sumSquaredResiduals(points, bestFit.m, bestFit.b), [points, bestFit])
  
  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center', background: '#1a1a2e', padding: '1rem', borderRadius: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e8e8e8', cursor: 'pointer' }}>
          <input type="checkbox" checked={showLine} onChange={(e) => setShowLine(e.target.checked)} /> Show Line
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e8e8e8', cursor: 'pointer' }}>
          <input type="checkbox" checked={showResiduals} onChange={(e) => setShowResiduals(e.target.checked)} /> Show Residuals
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e8e8e8', cursor: 'pointer' }}>
          <input type="checkbox" checked={manualMode} onChange={(e) => setManualMode(e.target.checked)} /> Manual Mode
        </label>
        <button onClick={() => setPoints([])} style={{ background: '#3a3a5e', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>
          Clear Points
        </button>
      </div>
      
      {/* Main visualization */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <ScatterPlot points={points} setPoints={setPoints} showLine={showLine} showResiduals={showResiduals} m={activeLine.m} b={activeLine.b} />
        </div>
        <div style={{ flex: 1, minWidth: 250 }}>
          <EquationDisplay m={activeLine.m} b={activeLine.b} ssr={ssr} />
          {manualMode && (
            <div style={{ marginTop: '1rem' }}>
              <ManualControls m={manualM} b={manualB} setM={setManualM} setB={setManualB} bestM={bestFit.m} bestB={bestFit.b} />
              <div style={{ marginTop: '1rem', padding: '1rem', background: Math.abs(ssr - bestSsr) < 0.01 ? '#22c55e22' : '#ef444422', borderRadius: 8, color: '#e8e8e8' }}>
                {Math.abs(ssr - bestSsr) < 0.01 ? (
                  <span>✅ Your line matches the best fit!</span>
                ) : (
                  <span>Your SSR: {ssr.toFixed(2)} | Best: {bestSsr.toFixed(2)} | Difference: {(ssr - bestSsr).toFixed(2)}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeastSquaresPlayground
