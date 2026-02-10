/**
 * D3Canvas — Generic Declarative 2D Visualization Component
 * 
 * Renders any 2D scene from a JSON spec. The AI generates the spec,
 * this component renders it. Supports:
 * - Shapes: circle, rect, ellipse, line, path, polygon
 * - Arrows: with configurable heads, curved or straight
 * - Text/Labels: positioned, styled, rotatable
 * - Axes: x/y with ticks and labels
 * - Grid: coordinate grid with configurable spacing
 * - Groups: nested element grouping with transforms
 * - Arcs: for angles, partial circles
 * 
 * Usage:
 *   <D3Canvas spec={{
 *     width: 600, height: 400,
 *     background: '#ffffff',
 *     grid: { show: true, step: 50 },
 *     origin: { x: 300, y: 200 },
 *     elements: [
 *       { type: 'circle', cx: 100, cy: 100, r: 30, fill: '#6366f1', label: 'A' },
 *       { type: 'arrow', from: [130, 100], to: [250, 100], color: '#333', label: 'f' },
 *       { type: 'rect', x: 250, y: 75, width: 80, height: 50, fill: '#10b981', label: 'B' },
 *     ]
 *   }} />
 */

import React, { useRef, useEffect } from 'react'
import * as d3 from 'd3'

const PALETTE = [
  '#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#3b82f6',
  '#ec4899', '#14b8a6', '#8b5cf6', '#f97316', '#06b6d4',
]

function ensureArrowMarker(svg, color, id) {
  const markerId = `arrow-${id}-${color.replace(/[^a-zA-Z0-9]/g, '')}`
  if (!svg.select(`#${markerId}`).node()) {
    svg.select('defs').append('marker')
      .attr('id', markerId)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9).attr('refY', 5)
      .attr('markerWidth', 8).attr('markerHeight', 8)
      .attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', color)
  }
  return `url(#${markerId})`
}

// ─── Element renderers ──────────────────────────────────────────────────────

function renderCircle(g, el, i) {
  const c = g.append('circle')
    .attr('cx', el.cx || 0).attr('cy', el.cy || 0).attr('r', el.r || 20)
    .attr('fill', el.fill || PALETTE[i % PALETTE.length])
    .attr('fill-opacity', el.fillOpacity ?? 0.8)
    .attr('stroke', el.stroke || 'none').attr('stroke-width', el.strokeWidth || 0)
  if (el.tooltip) c.append('title').text(el.tooltip)
  if (el.label) {
    g.append('text').attr('x', el.cx || 0).attr('y', el.cy || 0)
      .attr('dy', '0.35em').attr('text-anchor', 'middle')
      .attr('fill', el.labelColor || '#fff').attr('font-size', el.labelSize || 14)
      .attr('font-weight', 600).text(el.label)
  }
}

function renderRect(g, el, i) {
  g.append('rect')
    .attr('x', el.x || 0).attr('y', el.y || 0)
    .attr('width', el.width || 60).attr('height', el.height || 40)
    .attr('rx', el.rx || el.cornerRadius || 0)
    .attr('fill', el.fill || PALETTE[i % PALETTE.length])
    .attr('fill-opacity', el.fillOpacity ?? 0.8)
    .attr('stroke', el.stroke || 'none').attr('stroke-width', el.strokeWidth || 0)
  if (el.label) {
    g.append('text')
      .attr('x', (el.x || 0) + (el.width || 60) / 2)
      .attr('y', (el.y || 0) + (el.height || 40) / 2)
      .attr('dy', '0.35em').attr('text-anchor', 'middle')
      .attr('fill', el.labelColor || '#fff').attr('font-size', el.labelSize || 13)
      .attr('font-weight', 600).text(el.label)
  }
}

function renderEllipse(g, el, i) {
  g.append('ellipse')
    .attr('cx', el.cx || 0).attr('cy', el.cy || 0)
    .attr('rx', el.rx || 40).attr('ry', el.ry || 25)
    .attr('fill', el.fill || PALETTE[i % PALETTE.length])
    .attr('fill-opacity', el.fillOpacity ?? 0.8)
    .attr('stroke', el.stroke || 'none').attr('stroke-width', el.strokeWidth || 0)
  if (el.label) {
    g.append('text').attr('x', el.cx || 0).attr('y', el.cy || 0)
      .attr('dy', '0.35em').attr('text-anchor', 'middle')
      .attr('fill', el.labelColor || '#fff').attr('font-size', el.labelSize || 13)
      .attr('font-weight', 600).text(el.label)
  }
}

function renderLine(g, el) {
  g.append('line')
    .attr('x1', el.x1 ?? (el.from?.[0] || 0)).attr('y1', el.y1 ?? (el.from?.[1] || 0))
    .attr('x2', el.x2 ?? (el.to?.[0] || 0)).attr('y2', el.y2 ?? (el.to?.[1] || 0))
    .attr('stroke', el.color || el.stroke || '#333')
    .attr('stroke-width', el.strokeWidth || 2)
    .attr('stroke-dasharray', el.dashed ? (el.dashArray || '5,5') : 'none')
    .attr('opacity', el.opacity ?? 1)
}

function renderArrow(svg, g, el, uid) {
  const from = el.from || [0, 0], to = el.to || [100, 0]
  const color = el.color || '#333'
  const marker = ensureArrowMarker(svg, color, uid)
  if (el.curved) {
    const mx = (from[0] + to[0]) / 2, my = (from[1] + to[1]) / 2
    const dx = to[0] - from[0], dy = to[1] - from[1]
    const c = el.curvature || 0.3
    g.append('path')
      .attr('d', `M ${from[0]} ${from[1]} Q ${mx - dy * c} ${my + dx * c} ${to[0]} ${to[1]}`)
      .attr('stroke', color).attr('stroke-width', el.strokeWidth || 2)
      .attr('fill', 'none').attr('marker-end', marker)
  } else {
    g.append('line')
      .attr('x1', from[0]).attr('y1', from[1]).attr('x2', to[0]).attr('y2', to[1])
      .attr('stroke', color).attr('stroke-width', el.strokeWidth || 2)
      .attr('stroke-dasharray', el.dashed ? '5,5' : 'none')
      .attr('marker-end', marker)
  }
  if (el.label) {
    g.append('text')
      .attr('x', el.labelX ?? (from[0] + to[0]) / 2)
      .attr('y', el.labelY ?? (from[1] + to[1]) / 2 - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', el.labelColor || color).attr('font-size', el.labelSize || 12)
      .attr('font-weight', 500).attr('font-style', el.labelItalic ? 'italic' : 'normal')
      .text(el.label)
  }
}

function renderText(g, el) {
  const t = g.append('text')
    .attr('x', el.x || 0).attr('y', el.y || 0)
    .attr('text-anchor', el.anchor || 'middle')
    .attr('fill', el.fill || el.color || '#333')
    .attr('font-size', el.fontSize || el.size || 14)
    .attr('font-weight', el.fontWeight || 'normal')
    .attr('font-style', el.italic ? 'italic' : 'normal')
    .attr('opacity', el.opacity ?? 1)
    .text(el.text || el.label || '')
  if (el.rotate) t.attr('transform', `rotate(${el.rotate}, ${el.x || 0}, ${el.y || 0})`)
}

function renderPath(g, el, i) {
  g.append('path')
    .attr('d', el.d || el.path || '')
    .attr('fill', el.fill || 'none')
    .attr('stroke', el.stroke || el.color || PALETTE[i % PALETTE.length])
    .attr('stroke-width', el.strokeWidth || 2)
    .attr('stroke-dasharray', el.dashed ? '5,5' : 'none')
}

function renderPolygon(g, el, i) {
  const pts = (el.points || []).map(p => Array.isArray(p) ? p.join(',') : `${p.x},${p.y}`).join(' ')
  g.append('polygon').attr('points', pts)
    .attr('fill', el.fill || PALETTE[i % PALETTE.length])
    .attr('fill-opacity', el.fillOpacity ?? 0.6)
    .attr('stroke', el.stroke || 'none').attr('stroke-width', el.strokeWidth || 0)
  if (el.label && el.points?.length) {
    const cx = el.points.reduce((s, p) => s + (Array.isArray(p) ? p[0] : p.x), 0) / el.points.length
    const cy = el.points.reduce((s, p) => s + (Array.isArray(p) ? p[1] : p.y), 0) / el.points.length
    g.append('text').attr('x', cx).attr('y', cy).attr('dy', '0.35em')
      .attr('text-anchor', 'middle').attr('fill', el.labelColor || '#fff')
      .attr('font-size', 12).text(el.label)
  }
}

function renderArc(g, el, i) {
  const cx = el.cx || 0, cy = el.cy || 0, r = el.r || 30
  const s = (el.startAngle || 0) * Math.PI / 180
  const e = (el.endAngle || 90) * Math.PI / 180
  const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s)
  const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e)
  const la = Math.abs(e - s) > Math.PI ? 1 : 0
  g.append('path')
    .attr('d', `M ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2}`)
    .attr('fill', 'none').attr('stroke', el.stroke || el.color || PALETTE[i % PALETTE.length])
    .attr('stroke-width', el.strokeWidth || 2)
  if (el.label) {
    const m = (s + e) / 2, lr = r + 15
    g.append('text').attr('x', cx + lr * Math.cos(m)).attr('y', cy + lr * Math.sin(m))
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('fill', el.labelColor || '#333').attr('font-size', 12).text(el.label)
  }
}

// ─── Grid ───────────────────────────────────────────────────────────────────

function renderGrid(g, grid, w, h, origin) {
  const step = grid.step || 50
  const color = grid.color || '#e5e7eb'
  const axisColor = grid.axisColor || '#333'
  const ox = origin?.x ?? w / 2, oy = origin?.y ?? h / 2

  for (let x = ox % step; x <= w; x += step) {
    const isAxis = Math.abs(x - ox) < 1
    g.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', h)
      .attr('stroke', isAxis ? axisColor : color)
      .attr('stroke-width', isAxis ? 1.5 : 0.5).attr('opacity', isAxis ? 0.8 : 0.4)
  }
  for (let y = oy % step; y <= h; y += step) {
    const isAxis = Math.abs(y - oy) < 1
    g.append('line').attr('x1', 0).attr('y1', y).attr('x2', w).attr('y2', y)
      .attr('stroke', isAxis ? axisColor : color)
      .attr('stroke-width', isAxis ? 1.5 : 0.5).attr('opacity', isAxis ? 0.8 : 0.4)
  }
  if (grid.showLabels !== false && origin) {
    for (let x = ox + step; x <= w; x += step)
      g.append('text').attr('x', x).attr('y', oy + 15).attr('text-anchor', 'middle')
        .attr('fill', '#999').attr('font-size', 10).text(Math.round((x - ox) / step))
    for (let x = ox - step; x >= 0; x -= step)
      g.append('text').attr('x', x).attr('y', oy + 15).attr('text-anchor', 'middle')
        .attr('fill', '#999').attr('font-size', 10).text(Math.round((x - ox) / step))
    for (let y = oy - step; y >= 0; y -= step)
      g.append('text').attr('x', ox - 10).attr('y', y + 4).attr('text-anchor', 'end')
        .attr('fill', '#999').attr('font-size', 10).text(Math.round((oy - y) / step))
    for (let y = oy + step; y <= h; y += step)
      g.append('text').attr('x', ox - 10).attr('y', y + 4).attr('text-anchor', 'end')
        .attr('fill', '#999').attr('font-size', 10).text(Math.round((oy - y) / step))
  }
}

// ─── Axis ───────────────────────────────────────────────────────────────────

function renderAxis(g, axis, w, h) {
  const orient = axis.orient || 'bottom'
  const domain = axis.domain || [0, 10]
  const ticks = axis.ticks || 5
  const color = axis.color || '#333'
  let scale, axisGen, transform
  if (orient === 'bottom' || orient === 'top') {
    scale = d3.scaleLinear().domain(domain).range([40, w - 20])
    axisGen = orient === 'bottom' ? d3.axisBottom(scale) : d3.axisTop(scale)
    transform = `translate(0, ${orient === 'bottom' ? h - 30 : 30})`
  } else {
    scale = d3.scaleLinear().domain(domain).range([h - 30, 20])
    axisGen = orient === 'left' ? d3.axisLeft(scale) : d3.axisRight(scale)
    transform = `translate(${orient === 'left' ? 40 : w - 20}, 0)`
  }
  const ag = g.append('g').attr('transform', transform).call(axisGen.ticks(ticks))
  ag.selectAll('text').attr('fill', color)
  ag.selectAll('line,path').attr('stroke', color)
  if (axis.label) {
    if (orient === 'bottom') g.append('text').attr('x', w / 2).attr('y', h - 2).attr('text-anchor', 'middle').attr('fill', color).attr('font-size', 13).text(axis.label)
    if (orient === 'left') g.append('text').attr('x', -h / 2).attr('y', 14).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('fill', color).attr('font-size', 13).text(axis.label)
  }
}

// ─── Dispatcher ─────────────────────────────────────────────────────────────

function renderElement(svg, g, el, i, uid) {
  const eg = g.append('g')
  if (el.transform) eg.attr('transform', el.transform)
  if (el.opacity !== undefined) eg.attr('opacity', el.opacity)
  if (el.id) eg.attr('data-id', el.id)

  switch (el.type) {
    case 'circle': renderCircle(eg, el, i); break
    case 'rect': renderRect(eg, el, i); break
    case 'ellipse': renderEllipse(eg, el, i); break
    case 'line': renderLine(eg, el); break
    case 'arrow': renderArrow(svg, eg, el, `${uid}-${i}`); break
    case 'text': renderText(eg, el); break
    case 'path': renderPath(eg, el, i); break
    case 'polygon': renderPolygon(eg, el, i); break
    case 'arc': renderArc(eg, el, i); break
    case 'group':
      (el.children || el.elements || []).forEach((c, j) => renderElement(svg, eg, c, j, `${uid}-${i}`))
      break
    default: console.warn(`D3Canvas: unknown element type "${el.type}"`)
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function D3Canvas({ spec, className = '' }) {
  const svgRef = useRef(null)
  const uid = useRef(`d3c-${Math.random().toString(36).slice(2, 8)}`).current

  useEffect(() => {
    if (!spec || !svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const w = spec.width || 600, h = spec.height || 400
    svg.attr('width', w).attr('height', h)
    svg.append('rect').attr('width', w).attr('height', h).attr('fill', spec.background || '#fff').attr('rx', spec.borderRadius || 0)
    svg.append('defs')
    if (spec.grid) { renderGrid(svg.append('g'), spec.grid, w, h, spec.origin) }
    if (spec.axes) { const ag = svg.append('g'); spec.axes.forEach(a => renderAxis(ag, a, w, h)) }
    const eg = svg.append('g').attr('class', 'elements')
    ;(spec.elements || []).forEach((el, i) => renderElement(svg, eg, el, i, uid))
    if (spec.title) {
      svg.append('text').attr('x', w / 2).attr('y', 24).attr('text-anchor', 'middle')
        .attr('fill', spec.titleColor || '#333').attr('font-size', spec.titleSize || 16)
        .attr('font-weight', 600).text(spec.title)
    }
  }, [spec, uid])

  if (!spec) return null
  const w = spec.width || 600, h = spec.height || 400

  return (
    <div className={`d3-canvas-wrapper ${className}`}>
      <svg ref={svgRef} className="rounded-lg border border-gray-200 shadow-sm"
        style={{ maxWidth: '100%', height: 'auto' }} viewBox={`0 0 ${w} ${h}`} />
      {spec.caption && <p className="text-sm text-gray-500 mt-2 text-center italic">{spec.caption}</p>}
    </div>
  )
}

// ─── Vector spec helper (replicates Vector2DTemplate) ───────────────────────

export function vectorSpec({ vectorA = [3, 2], vectorB = [4, 0], showProjection = true, labels = { a: 'a', b: 'b' }, width = 500, height = 350 }) {
  const s = 50, ox = width / 2, oy = height / 2
  const toX = v => ox + v[0] * s, toY = v => oy - v[1] * s
  const dot = vectorA[0] * vectorB[0] + vectorA[1] * vectorB[1]
  const bLenSq = vectorB[0] ** 2 + vectorB[1] ** 2
  const ps = bLenSq > 0 ? dot / bLenSq : 0
  const proj = [vectorB[0] * ps, vectorB[1] * ps]

  const elements = [
    { type: 'arrow', from: [ox, oy], to: [toX(vectorB), toY(vectorB)], color: '#3b82f6', strokeWidth: 3, label: labels.b, labelColor: '#3b82f6' },
    { type: 'arrow', from: [ox, oy], to: [toX(vectorA), toY(vectorA)], color: '#ef4444', strokeWidth: 3, label: labels.a, labelColor: '#ef4444' },
  ]
  if (showProjection) {
    elements.push(
      { type: 'arrow', from: [ox, oy], to: [toX(proj), toY(proj)], color: '#22c55e', strokeWidth: 3, label: 'proj', labelColor: '#22c55e' },
      { type: 'line', from: [toX(vectorA), toY(vectorA)], to: [toX(proj), toY(proj)], color: '#9ca3af', strokeWidth: 1, dashed: true },
    )
  }
  return { width, height, background: '#fff', grid: { show: true, step: s, showLabels: true }, origin: { x: ox, y: oy }, elements, caption: `a = [${vectorA}], b = [${vectorB}], a·b = ${dot.toFixed(1)}` }
}
