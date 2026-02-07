/**
 * Matrix Discovery Visualization Components
 * Extracted from MatrixDiscovery.jsx for the JSON-driven tutorial engine
 */
import React, { useState, useMemo } from 'react'
import '../../styles/MatrixDiscovery.css'

// ============================================================================
// UTILITY FUNCTIONS: Matrix Math
// ============================================================================

function matrixMultiply(A, B) {
  const result = Array(A.length).fill(0).map(() => Array(B[0].length).fill(0))
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B[0].length; j++) {
      for (let k = 0; k < B.length; k++) {
        result[i][j] += A[i][k] * B[k][j]
      }
    }
  }
  return result
}

function matrixTranspose(A) {
  return A[0].map((_, i) => A.map(row => row[i]))
}

function matrixInverse(A) {
  const n = A.length
  if (n !== A[0].length) throw new Error("Matrix must be square")
  if (n === 2) {
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0]
    if (Math.abs(det) < 1e-10) throw new Error("Matrix is singular")
    return [[A[1][1] / det, -A[0][1] / det], [-A[1][0] / det, A[0][0] / det]]
  }
  throw new Error("Inverse only implemented for 2x2 matrices")
}

function pseudoInverse(A) {
  const At = matrixTranspose(A)
  const AtA = matrixMultiply(At, A)
  const AtAInv = matrixInverse(AtA)
  return matrixMultiply(AtAInv, At)
}

function residualNorm(predicted, target) {
  let sum = 0
  for (let i = 0; i < predicted.length; i++) {
    for (let j = 0; j < predicted[i].length; j++) {
      const diff = predicted[i][j] - target[i][j]
      sum += diff * diff
    }
  }
  return Math.sqrt(sum)
}

// ============================================================================
// SYNTHETIC DATA GENERATOR
// ============================================================================

function generateSyntheticData(numClusters, numPairsPerCluster, matrixRows, matrixCols) {
  const pairs = []
  const trueMatrices = []

  for (let c = 0; c < numClusters; c++) {
    const M = Array(matrixRows).fill(0).map(() =>
      Array(matrixCols).fill(0).map(() => (Math.random() - 0.5) * 10)
    )
    trueMatrices.push(M)

    for (let p = 0; p < numPairsPerCluster; p++) {
      const input = Array(matrixCols).fill(0).map(() => (Math.random() - 0.5) * 5)
      const output = matrixMultiply([input], M)[0]
      const noisyOutput = output.map(x => x + (Math.random() - 0.5) * 0.5)

      pairs.push({
        input,
        output: noisyOutput,
        trueCluster: c
      })
    }
  }

  return { pairs, trueMatrices }
}

// ============================================================================
// CLUSTERING ALGORITHM
// ============================================================================

function clusterizeWithKMatrices(pairs, K) {
  const n = pairs.length
  const inputDim = pairs[0]?.input.length || 2
  const outputDim = pairs[0]?.output.length || 2
  
  if (K >= n) {
    return {
      assignments: pairs.map((_, i) => i),
      matrices: pairs.map((_, i) => 
        Array(outputDim).fill(0).map(() => Array(inputDim).fill(0))
      ),
      losses: Array(n).fill(0)
    }
  }

  let assignments = Array(n).fill(0).map((_, i) => i % K)
  let matrices = Array(K).fill(null)
  let converged = false
  let iterations = 0
  const maxIterations = 20

  while (!converged && iterations < maxIterations) {
    iterations++

    // E-STEP: Compute best matrix for each cluster
    for (let k = 0; k < K; k++) {
      const clusterPairs = pairs.filter((_, i) => assignments[i] === k)
      
      if (clusterPairs.length === 0) {
        matrices[k] = Array(outputDim).fill(0).map(() => Array(inputDim).fill(0))
        continue
      }

      try {
        const X = clusterPairs.map(p => p.input)
        const Y = clusterPairs.map(p => p.output)
        const Xt = matrixTranspose(X)
        const XtX = matrixMultiply(Xt, X)
        const XtXInv = matrixInverse(XtX)
        const M = matrixMultiply(matrixMultiply(XtXInv, Xt), Y)
        matrices[k] = M
      } catch (e) {
        matrices[k] = Array(outputDim).fill(0).map(() => Array(inputDim).fill(0))
      }
    }

    // M-STEP: Assign each pair to closest matrix
    let oldAssignments = assignments.slice()
    
    for (let i = 0; i < n; i++) {
      let bestCluster = 0
      let bestLoss = Infinity

      for (let k = 0; k < K; k++) {
        try {
          const predicted = matrixMultiply([pairs[i].input], matrices[k])[0]
          const loss = residualNorm([predicted], [pairs[i].output])
          if (loss < bestLoss) {
            bestLoss = loss
            bestCluster = k
          }
        } catch {}
      }

      assignments[i] = bestCluster
    }

    converged = oldAssignments.every((v, i) => v === assignments[i])
  }

  // Compute final losses
  const losses = pairs.map((pair, i) => {
    try {
      const k = assignments[i]
      const predicted = matrixMultiply([pair.input], matrices[k])[0]
      return residualNorm([predicted], [pair.output])
    } catch {
      return Infinity
    }
  })

  return { assignments, matrices, losses }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function DataEditor({ pairs, onPairsChange }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editValues, setEditValues] = useState({})

  const handleStartEdit = (idx, pair) => {
    setEditingIndex(idx)
    setEditValues({ input: [...pair.input], output: [...pair.output] })
  }

  const handleValueChange = (isInput, dimIdx, value) => {
    const newVals = { ...editValues }
    const arr = isInput ? newVals.input : newVals.output
    arr[dimIdx] = isNaN(parseFloat(value)) ? 0 : parseFloat(value)
    setEditValues(newVals)
  }

  const handleSaveEdit = () => {
    if (onPairsChange) {
      const newPairs = pairs.map((p, i) => i === editingIndex ? { ...p, ...editValues } : p)
      onPairsChange(newPairs)
    }
    setEditingIndex(null)
  }

  const handleAddRow = () => {
    if (pairs.length > 0) {
      const lastPair = pairs[pairs.length - 1]
      const newPair = { input: lastPair.input.map(() => 0), output: lastPair.output.map(() => 0) }
      if (onPairsChange) onPairsChange([...pairs, newPair])
    }
  }

  const handleDeleteRow = (idx) => {
    if (onPairsChange) onPairsChange(pairs.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px' }}>
      <div onClick={() => setIsExpanded(!isExpanded)} style={{ padding: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isExpanded ? '1px solid #ddd' : 'none' }}>
        <h3 style={{ margin: 0 }}>{isExpanded ? '▼' : '▶'} Input-Output Data ({pairs.length} pairs)</h3>
        <span style={{ fontSize: '0.9em', color: '#7f8c8d' }}>Click to expand/collapse</span>
      </div>

      {isExpanded && (
        <div style={{ padding: '15px', maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
            <thead>
              <tr style={{ background: '#ecf0f1', borderBottom: '2px solid #bdc3c7' }}>
                <th style={{ padding: '8px', textAlign: 'center', width: '40px' }}>#</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Input</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Output</th>
                <th style={{ padding: '8px', textAlign: 'center', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair, idx) => (
                editingIndex === idx ? (
                  <tr key={idx} style={{ background: '#fff3cd', borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {editValues.input.map((val, j) => (
                          <input key={j} type="number" step="0.01" value={val.toFixed(2)} onChange={e => handleValueChange(true, j, e.target.value)} style={{ width: '50px', padding: '4px', border: '1px solid #f39c12', borderRadius: '3px', textAlign: 'right' }} />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {editValues.output.map((val, j) => (
                          <input key={j} type="number" step="0.01" value={val.toFixed(2)} onChange={e => handleValueChange(false, j, e.target.value)} style={{ width: '50px', padding: '4px', border: '1px solid #f39c12', borderRadius: '3px', textAlign: 'right' }} />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button onClick={handleSaveEdit} style={{ padding: '4px 8px', fontSize: '0.75em', background: '#2ecc71', marginRight: '4px' }}>Save</button>
                      <button onClick={() => setEditingIndex(null)} style={{ padding: '4px 8px', fontSize: '0.75em', background: '#95a5a6' }}>Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>[{pair.input.map(x => x.toFixed(2)).join(', ')}]</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>[{pair.output.map(x => x.toFixed(2)).join(', ')}]</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button onClick={() => handleStartEdit(idx, pair)} style={{ padding: '4px 8px', fontSize: '0.75em', background: '#f39c12', marginRight: '4px' }}>Edit</button>
                      <button onClick={() => handleDeleteRow(idx)} style={{ padding: '4px 8px', fontSize: '0.75em', background: '#e74c3c' }}>Delete</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleAddRow} disabled={pairs.length === 0} style={{ padding: '8px 15px', fontSize: '0.9em', background: pairs.length === 0 ? '#bdc3c7' : '#3498db' }}>+ Add Row</button>
          </div>
        </div>
      )}
    </div>
  )
}

function AlgorithmExplainer() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div style={{ background: '#e8f8f5', border: '2px solid #1abc9c', borderRadius: '8px', marginBottom: '20px' }}>
      <div onClick={() => setIsExpanded(!isExpanded)} style={{ padding: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#16a085' }}>{isExpanded ? '▼' : '▶'} 📚 How This Works (Math + Code)</h3>
      </div>

      {isExpanded && (
        <div style={{ padding: '15px', borderTop: '2px solid #1abc9c', fontSize: '0.9em', lineHeight: '1.6', color: '#2c3e50' }}>
          <h4>The Problem</h4>
          <p>You have n input-output pairs. You want to discover how many <strong>transformation matrices</strong> they come from, and which matrix produced which pair.</p>

          <h4>The Solution: K-Means for Matrices</h4>
          <ol>
            <li><strong>Initialize:</strong> Randomly assign each pair to one of K clusters.</li>
            <li><strong>E-Step (fit matrices):</strong> For each cluster k:
              <ul>
                <li>Stack all pairs' inputs into matrix X (n_k × d_in)</li>
                <li>Stack all pairs' outputs into matrix Y (n_k × d_out)</li>
                <li>Solve for transformation matrix M using least squares:</li>
                <li style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '8px', borderRadius: '4px', margin: '5px 0' }}>X × M ≈ Y → M = (X^T X)^(-1) X^T Y</li>
              </ul>
            </li>
            <li><strong>M-Step (reassign pairs):</strong> For each pair i, test it against all K matrices and assign to the one with lowest prediction error.</li>
            <li><strong>Repeat</strong> until assignments stabilize.</li>
          </ol>

          <h4>Why the Loss Spike (K=3→K=4→K=5)?</h4>
          <p><strong>This is normal!</strong> You're observing the <strong>bias-variance tradeoff</strong>:</p>
          <ul>
            <li><strong>K=3:</strong> True number of clusters. Fits perfectly.</li>
            <li><strong>K=4:</strong> Over-constrained. You force one true cluster to split, making both sub-clusters worse. Loss spikes.</li>
            <li><strong>K=5:</strong> More flexibility. The algorithm spreads 5 matrices across the pairs. Loss goes down—but you're <strong>overfitting</strong>.</li>
          </ul>
          <p><strong>Solution:</strong> Look for the <strong>"elbow curve"</strong>. Plot loss vs. K. The elbow is usually where you should stop.</p>
        </div>
      )}
    </div>
  )
}

function LossCurve({ losses, K }) {
  const totalLoss = losses.reduce((a, b) => a + b, 0)
  const avgLoss = totalLoss / losses.length
  const maxLoss = Math.max(...losses)
  const width = 600, height = 300, padding = 40
  const chartWidth = width - 2 * padding
  const chartHeight = height - 2 * padding

  return (
    <div className="chart">
      <h3>Loss Distribution Across Pairs (K = {K})</h3>
      <svg width={width} height={height}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" strokeWidth="2" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" strokeWidth="2" />
        <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="12" fill="#666">Pair Index</text>
        <text x="20" y={height / 2} textAnchor="middle" fontSize="12" fill="#666" transform={`rotate(-90 20 ${height / 2})`}>Loss</text>
        {losses.map((loss, i) => {
          const x = padding + (i / (losses.length - 1 || 1)) * chartWidth
          const barHeight = (loss / (maxLoss || 1)) * chartHeight
          const y = height - padding - barHeight
          const color = loss < 0.1 ? '#2ecc71' : loss < 0.5 ? '#f39c12' : '#e74c3c'
          return <rect key={i} x={x - 1.5} y={y} width={3} height={barHeight} fill={color} opacity="0.7" />
        })}
        <text x={width - padding - 5} y={padding + 20} textAnchor="end" fontSize="11" fill="#666">Total Loss: {totalLoss.toFixed(2)}</text>
        <text x={width - padding - 5} y={padding + 35} textAnchor="end" fontSize="11" fill="#666">Avg Loss: {avgLoss.toFixed(3)}</text>
      </svg>
    </div>
  )
}

function ClusterVisualization({ pairs, assignments, K }) {
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#c0392b', '#16a085']

  return (
    <div className="chart">
      <h3>Cluster Assignments (K = {K})</h3>
      <div className="cluster-legend">
        {Array(K).fill(0).map((_, k) => {
          const count = assignments.filter(a => a === k).length
          return (
            <div key={k} className="legend-item">
              <div className="legend-color" style={{ background: colors[k % colors.length] }}></div>
              <span>Cluster {k}: {count} pairs</span>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: '15px' }}>
        <svg width="100%" height="40" viewBox={`0 0 ${pairs.length * 15} 40`}>
          {pairs.map((_, i) => (
            <rect key={i} x={i * 15} y="10" width="12" height="20" fill={colors[assignments[i] % colors.length]} stroke="#333" strokeWidth="0.5" />
          ))}
        </svg>
      </div>
    </div>
  )
}

function MatricesDisplay({ matrices, pairs, assignments, K }) {
  return (
    <div style={{ marginTop: '40px' }}>
      <h3>Discovered Transformation Matrices</h3>
      <p style={{ fontSize: '0.85em', color: '#7f8c8d', marginBottom: '15px' }}>
        💡 <strong>What these are:</strong> Each matrix represents a learned transformation that maps input vectors to output vectors.
      </p>
      <div className="matrices-grid">
        {matrices.slice(0, K).map((M, k) => {
          const pairsInCluster = assignments.filter(a => a === k).length
          return (
            <div key={k} className="matrix-card">
              <h4>Matrix {k} ({pairsInCluster} pairs)</h4>
              <table>
                <tbody>
                  {M.map((row, i) => (
                    <tr key={i}>
                      {row.map((val, j) => (
                        <td key={j}>{typeof val === 'number' ? val.toFixed(2) : '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN EXPORTED COMPONENT
// ============================================================================

export function MatrixDiscoveryTool() {
  const [mode, setMode] = useState('synthetic')
  const [K, setK] = useState(2)
  const [numClusters, setNumClusters] = useState(2)
  const [numPairsPerCluster, setNumPairsPerCluster] = useState(5)
  const [matrixRows, setMatrixRows] = useState(2)
  const [matrixCols, setMatrixCols] = useState(2)
  const [pairs, setPairs] = useState([])
  const [dataInput, setDataInput] = useState('')
  const [error, setError] = useState('')

  const handleGenerateSynthetic = () => {
    try {
      setError('')
      const { pairs: newPairs } = generateSyntheticData(numClusters, numPairsPerCluster, matrixRows, matrixCols)
      setPairs(newPairs)
      setMode('synthetic')
    } catch (e) {
      setError(`Error: ${e.message}`)
    }
  }

  const handleParseData = () => {
    try {
      setError('')
      const lines = dataInput.trim().split('\n')
      const newPairs = lines.filter(line => line.trim()).map((line, idx) => {
        const [input, output] = line.split(';')
        if (!input || !output) throw new Error(`Line ${idx + 1}: Invalid format`)
        const inputVec = input.trim().split(',').map(Number)
        const outputVec = output.trim().split(',').map(Number)
        if (inputVec.some(isNaN) || outputVec.some(isNaN)) throw new Error(`Line ${idx + 1}: Non-numeric values`)
        return { input: inputVec, output: outputVec }
      })
      if (newPairs.length === 0) throw new Error('No valid pairs found')
      setPairs(newPairs)
      setMode('manual')
    } catch (e) {
      setError(`Parse error: ${e.message}`)
    }
  }

  const { assignments, matrices, losses } = useMemo(() => {
    if (pairs.length === 0) return { assignments: [], matrices: [], losses: [] }
    return clusterizeWithKMatrices(pairs, K)
  }, [pairs, K])

  const totalLoss = losses.reduce((a, b) => a + b, 0)

  return (
    <div className="matrix-discovery">
      {error && <div className="error-message">{error}</div>}

      <div className="controls">
        <div className="control-group">
          <label className="control-label">Mode</label>
          <div className="button-group">
            <button onClick={handleGenerateSynthetic} style={{ background: mode === 'synthetic' ? '#3498db' : '#95a5a6' }}>Generate Synthetic Data</button>
            <button onClick={handleParseData} style={{ background: mode === 'manual' ? '#3498db' : '#95a5a6' }} disabled={!dataInput.trim()}>Parse Manual Data</button>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Clustering Parameter K</label>
          <div className="slider-container">
            <input type="range" min="1" max={Math.min(20, pairs.length || 10)} value={K} onChange={e => setK(Number(e.target.value))} />
            <span className="slider-value">{K}</span>
          </div>
          <p style={{ fontSize: '0.8em', color: '#7f8c8d' }}>Number of transformation matrices to discover</p>
        </div>
      </div>

      {mode === 'synthetic' && pairs.length === 0 && (
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Synthetic Data Parameters</h3>
          <div className="controls">
            <div className="control-group">
              <label className="control-label">True Number of Matrices</label>
              <div className="slider-container">
                <input type="range" min="1" max="5" value={numClusters} onChange={e => setNumClusters(Number(e.target.value))} />
                <span className="slider-value">{numClusters}</span>
              </div>
            </div>
            <div className="control-group">
              <label className="control-label">Pairs per Matrix</label>
              <div className="slider-container">
                <input type="range" min="2" max="10" value={numPairsPerCluster} onChange={e => setNumPairsPerCluster(Number(e.target.value))} />
                <span className="slider-value">{numPairsPerCluster}</span>
              </div>
            </div>
            <div className="control-group">
              <label className="control-label">Matrix Dimensions</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label>Rows:</label>
                <select value={matrixRows} onChange={e => setMatrixRows(Number(e.target.value))}>
                  <option>2</option><option>3</option><option>4</option>
                </select>
                <label style={{ marginLeft: '20px' }}>Cols:</label>
                <select value={matrixCols} onChange={e => setMatrixCols(Number(e.target.value))}>
                  <option>2</option><option>3</option><option>4</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {pairs.length === 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Manual Data Input</h3>
          <p style={{ fontSize: '0.9em', color: '#7f8c8d', marginBottom: '10px' }}>Format: one pair per line, as: 1,2,3;4,5,6 (input vector; output vector)</p>
          <textarea value={dataInput} onChange={e => setDataInput(e.target.value)} placeholder="Example:&#10;1,0;2,1&#10;0,1;1,2&#10;2,2;5,6" />
        </div>
      )}

      {pairs.length > 0 && (
        <>
          <DataEditor pairs={pairs} onPairsChange={setPairs} />
          <AlgorithmExplainer />

          <div className="stats">
            <div className="stat-card"><div className="stat-value">{pairs.length}</div><div className="stat-label">Total Pairs</div></div>
            <div className="stat-card"><div className="stat-value">{K}</div><div className="stat-label">Matrices (K)</div></div>
            <div className="stat-card"><div className="stat-value">{totalLoss.toFixed(2)}</div><div className="stat-label">Total Loss</div></div>
            <div className="stat-card"><div className="stat-value">{(totalLoss / pairs.length).toFixed(3)}</div><div className="stat-label">Avg Loss per Pair</div></div>
          </div>

          <div className="info-box">
            <strong>How to read:</strong> Adjust the K slider to find the optimal number of matrices. Lower K = simpler model (fewer matrices). Higher K = better fit but more complex. Look for the "elbow" where increasing K gives diminishing returns.
          </div>

          <div className="visualizations">
            <LossCurve losses={losses} K={K} />
          </div>

          <ClusterVisualization pairs={pairs} assignments={assignments} K={K} />
          <MatricesDisplay matrices={matrices} pairs={pairs} assignments={assignments} K={K} />
        </>
      )}

      {pairs.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <button onClick={() => { setPairs([]); setDataInput(''); setError('') }} style={{ background: '#95a5a6' }}>Clear Data & Start Over</button>
        </div>
      )}
    </div>
  )
}

export default MatrixDiscoveryTool
