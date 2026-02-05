import React, { useState, useMemo, useCallback } from 'react'
import { Container } from '../components/SharedUI.jsx'

// ============================================================================
// LEAD-LAG CORRELATION TUTORIAL
// Interactive exploration of time-shifted correlations between time series
// ============================================================================

// Generate synthetic time series data
function generateTimeSeries(length, seed = 1) {
  const data = []
  let value = 0
  for (let i = 0; i < length; i++) {
    // Simple random walk with trend
    const noise = (Math.sin(seed * i * 0.1) + Math.random() - 0.5) * 2
    value += noise
    data.push(value)
  }
  return data
}

// Generate a lagged version of a series
function lagSeries(series, lag) {
  if (lag >= 0) {
    // Positive lag: series B follows series A
    return series.slice(0, series.length - lag)
  } else {
    // Negative lag: series B leads series A
    return series.slice(-lag)
  }
}

// Calculate mean of array
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

// Calculate standard deviation
function stdDev(arr) {
  const m = mean(arr)
  const squaredDiffs = arr.map(x => (x - m) ** 2)
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / arr.length)
}

// Calculate Pearson correlation coefficient
function correlation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0
  const meanX = mean(x)
  const meanY = mean(y)
  const stdX = stdDev(x)
  const stdY = stdDev(y)
  if (stdX === 0 || stdY === 0) return 0
  
  let sum = 0
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY)
  }
  return sum / (x.length * stdX * stdY)
}

// Calculate correlation at a specific lag
function correlationAtLag(seriesA, seriesB, lag) {
  const n = seriesA.length
  if (lag >= 0) {
    // Positive lag: B is shifted forward (B follows A)
    const a = seriesA.slice(0, n - lag)
    const b = seriesB.slice(lag)
    return correlation(a, b)
  } else {
    // Negative lag: A is shifted forward (A follows B)
    const a = seriesA.slice(-lag)
    const b = seriesB.slice(0, n + lag)
    return correlation(a, b)
  }
}

// ============================================================================
// VISUALIZATION COMPONENTS
// ============================================================================

function TimeSeriesChart({ seriesA, seriesB, lag, width = 600, height = 200 }) {
  const padding = { top: 20, right: 20, bottom: 30, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  // Compute aligned series for visualization
  const n = seriesA.length
  const alignedA = lag >= 0 ? seriesA.slice(0, n - Math.abs(lag)) : seriesA.slice(Math.abs(lag))
  const alignedB = lag >= 0 ? seriesB.slice(Math.abs(lag)) : seriesB.slice(0, n - Math.abs(lag))
  
  // Find min/max for scaling
  const allValues = [...seriesA, ...seriesB]
  const minY = Math.min(...allValues)
  const maxY = Math.max(...allValues)
  const rangeY = maxY - minY || 1
  
  // Scale functions
  const scaleX = (i, total) => padding.left + (i / (total - 1)) * chartWidth
  const scaleY = (v) => padding.top + chartHeight - ((v - minY) / rangeY) * chartHeight
  
  // Generate path for series A (full)
  const pathA = seriesA.map((v, i) => 
    `${i === 0 ? 'M' : 'L'} ${scaleX(i, seriesA.length)} ${scaleY(v)}`
  ).join(' ')
  
  // Generate path for series B (full)
  const pathB = seriesB.map((v, i) => 
    `${i === 0 ? 'M' : 'L'} ${scaleX(i, seriesB.length)} ${scaleY(v)}`
  ).join(' ')
  
  return (
    <svg width={width} height={height} style={{ background: '#fafafa', borderRadius: 8 }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <line
          key={t}
          x1={padding.left}
          y1={padding.top + t * chartHeight}
          x2={width - padding.right}
          y2={padding.top + t * chartHeight}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      ))}
      
      {/* Series A */}
      <path d={pathA} fill="none" stroke="#ef4444" strokeWidth={2} />
      
      {/* Series B */}
      <path d={pathB} fill="none" stroke="#3b82f6" strokeWidth={2} />
      
      {/* Highlight overlap region when lagged */}
      {lag !== 0 && (
        <rect
          x={lag >= 0 ? padding.left : scaleX(Math.abs(lag), seriesA.length)}
          y={padding.top}
          width={chartWidth * (1 - Math.abs(lag) / seriesA.length)}
          height={chartHeight}
          fill="#22c55e"
          fillOpacity={0.1}
        />
      )}
      
      {/* Labels */}
      <text x={padding.left + 5} y={padding.top + 15} fill="#ef4444" fontSize="12" fontWeight="bold">
        Series A
      </text>
      <text x={padding.left + 5} y={padding.top + 30} fill="#3b82f6" fontSize="12" fontWeight="bold">
        Series B
      </text>
      
      {/* X axis label */}
      <text x={width / 2} y={height - 5} textAnchor="middle" fill="#666" fontSize="11">
        Time →
      </text>
    </svg>
  )
}

function CorrelationByLagChart({ seriesA, seriesB, maxLag, currentLag, onLagChange, width = 600, height = 200 }) {
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  // Calculate correlations for all lags
  const lags = []
  const correlations = []
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    lags.push(lag)
    correlations.push(correlationAtLag(seriesA, seriesB, lag))
  }
  
  // Find max correlation and its lag
  const maxCorr = Math.max(...correlations.map(Math.abs))
  const maxCorrIdx = correlations.findIndex(c => Math.abs(c) === maxCorr)
  const maxCorrLag = lags[maxCorrIdx]
  
  const scaleX = (lag) => padding.left + ((lag + maxLag) / (2 * maxLag)) * chartWidth
  const scaleY = (corr) => padding.top + chartHeight / 2 - (corr * chartHeight / 2)
  
  // Generate bar chart
  const barWidth = chartWidth / (2 * maxLag + 1) * 0.8
  
  return (
    <svg width={width} height={height} style={{ background: '#fafafa', borderRadius: 8 }}>
      {/* Zero line */}
      <line
        x1={padding.left}
        y1={scaleY(0)}
        x2={width - padding.right}
        y2={scaleY(0)}
        stroke="#333"
        strokeWidth={1}
      />
      
      {/* +1 and -1 reference lines */}
      <line
        x1={padding.left}
        y1={scaleY(1)}
        x2={width - padding.right}
        y2={scaleY(1)}
        stroke="#ddd"
        strokeDasharray="4,4"
      />
      <line
        x1={padding.left}
        y1={scaleY(-1)}
        x2={width - padding.right}
        y2={scaleY(-1)}
        stroke="#ddd"
        strokeDasharray="4,4"
      />
      
      {/* Bars */}
      {lags.map((lag, i) => {
        const corr = correlations[i]
        const isSelected = lag === currentLag
        const isMax = lag === maxCorrLag
        return (
          <g key={lag}>
            <rect
              x={scaleX(lag) - barWidth / 2}
              y={corr >= 0 ? scaleY(corr) : scaleY(0)}
              width={barWidth}
              height={Math.abs(corr) * chartHeight / 2}
              fill={isSelected ? '#22c55e' : (isMax ? '#f59e0b' : (corr >= 0 ? '#3b82f6' : '#ef4444'))}
              fillOpacity={isSelected ? 1 : 0.7}
              style={{ cursor: 'pointer' }}
              onClick={() => onLagChange(lag)}
            />
          </g>
        )
      })}
      
      {/* Current lag marker */}
      <line
        x1={scaleX(currentLag)}
        y1={padding.top}
        x2={scaleX(currentLag)}
        y2={height - padding.bottom}
        stroke="#22c55e"
        strokeWidth={2}
        strokeDasharray="4,4"
      />
      
      {/* X axis labels */}
      {[-maxLag, -Math.floor(maxLag/2), 0, Math.floor(maxLag/2), maxLag].map(lag => (
        <text
          key={lag}
          x={scaleX(lag)}
          y={height - padding.bottom + 15}
          textAnchor="middle"
          fill="#666"
          fontSize="11"
        >
          {lag}
        </text>
      ))}
      
      {/* Y axis labels */}
      <text x={padding.left - 10} y={scaleY(1) + 4} textAnchor="end" fill="#666" fontSize="10">+1</text>
      <text x={padding.left - 10} y={scaleY(0) + 4} textAnchor="end" fill="#666" fontSize="10">0</text>
      <text x={padding.left - 10} y={scaleY(-1) + 4} textAnchor="end" fill="#666" fontSize="10">-1</text>
      
      {/* Axis label */}
      <text x={width / 2} y={height - 5} textAnchor="middle" fill="#666" fontSize="11">
        Lag (periods)
      </text>
      
      {/* Legend */}
      <text x={width - padding.right - 5} y={padding.top + 15} textAnchor="end" fill="#f59e0b" fontSize="11" fontWeight="bold">
        Max: lag={maxCorrLag}, r={correlations[maxCorrIdx].toFixed(3)}
      </text>
    </svg>
  )
}

function ScatterPlot({ seriesA, seriesB, lag, width = 300, height = 300 }) {
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  // Get aligned data
  const n = seriesA.length
  const alignedA = lag >= 0 ? seriesA.slice(0, n - Math.abs(lag)) : seriesA.slice(Math.abs(lag))
  const alignedB = lag >= 0 ? seriesB.slice(Math.abs(lag)) : seriesB.slice(0, n - Math.abs(lag))
  
  const corr = correlation(alignedA, alignedB)
  
  // Scale
  const minA = Math.min(...alignedA), maxA = Math.max(...alignedA)
  const minB = Math.min(...alignedB), maxB = Math.max(...alignedB)
  const rangeA = maxA - minA || 1
  const rangeB = maxB - minB || 1
  
  const scaleX = (v) => padding.left + ((v - minA) / rangeA) * chartWidth
  const scaleY = (v) => height - padding.bottom - ((v - minB) / rangeB) * chartHeight
  
  // Calculate regression line
  const meanA = mean(alignedA)
  const meanB = mean(alignedB)
  const slope = corr * (stdDev(alignedB) / stdDev(alignedA))
  const intercept = meanB - slope * meanA
  
  return (
    <svg width={width} height={height} style={{ background: '#fafafa', borderRadius: 8 }}>
      {/* Regression line */}
      <line
        x1={scaleX(minA)}
        y1={scaleY(slope * minA + intercept)}
        x2={scaleX(maxA)}
        y2={scaleY(slope * maxA + intercept)}
        stroke="#22c55e"
        strokeWidth={2}
      />
      
      {/* Points */}
      {alignedA.map((a, i) => (
        <circle
          key={i}
          cx={scaleX(a)}
          cy={scaleY(alignedB[i])}
          r={3}
          fill="#6366f1"
          fillOpacity={0.6}
        />
      ))}
      
      {/* Axes labels */}
      <text x={width / 2} y={height - 5} textAnchor="middle" fill="#666" fontSize="11">
        Series A (t)
      </text>
      <text
        x={15}
        y={height / 2}
        textAnchor="middle"
        fill="#666"
        fontSize="11"
        transform={`rotate(-90, 15, ${height / 2})`}
      >
        Series B (t+{lag})
      </text>
      
      {/* Correlation */}
      <text x={width - padding.right - 5} y={padding.top + 15} textAnchor="end" fill="#333" fontSize="12" fontWeight="bold">
        r = {corr.toFixed(3)}
      </text>
    </svg>
  )
}

// ============================================================================
// EXPLANATION COMPONENTS
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

function StepBox({ number, title, children }) {
  return (
    <div className="p-4 bg-white rounded-lg border-l-4 border-blue-400 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
          {number}
        </span>
        <h4 className="font-bold text-blue-800">{title}</h4>
      </div>
      <div className="text-gray-700 ml-8">{children}</div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeadLagCorrelation() {
  const [lag, setLag] = useState(5)
  const [maxLag, setMaxLag] = useState(20)
  const [seriesLength, setSeriesLength] = useState(100)
  const [leadAmount, setLeadAmount] = useState(5)
  const [noiseLevel, setNoiseLevel] = useState(0.3)
  
  // Generate synthetic data: B follows A with a lag
  const seriesA = useMemo(() => generateTimeSeries(seriesLength, 1), [seriesLength])
  const seriesB = useMemo(() => {
    // B is a lagged, noisy version of A
    const lagged = []
    for (let i = 0; i < seriesLength; i++) {
      const sourceIdx = Math.max(0, i - leadAmount)
      const noise = (Math.random() - 0.5) * noiseLevel * 10
      lagged.push(seriesA[sourceIdx] + noise)
    }
    return lagged
  }, [seriesA, leadAmount, noiseLevel, seriesLength])
  
  const currentCorr = useMemo(() => correlationAtLag(seriesA, seriesB, lag), [seriesA, seriesB, lag])
  
  return (
    <Container className="py-8 max-w-5xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Lead-Lag Correlation</h1>
      <p className="text-xl text-gray-600 mb-8">
        Discovering predictive relationships in time series data
      </p>
      
      {/* Interactive Playground */}
      <Section title="Interactive Playground">
        <p className="text-gray-700 mb-4">
          In this demo, <span className="text-blue-600 font-bold">Series B</span> is designed to 
          follow <span className="text-red-600 font-bold">Series A</span> with a lag of{' '}
          <strong>{leadAmount} periods</strong>. Use the controls to explore how correlation 
          changes at different lags.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              True Lag (how much B follows A): {leadAmount} periods
            </label>
            <input
              type="range"
              min="0"
              max="15"
              value={leadAmount}
              onChange={(e) => setLeadAmount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Noise Level: {(noiseLevel * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={noiseLevel * 100}
              onChange={(e) => setNoiseLevel(parseInt(e.target.value) / 100)}
              className="w-full"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-2">Time Series</h3>
          <TimeSeriesChart seriesA={seriesA} seriesB={seriesB} lag={lag} width={700} height={200} />
        </div>
        
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-2">
            Correlation at Different Lags 
            <span className="text-sm font-normal text-gray-500 ml-2">(click a bar to select)</span>
          </h3>
          <CorrelationByLagChart
            seriesA={seriesA}
            seriesB={seriesB}
            maxLag={maxLag}
            currentLag={lag}
            onLagChange={setLag}
            width={700}
            height={200}
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Scatter Plot at Lag = {lag}</h3>
            <ScatterPlot seriesA={seriesA} seriesB={seriesB} lag={lag} width={320} height={300} />
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-bold text-green-800 mb-3">Current Analysis</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Selected Lag:</strong> {lag} periods</div>
              <div><strong>Correlation:</strong> {currentCorr.toFixed(4)}</div>
              <div><strong>Interpretation:</strong></div>
              <p className="text-gray-700 ml-4">
                {lag === leadAmount 
                  ? "✓ This matches the true lag! Maximum correlation found."
                  : lag < leadAmount 
                    ? `Try increasing the lag. The true relationship has B following A by ${leadAmount} periods.`
                    : `Try decreasing the lag. The true relationship has B following A by ${leadAmount} periods.`
                }
              </p>
            </div>
          </div>
        </div>
      </Section>
      
      {/* What is Lead-Lag? */}
      <Section title="What is Lead-Lag Correlation?">
        <p className="text-gray-700 mb-4">
          A <strong>lead-lag relationship</strong> exists when changes in one time series 
          (the "leader") consistently precede similar changes in another series (the "follower").
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h4 className="font-bold text-red-800 mb-2">📈 Leading Indicator</h4>
            <p className="text-sm text-gray-700">
              A series that moves <em>before</em> another. If A leads B by 5 periods, 
              then A's value today predicts B's value 5 periods from now.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">📉 Lagging Indicator</h4>
            <p className="text-sm text-gray-700">
              A series that moves <em>after</em> another. If B lags A by 5 periods,
              then B's movements can be predicted using A's past values.
            </p>
          </div>
        </div>
        
        <p className="text-gray-700">
          Finding these relationships is valuable for <strong>forecasting</strong> — if we know 
          that security B follows security A with a 3-day lag, we can use today's movement in A 
          to predict B's movement 3 days from now.
        </p>
      </Section>
      
      {/* The Math */}
      <Section title="The Mathematics">
        <p className="text-gray-700 mb-4">
          Lead-lag analysis uses <strong>cross-correlation</strong> — the correlation between 
          two series at different time offsets.
        </p>
        
        <StepBox number={1} title="Standard Correlation (Lag = 0)">
          <p>First, recall the Pearson correlation coefficient:</p>
          <FormulaBox>
            r = Σ[(Aᵢ - μₐ)(Bᵢ - μᵦ)] / (n · σₐ · σᵦ)
          </FormulaBox>
          <p className="text-sm">
            This measures how A and B move together <em>at the same time</em>.
          </p>
        </StepBox>
        
        <StepBox number={2} title="Lagged Correlation">
          <p>To find correlation at lag k, we shift one series:</p>
          <FormulaBox>
            r(k) = Σ[(Aᵢ - μₐ)(Bᵢ₊ₖ - μᵦ)] / (n · σₐ · σᵦ)
          </FormulaBox>
          <p className="text-sm">
            Positive k: B is shifted forward (B follows A)<br/>
            Negative k: A is shifted forward (A follows B)
          </p>
        </StepBox>
        
        <StepBox number={3} title="Find the Optimal Lag">
          <p>Calculate correlation for all lags from -maxLag to +maxLag:</p>
          <FormulaBox>
            optimal_lag = argmax |r(k)| for k ∈ [-maxLag, +maxLag]
          </FormulaBox>
          <p className="text-sm">
            The lag with the highest absolute correlation indicates the strongest lead-lag relationship.
          </p>
        </StepBox>
        
        <StepBox number={4} title="Interpret the Results">
          <ul className="list-disc list-inside text-sm space-y-1">
            <li><strong>optimal_lag {'>'} 0:</strong> B follows A (A leads B)</li>
            <li><strong>optimal_lag {'<'} 0:</strong> A follows B (B leads A)</li>
            <li><strong>r {'>'} 0:</strong> Positive correlation (they move in the same direction)</li>
            <li><strong>r {'<'} 0:</strong> Negative correlation (they move in opposite directions)</li>
          </ul>
        </StepBox>
      </Section>
      
      {/* Trading Applications */}
      <Section title="Applications in Trading">
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-bold text-amber-800 mb-2">🎯 Strategy: Lead-Lag Arbitrage</h4>
            <p className="text-sm text-gray-700 mb-2">
              If asset A consistently leads asset B by k periods with correlation r:
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-4">
              <li>Monitor A's price movement at time t</li>
              <li>Predict B's direction at time t+k using the correlation</li>
              <li>Take position in B before the expected move</li>
              <li>Close position after B moves (or at t+k+1)</li>
            </ol>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-bold text-purple-800 mb-2">⚠️ Important Caveats</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Correlations are <strong>not stable</strong> — they change over time</li>
              <li>Must exceed <strong>transaction costs</strong> to be profitable</li>
              <li>May be <strong>spurious</strong> — always validate out-of-sample</li>
              <li><strong>Crowded trades</strong> can eliminate the edge</li>
            </ul>
          </div>
        </div>
      </Section>
      
      {/* Experiments */}
      <Section title="Experiments to Try">
        <div className="space-y-3 text-gray-700">
          <p>
            <strong>1.</strong> Set the noise level to 0%. What lag gives the highest correlation?
          </p>
          <p>
            <strong>2.</strong> Increase noise to 80%. Can you still identify the true lag?
          </p>
          <p>
            <strong>3.</strong> Set the true lag to 0. What does the correlation-by-lag chart look like?
          </p>
          <p>
            <strong>4.</strong> Look at the scatter plot at different lags. How does the spread change?
          </p>
        </div>
      </Section>
    </Container>
  )
}
