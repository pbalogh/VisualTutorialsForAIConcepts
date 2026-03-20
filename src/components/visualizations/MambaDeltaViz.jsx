/**
 * MambaDeltaViz — Interactive Delta Computation Pipeline
 *
 * Shows how Δ is computed for a single token through the pipeline:
 * x_t → Linear_in → Δ projection (bottleneck) → softplus → Δ_t
 * Key insight: Δ is per-channel, not a single scalar.
 */

import React, { useState, useMemo } from 'react'

const TOKENS = [
  {
    label: 'The',
    embedding: [0.2, 0.1, -0.1, 0.3],
    expanded: [0.15, 0.10, 0.08, 0.12, 0.04, 0.03, 0.05, 0.02],
    bottleneck: [0.06, 0.03],
    deltaRaw: [-2.5, -2.6, -2.9, -2.8, -3.5, -3.8, -3.2, -3.6],
    delta: [0.08, 0.07, 0.05, 0.06, 0.03, 0.02, 0.04, 0.03],
    description: 'Function word — low Δ across all channels',
  },
  {
    label: 'cat',
    embedding: [0.8, -0.3, 0.5, 0.1],
    expanded: [0.20, 0.18, 0.12, 0.16, 0.55, 0.48, 0.60, 0.42],
    bottleneck: [0.14, 0.52],
    deltaRaw: [-2.7, -2.4, -3.0, -2.6, -0.9, -1.1, -0.7, -1.2],
    delta: [0.06, 0.09, 0.05, 0.07, 0.33, 0.27, 0.37, 0.25],
    description: 'Content noun — high Δ in topic channels (4–7)',
  },
  {
    label: 'sat',
    embedding: [-0.2, 0.7, 0.4, -0.5],
    expanded: [0.45, 0.40, 0.50, 0.35, 0.12, 0.10, 0.08, 0.14],
    bottleneck: [0.42, 0.11],
    deltaRaw: [-1.0, -1.2, -0.8, -1.3, -3.2, -3.5, -3.0, -3.3],
    delta: [0.31, 0.25, 0.37, 0.21, 0.04, 0.03, 0.05, 0.04],
    description: 'Verb — high Δ in syntax channels (0–3)',
  },
  {
    label: '.',
    embedding: [0.0, 0.0, 0.1, -0.1],
    expanded: [0.60, 0.65, 0.58, 0.62, 0.05, 0.04, 0.06, 0.03],
    bottleneck: [0.61, 0.05],
    deltaRaw: [0.2, 0.3, 0.1, 0.2, -3.8, -4.0, -3.5, -3.9],
    delta: [0.74, 0.78, 0.69, 0.74, 0.02, 0.02, 0.03, 0.02],
    description: 'Sentence boundary — very high syntax Δ (reset!)',
  },
  {
    label: 'A',
    embedding: [0.15, 0.05, -0.05, 0.2],
    expanded: [0.25, 0.22, 0.18, 0.20, 0.15, 0.12, 0.18, 0.10],
    bottleneck: [0.21, 0.14],
    deltaRaw: [-2.0, -2.2, -2.4, -2.1, -2.5, -2.6, -2.3, -2.8],
    delta: [0.13, 0.11, 0.09, 0.12, 0.08, 0.07, 0.10, 0.06],
    description: 'Determiner — moderate Δ across the board',
  },
  {
    label: 'dog',
    embedding: [0.7, -0.4, 0.6, 0.2],
    expanded: [0.18, 0.15, 0.10, 0.14, 0.58, 0.52, 0.62, 0.48],
    bottleneck: [0.14, 0.55],
    deltaRaw: [-2.8, -2.3, -3.1, -2.5, [-0.8, -1.0, -0.6, -1.1]],
    delta: [0.06, 0.10, 0.04, 0.08, 0.36, 0.27, 0.40, 0.27],
    description: 'New topic noun — high Δ in topic channels',
  },
]

// Fixed deltaRaw for "dog" — flatten the nested array
TOKENS[5].deltaRaw = [-2.8, -2.3, -3.1, -2.5, -0.8, -1.0, -0.6, -1.1]

const CHANNEL_COLORS = [
  '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', // Syntax: blues
  '#fbbf24', '#f59e0b', '#d97706', '#b45309', // Topic: ambers
]

const SYNTAX_COLOR = '#3b82f6'
const TOPIC_COLOR = '#f59e0b'

function VectorBar({ values, x, y, barWidth, maxHeight, colors, label, dimLabel }) {
  const maxVal = Math.max(...values.map(Math.abs), 0.01)
  return (
    <g>
      <text x={x + (values.length * (barWidth + 2)) / 2} y={y - maxHeight - 12}
        textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600">
        {label}
      </text>
      {dimLabel && (
        <text x={x + (values.length * (barWidth + 2)) / 2} y={y - maxHeight - 1}
          textAnchor="middle" fill="#64748b" fontSize="9">
          {dimLabel}
        </text>
      )}
      {values.map((v, i) => {
        const absVal = Math.abs(v)
        const h = (absVal / Math.max(maxVal, 0.8)) * maxHeight
        const color = colors ? colors[i % colors.length] : CHANNEL_COLORS[i]
        return (
          <g key={i}>
            <rect x={x + i * (barWidth + 2)} y={y - h} width={barWidth} height={Math.max(h, 1)}
              fill={color} opacity={0.85} rx={1}>
              <title>ch{i}: {v.toFixed(3)}</title>
            </rect>
            <text x={x + i * (barWidth + 2) + barWidth / 2} y={y + 11}
              textAnchor="middle" fill="#64748b" fontSize="7">
              {i}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function PipelineArrow({ x1, y1, x2, y2, label }) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#475569" strokeWidth={1.5} markerEnd="url(#arrowhead)" />
      {label && (
        <text x={mx} y={my - 6} textAnchor="middle" fill="#94a3b8" fontSize="9" fontStyle="italic">
          {label}
        </text>
      )}
    </g>
  )
}

export function MambaDeltaViz() {
  const [tokenIdx, setTokenIdx] = useState(0)
  const token = TOKENS[tokenIdx]

  const svgWidth = 760
  const svgHeight = 340
  const barH = 80
  const stageY = 200

  // Stage x positions
  const stages = [
    { x: 30, w: 4, label: 'x_t', dimLabel: `d_model=${4}` },
    { x: 155, w: 8, label: "x'_t", dimLabel: `d_inner=${8}` },
    { x: 320, w: 2, label: 'bottleneck', dimLabel: `dt_rank=${2}` },
    { x: 440, w: 8, label: 'Δ_raw', dimLabel: '8-dim' },
    { x: 600, w: 8, label: 'Δ_t', dimLabel: '8-dim' },
  ]

  const barW = 12

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 my-6">
      {/* Token selector */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-slate-400 text-sm font-medium mr-1">Token:</span>
        {TOKENS.map((t, i) => (
          <button key={i}
            onClick={() => setTokenIdx(i)}
            className={`px-3 py-1 rounded-md text-sm font-mono transition-all ${
              i === tokenIdx
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Pipeline SVG */}
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full" style={{ maxHeight: 340 }}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#475569" />
          </marker>
        </defs>

        {/* Stage bars */}
        <VectorBar values={token.embedding} x={stages[0].x} y={stageY}
          barWidth={barW} maxHeight={barH}
          colors={['#818cf8', '#818cf8', '#818cf8', '#818cf8']}
          label={stages[0].label} dimLabel={stages[0].dimLabel} />

        <VectorBar values={token.expanded} x={stages[1].x} y={stageY}
          barWidth={barW} maxHeight={barH}
          colors={CHANNEL_COLORS}
          label={stages[1].label} dimLabel={stages[1].dimLabel} />

        <VectorBar values={token.bottleneck} x={stages[2].x} y={stageY}
          barWidth={barW + 4} maxHeight={barH}
          colors={['#a78bfa', '#a78bfa']}
          label={stages[2].label} dimLabel={stages[2].dimLabel} />

        <VectorBar values={token.deltaRaw} x={stages[3].x} y={stageY}
          barWidth={barW} maxHeight={barH}
          colors={CHANNEL_COLORS}
          label={stages[3].label} dimLabel={stages[3].dimLabel} />

        <VectorBar values={token.delta} x={stages[4].x} y={stageY}
          barWidth={barW} maxHeight={barH}
          colors={CHANNEL_COLORS}
          label={stages[4].label} dimLabel={stages[4].dimLabel} />

        {/* Arrows between stages */}
        <PipelineArrow
          x1={stages[0].x + 4 * (barW + 2)} y1={stageY - barH / 2}
          x2={stages[1].x - 8} y2={stageY - barH / 2}
          label="Linear_in" />
        <PipelineArrow
          x1={stages[1].x + 8 * (barW + 2)} y1={stageY - barH / 2}
          x2={stages[2].x - 8} y2={stageY - barH / 2}
          label="Δ proj (down)" />
        <PipelineArrow
          x1={stages[2].x + 2 * (barW + 4 + 2)} y1={stageY - barH / 2}
          x2={stages[3].x - 8} y2={stageY - barH / 2}
          label="Δ proj (up)" />
        <PipelineArrow
          x1={stages[3].x + 8 * (barW + 2)} y1={stageY - barH / 2}
          x2={stages[4].x - 8} y2={stageY - barH / 2}
          label="softplus" />

        {/* Channel legend */}
        <rect x={20} y={stageY + 28} width={10} height={10} fill={SYNTAX_COLOR} rx={2} />
        <text x={34} y={stageY + 37} fill="#93c5fd" fontSize="10">Channels 0–3: Syntax (fast)</text>
        <rect x={200} y={stageY + 28} width={10} height={10} fill={TOPIC_COLOR} rx={2} />
        <text x={214} y={stageY + 37} fill="#fcd34d" fontSize="10">Channels 4–7: Topic (slow)</text>

        {/* Delta magnitude bar chart (larger, bottom) */}
        <text x={svgWidth / 2 + 180} y={stageY + 35} textAnchor="middle"
          fill="#e2e8f0" fontSize="11" fontWeight="600">
          Δ per channel
        </text>
        {token.delta.map((d, i) => {
          const bx = svgWidth / 2 + 80 + i * 28
          const by = svgHeight - 20
          const bh = d * 180
          const color = i < 4 ? SYNTAX_COLOR : TOPIC_COLOR
          return (
            <g key={i}>
              <rect x={bx} y={by - bh} width={20} height={Math.max(bh, 2)}
                fill={color} opacity={0.9} rx={2}>
                <title>Δ[{i}] = {d.toFixed(2)}</title>
              </rect>
              <text x={bx + 10} y={by + 12} textAnchor="middle" fill="#94a3b8" fontSize="9">
                ch{i}
              </text>
              <text x={bx + 10} y={by - bh - 4} textAnchor="middle" fill="#cbd5e1" fontSize="8">
                {d.toFixed(2)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Description */}
      <div className="mt-2 text-sm text-slate-300 bg-slate-700/50 rounded-lg px-3 py-2">
        <span className="font-mono text-violet-400">"{token.label}"</span>
        {' → '}
        {token.description}
      </div>

      {/* Key insight */}
      <div className="mt-2 text-xs text-slate-400 italic">
        Key insight: Δ is <strong className="text-slate-200">per-channel</strong> (8 independent values), not a single scalar.
        Each channel decides independently how much to update its state.
      </div>
    </div>
  )
}

export default MambaDeltaViz
