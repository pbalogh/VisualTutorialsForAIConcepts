import React, { useState, useCallback } from 'react'

// Amino acid data with properties
const AMINO_ACIDS = [
  { code: 'G', name: 'Glycine', color: '#94a3b8', type: 'nonpolar', sideChain: 'H' },
  { code: 'A', name: 'Alanine', color: '#a3a3a3', type: 'nonpolar', sideChain: 'CH₃' },
  { code: 'V', name: 'Valine', color: '#78716c', type: 'nonpolar', sideChain: '(CH₃)₂CH' },
  { code: 'L', name: 'Leucine', color: '#737373', type: 'nonpolar', sideChain: '(CH₃)₂CHCH₂' },
  { code: 'I', name: 'Isoleucine', color: '#71717a', type: 'nonpolar', sideChain: 'CH₃CH₂CH(CH₃)' },
  { code: 'M', name: 'Methionine', color: '#fbbf24', type: 'nonpolar', sideChain: 'CH₃SCH₂CH₂' },
  { code: 'F', name: 'Phenylalanine', color: '#a78bfa', type: 'nonpolar', sideChain: 'C₆H₅CH₂' },
  { code: 'W', name: 'Tryptophan', color: '#c084fc', type: 'nonpolar', sideChain: 'Indole' },
  { code: 'P', name: 'Proline', color: '#fdba74', type: 'nonpolar', sideChain: 'Cyclic' },
  { code: 'S', name: 'Serine', color: '#86efac', type: 'polar', sideChain: 'CH₂OH' },
  { code: 'T', name: 'Threonine', color: '#6ee7b7', type: 'polar', sideChain: 'CH(OH)CH₃' },
  { code: 'C', name: 'Cysteine', color: '#fcd34d', type: 'polar', sideChain: 'CH₂SH' },
  { code: 'Y', name: 'Tyrosine', color: '#a5b4fc', type: 'polar', sideChain: 'C₆H₄OHCH₂' },
  { code: 'N', name: 'Asparagine', color: '#67e8f9', type: 'polar', sideChain: 'CH₂CONH₂' },
  { code: 'Q', name: 'Glutamine', color: '#5eead4', type: 'polar', sideChain: 'CH₂CH₂CONH₂' },
  { code: 'D', name: 'Aspartate', color: '#f87171', type: 'acidic', sideChain: 'CH₂COO⁻' },
  { code: 'E', name: 'Glutamate', color: '#fb923c', type: 'acidic', sideChain: 'CH₂CH₂COO⁻' },
  { code: 'K', name: 'Lysine', color: '#60a5fa', type: 'basic', sideChain: '(CH₂)₄NH₃⁺' },
  { code: 'R', name: 'Arginine', color: '#818cf8', type: 'basic', sideChain: '(CH₂)₃NHC(NH₂)₂⁺' },
  { code: 'H', name: 'Histidine', color: '#93c5fd', type: 'basic', sideChain: 'Imidazole' },
]

// SVG component for an amino acid with structure
function AminoAcidStructure({ aa, x, y, scale = 1, showBond = false, isFirst = false, isLast = false }) {
  const s = scale * 0.8
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      {/* Main backbone */}
      {/* N terminus */}
      <circle cx={-40} cy={0} r={16} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={2} />
      <text x={-40} y={5} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">N</text>
      {isFirst && (
        <>
          <text x={-40} y={-25} textAnchor="middle" fill="#3b82f6" fontSize={10}>H₃N⁺</text>
        </>
      )}
      
      {/* Alpha carbon */}
      <line x1={-24} y1={0} x2={-8} y2={0} stroke="#374151" strokeWidth={3} />
      <circle cx={0} cy={0} r={20} fill={aa.color} stroke="#374151" strokeWidth={2} />
      <text x={0} y={5} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">Cα</text>
      
      {/* Side chain (R group) pointing up */}
      <line x1={0} y1={-20} x2={0} y2={-45} stroke="#374151" strokeWidth={2} />
      <rect x={-25} y={-75} width={50} height={28} rx={6} fill={aa.color} stroke="#374151" strokeWidth={2} />
      <text x={0} y={-56} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">R</text>
      <text x={0} y={-85} textAnchor="middle" fill="#374151" fontSize={9}>{aa.sideChain}</text>
      
      {/* C=O (carbonyl) */}
      <line x1={8} y1={0} x2={32} y2={0} stroke="#374151" strokeWidth={3} />
      <circle cx={40} cy={0} r={16} fill="#ef4444" stroke="#b91c1c" strokeWidth={2} />
      <text x={40} y={5} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">C</text>
      
      {/* Double bond O */}
      <line x1={40} y1={16} x2={40} y2={35} stroke="#374151" strokeWidth={2} />
      <line x1={44} y1={16} x2={44} y2={35} stroke="#374151" strokeWidth={2} />
      <circle cx={42} cy={45} r={12} fill="#22c55e" stroke="#15803d" strokeWidth={2} />
      <text x={42} y={49} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">O</text>
      
      {isLast && (
        <>
          {/* OH terminus */}
          <line x1={56} y1={0} x2={75} y2={0} stroke="#374151" strokeWidth={2} />
          <circle cx={85} cy={0} r={12} fill="#22c55e" stroke="#15803d" strokeWidth={2} />
          <text x={85} y={4} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">OH</text>
          <text x={85} y={20} textAnchor="middle" fill="#22c55e" fontSize={9}>COO⁻</text>
        </>
      )}
      
      {/* Peptide bond indicator */}
      {showBond && !isLast && (
        <g>
          <line x1={56} y1={0} x2={90} y2={0} stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5,3" />
          <text x={73} y={-10} textAnchor="middle" fill="#8b5cf6" fontSize={10} fontWeight="bold">peptide bond</text>
        </g>
      )}
    </g>
  )
}

// Water molecule animation
function WaterMolecule({ x, y, animate }) {
  return (
    <g transform={`translate(${x}, ${y})`} opacity={animate ? 1 : 0.3}>
      <circle cx={0} cy={0} r={14} fill="#06b6d4" stroke="#0891b2" strokeWidth={2} />
      <text x={0} y={5} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">O</text>
      <circle cx={-18} cy={-10} r={8} fill="#f0f9ff" stroke="#0891b2" strokeWidth={1} />
      <text x={-18} y={-7} textAnchor="middle" fill="#0891b2" fontSize={8} fontWeight="bold">H</text>
      <circle cx={18} cy={-10} r={8} fill="#f0f9ff" stroke="#0891b2" strokeWidth={1} />
      <text x={18} y={-7} textAnchor="middle" fill="#0891b2" fontSize={8} fontWeight="bold">H</text>
      <line x1={-10} y1={-6} x2={-5} y2={-3} stroke="#0891b2" strokeWidth={2} />
      <line x1={10} y1={-6} x2={5} y2={-3} stroke="#0891b2" strokeWidth={2} />
      {animate && (
        <text x={0} y={25} textAnchor="middle" fill="#06b6d4" fontSize={10}>H₂O released!</text>
      )}
    </g>
  )
}

// Main Tutorial Component
export default function Peptides() {
  const [selectedAAs, setSelectedAAs] = useState([])
  const [step, setStep] = useState(0) // 0: intro, 1: building, 2: bond formation, 3: chain view
  const [showBondAnimation, setShowBondAnimation] = useState(false)
  const [hoveredAA, setHoveredAA] = useState(null)
  
  const addAminoAcid = useCallback((aa) => {
    if (selectedAAs.length < 5) {
      setSelectedAAs(prev => [...prev, aa])
      if (selectedAAs.length === 0) setStep(1)
    }
  }, [selectedAAs.length])
  
  const removeLastAA = useCallback(() => {
    setSelectedAAs(prev => prev.slice(0, -1))
    setShowBondAnimation(false)
    if (selectedAAs.length <= 1) setStep(0)
  }, [selectedAAs.length])
  
  const formBond = useCallback(() => {
    if (selectedAAs.length >= 2) {
      setShowBondAnimation(true)
      setStep(2)
      setTimeout(() => setStep(3), 2000)
    }
  }, [selectedAAs.length])
  
  const reset = useCallback(() => {
    setSelectedAAs([])
    setStep(0)
    setShowBondAnimation(false)
  }, [])
  
  const typeColors = {
    nonpolar: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' },
    polar: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
    acidic: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
    basic: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            🧬 Peptides: Building Blocks of Life
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Build a peptide chain by linking amino acids together
          </p>
        </div>
        
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-4 rounded-xl border-2 transition-all ${step === 0 ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
            <div className="text-2xl mb-2">1️⃣</div>
            <h3 className="font-bold text-gray-800">Select Amino Acids</h3>
            <p className="text-sm text-gray-600">Click amino acids below to add them to your chain (max 5)</p>
          </div>
          <div className={`p-4 rounded-xl border-2 transition-all ${step === 1 ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'}`}>
            <div className="text-2xl mb-2">2️⃣</div>
            <h3 className="font-bold text-gray-800">Form Peptide Bonds</h3>
            <p className="text-sm text-gray-600">Watch dehydration synthesis release water</p>
          </div>
          <div className={`p-4 rounded-xl border-2 transition-all ${step >= 2 ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
            <div className="text-2xl mb-2">3️⃣</div>
            <h3 className="font-bold text-gray-800">View Your Peptide</h3>
            <p className="text-sm text-gray-600">See the complete chain with backbone structure</p>
          </div>
        </div>

        {/* Main Visualization Area */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {step === 0 && "🔬 Select amino acids to begin"}
              {step === 1 && `🧪 Chain: ${selectedAAs.map(a => a.code).join('-')} (${selectedAAs.length} residues)`}
              {step === 2 && "⚗️ Forming peptide bonds..."}
              {step === 3 && `✨ Your peptide: ${selectedAAs.map(a => a.code).join('-')}`}
            </h2>
            <div className="flex gap-2">
              {selectedAAs.length > 0 && (
                <button
                  onClick={removeLastAA}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                >
                  ← Remove Last
                </button>
              )}
              {selectedAAs.length >= 2 && step < 2 && (
                <button
                  onClick={formBond}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                >
                  Form Bonds ⚡
                </button>
              )}
              {step >= 2 && (
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                >
                  Start Over 🔄
                </button>
              )}
            </div>
          </div>
          
          {/* SVG Canvas */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl overflow-hidden">
            <svg viewBox="0 0 900 350" className="w-full h-[350px]">
              {selectedAAs.length === 0 ? (
                <text x="450" y="175" textAnchor="middle" fill="#94a3b8" fontSize="18">
                  Click an amino acid below to start building your peptide
                </text>
              ) : step < 3 ? (
                // Show individual amino acids before bond formation
                <>
                  {selectedAAs.map((aa, i) => (
                    <g key={i}>
                      <AminoAcidStructure
                        aa={aa}
                        x={100 + i * 160}
                        y={175}
                        scale={0.9}
                        showBond={i < selectedAAs.length - 1}
                        isFirst={i === 0}
                        isLast={i === selectedAAs.length - 1}
                      />
                      <text
                        x={100 + i * 160}
                        y={290}
                        textAnchor="middle"
                        fill="#374151"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        {aa.name} ({aa.code})
                      </text>
                    </g>
                  ))}
                  {showBondAnimation && selectedAAs.length >= 2 && (
                    // Show water molecules being released
                    <>
                      {selectedAAs.slice(0, -1).map((_, i) => (
                        <WaterMolecule
                          key={i}
                          x={180 + i * 160}
                          y={80}
                          animate={true}
                        />
                      ))}
                    </>
                  )}
                </>
              ) : (
                // Show connected peptide chain
                <>
                  <text x="450" y="30" textAnchor="middle" fill="#6366f1" fontSize="16" fontWeight="bold">
                    N-terminus → C-terminus
                  </text>
                  {selectedAAs.map((aa, i) => {
                    const spacing = Math.min(160, 800 / selectedAAs.length)
                    const startX = 450 - ((selectedAAs.length - 1) * spacing) / 2
                    return (
                      <g key={i}>
                        {/* Backbone line */}
                        {i > 0 && (
                          <line
                            x1={startX + (i - 1) * spacing + 50}
                            y1={180}
                            x2={startX + i * spacing - 50}
                            y2={180}
                            stroke="#8b5cf6"
                            strokeWidth={4}
                          />
                        )}
                        {/* Amino acid circle */}
                        <circle
                          cx={startX + i * spacing}
                          cy={180}
                          r={40}
                          fill={aa.color}
                          stroke="#374151"
                          strokeWidth={3}
                        />
                        <text
                          x={startX + i * spacing}
                          y={185}
                          textAnchor="middle"
                          fill="white"
                          fontSize="20"
                          fontWeight="bold"
                        >
                          {aa.code}
                        </text>
                        <text
                          x={startX + i * spacing}
                          y={240}
                          textAnchor="middle"
                          fill="#374151"
                          fontSize="12"
                        >
                          {aa.name}
                        </text>
                        {/* N and C terminus labels */}
                        {i === 0 && (
                          <text x={startX - 60} y={185} fill="#3b82f6" fontSize="14" fontWeight="bold">
                            H₃N⁺—
                          </text>
                        )}
                        {i === selectedAAs.length - 1 && (
                          <text x={startX + i * spacing + 55} y={185} fill="#22c55e" fontSize="14" fontWeight="bold">
                            —COO⁻
                          </text>
                        )}
                      </g>
                    )
                  })}
                  {/* Released water count */}
                  <text x="450" y="320" textAnchor="middle" fill="#06b6d4" fontSize="14">
                    💧 {selectedAAs.length - 1} water molecule{selectedAAs.length > 2 ? 's' : ''} released during bond formation
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>
        
        {/* Amino Acid Selector */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🧬 Amino Acid Palette</h2>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-gray-300"></span> Nonpolar
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-300"></span> Polar
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-300"></span> Acidic (-)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-blue-300"></span> Basic (+)
            </span>
          </div>
          
          {/* Amino acid grid */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {AMINO_ACIDS.map((aa) => {
              const colors = typeColors[aa.type]
              return (
                <button
                  key={aa.code}
                  onClick={() => addAminoAcid(aa)}
                  onMouseEnter={() => setHoveredAA(aa)}
                  onMouseLeave={() => setHoveredAA(null)}
                  disabled={selectedAAs.length >= 5}
                  className={`
                    relative p-3 rounded-xl border-2 transition-all
                    ${colors.bg} ${colors.border}
                    hover:scale-110 hover:shadow-lg hover:z-10
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-indigo-400
                  `}
                  style={{ backgroundColor: aa.color + '30' }}
                >
                  <div
                    className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: aa.color }}
                  >
                    {aa.code}
                  </div>
                  <div className={`text-xs font-medium ${colors.text} truncate`}>
                    {aa.name}
                  </div>
                </button>
              )
            })}
          </div>
          
          {/* Hovered amino acid info */}
          {hoveredAA && (
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: hoveredAA.color }}
                >
                  {hoveredAA.code}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{hoveredAA.name}</h3>
                  <p className="text-sm text-gray-600">
                    Type: <span className="font-medium capitalize">{hoveredAA.type}</span> • 
                    Side chain (R): <span className="font-mono">{hoveredAA.sideChain}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Educational Content */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-lg font-bold text-blue-800 mb-3">🔗 What is a Peptide Bond?</h3>
            <p className="text-gray-700 leading-relaxed">
              A <strong>peptide bond</strong> forms between the carboxyl group (-COOH) of one amino acid 
              and the amino group (-NH₂) of another through <strong>dehydration synthesis</strong> — 
              a reaction that releases one water molecule (H₂O) for each bond formed.
            </p>
            <div className="mt-3 p-3 bg-white/50 rounded-lg font-mono text-sm text-center">
              -COOH + H₂N- → -CO-NH- + H₂O
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="text-lg font-bold text-purple-800 mb-3">📐 Protein Structure Levels</h3>
            <ul className="text-gray-700 space-y-2">
              <li><strong>Primary:</strong> Sequence of amino acids (what you're building!)</li>
              <li><strong>Secondary:</strong> Local folding (α-helices, β-sheets)</li>
              <li><strong>Tertiary:</strong> 3D shape of entire chain</li>
              <li><strong>Quaternary:</strong> Multiple chains together</li>
            </ul>
          </div>
        </div>
        
        {/* Fun facts */}
        <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200">
          <h3 className="text-lg font-bold text-amber-800 mb-3">💡 Did You Know?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-xl">🔤</span>
              <p>There are <strong>20 standard amino acids</strong> encoded by DNA, using 3-letter codons</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xl">⚡</span>
              <p>A typical protein has <strong>200-500 amino acids</strong>, but titin has over 30,000!</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xl">🧬</span>
              <p>The human body produces about <strong>100,000 different proteins</strong> from just 20 amino acids</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
