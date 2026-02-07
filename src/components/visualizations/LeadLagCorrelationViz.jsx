/**
 * Lead-Lag Correlation Visualization Components
 * Extracted from LeadLagCorrelation.jsx for the JSON-driven tutorial engine
 */
import React, { useState, useMemo } from 'react'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function seededRandom(seed) {
  let state = seed
  return () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
}

function generatePriceSeries(days, seed = 1, volatility = 0.02) {
  const rand = seededRandom(seed)
  const prices = [100]
  for (let i = 1; i < days; i++) {
    const change = 1 + (rand() - 0.5) * 2 * volatility
    prices.push(prices[i - 1] * change)
  }
  return prices
}

function generateLaggedSeries(leader, lag, correlation, seed = 2) {
  const rand = seededRandom(seed)
  const n = leader.length
  const leaderReturns = leader.slice(1).map((p, i) => (p - leader[i]) / leader[i])
  
  const followerReturns = []
  for (let i = 0; i < n - 1; i++) {
    const noise = (rand() - 0.5) * 2 * 0.02
    const laggedIdx = i - lag
    if (laggedIdx >= 0 && laggedIdx < leaderReturns.length) {
      followerReturns.push(correlation * leaderReturns[laggedIdx] + (1 - Math.abs(correlation)) * noise)
    } else {
      followerReturns.push(noise)
    }
  }
  
  const prices = [100]
  for (let i = 0; i < followerReturns.length; i++) {
    prices.push(prices[i] * (1 + followerReturns[i]))
  }
  return prices
}

function calculateReturns(prices) {
  return prices.slice(1).map((p, i) => (p - prices[i]) / prices[i])
}

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length }
function std(arr) { const m = mean(arr); return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length) }
function covariance(x, y) { const mx = mean(x), my = mean(y); let sum = 0; for (let i = 0; i < x.length; i++) sum += (x[i] - mx) * (y[i] - my); return sum / x.length }
function correlation(x, y) { const cov = covariance(x, y), sx = std(x), sy = std(y); return sx === 0 || sy === 0 ? 0 : cov / (sx * sy) }
function laggedCorrelation(leader, follower, lag) { if (lag === 0) return correlation(leader, follower); const x = leader.slice(0, leader.length - lag), y = follower.slice(lag); return correlation(x, y) }

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TimeSeriesChart({ series1, series2, label1, label2, highlightLag = 0 }) {
  const width = 580, height = 220, padding = 45
  const allValues = [...series1, ...series2]
  const minVal = Math.min(...allValues), maxVal = Math.max(...allValues)
  const scaleX = (i) => padding + (i / (series1.length - 1)) * (width - 2 * padding)
  const scaleY = (v) => height - padding - ((v - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding)
  const path1 = series1.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ')
  const path2 = series2.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ')
  
  return (
    <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
      {highlightLag > 0 && <rect x={scaleX(0)} y={padding} width={scaleX(highlightLag) - scaleX(0)} height={height - 2 * padding} fill="#f59e0b" opacity={0.1} />}
      <path d={path1} fill="none" stroke="#22c55e" strokeWidth={2} />
      <path d={path2} fill="none" stroke="#06b6d4" strokeWidth={2} />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4a5568" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4a5568" />
      <rect x={width - 130} y={padding} width={12} height={12} fill="#22c55e" />
      <text x={width - 110} y={padding + 10} fill="#e8e8e8" fontSize={11}>{label1}</text>
      <rect x={width - 130} y={padding + 18} width={12} height={12} fill="#06b6d4" />
      <text x={width - 110} y={padding + 28} fill="#e8e8e8" fontSize={11}>{label2}</text>
      <text x={width / 2} y={height - 8} fill="#a0aec0" fontSize={11} textAnchor="middle">Time</text>
    </svg>
  )
}

function LagCorrelationChart({ correlations, currentLag, onLagChange }) {
  const width = 580, height = 180, padding = 45
  const barWidth = (width - 2 * padding) / correlations.length
  const maxCorr = Math.max(0.1, ...correlations.map(Math.abs))
  
  return (
    <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
      <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#4a5568" />
      {correlations.map((corr, i) => {
        const barHeight = Math.abs(corr) / maxCorr * (height / 2 - padding)
        const isPositive = corr >= 0
        const isSelected = i === currentLag
        const isZero = i === 0
        return (
          <g key={i}>
            <rect
              x={padding + i * barWidth + 1}
              y={isPositive ? height / 2 - barHeight : height / 2}
              width={barWidth - 2}
              height={barHeight}
              fill={isZero ? '#6b7280' : (isSelected ? '#f59e0b' : (isPositive ? '#22c55e' : '#ef4444'))}
              opacity={isZero ? 0.4 : (isSelected ? 1 : 0.7)}
              style={{ cursor: 'pointer' }}
              onClick={() => onLagChange(i)}
            />
            {i % 5 === 0 && <text x={padding + i * barWidth + barWidth / 2} y={height - 8} fill="#a0aec0" fontSize={10} textAnchor="middle">{i}</text>}
          </g>
        )
      })}
      <text x={padding - 5} y={padding + 10} fill="#a0aec0" fontSize={10} textAnchor="end">+{maxCorr.toFixed(2)}</text>
      <text x={padding - 5} y={height / 2 + 4} fill="#a0aec0" fontSize={10} textAnchor="end">0</text>
      <text x={padding - 5} y={height - padding - 5} fill="#a0aec0" fontSize={10} textAnchor="end">-{maxCorr.toFixed(2)}</text>
      <text x={width / 2} y={18} fill="#e8e8e8" fontSize={13} textAnchor="middle" fontWeight="bold">Correlation by Lag</text>
      <text x={width - padding} y={18} fill="#f59e0b" fontSize={11} textAnchor="end">Lag {currentLag}: r = {correlations[currentLag]?.toFixed(3)}</text>
      <text x={padding + barWidth / 2} y={height / 2 + 45} fill="#6b7280" fontSize={9} textAnchor="middle">✗</text>
    </svg>
  )
}

function ScatterPlot({ x, y, title }) {
  const width = 280, height = 250, padding = 40
  const xMin = Math.min(...x), xMax = Math.max(...x), yMin = Math.min(...y), yMax = Math.max(...y)
  const xRange = xMax - xMin || 1, yRange = yMax - yMin || 1
  const scaleX = (v) => padding + ((v - xMin) / xRange) * (width - 2 * padding)
  const scaleY = (v) => height - padding - ((v - yMin) / yRange) * (height - 2 * padding)
  const corr = correlation(x, y)
  
  return (
    <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4a5568" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4a5568" />
      {x.map((xv, i) => <circle key={i} cx={scaleX(xv)} cy={scaleY(y[i])} r={2.5} fill="#06b6d4" opacity={0.6} />)}
      <text x={width / 2} y={18} fill="#e8e8e8" fontSize={12} textAnchor="middle">{title}</text>
      <text x={width - padding} y={padding + 15} fill="#22c55e" fontSize={12} textAnchor="end">r = {corr.toFixed(3)}</text>
      <text x={width / 2} y={height - 8} fill="#a0aec0" fontSize={10} textAnchor="middle">Leader returns</text>
      <text x={12} y={height / 2} fill="#a0aec0" fontSize={10} textAnchor="middle" transform={`rotate(-90, 12, ${height/2})`}>Follower returns</text>
    </svg>
  )
}

// ============================================================================
// MAIN EXPORTED COMPONENT
// ============================================================================

export function LeadLagPlayground() {
  const [trueLag, setTrueLag] = useState(3)
  const [trueCorrelation, setTrueCorrelation] = useState(0.6)
  const [selectedLag, setSelectedLag] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  
  const { leader, follower, leaderReturns, followerReturns, lagCorrelations } = useMemo(() => {
    const leaderPrices = generatePriceSeries(100, 42, 0.025)
    const followerPrices = generateLaggedSeries(leaderPrices, trueLag, trueCorrelation, 123)
    const lReturns = calculateReturns(leaderPrices)
    const fReturns = calculateReturns(followerPrices)
    const correlations = []
    for (let lag = 0; lag <= 20; lag++) correlations.push(laggedCorrelation(lReturns, fReturns, lag))
    return { leader: leaderPrices, follower: followerPrices, leaderReturns: lReturns, followerReturns: fReturns, lagCorrelations: correlations }
  }, [trueLag, trueCorrelation])
  
  const bestLag = useMemo(() => {
    let maxCorr = 0, bestIdx = 1
    lagCorrelations.forEach((corr, i) => { if (i >= 1 && Math.abs(corr) > Math.abs(maxCorr)) { maxCorr = corr; bestIdx = i } })
    return { lag: bestIdx, correlation: maxCorr }
  }, [lagCorrelations])
  
  return (
    <div style={{ background: '#f7fafc', borderRadius: '12px', padding: '24px' }}>
      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>True Lag: {trueLag} days</label>
          <input type="range" min="1" max="10" value={trueLag} onChange={(e) => { setTrueLag(parseInt(e.target.value)); setShowAnswer(false) }} style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>True Correlation: {(trueCorrelation * 100).toFixed(0)}%</label>
          <input type="range" min="0.1" max="0.9" step="0.1" value={trueCorrelation} onChange={(e) => { setTrueCorrelation(parseFloat(e.target.value)); setShowAnswer(false) }} style={{ width: '100%' }} />
        </div>
      </div>
      
      {/* Time series */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>Price Series</h3>
        <TimeSeriesChart series1={leader} series2={follower} label1="Leader" label2="Follower" highlightLag={showAnswer ? trueLag : 0} />
      </div>
      
      {/* Scatter + lag chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <ScatterPlot 
          x={selectedLag === 0 ? leaderReturns : leaderReturns.slice(0, -selectedLag)}
          y={selectedLag === 0 ? followerReturns : followerReturns.slice(selectedLag)}
          title={`Returns @ Lag ${selectedLag}`}
        />
        <div>
          <LagCorrelationChart correlations={lagCorrelations} currentLag={selectedLag} onLagChange={setSelectedLag} />
          <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px', textAlign: 'center' }}>Click bars to explore • Lag 0 (gray) is non-tradeable</p>
        </div>
      </div>
      
      {/* Challenge */}
      <div style={{ background: '#1a1a2e', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
        <h3 style={{ color: '#f59e0b', marginBottom: '10px', fontSize: '16px' }}>🎯 Find the True Lag!</h3>
        <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '12px' }}>
          Your selection: <strong style={{ color: selectedLag === 0 ? '#ef4444' : '#06b6d4' }}>Lag {selectedLag}</strong>
          {selectedLag === 0 && <span style={{ color: '#ef4444' }}> (not tradeable!)</span>}
        </p>
        <button onClick={() => setShowAnswer(!showAnswer)} style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', background: '#22c55e', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
          {showAnswer ? 'Hide Answer' : 'Reveal Answer'}
        </button>
        {showAnswer && (
          <div style={{ marginTop: '12px', padding: '12px', background: '#0d0d1a', borderRadius: '6px' }}>
            <p style={{ color: '#22c55e', fontSize: '15px', fontWeight: 'bold' }}>True: Lag {trueLag} | Detected: Lag {bestLag.lag} | r = {(bestLag.correlation * 100).toFixed(1)}%</p>
            <p style={{ color: '#a0aec0', marginTop: '6px', fontSize: '13px' }}>
              {Math.abs(bestLag.correlation) >= 0.2 ? "✅ Above 20% threshold — potentially tradeable!" : "⚠️ Below 20% threshold — may not survive fees"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeadLagPlayground
