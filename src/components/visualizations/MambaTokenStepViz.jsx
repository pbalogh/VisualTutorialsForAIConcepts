/**
 * MambaTokenStepViz — Token-by-Token State Evolution
 *
 * Step-through visualization showing how Fast (syntax) and Slow (topic) branches
 * evolve their hidden states as tokens are processed, with trunk modulation.
 */

import React, { useState } from 'react'

const FAST_COLOR = '#3b82f6'
const SLOW_COLOR = '#f59e0b'
const TRUNK_COLOR = '#8b5cf6'
const BG_COLOR = '#1e293b'

const STEPS = [
  {
    token: 'The',
    fast: { delta: [0.08, 0.07, 0.05, 0.06], h: [0.3, 0.1, 0.2, 0.05], output: 0.2 },
    slow: { delta: [0.01, 0.01, 0.02, 0.01], h: [0.02, 0.01, 0.01, 0.01], output: 0.01 },
    trunk: { h: 0.05, mod: 0.0, label: 'sentence started' },
  },
  {
    token: 'cat',
    fast: { delta: [0.06, 0.09, 0.04, 0.07], h: [0.25, 0.4, 0.15, 0.3], output: 0.35 },
    slow: { delta: [0.07, 0.06, 0.08, 0.05], h: [0.3, 0.2, 0.25, 0.15], output: 0.25 },
    trunk: { h: 0.28, mod: 0.0, label: 'NP done, topic=cat' },
  },
  {
    token: 'sat',
    fast: { delta: [0.08, 0.07, 0.09, 0.06], h: [0.1, 0.6, 0.05, 0.4], output: 0.4 },
    slow: { delta: [0.03, 0.02, 0.02, 0.03], h: [0.27, 0.2, 0.23, 0.14], output: 0.24 },
    trunk: { h: 0.35, mod: 0.0, label: 'SV complete' },
  },
  {
    token: '.',
    fast: { delta: [0.09, 0.09, 0.09, 0.09], h: [0.0, 0.0, 0.0, 0.0], output: 0.0 },
    slow: { delta: [0.02, 0.02, 0.01, 0.02], h: [0.25, 0.18, 0.22, 0.13], output: 0.22 },
    trunk: { h: 0.30, mod: 0.15, label: '\u26A1 boundary \u2192 nudge branches' },
  },
  {
    token: 'A',
    fast: { delta: [0.09, 0.08, 0.07, 0.08], h: [0.35, 0.12, 0.2, 0.1], output: 0.22 },
    slow: { delta: [0.04, 0.04, 0.03, 0.04], h: [0.18, 0.14, 0.18, 0.1], output: 0.16 },
    trunk: { h: 0.25, mod: 0.08, label: 'new sentence, topic wobbling' },
  },
  {
    token: 'dog',
    fast: { delta: [0.06, 0.09, 0.05, 0.07], h: [0.28, 0.45, 0.15, 0.35], output: 0.38 },
    slow: { delta: [0.08, 0.09, 0.07, 0.08], h: [0.05, 0.55, 0.1, 0.5], output: 0.35 },
    trunk: { h: 0.42, mod: 0.0, label: '\uD83D\uDD04 topic shift: cat\u2192dog' },
  },
]

function BranchPanel({ name, color, data, x, y, width, height }) {
  const barMaxW = width - 90
  const barH = 14
  const barGap = 4
  const channelStartY = y + 36

  return (
    <g>
      {/* Panel background */}
      <rect x={x} y={y} width={width} height={height}
        fill={color} fillOpacity={0.08} stroke={color} strokeWidth={1.5}
        rx={8} />

      {/* Title */}
      <text x={x + width / 2} y={y + 18} textAnchor="middle"
        fill={color} fontSize="12" fontWeight="700">
        {name}
      </text>
      <text x={x + width / 2} y={y + 29} textAnchor="middle"
        fill="#94a3b8" fontSize="9">
        output: {data.output.toFixed(2)}
      </text>

      {/* Channel bars */}
      {data.h.map((val, i) => {
        const by = channelStartY + i * (barH + barGap)
        const bw = Math.max((val / 0.7) * barMaxW, 0)
        return (
          <g key={i}>
            <text x={x + 8} y={by + barH - 3} fill="#94a3b8" fontSize="9">
              h[{i}]
            </text>
            <rect x={x + 32} y={by} width={bw} height={barH}
              fill={color} opacity={0.7} rx={3}>
              <title>h[{i}] = {val.toFixed(2)}, Δ = {data.delta[i].toFixed(2)}</title>
            </rect>
            <text x={x + 34 + bw} y={by + barH - 3} fill="#cbd5e1" fontSize="8">
              {val.toFixed(2)}
            </text>
            {/* Delta indicator */}
            <text x={x + width - 8} y={by + barH - 3} textAnchor="end"
              fill={color} fontSize="8" opacity={0.6}>
              Δ={data.delta[i].toFixed(2)}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function TrunkPanel({ data, x, y, width, height, showGlow }) {
  const barW = Math.max((data.h / 0.5) * (width - 60), 0)

  return (
    <g>
      {/* Panel background */}
      <rect x={x} y={y} width={width} height={height}
        fill={TRUNK_COLOR} fillOpacity={0.08} stroke={TRUNK_COLOR} strokeWidth={1.5}
        rx={8} />

      {/* Glow effect for modulation */}
      {showGlow && data.mod > 0 && (
        <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6}
          fill="none" stroke={TRUNK_COLOR} strokeWidth={2}
          rx={10} opacity={0.6}>
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
        </rect>
      )}

      <text x={x + width / 2} y={y + 18} textAnchor="middle"
        fill={TRUNK_COLOR} fontSize="12" fontWeight="700">
        Trunk
      </text>

      {/* State bar */}
      <text x={x + 10} y={y + 40} fill="#94a3b8" fontSize="9">state:</text>
      <rect x={x + 45} y={y + 30} width={barW} height={14}
        fill={TRUNK_COLOR} opacity={0.7} rx={3} />
      <text x={x + 47 + barW} y={y + 41} fill="#cbd5e1" fontSize="9">
        {data.h.toFixed(2)}
      </text>

      {/* Modulation */}
      <text x={x + 10} y={y + 60} fill="#94a3b8" fontSize="9">mod signal:</text>
      {data.mod > 0 ? (
        <text x={x + 75} y={y + 60} fill="#fbbf24" fontSize="10" fontWeight="600">
          {data.mod.toFixed(2)}
        </text>
      ) : (
        <text x={x + 75} y={y + 60} fill="#475569" fontSize="9">0 (silent)</text>
      )}

      {/* Label */}
      <text x={x + width / 2} y={y + 82} textAnchor="middle"
        fill="#e2e8f0" fontSize="10" fontStyle="italic">
        {data.label}
      </text>
    </g>
  )
}

function ModulationArrows({ trunkX, trunkY, trunkW, fastX, fastY, fastH, slowX, slowY, slowH, active }) {
  if (!active) return null

  const startX = trunkX
  const startY = trunkY + 45

  // Arrow to fast branch
  const fastEndX = fastX + 180
  const fastEndY = fastY + fastH

  // Arrow to slow branch
  const slowEndX = slowX + 180
  const slowEndY = slowY

  return (
    <g>
      {/* Arrow to fast branch */}
      <path
        d={`M ${startX} ${startY} C ${startX - 30} ${startY - 30}, ${fastEndX + 20} ${fastEndY + 20}, ${fastEndX} ${fastEndY}`}
        fill="none" stroke={TRUNK_COLOR} strokeWidth={2.5} strokeDasharray="6,3"
        opacity={0.8} markerEnd="url(#modArrow)">
        <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1s" repeatCount="indefinite" />
      </path>
      <text x={startX - 40} y={startY - 8} fill={TRUNK_COLOR} fontSize="8" fontWeight="600">
        nudge!
      </text>

      {/* Arrow to slow branch */}
      <path
        d={`M ${startX} ${startY} C ${startX - 30} ${startY + 30}, ${slowEndX + 20} ${slowEndY - 20}, ${slowEndX} ${slowEndY}`}
        fill="none" stroke={TRUNK_COLOR} strokeWidth={2.5} strokeDasharray="6,3"
        opacity={0.8} markerEnd="url(#modArrow)">
        <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1s" repeatCount="indefinite" />
      </path>
    </g>
  )
}

export function MambaTokenStepViz() {
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEPS[stepIdx]

  const svgW = 720
  const svgH = 320

  // Layout
  const sentenceY = 20
  const fastX = 20
  const fastY = 55
  const fastW = 250
  const fastH = 120
  const slowX = 20
  const slowY = 185
  const slowW = 250
  const slowH = 120
  const trunkX = 500
  const trunkY = 100
  const trunkW = 200
  const trunkH = 100

  const showGlow = step.trunk.mod > 0

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 my-6">
      {/* Controls */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <button
          onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
          disabled={stepIdx === 0}
          className="px-3 py-1 rounded-md text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          Prev
        </button>
        <button
          onClick={() => setStepIdx(Math.min(STEPS.length - 1, stepIdx + 1))}
          disabled={stepIdx === STEPS.length - 1}
          className="px-3 py-1 rounded-md text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          Next Token
        </button>
        <span className="text-slate-400 text-sm">
          Step {stepIdx + 1}/{STEPS.length}
        </span>
        <button
          onClick={() => setStepIdx(0)}
          className="ml-auto px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 bg-slate-700/50 hover:bg-slate-700 transition-all">
          Reset
        </button>
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 340 }}>
        <defs>
          <marker id="modArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill={TRUNK_COLOR} />
          </marker>
        </defs>

        {/* Sentence display */}
        {STEPS.map((s, i) => {
          const tx = 20 + i * 70
          const isCurrent = i === stepIdx
          const isPast = i < stepIdx
          return (
            <g key={i}>
              <rect x={tx - 2} y={sentenceY - 12} width={60} height={20} rx={4}
                fill={isCurrent ? '#6d28d9' : 'transparent'}
                stroke={isCurrent ? '#8b5cf6' : 'transparent'} strokeWidth={1} />
              <text x={tx + 28} y={sentenceY + 2} textAnchor="middle"
                fill={isCurrent ? '#f5f3ff' : isPast ? '#94a3b8' : '#475569'}
                fontSize="13" fontWeight={isCurrent ? '700' : '400'}
                fontFamily="monospace">
                {s.token}
              </text>
            </g>
          )
        })}

        {/* Labels */}
        <text x={fastX + fastW / 2} y={fastY - 3} textAnchor="middle"
          fill={FAST_COLOR} fontSize="10" fontWeight="600" opacity={0.6}>
          FAST BRANCH (syntax)
        </text>
        <text x={slowX + slowW / 2} y={slowY - 3} textAnchor="middle"
          fill={SLOW_COLOR} fontSize="10" fontWeight="600" opacity={0.6}>
          SLOW BRANCH (topic)
        </text>

        {/* Branch panels */}
        <BranchPanel name="Fast Branch" color={FAST_COLOR}
          data={step.fast} x={fastX} y={fastY} width={fastW} height={fastH} />
        <BranchPanel name="Slow Branch" color={SLOW_COLOR}
          data={step.slow} x={slowX} y={slowY} width={slowW} height={slowH} />

        {/* Connecting lines from branches to trunk */}
        <line x1={fastX + fastW} y1={fastY + fastH / 2}
          x2={trunkX} y2={trunkY + 30}
          stroke="#475569" strokeWidth={1} strokeDasharray="4,4" />
        <line x1={slowX + slowW} y1={slowY + slowH / 2}
          x2={trunkX} y2={trunkY + 70}
          stroke="#475569" strokeWidth={1} strokeDasharray="4,4" />

        {/* Output labels on connecting lines */}
        <text x={(fastX + fastW + trunkX) / 2} y={(fastY + fastH / 2 + trunkY + 30) / 2 - 6}
          textAnchor="middle" fill={FAST_COLOR} fontSize="9" opacity={0.7}>
          C\u00B7h = {step.fast.output.toFixed(2)}
        </text>
        <text x={(slowX + slowW + trunkX) / 2} y={(slowY + slowH / 2 + trunkY + 70) / 2 + 10}
          textAnchor="middle" fill={SLOW_COLOR} fontSize="9" opacity={0.7}>
          C\u00B7h = {step.slow.output.toFixed(2)}
        </text>

        {/* Trunk panel */}
        <TrunkPanel data={step.trunk} x={trunkX} y={trunkY}
          width={trunkW} height={trunkH} showGlow={showGlow} />

        {/* Modulation arrows (only when mod > 0) */}
        <ModulationArrows
          trunkX={trunkX} trunkY={trunkY} trunkW={trunkW}
          fastX={fastX} fastY={fastY} fastH={fastH}
          slowX={slowX} slowY={slowY} slowH={slowH}
          active={showGlow} />
      </svg>

      {/* Step narrative */}
      <div className="mt-2 text-sm text-slate-300 bg-slate-700/50 rounded-lg px-3 py-2">
        Token <span className="font-mono text-violet-400">"{step.token}"</span>
        {' \u2014 '}
        <span className="text-blue-300">Fast: {step.fast.output.toFixed(2)}</span>
        {' | '}
        <span className="text-amber-300">Slow: {step.slow.output.toFixed(2)}</span>
        {' | '}
        <span className="text-purple-300">Trunk: {step.trunk.label}</span>
      </div>

      {showGlow && (
        <div className="mt-1 text-xs text-purple-300 bg-purple-900/30 border border-purple-700/50 rounded-lg px-3 py-1.5">
          The trunk detects a sentence boundary and sends a modulation signal back to the branches,
          nudging them to reset or shift their states.
        </div>
      )}
    </div>
  )
}

export default MambaTokenStepViz
