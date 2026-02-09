/**
 * ComplexPlaneTemplate
 * 
 * Config-driven complex number visualization with rotation
 */

import React, { useState, useEffect, useRef } from 'react'

export function ComplexPlaneTemplate({
  angle: initialAngle = 45,
  showFormula = true,
  animatable = true,
  point = [1, 0],
  width = 300,
  height = 300,
  annotation = null,
}) {
  const [angle, setAngle] = useState(initialAngle)
  const [animating, setAnimating] = useState(false)
  const canvasRef = useRef(null)
  
  const angleRad = (angle * Math.PI) / 180
  
  // Original point
  const [origX, origY] = point
  
  // Rotated point: multiply by e^(iθ) = (cos θ + i sin θ)
  // (a + bi)(cos θ + i sin θ) = (a cos θ - b sin θ) + i(a sin θ + b cos θ)
  const rotatedX = origX * Math.cos(angleRad) - origY * Math.sin(angleRad)
  const rotatedY = origX * Math.sin(angleRad) + origY * Math.cos(angleRad)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const scale = Math.min(w, h) * 0.35
    
    ctx.clearRect(0, 0, w, h)
    
    // Background
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, w, h)
    
    // Grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(cx + i * scale / 2, 0)
      ctx.lineTo(cx + i * scale / 2, h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, cy + i * scale / 2)
      ctx.lineTo(w, cy + i * scale / 2)
      ctx.stroke()
    }
    
    // Axes
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, cy)
    ctx.lineTo(w, cy)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, h)
    ctx.stroke()
    
    // Labels
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px system-ui'
    ctx.fillText('Re', w - 25, cy - 8)
    ctx.fillText('Im', cx + 8, 15)
    
    // Unit circle
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(cx, cy, scale, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Arc showing rotation
    if (Math.abs(angle) > 0.5) {
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 2
      const startAngle = Math.atan2(-origY, origX) // Note: canvas y is flipped
      ctx.beginPath()
      ctx.arc(cx, cy, scale * 0.3, startAngle, startAngle - angleRad, angle > 0)
      ctx.stroke()
      
      // Angle label
      const labelAngle = startAngle - angleRad / 2
      const labelR = scale * 0.42
      ctx.fillStyle = '#7c3aed'
      ctx.font = 'bold 12px system-ui'
      ctx.fillText(`θ=${angle}°`, cx + Math.cos(labelAngle) * labelR - 15, cy + Math.sin(labelAngle) * labelR + 4)
    }
    
    // Original point (blue)
    const origPx = cx + origX * scale
    const origPy = cy - origY * scale
    
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(origPx, origPy)
    ctx.stroke()
    
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(origPx, origPy, 6, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.fillStyle = '#1d4ed8'
    ctx.font = 'bold 11px system-ui'
    const origLabel = origY === 0 ? `z=${origX}` : `z=${origX}+${origY}i`
    ctx.fillText(origLabel, origPx + 10, origPy - 5)
    
    // Rotated point (purple)
    const rotPx = cx + rotatedX * scale
    const rotPy = cy - rotatedY * scale
    
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(rotPx, rotPy)
    ctx.stroke()
    
    ctx.fillStyle = '#8b5cf6'
    ctx.beginPath()
    ctx.arc(rotPx, rotPy, 6, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.fillStyle = '#6d28d9'
    ctx.font = 'bold 11px system-ui'
    ctx.fillText(`z·e^(iθ)`, rotPx + 10, rotPy + 12)
    
  }, [angle, angleRad, origX, origY, rotatedX, rotatedY])
  
  // Animation
  useEffect(() => {
    if (!animating) return
    
    let frame = angle
    const interval = setInterval(() => {
      frame = (frame + 2) % 360
      setAngle(frame)
    }, 30)
    
    return () => clearInterval(interval)
  }, [animating])
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 my-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-shrink-0">
          <canvas 
            ref={canvasRef} 
            width={width} 
            height={height}
            className="border border-gray-100 rounded-lg mx-auto"
          />
        </div>
        
        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Angle: {angle}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {animatable && (
            <div className="flex gap-2">
              <button
                onClick={() => setAnimating(!animating)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  animating 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-violet-100 text-violet-700'
                }`}
              >
                {animating ? '⏹ Stop' : '▶ Animate'}
              </button>
              <button
                onClick={() => setAngle(0)}
                className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700"
              >
                Reset
              </button>
            </div>
          )}
          
          {showFormula && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <div className="font-mono text-gray-800">
                e<sup>iθ</sup> = cos(θ) + i·sin(θ)
              </div>
              <div className="text-gray-600 text-xs">At θ = {angle}°:</div>
              <div className="font-mono text-violet-700">
                = {rotatedX.toFixed(3)} + {rotatedY.toFixed(3)}i
              </div>
            </div>
          )}
        </div>
      </div>
      
      {annotation && (
        <div className="mt-3 text-sm text-gray-600 italic">
          {annotation}
        </div>
      )}
    </div>
  )
}

export default ComplexPlaneTemplate
