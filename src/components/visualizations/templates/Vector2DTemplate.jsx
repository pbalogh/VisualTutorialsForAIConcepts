/**
 * Vector2D Template
 * 
 * Wraps VectorProjectionViz with a simpler config-based interface.
 */

import React, { useState, useCallback, useMemo } from 'react'

// Utility functions
function dotProduct(v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1]
}

function vectorLength(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1])
}

function scaleVector(v, s) {
  return [v[0] * s, v[1] * s]
}

function projectOnto(a, b) {
  const bLenSq = dotProduct(b, b)
  if (bLenSq === 0) return [0, 0]
  const scalar = dotProduct(a, b) / bLenSq
  return scaleVector(b, scalar)
}

// Sub-components
function CoordinateGrid({ width, height, origin }) {
  const gridLines = []
  const gridStep = 50
  
  for (let x = origin.x % gridStep; x < width; x += gridStep) {
    const isAxis = Math.abs(x - origin.x) < 1
    gridLines.push(
      <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={height}
        stroke={isAxis ? '#333' : '#e5e7eb'} strokeWidth={isAxis ? 2 : 1} />
    )
  }
  
  for (let y = origin.y % gridStep; y < height; y += gridStep) {
    const isAxis = Math.abs(y - origin.y) < 1
    gridLines.push(
      <line key={`h-${y}`} x1={0} y1={y} x2={width} y2={y}
        stroke={isAxis ? '#333' : '#e5e7eb'} strokeWidth={isAxis ? 2 : 1} />
    )
  }
  
  return <g className="grid">{gridLines}</g>
}

function Arrow({ start, end, color, strokeWidth = 2, headSize = 10, dashed = false }) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.sqrt(dx * dx + dy * dy)
  
  if (length < 1) return null
  
  const angle = Math.atan2(dy, dx)
  const headAngle = Math.PI / 6
  
  const head1 = {
    x: end.x - headSize * Math.cos(angle - headAngle),
    y: end.y - headSize * Math.sin(angle - headAngle)
  }
  const head2 = {
    x: end.x - headSize * Math.cos(angle + headAngle),
    y: end.y - headSize * Math.sin(angle + headAngle)
  }
  
  return (
    <g>
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y}
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={dashed ? '5,5' : 'none'} />
      <polygon points={`${end.x},${end.y} ${head1.x},${head1.y} ${head2.x},${head2.y}`}
        fill={color} />
    </g>
  )
}

function DraggableHandle({ cx, cy, color, onDrag, enabled = true }) {
  const [isDragging, setIsDragging] = useState(false)
  
  const handleMouseDown = (e) => {
    if (!enabled) return
    e.preventDefault()
    setIsDragging(true)
  }
  
  React.useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e) => {
      const svg = e.target.closest('svg') || document.querySelector('svg')
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      onDrag(x, y)
    }
    
    const handleMouseUp = () => setIsDragging(false)
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onDrag])
  
  if (!enabled) return null
  
  return (
    <circle cx={cx} cy={cy} r={12} fill={color} fillOpacity={0.3}
      stroke={color} strokeWidth={2} style={{ cursor: 'grab' }}
      onMouseDown={handleMouseDown} />
  )
}

/**
 * Vector2DTemplate
 * 
 * Config-driven 2D vector visualization
 */
export function Vector2DTemplate({
  vectorA = [3, 2],
  vectorB = [4, 0],
  showProjection = true,
  showDotProduct = true,
  showAngle = true,
  draggable = true,
  labels = { a: 'a', b: 'b' },
  width = 500,
  height = 350,
  annotation = null,
}) {
  const [vecA, setVecA] = useState(vectorA)
  const [vecB, setVecB] = useState(vectorB)
  
  const scale = 50
  const origin = { x: width / 2, y: height / 2 }
  
  const projection = useMemo(() => projectOnto(vecA, vecB), [vecA, vecB])
  
  const toScreen = useCallback((v) => ({
    x: origin.x + v[0] * scale,
    y: origin.y - v[1] * scale
  }), [origin, scale])
  
  const fromScreen = useCallback((x, y) => [
    (x - origin.x) / scale,
    (origin.y - y) / scale
  ], [origin, scale])
  
  const handleDragA = useCallback((x, y) => {
    setVecA(fromScreen(x, y))
  }, [fromScreen])
  
  const handleDragB = useCallback((x, y) => {
    setVecB(fromScreen(x, y))
  }, [fromScreen])
  
  const originPt = { x: origin.x, y: origin.y }
  const endA = toScreen(vecA)
  const endB = toScreen(vecB)
  const endProj = toScreen(projection)
  
  // Computed values
  const dotProd = dotProduct(vecA, vecB)
  const lenA = vectorLength(vecA)
  const lenB = vectorLength(vecB)
  const angle = lenA > 0 && lenB > 0 
    ? Math.acos(Math.max(-1, Math.min(1, dotProd / (lenA * lenB)))) * 180 / Math.PI 
    : 0
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 my-4 shadow-sm">
      <svg width={width} height={height} className="bg-white rounded-lg">
        <CoordinateGrid width={width} height={height} origin={origin} />
        
        {/* Dashed line from a to projection */}
        {showProjection && (
          <line x1={endA.x} y1={endA.y} x2={endProj.x} y2={endProj.y}
            stroke="#9ca3af" strokeWidth={1} strokeDasharray="4,4" />
        )}
        
        {/* Vector b (blue) */}
        <Arrow start={originPt} end={endB} color="#3b82f6" strokeWidth={3} headSize={12} />
        
        {/* Projection (green) */}
        {showProjection && (
          <Arrow start={originPt} end={endProj} color="#22c55e" strokeWidth={3} headSize={12} />
        )}
        
        {/* Vector a (red) */}
        <Arrow start={originPt} end={endA} color="#ef4444" strokeWidth={3} headSize={12} />
        
        {/* Draggable handles */}
        <DraggableHandle cx={endA.x} cy={endA.y} color="#ef4444" onDrag={handleDragA} enabled={draggable} />
        <DraggableHandle cx={endB.x} cy={endB.y} color="#3b82f6" onDrag={handleDragB} enabled={draggable} />
        
        {/* Labels */}
        <text x={endA.x + 15} y={endA.y - 10} fill="#ef4444" fontWeight="bold" fontSize={16}>{labels.a}</text>
        <text x={endB.x + 15} y={endB.y - 10} fill="#3b82f6" fontWeight="bold" fontSize={16}>{labels.b}</text>
        {showProjection && (
          <text x={endProj.x + 10} y={endProj.y + 20} fill="#22c55e" fontWeight="bold" fontSize={14}>proj</text>
        )}
      </svg>
      
      {/* Stats display */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="bg-red-50 p-2 rounded-lg">
          <div className="text-red-600 font-medium text-xs">{labels.a}</div>
          <div className="font-mono text-sm">[{vecA[0].toFixed(1)}, {vecA[1].toFixed(1)}]</div>
        </div>
        <div className="bg-blue-50 p-2 rounded-lg">
          <div className="text-blue-600 font-medium text-xs">{labels.b}</div>
          <div className="font-mono text-sm">[{vecB[0].toFixed(1)}, {vecB[1].toFixed(1)}]</div>
        </div>
        {showDotProduct && (
          <div className="bg-purple-50 p-2 rounded-lg">
            <div className="text-purple-600 font-medium text-xs">{labels.a} · {labels.b}</div>
            <div className="font-mono text-sm">{dotProd.toFixed(2)}</div>
          </div>
        )}
        {showAngle && (
          <div className="bg-amber-50 p-2 rounded-lg">
            <div className="text-amber-600 font-medium text-xs">Angle</div>
            <div className="font-mono text-sm">{angle.toFixed(1)}°</div>
          </div>
        )}
      </div>
      
      {annotation && (
        <div className="mt-3 text-sm text-gray-600 italic">
          {annotation}
        </div>
      )}
    </div>
  )
}

export default Vector2DTemplate
