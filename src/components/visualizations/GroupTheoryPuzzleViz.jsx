import React, { useState, useCallback, useEffect } from 'react'

/**
 * Triangle Rotation Puzzle - Demonstrates Z₃ (cyclic group of order 3)
 * 
 * The triangle has 3 labeled corners (A, B, C)
 * One operation: rotate clockwise by 120°
 * Shows: identity (e), one rotation (r), two rotations (r²)
 */
export function TriangleRotationPuzzle({ 
  showCayley = true,
  showStateLabel = true,
  showOperationHistory = true,
  interactive = true 
}) {
  // State: 0 = identity (ABC), 1 = one rotation (CAB), 2 = two rotations (BCA)
  const [rotation, setRotation] = useState(0)
  const [history, setHistory] = useState([])
  const [isAnimating, setIsAnimating] = useState(false)
  
  // The three states and their labels
  const states = [
    { id: 0, label: 'e', corners: ['A', 'B', 'C'], description: 'Identity (start)' },
    { id: 1, label: 'r', corners: ['C', 'A', 'B'], description: 'One rotation' },
    { id: 2, label: 'r²', corners: ['B', 'C', 'A'], description: 'Two rotations' },
  ]
  
  const currentState = states[rotation]
  
  const rotate = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    
    const newRotation = (rotation + 1) % 3
    setHistory(prev => [...prev, { from: rotation, to: newRotation, op: 'r' }])
    
    // Small delay for animation
    setTimeout(() => {
      setRotation(newRotation)
      setIsAnimating(false)
    }, 300)
  }, [rotation, isAnimating])
  
  const reset = useCallback(() => {
    setRotation(0)
    setHistory([])
  }, [])
  
  // Triangle vertices (equilateral, pointing up)
  const cx = 100, cy = 100, r = 60
  const vertices = [
    { x: cx, y: cy - r }, // top
    { x: cx + r * Math.sin(2 * Math.PI / 3), y: cy + r * Math.cos(2 * Math.PI / 3) }, // bottom-right
    { x: cx - r * Math.sin(2 * Math.PI / 3), y: cy + r * Math.cos(2 * Math.PI / 3) }, // bottom-left
  ]
  
  // Rotation transform for animation
  const rotationAngle = rotation * 120
  
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Triangle Visualization */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔺</span>
            Triangle Puzzle
          </h3>
          
          <div className="flex justify-center">
            <svg width="200" height="200" className="border border-gray-100 rounded-lg bg-gradient-to-br from-gray-50 to-white">
              <g 
                transform={`rotate(${rotationAngle}, ${cx}, ${cy})`}
                style={{ transition: isAnimating ? 'transform 0.3s ease-out' : 'none' }}
              >
                {/* Triangle */}
                <polygon
                  points={vertices.map(v => `${v.x},${v.y}`).join(' ')}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  className="drop-shadow-sm"
                />
                
                {/* Corner labels - counter-rotate so they stay upright */}
                {vertices.map((v, i) => {
                  // Position labels outside the triangle
                  const labelOffset = 20
                  const angle = (i * 2 * Math.PI / 3) - Math.PI / 2
                  const lx = cx + (r + labelOffset) * Math.cos(angle)
                  const ly = cy + (r + labelOffset) * Math.sin(angle)
                  
                  return (
                    <g key={i} transform={`rotate(${-rotationAngle}, ${lx}, ${ly})`}>
                      <circle cx={lx} cy={ly} r="14" fill="#f0f0ff" stroke="#6366f1" strokeWidth="2" />
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-sm font-bold fill-indigo-600"
                      >
                        {currentState.corners[i]}
                      </text>
                    </g>
                  )
                })}
                
                {/* Center dot */}
                <circle cx={cx} cy={cy} r="4" fill="#6366f1" />
              </g>
              
              {/* Rotation arrow indicator */}
              <path
                d="M 160 100 A 30 30 0 0 1 130 130"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeDasharray="4,2"
                markerEnd="url(#arrowhead)"
              />
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
              </defs>
            </svg>
          </div>
          
          {/* State label */}
          {showStateLabel && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-lg">
                <span className="text-sm text-gray-600">Current state:</span>
                <span className="font-mono font-bold text-indigo-600 text-lg">{currentState.label}</span>
                <span className="text-sm text-gray-500">({currentState.description})</span>
              </div>
            </div>
          )}
          
          {/* Controls */}
          {interactive && (
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={rotate}
                disabled={isAnimating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium
                  hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <span>↻</span> Rotate (apply r)
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium
                  hover:bg-gray-300 transition-all"
              >
                Reset
              </button>
            </div>
          )}
        </div>
        
        {/* Cayley Diagram */}
        {showCayley && (
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">🔗</span>
              Cayley Diagram (Z₃)
            </h3>
            
            <CayleyDiagramZ3 currentState={rotation} />
            
            <p className="mt-4 text-sm text-gray-600 text-center">
              Each node is a state. Blue arrows show the "rotate" operation.
              <br />
              Notice: 3 rotations = back to start!
            </p>
          </div>
        )}
      </div>
      
      {/* Operation History */}
      {showOperationHistory && history.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Operation History:</h4>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                <span className="text-gray-500">{states[h.from].label}</span>
                <span className="text-indigo-600">→{h.op}→</span>
                <span className="font-medium text-gray-800">{states[h.to].label}</span>
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Total: {history.length} operation{history.length !== 1 ? 's' : ''} = {currentState.label}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Cayley Diagram for Z₃ - Shows all states and transitions
 */
function CayleyDiagramZ3({ currentState = 0 }) {
  const cx = 100, cy = 100, r = 50
  
  // Three nodes in a triangle formation
  const nodes = [
    { id: 0, label: 'e', x: cx, y: cy - r },
    { id: 1, label: 'r', x: cx + r * Math.sin(2 * Math.PI / 3), y: cy + r * Math.cos(2 * Math.PI / 3) },
    { id: 2, label: 'r²', x: cx - r * Math.sin(2 * Math.PI / 3), y: cy + r * Math.cos(2 * Math.PI / 3) },
  ]
  
  // Edges: e→r, r→r², r²→e (all via the 'r' operation)
  const edges = [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
    { from: 2, to: 0 },
  ]
  
  return (
    <svg width="200" height="200" className="border border-gray-100 rounded-lg bg-gradient-to-br from-slate-50 to-white">
      <defs>
        <marker id="cayley-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
        </marker>
      </defs>
      
      {/* Edges (curved arrows) */}
      {edges.map((edge, i) => {
        const from = nodes[edge.from]
        const to = nodes[edge.to]
        
        // Calculate control point for curved line
        const mx = (from.x + to.x) / 2
        const my = (from.y + to.y) / 2
        // Push control point outward from center
        const dx = mx - cx
        const dy = my - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const cpx = mx + (dx / dist) * 25
        const cpy = my + (dy / dist) * 25
        
        // Shorten the path to not overlap with node circles
        const nodeRadius = 18
        const angle = Math.atan2(to.y - cpy, to.x - cpx)
        const endX = to.x - nodeRadius * Math.cos(angle)
        const endY = to.y - nodeRadius * Math.sin(angle)
        
        return (
          <path
            key={i}
            d={`M ${from.x} ${from.y} Q ${cpx} ${cpy} ${endX} ${endY}`}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            markerEnd="url(#cayley-arrow)"
            opacity={0.6}
          />
        )
      })}
      
      {/* Operation label */}
      <text x={cx + 70} y={cy - 30} className="text-xs fill-indigo-500 font-medium">r</text>
      
      {/* Nodes */}
      {nodes.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r="18"
            fill={node.id === currentState ? '#6366f1' : '#f8fafc'}
            stroke={node.id === currentState ? '#4f46e5' : '#e2e8f0'}
            strokeWidth="2"
            className="transition-all duration-300"
          />
          <text
            x={node.x}
            y={node.y}
            textAnchor="middle"
            dominantBaseline="central"
            className={`text-sm font-bold ${
              node.id === currentState ? 'fill-white' : 'fill-gray-700'
            }`}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

/**
 * Coin Flip Puzzle - Demonstrates Z₂ (simplest non-trivial group)
 */
export function CoinFlipPuzzle({ showGroup = true }) {
  const [isHeads, setIsHeads] = useState(true)
  const [flips, setFlips] = useState(0)
  
  const flip = () => {
    setIsHeads(!isHeads)
    setFlips(flips + 1)
  }
  
  const reset = () => {
    setIsHeads(true)
    setFlips(0)
  }
  
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">🪙</span>
        Coin Flip (Z₂)
      </h3>
      
      <div className="flex items-center justify-center gap-8">
        {/* Coin */}
        <div 
          className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold
            border-4 shadow-lg transition-all duration-300 cursor-pointer
            ${isHeads 
              ? 'bg-amber-100 border-amber-400 text-amber-700' 
              : 'bg-slate-200 border-slate-400 text-slate-600'
            }`}
          onClick={flip}
        >
          {isHeads ? 'H' : 'T'}
        </div>
        
        {/* State info */}
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">Current state</div>
          <div className="font-mono text-2xl font-bold text-indigo-600">
            {isHeads ? 'e' : 'f'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {isHeads ? '(identity)' : '(flipped)'}
          </div>
        </div>
        
        {showGroup && (
          <div className="pl-8 border-l border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Group Z₂:</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>• Two elements: e, f</div>
              <div>• f · f = e (flip twice = identity)</div>
              <div>• Flips so far: <span className="font-mono font-bold">{flips}</span></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={flip}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium
            hover:bg-indigo-700 transition-all shadow-sm"
        >
          🔄 Flip
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium
            hover:bg-gray-300 transition-all"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

/**
 * Two Coins Puzzle - Klein Four Group (Z₂ × Z₂)
 */
export function TwoCoinsPuzzle({ showCayley = true }) {
  // State: [coin1, coin2] where 0=heads, 1=tails
  const [coins, setCoins] = useState([0, 0])
  const [history, setHistory] = useState([])
  
  const stateLabels = {
    '0,0': 'e',    // identity (HH)
    '1,0': 'a',    // flip first (TH)
    '0,1': 'b',    // flip second (HT)
    '1,1': 'c',    // flip both (TT)
  }
  
  const currentLabel = stateLabels[coins.join(',')]
  
  const flipFirst = () => {
    setCoins([1 - coins[0], coins[1]])
    setHistory([...history, 'a'])
  }
  
  const flipSecond = () => {
    setCoins([coins[0], 1 - coins[1]])
    setHistory([...history, 'b'])
  }
  
  const flipBoth = () => {
    setCoins([1 - coins[0], 1 - coins[1]])
    setHistory([...history, 'c'])
  }
  
  const reset = () => {
    setCoins([0, 0])
    setHistory([])
  }
  
  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">🪙🪙</span>
        Two Coins (Klein Four Group)
      </h3>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          {/* Coins display */}
          <div className="flex justify-center gap-4 mb-4">
            {coins.map((coin, i) => (
              <div
                key={i}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold
                  border-4 shadow-md transition-all
                  ${coin === 0 
                    ? 'bg-amber-100 border-amber-400 text-amber-700' 
                    : 'bg-slate-200 border-slate-400 text-slate-600'
                  }`}
              >
                {coin === 0 ? 'H' : 'T'}
              </div>
            ))}
          </div>
          
          {/* Current state */}
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg">
              <span className="text-sm text-gray-600">State:</span>
              <span className="font-mono font-bold text-indigo-600 text-xl">{currentLabel}</span>
            </span>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={flipFirst} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all text-sm">
              Flip 1st (a)
            </button>
            <button onClick={flipSecond} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-all text-sm">
              Flip 2nd (b)
            </button>
            <button onClick={flipBoth} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-all text-sm">
              Flip both (c)
            </button>
            <button onClick={reset} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm">
              Reset
            </button>
          </div>
        </div>
        
        {showCayley && (
          <div className="flex-1">
            <KleinFourCayley currentState={coins.join(',')} />
          </div>
        )}
      </div>
      
      {/* Key insight */}
      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="text-sm text-amber-900">
          <strong>Key insight:</strong> Every element is its own inverse! 
          Apply any operation twice and you're back where you started.
          <br />
          <span className="text-amber-700">a·a = b·b = c·c = e</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Cayley Diagram for Klein Four Group
 */
function KleinFourCayley({ currentState }) {
  const nodes = [
    { id: '0,0', label: 'e', x: 60, y: 60 },
    { id: '1,0', label: 'a', x: 140, y: 60 },
    { id: '0,1', label: 'b', x: 60, y: 140 },
    { id: '1,1', label: 'c', x: 140, y: 140 },
  ]
  
  // Edges with colors for different operations
  const edges = [
    // a edges (horizontal) - blue
    { from: '0,0', to: '1,0', color: '#3b82f6', op: 'a' },
    { from: '0,1', to: '1,1', color: '#3b82f6', op: 'a' },
    // b edges (vertical) - green
    { from: '0,0', to: '0,1', color: '#22c55e', op: 'b' },
    { from: '1,0', to: '1,1', color: '#22c55e', op: 'b' },
    // c edges (diagonal) - purple
    { from: '0,0', to: '1,1', color: '#a855f7', op: 'c' },
    { from: '1,0', to: '0,1', color: '#a855f7', op: 'c' },
  ]
  
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">Cayley Diagram</h4>
      <svg width="200" height="200" className="border border-gray-100 rounded-lg bg-white">
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodes.find(n => n.id === edge.from)
          const to = nodes.find(n => n.id === edge.to)
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={edge.color}
              strokeWidth="2"
              opacity="0.5"
            />
          )
        })}
        
        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="20"
              fill={node.id === currentState ? '#6366f1' : '#f8fafc'}
              stroke={node.id === currentState ? '#4f46e5' : '#e2e8f0'}
              strokeWidth="2"
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              className={`text-sm font-bold ${
                node.id === currentState ? 'fill-white' : 'fill-gray-700'
              }`}
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="mt-2 flex justify-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500"></span> a
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-500"></span> b
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-purple-500"></span> c
        </span>
      </div>
    </div>
  )
}

/**
 * Group Multiplication Table - Shows how operations combine
 */
export function GroupMultTable({ group = 'Z3' }) {
  const tables = {
    'Z2': {
      elements: ['e', 'f'],
      mult: [
        ['e', 'f'],
        ['f', 'e'],
      ],
      name: 'Z₂ (Coin flip)',
    },
    'Z3': {
      elements: ['e', 'r', 'r²'],
      mult: [
        ['e', 'r', 'r²'],
        ['r', 'r²', 'e'],
        ['r²', 'e', 'r'],
      ],
      name: 'Z₃ (Triangle rotation)',
    },
    'Klein4': {
      elements: ['e', 'a', 'b', 'c'],
      mult: [
        ['e', 'a', 'b', 'c'],
        ['a', 'e', 'c', 'b'],
        ['b', 'c', 'e', 'a'],
        ['c', 'b', 'a', 'e'],
      ],
      name: 'Klein Four (Two coins)',
    },
  }
  
  const { elements, mult, name } = tables[group]
  
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{name} Multiplication Table</h4>
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse">
          <thead>
            <tr>
              <th className="w-10 h-10 bg-gray-100 border border-gray-200 font-bold text-gray-500">∘</th>
              {elements.map(e => (
                <th key={e} className="w-10 h-10 bg-gray-100 border border-gray-200 font-bold text-indigo-600">{e}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {elements.map((row, i) => (
              <tr key={row}>
                <th className="w-10 h-10 bg-gray-100 border border-gray-200 font-bold text-indigo-600">{row}</th>
                {mult[i].map((cell, j) => (
                  <td 
                    key={j} 
                    className={`w-10 h-10 text-center border border-gray-200 font-mono
                      ${cell === 'e' ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700'}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Read: row ∘ column = result. Green cells show identity results.
      </p>
    </div>
  )
}

export default {
  TriangleRotationPuzzle,
  CoinFlipPuzzle,
  TwoCoinsPuzzle,
  GroupMultTable,
}
