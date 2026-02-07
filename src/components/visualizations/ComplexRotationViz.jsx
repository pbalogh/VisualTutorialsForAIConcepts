import React, { useState, useEffect, useRef } from 'react'

/**
 * ComplexRotationViz - Interactive visualization of complex number rotations
 * 
 * Shows how multiplying by e^(iθ) rotates a point in the complex plane
 */
export function ComplexRotationViz({ initialAngle = 45, showFormula = true }) {
  const [angle, setAngle] = useState(initialAngle)
  const [animating, setAnimating] = useState(false)
  const canvasRef = useRef(null)
  
  const angleRad = (angle * Math.PI) / 180
  
  // Original point (1, 0) in complex plane
  const originalX = 1
  const originalY = 0
  
  // Rotated point
  const rotatedX = Math.cos(angleRad)
  const rotatedY = Math.sin(angleRad)
  
  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const scale = Math.min(w, h) * 0.35
    
    // Clear
    ctx.clearRect(0, 0, w, h)
    
    // Background
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, w, h)
    
    // Grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let i = -2; i <= 2; i++) {
      // Vertical lines
      ctx.beginPath()
      ctx.moveTo(cx + i * scale / 2, 0)
      ctx.lineTo(cx + i * scale / 2, h)
      ctx.stroke()
      // Horizontal lines
      ctx.beginPath()
      ctx.moveTo(0, cy + i * scale / 2)
      ctx.lineTo(w, cy + i * scale / 2)
      ctx.stroke()
    }
    
    // Axes
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 2
    // X axis (Real)
    ctx.beginPath()
    ctx.moveTo(0, cy)
    ctx.lineTo(w, cy)
    ctx.stroke()
    // Y axis (Imaginary)
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, h)
    ctx.stroke()
    
    // Axis labels
    ctx.fillStyle = '#6b7280'
    ctx.font = '14px system-ui'
    ctx.fillText('Real', w - 40, cy - 10)
    ctx.fillText('Imaginary', cx + 10, 20)
    
    // Unit circle
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(cx, cy, scale, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Arc showing rotation angle
    if (angle !== 0) {
      ctx.strokeStyle = '#8b5cf6'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, scale * 0.3, 0, -angleRad, angle > 0)
      ctx.stroke()
      
      // Angle label
      const labelAngle = -angleRad / 2
      const labelR = scale * 0.4
      ctx.fillStyle = '#7c3aed'
      ctx.font = 'bold 14px system-ui'
      ctx.fillText(`θ = ${angle}°`, cx + Math.cos(labelAngle) * labelR - 20, cy + Math.sin(labelAngle) * labelR)
    }
    
    // Original point (blue)
    const origPx = cx + originalX * scale
    const origPy = cy - originalY * scale
    
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(origPx, origPy)
    ctx.stroke()
    
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(origPx, origPy, 8, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.fillStyle = '#1d4ed8'
    ctx.font = 'bold 12px system-ui'
    ctx.fillText('z = 1', origPx + 12, origPy + 4)
    
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
    ctx.arc(rotPx, rotPy, 8, 0, 2 * Math.PI)
    ctx.fill()
    
    ctx.fillStyle = '#6d28d9'
    ctx.font = 'bold 12px system-ui'
    const rotLabel = `z × e^(i${angle}°)`
    ctx.fillText(rotLabel, rotPx + 12, rotPy + 4)
    
  }, [angle, angleRad, originalX, originalY, rotatedX, rotatedY])
  
  // Animation
  useEffect(() => {
    if (!animating) return
    
    let frame = 0
    const interval = setInterval(() => {
      frame += 2
      if (frame > 360) frame = 0
      setAngle(frame)
    }, 30)
    
    return () => clearInterval(interval)
  }, [animating])
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 my-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Canvas */}
        <div className="flex-1">
          <canvas 
            ref={canvasRef} 
            width={300} 
            height={300}
            className="w-full max-w-[300px] mx-auto border border-gray-100 rounded-lg"
          />
        </div>
        
        {/* Controls & Explanation */}
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotation Angle: {angle}°
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
          
          <div className="flex gap-2">
            <button
              onClick={() => setAnimating(!animating)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                animating 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
              }`}
            >
              {animating ? '⏹ Stop' : '▶ Animate'}
            </button>
            <button
              onClick={() => setAngle(0)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
          </div>
          
          {showFormula && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
              <div className="font-mono text-gray-800">
                e<sup>iθ</sup> = cos(θ) + i·sin(θ)
              </div>
              <div className="text-gray-600">
                At θ = {angle}°:
              </div>
              <div className="font-mono text-violet-700">
                e<sup>i·{angle}°</sup> = {rotatedX.toFixed(3)} + {rotatedY.toFixed(3)}i
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <strong>Key insight:</strong> Multiplying a complex number by e<sup>iθ</sup> rotates it by angle θ. 
        This is why complex numbers are perfect for representing rotational operators.
      </div>
    </div>
  )
}

/**
 * ComplexVectorViz - Shows real vs complex vector representation
 */
export function ComplexVectorViz() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 my-6">
      <h4 className="font-semibold text-gray-900 mb-4">Real vs Complex Vectors</h4>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Real Vector */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Real Vector (BERT-style)</h5>
          <div className="font-mono text-sm text-blue-800 mb-3">
            [0.23, -1.56, 0.89, ...]
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 768 real numbers</li>
            <li>• 768 parameters total</li>
            <li>• Each dim is a single value</li>
          </ul>
        </div>
        
        {/* Complex Vector */}
        <div className="bg-violet-50 rounded-lg p-4">
          <h5 className="font-medium text-violet-900 mb-2">Complex Vector (RotatE-style)</h5>
          <div className="font-mono text-sm text-violet-800 mb-3">
            [(0.23 + 0.45i), (-1.56 + 0.12i), ...]
          </div>
          <ul className="text-sm text-violet-700 space-y-1">
            <li>• 64 complex numbers</li>
            <li>• 128 parameters total (64×2)</li>
            <li>• Each dim has real + imaginary</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-amber-50 rounded-lg">
        <h5 className="font-medium text-amber-900 mb-1">Why does this matter?</h5>
        <p className="text-sm text-amber-800">
          Complex vectors let us represent <strong>rotations</strong> naturally. 
          When an operator "transforms" an entity, it's literally rotating each dimension 
          of the entity's vector by some angle. This is mathematically cleaner than 
          trying to do transformations with real vectors.
        </p>
      </div>
    </div>
  )
}

/**
 * DimensionalityChoiceViz - Explains the choice between 768 and smaller dimensions
 */
export function DimensionalityChoiceViz() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 my-6">
      <h4 className="font-semibold text-gray-900 mb-4">Dimensionality Choice</h4>
      
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Option A: Match BERT (768 complex dims)</h5>
          <div className="grid grid-cols-3 gap-2 text-sm mb-2">
            <div className="bg-white rounded p-2 text-center">
              <div className="font-bold text-lg text-gray-900">768</div>
              <div className="text-gray-500">complex dims</div>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <div className="font-bold text-lg text-gray-900">1,536</div>
              <div className="text-gray-500">params/entity</div>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <div className="font-bold text-lg text-red-600">Heavy</div>
              <div className="text-gray-500">compute</div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            ✓ Can initialize directly from BERT embeddings<br/>
            ✗ 2× parameters, expensive to train
          </p>
        </div>
        
        <div className="bg-violet-50 rounded-lg p-4 ring-2 ring-violet-300">
          <h5 className="font-medium text-violet-900 mb-2">Option B: Smaller Space (64-128 complex dims) ⭐ Recommended</h5>
          <div className="grid grid-cols-3 gap-2 text-sm mb-2">
            <div className="bg-white rounded p-2 text-center">
              <div className="font-bold text-lg text-violet-900">64</div>
              <div className="text-gray-500">complex dims</div>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <div className="font-bold text-lg text-violet-900">128</div>
              <div className="text-gray-500">params/entity</div>
            </div>
            <div className="bg-white rounded p-2 text-center">
              <div className="font-bold text-lg text-green-600">Light</div>
              <div className="text-gray-500">compute</div>
            </div>
          </div>
          <p className="text-sm text-violet-700">
            ✓ RotatE paper uses 500-1000 dims successfully<br/>
            ✓ Our Phase 1 used 64 dims with 88% recovery<br/>
            ✓ Project from BERT space → smaller complex space
          </p>
        </div>
      </div>
    </div>
  )
}

export default ComplexRotationViz
