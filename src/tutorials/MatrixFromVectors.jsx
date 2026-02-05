import React, { useState, useMemo } from 'react'
import { Container } from '../components/SharedUI.jsx'
import '../styles/MatrixFromVectors.css'

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

// Collapsible component
function Collapsible({ title, icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="collapsible-section">
      <div 
        className="collapsible-header" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{icon} {title}</span>
        <span className="collapsible-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </div>
  )
}

// Step component with numbered circle
function Step({ number, title, children }) {
  return (
    <div className="step">
      <div className="step-number">{number}</div>
      <div className="step-content">
        <h4>{title}</h4>
        {children}
      </div>
    </div>
  )
}

// Interactive slider demo showing infinite solutions
function InfiniteMatricesDemo() {
  const [input, setInput] = useState([1, 0])
  const [targetOutput, setTargetOutput] = useState([2, 0])
  const [freeParam, setFreeParam] = useState(0)
  
  // Given: input · B = targetOutput
  // For a 2×2 matrix B = [[b00, b01], [b10, b11]]
  // We have 2 equations, 4 unknowns → 2 degrees of freedom
  // This is an underdetermined system!
  
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

// Interactive calculator for 2 input-output pairs
function MatrixCalculator() {
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

// Two-system overlap calculator with Venn diagram
function TwoSystemCalculator() {
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

// Link card component
function LinkCard({ href, title, description }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link-card">
      <div className="link-card-title">{title}</div>
      <div className="link-card-desc">{description}</div>
    </a>
  )
}

export default function MatrixFromVectors() {
  return (
    <Container className="tutorial matrix-tutorial">
      <h1>🔢 Finding a Matrix from Input-Output Vectors</h1>
      
      <p>
        You know that multiplying vector <strong>A</strong> by matrix <strong>B</strong> gives 
        vector <strong>C</strong>. You have A and C — how do you find B?
      </p>

      <div className="callout analogy">
        <div className="callout-icon">🎯</div>
        <div className="callout-content">
          <h3>Think of it like...</h3>
          <p>
            A matrix is a <em>transformation machine</em>. You feed in a vector, it spits out a 
            different vector. You are reverse-engineering the machine by observing what goes in 
            and what comes out.
          </p>
        </div>
      </div>

      <div className="section core-problem">
        <h3>The Core Problem</h3>
        <p>Given:</p>
        <ul>
          <li><strong>A</strong> = input vector (what you feed in)</li>
          <li><strong>C</strong> = output vector (what comes out)</li>
        </ul>
        <p>Find: <strong>B</strong> = the transformation matrix</p>
        
        <pre className="code-block">{`A · B = C

[a₁, a₂] · | b₁₁  b₁₂ |  =  [c₁, c₂]
           | b₂₁  b₂₂ |`}</pre>
      </div>

      <h2>The Catch: One Pair Isn't Enough</h2>
      
      <div className="callout warning">
        <div className="callout-icon">⚠️</div>
        <div className="callout-content">
          <h3>Important Constraint</h3>
          <p>
            A single input-output pair gives you <strong>infinitely many</strong> possible matrices!
            It is like knowing one point on a line — there are infinite lines passing through it.
          </p>
        </div>
      </div>

      <InfiniteMatricesDemo />

      <h2>The Solution: Multiple Input-Output Pairs</h2>

      <Step number={1} title="Gather enough data">
        <p>
          For an n×n matrix, you need <strong>n linearly independent</strong> input-output pairs. 
          For a 2×2 matrix, that is 2 pairs. For 3×3, that is 3 pairs.
        </p>
      </Step>

      <Step number={2} title="Stack inputs and outputs into matrices">
        <p>If you have inputs A₁, A₂ and outputs C₁, C₂:</p>
        <pre className="code-block">{`Input matrix:    Output matrix:
| A₁ |           | C₁ |
| A₂ |           | C₂ |`}</pre>
      </Step>

      <Step number={3} title="Solve for B">
        <p>The equation becomes: <code>Inputs · B = Outputs</code></p>
        <p>Rearranging: <code>B = Inputs⁻¹ · Outputs</code></p>
        <p className="note">(Multiply both sides by the inverse of the input matrix)</p>
      </Step>

      <h2>Interactive Calculator</h2>
      <MatrixCalculator />

      <h2>🎯 Finding the Closest Overlap Between Two Systems</h2>

      <div className="callout analogy">
        <div className="callout-icon">🎯</div>
        <div className="callout-content">
          <h3>The Venn Diagram Intuition</h3>
          <p>
            Each input-output pair defines a <em>hyperplane</em> (infinite set) of valid matrices. 
            Two pairs from different observations give you two hyperplanes. These can:
          </p>
          <ul>
            <li><strong>Intersect</strong> → Same matrix explains both! (overlap exists)</li>
            <li><strong>Be parallel/skew</strong> → No exact match, but we can find the <em>closest point</em> on each</li>
          </ul>
        </div>
      </div>

      <div className="section">
        <h3>The Math: Least Squares to the Rescue</h3>
        <p>
          When you have two underdetermined systems that might not have a common solution, 
          you are looking for the matrix B that <strong>minimizes total error</strong>:
        </p>

        <pre className="code-block">{`minimize: ||A · B - C||² + ||D · B - E||²

This is a least-squares problem!`}</pre>

        <p>
          Stack all your constraints together and solve via the <strong>pseudoinverse</strong>:
        </p>

        <pre className="code-block">{`| A |       | C |
| D | · B = | E |

B = pseudoinverse(stacked_inputs) · stacked_outputs`}</pre>
      </div>

      <TwoSystemCalculator />

      <Collapsible title="Deep Dive: What the Distance Means" icon="🔬">
        <p>
          When the solution is <em>not</em> exact (residual {'>'} 0), the distance tells you how 
          incompatible the two observations are. High residual means:
        </p>
        <ul>
          <li>The same matrix probably was NOT used for both</li>
          <li>There is noise/error in your measurements</li>
          <li>The underlying transformation changed between observations</li>
        </ul>
        <p>
          The "closest matrix" is still useful — it is the <strong>best compromise</strong> that 
          minimizes total squared error across both observations.
        </p>
      </Collapsible>

      <Collapsible title="Why Linear Independence Matters" icon="🧮">
        <p>
          If your input vectors are <em>linearly dependent</em> (one is a scalar multiple of another), 
          they do not provide new information.
        </p>
        <pre className="code-block">{`Bad:  A₁ = [1, 2], A₂ = [2, 4]  ← A₂ is just 2×A₁
Good: A₁ = [1, 0], A₂ = [0, 1]  ← Independent`}</pre>
      </Collapsible>

      <Collapsible title="The Moore-Penrose Pseudoinverse: Building from First Principles" icon="📐" defaultOpen={false}>
        <p>
          The <strong>Moore-Penrose pseudoinverse</strong> A⁺ is the answer to all three cases. 
          Here's why it's so powerful:
        </p>

        <h4>Why Transpose Matters</h4>
        <p>
          When you multiply a matrix by its transpose, you transform any shape into a <em>square</em> matrix. 
          And square matrices can be inverted! This is the key trick.
        </p>

        <pre className="code-block">{`For Tall Matrix A (3×2):
A^T has shape 2×3
A^T · A has shape 2×2  ✓ (invertible!)

For Wide Matrix A (2×3):
A^T has shape 3×2
A · A^T has shape 2×2  ✓ (invertible!)`}</pre>

        <h4>The Recipe</h4>
        <p>
          Once you have a square matrix from the transpose trick, the pseudoinverse formula is:
        </p>

        <pre className="code-block">{`Tall Matrix A (3×2):
A⁺ = (A^T · A)^(-1) · A^T
This gives you the least squares solution

Wide Matrix A (2×3):
A⁺ = A^T · (A · A^T)^(-1)
This gives you the minimum-norm solution`}</pre>

        <h4>Why It's Called "Pseudo"</h4>
        <ul>
          <li><strong>It's not a true inverse.</strong> If A is non-square, A⁺ · A ≠ I</li>
          <li><strong>But it satisfies 4 magic properties</strong> that uniquely define it:
            <ul>
              <li>A · A⁺ · A = A</li>
              <li>A⁺ · A · A⁺ = A⁺</li>
              <li>(A · A⁺)ᵀ = A · A⁺</li>
              <li>(A⁺ · A)ᵀ = A⁺ · A</li>
            </ul>
          </li>
        </ul>
      </Collapsible>

      <Collapsible title="The Bridge: From Least Squares to Pseudoinverse (Calculus Derivation)" icon="∫" defaultOpen={false}>
        <p>
          When you have <strong>more equations than unknowns</strong> (overdetermined system), 
          there's usually no exact solution. So we ask: <strong>What matrix minimizes the total error?</strong>
        </p>

        <pre className="code-block">{`minimize: ||A · B - C||²

This is called the least-squares problem.`}</pre>

        <h4>Step 1: What Are We Actually Minimizing?</h4>
        <p>
          Let's expand <code>||A·B - C||²</code>. The squared norm of a vector is the sum of its 
          squared components. If the error vector is <strong>e = A·B - C</strong>, then:
        </p>

        <pre className="code-block">{`||e||² = e₁² + e₂² + e₃² + ...`}</pre>

        <p>
          But wait—this sum of squared components is <em>exactly</em> what you get when you 
          dot a vector with itself! Remember the dot product:
        </p>

        <pre className="code-block">{`eᵀ · e = [e₁, e₂, e₃, ...] · [e₁]   = e₁·e₁ + e₂·e₂ + e₃·e₃ + ...
                             [e₂]
                             [e₃]
                             [...]

        = e₁² + e₂² + e₃² + ...  ← same thing!`}</pre>

        <p>
          So the squared norm <strong>||e||²</strong> and <strong>eᵀ·e</strong> are two 
          notations for the same quantity. Now we can write:
        </p>

        <pre className="code-block">{`||e||² = eᵀ · e = (A·B - C)ᵀ · (A·B - C)`}</pre>

        <p>
          Expanding this (using the rule that (X·Y)ᵀ = Yᵀ·Xᵀ):
        </p>

        <pre className="code-block">{`= (Bᵀ·Aᵀ - Cᵀ) · (A·B - C)`}</pre>

        <p>
          To expand this, we use <strong>FOIL</strong> (First, Outer, Inner, Last) — 
          the same technique from algebra for multiplying two binomials like (a - b)(c - d):
        </p>
        <ul>
          <li><strong>First:</strong> (Bᵀ·Aᵀ) · (A·B) = Bᵀ·Aᵀ·A·B</li>
          <li><strong>Outer:</strong> (Bᵀ·Aᵀ) · (-C) = -Bᵀ·Aᵀ·C</li>
          <li><strong>Inner:</strong> (-Cᵀ) · (A·B) = -Cᵀ·A·B</li>
          <li><strong>Last:</strong> (-Cᵀ) · (-C) = +Cᵀ·C</li>
        </ul>

        <pre className="code-block">{`= Bᵀ·Aᵀ·A·B - Bᵀ·Aᵀ·C - Cᵀ·A·B + Cᵀ·C`}</pre>

        <h4>Step 2: Finding the Minimum (Calculus)</h4>
        <p>
          To minimize, we take the derivative with respect to B and set it to zero. 
          In matrix calculus:
        </p>
        <ul>
          <li>∂/∂B (Bᵀ·M·B) = 2·M·B (when M is symmetric)</li>
          <li>∂/∂B (Bᵀ·v) = v</li>
          <li>∂/∂B (vᵀ·B) = v</li>
        </ul>

        <p>
          Note that <strong>AᵀA is always symmetric</strong> (because (AᵀA)ᵀ = Aᵀ(Aᵀ)ᵀ = AᵀA). 
          Let's apply each rule carefully:
        </p>

        <pre className="code-block">{`∂/∂B [Bᵀ·Aᵀ·A·B - Bᵀ·Aᵀ·C - Cᵀ·A·B + Cᵀ·C]

Term by term:

① Bᵀ·(AᵀA)·B  →  2·(AᵀA)·B = 2·Aᵀ·A·B
   (quadratic form rule, AᵀA is symmetric)

② -Bᵀ·(AᵀC)  →  -(AᵀC) = -Aᵀ·C
   (rule: ∂/∂B(Bᵀv) = v, where v = AᵀC)

③ -(CᵀA)·B   →  -Aᵀ·C
   (rule: ∂/∂B(vᵀB) = v, where vᵀ = CᵀA, so v = AᵀC)

④ CᵀC       →  0
   (constant with respect to B)

Sum: 2·Aᵀ·A·B - Aᵀ·C - Aᵀ·C + 0

    = 2·Aᵀ·A·B - 2·Aᵀ·C`}</pre>

        <h4>Step 3: Set to Zero and Solve</h4>
        <p>
          Setting the derivative to zero:
        </p>

        <pre className="code-block">{`2·Aᵀ·A·B - 2·Aᵀ·C = 0

Aᵀ·A·B = Aᵀ·C        ← The "Normal Equations"!`}</pre>

        <p>
          <strong>Why "Normal"?</strong> The name comes from geometry: the error vector 
          (A·B - C) ends up being <em>perpendicular</em> (normal) to the column space of A. 
          This is the projection interpretation of least squares.
        </p>

        <h4>Step 4: Solve for B</h4>
        <p>
          If AᵀA is invertible (which happens when A has full column rank—its columns are 
          linearly independent), we can multiply both sides by its inverse:
        </p>

        <pre className="code-block">{`Aᵀ·A·B = Aᵀ·C

(Aᵀ·A)⁻¹·Aᵀ·A·B = (Aᵀ·A)⁻¹·Aᵀ·C

I·B = (Aᵀ·A)⁻¹·Aᵀ·C

B = (Aᵀ·A)⁻¹·Aᵀ · C`}</pre>

        <h4>Step 5: The Pseudoinverse Revealed</h4>
        <p>
          Look at that formula: <strong>B = (AᵀA)⁻¹Aᵀ · C</strong>
        </p>
        <p>
          The part <code>(AᵀA)⁻¹Aᵀ</code> is exactly the <strong>Moore-Penrose pseudoinverse</strong> A⁺ 
          for a tall matrix! So:
        </p>

        <pre className="code-block">{`A⁺ = (Aᵀ·A)⁻¹·Aᵀ

B = A⁺ · C`}</pre>

        <div className="callout insight">
          <div className="callout-icon">💡</div>
          <div className="callout-content">
            <p>
              <strong>The Big Picture:</strong> The pseudoinverse isn't arbitrary or magical. 
              It's what you get when you ask calculus: "What value of B minimizes the squared error?" 
              The normal equations are just the condition that the derivative equals zero—the 
              standard way to find a minimum.
            </p>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Three Cases: The Journey to the Pseudoinverse" icon="🗺️" defaultOpen={false}>
        <pre className="code-block">{`Case 1 (Square, invertible matrix):
A · B = C   (exactly as many equations as unknowns)
✓ Unique solution: B = A^(-1) · C

Case 2 (Overdetermined, tall matrix):
| A₁ |       | C₁ |
| A₂ | · B = | C₂ |   (more equations than unknowns)
| A₃ |       | C₃ |
❌ Usually no exact solution → minimize error with least squares

Case 3 (Underdetermined, wide matrix):
[A₁ A₂ A₃] · B = [C₁ C₂ C₃]   (fewer equations than unknowns)
∞ Infinite solutions → find the "smallest" one`}</pre>
      </Collapsible>

      <h2>Key Takeaways</h2>
      <ul className="takeaways-list">
        <li>One input-output pair → infinitely many matrices</li>
        <li>n independent pairs → unique n×n matrix (if it exists)</li>
        <li>Two underdetermined systems → find closest overlap via least squares</li>
        <li>The pseudoinverse is not magical—it solves the normal equations</li>
        <li>Residual tells you how compatible the observations are</li>
        <li>It works for ANY matrix shape (tall, square, or wide)</li>
      </ul>

      <h2>Learn More</h2>
      <div className="link-cards">
        <LinkCard 
          href="https://www.3blue1brown.com/lessons/inverse-matrices"
          title="3Blue1Brown: Inverse Matrices"
          description="Visual intuition for matrix inversion"
        />
        <LinkCard 
          href="https://en.wikipedia.org/wiki/Moore-Penrose_inverse"
          title="Moore-Penrose Pseudoinverse"
          description="The key to underdetermined systems"
        />
        <LinkCard 
          href="https://en.wikipedia.org/wiki/Least_squares"
          title="Least Squares"
          description="Minimizing error when exact solutions do not exist"
        />
      </div>
    </Container>
  )
}
