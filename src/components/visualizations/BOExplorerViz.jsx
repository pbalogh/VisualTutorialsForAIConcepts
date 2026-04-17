import React, { useState, useMemo, useCallback } from 'react';

/**
 * 1D Bayesian Optimization Explorer
 * 
 * Interactive visualization: step through BO iterations, see GP surrogate
 * update, acquisition function shift, and next evaluation point.
 */

// --- Gaussian Process (1D, RBF kernel) ---

function rbfKernel(x1, x2, lengthScale = 0.5, variance = 1.0) {
  const d = x1 - x2;
  return variance * Math.exp(-0.5 * (d * d) / (lengthScale * lengthScale));
}

function buildKernelMatrix(xs, lengthScale, variance) {
  const n = xs.length;
  const K = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const v = rbfKernel(xs[i], xs[j], lengthScale, variance);
      K[i][j] = v;
      K[j][i] = v;
    }
  }
  return K;
}

// Cholesky decomposition (lower triangular)
function cholesky(A) {
  const n = A.length;
  const L = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(A[i][i] - sum, 1e-10));
      } else {
        L[i][j] = (A[i][j] - sum) / L[j][j];
      }
    }
  }
  return L;
}

// Solve Lx = b (forward substitution)
function solveL(L, b) {
  const n = L.length;
  const x = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < i; j++) sum += L[i][j] * x[j];
    x[i] = (b[i] - sum) / L[i][i];
  }
  return x;
}

// Solve L^T x = b (backward substitution)
function solveLT(L, b) {
  const n = L.length;
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) sum += L[j][i] * x[j];
    x[i] = (b[i] - sum) / L[i][i];
  }
  return x;
}

function gpPredict(trainX, trainY, testX, lengthScale = 0.5, variance = 1.0, noise = 0.01) {
  if (trainX.length === 0) {
    return testX.map(() => ({ mean: 0, std: Math.sqrt(variance) }));
  }
  
  const n = trainX.length;
  const K = buildKernelMatrix(trainX, lengthScale, variance);
  // Add noise to diagonal
  for (let i = 0; i < n; i++) K[i][i] += noise;
  
  const L = cholesky(K);
  const alpha = solveLT(L, solveL(L, trainY));
  
  return testX.map(x => {
    // k_star: kernel between test point and training points
    const kStar = trainX.map(xi => rbfKernel(x, xi, lengthScale, variance));
    
    // Mean
    let mean = 0;
    for (let i = 0; i < n; i++) mean += kStar[i] * alpha[i];
    
    // Variance
    const v = solveL(L, kStar);
    let varPrior = variance;
    let varReduction = 0;
    for (let i = 0; i < v.length; i++) varReduction += v[i] * v[i];
    const std = Math.sqrt(Math.max(varPrior - varReduction, 1e-8));
    
    return { mean, std };
  });
}

// --- Expected Improvement ---

function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327; // 1/sqrt(2*pi)
  const p = d * Math.exp(-x * x / 2) * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.8212560 + t * 1.3302744))));
  return x >= 0 ? 1 - p : p;
}

function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function expectedImprovement(mean, std, bestY, xi = 0.01) {
  if (std < 1e-10) return 0;
  const z = (mean - bestY - xi) / std;
  return (mean - bestY - xi) * normalCDF(z) + std * normalPDF(z);
}

// --- Target function ---

function targetFn(x) {
  return Math.sin(3 * x) + Math.sin(5 * x) + 0.5 * Math.cos(2 * x);
}

// --- The component ---

const W = 700, H = 400, PAD = { top: 30, right: 30, bottom: 60, left: 50 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const DOMAIN = [0, 6.28];
const N_GRID = 200;

const grid = Array.from({ length: N_GRID }, (_, i) => DOMAIN[0] + (DOMAIN[1] - DOMAIN[0]) * i / (N_GRID - 1));
const trueY = grid.map(targetFn);
const trueYMin = Math.min(...trueY);
const trueYMax = Math.max(...trueY);
const Y_PAD = (trueYMax - trueYMin) * 0.3;
const Y_RANGE = [trueYMin - Y_PAD, trueYMax + Y_PAD];

function xScale(x) {
  return PAD.left + ((x - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * PLOT_W;
}
function yScale(y) {
  return PAD.top + PLOT_H - ((y - Y_RANGE[0]) / (Y_RANGE[1] - Y_RANGE[0])) * PLOT_H;
}

function pathFromPoints(xs, ys) {
  return xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${xScale(x).toFixed(1)},${yScale(ys[i]).toFixed(1)}`).join('');
}

// Initial random observations
function getInitialObs() {
  const xs = [1.0, 3.5, 5.5];
  return xs.map(x => ({ x, y: targetFn(x) }));
}

export default function BOExplorerViz({ config }) {
  const [observations, setObservations] = useState(getInitialObs);
  const [hoveredX, setHoveredX] = useState(null);
  const [showTrue, setShowTrue] = useState(false);

  const trainX = observations.map(o => o.x);
  const trainY = observations.map(o => o.y);
  const bestY = Math.max(...trainY);

  // GP predictions
  const predictions = useMemo(
    () => gpPredict(trainX, trainY, grid, 0.6, 1.5, 0.01),
    [observations]
  );

  const gpMean = predictions.map(p => p.mean);
  const gpUpper = predictions.map((p, i) => p.mean + 1.96 * p.std);
  const gpLower = predictions.map((p, i) => p.mean - 1.96 * p.std);

  // EI acquisition
  const ei = predictions.map(p => expectedImprovement(p.mean, p.std, bestY));
  const eiMax = Math.max(...ei, 1e-10);

  // Next point (max EI)
  let nextIdx = 0;
  for (let i = 1; i < ei.length; i++) {
    if (ei[i] > ei[nextIdx]) nextIdx = i;
  }
  const nextX = grid[nextIdx];

  // EI scaled to bottom strip
  const EI_H = 80;
  const eiBase = H - 10;
  const eiScaled = ei.map(v => eiBase - (v / eiMax) * EI_H);

  const step = useCallback(() => {
    const y = targetFn(nextX);
    setObservations(prev => [...prev, { x: nextX, y }]);
  }, [nextX]);

  const reset = useCallback(() => {
    setObservations(getInitialObs());
    setShowTrue(false);
  }, []);

  // Confidence band path
  const bandPath = `${pathFromPoints(grid, gpUpper)} ${pathFromPoints([...grid].reverse(), [...gpLower].reverse()).replace('M', 'L')} Z`;

  // EI area path
  const eiPath = `M${xScale(grid[0]).toFixed(1)},${eiBase} ` +
    grid.map((x, i) => `L${xScale(x).toFixed(1)},${eiScaled[i].toFixed(1)}`).join(' ') +
    ` L${xScale(grid[grid.length - 1]).toFixed(1)},${eiBase} Z`;

  return (
    <div className="my-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={step}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
        >
          Step →
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
        <label className="flex items-center gap-2 ml-4 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showTrue} onChange={e => setShowTrue(e.target.checked)} className="rounded" />
          Show true function
        </label>
        <span className="ml-auto text-sm text-gray-500">
          {observations.length} observations · Best: {bestY.toFixed(3)}
        </span>
      </div>

      <svg width={W} height={H} className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4, 5, 6].map(x => (
          <line key={`gx${x}`} x1={xScale(x)} x2={xScale(x)} y1={PAD.top} y2={PAD.top + PLOT_H}
            stroke="#e5e7eb" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 7 }, (_, i) => Y_RANGE[0] + (Y_RANGE[1] - Y_RANGE[0]) * i / 6).map((y, i) => (
          <line key={`gy${i}`} x1={PAD.left} x2={PAD.left + PLOT_W} y1={yScale(y)} y2={yScale(y)}
            stroke="#e5e7eb" strokeWidth="0.5" />
        ))}

        {/* Confidence band */}
        <path d={bandPath} fill="rgba(99, 102, 241, 0.15)" stroke="none" />

        {/* GP mean */}
        <path d={pathFromPoints(grid, gpMean)} fill="none" stroke="#4f46e5" strokeWidth="2.5" />

        {/* True function */}
        {showTrue && (
          <path d={pathFromPoints(grid, trueY)} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.7" />
        )}

        {/* EI acquisition function */}
        <path d={eiPath} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1.5" />
        <text x={PAD.left + 5} y={eiBase - EI_H - 5} fontSize="10" fill="#10b981" fontWeight="600">
          Expected Improvement
        </text>

        {/* Next evaluation point */}
        <line x1={xScale(nextX)} x2={xScale(nextX)} y1={PAD.top} y2={eiBase}
          stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,3" />
        <text x={xScale(nextX)} y={PAD.top - 8} fontSize="11" fill="#f59e0b" textAnchor="middle" fontWeight="700">
          next →
        </text>

        {/* Observations */}
        {observations.map((obs, i) => (
          <g key={i}>
            <circle cx={xScale(obs.x)} cy={yScale(obs.y)} r={i === observations.length - 1 ? 7 : 5}
              fill={i === observations.length - 1 ? '#f59e0b' : '#1e1b4b'} stroke="white" strokeWidth="2" />
            {i < 3 && (
              <text x={xScale(obs.x)} y={yScale(obs.y) - 12} fontSize="9" fill="#6b7280" textAnchor="middle">
                initial
              </text>
            )}
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD.left} x2={PAD.left + PLOT_W} y1={PAD.top + PLOT_H} y2={PAD.top + PLOT_H} stroke="#9ca3af" />
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + PLOT_H} stroke="#9ca3af" />

        {/* X labels */}
        {[0, 1, 2, 3, 4, 5, 6].map(x => (
          <text key={`xl${x}`} x={xScale(x)} y={PAD.top + PLOT_H + 16} fontSize="10" fill="#6b7280" textAnchor="middle">{x}</text>
        ))}

        {/* Legend */}
        <g transform={`translate(${PAD.left + 10}, ${PAD.top + 10})`}>
          <rect x="0" y="0" width="160" height={showTrue ? 78 : 58} fill="white" fillOpacity="0.9" rx="4" stroke="#e5e7eb" />
          <line x1="8" x2="28" y1="14" y2="14" stroke="#4f46e5" strokeWidth="2.5" />
          <text x="34" y="18" fontSize="10" fill="#374151">GP Mean</text>
          <rect x="8" y="26" width="20" height="8" fill="rgba(99, 102, 241, 0.15)" rx="1" />
          <text x="34" y="34" fontSize="10" fill="#374151">95% Confidence</text>
          <line x1="8" x2="28" y1="48" y2="48" stroke="#10b981" strokeWidth="1.5" />
          <text x="34" y="52" fontSize="10" fill="#374151">Acquisition (EI)</text>
          {showTrue && (
            <>
              <line x1="8" x2="28" y1="66" y2="66" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />
              <text x="34" y="70" fontSize="10" fill="#374151">True Function</text>
            </>
          )}
        </g>
      </svg>

      <div className="mt-3 text-sm text-gray-500 flex gap-6">
        <span>🟣 <strong>Purple band</strong> = GP surrogate (what BO thinks the function looks like)</span>
        <span>🟢 <strong>Green</strong> = where BO wants to look next</span>
        <span>🟡 <strong>Yellow</strong> = next evaluation point</span>
      </div>
    </div>
  );
}
