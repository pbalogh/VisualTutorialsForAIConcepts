/**
 * ColorWheel - Interactive wheel for positioning sources
 * 
 * 12 positions around the wheel (like a clock), with the mixture in the center.
 * Opposite positions represent contradictory sources.
 * Adjacent positions represent gradations/orthogonal perspectives.
 */

import React, { useMemo } from 'react'

// Color positions around the wheel (12 positions, like hours on a clock)
const POSITION_COLORS = [
  { hue: 120, name: 'green' },    // 0: 12 o'clock - primary
  { hue: 90, name: 'lime' },      // 1
  { hue: 60, name: 'yellow' },    // 2
  { hue: 30, name: 'orange' },    // 3
  { hue: 0, name: 'red' },        // 4
  { hue: 330, name: 'rose' },     // 5
  { hue: 300, name: 'magenta' },  // 6: opposite of green
  { hue: 270, name: 'purple' },   // 7
  { hue: 240, name: 'blue' },     // 8
  { hue: 210, name: 'sky' },      // 9
  { hue: 180, name: 'cyan' },     // 10
  { hue: 150, name: 'teal' },     // 11
]

// Get the color for a position
export function getPositionColor(position, saturation = 70, lightness = 50) {
  const { hue } = POSITION_COLORS[position % 12]
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// Get opposite position (180° around wheel)
export function getOppositePosition(position) {
  return (position + 6) % 12
}

// Get adjacent positions
export function getAdjacentPositions(position) {
  return [
    (position + 11) % 12, // left
    (position + 1) % 12,  // right
  ]
}

export default function ColorWheel({ 
  sources, 
  selectedPosition, 
  onPositionClick,
  onMagnitudeChange 
}) {
  // Calculate center color from all sources (mixed)
  const centerColor = useMemo(() => {
    const sourceList = Object.entries(sources)
    if (sourceList.length === 0) {
      return 'rgba(255, 255, 255, 0.1)'
    }
    
    // Simple hue averaging weighted by magnitude
    let totalMagnitude = 0
    let hueX = 0
    let hueY = 0
    
    sourceList.forEach(([pos, source]) => {
      const { hue } = POSITION_COLORS[parseInt(pos)]
      const mag = source.magnitude || 1
      totalMagnitude += mag
      // Convert to radians for circular averaging
      const rad = (hue * Math.PI) / 180
      hueX += Math.cos(rad) * mag
      hueY += Math.sin(rad) * mag
    })
    
    if (totalMagnitude === 0) return 'rgba(255, 255, 255, 0.1)'
    
    const avgHue = (Math.atan2(hueY, hueX) * 180 / Math.PI + 360) % 360
    const saturation = Math.min(70, 40 + sourceList.length * 10)
    
    return `hsl(${avgHue}, ${saturation}%, 45%)`
  }, [sources])

  // Wheel dimensions
  const size = 400
  const center = size / 2
  const outerRadius = 170
  const innerRadius = 80
  const slotRadius = 30

  return (
    <div className="relative">
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-2xl"
      >
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="60"
        />

        {/* Position slots */}
        {POSITION_COLORS.map((color, position) => {
          const angle = (position * 30 - 90) * (Math.PI / 180) // Start from top
          const x = center + Math.cos(angle) * outerRadius
          const y = center + Math.sin(angle) * outerRadius
          
          const source = sources[position]
          const isSelected = selectedPosition === position
          const isOccupied = !!source
          const magnitude = source?.magnitude ?? 1
          
          // Visual sizing based on magnitude
          const displayRadius = slotRadius * (0.5 + magnitude * 0.5)
          
          return (
            <g key={position} className="cursor-pointer">
              {/* Outer glow for occupied slots */}
              {isOccupied && (
                <circle
                  cx={x}
                  cy={y}
                  r={displayRadius + 8}
                  fill="none"
                  stroke={getPositionColor(position, 80, 60)}
                  strokeWidth="2"
                  opacity={0.5}
                  className="animate-pulse"
                />
              )}
              
              {/* Main slot */}
              <circle
                cx={x}
                cy={y}
                r={displayRadius}
                fill={isOccupied 
                  ? getPositionColor(position, 70, 45) 
                  : 'rgba(255,255,255,0.05)'
                }
                stroke={isSelected 
                  ? 'white' 
                  : isOccupied 
                    ? getPositionColor(position, 90, 70)
                    : 'rgba(255,255,255,0.2)'
                }
                strokeWidth={isSelected ? 3 : 1.5}
                onClick={() => onPositionClick(position)}
                className="transition-all duration-200 hover:scale-110"
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              
              {/* Position label for empty slots */}
              {!isOccupied && (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(255,255,255,0.3)"
                  fontSize="12"
                  fontWeight="500"
                  onClick={() => onPositionClick(position)}
                  className="cursor-pointer select-none"
                >
                  +
                </text>
              )}
              
              {/* Source indicator for occupied slots */}
              {isOccupied && (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  onClick={() => onPositionClick(position)}
                  className="cursor-pointer select-none"
                >
                  {source.title?.charAt(0)?.toUpperCase() || '?'}
                </text>
              )}
            </g>
          )
        })}

        {/* Center mixture area */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill={centerColor}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          className="cursor-pointer transition-colors duration-500"
          onClick={() => onPositionClick(null)}
        />
        
        {/* Center label */}
        <text
          x={center}
          y={center - 10}
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="bold"
          className="pointer-events-none"
        >
          {Object.keys(sources).length > 0 ? 'Mixture' : 'Center'}
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize="11"
          className="pointer-events-none"
        >
          {Object.keys(sources).length > 0 
            ? `${Object.keys(sources).length} voices`
            : 'Add sources'
          }
        </text>
      </svg>

      {/* Legend */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-500">
        Click a slot to add a source • Click center to mix
      </div>
    </div>
  )
}
