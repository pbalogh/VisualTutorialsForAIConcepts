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
  const padding = 40;
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
  const [fftExpanded, setFftExpanded] = useState({ why: true, steps: false, when: false });
  const [flowExpanded, setFlowExpanded] = useState({ sector: true, geo: false, size: false, supply: false, future: false });
  
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
      
      {/* ================================================================ */}
      {/* SECTION: FFT Optimization Deep Dive */}
      {/* ================================================================ */}
      <div style={{ background: '#fff', border: '2px solid #7c3aed', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>
          ⚡ FFT Optimization Deep Dive
        </h2>
        <p style={{ color: '#4a5568', marginBottom: '20px', lineHeight: '1.7' }}>
          Section 7 of the step-by-step introduced FFT briefly. Here we unpack exactly <em>why</em> it works 
          and <em>why</em> it matters so much for practical lead-lag analysis.
        </p>

        {/* Deep Dive: Why frequency domain helps */}
        <div style={{ background: '#f5f3ff', borderLeft: '4px solid #7c3aed', borderRadius: '0 8px 8px 0', marginBottom: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => setFftExpanded(prev => ({ ...prev, why: !prev.why }))}
            style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
          >
            <span style={{ color: '#7c3aed', fontSize: '16px' }}>{fftExpanded.why ? '▼' : '▶'}</span>
            <span style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '15px' }}>Why does computing in the frequency domain help at all?</span>
          </button>
          {fftExpanded.why && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                The key insight is the <strong>Convolution Theorem</strong>: convolution in the time domain equals 
                pointwise multiplication in the frequency domain. Cross-correlation is just convolution with one 
                signal reversed, so the same theorem applies.
              </p>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                In the <strong>naive approach</strong>, computing correlation at lag <em>k</em> means aligning the 
                two series with an offset of k, multiplying element-wise, and summing. You repeat this for every 
                lag you want to test. With K lags and T time steps, that's <code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '3px' }}>O(K × T)</code> work per pair.
              </p>
              <p style={{ color: '#374151', lineHeight: '1.7' }}>
                With <strong>FFT</strong>, you transform both series to the frequency domain in O(T log T), multiply 
                them pointwise in O(T), and inverse-transform back in O(T log T). The result gives you the 
                correlation at <strong>ALL lags simultaneously</strong> — you never pay a per-lag cost.
              </p>
            </div>
          )}
        </div>

        {/* Info callout */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
          <p style={{ color: '#1e40af', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            💡 The complexity drops from <strong>O(N² × K × T)</strong> to <strong>O(N² × T log T)</strong>. 
            For N=200 securities, K=20 lags, T=4000: naive ≈ 32B ops; FFT ≈ 9.6B ops. That's 3× speedup 
            even with modest K. At K=100, you're looking at 15× or more.
          </p>
        </div>

        {/* Deep Dive: Step-by-step recipe */}
        <div style={{ background: '#f5f3ff', borderLeft: '4px solid #7c3aed', borderRadius: '0 8px 8px 0', marginBottom: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => setFftExpanded(prev => ({ ...prev, steps: !prev.steps }))}
            style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
          >
            <span style={{ color: '#7c3aed', fontSize: '16px' }}>{fftExpanded.steps ? '▼' : '▶'}</span>
            <span style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '15px' }}>Step-by-step: How does the FFT cross-correlation recipe work?</span>
          </button>
          {fftExpanded.steps && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              {[
                { step: '1', text: 'Zero-pad both series to length 2T (prevents circular wrap-around artifacts from the discrete Fourier transform).' },
                { step: '2', text: 'Compute FFT(X) and FFT(Y) for each series. Each transform takes O(T log T).' },
                { step: '3', text: 'Multiply FFT(X) by the complex conjugate of FFT(Y) element-wise. The conjugate flips Y in time, turning convolution into cross-correlation.' },
                { step: '4', text: 'Inverse FFT the product. The result is the raw cross-correlation at every lag from -(T-1) to +(T-1).' },
                { step: '5', text: 'Normalize by the standard deviations and overlap counts to convert raw cross-correlation into Pearson correlation coefficients.' }
              ].map((item) => (
                <div key={item.step} style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ background: '#7c3aed', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>{item.step}</span>
                  <p style={{ color: '#374151', lineHeight: '1.6', margin: 0 }}>{item.text}</p>
                </div>
              ))}
              {/* Formula */}
              <div style={{ background: '#0d0d1a', padding: '12px 16px', borderRadius: '6px', fontFamily: 'monospace', color: '#22c55e', fontSize: '14px', marginTop: '12px', textAlign: 'center' }}>
                Corr_k(X, Y) = IFFT(FFT(X) · conj(FFT(Y)))[k] / (σₓ · σᵧ · overlap(k))
              </div>
            </div>
          )}
        </div>

        {/* Deep Dive: When NOT to use FFT */}
        <div style={{ background: '#f5f3ff', borderLeft: '4px solid #7c3aed', borderRadius: '0 8px 8px 0', marginBottom: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => setFftExpanded(prev => ({ ...prev, when: !prev.when }))}
            style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
          >
            <span style={{ color: '#7c3aed', fontSize: '16px' }}>{fftExpanded.when ? '▼' : '▶'}</span>
            <span style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '15px' }}>When should you NOT use FFT?</span>
          </button>
          {fftExpanded.when && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                FFT is overkill when you only need a handful of specific lags (say, just lag 1 and lag 5). The 
                overhead of padding, transforming, and inverse-transforming isn't worth it for K &lt; 5 or so.
              </p>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                FFT also assumes stationary statistics across the full window. If your correlation structure 
                changes over time (regime shifts, earnings seasons), you may prefer rolling-window naive correlation 
                at specific lags, where you can control the window size more naturally.
              </p>
              <p style={{ color: '#374151', lineHeight: '1.7' }}>
                In practice, most production systems use FFT for the initial broad scan (<em>which lags matter?</em>) 
                and then switch to targeted rolling-window methods for monitoring those specific lags in real time.
              </p>
            </div>
          )}
        </div>

        {/* Analogy */}
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px 16px' }}>
          <p style={{ color: '#92400e', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            🔭 <strong>Analogy:</strong> Think of FFT like a panoramic camera vs. a telephoto lens. The panoramic 
            shot (FFT) captures the entire correlation landscape at once — every lag in one exposure. The telephoto 
            (naive method) zooms in on one specific lag at a time with more control. Use the panoramic to find 
            where to look, then the telephoto to watch it closely.
          </p>
        </div>

        {/* Interactive complexity comparison */}
        <div style={{ marginTop: '20px' }}>
          <ComplexityCalculator />
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION: Information Flow & Market Dynamics */}
      {/* ================================================================ */}
      <div style={{ background: '#fff', border: '2px solid #0891b2', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '8px' }}>
          🌊 Information Flow &amp; Market Dynamics
        </h2>
        <p style={{ color: '#4a5568', marginBottom: '20px', lineHeight: '1.7' }}>
          Lead-lag correlations don't appear randomly — they emerge from how information propagates through 
          economic systems. Understanding these transmission mechanisms is what separates exploitable patterns 
          from statistical noise.
        </p>

        {/* Sector Rotation */}
        <div style={{ background: '#ecfeff', borderLeft: '4px solid #0891b2', borderRadius: '0 8px 8px 0', marginBottom: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => setFlowExpanded(prev => ({ ...prev, sector: !prev.sector }))}
            style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
          >
            <span style={{ color: '#0891b2', fontSize: '16px' }}>{flowExpanded.sector ? '▼' : '▶'}</span>
            <span style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '15px' }}>Sector Rotation Patterns</span>
          </button>
          {flowExpanded.sector && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                Economic cycles create predictable sequences of sector leadership. During uncertainty, capital 
                flows to <strong>defensive stocks</strong> (utilities, healthcare, consumer staples) first. As 
                confidence returns, <strong>cyclical sectors</strong> (industrials, materials, consumer 
                discretionary) follow with a measurable lag.
              </p>
              <div style={{ background: '#0d0d1a', borderRadius: '6px', padding: '14px 16px', marginBottom: '12px' }}>
                <p style={{ color: '#06b6d4', fontFamily: 'monospace', fontSize: '13px', margin: 0, textAlign: 'center' }}>
                  Bond Yields → Utilities → Financials → Industrials → Consumer Discretionary → Technology
                </p>
              </div>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                The lags between these transitions can range from days to weeks, making them detectable 
                with cross-correlation analysis.
              </p>
              <p style={{ color: '#6b7280', lineHeight: '1.7', fontStyle: 'italic', fontSize: '13px' }}>
                Historical example: in the 2020 recovery, defensive healthcare stocks peaked and rolled over 
                about 2-3 weeks before cyclical travel and leisure stocks began their surge — a textbook 
                sector rotation lead-lag.
              </p>
            </div>
          )}
        </div>

        {/* Geographic & Time-Zone Effects */}
        <div style={{ background: '#ecfeff', borderLeft: '4px solid #0891b2', borderRadius: '0 8px 8px 0', marginBottom: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => setFlowExpanded(prev => ({ ...prev, geo: !prev.geo }))}
            style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
          >
            <span style={{ color: '#0891b2', fontSize: '16px' }}>{flowExpanded.geo ? '▼' : '▶'}</span>
            <span style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '15px' }}>Geographic &amp; Time-Zone Effects</span>
          </button>
          {flowExpanded.geo && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                Markets operate in overlapping time zones, creating natural information lags. Overnight 
                news in Asia affects European opens, which in turn influence US pre-market pricing. 
                Commodities priced in one region propagate to downstream industries in another.
              </p>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                A classic pattern: when the <strong>Nikkei drops sharply</strong>, correlated European 
                indices (particularly those with heavy Asian trade exposure, like the DAX) often gap 
                down at their open 6-8 hours later. US futures then react before the NYSE bell.
              </p>
              <p style={{ color: '#374151', lineHeight: '1.7' }}>
                These geographic lags are <em>shrinking</em> as algorithmic trading speeds up information 
                propagation — but they haven't disappeared, especially for less liquid assets and 
                emerging markets.
              </p>
            </div>
          )}
        </div>

        {/* Size & Liquidity Effects */}
        <div style={{ background: '#ecfeff', borderLeft: '4px solid #0891b2', borderRadius: '0 8px 8px 0', marginBottom: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => setFlowExpanded(prev => ({ ...prev, size: !prev.size }))}
            style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
          >
            <span style={{ color: '#0891b2', fontSize: '16px' }}>{flowExpanded.size ? '▼' : '▶'}</span>
            <span style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '15px' }}>Size &amp; Liquidity Effects</span>
          </button>
          {flowExpanded.size && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                Large-cap stocks tend to lead small-caps because institutional investors react faster 
                (better information, more analysts, algorithmic execution). When a macro event hits, 
                large-caps reprice within minutes while small-caps may take hours or days.
              </p>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                During <strong>risk-off periods</strong>, the pattern can reverse: small-caps sell off 
                first as liquidity dries up, with large-caps following as contagion spreads. This 
                reversal itself is a detectable regime signal.
              </p>
              <p style={{ color: '#374151', lineHeight: '1.7' }}>
                <strong>Liquidity is the key driver</strong> — assets that trade more frequently 
                incorporate new information faster and thus lead their less liquid counterparts.
              </p>
            </div>
          )}
        </div>

        {/* Supply Chain Transmission */}
        <div style={{ background: '#ecfeff', borderLeft: '4px solid #0891b2', borderRadius: '0 8px 8px 0', marginBottom: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => setFlowExpanded(prev => ({ ...prev, supply: !prev.supply }))}
            style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
          >
            <span style={{ color: '#0891b2', fontSize: '16px' }}>{flowExpanded.supply ? '▼' : '▶'}</span>
            <span style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '15px' }}>Supply Chain Transmission</span>
          </button>
          {flowExpanded.supply && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                Economic shocks propagate along supply chains with measurable delays. A spike in copper 
                prices leads mining stocks first, then flows downstream: electrical component manufacturers 
                react in days, construction companies in weeks, and homebuilders in months.
              </p>
              <div style={{ background: '#0d0d1a', borderRadius: '6px', padding: '14px 16px', marginBottom: '12px' }}>
                <p style={{ color: '#06b6d4', fontFamily: 'monospace', fontSize: '13px', margin: 0, textAlign: 'center' }}>
                  Crude Producers → Refiners → Airlines &amp; Shipping → Consumer Goods
                </p>
              </div>
              <p style={{ color: '#374151', lineHeight: '1.7' }}>
                These supply-chain lead-lag patterns are among the <strong>most robust</strong> because 
                they're grounded in physical reality — goods literally take time to move through the system.
              </p>
            </div>
          )}
        </div>

        {/* Warning callout */}
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
          <p style={{ color: '#991b1b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            ⚠️ <strong>Correlation ≠ Causation, but Information Flow ≈ Causation.</strong> When you find a 
            lead-lag relationship, always ask: "Is there a plausible information transmission mechanism?" 
            If yes, the pattern is more likely to persist. If not, it may be spurious.
          </p>
        </div>

        {/* Spotting Future Opportunities */}
        <div style={{ background: '#ecfeff', borderLeft: '4px solid #0891b2', borderRadius: '0 8px 8px 0', marginBottom: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => setFlowExpanded(prev => ({ ...prev, future: !prev.future }))}
            style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
          >
            <span style={{ color: '#0891b2', fontSize: '16px' }}>{flowExpanded.future ? '▼' : '▶'}</span>
            <span style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '15px' }}>Spotting Future Lead-Lag Opportunities</span>
          </button>
          {flowExpanded.future && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <p style={{ color: '#374151', lineHeight: '1.7', marginBottom: '12px' }}>
                New lead-lag patterns emerge when information flow pathways change. Watch for:
              </p>
              <ul style={{ color: '#374151', lineHeight: '1.8', paddingLeft: '20px', marginBottom: '12px' }}>
                <li><strong>Regulatory changes</strong> — new reporting requirements can accelerate or delay information propagation (e.g., real-time trade reporting rules)</li>
                <li><strong>Market microstructure shifts</strong> — new exchanges, dark pools, or settlement systems alter how quickly prices update</li>
                <li><strong>Technology adoption</strong> — when an industry sector gets heavy algorithmic coverage, its lags to other sectors typically shrink</li>
                <li><strong>Geopolitical restructuring</strong> — trade wars, sanctions, and alliance shifts create new supply chain dependencies (and thus new lead-lag patterns)</li>
                <li><strong>Emerging asset classes</strong> — crypto, carbon credits, and other new markets create fresh cross-asset lead-lag relationships before they get arbitraged away</li>
              </ul>
              <p style={{ color: '#374151', lineHeight: '1.7' }}>
                <strong>The meta-principle:</strong> lead-lag relationships are created by <em>information 
                asymmetry</em> (someone knows first) and destroyed by <em>arbitrage</em> (everyone figures 
                it out). Your edge is in understanding the transmission mechanisms before they become obvious.
              </p>
            </div>
          )}
        </div>

        {/* Analogy */}
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '14px 16px' }}>
          <p style={{ color: '#92400e', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            🌊 <strong>Analogy:</strong> Think of information flow in markets like ripples in a pond. The 
            stone (an event) hits the water (the market) and waves propagate outward. The closest lily pads 
            (most directly affected assets) move first; distant ones (indirectly connected assets) move later. 
            Understanding the pond's geography — where the channels are, where the barriers are — lets you 
            predict which lily pads will move next.
          </p>
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
            { title: 'FFT Optimization', text: 'Computes ALL lags simultaneously via frequency domain' },
            { title: 'Multiple Testing', text: 'Many pairs = false positives; correct for it' },
            { title: 'Information Flow', text: 'Patterns rooted in economic transmission mechanisms persist' },
            { title: 'Watch for Change', text: 'Regulatory shifts & new markets create new opportunities' }
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
