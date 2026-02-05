import React, { useState, useMemo, useCallback, useRef } from "react";
import { Container } from "../components/SharedUI.jsx";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Text, Html } from "@react-three/drei";
import * as THREE from "three";

// ============================================================================
// LEAST SQUARES TUTORIAL
// Interactive exploration of fitting lines to data
// ============================================================================

// ============================================================================
// 3D COLUMN SPACE VISUALIZATION
// Interactive Three.js visualization showing projection geometry
// ============================================================================

// Arrow component for 3D vectors
function Arrow3D({ start = [0, 0, 0], end, color, lineWidth = 3 }) {
  const direction = new THREE.Vector3(
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2],
  );
  const length = direction.length();
  direction.normalize();

  const arrowLength = length * 0.15;
  const arrowRadius = 0.08;

  // Calculate arrow head position
  const headStart = [
    end[0] - direction.x * arrowLength,
    end[1] - direction.y * arrowLength,
    end[2] - direction.z * arrowLength,
  ];

  return (
    <group>
      {/* Line body */}
      <Line points={[start, headStart]} color={color} lineWidth={lineWidth} />
      {/* Arrow head cone */}
      <mesh position={end} rotation={[0, 0, 0]}>
        <coneGeometry args={[arrowRadius, arrowLength, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Rotate cone to point in direction */}
      <group position={end}>
        <mesh
          rotation={(() => {
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              direction,
            );
            const euler = new THREE.Euler().setFromQuaternion(quaternion);
            return [euler.x, euler.y, euler.z];
          })()}
          position={[
            (-direction.x * arrowLength) / 2,
            (-direction.y * arrowLength) / 2,
            (-direction.z * arrowLength) / 2,
          ]}
        >
          <coneGeometry args={[arrowRadius, arrowLength, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
}

// Vector label component
function VectorLabel({ position, text, color }) {
  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div
        style={{
          color: color,
          fontSize: "14px",
          fontWeight: "bold",
          textShadow: "0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </Html>
  );
}

// Column space plane component
function ColumnSpacePlane({ col1, col2, opacity = 0.3 }) {
  // Create a plane that spans the two column vectors
  // The plane extends in both positive and negative directions
  const scale = 2.5;

  const vertices = useMemo(() => {
    const v1 = new THREE.Vector3(...col1);
    const v2 = new THREE.Vector3(...col2);

    // Create a parallelogram with extra extension
    const points = [
      new THREE.Vector3(
        -v1.x * scale - v2.x * scale,
        -v1.y * scale - v2.y * scale,
        -v1.z * scale - v2.z * scale,
      ),
      new THREE.Vector3(
        v1.x * scale - v2.x * scale,
        v1.y * scale - v2.y * scale,
        v1.z * scale - v2.z * scale,
      ),
      new THREE.Vector3(
        v1.x * scale + v2.x * scale,
        v1.y * scale + v2.y * scale,
        v1.z * scale + v2.z * scale,
      ),
      new THREE.Vector3(
        -v1.x * scale + v2.x * scale,
        -v1.y * scale + v2.y * scale,
        -v1.z * scale + v2.z * scale,
      ),
    ];

    return new Float32Array([
      points[0].x,
      points[0].y,
      points[0].z,
      points[1].x,
      points[1].y,
      points[1].z,
      points[2].x,
      points[2].y,
      points[2].z,
      points[0].x,
      points[0].y,
      points[0].z,
      points[2].x,
      points[2].y,
      points[2].z,
      points[3].x,
      points[3].y,
      points[3].z,
    ]);
  }, [col1, col2, scale]);

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={6}
          array={vertices}
          itemSize={3}
        />
      </bufferGeometry>
      <meshStandardMaterial
        color="#6366f1"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Animated projection line
function ProjectionLine({ from, to, color, dashed = false }) {
  const points = useMemo(() => [from, to], [from, to]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={dashed ? 2 : 3}
      dashed={dashed}
      dashSize={0.15}
      dashScale={1}
      gapSize={0.1}
    />
  );
}

// Right angle indicator
function RightAngleIndicator({ origin, dir1, dir2, size = 0.3 }) {
  const points = useMemo(() => {
    const d1 = new THREE.Vector3(...dir1).normalize().multiplyScalar(size);
    const d2 = new THREE.Vector3(...dir2).normalize().multiplyScalar(size);
    const o = new THREE.Vector3(...origin);

    return [
      [o.x + d1.x, o.y + d1.y, o.z + d1.z],
      [o.x + d1.x + d2.x, o.y + d1.y + d2.y, o.z + d1.z + d2.z],
      [o.x + d2.x, o.y + d2.y, o.z + d2.z],
    ];
  }, [origin, dir1, dir2, size]);

  return <Line points={points} color="white" lineWidth={2} />;
}

// Main 3D scene component
function ColumnSpace3DScene({ step }) {
  const groupRef = useRef();

  // Slowly rotate when not interacting
  useFrame((state, delta) => {
    if (groupRef.current && step === 0) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  // Matrix A columns (from the least squares example)
  // Column 1: [1, 1, 1] - the ones vector
  // Column 2: [0, 1, 2] - the time vector
  const col1 = [1, 1, 1];
  const col2 = [0, 1, 2];

  // Target vector b = [1, 2, 4]
  const b = [1, 3, 0.5];

  // Calculate projection of b onto column space
  // Projection = A(A^T A)^(-1) A^T b
  // For our specific vectors, the projection is approximately:
  const projection = useMemo(() => {
    // Using the normal equations solution
    // A^T A = [[3, 3], [3, 5]]
    // A^T b = [7, 11]
    // x_hat = (A^T A)^(-1) A^T b = [1/3, 4/3]
    // projection = A * x_hat
    const x1 = 1 / 3;
    const x2 = 4 / 3;
    return [
      col1[0] * x1 + col2[0] * x2, // 1/3 + 0 = 1/3
      col1[1] * x1 + col2[1] * x2, // 1/3 + 4/3 = 5/3
      col1[2] * x1 + col2[2] * x2, // 1/3 + 8/3 = 3
    ];
  }, []);

  // Error vector (perpendicular to column space)
  const error = [
    b[0] - projection[0],
    b[1] - projection[1],
    b[2] - projection[2],
  ];

  // Direction vectors for right angle indicator
  const errorDir = error;
  const planeDir = [col1[0], col1[1], col1[2]]; // Use col1 as reference direction in plane

  const showColumnSpace = step >= 1;
  const showB = step >= 2;
  const showProjection = step >= 3;
  const showError = step >= 4;

  return (
    <group ref={groupRef}>
      {/* Origin sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#666" />
      </mesh>

      {/* Axis lines */}
      <Line
        points={[
          [-3, 0, 0],
          [3, 0, 0],
        ]}
        color="#444"
        lineWidth={1}
      />
      <Line
        points={[
          [0, -1, 0],
          [0, 4, 0],
        ]}
        color="#444"
        lineWidth={1}
      />
      <Line
        points={[
          [0, 0, -2],
          [0, 0, 3],
        ]}
        color="#444"
        lineWidth={1}
      />

      {/* Column space plane */}
      {showColumnSpace && (
        <ColumnSpacePlane col1={col1} col2={col2} opacity={0.25} />
      )}

      {/* Column vector 1 (ones vector) */}
      <Arrow3D start={[0, 0, 0]} end={col1} color="#22c55e" lineWidth={4} />
      <VectorLabel
        position={[col1[0] + 0.2, col1[1] + 0.2, col1[2] + 0.2]}
        text="a₁ [1,1,1]"
        color="#22c55e"
      />

      {/* Column vector 2 (time vector) */}
      <Arrow3D start={[0, 0, 0]} end={col2} color="#06b6d4" lineWidth={4} />
      <VectorLabel
        position={[col2[0] + 0.3, col2[1] + 0.1, col2[2] + 0.2]}
        text="a₂ [0,1,2]"
        color="#06b6d4"
      />

      {/* Target vector b */}
      {showB && (
        <>
          <Arrow3D start={[0, 0, 0]} end={b} color="#f59e0b" lineWidth={4} />
          <VectorLabel
            position={[b[0] + 0.3, b[1] + 0.2, b[2] + 0.2]}
            text="b [1,3,0.5]"
            color="#f59e0b"
          />
        </>
      )}

      {/* Projection point */}
      {showProjection && (
        <>
          <mesh position={projection}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#a855f7" />
          </mesh>
          <VectorLabel
            position={[projection[0] - 0.4, projection[1] - 0.3, projection[2]]}
            text="Ax̂ (projection)"
            color="#a855f7"
          />
          {/* Dashed line from origin to projection */}
          <ProjectionLine
            from={[0, 0, 0]}
            to={projection}
            color="#a855f7"
            dashed
          />
        </>
      )}

      {/* Error vector (perpendicular) */}
      {showError && (
        <>
          <Arrow3D start={projection} end={b} color="#ef4444" lineWidth={3} />
          <VectorLabel
            position={[
              (projection[0] + b[0]) / 2 - 0.5,
              (projection[1] + b[1]) / 2,
              (projection[2] + b[2]) / 2 + 0.3,
            ]}
            text="error ⊥ plane"
            color="#ef4444"
          />
          {/* Right angle indicator */}
          <RightAngleIndicator
            origin={projection}
            dir1={errorDir}
            dir2={planeDir}
            size={0.25}
          />
        </>
      )}

      {/* Column space label */}
      {showColumnSpace && (
        <Html position={[1.5, 0.5, 1.5]} center>
          <div
            style={{
              color: "#6366f1",
              fontSize: "12px",
              fontWeight: "bold",
              background: "rgba(0,0,0,0.7)",
              padding: "4px 8px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
            }}
          >
            Column Space (plane)
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// PROJECTION MATH EXPLAINER
// Step-by-step derivation of projecting onto a plane spanned by two vectors
// ============================================================================

function ProjectionMathExplainer() {
  const [expandedStep, setExpandedStep] = useState(null);

  const steps = [
    {
      title: "1. The Setup",
      summary: "We have a plane spanned by two vectors, and a point outside it",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            We have:
          </p>
          <ul style={{ color: "#e8e8e8", paddingLeft: "1.5rem", lineHeight: 1.8 }}>
            <li><strong style={{ color: "#22c55e" }}>a₁</strong> and <strong style={{ color: "#06b6d4" }}>a₂</strong> — two vectors that span a plane</li>
            <li><strong style={{ color: "#f59e0b" }}>b</strong> — a vector NOT in that plane</li>
          </ul>
          <p style={{ color: "#aaa", marginTop: "1rem" }}>
            <strong>Goal:</strong> Find the point on the plane closest to <strong style={{ color: "#f59e0b" }}>b</strong>.
          </p>
          <div style={{ background: "#252540", padding: "1rem", borderRadius: 8, marginTop: "1rem", fontFamily: "monospace" }}>
            <div style={{ color: "#888", marginBottom: "0.5rem" }}>The plane is all points of the form:</div>
            <div style={{ color: "#e8e8e8", fontSize: "1.1rem" }}>
              x₁·<span style={{ color: "#22c55e" }}>a₁</span> + x₂·<span style={{ color: "#06b6d4" }}>a₂</span> = A<span style={{ color: "#6366f1" }}>x</span>
            </div>
            <div style={{ color: "#888", marginTop: "0.5rem", fontSize: "0.85rem" }}>
              where A = [a₁ | a₂] is the matrix with a₁, a₂ as columns
            </div>
          </div>
        </>
      )
    },
    {
      title: "2. The Key Insight: Perpendicularity",
      summary: "The shortest distance to a plane is always perpendicular to it",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            Think about it: if you want to find the closest point on a floor to a hanging lightbulb, 
            you drop a <strong style={{ color: "#f59e0b" }}>plumb line</strong> straight down. 
            That's perpendicular to the floor!
          </p>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            The same principle applies here. If <strong style={{ color: "#a855f7" }}>Ax̂</strong> is 
            the closest point to <strong style={{ color: "#f59e0b" }}>b</strong>, then the error 
            vector <strong style={{ color: "#ef4444" }}>(b - Ax̂)</strong> must be perpendicular to the plane.
          </p>
          <div style={{ background: "#1e3a5f", padding: "1rem", borderRadius: 8, border: "1px solid #3b82f6" }}>
            <div style={{ color: "#60a5fa", fontWeight: 600, marginBottom: "0.5rem" }}>💡 Key Principle</div>
            <div style={{ color: "#e8e8e8" }}>
              <strong style={{ color: "#ef4444" }}>error</strong> ⊥ <strong style={{ color: "#6366f1" }}>plane</strong>
            </div>
            <div style={{ color: "#aaa", marginTop: "0.5rem", fontSize: "0.9rem" }}>
              The error vector is perpendicular to every vector in the column space.
            </div>
          </div>
        </>
      )
    },
    {
      title: "3. What Does Perpendicular Mean Mathematically?",
      summary: "Two vectors are perpendicular when their dot product is zero",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            Two vectors <strong>u</strong> and <strong>v</strong> are perpendicular (orthogonal) when:
          </p>
          <div style={{ background: "#252540", padding: "1rem", borderRadius: 8, fontFamily: "monospace", textAlign: "center", marginBottom: "1rem" }}>
            <span style={{ color: "#e8e8e8", fontSize: "1.2rem" }}>u · v = 0</span>
            <div style={{ color: "#888", marginTop: "0.5rem", fontSize: "0.85rem" }}>
              (the dot product equals zero)
            </div>
          </div>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            For the error <strong style={{ color: "#ef4444" }}>(b - Ax̂)</strong> to be perpendicular to 
            the <em>entire plane</em>, it must be perpendicular to <em>both</em> spanning vectors:
          </p>
          <div style={{ background: "#252540", padding: "1rem", borderRadius: 8, fontFamily: "monospace" }}>
            <div style={{ color: "#e8e8e8", marginBottom: "0.5rem" }}>
              <span style={{ color: "#22c55e" }}>a₁</span> · <span style={{ color: "#ef4444" }}>(b - Ax̂)</span> = 0
            </div>
            <div style={{ color: "#e8e8e8" }}>
              <span style={{ color: "#06b6d4" }}>a₂</span> · <span style={{ color: "#ef4444" }}>(b - Ax̂)</span> = 0
            </div>
          </div>
        </>
      )
    },
    {
      title: "4. Write It as a Matrix Equation",
      summary: "Combine both conditions into one elegant equation using Aᵀ",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            Those two dot product conditions can be written together as:
          </p>
          <div style={{ background: "#252540", padding: "1rem", borderRadius: 8, fontFamily: "monospace", textAlign: "center", marginBottom: "1rem" }}>
            <span style={{ color: "#e8e8e8", fontSize: "1.3rem" }}>
              A<sup>T</sup>(<span style={{ color: "#f59e0b" }}>b</span> - A<span style={{ color: "#a855f7" }}>x̂</span>) = <span style={{ color: "#888" }}>0</span>
            </span>
          </div>
          <p style={{ color: "#aaa", marginBottom: "1rem" }}>
            Why? Because A<sup>T</sup> has <span style={{ color: "#22c55e" }}>a₁</span> and <span style={{ color: "#06b6d4" }}>a₂</span> as <em>rows</em>. 
            Multiplying A<sup>T</sup> by a vector computes the dot product of each row with that vector!
          </p>
          <div style={{ background: "#1a2e1a", padding: "1rem", borderRadius: 8, border: "1px solid #22c55e" }}>
            <div style={{ color: "#22c55e", fontWeight: 600, marginBottom: "0.5rem" }}>✓ This is the "Normal Equation"!</div>
            <div style={{ color: "#e8e8e8", fontSize: "0.9rem" }}>
              "Normal" because the error is <em>normal</em> (perpendicular) to the column space.
            </div>
          </div>
        </>
      )
    },
    {
      title: "5. Solve for x̂",
      summary: "Rearrange to get the famous formula: x̂ = (AᵀA)⁻¹Aᵀb",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            Starting from the normal equation, let's solve for <span style={{ color: "#a855f7" }}>x̂</span>:
          </p>
          <div style={{ background: "#252540", padding: "1rem", borderRadius: 8, fontFamily: "monospace", lineHeight: 2.2 }}>
            <div style={{ color: "#888" }}>Start:</div>
            <div style={{ color: "#e8e8e8", marginLeft: "1rem" }}>
              A<sup>T</sup>(<span style={{ color: "#f59e0b" }}>b</span> - A<span style={{ color: "#a855f7" }}>x̂</span>) = 0
            </div>
            <div style={{ color: "#888", marginTop: "0.5rem" }}>Expand:</div>
            <div style={{ color: "#e8e8e8", marginLeft: "1rem" }}>
              A<sup>T</sup><span style={{ color: "#f59e0b" }}>b</span> - A<sup>T</sup>A<span style={{ color: "#a855f7" }}>x̂</span> = 0
            </div>
            <div style={{ color: "#888", marginTop: "0.5rem" }}>Rearrange:</div>
            <div style={{ color: "#e8e8e8", marginLeft: "1rem" }}>
              A<sup>T</sup>A<span style={{ color: "#a855f7" }}>x̂</span> = A<sup>T</sup><span style={{ color: "#f59e0b" }}>b</span>
            </div>
            <div style={{ color: "#888", marginTop: "0.5rem" }}>Solve (multiply both sides by (A<sup>T</sup>A)<sup>-1</sup>):</div>
            <div style={{ color: "#f59e0b", marginLeft: "1rem", fontSize: "1.2rem", marginTop: "0.5rem" }}>
              <span style={{ color: "#a855f7" }}>x̂</span> = (A<sup>T</sup>A)<sup>-1</sup>A<sup>T</sup><span style={{ color: "#f59e0b" }}>b</span>
            </div>
          </div>
        </>
      )
    },
    {
      title: "6. The Projection Formula",
      summary: "Plug x̂ back in to get the actual projected point",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            The projection of <span style={{ color: "#f59e0b" }}>b</span> onto the column space is:
          </p>
          <div style={{ background: "#252540", padding: "1.5rem", borderRadius: 8, fontFamily: "monospace", textAlign: "center", marginBottom: "1rem" }}>
            <div style={{ color: "#888", marginBottom: "0.5rem" }}>projection = A<span style={{ color: "#a855f7" }}>x̂</span> =</div>
            <div style={{ color: "#a855f7", fontSize: "1.3rem" }}>
              A(A<sup>T</sup>A)<sup>-1</sup>A<sup>T</sup><span style={{ color: "#f59e0b" }}>b</span>
            </div>
          </div>
          <p style={{ color: "#aaa", marginBottom: "1rem" }}>
            The matrix <span style={{ fontFamily: "monospace" }}>P = A(A<sup>T</sup>A)<sup>-1</sup>A<sup>T</sup></span> is 
            called the <strong style={{ color: "#6366f1" }}>projection matrix</strong>. It projects any vector onto the column space of A.
          </p>
          <div style={{ background: "#2e1a2e", padding: "1rem", borderRadius: 8, border: "1px solid #a855f7" }}>
            <div style={{ color: "#a855f7", fontWeight: 600, marginBottom: "0.5rem" }}>🎯 Fun Fact</div>
            <div style={{ color: "#e8e8e8", fontSize: "0.9rem" }}>
              If you project a vector twice (P·P·b), you get the same result as projecting once (P·b). 
              Once you're on the plane, projecting again doesn't move you!
            </div>
          </div>
        </>
      )
    },
    {
      title: "7. Concrete Example",
      summary: "Let's work through actual numbers",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            Using our vectors from the visualization:
          </p>
          <div style={{ background: "#252540", padding: "1rem", borderRadius: 8, fontFamily: "monospace", marginBottom: "1rem" }}>
            <div><span style={{ color: "#22c55e" }}>a₁</span> = [1, 1, 1]<sup>T</sup></div>
            <div><span style={{ color: "#06b6d4" }}>a₂</span> = [0, 1, 2]<sup>T</sup></div>
            <div><span style={{ color: "#f59e0b" }}>b</span> = [1, 3, 0.5]<sup>T</sup></div>
          </div>
          <p style={{ color: "#aaa", marginBottom: "0.5rem" }}>Step by step:</p>
          <div style={{ background: "#1a1a2e", padding: "1rem", borderRadius: 8, fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.8 }}>
            <div style={{ color: "#888" }}>1. Form A = [a₁ | a₂]:</div>
            <div style={{ color: "#e8e8e8", marginLeft: "1rem" }}>
              A = [[1,0], [1,1], [1,2]]
            </div>
            <div style={{ color: "#888", marginTop: "0.5rem" }}>2. Compute A<sup>T</sup>A:</div>
            <div style={{ color: "#e8e8e8", marginLeft: "1rem" }}>
              A<sup>T</sup>A = [[3, 3], [3, 5]]
            </div>
            <div style={{ color: "#888", marginTop: "0.5rem" }}>3. Compute A<sup>T</sup>b:</div>
            <div style={{ color: "#e8e8e8", marginLeft: "1rem" }}>
              A<sup>T</sup>b = [4.5, 4.5]
            </div>
            <div style={{ color: "#888", marginTop: "0.5rem" }}>4. Solve (A<sup>T</sup>A)x̂ = A<sup>T</sup>b:</div>
            <div style={{ color: "#a855f7", marginLeft: "1rem" }}>
              x̂ ≈ [0.75, 0.45]
            </div>
            <div style={{ color: "#888", marginTop: "0.5rem" }}>5. Projection = Ax̂:</div>
            <div style={{ color: "#a855f7", marginLeft: "1rem" }}>
              Ax̂ ≈ [0.75, 1.2, 1.65]
            </div>
          </div>
        </>
      )
    }
  ];

  return (
    <div style={{ 
      background: "#0f0f1a", 
      borderRadius: 8, 
      padding: "1rem", 
      marginTop: "1rem",
      border: "1px solid #2a2a4e"
    }}>
      <h4 style={{ color: "#6366f1", margin: "0 0 1rem 0", fontSize: "1rem" }}>
        📐 The Math: Projecting onto a Plane
      </h4>
      <p style={{ color: "#888", margin: "0 0 1rem 0", fontSize: "0.9rem" }}>
        Click each step to expand the explanation:
      </p>
      
      {steps.map((step, i) => (
        <div key={i} style={{ marginBottom: "0.5rem" }}>
          <button
            onClick={() => setExpandedStep(expandedStep === i ? null : i)}
            style={{
              width: "100%",
              textAlign: "left",
              background: expandedStep === i ? "#2a2a5e" : "#1a1a3e",
              border: "none",
              borderRadius: 6,
              padding: "0.75rem 1rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: "0.95rem" }}>
                {step.title}
              </span>
              <span style={{ color: "#888" }}>
                {expandedStep === i ? "▼" : "▶"}
              </span>
            </div>
            <div style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              {step.summary}
            </div>
          </button>
          
          {expandedStep === i && (
            <div style={{ 
              background: "#1a1a2e", 
              padding: "1rem", 
              borderRadius: "0 0 6px 6px",
              borderTop: "none",
              marginTop: "-4px"
            }}>
              {step.content}
            </div>
          )}
        </div>
      ))}
      
      <div style={{ 
        marginTop: "1rem", 
        padding: "1rem", 
        background: "#1e2a1e", 
        borderRadius: 8,
        border: "1px solid #22c55e"
      }}>
        <div style={{ color: "#22c55e", fontWeight: 600, marginBottom: "0.5rem" }}>
          🎓 Summary
        </div>
        <div style={{ color: "#e8e8e8", fontSize: "0.9rem", lineHeight: 1.6 }}>
          To project <strong style={{ color: "#f59e0b" }}>b</strong> onto a plane spanned by columns of <strong>A</strong>:
          <ol style={{ margin: "0.5rem 0 0 1.5rem", padding: 0 }}>
            <li>Require the error to be perpendicular: <span style={{ fontFamily: "monospace" }}>A<sup>T</sup>(b - Ax̂) = 0</span></li>
            <li>Solve for x̂: <span style={{ fontFamily: "monospace" }}>x̂ = (A<sup>T</sup>A)<sup>-1</sup>A<sup>T</sup>b</span></li>
            <li>Projection = <span style={{ fontFamily: "monospace" }}>Ax̂</span></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Full 3D visualization component with controls
function ColumnSpace3D() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Column Vectors of A",
      description:
        "Matrix A has two column vectors: a₁ = [1,1,1] (the ones vector) and a₂ = [0,1,2] (representing time). These are the building blocks of our linear combinations.",
    },
    {
      title: "The Column Space (a Plane)",
      description:
        "Any combination x₁·a₁ + x₂·a₂ lands somewhere on this plane. This is the column space of A — all possible outputs of Ax.",
    },
    {
      title: "Target Vector b",
      description:
        "Our target b = [1,3,0.5] is where we want to get. But notice: b floats ABOVE the plane! It's not in the column space.",
    },
    {
      title: "The Projection",
      description:
        "Since we can't reach b exactly, we find the closest point ON the plane. This projection Ax̂ is our best approximation. See below for the step-by-step math of how to compute this projection.",
    },
    {
      title: "The Perpendicular Error",
      description:
        "The error (b - Ax̂) is perpendicular to the plane. This is the shortest possible distance — that's why it minimizes squared error!",
    },
  ];

  return (
    <div
      style={{
        background: "#0f0f1a",
        borderRadius: 12,
        padding: "1rem",
        marginTop: "1rem",
      }}
    >
      {/* Step navigation */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              border: "none",
              background: step === i ? "#6366f1" : "#2a2a4e",
              color: step === i ? "#fff" : "#888",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: step === i ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current step info */}
      <h3
        style={{
          color: "#f59e0b",
          margin: "0 0 0.5rem 0",
          fontSize: "1.1rem",
        }}
      >
        {steps[step].title}
      </h3>
      <p
        style={{
          color: "#aaa",
          margin: "0 0 1rem 0",
          fontSize: "0.95rem",
          lineHeight: 1.5,
        }}
      >
        {steps[step].description}
      </p>

      {/* 3D Canvas */}
      <div
        style={{
          height: 400,
          background: "#0a0a12",
          borderRadius: 8,
          position: "relative",
        }}
      >
        <Canvas
          camera={{ position: [4, 3, 5], fov: 50 }}
          style={{ borderRadius: 8 }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <ColumnSpace3DScene step={step} />

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={15}
          />
        </Canvas>

        {/* Drag hint */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#555",
            fontSize: "12px",
            pointerEvents: "none",
          }}
        >
          🖱️ Drag to rotate • Scroll to zoom
        </div>
      </div>

      {/* Navigation buttons */}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 6,
            border: "none",
            background: step === 0 ? "#2a2a4e" : "#3a3a6e",
            color: step === 0 ? "#555" : "#fff",
            cursor: step === 0 ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
          }}
        >
          ← Previous
        </button>
        <button
          onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
          disabled={step === steps.length - 1}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 6,
            border: "none",
            background: step === steps.length - 1 ? "#2a2a4e" : "#6366f1",
            color: step === steps.length - 1 ? "#555" : "#fff",
            cursor: step === steps.length - 1 ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          Next →
        </button>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginTop: "1rem",
          flexWrap: "wrap",
          fontSize: "0.85rem",
        }}
      >
        <span style={{ color: "#22c55e" }}>● a₁ (ones)</span>
        <span style={{ color: "#06b6d4" }}>● a₂ (time)</span>
        <span style={{ color: "#6366f1" }}>■ Column space</span>
        {step >= 2 && <span style={{ color: "#f59e0b" }}>● b (target)</span>}
        {step >= 3 && (
          <span style={{ color: "#a855f7" }}>● Ax̂ (projection)</span>
        )}
        {step >= 4 && <span style={{ color: "#ef4444" }}>● Error (⊥)</span>}
      </div>

      {/* Projection Math Explainer - shows when on step 3 or later */}
      {step >= 3 && <ProjectionMathExplainer />}
    </div>
  );
}

// ============================================================================
// PROJECTION EXPLAINER - Step-by-step visual explanation of Ax = b
// ============================================================================

function ProjectionExplainer() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Meet Matrix A",
      highlight: "matrix",
    },
    {
      title: "A as Column Vectors",
      highlight: "columns",
    },
    {
      title: "The Column Space",
      highlight: "columnspace",
    },
    {
      title: "Meet Vector b",
      highlight: "b",
    },
    {
      title: "The Problem: b isn't in the column space",
      highlight: "problem",
    },
    {
      title: "The Solution: Project b",
      highlight: "projection",
    },
    {
      title: "The Perpendicular Error",
      highlight: "perpendicular",
    },
  ];

  // SVG dimensions
  const width = 500;
  const height = 380;
  const cx = 250;
  const cy = 220;

  // Column vectors (2D for visualization)
  const col1 = { x: 120, y: -40 }; // First column of A
  const col2 = { x: 40, y: -100 }; // Second column of A
  const b = { x: 100, y: -180 }; // Target vector (not in column space)

  // Projection of b onto column space (simplified)
  const proj = { x: 110, y: -80 };

  // Error vector
  const error = { x: b.x - proj.x, y: b.y - proj.y };

  const showMatrix = step >= 0;
  const showColumns = step >= 1;
  const showColumnSpace = step >= 2;
  const showB = step >= 3;
  const showProblem = step >= 4;
  const showProjection = step >= 5;
  const showPerpendicular = step >= 6;

  return (
    <div
      style={{
        background: "#1a1a2e",
        borderRadius: 12,
        padding: "1.5rem",
        marginTop: "1rem",
      }}
    >
      {/* Step navigation */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              border: "none",
              background: step === i ? "#6366f1" : "#2a2a4e",
              color: step === i ? "#fff" : "#888",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: step === i ? 600 : 400,
              transition: "all 0.2s",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current step title */}
      <h3
        style={{
          color: "#f59e0b",
          margin: "0 0 1rem 0",
          fontSize: "1.2rem",
        }}
      >
        Step {step + 1}: {steps[step].title}
      </h3>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* Left side: The visual */}
        <svg
          width={width}
          height={height}
          style={{ background: "#0f0f1a", borderRadius: 8 }}
        >
          {/* Origin crosshairs */}
          <line
            x1={cx - 200}
            y1={cy}
            x2={cx + 200}
            y2={cy}
            stroke="#333"
            strokeWidth={1}
          />
          <line
            x1={cx}
            y1={cy - 180}
            x2={cx}
            y2={cy + 140}
            stroke="#333"
            strokeWidth={1}
          />
          <text x={cx + 8} y={cy + 18} fill="#555" fontSize={12}>
            origin
          </text>

          {/* Column space shaded region (show as parallelogram/plane) */}
          {showColumnSpace && (
            <g>
              {/* Shaded parallelogram representing the column space */}
              <polygon
                points={`${cx},${cy} ${cx + col1.x},${cy + col1.y} ${cx + col1.x + col2.x},${cy + col1.y + col2.y} ${cx + col2.x},${cy + col2.y}`}
                fill="rgba(99, 102, 241, 0.15)"
                stroke="#6366f1"
                strokeWidth={1}
                strokeDasharray="4,2"
              />
              {/* Extended plane hint */}
              <polygon
                points={`${cx},${cy} ${cx - col1.x * 0.5},${cy - col1.y * 0.5} ${cx - col1.x * 0.5 + col2.x},${cy - col1.y * 0.5 + col2.y} ${cx + col2.x},${cy + col2.y}`}
                fill="rgba(99, 102, 241, 0.08)"
              />
              <text
                x={cx + 80}
                y={cy - 30}
                fill="#6366f1"
                fontSize={13}
                fontWeight={600}
              >
                Column Space of A
              </text>
              <text x={cx + 80} y={cy - 12} fill="#888" fontSize={11}>
                (all possible Ax combinations)
              </text>
            </g>
          )}

          {/* Column vector 1 */}
          {showColumns && (
            <g>
              <defs>
                <marker
                  id="arrowGreen"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#22c55e" />
                </marker>
              </defs>
              <line
                x1={cx}
                y1={cy}
                x2={cx + col1.x}
                y2={cy + col1.y}
                stroke="#22c55e"
                strokeWidth={3}
                markerEnd="url(#arrowGreen)"
              />
              <text
                x={cx + col1.x + 10}
                y={cy + col1.y}
                fill="#22c55e"
                fontSize={14}
                fontWeight={600}
              >
                a₁
              </text>
              <text
                x={cx + col1.x + 10}
                y={cy + col1.y + 16}
                fill="#22c55e"
                fontSize={11}
              >
                (column 1)
              </text>
            </g>
          )}

          {/* Column vector 2 */}
          {showColumns && (
            <g>
              <defs>
                <marker
                  id="arrowCyan"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#06b6d4" />
                </marker>
              </defs>
              <line
                x1={cx}
                y1={cy}
                x2={cx + col2.x}
                y2={cy + col2.y}
                stroke="#06b6d4"
                strokeWidth={3}
                markerEnd="url(#arrowCyan)"
              />
              <text
                x={cx + col2.x - 25}
                y={cy + col2.y - 8}
                fill="#06b6d4"
                fontSize={14}
                fontWeight={600}
              >
                a₂
              </text>
              <text
                x={cx + col2.x - 35}
                y={cy + col2.y + 8}
                fill="#06b6d4"
                fontSize={11}
              >
                (column 2)
              </text>
            </g>
          )}

          {/* Vector b */}
          {showB && (
            <g>
              <defs>
                <marker
                  id="arrowYellow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#f59e0b" />
                </marker>
              </defs>
              <line
                x1={cx}
                y1={cy}
                x2={cx + b.x}
                y2={cy + b.y}
                stroke="#f59e0b"
                strokeWidth={3}
                markerEnd="url(#arrowYellow)"
              />
              <text
                x={cx + b.x + 10}
                y={cy + b.y + 5}
                fill="#f59e0b"
                fontSize={16}
                fontWeight={700}
              >
                b
              </text>
              <text
                x={cx + b.x + 10}
                y={cy + b.y + 22}
                fill="#f59e0b"
                fontSize={11}
              >
                (target)
              </text>
            </g>
          )}

          {/* Problem annotation */}
          {showProblem && !showProjection && (
            <g>
              <text
                x={cx + b.x - 60}
                y={cy + b.y - 30}
                fill="#ef4444"
                fontSize={12}
                fontWeight={600}
              >
                b is NOT in the
              </text>
              <text
                x={cx + b.x - 60}
                y={cy + b.y - 15}
                fill="#ef4444"
                fontSize={12}
                fontWeight={600}
              >
                column space!
              </text>
              <text
                x={cx + b.x - 60}
                y={cy + b.y + 0}
                fill="#888"
                fontSize={11}
              >
                No x makes Ax = b exactly
              </text>
            </g>
          )}

          {/* Projection */}
          {showProjection && (
            <g>
              {/* Projected point on column space */}
              <circle cx={cx + proj.x} cy={cy + proj.y} r={6} fill="#a855f7" />
              <text
                x={cx + proj.x + 12}
                y={cy + proj.y + 5}
                fill="#a855f7"
                fontSize={14}
                fontWeight={600}
              >
                Ax̂
              </text>
              <text
                x={cx + proj.x + 12}
                y={cy + proj.y + 20}
                fill="#a855f7"
                fontSize={11}
              >
                (projection of b)
              </text>

              {/* Dashed line from b to projection */}
              <line
                x1={cx + b.x}
                y1={cy + b.y}
                x2={cx + proj.x}
                y2={cy + proj.y}
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="6,3"
              />
            </g>
          )}

          {/* Perpendicular indicator */}
          {showPerpendicular && (
            <g>
              {/* Error vector */}
              <defs>
                <marker
                  id="arrowRed"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
                </marker>
              </defs>
              <line
                x1={cx + proj.x}
                y1={cy + proj.y}
                x2={cx + b.x}
                y2={cy + b.y}
                stroke="#ef4444"
                strokeWidth={3}
                markerEnd="url(#arrowRed)"
              />
              <text
                x={cx + proj.x + error.x / 2 - 40}
                y={cy + proj.y + error.y / 2}
                fill="#ef4444"
                fontSize={13}
                fontWeight={600}
              >
                error (b - Ax̂)
              </text>

              {/* Right angle indicator */}
              <path
                d={`M ${cx + proj.x + 12} ${cy + proj.y} L ${cx + proj.x + 12} ${cy + proj.y - 12} L ${cx + proj.x} ${cy + proj.y - 12}`}
                stroke="#fff"
                strokeWidth={2}
                fill="none"
              />
              <text
                x={cx + proj.x + 25}
                y={cy + proj.y - 20}
                fill="#fff"
                fontSize={11}
                fontWeight={600}
              >
                90°
              </text>
              <text
                x={cx + proj.x + 22}
                y={cy + proj.y - 5}
                fill="#888"
                fontSize={10}
              >
                perpendicular!
              </text>
            </g>
          )}
        </svg>

        {/* Right side: Explanation text */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {step === 0 && (
            <div>
              <p
                style={{
                  color: "#e8e8e8",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.6,
                }}
              >
                Let's start with a simple{" "}
                <strong style={{ color: "#6366f1" }}>matrix A</strong>:
              </p>
              <div
                style={{
                  background: "#252540",
                  padding: "1rem",
                  borderRadius: 8,
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "1.1rem",
                  color: "#e8e8e8",
                  textAlign: "center",
                  marginBottom: "1rem",
                }}
              >
                A = [<span style={{ color: "#22c55e" }}>2, 1</span>]<br />
                &nbsp;&nbsp;&nbsp;&nbsp;[
                <span style={{ color: "#22c55e" }}>1, 2</span>]<br />
                &nbsp;&nbsp;&nbsp;&nbsp;[
                <span style={{ color: "#22c55e" }}>1, 1</span>]
              </div>
              <p style={{ color: "#aaa", margin: 0, fontSize: "0.95rem" }}>
                This is a 3×2 matrix. It has <strong>3 rows</strong> and{" "}
                <strong>2 columns</strong>. We'll use a simpler 2D version for
                visualization.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <p
                style={{
                  color: "#e8e8e8",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.6,
                }}
              >
                Every matrix is really a{" "}
                <strong style={{ color: "#f59e0b" }}>
                  collection of column vectors
                </strong>
                :
              </p>
              <div
                style={{
                  background: "#252540",
                  padding: "1rem",
                  borderRadius: 8,
                  fontFamily: "ui-monospace, monospace",
                  color: "#e8e8e8",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  A = [<span style={{ color: "#22c55e" }}>a₁</span> |{" "}
                  <span style={{ color: "#06b6d4" }}>a₂</span>]
                </div>
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.9rem",
                    color: "#888",
                  }}
                >
                  where:
                </div>
                <div style={{ color: "#22c55e" }}>
                  a₁ = [2, 1, 1]ᵀ &nbsp;← first column
                </div>
                <div style={{ color: "#06b6d4" }}>
                  a₂ = [1, 2, 1]ᵀ &nbsp;← second column
                </div>
              </div>
              <p style={{ color: "#aaa", margin: 0, fontSize: "0.95rem" }}>
                Each column is a <strong>vector</strong> — an arrow pointing
                somewhere in space.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <p
                style={{
                  color: "#e8e8e8",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.6,
                }}
              >
                The <strong style={{ color: "#6366f1" }}>column space</strong>{" "}
                is all the places you can reach by combining these vectors:
              </p>
              <div
                style={{
                  background: "#252540",
                  padding: "1rem",
                  borderRadius: 8,
                  fontFamily: "ui-monospace, monospace",
                  color: "#e8e8e8",
                  marginBottom: "1rem",
                }}
              >
                Ax = x₁·<span style={{ color: "#22c55e" }}>a₁</span> + x₂·
                <span style={{ color: "#06b6d4" }}>a₂</span>
              </div>
              <p
                style={{
                  color: "#aaa",
                  margin: "0 0 0.75rem 0",
                  fontSize: "0.95rem",
                }}
              >
                Any vector <strong>Ax</strong> is just scaling{" "}
                <span style={{ color: "#22c55e" }}>a₁</span> and{" "}
                <span style={{ color: "#06b6d4" }}>a₂</span> and adding them up.
              </p>
              <p style={{ color: "#aaa", margin: 0, fontSize: "0.95rem" }}>
                The shaded region shows all possible combinations — that's A's
                "column space".
              </p>
            </div>
          )}

          {step === 3 && (
            <div>
              <p
                style={{
                  color: "#e8e8e8",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.6,
                }}
              >
                Now we have a{" "}
                <strong style={{ color: "#f59e0b" }}>target vector b</strong> —
                the thing we want to hit:
              </p>
              <div
                style={{
                  background: "#252540",
                  padding: "1rem",
                  borderRadius: 8,
                  fontFamily: "ui-monospace, monospace",
                  color: "#e8e8e8",
                  marginBottom: "1rem",
                }}
              >
                <span style={{ color: "#f59e0b" }}>b</span> = [1, 5, 3]ᵀ
              </div>
              <p
                style={{
                  color: "#aaa",
                  margin: "0 0 0.75rem 0",
                  fontSize: "0.95rem",
                }}
              >
                <strong>The question:</strong> Can we find an <strong>x</strong>{" "}
                such that <strong>Ax = b</strong>?
              </p>
              <p style={{ color: "#aaa", margin: 0, fontSize: "0.95rem" }}>
                In other words: can we combine{" "}
                <span style={{ color: "#22c55e" }}>a₁</span> and{" "}
                <span style={{ color: "#06b6d4" }}>a₂</span> to land exactly on{" "}
                <span style={{ color: "#f59e0b" }}>b</span>?
              </p>
            </div>
          )}

          {step === 4 && (
            <div>
              <p
                style={{
                  color: "#ef4444",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.6,
                  fontWeight: 600,
                }}
              >
                Problem: b is NOT in the column space!
              </p>
              <p
                style={{
                  color: "#aaa",
                  margin: "0 0 1rem 0",
                  fontSize: "0.95rem",
                }}
              >
                No matter how we scale and add{" "}
                <span style={{ color: "#22c55e" }}>a₁</span> and{" "}
                <span style={{ color: "#06b6d4" }}>a₂</span>, we can never reach{" "}
                <span style={{ color: "#f59e0b" }}>b</span> exactly.
              </p>
              <p
                style={{
                  color: "#e8e8e8",
                  margin: "0 0 0.75rem 0",
                  fontSize: "0.95rem",
                }}
              >
                <strong>Why does this happen?</strong>
              </p>
              <p style={{ color: "#aaa", margin: 0, fontSize: "0.95rem" }}>
                We have more equations than unknowns (3 equations, 2 unknowns).
                The data is <em>overdetermined</em> — there's no perfect
                solution.
              </p>
            </div>
          )}

          {step === 5 && (
            <div>
              <p
                style={{
                  color: "#e8e8e8",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: "#a855f7" }}>
                  The least squares solution:
                </strong>{" "}
                Find the <em>closest</em> point!
              </p>
              <p
                style={{
                  color: "#aaa",
                  margin: "0 0 1rem 0",
                  fontSize: "0.95rem",
                }}
              >
                We <strong>project</strong>{" "}
                <span style={{ color: "#f59e0b" }}>b</span> onto the column
                space. The projection{" "}
                <span style={{ color: "#a855f7" }}>Ax̂</span> is the closest we
                can get.
              </p>
              <p
                style={{
                  color: "#aaa",
                  margin: "0 0 0.75rem 0",
                  fontSize: "0.95rem",
                }}
              >
                Think of it like dropping a <strong>plumb line</strong> from{" "}
                <span style={{ color: "#f59e0b" }}>b</span> straight down to the
                column space.
              </p>
              <p style={{ color: "#e8e8e8", margin: 0, fontSize: "0.95rem" }}>
                x̂ ("x-hat") is the <strong>least squares solution</strong>.
              </p>
            </div>
          )}

          {step === 6 && (
            <div>
              <p
                style={{
                  color: "#e8e8e8",
                  margin: "0 0 1rem 0",
                  lineHeight: 1.6,
                }}
              >
                <strong>This is why they're called "normal" equations!</strong>
              </p>
              <p
                style={{
                  color: "#aaa",
                  margin: "0 0 1rem 0",
                  fontSize: "0.95rem",
                }}
              >
                The error vector{" "}
                <span style={{ color: "#ef4444" }}>(b - Ax̂)</span> is{" "}
                <strong>perpendicular</strong> to the column space.
              </p>
              <p
                style={{
                  color: "#aaa",
                  margin: "0 0 1rem 0",
                  fontSize: "0.95rem",
                }}
              >
                "Normal" = perpendicular. The shortest path is always at 90°.
              </p>
              <div
                style={{
                  background: "#252540",
                  padding: "1rem",
                  borderRadius: 8,
                  fontFamily: "ui-monospace, monospace",
                  color: "#e8e8e8",
                  textAlign: "center",
                }}
              >
                Aᵀ(<span style={{ color: "#f59e0b" }}>b</span> - A
                <span style={{ color: "#a855f7" }}>x̂</span>) = 0
              </div>
              <p
                style={{
                  color: "#888",
                  margin: "0.75rem 0 0 0",
                  fontSize: "0.85rem",
                }}
              >
                This says: error is perpendicular to all columns of A.
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 6,
                border: "none",
                background: step === 0 ? "#2a2a4e" : "#3a3a6e",
                color: step === 0 ? "#555" : "#fff",
                cursor: step === 0 ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
              }}
            >
              ← Previous
            </button>
            <button
              onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
              disabled={step === steps.length - 1}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 6,
                border: "none",
                background: step === steps.length - 1 ? "#2a2a4e" : "#6366f1",
                color: step === steps.length - 1 ? "#555" : "#fff",
                cursor: step === steps.length - 1 ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate the least squares line: y = mx + b
 * Given points, find m and b that minimize sum of squared residuals
 */
function leastSquaresLine(points) {
  const n = points.length;
  if (n < 2) return { m: 0, b: 0 };

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-10) return { m: 0, b: sumY / n };

  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;

  return { m, b };
}

/**
 * Calculate residuals (errors) for each point
 */
function calculateResiduals(points, m, b) {
  return points.map((p) => ({
    ...p,
    predicted: m * p.x + b,
    residual: p.y - (m * p.x + b),
  }));
}

/**
 * Sum of squared residuals (the thing we're minimizing)
 */
function sumSquaredResiduals(points, m, b) {
  return points.reduce((sum, p) => {
    const residual = p.y - (m * p.x + b);
    return sum + residual * residual;
  }, 0);
}

// ============================================================================
// INTERACTIVE SCATTER PLOT
// ============================================================================

function ScatterPlot({
  points,
  setPoints,
  showLine,
  showResiduals,
  manualLine,
  width = 500,
  height = 400,
}) {
  const padding = 50;
  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;

  // Calculate bounds
  const bounds = useMemo(() => {
    if (points.length === 0) return { minX: 0, maxX: 10, minY: 0, maxY: 10 };
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minY = Math.min(...ys) - 1;
    const maxY = Math.max(...ys) + 1;
    return { minX, maxX, minY, maxY };
  }, [points]);

  // Transform data coordinates to SVG coordinates
  const toSvg = useCallback(
    (x, y) => ({
      x:
        padding + ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * plotWidth,
      y:
        height -
        padding -
        ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * plotHeight,
    }),
    [bounds, plotWidth, plotHeight, height],
  );

  // Transform SVG coordinates to data coordinates
  const toData = useCallback(
    (svgX, svgY) => ({
      x:
        bounds.minX +
        ((svgX - padding) / plotWidth) * (bounds.maxX - bounds.minX),
      y:
        bounds.minY +
        ((height - padding - svgY) / plotHeight) * (bounds.maxY - bounds.minY),
    }),
    [bounds, plotWidth, plotHeight, height],
  );

  // Best fit line
  const bestFit = useMemo(() => leastSquaresLine(points), [points]);
  const line = manualLine || bestFit;

  // Click to add points
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = e.clientX - rect.left;
    const svgY = e.clientY - rect.top;
    const { x, y } = toData(svgX, svgY);
    if (
      x >= bounds.minX &&
      x <= bounds.maxX &&
      y >= bounds.minY &&
      y <= bounds.maxY
    ) {
      setPoints([
        ...points,
        { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 },
      ]);
    }
  };

  // Line endpoints
  const lineStart = toSvg(bounds.minX, line.m * bounds.minX + line.b);
  const lineEnd = toSvg(bounds.maxX, line.m * bounds.maxX + line.b);

  return (
    <svg
      width={width}
      height={height}
      onClick={handleClick}
      style={{ cursor: "crosshair", background: "#1a1a2e", borderRadius: 8 }}
    >
      {/* Grid lines */}
      {Array.from({ length: 11 }, (_, i) => {
        const x = bounds.minX + (i / 10) * (bounds.maxX - bounds.minX);
        const svgX = toSvg(x, 0).x;
        return (
          <line
            key={`vgrid-${i}`}
            x1={svgX}
            y1={padding}
            x2={svgX}
            y2={height - padding}
            stroke="#333"
            strokeWidth={0.5}
          />
        );
      })}
      {Array.from({ length: 11 }, (_, i) => {
        const y = bounds.minY + (i / 10) * (bounds.maxY - bounds.minY);
        const svgY = toSvg(0, y).y;
        return (
          <line
            key={`hgrid-${i}`}
            x1={padding}
            y1={svgY}
            x2={width - padding}
            y2={svgY}
            stroke="#333"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Axes */}
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#666"
        strokeWidth={2}
      />
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="#666"
        strokeWidth={2}
      />

      {/* Axis labels */}
      <text
        x={width / 2}
        y={height - 10}
        fill="#888"
        textAnchor="middle"
        fontSize={14}
      >
        x
      </text>
      <text
        x={15}
        y={height / 2}
        fill="#888"
        textAnchor="middle"
        fontSize={14}
        transform={`rotate(-90, 15, ${height / 2})`}
      >
        y
      </text>

      {/* Residual lines (vertical lines from point to fitted line) */}
      {showResiduals &&
        points.map((p, i) => {
          const ptSvg = toSvg(p.x, p.y);
          const predY = line.m * p.x + line.b;
          const predSvg = toSvg(p.x, predY);
          const residual = p.y - predY;
          return (
            <g key={`residual-${i}`}>
              <line
                x1={ptSvg.x}
                y1={ptSvg.y}
                x2={predSvg.x}
                y2={predSvg.y}
                stroke={residual > 0 ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                strokeDasharray="4,2"
              />
              {/* Squared residual box */}
              <rect
                x={Math.min(
                  ptSvg.x,
                  ptSvg.x +
                    Math.abs(ptSvg.y - predSvg.y) * (residual > 0 ? 1 : -1),
                )}
                y={Math.min(ptSvg.y, predSvg.y)}
                width={Math.abs(ptSvg.y - predSvg.y)}
                height={Math.abs(ptSvg.y - predSvg.y)}
                fill={
                  residual > 0
                    ? "rgba(34, 197, 94, 0.1)"
                    : "rgba(239, 68, 68, 0.1)"
                }
                stroke={residual > 0 ? "#22c55e" : "#ef4444"}
                strokeWidth={0.5}
              />
            </g>
          );
        })}

      {/* Fitted line */}
      {showLine && (
        <line
          x1={lineStart.x}
          y1={lineStart.y}
          x2={lineEnd.x}
          y2={lineEnd.y}
          stroke="#f59e0b"
          strokeWidth={3}
        />
      )}

      {/* Data points */}
      {points.map((p, i) => {
        const svg = toSvg(p.x, p.y);
        return (
          <circle
            key={i}
            cx={svg.x}
            cy={svg.y}
            r={8}
            fill="#6366f1"
            stroke="#fff"
            strokeWidth={2}
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setPoints(points.filter((_, j) => j !== i));
            }}
          />
        );
      })}

      {/* Instructions */}
      <text x={width / 2} y={30} fill="#666" textAnchor="middle" fontSize={12}>
        Click to add points • Click points to remove
      </text>
    </svg>
  );
}

// ============================================================================
// EQUATION DISPLAY
// ============================================================================

function EquationDisplay({ m, b, ssr }) {
  const formatNum = (n) => {
    if (Math.abs(n) < 0.01) return "0";
    return n.toFixed(2);
  };

  return (
    <div
      style={{
        background: "#252525",
        padding: "1rem 1.5rem",
        borderRadius: 8,
        fontFamily: "ui-monospace, monospace",
        fontSize: "1.1rem",
      }}
    >
      <div style={{ color: "#f59e0b", marginBottom: "0.5rem" }}>
        <strong>Best Fit Line:</strong>
      </div>
      <div
        style={{ color: "#e8e8e8", fontSize: "1.3rem", marginBottom: "1rem" }}
      >
        y = <span style={{ color: "#6366f1" }}>{formatNum(m)}</span>x{" "}
        {b >= 0 ? "+" : "−"}{" "}
        <span style={{ color: "#6366f1" }}>{formatNum(Math.abs(b))}</span>
      </div>
      <div style={{ color: "#888", fontSize: "0.9rem" }}>
        <strong>Sum of Squared Residuals:</strong>{" "}
        <span style={{ color: "#ef4444" }}>{formatNum(ssr)}</span>
      </div>
    </div>
  );
}

// ============================================================================
// MANUAL LINE CONTROLS
// ============================================================================

function ManualControls({ m, b, setM, setB, bestM, bestB }) {
  return (
    <div style={{ background: "#252525", padding: "1rem", borderRadius: 8 }}>
      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{ display: "block", color: "#888", marginBottom: "0.25rem" }}
        >
          Slope (m): {m.toFixed(2)}
        </label>
        <input
          type="range"
          min={-3}
          max={3}
          step={0.1}
          value={m}
          onChange={(e) => setM(parseFloat(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{ display: "block", color: "#888", marginBottom: "0.25rem" }}
        >
          Intercept (b): {b.toFixed(2)}
        </label>
        <input
          type="range"
          min={-5}
          max={10}
          step={0.1}
          value={b}
          onChange={(e) => setB(parseFloat(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
      <button
        onClick={() => {
          setM(bestM);
          setB(bestB);
        }}
        style={{
          background: "#f59e0b",
          color: "#000",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: 4,
          cursor: "pointer",
          width: "100%",
          fontWeight: "bold",
        }}
      >
        Snap to Best Fit
      </button>
    </div>
  );
}

// ============================================================================
// SLOPE FORMULA WALKTHROUGH
// Step-by-step demonstration with actual numbers
// ============================================================================

function SlopeFormulaWalkthrough({ points }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Calculate all the intermediate values
  const n = points.length;
  const xMean = points.reduce((sum, p) => sum + p.x, 0) / n;
  const yMean = points.reduce((sum, p) => sum + p.y, 0) / n;
  
  const deviations = points.map(p => ({
    x: p.x,
    y: p.y,
    xDev: p.x - xMean,
    yDev: p.y - yMean,
    product: (p.x - xMean) * (p.y - yMean),
    xDevSquared: (p.x - xMean) ** 2
  }));
  
  const sumProducts = deviations.reduce((sum, d) => sum + d.product, 0);
  const sumXDevSquared = deviations.reduce((sum, d) => sum + d.xDevSquared, 0);
  const slope = sumProducts / sumXDevSquared;
  const intercept = yMean - slope * xMean;
  
  const formatNum = (n) => n.toFixed(2);
  
  const steps = [
    {
      title: "Step 1: Find the Means",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            First, calculate the average (mean) of all x values and all y values:
          </p>
          <div style={{ background: "#1a1a3e", padding: "1rem", borderRadius: 8, marginBottom: "1rem" }}>
            <div style={{ color: "#888", marginBottom: "0.5rem" }}>x values: {points.map(p => p.x).join(", ")}</div>
            <div style={{ color: "#22c55e", fontSize: "1.1rem" }}>
              x̄ = ({points.map(p => p.x).join(" + ")}) / {n} = <strong>{formatNum(xMean)}</strong>
            </div>
          </div>
          <div style={{ background: "#1a1a3e", padding: "1rem", borderRadius: 8 }}>
            <div style={{ color: "#888", marginBottom: "0.5rem" }}>y values: {points.map(p => formatNum(p.y)).join(", ")}</div>
            <div style={{ color: "#06b6d4", fontSize: "1.1rem" }}>
              ȳ = ({points.map(p => formatNum(p.y)).join(" + ")}) / {n} = <strong>{formatNum(yMean)}</strong>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Step 2: Calculate Deviations from Mean",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            For each point, find how far it is from the mean:
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #444" }}>
                  <th style={{ padding: "0.5rem", color: "#888", textAlign: "left" }}>Point</th>
                  <th style={{ padding: "0.5rem", color: "#888", textAlign: "right" }}>xᵢ</th>
                  <th style={{ padding: "0.5rem", color: "#888", textAlign: "right" }}>yᵢ</th>
                  <th style={{ padding: "0.5rem", color: "#22c55e", textAlign: "right" }}>xᵢ - x̄</th>
                  <th style={{ padding: "0.5rem", color: "#06b6d4", textAlign: "right" }}>yᵢ - ȳ</th>
                </tr>
              </thead>
              <tbody>
                {deviations.map((d, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #333" }}>
                    <td style={{ padding: "0.5rem", color: "#e8e8e8" }}>#{i + 1}</td>
                    <td style={{ padding: "0.5rem", color: "#e8e8e8", textAlign: "right" }}>{formatNum(d.x)}</td>
                    <td style={{ padding: "0.5rem", color: "#e8e8e8", textAlign: "right" }}>{formatNum(d.y)}</td>
                    <td style={{ padding: "0.5rem", color: "#22c55e", textAlign: "right" }}>{formatNum(d.xDev)}</td>
                    <td style={{ padding: "0.5rem", color: "#06b6d4", textAlign: "right" }}>{formatNum(d.yDev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "#888", marginTop: "1rem", fontSize: "0.85rem" }}>
            These deviations tell us how each point differs from the "center" of the data.
          </p>
        </>
      )
    },
    {
      title: "💡 The Intuition: Averaging Point Slopes",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            Here's the key insight: <strong style={{ color: "#f59e0b" }}>we're essentially averaging the "slope" from the center point to each data point</strong>.
          </p>
          
          <div style={{ background: "#1e2a3e", padding: "1rem", borderRadius: 8, border: "1px solid #3b82f6", marginBottom: "1rem" }}>
            <div style={{ color: "#60a5fa", fontWeight: 600, marginBottom: "0.75rem" }}>Think about it this way:</div>
            <p style={{ color: "#e8e8e8", margin: "0 0 0.75rem 0", lineHeight: 1.7 }}>
              If you stand at the mean point <span style={{ color: "#a855f7" }}>(x̄, ȳ)</span> and draw a line to any data point, 
              that line has its own slope: <strong style={{ color: "#f59e0b" }}>(yᵢ - ȳ) / (xᵢ - x̄)</strong>
            </p>
            <p style={{ color: "#aaa", margin: 0, fontSize: "0.9rem" }}>
              Each point "votes" for what slope the overall line should have!
            </p>
          </div>

          <div style={{ background: "#252540", padding: "1rem", borderRadius: 8, marginBottom: "1rem" }}>
            <div style={{ color: "#888", marginBottom: "0.5rem" }}>Each point's "vote" (slope from mean):</div>
            <div style={{ fontFamily: "monospace", lineHeight: 1.8, fontSize: "0.9rem" }}>
              {deviations.map((d, i) => {
                const pointSlope = d.xDev !== 0 ? d.yDev / d.xDev : 0;
                return (
                  <div key={i} style={{ color: "#e8e8e8" }}>
                    Point #{i + 1}: <span style={{ color: "#06b6d4" }}>{formatNum(d.yDev)}</span> / <span style={{ color: "#22c55e" }}>{formatNum(d.xDev)}</span> = <span style={{ color: "#f59e0b" }}>{d.xDev !== 0 ? formatNum(pointSlope) : "∞"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "#1a2e1a", padding: "1rem", borderRadius: 8, border: "1px solid #22c55e", marginBottom: "1rem" }}>
            <div style={{ color: "#22c55e", fontWeight: 600, marginBottom: "0.5rem" }}>But wait — why not just average these slopes?</div>
            <p style={{ color: "#e8e8e8", margin: 0, lineHeight: 1.7 }}>
              Simple averaging would give equal weight to every point. But points <em>far</em> from the center 
              (large |xᵢ - x̄|) should count more — they give us more information about the trend.
            </p>
          </div>

          <p style={{ color: "#e8e8e8", marginBottom: "0.5rem" }}>
            <strong>The formula's trick:</strong> Instead of dividing by x-deviation once (to get each slope) then averaging, 
            it multiplies by x-deviation to weight each vote, then divides by total x-deviation squared:
          </p>
          <div style={{ background: "#252540", padding: "1rem", borderRadius: 8, fontFamily: "monospace", fontSize: "0.95rem", color: "#e8e8e8" }}>
            m = Σ(<span style={{ color: "#22c55e" }}>xᵢ - x̄</span>)(<span style={{ color: "#06b6d4" }}>yᵢ - ȳ</span>) / Σ(<span style={{ color: "#22c55e" }}>xᵢ - x̄</span>)²
            <div style={{ color: "#888", marginTop: "0.5rem", fontFamily: "inherit", fontSize: "0.85rem" }}>
              = weighted sum of y-deviations / sum of weights
            </div>
          </div>
          <p style={{ color: "#888", marginTop: "0.75rem", fontSize: "0.85rem" }}>
            Points far from x̄ get more "voting power" because they stretch the pattern more clearly.
          </p>
        </>
      )
    },
    {
      title: "Step 4: Calculate the Numerator",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            Multiply each x-deviation by its corresponding y-deviation, then sum them up:
          </p>
          <div style={{ background: "#1a1a3e", padding: "1rem", borderRadius: 8, marginBottom: "1rem" }}>
            <div style={{ color: "#f59e0b", marginBottom: "0.75rem", fontWeight: 600 }}>
              Σ(xᵢ - x̄)(yᵢ - ȳ) = ?
            </div>
            <div style={{ fontFamily: "monospace", lineHeight: 1.8, fontSize: "0.9rem" }}>
              {deviations.map((d, i) => (
                <div key={i} style={{ color: "#e8e8e8" }}>
                  ({formatNum(d.xDev)}) × ({formatNum(d.yDev)}) = <span style={{ color: "#a855f7" }}>{formatNum(d.product)}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#252540", padding: "1rem", borderRadius: 8, textAlign: "center" }}>
            <span style={{ color: "#888" }}>Sum = </span>
            <span style={{ color: "#a855f7" }}>{deviations.map(d => formatNum(d.product)).join(" + ")}</span>
            <span style={{ color: "#888" }}> = </span>
            <strong style={{ color: "#f59e0b", fontSize: "1.2rem" }}>{formatNum(sumProducts)}</strong>
          </div>
        </>
      )
    },
    {
      title: "Step 5: Calculate the Denominator",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            Square each x-deviation and sum them up:
          </p>
          <div style={{ background: "#1a1a3e", padding: "1rem", borderRadius: 8, marginBottom: "1rem" }}>
            <div style={{ color: "#f59e0b", marginBottom: "0.75rem", fontWeight: 600 }}>
              Σ(xᵢ - x̄)² = ?
            </div>
            <div style={{ fontFamily: "monospace", lineHeight: 1.8, fontSize: "0.9rem" }}>
              {deviations.map((d, i) => (
                <div key={i} style={{ color: "#e8e8e8" }}>
                  ({formatNum(d.xDev)})² = <span style={{ color: "#22c55e" }}>{formatNum(d.xDevSquared)}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#252540", padding: "1rem", borderRadius: 8, textAlign: "center" }}>
            <span style={{ color: "#888" }}>Sum = </span>
            <span style={{ color: "#22c55e" }}>{deviations.map(d => formatNum(d.xDevSquared)).join(" + ")}</span>
            <span style={{ color: "#888" }}> = </span>
            <strong style={{ color: "#f59e0b", fontSize: "1.2rem" }}>{formatNum(sumXDevSquared)}</strong>
          </div>
        </>
      )
    },
    {
      title: "Step 6: Compute the Slope!",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            Divide the numerator by the denominator:
          </p>
          <div style={{ background: "#252540", padding: "1.5rem", borderRadius: 8, textAlign: "center" }}>
            <div style={{ color: "#f59e0b", fontSize: "1.3rem", marginBottom: "1rem" }}>
              m = Σ(xᵢ - x̄)(yᵢ - ȳ) / Σ(xᵢ - x̄)²
            </div>
            <div style={{ fontSize: "1.2rem", color: "#e8e8e8" }}>
              m = <span style={{ color: "#a855f7" }}>{formatNum(sumProducts)}</span> / <span style={{ color: "#22c55e" }}>{formatNum(sumXDevSquared)}</span>
            </div>
            <div style={{ fontSize: "1.5rem", marginTop: "0.75rem" }}>
              <strong style={{ color: "#f59e0b" }}>m = {formatNum(slope)}</strong>
            </div>
          </div>
          <p style={{ color: "#888", marginTop: "1rem", fontSize: "0.9rem" }}>
            This means for every 1 unit increase in x, y increases by ~{formatNum(slope)} units.
          </p>
        </>
      )
    },
    {
      title: "Step 7: Find the Intercept",
      content: (
        <>
          <p style={{ color: "#e8e8e8", marginBottom: "1rem" }}>
            Once we have the slope, the intercept is easy — the line must pass through the point (x̄, ȳ):
          </p>
          <div style={{ background: "#252540", padding: "1.5rem", borderRadius: 8, textAlign: "center", marginBottom: "1rem" }}>
            <div style={{ color: "#f59e0b", fontSize: "1.1rem", marginBottom: "1rem" }}>
              b = ȳ - m·x̄
            </div>
            <div style={{ fontSize: "1.1rem", color: "#e8e8e8" }}>
              b = <span style={{ color: "#06b6d4" }}>{formatNum(yMean)}</span> - (<span style={{ color: "#f59e0b" }}>{formatNum(slope)}</span>)(<span style={{ color: "#22c55e" }}>{formatNum(xMean)}</span>)
            </div>
            <div style={{ fontSize: "1.5rem", marginTop: "0.75rem" }}>
              <strong style={{ color: "#6366f1" }}>b = {formatNum(intercept)}</strong>
            </div>
          </div>
          <div style={{ background: "#1e3a1e", padding: "1rem", borderRadius: 8, border: "1px solid #22c55e" }}>
            <div style={{ color: "#22c55e", fontWeight: 600, marginBottom: "0.5rem" }}>✓ Final Answer</div>
            <div style={{ color: "#e8e8e8", fontSize: "1.2rem", fontFamily: "monospace" }}>
              y = <span style={{ color: "#f59e0b" }}>{formatNum(slope)}</span>x + <span style={{ color: "#6366f1" }}>{formatNum(intercept)}</span>
            </div>
          </div>
        </>
      )
    }
  ];

  return (
    <div style={{ 
      background: "#0f0f1a", 
      borderRadius: 8, 
      padding: "1rem", 
      marginTop: "1rem",
      border: "1px solid #2a2a4e"
    }}>
      <h4 style={{ color: "#6366f1", margin: "0 0 1rem 0", fontSize: "1rem" }}>
        🔢 Step-by-Step Calculation (with your data)
      </h4>
      
      {/* Step navigation */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              border: "none",
              background: currentStep === i ? "#6366f1" : "#2a2a4e",
              color: currentStep === i ? "#fff" : "#888",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: currentStep === i ? 600 : 400,
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
      
      {/* Current step */}
      <div style={{ marginBottom: "1rem" }}>
        <h5 style={{ color: "#f59e0b", margin: "0 0 0.75rem 0", fontSize: "1rem" }}>
          {steps[currentStep].title}
        </h5>
        {steps[currentStep].content}
      </div>
      
      {/* Navigation */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 6,
            border: "none",
            background: currentStep === 0 ? "#2a2a4e" : "#3a3a6e",
            color: currentStep === 0 ? "#555" : "#fff",
            cursor: currentStep === 0 ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
          }}
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 6,
            border: "none",
            background: currentStep === steps.length - 1 ? "#2a2a4e" : "#6366f1",
            color: currentStep === steps.length - 1 ? "#555" : "#fff",
            cursor: currentStep === steps.length - 1 ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          Next →
        </button>
      </div>
      
      <p style={{ color: "#666", fontSize: "0.8rem", marginTop: "1rem", marginBottom: 0 }}>
        💡 Add or remove points in the chart above to see how the calculation changes!
      </p>
    </div>
  );
}

// ============================================================================
// MAIN TUTORIAL COMPONENT
// ============================================================================

export default function LeastSquares() {
  // Initial sample data
  const [points, setPoints] = useState([
    { x: 1, y: 2.1 },
    { x: 2, y: 3.8 },
    { x: 3, y: 4.2 },
    { x: 4, y: 5.5 },
    { x: 5, y: 6.9 },
    { x: 6, y: 7.2 },
  ]);

  const [showLine, setShowLine] = useState(true);
  const [showResiduals, setShowResiduals] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [manualM, setManualM] = useState(1);
  const [manualB, setManualB] = useState(1);

  const bestFit = useMemo(() => leastSquaresLine(points), [points]);
  const activeLine = manualMode ? { m: manualM, b: manualB } : bestFit;
  const ssr = useMemo(
    () => sumSquaredResiduals(points, activeLine.m, activeLine.b),
    [points, activeLine],
  );
  const bestSsr = useMemo(
    () => sumSquaredResiduals(points, bestFit.m, bestFit.b),
    [points, bestFit],
  );

  return (
    <Container>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ color: "#f59e0b", marginBottom: "0.5rem" }}>
          Least Squares Regression
        </h1>
        <p style={{ color: "#888", marginBottom: "2rem" }}>
          Finding the line that best fits your data by minimizing squared errors
        </p>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
            background: "#1a1a2e",
            padding: "1rem",
            borderRadius: 8,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#e8e8e8",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showLine}
              onChange={(e) => setShowLine(e.target.checked)}
            />
            Show Line
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#e8e8e8",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showResiduals}
              onChange={(e) => setShowResiduals(e.target.checked)}
            />
            Show Residuals
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#e8e8e8",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={manualMode}
              onChange={(e) => setManualMode(e.target.checked)}
            />
            Manual Mode
          </label>
          <button
            onClick={() => setPoints([])}
            style={{
              background: "#3a3a5e",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Clear Points
          </button>
        </div>

        {/* Main visualization */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <ScatterPlot
              points={points}
              setPoints={setPoints}
              showLine={showLine}
              showResiduals={showResiduals}
              manualLine={manualMode ? { m: manualM, b: manualB } : null}
            />
          </div>

          <div style={{ flex: 1, minWidth: 250 }}>
            <EquationDisplay m={activeLine.m} b={activeLine.b} ssr={ssr} />

            {manualMode && (
              <div style={{ marginTop: "1rem" }}>
                <ManualControls
                  m={manualM}
                  b={manualB}
                  setM={setManualM}
                  setB={setManualB}
                  bestM={bestFit.m}
                  bestB={bestFit.b}
                />
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background:
                      manualM === bestFit.m && manualB === bestFit.b
                        ? "#22c55e22"
                        : "#ef444422",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ color: "#888", fontSize: "0.9rem" }}>
                    Your SSR:{" "}
                    <strong style={{ color: "#e8e8e8" }}>
                      {ssr.toFixed(2)}
                    </strong>
                  </div>
                  <div style={{ color: "#888", fontSize: "0.9rem" }}>
                    Best SSR:{" "}
                    <strong style={{ color: "#22c55e" }}>
                      {bestSsr.toFixed(2)}
                    </strong>
                  </div>
                  {ssr > bestSsr + 0.01 && (
                    <div
                      style={{
                        color: "#f59e0b",
                        fontSize: "0.85rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      Your line has{" "}
                      {(((ssr - bestSsr) / bestSsr) * 100).toFixed(0)}% more
                      error!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Explanation */}
        <div
          style={{
            marginTop: "2rem",
            background: "#1a1a2e",
            padding: "1.5rem",
            borderRadius: 12,
            lineHeight: 1.7,
          }}
        >
          <h2 style={{ color: "#f59e0b", fontSize: "1.3rem", fontWeight: 600 }}>
            How It Works
          </h2>
          <p style={{ color: "#e8e8e8" }}>
            <strong style={{ color: "#6366f1" }}>Least squares</strong> finds
            the line that minimizes the{" "}
            <strong style={{ color: "#ef4444" }}>
              sum of squared residuals
            </strong>{" "}
            — the total squared vertical distance from each point to the line.
          </p>
          <p style={{ marginTop: "1rem", color: "#e8e8e8" }}>
            The <strong style={{ color: "#22c55e" }}>green</strong> residual
            lines show points
            <em> above</em> the fitted line, while{" "}
            <strong style={{ color: "#ef4444" }}>red</strong> shows points{" "}
            <em>below</em>. The small squares visualize the "squared" part —
            we're minimizing the total area of those squares.
          </p>
          <p style={{ marginTop: "1rem", color: "#e8e8e8" }}>
            Try <strong style={{ color: "#f59e0b" }}>Manual Mode</strong> to
            drag the line yourself and see how the error changes. You'll find
            you can't beat the least squares solution!
          </p>

          <h2
            style={{
              color: "#f59e0b",
              fontSize: "1.3rem",
              fontWeight: 600,
              marginTop: "2rem",
            }}
          >
            Why "Normal" Equations?
          </h2>
          <p style={{ marginBottom: "1rem", color: "#e8e8e8" }}>
            The name comes from{" "}
            <strong style={{ color: "#6366f1" }}>geometry</strong>, not
            statistics. "Normal" means{" "}
            <strong style={{ color: "#f59e0b" }}>perpendicular</strong>. Let's
            see what this actually means with a concrete example.
          </p>

          {/* 3D INTERACTIVE VISUALIZATION */}
          <ColumnSpace3D />

          <details style={{ marginTop: "1.5rem" }}>
            <summary
              style={{ color: "#888", cursor: "pointer", fontSize: "0.9rem" }}
            >
              📐 Show 2D Simplified View
            </summary>
            {/* STEP BY STEP 2D VISUAL EXPLANATION */}
            <ProjectionExplainer />
          </details>

          <h2
            style={{
              color: "#f59e0b",
              fontSize: "1.3rem",
              fontWeight: 600,
              marginTop: "2rem",
            }}
          >
            The Formula
          </h2>
          <div
            style={{
              background: "#252540",
              padding: "1rem",
              borderRadius: 8,
              fontFamily: "ui-monospace, monospace",
              color: "#e8e8e8",
            }}
          >
            <div>slope (m) = Σ(xᵢ - x̄)(yᵢ - ȳ) / Σ(xᵢ - x̄)²</div>
            <div style={{ marginTop: "0.5rem" }}>intercept (b) = ȳ - m·x̄</div>
          </div>
          <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#aaa" }}>
            Where x̄ and ȳ are the means of x and y values respectively.
          </p>

          {/* Step-by-step formula walkthrough */}
          {points.length >= 2 && <SlopeFormulaWalkthrough points={points} />}
        </div>
      </div>
    </Container>
  );
}
