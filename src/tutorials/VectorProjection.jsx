import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Container } from '../components/SharedUI.jsx'

// ============================================================================
// VECTOR PROJECTION TUTORIAL
// Interactive exploration of projecting one 2D vector onto another
// ============================================================================

// Utility functions
function dotProduct(v1, v2) {
  return v1[0] * v2[0] + v1[1] * v2[1]
}

function vectorLength(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1])
}

function normalize(v) {
  const len = vectorLength(v)
  if (len === 0) return [0, 0]
  return [v[0] / len, v[1] / len]
}

function scaleVector(v, s) {
  return [v[0] * s, v[1] * s]
}

function projectOnto(a, b) {
  // Project vector a onto vector b
  // proj_b(a) = ((a · b) / (b · b)) * b
  const bLenSq = dotProduct(b, b)
  if (bLenSq === 0) return [0, 0]
  const scalar = dotProduct(a, b) / bLenSq
  return scaleVector(b, scalar)
}

// ============================================================================
// SVG CANVAS WITH COORDINATE SYSTEM
// ============================================================================

function CoordinateGrid({ width, height, scale, origin }) {
  const gridLines = []
  const gridStep = 50 // pixels per grid line
  
  // Vertical lines
  for (let x = origin.x % gridStep; x < width; x += gridStep) {
    const isAxis = Math.abs(x - origin.x) < 1
    gridLines.push(
      <line
        key={`v-${x}`}
        x1={x} y1={0} x2={x} y2={height}
        stroke={isAxis ? '#333' : '#ddd'}
        strokeWidth={isAxis ? 2 : 1}
      />
    )
  }
  
  // Horizontal lines
  for (let y = origin.y % gridStep; y < height; y += gridStep) {
    const isAxis = Math.abs(y - origin.y) < 1
    gridLines.push(
      <line
        key={`h-${y}`}
        x1={0} y1={y} x2={width} y2={y}
        stroke={isAxis ? '#333' : '#ddd'}
        strokeWidth={isAxis ? 2 : 1}
      />
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
  const headAngle = Math.PI / 6 // 30 degrees
  
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
      <line
        x1={start.x} y1={start.y}
        x2={end.x} y2={end.y}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashed ? '5,5' : 'none'}
      />
      {!dashed && (
        <polygon
          points={`${end.x},${end.y} ${head1.x},${head1.y} ${head2.x},${head2.y}`}
          fill={color}
        />
      )}
    </g>
  )
}

function DraggablePoint({ x, y, onDrag, color, radius = 8, label }) {
  const [isDragging, setIsDragging] = useState(false)
  
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e) => {
      const svg = e.target.closest('svg')
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const newX = e.clientX - rect.left
      const newY = e.clientY - rect.top
      onDrag(newX, newY)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onDrag])
  
  return (
    <g style={{ cursor: 'grab' }}>
      <circle
        cx={x} cy={y} r={radius}
        fill={color}
        stroke="white"
        strokeWidth={2}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      />
      {label && (
        <text
          x={x + radius + 5}
          y={y + 4}
          fill={color}
          fontWeight="bold"
          fontSize="14"
        >
          {label}
        </text>
      )}
    </g>
  )
}

// ============================================================================
// MAIN VISUALIZATION COMPONENT
// ============================================================================

function ProjectionVisualization({ vecA, vecB, setVecA, setVecB, showComponents = true }) {
  const width = 500
  const height = 400
  const origin = { x: width / 2, y: height / 2 }
  const scale = 50 // pixels per unit
  
  // Convert from math coords to SVG coords
  const toSvg = useCallback((v) => ({
    x: origin.x + v[0] * scale,
    y: origin.y - v[1] * scale  // flip Y axis
  }), [origin, scale])
  
  // Convert from SVG coords to math coords
  const fromSvg = useCallback((x, y) => [
    (x - origin.x) / scale,
    (origin.y - y) / scale
  ], [origin, scale])
  
  // Calculate projection
  const projection = useMemo(() => projectOnto(vecA, vecB), [vecA, vecB])
  const projLength = useMemo(() => vectorLength(projection), [projection])
  const dotProd = useMemo(() => dotProduct(vecA, vecB), [vecA, vecB])
  const vecALength = useMemo(() => vectorLength(vecA), [vecA])
  const vecBLength = useMemo(() => vectorLength(vecB), [vecB])
  const angle = useMemo(() => {
    if (vecALength === 0 || vecBLength === 0) return 0
    const cosAngle = dotProd / (vecALength * vecBLength)
    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI
  }, [dotProd, vecALength, vecBLength])
  
  // Rejection (perpendicular component)
  const rejection = useMemo(() => [
    vecA[0] - projection[0],
    vecA[1] - projection[1]
  ], [vecA, projection])
  
  const handleDragA = useCallback((svgX, svgY) => {
    const [x, y] = fromSvg(svgX, svgY)
    setVecA([Math.round(x * 10) / 10, Math.round(y * 10) / 10])
  }, [fromSvg, setVecA])
  
  const handleDragB = useCallback((svgX, svgY) => {
    const [x, y] = fromSvg(svgX, svgY)
    setVecB([Math.round(x * 10) / 10, Math.round(y * 10) / 10])
  }, [fromSvg, setVecB])
  
  const originSvg = toSvg([0, 0])
  const endA = toSvg(vecA)
  const endB = toSvg(vecB)
  const endProj = toSvg(projection)
  const endRejection = {
    x: endProj.x + (endA.x - endProj.x),
    y: endProj.y + (endA.y - endProj.y)
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-shrink-0">
        <svg 
          width={width} 
          height={height} 
          style={{ 
            border: '1px solid #ccc', 
            borderRadius: '8px',
            background: '#fafafa'
          }}
        >
          <CoordinateGrid width={width} height={height} scale={scale} origin={origin} />
          
          {/* Projection (green) */}
          <Arrow
            start={originSvg}
            end={endProj}
            color="#22c55e"
            strokeWidth={4}
          />
          
          {/* Rejection / perpendicular component (dashed) */}
          {showComponents && vectorLength(rejection) > 0.01 && (
            <Arrow
              start={endProj}
              end={endA}
              color="#888"
              strokeWidth={2}
              dashed={true}
            />
          )}
          
          {/* Right angle indicator */}
          {showComponents && vectorLength(projection) > 0.3 && vectorLength(rejection) > 0.3 && (
            <rect
              x={endProj.x - 8}
              y={endProj.y - 8}
              width={16}
              height={16}
              fill="none"
              stroke="#888"
              strokeWidth={1}
              transform={`rotate(${-Math.atan2(vecB[1], vecB[0]) * 180 / Math.PI}, ${endProj.x}, ${endProj.y})`}
            />
          )}
          
          {/* Vector B (blue) - the vector we project onto */}
          <Arrow
            start={originSvg}
            end={endB}
            color="#3b82f6"
            strokeWidth={3}
          />
          
          {/* Vector A (red) - the vector being projected */}
          <Arrow
            start={originSvg}
            end={endA}
            color="#ef4444"
            strokeWidth={3}
          />
          
          {/* Draggable endpoints */}
          <DraggablePoint
            x={endA.x}
            y={endA.y}
            onDrag={handleDragA}
            color="#ef4444"
            label="a"
          />
          <DraggablePoint
            x={endB.x}
            y={endB.y}
            onDrag={handleDragB}
            color="#3b82f6"
            label="b"
          />
          
          {/* Labels */}
          <text x={20} y={30} fontSize="14" fill="#666">
            Drag the red and blue points to change vectors
          </text>
        </svg>
      </div>
      
      <div className="flex-grow space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-bold text-red-800 mb-2">Vector a (red)</h4>
            <div className="font-mono text-lg">
              [{vecA[0].toFixed(1)}, {vecA[1].toFixed(1)}]
            </div>
            <div className="text-sm text-red-600 mt-1">
              |a| = {vecALength.toFixed(2)}
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">Vector b (blue)</h4>
            <div className="font-mono text-lg">
              [{vecB[0].toFixed(1)}, {vecB[1].toFixed(1)}]
            </div>
            <div className="text-sm text-blue-600 mt-1">
              |b| = {vecBLength.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="font-bold text-green-800 mb-2">Projection of a onto b (green)</h4>
          <div className="font-mono text-lg">
            proj<sub>b</sub>(a) = [{projection[0].toFixed(2)}, {projection[1].toFixed(2)}]
          </div>
          <div className="text-sm text-green-600 mt-1">
            |proj| = {projLength.toFixed(2)}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-2">Calculations</h4>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <span className="text-gray-500">a · b = </span>
              {vecA[0].toFixed(1)}×{vecB[0].toFixed(1)} + {vecA[1].toFixed(1)}×{vecB[1].toFixed(1)} = <strong>{dotProd.toFixed(2)}</strong>
            </div>
            <div>
              <span className="text-gray-500">|b|² = </span>
              {vecB[0].toFixed(1)}² + {vecB[1].toFixed(1)}² = <strong>{(vecBLength * vecBLength).toFixed(2)}</strong>
            </div>
            <div>
              <span className="text-gray-500">scalar = (a · b) / |b|² = </span>
              <strong>{(dotProd / (vecBLength * vecBLength || 1)).toFixed(2)}</strong>
            </div>
            <div>
              <span className="text-gray-500">Angle = </span>
              <strong>{angle.toFixed(1)}°</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EDITABLE VECTOR INPUT
// ============================================================================

function VectorInput({ label, value, onChange, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold" style={{ color }}>{label} = [</span>
      <input
        type="number"
        value={value[0]}
        onChange={(e) => onChange([parseFloat(e.target.value) || 0, value[1]])}
        className="w-20 px-2 py-1 border rounded text-center"
        step="0.1"
      />
      <span>,</span>
      <input
        type="number"
        value={value[1]}
        onChange={(e) => onChange([value[0], parseFloat(e.target.value) || 0])}
        className="w-20 px-2 py-1 border rounded text-center"
        step="0.1"
      />
      <span>]</span>
    </div>
  )
}

// ============================================================================
// EXPLANATION SECTIONS
// ============================================================================

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">{title}</h2>
      {children}
    </div>
  )
}

function FormulaBox({ children }) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg font-mono text-lg text-center my-4 overflow-x-auto">
      {children}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VectorProjection() {
  const [vecA, setVecA] = useState([3, 2])
  const [vecB, setVecB] = useState([4, 0])
  
  return (
    <Container className="py-8 max-w-5xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Vector Projection</h1>
      <p className="text-xl text-gray-600 mb-8">
        An interactive exploration of projecting one vector onto another
      </p>
      
      {/* Main Interactive Visualization */}
      <Section title="Interactive Playground">
        <p className="mb-4 text-gray-700">
          Drag the endpoints of the vectors, or edit the values directly below. 
          The <span className="text-green-600 font-bold">green vector</span> shows 
          the projection of <span className="text-red-600 font-bold">a</span> onto{' '}
          <span className="text-blue-600 font-bold">b</span>.
        </p>
        
        <div className="mb-4 flex flex-wrap gap-6">
          <VectorInput label="a" value={vecA} onChange={setVecA} color="#ef4444" />
          <VectorInput label="b" value={vecB} onChange={setVecB} color="#3b82f6" />
        </div>
        
        <ProjectionVisualization 
          vecA={vecA} 
          vecB={vecB} 
          setVecA={setVecA} 
          setVecB={setVecB}
        />
      </Section>
      
      {/* Intuition */}
      <Section title="What is Vector Projection?">
        <p className="text-gray-700 mb-4">
          Imagine you're standing under a streetlight, and your shadow falls on the ground.
          The shadow is a <strong>projection</strong> of you onto the ground plane.
        </p>
        <p className="text-gray-700 mb-4">
          Vector projection works the same way: we're finding the "shadow" of one vector 
          onto another. Specifically, we want to find the component of vector <strong>a</strong> that 
          lies along the direction of vector <strong>b</strong>.
        </p>
        <p className="text-gray-700">
          The projection answers: "How much of <strong>a</strong> points in the same direction as <strong>b</strong>?"
        </p>
      </Section>
      
      {/* The Formula */}
      <Section title="The Formula">
        <p className="text-gray-700 mb-4">
          The projection of vector <strong>a</strong> onto vector <strong>b</strong> is:
        </p>
        
        <FormulaBox>
          proj<sub>b</sub>(a) = ((a · b) / |b|²) × b
        </FormulaBox>
        
        <p className="text-gray-700 mb-4">Let's break this down:</p>
        
        <div className="space-y-4 ml-4">
          <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
            <h4 className="font-bold text-purple-800">Step 1: Dot Product (a · b)</h4>
            <p className="text-gray-700 mt-2">
              The dot product tells us how much the two vectors "agree" in direction.
              It's calculated as: a₁×b₁ + a₂×b₂
            </p>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
            <h4 className="font-bold text-indigo-800">Step 2: Divide by |b|²</h4>
            <p className="text-gray-700 mt-2">
              We normalize by the squared length of <strong>b</strong>. This gives us a scalar
              that tells us how far along <strong>b</strong> the projection extends.
            </p>
          </div>
          
          <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-400">
            <h4 className="font-bold text-cyan-800">Step 3: Multiply by b</h4>
            <p className="text-gray-700 mt-2">
              Finally, we multiply this scalar by vector <strong>b</strong> to get the actual
              projection vector pointing in the direction of <strong>b</strong>.
            </p>
          </div>
        </div>
      </Section>
      
      {/* Alternative Formula */}
      <Section title="Alternative Form: Using Unit Vectors">
        <p className="text-gray-700 mb-4">
          If we first normalize <strong>b</strong> to a unit vector <strong>b̂</strong> (length = 1), 
          the formula simplifies:
        </p>
        
        <FormulaBox>
          proj<sub>b</sub>(a) = (a · b̂) × b̂
        </FormulaBox>
        
        <p className="text-gray-700">
          Here, (a · b̂) directly gives us the <em>scalar projection</em> — the signed length
          of the projection. Multiplying by b̂ converts it back to a vector.
        </p>
      </Section>
      
      {/* Applications */}
      <Section title="Why Does This Matter?">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-bold text-amber-800 mb-2">🎮 Game Physics</h4>
            <p className="text-sm text-gray-700">
              When a ball bounces off a wall, we project its velocity onto the wall's normal
              to calculate the reflection.
            </p>
          </div>
          
          <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h4 className="font-bold text-teal-800 mb-2">📊 Machine Learning</h4>
            <p className="text-sm text-gray-700">
              PCA (Principal Component Analysis) projects high-dimensional data onto 
              principal axes to reduce dimensionality.
            </p>
          </div>
          
          <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
            <h4 className="font-bold text-rose-800 mb-2">🔧 Engineering</h4>
            <p className="text-sm text-gray-700">
              Breaking forces into components along and perpendicular to a surface
              is projection at work.
            </p>
          </div>
          
          <div className="p-4 bg-sky-50 rounded-lg border border-sky-200">
            <h4 className="font-bold text-sky-800 mb-2">🖼️ Computer Graphics</h4>
            <p className="text-sm text-gray-700">
              Calculating lighting involves projecting the light direction onto
              surface normals for diffuse shading.
            </p>
          </div>
        </div>
      </Section>
      
      {/* Try It Yourself */}
      <Section title="Experiments to Try">
        <div className="space-y-3 text-gray-700">
          <p>
            <strong>1.</strong> Make <strong>a</strong> and <strong>b</strong> perpendicular (90°). 
            What happens to the projection?
          </p>
          <p>
            <strong>2.</strong> Make <strong>a</strong> point in the opposite direction of <strong>b</strong>. 
            What do you notice about the projection?
          </p>
          <p>
            <strong>3.</strong> Make <strong>a</strong> parallel to <strong>b</strong>. 
            How does the projection relate to <strong>a</strong>?
          </p>
          <p>
            <strong>4.</strong> Keep <strong>a</strong> fixed and change the length of <strong>b</strong>. 
            Does the projection change?
          </p>
        </div>
      </Section>
    </Container>
  )
}
