/**
 * LineChartTemplate
 * 
 * Config-driven line chart for time series or sequential data
 */

import React from 'react'

export function LineChartTemplate({
  data = [],
  showPoints = true,
  lineColor = '#6366f1',
  fillArea = false,
  title = '',
  width = 450,
  height = 250,
  annotation = null,
}) {
  // Normalize data format
  const normalizedData = data.map((item, i) => {
    if (typeof item === 'number') {
      return { x: i, y: item }
    }
    return item
  })
  
  if (normalizedData.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl p-4 my-4 text-center text-slate-400">
        No data provided
      </div>
    )
  }
  
  const padding = { top: 30, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  const xValues = normalizedData.map(d => d.x)
  const yValues = normalizedData.map(d => d.y)
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const yMin = Math.min(0, ...yValues)
  const yMax = Math.max(...yValues) * 1.1 // Add 10% headroom
  
  const scaleX = (x) => padding.left + ((x - xMin) / (xMax - xMin || 1)) * chartWidth
  const scaleY = (y) => height - padding.bottom - ((y - yMin) / (yMax - yMin || 1)) * chartHeight
  
  // Build path
  const linePath = normalizedData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.x)} ${scaleY(d.y)}`)
    .join(' ')
  
  // Build area path (for fill)
  const areaPath = fillArea ? 
    linePath + 
    ` L ${scaleX(normalizedData[normalizedData.length - 1].x)} ${height - padding.bottom}` +
    ` L ${scaleX(normalizedData[0].x)} ${height - padding.bottom} Z`
    : ''
  
  return (
    <div className="bg-slate-900 rounded-xl p-4 my-4">
      {title && (
        <h4 className="text-white font-medium mb-2 text-sm">{title}</h4>
      )}
      
      <svg width={width} height={height}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - padding.bottom - ratio * chartHeight
          return (
            <line 
              key={ratio}
              x1={padding.left} 
              y1={y} 
              x2={width - padding.right} 
              y2={y} 
              stroke="#2a2a4e" 
              strokeDasharray="4,4"
            />
          )
        })}
        
        {/* Y axis */}
        <line 
          x1={padding.left} 
          y1={padding.top} 
          x2={padding.left} 
          y2={height - padding.bottom} 
          stroke="#4a5568" 
          strokeWidth={2} 
        />
        
        {/* X axis */}
        <line 
          x1={padding.left} 
          y1={height - padding.bottom} 
          x2={width - padding.right} 
          y2={height - padding.bottom} 
          stroke="#4a5568" 
          strokeWidth={2} 
        />
        
        {/* Y axis labels */}
        {[0, 0.5, 1].map((ratio) => {
          const y = height - padding.bottom - ratio * chartHeight
          const value = yMin + ratio * (yMax - yMin)
          return (
            <text key={ratio} x={padding.left - 10} y={y + 4} fill="#888" fontSize={10} textAnchor="end">
              {value.toFixed(value >= 100 ? 0 : 1)}
            </text>
          )
        })}
        
        {/* X axis labels */}
        {normalizedData.filter((_, i) => i % Math.ceil(normalizedData.length / 6) === 0 || i === normalizedData.length - 1).map((d) => (
          <text 
            key={d.x} 
            x={scaleX(d.x)} 
            y={height - padding.bottom + 20} 
            fill="#888" 
            fontSize={10} 
            textAnchor="middle"
          >
            {d.x}
          </text>
        ))}
        
        {/* Area fill */}
        {fillArea && (
          <path d={areaPath} fill={lineColor} fillOpacity={0.15} />
        )}
        
        {/* Line */}
        <path 
          d={linePath} 
          fill="none" 
          stroke={lineColor} 
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        {/* Points */}
        {showPoints && normalizedData.map((d, i) => (
          <circle 
            key={i} 
            cx={scaleX(d.x)} 
            cy={scaleY(d.y)} 
            r={4} 
            fill={lineColor} 
            stroke="#1a1a2e" 
            strokeWidth={2}
          />
        ))}
      </svg>
      
      {annotation && (
        <div className="mt-3 text-sm text-slate-400 italic">
          {annotation}
        </div>
      )}
    </div>
  )
}

export default LineChartTemplate
