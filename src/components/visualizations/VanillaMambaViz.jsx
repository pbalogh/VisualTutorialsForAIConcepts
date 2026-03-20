/**
 * VanillaMambaViz — Vanilla Mamba Hidden State Visualization
 *
 * Shows how REAL (non-dendritic) Mamba processes tokens: 16 independent channels,
 * each with a 4-cell state vector. No branches, no trunk, no grouping.
 * Contrasts with MambaTokenStepViz to make the dendritic proposal visually obvious.
 */

import React, { useState } from 'react'

const TOKENS = ['The', 'cat', 'sat', '.', 'A', 'dog']

// 16 channels × 4 state dims + 1 delta value per token
// Channels 0-3 happen to track syntax-like patterns (reset at period)
// Channels 8-11 happen to track content-like patterns (persist through period)
// Others are mixed — but we don't label any of this
const TOKEN_DATA = [
  // "The" — all channels low-moderate delta, small initial states
  {
    channels: [
      { h: [0.08, 0.05, 0.03, 0.06], delta: 0.05 },
      { h: [0.04, 0.07, 0.02, 0.05], delta: 0.06 },
      { h: [0.06, 0.03, 0.08, 0.04], delta: 0.04 },
      { h: [0.03, 0.06, 0.05, 0.07], delta: 0.07 },
      { h: [0.05, 0.04, 0.06, 0.03], delta: 0.05 },
      { h: [0.07, 0.02, 0.04, 0.08], delta: 0.03 },
      { h: [0.02, 0.08, 0.03, 0.05], delta: 0.06 },
      { h: [0.06, 0.05, 0.07, 0.02], delta: 0.08 },
      { h: [0.04, 0.06, 0.05, 0.03], delta: 0.04 },
      { h: [0.03, 0.05, 0.02, 0.07], delta: 0.05 },
      { h: [0.07, 0.03, 0.06, 0.04], delta: 0.06 },
      { h: [0.05, 0.04, 0.08, 0.06], delta: 0.03 },
      { h: [0.06, 0.07, 0.04, 0.02], delta: 0.07 },
      { h: [0.02, 0.06, 0.05, 0.08], delta: 0.04 },
      { h: [0.08, 0.02, 0.07, 0.03], delta: 0.05 },
      { h: [0.04, 0.08, 0.03, 0.05], delta: 0.06 },
    ],
  },
  // "cat" — ch0-3: moderate delta, moderate growth; ch8-11: higher delta, more growth; others: mixed
  {
    channels: [
      { h: [0.15, 0.12, 0.08, 0.14], delta: 0.05 },
      { h: [0.10, 0.18, 0.06, 0.11], delta: 0.06 },
      { h: [0.12, 0.08, 0.16, 0.09], delta: 0.04 },
      { h: [0.08, 0.14, 0.11, 0.15], delta: 0.07 },
      { h: [0.20, 0.10, 0.14, 0.08], delta: 0.05 },
      { h: [0.06, 0.22, 0.09, 0.16], delta: 0.08 },
      { h: [0.14, 0.05, 0.18, 0.12], delta: 0.04 },
      { h: [0.09, 0.15, 0.07, 0.20], delta: 0.06 },
      { h: [0.25, 0.18, 0.22, 0.15], delta: 0.07 },
      { h: [0.20, 0.28, 0.16, 0.24], delta: 0.08 },
      { h: [0.22, 0.14, 0.30, 0.19], delta: 0.09 },
      { h: [0.18, 0.26, 0.20, 0.28], delta: 0.06 },
      { h: [0.10, 0.08, 0.12, 0.06], delta: 0.03 },
      { h: [0.16, 0.11, 0.09, 0.14], delta: 0.05 },
      { h: [0.07, 0.19, 0.13, 0.10], delta: 0.07 },
      { h: [0.13, 0.06, 0.17, 0.08], delta: 0.04 },
    ],
  },
  // "sat" — ch0-3: higher delta, large state change; ch8-11: low delta, barely change; others: mixed
  {
    channels: [
      { h: [0.35, 0.28, 0.20, 0.32], delta: 0.08 },
      { h: [0.22, 0.40, 0.15, 0.30], delta: 0.09 },
      { h: [0.30, 0.18, 0.38, 0.22], delta: 0.07 },
      { h: [0.18, 0.35, 0.25, 0.40], delta: 0.08 },
      { h: [0.15, 0.12, 0.18, 0.10], delta: 0.04 },
      { h: [0.08, 0.25, 0.12, 0.20], delta: 0.06 },
      { h: [0.28, 0.10, 0.22, 0.16], delta: 0.07 },
      { h: [0.12, 0.20, 0.10, 0.24], delta: 0.05 },
      { h: [0.26, 0.19, 0.23, 0.16], delta: 0.03 },
      { h: [0.21, 0.29, 0.17, 0.25], delta: 0.02 },
      { h: [0.23, 0.15, 0.31, 0.20], delta: 0.04 },
      { h: [0.19, 0.27, 0.21, 0.29], delta: 0.02 },
      { h: [0.22, 0.16, 0.28, 0.12], delta: 0.08 },
      { h: [0.10, 0.18, 0.14, 0.22], delta: 0.03 },
      { h: [0.16, 0.08, 0.20, 0.14], delta: 0.05 },
      { h: [0.24, 0.12, 0.26, 0.10], delta: 0.06 },
    ],
  },
  // "." — ch0-3: very high delta, states go to ~0 (RESET); ch8-11: very low delta, states preserved; others: mixed
  {
    channels: [
      { h: [0.02, 0.01, 0.03, 0.01], delta: 0.09 },
      { h: [0.01, 0.03, 0.01, 0.02], delta: 0.09 },
      { h: [0.03, 0.01, 0.02, 0.01], delta: 0.08 },
      { h: [0.01, 0.02, 0.01, 0.03], delta: 0.08 },
      { h: [0.10, 0.06, 0.12, 0.04], delta: 0.06 },
      { h: [0.04, 0.18, 0.08, 0.14], delta: 0.04 },
      { h: [0.05, 0.03, 0.08, 0.04], delta: 0.08 },
      { h: [0.08, 0.14, 0.06, 0.18], delta: 0.03 },
      { h: [0.25, 0.18, 0.22, 0.15], delta: 0.01 },
      { h: [0.20, 0.28, 0.16, 0.24], delta: 0.02 },
      { h: [0.22, 0.14, 0.30, 0.19], delta: 0.01 },
      { h: [0.18, 0.26, 0.20, 0.28], delta: 0.02 },
      { h: [0.06, 0.04, 0.08, 0.02], delta: 0.09 },
      { h: [0.14, 0.10, 0.08, 0.16], delta: 0.02 },
      { h: [0.03, 0.12, 0.06, 0.04], delta: 0.07 },
      { h: [0.18, 0.08, 0.20, 0.06], delta: 0.05 },
    ],
  },
  // "A" — ch0-3: moderate delta, states rebuild from near-zero; ch8-11: slightly higher delta; others: mixed
  {
    channels: [
      { h: [0.10, 0.06, 0.08, 0.05], delta: 0.06 },
      { h: [0.05, 0.12, 0.04, 0.08], delta: 0.07 },
      { h: [0.08, 0.04, 0.10, 0.06], delta: 0.05 },
      { h: [0.04, 0.09, 0.06, 0.11], delta: 0.06 },
      { h: [0.08, 0.05, 0.10, 0.04], delta: 0.04 },
      { h: [0.05, 0.15, 0.07, 0.12], delta: 0.05 },
      { h: [0.12, 0.04, 0.14, 0.08], delta: 0.06 },
      { h: [0.06, 0.10, 0.05, 0.14], delta: 0.04 },
      { h: [0.22, 0.16, 0.20, 0.14], delta: 0.04 },
      { h: [0.18, 0.25, 0.15, 0.22], delta: 0.05 },
      { h: [0.20, 0.13, 0.28, 0.17], delta: 0.04 },
      { h: [0.16, 0.24, 0.18, 0.26], delta: 0.05 },
      { h: [0.08, 0.05, 0.10, 0.04], delta: 0.05 },
      { h: [0.12, 0.09, 0.07, 0.14], delta: 0.04 },
      { h: [0.06, 0.14, 0.10, 0.07], delta: 0.06 },
      { h: [0.15, 0.07, 0.18, 0.05], delta: 0.05 },
    ],
  },
  // "dog" — ch0-3: moderate delta, similar to "cat" pattern; ch8-11: high delta, states shift significantly; others: mixed
  {
    channels: [
      { h: [0.16, 0.12, 0.10, 0.14], delta: 0.05 },
      { h: [0.10, 0.20, 0.08, 0.15], delta: 0.07 },
      { h: [0.14, 0.08, 0.18, 0.10], delta: 0.05 },
      { h: [0.08, 0.16, 0.12, 0.18], delta: 0.06 },
      { h: [0.12, 0.08, 0.14, 0.06], delta: 0.05 },
      { h: [0.06, 0.18, 0.10, 0.16], delta: 0.07 },
      { h: [0.18, 0.06, 0.20, 0.12], delta: 0.05 },
      { h: [0.08, 0.14, 0.07, 0.18], delta: 0.04 },
      { h: [0.10, 0.30, 0.12, 0.28], delta: 0.08 },
      { h: [0.32, 0.12, 0.28, 0.10], delta: 0.09 },
      { h: [0.08, 0.35, 0.14, 0.32], delta: 0.07 },
      { h: [0.30, 0.10, 0.34, 0.14], delta: 0.08 },
      { h: [0.10, 0.07, 0.14, 0.05], delta: 0.06 },
      { h: [0.16, 0.12, 0.10, 0.18], delta: 0.04 },
      { h: [0.08, 0.20, 0.14, 0.10], delta: 0.07 },
      { h: [0.20, 0.10, 0.24, 0.08], delta: 0.06 },
    ],
  },
]

// Heatmap color: value 0 → dark blue/black, high → bright red/yellow
function heatColor(value, maxVal = 0.4) {
  const t = Math.min(value / maxVal, 1)
  if (t < 0.25) {
    // black → dark blue
    const s = t / 0.25
    return `rgb(${Math.round(s * 20)}, ${Math.round(s * 30)}, ${Math.round(40 + s * 80)})`
  } else if (t < 0.5) {
    // dark blue → blue
    const s = (t - 0.25) / 0.25
    return `rgb(${Math.round(20 + s * 20)}, ${Math.round(30 + s * 60)}, ${Math.round(120 + s * 60)})`
  } else if (t < 0.75) {
    // blue → orange/red
    const s = (t - 0.5) / 0.25
    return `rgb(${Math.round(40 + s * 200)}, ${Math.round(90 - s * 30)}, ${Math.round(180 - s * 140)})`
  } else {
    // red → bright yellow
    const s = (t - 0.75) / 0.25
    return `rgb(${Math.round(240 + s * 15)}, ${Math.round(60 + s * 180)}, ${Math.round(40 + s * 40)})`
  }
}

// Delta bar color: low → dim teal, high → bright green
function deltaColor(value) {
  const t = Math.min(value / 0.1, 1)
  return `rgb(${Math.round(30 + t * 50)}, ${Math.round(120 + t * 135)}, ${Math.round(100 + t * 80)})`
}

function ChannelCell({ channel, idx, cellSize, deltaBarWidth }) {
  const gapX = 1
  const totalW = channel.h.length * (cellSize + gapX) + deltaBarWidth + 4
  const maxDelta = 0.1
  const deltaH = Math.max((channel.delta / maxDelta) * cellSize * 2, 2)

  return (
    <g>
      {/* State cells (4 colored squares) */}
      {channel.h.map((val, di) => (
        <rect
          key={di}
          x={di * (cellSize + gapX)}
          y={0}
          width={cellSize}
          height={cellSize}
          fill={heatColor(val)}
          rx={1}
        >
          <title>ch{idx} dim{di}: {val.toFixed(3)}</title>
        </rect>
      ))}
      {/* Delta bar */}
      <rect
        x={channel.h.length * (cellSize + gapX) + 3}
        y={cellSize * 2 - deltaH}
        width={deltaBarWidth}
        height={deltaH}
        fill={deltaColor(channel.delta)}
        rx={1}
      >
        <title>ch{idx} Δ: {channel.delta.toFixed(3)}</title>
      </rect>
    </g>
  )
}

export function VanillaMambaViz() {
  const [tokenIdx, setTokenIdx] = useState(0)
  const data = TOKEN_DATA[tokenIdx]

  const cellSize = 14
  const gapX = 1
  const deltaBarWidth = 6
  const channelW = 4 * (cellSize + gapX) + deltaBarWidth + 4
  const channelH = cellSize * 2 + 4
  const cols = 4
  const rows = 4
  const gridGapX = 12
  const gridGapY = 18
  const labelH = 14
  const gridOffsetX = 30
  const gridOffsetY = 10

  const svgW = gridOffsetX + cols * (channelW + gridGapX) + 10
  const svgH = gridOffsetY + rows * (channelH + labelH + gridGapY) + 4

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 my-6">
      {/* Controls */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <button
          onClick={() => setTokenIdx(Math.max(0, tokenIdx - 1))}
          disabled={tokenIdx === 0}
          className="px-3 py-1 rounded-md text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Prev
        </button>
        <button
          onClick={() => setTokenIdx(Math.min(TOKENS.length - 1, tokenIdx + 1))}
          disabled={tokenIdx === TOKENS.length - 1}
          className="px-3 py-1 rounded-md text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Next Token
        </button>
        <span className="text-slate-400 text-sm">
          Step {tokenIdx + 1}/{TOKENS.length}
        </span>
        <button
          onClick={() => setTokenIdx(0)}
          className="ml-auto px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 bg-slate-700/50 hover:bg-slate-700 transition-all"
        >
          Reset
        </button>
      </div>

      {/* Sentence display */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        <span className="text-slate-500 text-xs mr-1">Sentence:</span>
        {TOKENS.map((t, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded text-sm font-mono ${
              i === tokenIdx
                ? 'bg-violet-600 text-white'
                : i < tokenIdx
                ? 'text-slate-400'
                : 'text-slate-600'
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Channel grid */}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 420 }}>
        {Array.from({ length: 16 }, (_, i) => {
          const row = Math.floor(i / cols)
          const col = i % cols
          const x = gridOffsetX + col * (channelW + gridGapX)
          const y = gridOffsetY + row * (channelH + labelH + gridGapY)
          const ch = data.channels[i]

          return (
            <g key={i} transform={`translate(${x}, ${y})`}>
              {/* Channel label */}
              <text x={0} y={-3} fill="#64748b" fontSize="9" fontFamily="monospace">
                ch{i}
              </text>
              <text x={channelW - 2} y={-3} textAnchor="end" fill="#4ade80" fontSize="8" fontFamily="monospace" opacity={0.7}>
                Δ{ch.delta.toFixed(2)}
              </text>
              <ChannelCell channel={ch} idx={i} cellSize={cellSize} deltaBarWidth={deltaBarWidth} />
            </g>
          )
        })}
      </svg>

      {/* Scale info */}
      <div className="mt-3 text-xs text-slate-400 flex items-center gap-4 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: heatColor(0) }} />
          Low
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: heatColor(0.15) }} />
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: heatColor(0.3) }} />
          High
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: heatColor(0.4) }} />
          <span className="ml-1 text-slate-500">(state values)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-4 rounded-sm" style={{ background: deltaColor(0.02) }} />
          <span className="inline-block w-2 h-4 rounded-sm" style={{ background: deltaColor(0.09) }} />
          <span className="text-slate-500">(Δ bars)</span>
        </span>
      </div>

      {/* Key stat line */}
      <div className="mt-2 text-sm text-slate-300 bg-slate-700/50 rounded-lg px-3 py-2 font-mono">
        16 channels × 4 state dims = <strong className="text-slate-100">64</strong> values.{' '}
        <span className="text-slate-400">
          Real Mamba: 1,536 channels × 16 state dims = <strong className="text-slate-300">24,576</strong> values.
        </span>
      </div>
    </div>
  )
}

export default VanillaMambaViz
