import React, { useState, useMemo } from "react";
import { Container } from "../components/SharedUI.jsx";

// ============================================================================
// LEAD-LAG CORRELATION TUTORIAL
// Comprehensive coverage of correlation math, geometric intuition, and algorithms
// ============================================================================

// Deterministic random number generator
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// Generate synthetic price series
function generatePriceSeries(days, seed = 1, volatility = 0.02) {
  const rand = seededRandom(seed);
  const prices = [100];
  for (let i = 1; i < days; i++) {
    const change = 1 + (rand() - 0.5) * 2 * volatility;
    prices.push(prices[i - 1] * change);
  }
  return prices;
}

// Generate correlated series with a lag
function generateLaggedSeries(leader, lag, correlation, seed = 2) {
  const rand = seededRandom(seed);
  const n = leader.length;
  const leaderReturns = leader.slice(1).map((p, i) => (p - leader[i]) / leader[i]);
  
  const followerReturns = [];
  for (let i = 0; i < n - 1; i++) {
    const noise = (rand() - 0.5) * 2 * 0.02;
    const laggedIdx = i - lag;
    if (laggedIdx >= 0 && laggedIdx < leaderReturns.length) {
      followerReturns.push(correlation * leaderReturns[laggedIdx] + (1 - Math.abs(correlation)) * noise);
    } else {
      followerReturns.push(noise);
    }
  }
  
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

// Calculate mean
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Calculate standard deviation
function std(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

// Calculate covariance
function covariance(x, y) {
  const mx = mean(x);
  const my = mean(y);
  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - mx) * (y[i] - my);
  }
  return sum / x.length;
}

// Calculate correlation
function correlation(x, y) {
  const cov = covariance(x, y);
  const sx = std(x);
  const sy = std(y);
  return sx === 0 || sy === 0 ? 0 : cov / (sx * sy);
}

// Calculate correlation at a specific lag
function laggedCorrelation(leader, follower, lag) {
  if (lag === 0) {
    return correlation(leader, follower);
  }
  const x = leader.slice(0, leader.length - lag);
  const y = follower.slice(lag);
  return correlation(x, y);
}

// ============================================================================
// VISUALIZATION COMPONENTS
// ============================================================================

// Covariance vs Correlation visualization
function CovarianceVsCorrelation({ data1, data2, scale1 = 1, scale2 = 1 }) {
  const scaled1 = data1.map(x => x * scale1);
  const scaled2 = data2.map(x => x * scale2);
  
  const cov = covariance(scaled1, scaled2);
  const corr = correlation(scaled1, scaled2);
  
  const width = 350;
  const height = 280;
  const padding = 45;
  
  const xMin = Math.min(...scaled1);
  const xMax = Math.max(...scaled1);
  const yMin = Math.min(...scaled2);
  const yMax = Math.max(...scaled2);
  
  const scaleX = (x) => padding + ((x - xMin) / (xMax - xMin || 1)) * (width - 2 * padding);
  const scaleY = (y) => height - padding - ((y - yMin) / (yMax - yMin || 1)) * (height - 2 * padding);
  
  return (
    <div>
      <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4a5568" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4a5568" />
        
        {/* Points */}
        {scaled1.map((x, i) => (
          <circle key={i} cx={scaleX(x)} cy={scaleY(scaled2[i])} r={3} fill="#06b6d4" opacity={0.7} />
        ))}
        
        {/* Labels */}
        <text x={width / 2} y={height - 8} fill="#a0aec0" fontSize={11} textAnchor="middle">X (scaled: ×{scale1})</text>
        <text x={12} y={height / 2} fill="#a0aec0" fontSize={11} textAnchor="middle" transform={`rotate(-90, 12, ${height/2})`}>Y (scaled: ×{scale2})</text>
      </svg>
      <div style={{ marginTop: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
        <div style={{ color: '#f59e0b' }}>Covariance: <strong>{cov.toFixed(4)}</strong> <span style={{ color: '#a0aec0' }}>(scale-dependent)</span></div>
        <div style={{ color: '#22c55e' }}>Correlation: <strong>{corr.toFixed(4)}</strong> <span style={{ color: '#a0aec0' }}>(always -1 to +1)</span></div>
      </div>
    </div>
  );
}

// Geometric interpretation: vectors and angles
function GeometricVisualization({ x, y }) {
  const width = 350;
  const height = 280;
  const cx = width / 2;
  const cy = height / 2;
  const scale = 80;
  
  // Center the data
  const mx = mean(x);
  const my = mean(y);
  const xCentered = x.map(v => v - mx);
  const yCentered = y.map(v => v - my);
  
  // Normalize for visualization (first 2 components as 2D projection)
  const xNorm = Math.sqrt(xCentered.reduce((a, b) => a + b * b, 0));
  const yNorm = Math.sqrt(yCentered.reduce((a, b) => a + b * b, 0));
  
  // Use first two "dimensions" to visualize (simplified 2D projection)
  const x1 = xCentered[0] / (xNorm || 1);
  const x2 = xCentered[1] / (xNorm || 1);
  const y1 = yCentered[0] / (yNorm || 1);
  const y2 = yCentered[1] / (yNorm || 1);
  
  const corr = correlation(x, y);
  const angle = Math.acos(Math.min(1, Math.max(-1, corr))) * 180 / Math.PI;
  
  return (
    <div>
      <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
        {/* Grid */}
        <line x1={padding} y1={cy} x2={width - padding} y2={cy} stroke="#2d3748" />
        <line x1={cx} y1={padding} x2={cx} y2={height - padding} stroke="#2d3748" />
        
        {/* Vector X */}
        <line x1={cx} y1={cy} x2={cx + x1 * scale} y2={cy - x2 * scale} stroke="#22c55e" strokeWidth={3} markerEnd="url(#arrowGreen)" />
        <text x={cx + x1 * scale + 10} y={cy - x2 * scale} fill="#22c55e" fontSize={14} fontWeight="bold">X</text>
        
        {/* Vector Y */}
        <line x1={cx} y1={cy} x2={cx + y1 * scale} y2={cy - y2 * scale} stroke="#06b6d4" strokeWidth={3} markerEnd="url(#arrowCyan)" />
        <text x={cx + y1 * scale + 10} y={cy - y2 * scale} fill="#06b6d4" fontSize={14} fontWeight="bold">Y</text>
        
        {/* Angle arc */}
        <path
          d={`M ${cx + 30} ${cy} A 30 30 0 0 0 ${cx + 30 * Math.cos(angle * Math.PI / 180)} ${cy - 30 * Math.sin(angle * Math.PI / 180)}`}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="4,2"
        />
        
        {/* Arrow markers */}
        <defs>
          <marker id="arrowGreen" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
          </marker>
          <marker id="arrowCyan" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#06b6d4" />
          </marker>
        </defs>
        
        {/* Title */}
        <text x={width / 2} y={25} fill="#e8e8e8" fontSize={13} textAnchor="middle">Correlation = cos(θ)</text>
      </svg>
      <div style={{ marginTop: '12px', fontFamily: 'monospace', fontSize: '13px', color: '#e8e8e8' }}>
        <div>Angle θ ≈ <span style={{ color: '#f59e0b' }}>{angle.toFixed(1)}°</span></div>
        <div>cos(θ) = r = <span style={{ color: '#22c55e' }}>{corr.toFixed(4)}</span></div>
      </div>
    </div>
  );
}

// Time series chart
function TimeSeriesChart({ series1, series2, label1, label2, highlightLag = 0 }) {
  const width = 580;
  const height = 220;
  const padding = 45;
  
  const allValues = [...series1, ...series2];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  
  const scaleX = (i) => padding + (i / (series1.length - 1)) * (width - 2 * padding);
  const scaleY = (v) => height - padding - ((v - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);
  
  const path1 = series1.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ');
  const path2 = series2.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(v)}`).join(' ');
  
  return (
    <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
      {highlightLag > 0 && (
        <rect x={scaleX(0)} y={padding} width={scaleX(highlightLag) - scaleX(0)} height={height - 2 * padding} fill="#f59e0b" opacity={0.1} />
      )}
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
  );
}

// Lag correlation bar chart
function LagCorrelationChart({ correlations, currentLag, onLagChange }) {
  const width = 580;
  const height = 180;
  const padding = 45;
  const barWidth = (width - 2 * padding) / correlations.length;
  const maxCorr = Math.max(0.1, ...correlations.map(Math.abs));
  
  return (
    <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
      <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#4a5568" />
      {correlations.map((corr, i) => {
        const barHeight = Math.abs(corr) / maxCorr * (height / 2 - padding);
        const isPositive = corr >= 0;
        const isSelected = i === currentLag;
        const isZero = i === 0;
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
            {i % 5 === 0 && (
              <text x={padding + i * barWidth + barWidth / 2} y={height - 8} fill="#a0aec0" fontSize={10} textAnchor="middle">{i}</text>
            )}
          </g>
        );
      })}
      <text x={padding - 5} y={padding + 10} fill="#a0aec0" fontSize={10} textAnchor="end">+{maxCorr.toFixed(2)}</text>
      <text x={padding - 5} y={height / 2 + 4} fill="#a0aec0" fontSize={10} textAnchor="end">0</text>
      <text x={padding - 5} y={height - padding - 5} fill="#a0aec0" fontSize={10} textAnchor="end">-{maxCorr.toFixed(2)}</text>
      <text x={width / 2} y={18} fill="#e8e8e8" fontSize={13} textAnchor="middle" fontWeight="bold">Correlation by Lag</text>
      <text x={width - padding} y={18} fill="#f59e0b" fontSize={11} textAnchor="end">Lag {currentLag}: r = {correlations[currentLag]?.toFixed(3)}</text>
      {/* Mark lag 0 as non-tradeable */}
      <text x={padding + barWidth / 2} y={height / 2 + 45} fill="#6b7280" fontSize={9} textAnchor="middle">✗</text>
    </svg>
  );
}

// Scatter plot for returns
function ScatterPlot({ x, y, title }) {
  const width = 280;
  const height = 250;
  const padding = 40;
  
  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const yMin = Math.min(...y);
  const yMax = Math.max(...y);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  
  const scaleX = (v) => padding + ((v - xMin) / xRange) * (width - 2 * padding);
  const scaleY = (v) => height - padding - ((v - yMin) / yRange) * (height - 2 * padding);
  
  const corr = correlation(x, y);
  
  return (
    <svg width={width} height={height} style={{ background: '#1a1a2e', borderRadius: '8px' }}>
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4a5568" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4a5568" />
      {x.map((xv, i) => (
        <circle key={i} cx={scaleX(xv)} cy={scaleY(y[i])} r={2.5} fill="#06b6d4" opacity={0.6} />
      ))}
      <text x={width / 2} y={18} fill="#e8e8e8" fontSize={12} textAnchor="middle">{title}</text>
      <text x={width - padding} y={padding + 15} fill="#22c55e" fontSize={12} textAnchor="end">r = {corr.toFixed(3)}</text>
      <text x={width / 2} y={height - 8} fill="#a0aec0" fontSize={10} textAnchor="middle">Leader returns</text>
      <text x={12} y={height / 2} fill="#a0aec0" fontSize={10} textAnchor="middle" transform={`rotate(-90, 12, ${height/2})`}>Follower returns</text>
    </svg>
  );
}

// Complexity calculator
function ComplexityCalculator() {
  const [securities, setSecurities] = useState(200);
  const [lags, setLags] = useState(20);
  const [periods, setPeriods] = useState(4000);
  
  const naiveOps = securities * securities * lags * periods;
  const fftOps = securities * securities * periods * Math.log2(periods);
  const speedup = naiveOps / fftOps;
  
  return (
    <div style={{ background: '#0d0d1a', padding: '16px', borderRadius: '8px' }}>
      <h4 style={{ color: '#f59e0b', marginBottom: '12px' }}>Complexity Calculator</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ color: '#a0aec0', fontSize: '12px', display: 'block' }}>Securities (N)</label>
          <input type="number" value={securities} onChange={(e) => setSecurities(+e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', background: '#1a1a2e', color: '#e8e8e8' }} />
        </div>
        <div>
          <label style={{ color: '#a0aec0', fontSize: '12px', display: 'block' }}>Max Lags (K)</label>
          <input type="number" value={lags} onChange={(e) => setLags(+e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', background: '#1a1a2e', color: '#e8e8e8' }} />
        </div>
        <div>
          <label style={{ color: '#a0aec0', fontSize: '12px', display: 'block' }}>Time Periods (T)</label>
          <input type="number" value={periods} onChange={(e) => setPeriods(+e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: 'none', background: '#1a1a2e', color: '#e8e8e8' }} />
        </div>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
        <div style={{ color: '#ef4444' }}>Naive: O(N² × K × T) = <strong>{(naiveOps / 1e9).toFixed(2)}B</strong> ops</div>
        <div style={{ color: '#22c55e' }}>FFT: O(N² × T log T) = <strong>{(fftOps / 1e9).toFixed(2)}B</strong> ops</div>
        <div style={{ color: '#f59e0b', marginTop: '8px' }}>FFT speedup: <strong>{speedup.toFixed(1)}×</strong> faster</div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP-BY-STEP EXPLAINER - Enhanced with full math
// ============================================================================

function StepExplainer({ step, onStepChange, sampleX, sampleY }) {
  const steps = [
    {
      title: "1. Covariance: How Variables Move Together",
      content: `Covariance measures if two variables tend to move in the same direction. 
                When X is above its mean, is Y also above its mean? The formula multiplies 
                these deviations and averages them.`,
      formula: "Cov(X,Y) = (1/n) Σ (xᵢ - x̄)(yᵢ - ȳ)",
      note: "Problem: Covariance depends on scale. If you multiply X by 100, covariance changes by 100.",
      visual: "covariance"
    },
    {
      title: "2. Correlation: Scale-Independent Measure",
      content: `Correlation normalizes covariance by dividing by both standard deviations. 
                This gives a dimensionless number between -1 and +1 that's comparable across 
                any pair of variables, regardless of their units or scale.`,
      formula: "r = Cov(X,Y) / (σₓ × σᵧ)",
      note: "Correlation of 0.3 between $10 stock and $1000 stock means the same thing.",
      visual: "covariance"
    },
    {
      title: "3. Geometric Intuition: Vectors and Angles",
      content: `Think of each time series as a vector in n-dimensional space (each day = one dimension). 
                Correlation equals the cosine of the angle between centered vectors. When r=1, vectors 
                point the same direction (0°). When r=0, they're perpendicular (90°). When r=-1, 
                they're opposite (180°).`,
      formula: "r = cos(θ) = (X · Y) / (||X|| × ||Y||)",
      note: "This is why correlation is bounded: cosine is always between -1 and +1.",
      visual: "geometric"
    },
    {
      title: "4. Why Returns, Not Prices?",
      content: `Stock prices trend upward over time, creating false correlations. Two stocks can 
                both go from $100 to $200, looking perfectly correlated, even if their daily 
                movements are unrelated. Returns (percent change) are stationary and reveal true 
                co-movement patterns.`,
      formula: "Returnₜ = (Pₜ - Pₜ₋₁) / Pₜ₋₁",
      note: "Returns also make different-priced stocks comparable: 1% is 1% whether it's $10 or $10,000.",
      visual: null
    },
    {
      title: "5. Lagged Correlation: The Key Insight",
      content: `Instead of comparing X(t) with Y(t), we compare X(t) with Y(t+k) — the value of Y 
                shifted k periods into the future. This tests whether X today predicts Y tomorrow 
                (or next week). We compute correlation for each lag k and find which lag gives 
                the strongest signal.`,
      formula: "r_k = Corr(X[0:n-k], Y[k:n])",
      note: "The shifted series have fewer overlapping points, but that's unavoidable.",
      visual: null
    },
    {
      title: "6. Zero Lag is Useless for Trading",
      content: `If X and Y are correlated at lag 0, they move together simultaneously. By the time 
                you observe X's move, Y has already moved — there's no time to trade. Predictive 
                relationships require lag ≥ 1: X moves, you observe it, then Y moves, and you 
                profit from having anticipated it.`,
      formula: "Tradeable signal: lag ≥ 1 AND |r| > fee_threshold",
      note: "Zero-lag correlation is still useful for hedging and portfolio construction, just not prediction.",
      visual: null
    },
    {
      title: "7. Computational Complexity",
      content: `Naive approach: For each of N² pairs, test K lags, each requiring O(T) operations. 
                That's O(N² × K × T). With 200 securities, 20 lags, and 4000 time periods, that's 
                32 billion operations! FFT optimization computes ALL lags at once using cross-correlation, 
                reducing complexity to O(N² × T log T).`,
      formula: "Cross-corr(X,Y) = IFFT(FFT(X) × conj(FFT(Y)))",
      note: "FFT gives 10-50× speedup depending on the number of lags tested.",
      visual: "complexity"
    },
    {
      title: "8. The Trading Threshold",
      content: `A correlation of 0.10 sounds promising but won't survive transaction costs. If 
                round-trip fees are 0.15%, and average daily moves are 1%, a 10% correlation 
                predicts only 0.1% of a 1% move = 0.001% expected profit — far below fees. 
                Rule of thumb: need |r| > 0.20 minimum to have edge after costs.`,
      formula: "Expected edge = |r| × E[|move|] - fees",
      note: "Also need enough trades for statistical significance: at least 50-100 signals to trust the pattern.",
      visual: null
    },
    {
      title: "9. The Algorithm",
      content: `1) Load returns for all N securities into a (T × N) matrix. 
                2) For each pair (i, j), compute FFT cross-correlation. 
                3) Find the lag k ∈ [1, K] with max |correlation|. 
                4) If |r_k| ≥ threshold, record (i, j, k, r_k). 
                5) Rank results by |r| and select top candidates. 
                6) Backtest before trading!`,
      formula: "O(N² × T log T) total time complexity",
      note: "Always exclude lag 0 from the search. Multiple testing correction (Bonferroni) is important.",
      visual: null
    }
  ];
  
  const current = steps[step];
  
  return (
    <div style={{ background: '#1a1a2e', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
      {/* Step indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => onStepChange(i)}
            style={{
              width: '28px', height: '28px', borderRadius: '50%', border: 'none',
              background: i === step ? '#f59e0b' : '#2d3748',
              color: i === step ? '#000' : '#a0aec0',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '12px'
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <h3 style={{ color: '#f59e0b', marginBottom: '12px', fontSize: '18px' }}>{current.title}</h3>
      <p style={{ color: '#e8e8e8', lineHeight: '1.7', marginBottom: '16px' }}>{current.content}</p>
      
      {/* Formula */}
      <div style={{ background: '#0d0d1a', padding: '12px 16px', borderRadius: '4px', fontFamily: 'monospace', color: '#22c55e', fontSize: '14px', marginBottom: '12px' }}>
        {current.formula}
      </div>
      
      {/* Note */}
      <p style={{ color: '#a0aec0', fontSize: '13px', fontStyle: 'italic', marginBottom: '16px' }}>
        💡 {current.note}
      </p>
      
      {/* Conditional visualizations */}
      {current.visual === 'covariance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ color: '#a0aec0', fontSize: '12px', marginBottom: '8px' }}>Original scale (×1)</div>
            <CovarianceVsCorrelation data1={sampleX} data2={sampleY} scale1={1} scale2={1} />
          </div>
          <div>
            <div style={{ color: '#a0aec0', fontSize: '12px', marginBottom: '8px' }}>X scaled ×100</div>
            <CovarianceVsCorrelation data1={sampleX} data2={sampleY} scale1={100} scale2={1} />
          </div>
        </div>
      )}
      
      {current.visual === 'geometric' && (
        <GeometricVisualization x={sampleX} y={sampleY} />
      )}
      
      {current.visual === 'complexity' && (
        <ComplexityCalculator />
      )}
      
      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button
          onClick={() => onStepChange(Math.max(0, step - 1))}
          disabled={step === 0}
          style={{
            padding: '8px 16px', borderRadius: '4px', border: 'none',
            background: step === 0 ? '#2d3748' : '#4a5568',
            color: step === 0 ? '#4a5568' : '#e8e8e8',
            cursor: step === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ← Previous
        </button>
        <span style={{ color: '#a0aec0', fontSize: '13px' }}>{step + 1} / {steps.length}</span>
        <button
          onClick={() => onStepChange(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          style={{
            padding: '8px 16px', borderRadius: '4px', border: 'none',
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
  const [step, setStep] = useState(0);
  const [trueLag, setTrueLag] = useState(3);
  const [trueCorrelation, setTrueCorrelation] = useState(0.6);
  const [selectedLag, setSelectedLag] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Generate synthetic data
  const { leader, follower, leaderReturns, followerReturns, lagCorrelations, sampleX, sampleY } = useMemo(() => {
    const leaderPrices = generatePriceSeries(100, 42, 0.025);
    const followerPrices = generateLaggedSeries(leaderPrices, trueLag, trueCorrelation, 123);
    
    const lReturns = calculateReturns(leaderPrices);
    const fReturns = calculateReturns(followerPrices);
    
    const correlations = [];
    for (let lag = 0; lag <= 20; lag++) {
      correlations.push(laggedCorrelation(lReturns, fReturns, lag));
    }
    
    // Sample data for visualizations (first 30 returns)
    const sx = lReturns.slice(0, 30);
    const sy = fReturns.slice(trueLag, trueLag + 30);
    
    return {
      leader: leaderPrices,
      follower: followerPrices,
      leaderReturns: lReturns,
      followerReturns: fReturns,
      lagCorrelations: correlations,
      sampleX: sx,
      sampleY: sy
    };
  }, [trueLag, trueCorrelation]);
  
  // Find the best lag (excluding 0)
  const bestLag = useMemo(() => {
    let maxCorr = 0;
    let bestIdx = 1;
    lagCorrelations.forEach((corr, i) => {
      if (i >= 1 && Math.abs(corr) > Math.abs(maxCorr)) {
        maxCorr = corr;
        bestIdx = i;
      }
    });
    return { lag: bestIdx, correlation: maxCorr };
  }, [lagCorrelations]);
  
  return (
    <Container className="py-8">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>
          Lead-Lag Correlation
        </h1>
        <p style={{ fontSize: '16px', color: '#4a5568', maxWidth: '700px', margin: '0 auto' }}>
          The complete guide: from covariance vs correlation, to geometric intuition, 
          to FFT-optimized algorithms for finding predictive relationships in time series
        </p>
      </div>
      
      {/* Step-by-step explainer */}
      <StepExplainer step={step} onStepChange={setStep} sampleX={sampleX} sampleY={sampleY} />
      
      {/* Interactive Playground */}
      <div style={{ background: '#f7fafc', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '20px' }}>
          🔬 Interactive Playground
        </h2>
        
        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>
              True Lag: {trueLag} days
            </label>
            <input 
              type="range" min="1" max="10" value={trueLag}
              onChange={(e) => { setTrueLag(parseInt(e.target.value)); setShowAnswer(false); }}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>
              True Correlation: {(trueCorrelation * 100).toFixed(0)}%
            </label>
            <input 
              type="range" min="0.1" max="0.9" step="0.1" value={trueCorrelation}
              onChange={(e) => { setTrueCorrelation(parseFloat(e.target.value)); setShowAnswer(false); }}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        
        {/* Time series */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>Price Series</h3>
          <TimeSeriesChart series1={leader} series2={follower} label1="Leader" label2="Follower" highlightLag={showAnswer ? trueLag : 0} />
        </div>
        
        {/* Scatter plots + lag chart */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <ScatterPlot 
            x={selectedLag === 0 ? leaderReturns : leaderReturns.slice(0, -selectedLag)}
            y={selectedLag === 0 ? followerReturns : followerReturns.slice(selectedLag)}
            title={`Returns @ Lag ${selectedLag}`}
          />
          <div>
            <LagCorrelationChart correlations={lagCorrelations} currentLag={selectedLag} onLagChange={setSelectedLag} />
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '6px', textAlign: 'center' }}>
              Click bars to explore • Lag 0 (gray) is non-tradeable
            </p>
          </div>
        </div>
        
        {/* Challenge */}
        <div style={{ background: '#1a1a2e', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
          <h3 style={{ color: '#f59e0b', marginBottom: '10px', fontSize: '16px' }}>🎯 Find the True Lag!</h3>
          <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '12px' }}>
            Your selection: <strong style={{ color: selectedLag === 0 ? '#ef4444' : '#06b6d4' }}>Lag {selectedLag}</strong>
            {selectedLag === 0 && <span style={{ color: '#ef4444' }}> (not tradeable!)</span>}
          </p>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            style={{
              padding: '10px 24px', borderRadius: '6px', border: 'none',
              background: '#22c55e', color: '#fff', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            {showAnswer ? 'Hide Answer' : 'Reveal Answer'}
          </button>
          {showAnswer && (
            <div style={{ marginTop: '12px', padding: '12px', background: '#0d0d1a', borderRadius: '6px' }}>
              <p style={{ color: '#22c55e', fontSize: '15px', fontWeight: 'bold' }}>
                True: Lag {trueLag} | Detected: Lag {bestLag.lag} | r = {(bestLag.correlation * 100).toFixed(1)}%
              </p>
              <p style={{ color: '#a0aec0', marginTop: '6px', fontSize: '13px' }}>
                {Math.abs(bestLag.correlation) >= 0.2 ? "✅ Above 20% threshold — potentially tradeable!" : "⚠️ Below 20% threshold — may not survive fees"}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Key Formulas Reference */}
      <div style={{ background: '#fff', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '16px' }}>📐 Formula Reference</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px' }}>
            <div style={{ color: '#2d3748', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Covariance</div>
            <code style={{ color: '#2563eb', fontSize: '12px' }}>Cov(X,Y) = (1/n) Σ (xᵢ - x̄)(yᵢ - ȳ)</code>
          </div>
          <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px' }}>
            <div style={{ color: '#2d3748', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Correlation</div>
            <code style={{ color: '#2563eb', fontSize: '12px' }}>r = Cov(X,Y) / (σₓ × σᵧ)</code>
          </div>
          <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px' }}>
            <div style={{ color: '#2d3748', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Lagged Correlation</div>
            <code style={{ color: '#2563eb', fontSize: '12px' }}>rₖ = Corr(X[0:n-k], Y[k:n])</code>
          </div>
          <div style={{ background: '#f7fafc', padding: '12px', borderRadius: '6px' }}>
            <div style={{ color: '#2d3748', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>FFT Cross-Correlation</div>
            <code style={{ color: '#2563eb', fontSize: '12px' }}>IFFT(FFT(X) × conj(FFT(Y)))</code>
          </div>
        </div>
      </div>
      
      {/* Summary */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%)', borderRadius: '12px', padding: '24px', color: '#fff' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>🎓 Key Takeaways</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {[
            { title: 'Use Correlation', text: 'Not covariance — it\'s scale-independent' },
            { title: 'Use Returns', text: 'Not prices — removes trend bias' },
            { title: 'Exclude Lag 0', text: 'Same-time correlation isn\'t predictive' },
            { title: 'Threshold ≥ 20%', text: 'Need enough edge to beat fees' },
            { title: 'FFT Optimization', text: 'Computes all lags efficiently' },
            { title: 'Multiple Testing', text: 'Many pairs = false positives; correct for it' }
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '6px' }}>
              <div style={{ color: '#f59e0b', fontWeight: '600', fontSize: '13px' }}>{item.title}</div>
              <div style={{ color: '#e8e8e8', fontSize: '12px', marginTop: '4px' }}>{item.text}</div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
