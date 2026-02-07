import React, { useState, useMemo } from 'react'
import '../../styles/MatrixFromVectors.css'

// Matrix math utilities
function matrixMultiply(A, B) {
  const rowsA = A.length, colsA = A[0].length
  const colsB = B[0].length
  const result = Array(rowsA).fill(null).map(() => Array(colsB).fill(0))
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += A[i][k] * B[k][j]
      }
    }
  }
  return result
}

function transpose(M) {
  return M[0].map((_, i) => M.map(row => row[i]))
}

function invert2x2(M) {
  const [[a, b], [c, d]] = M
  const det = a * d - b * c
  if (Math.abs(det) < 1e-10) return null
  return [[d / det, -b / det], [-c / det, a / det]]
}

function pseudoinverse(A) {
  // For 2x2: A⁺ = (AᵀA)⁻¹Aᵀ
  const At = transpose(A)
  const AtA = matrixMultiply(At, A)
  const AtA_inv = invert2x2(AtA)
  if (!AtA_inv) return null
  return matrixMultiply(AtA_inv, At)
}

function solveForB(inputs, outputs) {
  // inputs and outputs are both 2x2 matrices (stacked row vectors)
  const pinv = pseudoinverse(inputs)
  if (!pinv) return null
  return matrixMultiply(pinv, outputs)
}

function computeResidual(A, B, C) {
  // ||A·B - C||²
  const AB = matrixMultiply(A, B)
  let sum = 0
  for (let i = 0; i < AB.length; i++) {
    for (let j = 0; j < AB[0].length; j++) {
      sum += (AB[i][j] - C[i][j]) ** 2
    }
  }
  return Math.sqrt(sum)
}

/**
 * Interactive slider demo showing infinite solutions
 * Demonstrates that one input-output pair allows infinitely many matrices
 */
export function InfiniteMatricesDemo() {
  const [input, setInput] = useState([1, 0])
  const [targetOutput, setTargetOutput] = useState([2, 0])
  const [freeParam, setFreeParam] = useState(0)
  
  // Compute two different matrices that satisfy the constraint
  const computeMatrix = (t1, t2) => {
    if (Math.abs(input[0]) < 0.0001 && Math.abs(input[1]) < 0.0001) {
      return [[0, 0], [0, 0]] // degenerate
    }
    
    if (Math.abs(input[0]) > 0.0001) {
      // input[0] != 0, solve for b00, b01
      const b10 = t1
      const b11 = t2
      const b00 = (targetOutput[0] - input[1] * b10) / input[0]
      const b01 = (targetOutput[1] - input[1] * b11) / input[0]
      return [[b00, b01], [b10, b11]]
    } else {
      // input[0] ≈ 0, so input[1] must be nonzero
      const b00 = t1
      const b01 = t2
      const b10 = (targetOutput[0] - input[0] * b00) / input[1]
      const b11 = (targetOutput[1] - input[0] * b01) / input[1]
      return [[b00, b01], [b10, b11]]
    }
  }
  
  const matrix1 = computeMatrix(freeParam, 0)
  const matrix2 = computeMatrix(0, freeParam)
  
  // Verify both matrices produce the correct output
  const verify = (mat) => [
    input[0] * mat[0][0] + input[1] * mat[1][0],
    input[0] * mat[0][1] + input[1] * mat[1][1]
  ]
  
  const output1 = verify(matrix1)
  const output2 = verify(matrix2)
  
  const updateInput = (idx, value) => {
    const num = parseFloat(value) || 0
    setInput(prev => prev.map((v, i) => i === idx ? num : v))
  }
  
  const updateTargetOutput = (idx, value) => {
    const num = parseFloat(value) || 0
    setTargetOutput(prev => prev.map((v, i) => i === idx ? num : v))
  }
  
  const isMatch1 = Math.abs(output1[0] - targetOutput[0]) < 0.01 && Math.abs(output1[1] - targetOutput[1]) < 0.01
  const isMatch2 = Math.abs(output2[0] - targetOutput[0]) < 0.01 && Math.abs(output2[1] - targetOutput[1]) < 0.01
  
  return (
    <div className="demo-box">
      <p className="demo-instruction">
        <strong>Set an input-output pair.</strong> Then slide the free parameter to see how infinitely many different matrices all transform the input into the exact same output!
      </p>
      
      <div className="editable-vectors">
        <div className="editable-vector-group">
          <h4 className="editable-label input-label">Edit Input:</h4>
          <div className="vector-edit-row">
            <span className="vector-name">A:</span>
            <span>[</span>
            <input 
              type="number" 
              value={input[0]} 
              onChange={e => updateInput(0, e.target.value)}
              className="vector-input small"
            />
            <span>,</span>
            <input 
              type="number" 
              value={input[1]} 
              onChange={e => updateInput(1, e.target.value)}
              className="vector-input small"
            />
            <span>]</span>
          </div>
        </div>
        
        <div className="editable-vector-group">
          <h4 className="editable-label output-label">Edit Output:</h4>
          <div className="vector-edit-row">
            <span className="vector-name">C:</span>
            <span>[</span>
            <input 
              type="number" 
              value={targetOutput[0]} 
              onChange={e => updateTargetOutput(0, e.target.value)}
              className="vector-input small"
            />
            <span>,</span>
            <input 
              type="number" 
              value={targetOutput[1]} 
              onChange={e => updateTargetOutput(1, e.target.value)}
              className="vector-input small"
            />
            <span>]</span>
          </div>
        </div>
      </div>
      
      <div className="slider-container highlight-slider">
        <label className="slider-title">Free Parameter (pick any value):</label>
        <input 
          type="range" 
          min="-5" 
          max="5" 
          step="0.1"
          value={freeParam}
          onChange={e => setFreeParam(parseFloat(e.target.value))}
          className="demo-slider"
        />
        <div className="slider-value">t = {freeParam.toFixed(1)}</div>
      </div>
      
      <div className="matrices-comparison">
        <div className="matrix-example">
          <div className="matrix-example-title">Matrix 1 (varying first free param):</div>
          <div className="matrix-equation compact">
            <div className="matrix-part">
              <div className="vector-display">[{input[0]}, {input[1]}]</div>
            </div>
            <div className="matrix-operator">×</div>
            <div className="matrix-part">
              <div className="matrix-display">
                <div>[{matrix1[0][0].toFixed(2)}, {matrix1[0][1].toFixed(2)}]</div>
                <div>[{matrix1[1][0].toFixed(2)}, {matrix1[1][1].toFixed(2)}]</div>
              </div>
            </div>
            <div className="matrix-operator">=</div>
            <div className="matrix-part">
              <div className={`vector-display computed ${isMatch1 ? 'match' : 'no-match'}`}>
                [{output1[0].toFixed(2)}, {output1[1].toFixed(2)}]
              </div>
            </div>
          </div>
          <div className="match-indicator">{isMatch1 ? '✓ Matches target' : '✗ Mismatch'}</div>
        </div>
        
        <div className="matrix-example">
          <div className="matrix-example-title">Matrix 2 (varying second free param):</div>
          <div className="matrix-equation compact">
            <div className="matrix-part">
              <div className="vector-display">[{input[0]}, {input[1]}]</div>
            </div>
            <div className="matrix-operator">×</div>
            <div className="matrix-part">
              <div className="matrix-display">
                <div>[{matrix2[0][0].toFixed(2)}, {matrix2[0][1].toFixed(2)}]</div>
                <div>[{matrix2[1][0].toFixed(2)}, {matrix2[1][1].toFixed(2)}]</div>
              </div>
            </div>
            <div className="matrix-operator">=</div>
            <div className="matrix-part">
              <div className={`vector-display computed ${isMatch2 ? 'match' : 'no-match'}`}>
                [{output2[0].toFixed(2)}, {output2[1].toFixed(2)}]
              </div>
            </div>
          </div>
          <div className="match-indicator">{isMatch2 ? '✓ Matches target' : '✗ Mismatch'}</div>
        </div>
      </div>
      
      <div className="result-banner success">
        <p><strong>✅ Both matrices produce the exact same output!</strong></p>
        <p className="result-note">Slide the free parameter to generate infinitely many different matrices that all satisfy A · B = C</p>
      </div>
      
      <p className="demo-warning">⚠️ One input-output pair is not enough information to uniquely determine a matrix!<br/>This is why we need <strong>multiple independent pairs.</strong></p>
    </div>
  )
}

/**
 * Interactive calculator for 2 input-output pairs
 * Solves for the unique matrix B given two independent input-output pairs
 */
export function MatrixCalculator() {
  const [a1, setA1] = useState([1, 0])
  const [a2, setA2] = useState([0, 1])
  const [c1, setC1] = useState([2, 1])
  const [c2, setC2] = useState([1, 3])
  
  const solution = useMemo(() => {
    const inputs = [a1, a2]
    const outputs = [c1, c2]
    return solveForB(inputs, outputs)
  }, [a1, a2, c1, c2])
  
  const VectorInput = ({ label, value, onChange }) => (
    <div className="vector-input-row">
      <span className="vector-label">{label}:</span>
      <span>[</span>
      <input 
        type="number" 
        value={value[0]} 
        onChange={e => onChange([parseFloat(e.target.value) || 0, value[1]])}
        className="vector-input"
      />
      <span>,</span>
      <input 
        type="number" 
        value={value[1]} 
        onChange={e => onChange([value[0], parseFloat(e.target.value) || 0])}
        className="vector-input"
      />
      <span>]</span>
    </div>
  )
  
  return (
    <div className="calculator-box">
      <div className="calculator-inputs">
        <div className="input-group">
          <h4>Input Vectors</h4>
          <VectorInput label="A₁" value={a1} onChange={setA1} />
          <VectorInput label="A₂" value={a2} onChange={setA2} />
        </div>
        <div className="input-group">
          <h4>Output Vectors</h4>
          <VectorInput label="C₁" value={c1} onChange={setC1} />
          <VectorInput label="C₂" value={c2} onChange={setC2} />
        </div>
      </div>
      <div className="calculator-result">
        <div className="result-label">Solution Matrix B:</div>
        {solution ? (
          <div className="matrix-result">
            <div>[ {solution[0][0].toFixed(2)}, {solution[0][1].toFixed(2)} ]</div>
            <div>[ {solution[1][0].toFixed(2)}, {solution[1][1].toFixed(2)} ]</div>
          </div>
        ) : (
          <div className="error-message">Matrix is singular (inputs not independent)</div>
        )}
      </div>
    </div>
  )
}

/**
 * Two-system overlap calculator with Venn diagram
 * Finds the best-fit matrix that explains two observations
 */
export function TwoSystemCalculator() {
  const [obsA, setObsA] = useState([1, 0])
  const [obsC, setObsC] = useState([2, 1])
  const [obsD, setObsD] = useState([0, 1])
  const [obsE, setObsE] = useState([1, 3])
  
  const { solution, residual1, residual2 } = useMemo(() => {
    const inputs = [obsA, obsD]
    const outputs = [obsC, obsE]
    const B = solveForB(inputs, outputs)
    if (!B) return { solution: null, residual1: 0, residual2: 0 }
    
    // Compute residuals for each observation
    const res1 = computeResidual([obsA], B, [obsC])
    const res2 = computeResidual([obsD], B, [obsE])
    
    return { solution: B, residual1: res1, residual2: res2 }
  }, [obsA, obsC, obsD, obsE])
  
  const totalResidual = residual1 + residual2
  const isPerfect = totalResidual < 0.001
  
  const VectorInput = ({ label, value, onChange }) => (
    <div className="vector-input-row">
      <span className="vector-label">{label}:</span>
      <span>[</span>
      <input 
        type="number" 
        value={value[0]} 
        onChange={e => onChange([parseFloat(e.target.value) || 0, value[1]])}
        className="vector-input"
      />
      <span>,</span>
      <input 
        type="number" 
        value={value[1]} 
        onChange={e => onChange([value[0], parseFloat(e.target.value) || 0])}
        className="vector-input"
      />
      <span>]</span>
    </div>
  )
  
  return (
    <div className="calculator-box two-system-calc">
      <p className="calc-description">Enter two input-output observations. We will find the matrix that best explains both.</p>
      <div className="observation-inputs">
        <div className="observation-group">
          <h4>Observation 1: A → C</h4>
          <VectorInput label="A" value={obsA} onChange={setObsA} />
          <VectorInput label="C" value={obsC} onChange={setObsC} />
        </div>
        <div className="observation-group">
          <h4>Observation 2: D → E</h4>
          <VectorInput label="D" value={obsD} onChange={setObsD} />
          <VectorInput label="E" value={obsE} onChange={setObsE} />
        </div>
      </div>
      
      <div className="two-system-result">
        {solution ? (
          <>
            <div className="result-section">
              <div className="result-label">Best-fit Matrix B:</div>
              <div className="matrix-result">
                <div>[ {solution[0][0].toFixed(3)}, {solution[0][1].toFixed(3)} ]</div>
                <div>[ {solution[1][0].toFixed(3)}, {solution[1][1].toFixed(3)} ]</div>
              </div>
            </div>
            
            <div className="venn-diagram">
              <svg viewBox="0 0 200 120" className="venn-svg">
                <circle cx="70" cy="60" r="45" className="venn-circle venn-a" />
                <circle cx="130" cy="60" r="45" className="venn-circle venn-b" />
                <text x="50" y="65" className="venn-label">A→C</text>
                <text x="130" y="65" className="venn-label">D→E</text>
              </svg>
            </div>
            
            <div className={`overlap-status ${isPerfect ? 'perfect' : 'approximate'}`}>
              {isPerfect ? (
                <>✅ <strong>Perfect overlap!</strong> The same matrix explains both observations exactly.</>
              ) : (
                <>⚠️ <strong>Approximate match.</strong> Residual: {totalResidual.toFixed(4)} — the observations don't share an exact solution.</>
              )}
            </div>
          </>
        ) : (
          <div className="error-message">Cannot compute — inputs may be linearly dependent</div>
        )}
      </div>
    </div>
  )
}
