import React, { useState, useMemo, useCallback } from "react";
import { Container } from "../components/SharedUI.jsx";

// Lead-Lag Correlation Tutorial
// Interactive exploration of time-shifted correlations for trading

// Generate synthetic price series with optional lead-lag relationship
function generatePriceSeries(days, seed = 1, volatility = 0.02) {
  const prices = [100];
  let state = seed;
  for (let i = 1; i < days; i++) {
    state = (state * 9301 + 49297) % 233280;
    const rand = (state / 233280 - 0.5) * 2;
    const change = 1 + rand * volatility;
    prices.push(prices[i - 1] * change);
  }
  return prices;
}

// Generate correlated series with a lag
function generateLaggedSeries(leader, lag, correlation, seed = 2) {
  const n = leader.length;
  const leaderReturns = leader.slice(1).map((p, i) => (p - leader[i]) / leader[i]);
  
  // Generate noise
  const noise = [];
  let state = seed;
  for (let i = 0; i < n - 1; i++) {
    state = (state * 9301 + 49297) % 233280;
    noise.push((state / 233280 - 0.5) * 2 * 0.02);
  }
  
  // Create lagged correlated returns
  const followerReturns = [];
  for (let i = 0; i < n - 1; i++) {
    const laggedIdx = i - lag;
    if (laggedIdx >= 0 && laggedIdx < leaderReturns.length) {
      followerReturns.push(correlation * leaderReturns[laggedIdx] + (1 - Math.abs(correlation)) * noise[i]);
    } else {
      followerReturns.push(noise[i]);
    }
  }
  
  // Convert returns back to prices
  const prices = [100];
  for (let i = 0; i < followerReturns.length; i++) {
    prices.push(prices[i] * (1 + followerReturns[i]));
  }
  return prices;
}

// Calculate returns from prices
function calculateReturns(prices) {
  return prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
}

// Calculate correlation between two arrays
function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0;
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : numerator / denom;
}

// Calculate correlation at a specific lag
function calculateLaggedCorrelation(leader, follower, lag) {
  if (lag < 0) {
    // Negative lag: follower leads
    const x = follower.slice(0, follower.length + lag);
    const y = leader.slice(-lag);
    return calculateCorrelation(x, y);
  } else if (lag > 0) {
    // Positive lag: leader leads
    const x = leader.slice(0, leader.length - lag);
    const y = follower.slice(lag);
    return calculateCorrelation(x, y);
  } else {
    return calculateCorrelation(leader, follower);
  }
}

// ============================================================================
// SECTION 1: What is Correlation?
// ============================================================================

function CorrelationBasics({ data1, data2, correlation }) {
  const width = 400;
  const height = 300;
  const padding = 40;
  
  // Create scatter plot data
  const points = data1.map((x, i) => ({ x, y: data2[i] }));
  
  // Scale functions
  const xMin = Math.min(...data1);
  const xMax = Math.max(...data1);
  const yMin = Math.min(...data2);
  const yMax = Math.max(...data2);
  
  const scaleX = (x) => padding + ((x - xMin) / (xMax - xMin)) * (width - 2 * padding);
  const scaleY = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);
  
  // Calculate regression line
  const meanX = data1.reduce((a, b) => a + b, 0) / data1.length;
  const meanY = data2.reduce((a, b) => a + b, 0) / data2.length;
  const slope = correlation * (Math.sqrt(data2.reduce((a, b) => a + (b - meanY) ** 2, 0)) / 
                               Math.sqrt(data1.reduce((a, b) => a + (b - meanX) ** 2, 0)));
  const intercept = meanY - slope * meanX;
  
  return (
    <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} 
            stroke="#4a5568" strokeWidth={1} />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} 
            stroke="#4a5568" strokeWidth={1} />
      
      {/* Regression line */}
      <line 
        x1={scaleX(xMin)} 
        y1={scaleY(slope * xMin + intercept)}
        x2={scaleX(xMax)} 
        y2={scaleY(slope * xMax + intercept)}
        stroke="#f59e0b" 
        strokeWidth={2}
        strokeDasharray="5,5"
      />
      
      {/* Points */}
      {points.map((p, i) => (
        <circle 
          key={i}
          cx={scaleX(p.x)} 
          cy={scaleY(p.y)} 
          r={4} 
          fill="#06b6d4"
          opacity={0.7}
        />
      ))}
      
      {/* Labels */}
      <text x={width / 2} y={height - 10} fill="#e8e8e8" fontSize={12} textAnchor="middle">
        Stock A Returns
      </text>
      <text x={15} y={height / 2} fill="#e8e8e8" fontSize={12} textAnchor="middle" 
            transform={`rotate(-90, 15, ${height/2})`}>
        Stock B Returns
      </text>
      
      {/* Correlation value */}
      <text x={width - padding} y={padding + 20} fill="#22c55e" fontSize={14} textAnchor="end" fontWeight="bold">
        r = {correlation.toFixed(3)}
      </text>
    </svg>
  );
}

// ============================================================================
// SECTION 2: Time Series Visualization
// ============================================================================

function TimeSeriesChart({ series1, series2, label1, label2, highlightLag = 0 }) {
  const width = 600;
  const height = 250;
  const padding = 50;
  
  const allValues = [...series1, ...series2];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  
  const scaleX = (i) => padding + (i / (series1.length - 1)) * (width - 2 * padding);
  const scaleY = (v) => height - padding - ((v - minVal) / (maxVal - minVal)) * (height - 2 * padding);
  
  // Create path strings
  const path1 = series1.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ');
  const path2 = series2.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ');
  
  return (
    <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(frac => (
        <line 
          key={frac}
          x1={padding} 
          y1={padding + frac * (height - 2 * padding)}
          x2={width - padding}
          y2={padding + frac * (height - 2 * padding)}
          stroke="#2d3748"
          strokeWidth={1}
        />
      ))}
      
      {/* Highlight lag region if applicable */}
      {highlightLag > 0 && (
        <rect
          x={scaleX(0)}
          y={padding}
          width={scaleX(highlightLag) - scaleX(0)}
          height={height - 2 * padding}
          fill="#f59e0b"
          opacity={0.1}
        />
      )}
      
      {/* Series lines */}
      <path d={path1} fill="none" stroke="#22c55e" strokeWidth={2} />
      <path d={path2} fill="none" stroke="#06b6d4" strokeWidth={2} />
      
      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} 
            stroke="#4a5568" strokeWidth={1} />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} 
            stroke="#4a5568" strokeWidth={1} />
      
      {/* Legend */}
      <rect x={width - 150} y={padding} width={12} height={12} fill="#22c55e" />
      <text x={width - 130} y={padding + 10} fill="#e8e8e8" fontSize={12}>{label1}</text>
      <rect x={width - 150} y={padding + 20} width={12} height={12} fill="#06b6d4" />
      <text x={width - 130} y={padding + 30} fill="#e8e8e8" fontSize={12}>{label2}</text>
      
      {/* X axis label */}
      <text x={width / 2} y={height - 10} fill="#e8e8e8" fontSize={12} textAnchor="middle">
        Time (days)
      </text>
    </svg>
  );
}

// ============================================================================
// SECTION 3: Lag Correlation Heatmap
// ============================================================================

function LagCorrelationChart({ correlations, currentLag, onLagChange }) {
  const width = 600;
  const height = 200;
  const padding = 50;
  const barWidth = (width - 2 * padding) / correlations.length;
  
  const maxCorr = Math.max(...correlations.map(Math.abs));
  
  return (
    <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
      {/* Zero line */}
      <line 
        x1={padding} 
        y1={height / 2}
        x2={width - padding}
        y2={height / 2}
        stroke="#4a5568"
        strokeWidth={1}
      />
      
      {/* Bars */}
      {correlations.map((corr, i) => {
        const barHeight = Math.abs(corr) / maxCorr * (height / 2 - padding);
        const isPositive = corr >= 0;
        const isSelected = i === currentLag;
        
        return (
          <g key={i}>
            <rect
              x={padding + i * barWidth + 2}
              y={isPositive ? height / 2 - barHeight : height / 2}
              width={barWidth - 4}
              height={barHeight}
              fill={isSelected ? '#f59e0b' : (isPositive ? '#22c55e' : '#ef4444')}
              opacity={isSelected ? 1 : 0.7}
              style={{ cursor: 'pointer' }}
              onClick={() => onLagChange(i)}
            />
            {/* Lag label every 5 */}
            {i % 5 === 0 && (
              <text 
                x={padding + i * barWidth + barWidth / 2} 
                y={height - 10} 
                fill="#a0aec0" 
                fontSize={10} 
                textAnchor="middle"
              >
                {i}
              </text>
            )}
          </g>
        );
      })}
      
      {/* Y axis labels */}
      <text x={padding - 5} y={padding + 10} fill="#a0aec0" fontSize={10} textAnchor="end">
        +{maxCorr.toFixed(2)}
      </text>
      <text x={padding - 5} y={height / 2 + 4} fill="#a0aec0" fontSize={10} textAnchor="end">
        0
      </text>
      <text x={padding - 5} y={height - padding - 5} fill="#a0aec0" fontSize={10} textAnchor="end">
        -{maxCorr.toFixed(2)}
      </text>
      
      {/* Title */}
      <text x={width / 2} y={20} fill="#e8e8e8" fontSize={14} textAnchor="middle" fontWeight="bold">
        Correlation by Lag (days)
      </text>
      
      {/* Current correlation indicator */}
      <text x={width - padding} y={20} fill="#f59e0b" fontSize={12} textAnchor="end">
        Lag {currentLag}: r = {correlations[currentLag]?.toFixed(3) || 'N/A'}
      </text>
    </svg>
  );
}

// ============================================================================
// SECTION 4: Interactive Step-by-Step Explainer
// ============================================================================

function StepExplainer({ step, totalSteps, onStepChange }) {
  const steps = [
    {
      title: "What is Correlation?",
      content: `Correlation measures how two variables move together. When r = +1, they move 
                perfectly in sync. When r = -1, they move in opposite directions. When r = 0, 
                there's no relationship.`,
      formula: "r = Σ[(xᵢ - x̄)(yᵢ - ȳ)] / √[Σ(xᵢ - x̄)² × Σ(yᵢ - ȳ)²]"
    },
    {
      title: "Why Returns, Not Prices?",
      content: `Stock prices trend upward over time, creating false correlations. Returns 
                (percent change) are stationary and show the actual co-movement. 
                A $100 stock moving to $101 (+1%) should be comparable to a $50 stock 
                moving to $50.50 (+1%).`,
      formula: "Return = (Pₜ - Pₜ₋₁) / Pₜ₋₁"
    },
    {
      title: "What is Lag?",
      content: `Lag shifts one time series relative to another. If Stock B consistently 
                moves 3 days after Stock A, that's a lag of 3. We test different lags 
                (0, 1, 2, ... N days) to find the strongest relationship.`,
      formula: "Correlation at lag k = corr(Aₜ, Bₜ₊ₖ)"
    },
    {
      title: "Lead-Lag Relationships",
      content: `If we find that Stock A's returns today correlate with Stock B's returns 
                tomorrow (lag=1), that's predictive! We can potentially trade on this: 
                when A moves, we bet on B moving similarly the next day.`,
      formula: "Signal: if corr(Aₜ, Bₜ₊ₖ) > threshold, trade B based on A"
    },
    {
      title: "The Trading Threshold",
      content: `Correlation must exceed trading fees to be profitable. If round-trip 
                fees are 0.15%, a correlation of 0.10 won't generate enough edge. 
                We typically look for |r| > 0.20 (20%) with at least 1 day lag.`,
      formula: "Required: |correlation| × avg_move > 2 × fees"
    },
    {
      title: "Why Exclude Zero Lag?",
      content: `Zero lag (same-day correlation) isn't predictive — by the time you see 
                both moves, it's too late to trade. We need lag ≥ 1 to have time to 
                observe the leader and act before the follower moves.`,
      formula: "Tradeable: lag ≥ 1 AND |r| > fee_threshold"
    }
  ];
  
  const current = steps[step];
  
  return (
    <div style={{ 
      background: '#1a1a2e', 
      borderRadius: '8px', 
      padding: '24px',
      marginBottom: '20px'
    }}>
      {/* Step indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => onStepChange(i)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: i === step ? '#f59e0b' : '#2d3748',
              color: i === step ? '#000' : '#a0aec0',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <h3 style={{ color: '#f59e0b', marginBottom: '12px', fontSize: '20px' }}>
        {current.title}
      </h3>
      <p style={{ color: '#e8e8e8', lineHeight: '1.6', marginBottom: '16px' }}>
        {current.content}
      </p>
      
      {/* Formula */}
      <div style={{ 
        background: '#0d0d1a', 
        padding: '12px 16px', 
        borderRadius: '4px',
        fontFamily: 'monospace',
        color: '#22c55e',
        fontSize: '14px'
      }}>
        {current.formula}
      </div>
      
      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button
          onClick={() => onStepChange(Math.max(0, step - 1))}
          disabled={step === 0}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            background: step === 0 ? '#2d3748' : '#4a5568',
            color: step === 0 ? '#4a5568' : '#e8e8e8',
            cursor: step === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ← Previous
        </button>
        <button
          onClick={() => onStepChange(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            background: step === steps.length - 1 ? '#2d3748' : '#f59e0b',
            color: step === steps.length - 1 ? '#4a5568' : '#000',
            cursor: step === steps.length - 1 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeadLagCorrelation() {
  // State
  const [step, setStep] = useState(0);
  const [trueLag, setTrueLag] = useState(3);
  const [trueCorrelation, setTrueCorrelation] = useState(0.6);
  const [selectedLag, setSelectedLag] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Generate synthetic data
  const { leader, follower, leaderReturns, followerReturns, lagCorrelations } = useMemo(() => {
    const leaderPrices = generatePriceSeries(100, 42, 0.025);
    const followerPrices = generateLaggedSeries(leaderPrices, trueLag, trueCorrelation, 123);
    
    const lReturns = calculateReturns(leaderPrices);
    const fReturns = calculateReturns(followerPrices);
    
    // Calculate correlations at different lags
    const correlations = [];
    for (let lag = 0; lag <= 20; lag++) {
      correlations.push(calculateLaggedCorrelation(lReturns, fReturns, lag));
    }
    
    return {
      leader: leaderPrices,
      follower: followerPrices,
      leaderReturns: lReturns,
      followerReturns: fReturns,
      lagCorrelations: correlations
    };
  }, [trueLag, trueCorrelation]);
  
  // Find the best lag
  const bestLag = useMemo(() => {
    let maxCorr = 0;
    let bestIdx = 0;
    lagCorrelations.forEach((corr, i) => {
      if (i > 0 && Math.abs(corr) > Math.abs(maxCorr)) { // Exclude lag 0
        maxCorr = corr;
        bestIdx = i;
      }
    });
    return { lag: bestIdx, correlation: maxCorr };
  }, [lagCorrelations]);
  
  return (
    <Container className="py-8">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '12px' }}>
          Lead-Lag Correlation
        </h1>
        <p style={{ fontSize: '18px', color: '#4a5568', maxWidth: '600px', margin: '0 auto' }}>
          Discover how to find predictive relationships between securities by measuring 
          time-shifted correlations
        </p>
      </div>
      
      {/* Step-by-step explainer */}
      <StepExplainer step={step} totalSteps={6} onStepChange={setStep} />
      
      {/* Interactive Demo Section */}
      <div style={{ 
        background: '#f7fafc', 
        borderRadius: '12px', 
        padding: '24px',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '20px' }}>
          🔬 Interactive Playground
        </h2>
        
        {/* Controls */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
              True Lag (hidden): {trueLag} days
            </label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={trueLag}
              onChange={(e) => {
                setTrueLag(parseInt(e.target.value));
                setShowAnswer(false);
              }}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
              This controls how many days the follower lags behind the leader
            </p>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
              True Correlation Strength: {(trueCorrelation * 100).toFixed(0)}%
            </label>
            <input 
              type="range" 
              min="0.1" 
              max="0.9" 
              step="0.1"
              value={trueCorrelation}
              onChange={(e) => {
                setTrueCorrelation(parseFloat(e.target.value));
                setShowAnswer(false);
              }}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
              How strongly the follower responds to the leader's movements
            </p>
          </div>
        </div>
        
        {/* Time Series Chart */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>
            Price Series (can you spot the lag?)
          </h3>
          <TimeSeriesChart 
            series1={leader}
            series2={follower}
            label1="Leader (A)"
            label2="Follower (B)"
            highlightLag={showAnswer ? trueLag : 0}
          />
        </div>
        
        {/* Correlation Scatter Plot */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>
              Returns Scatter (Lag = {selectedLag})
            </h3>
            {selectedLag === 0 ? (
              <CorrelationBasics 
                data1={leaderReturns}
                data2={followerReturns}
                correlation={lagCorrelations[0]}
              />
            ) : (
              <CorrelationBasics 
                data1={leaderReturns.slice(0, -selectedLag)}
                data2={followerReturns.slice(selectedLag)}
                correlation={lagCorrelations[selectedLag]}
              />
            )}
          </div>
          
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2d3748', marginBottom: '12px' }}>
              Correlation by Lag (click to explore)
            </h3>
            <LagCorrelationChart 
              correlations={lagCorrelations}
              currentLag={selectedLag}
              onLagChange={setSelectedLag}
            />
          </div>
        </div>
        
        {/* Challenge */}
        <div style={{ 
          background: '#1a1a2e', 
          borderRadius: '8px', 
          padding: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '12px' }}>
            🎯 Challenge: Find the True Lag!
          </h3>
          <p style={{ color: '#e8e8e8', marginBottom: '16px' }}>
            Click on the correlation bars above to find which lag has the strongest relationship.
            Remember: we exclude lag=0 because it's not predictive!
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
            <div style={{ color: '#a0aec0' }}>
              Your guess: <strong style={{ color: '#06b6d4' }}>Lag {selectedLag}</strong>
              {selectedLag === 0 && <span style={{ color: '#ef4444' }}> (not tradeable!)</span>}
            </div>
            
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#22c55e',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {showAnswer ? 'Hide Answer' : 'Reveal Answer'}
            </button>
          </div>
          
          {showAnswer && (
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              background: '#0d0d1a', 
              borderRadius: '6px' 
            }}>
              <p style={{ color: '#22c55e', fontSize: '18px', fontWeight: 'bold' }}>
                True lag: {trueLag} days | Best detected lag: {bestLag.lag} days
              </p>
              <p style={{ color: '#a0aec0', marginTop: '8px' }}>
                Correlation at best lag: <strong style={{ color: '#f59e0b' }}>
                  {(bestLag.correlation * 100).toFixed(1)}%
                </strong>
                {Math.abs(bestLag.correlation) > 0.2 
                  ? " ✅ Potentially tradeable!" 
                  : " ⚠️ Below typical trading threshold (20%)"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Real-World Application */}
      <div style={{ 
        background: '#fff', 
        border: '2px solid #e2e8f0',
        borderRadius: '12px', 
        padding: '24px',
        marginBottom: '30px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px' }}>
          📈 Real-World Application
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div>
            <h3 style={{ color: '#2d3748', fontWeight: '600', marginBottom: '8px' }}>
              What We're Building
            </h3>
            <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
              In the quant project, we scan hundreds of securities looking for pairs where:
            </p>
            <ul style={{ color: '#4a5568', marginTop: '8px', paddingLeft: '20px' }}>
              <li>Correlation is significant (|r| &gt; 0.20)</li>
              <li>Lag is at least 1 period (predictive, not coincident)</li>
              <li>The relationship is stable over time</li>
            </ul>
          </div>
          
          <div>
            <h3 style={{ color: '#2d3748', fontWeight: '600', marginBottom: '8px' }}>
              Top Findings from Our Data
            </h3>
            <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px' }}>
              <p style={{ fontFamily: 'monospace', fontSize: '14px', color: '#2d3748' }}>
                1. SO ↔ ATOM: +34% corr, 18h lag<br />
                2. NKE ↔ ATOM: +29% corr, 17h lag<br />
                3. GOOGL ↔ NEAR: -28% corr, 20h lag<br />
                4. KO ↔ LINK: -28% corr, 19h lag<br />
                5. AVGO ↔ SOL: +27% corr, 16h lag
              </p>
            </div>
            <p style={{ color: '#718096', fontSize: '13px', marginTop: '8px' }}>
              These are real relationships found in 6 months of stock/crypto data!
            </p>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%)',
        borderRadius: '12px', 
        padding: '24px',
        color: '#fff'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          🎓 Key Takeaways
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>1. Use Returns</h4>
            <p style={{ color: '#e8e8e8', fontSize: '14px' }}>
              Convert prices to returns to measure true co-movement without trend bias.
            </p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>2. Test Multiple Lags</h4>
            <p style={{ color: '#e8e8e8', fontSize: '14px' }}>
              The peak correlation might not be at lag=0. Scan lags 1-20 to find the sweet spot.
            </p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>3. Exclude Zero Lag</h4>
            <p style={{ color: '#e8e8e8', fontSize: '14px' }}>
              Same-day correlation isn't predictive. You need lag ≥ 1 to trade on the signal.
            </p>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>4. Beat the Fees</h4>
            <p style={{ color: '#e8e8e8', fontSize: '14px' }}>
              Correlation must be strong enough to overcome trading costs. Target |r| &gt; 0.20.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}
