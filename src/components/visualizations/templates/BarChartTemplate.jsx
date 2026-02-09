/**
 * BarChartTemplate
 * 
 * Config-driven bar chart for categorical comparisons
 */

import React from 'react'

export function BarChartTemplate({
  data = [],
  colorByValue = false,
  showValues = true,
  title = '',
  width = 400,
  height = 250,
  annotation = null,
}) {
  // Normalize data format
  const normalizedData = data.map((item, i) => {
    if (typeof item === 'number') {
      return { label: `${i + 1}`, value: item }
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
  
  const maxValue = Math.max(...normalizedData.map(d => d.value))
  const minValue = Math.min(...normalizedData.map(d => d.value))
  const padding = { top: 30, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const barWidth = Math.min(50, (chartWidth / normalizedData.length) * 0.7)
  const barGap = (chartWidth - barWidth * normalizedData.length) / (normalizedData.length + 1)
  
  // Color function
  const getBarColor = (value) => {
    if (!colorByValue) return '#6366f1'
    const ratio = maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue)
    // Gradient from red (low) to green (high)
    const r = Math.round(255 * (1 - ratio))
    const g = Math.round(255 * ratio)
    return `rgb(${r}, ${g}, 100)`
  }
  
  return (
    <div className="bg-slate-900 rounded-xl p-4 my-4">
      {title && (
        <h4 className="text-white font-medium mb-2 text-sm">{title}</h4>
      )}
      
      <svg width={width} height={height}>
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
        
        {/* Y axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - padding.bottom - ratio * chartHeight
          const value = minValue + ratio * (maxValue - minValue)
          return (
            <g key={ratio}>
              <line x1={padding.left - 5} y1={y} x2={padding.left} y2={y} stroke="#4a5568" />
              <text x={padding.left - 10} y={y + 4} fill="#888" fontSize={10} textAnchor="end">
                {value.toFixed(value >= 100 ? 0 : 1)}
              </text>
            </g>
          )
        })}
        
        {/* Bars */}
        {normalizedData.map((d, i) => {
          const x = padding.left + barGap + i * (barWidth + barGap)
          const barHeight = maxValue === 0 ? 0 : (d.value / maxValue) * chartHeight
          const y = height - padding.bottom - barHeight
          
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={getBarColor(d.value)}
                rx={3}
              />
              
              {/* Value label */}
              {showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  fill="#e8e8e8"
                  fontSize={11}
                  textAnchor="middle"
                  fontWeight="500"
                >
                  {d.value.toFixed(d.value >= 100 ? 0 : 1)}
                </text>
              )}
              
              {/* X label */}
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 20}
                fill="#888"
                fontSize={11}
                textAnchor="middle"
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      
      {annotation && (
        <div className="mt-3 text-sm text-slate-400 italic">
          {annotation}
        </div>
      )}
    </div>
  )
}

export default BarChartTemplate
