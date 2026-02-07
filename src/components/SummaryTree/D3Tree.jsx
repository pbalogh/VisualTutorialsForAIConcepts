import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { AnnotatableContent } from '../AnnotationSystem.jsx'

/**
 * D3Tree - Polished hierarchical tree visualization
 * 
 * Design improvements based on critic feedback:
 * - Type hierarchy (root larger, sections medium, leaves regular)
 * - Sophisticated color palette (slate + indigo + amber)
 * - Hover states with lift effect
 * - Animated transitions
 * - Depth through shadows
 */

const X = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// Detail modal component
function DetailModal({ node, onClose, renderContent, tutorialId, onAnnotationRequest }) {
  if (!node) return null
  
  const content = renderContent ? renderContent(node.data || node) : (
    <p className="text-gray-500 italic">No detailed content available.</p>
  )
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {node.data?.title || node.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {tutorialId ? (
            <AnnotatableContent 
              tutorialId={tutorialId}
              onAnnotationRequest={onAnnotationRequest}
            >
              {content}
            </AnnotatableContent>
          ) : content}
        </div>
      </div>
    </div>
  )
}

// Refined color palette based on critic feedback
// - Slate base for neutrality
// - Indigo for root (authoritative)
// - Slate-blue for expandable sections (action available)  
// - Amber/warm for leaf content (content here)
const nodeColors = {
  root: { 
    bg: '#312e81',      // indigo-900
    border: '#4338ca',  // indigo-700
    text: '#ffffff',
    hoverBg: '#3730a3', // indigo-800
  },
  expandable: { 
    bg: '#f1f5f9',      // slate-100
    border: '#94a3b8',  // slate-400
    text: '#334155',    // slate-700
    hoverBg: '#e2e8f0', // slate-200
  },
  leaf: { 
    bg: '#fef3c7',      // amber-100
    border: '#f59e0b',  // amber-500
    text: '#92400e',    // amber-800
    hoverBg: '#fde68a', // amber-200
  },
}

// Node sizing based on depth (type hierarchy)
const getNodeSize = (depth) => {
  if (depth === 0) return { fontSize: 14, fontWeight: 700, height: 36, padding: 16 }
  if (depth === 1) return { fontSize: 12, fontWeight: 500, height: 30, padding: 12 }
  return { fontSize: 11, fontWeight: 400, height: 26, padding: 10 }
}

export default function D3Tree({ 
  data, 
  title = "Document Structure",
  renderContent,
  className = "",
  height = 600,
  tutorialId,
  onAnnotationRequest,
}) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 900, height })
  
  // Track expanded nodes
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']))
  
  const toggleExpand = useCallback((nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])
  
  const expandAll = useCallback(() => {
    const allIds = new Set()
    const collect = (node) => {
      allIds.add(node.id || 'root')
      node.children?.forEach(collect)
    }
    collect(data)
    setExpandedNodes(allIds)
  }, [data])
  
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set(['root']))
  }, [])
  
  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width || 900, height: Math.max(500, height) })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [height])
  
  // Build and render tree
  useEffect(() => {
    if (!svgRef.current || !data) return
    
    const svg = d3.select(svgRef.current)
    const { width, height } = dimensions
    
    // Clear previous content
    svg.selectAll('*').remove()
    
    // Add defs for shadows
    const defs = svg.append('defs')
    
    // Shadow filter for expanded nodes
    const shadowFilter = defs.append('filter')
      .attr('id', 'node-shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')
    
    shadowFilter.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('stdDeviation', 3)
      .attr('flood-color', 'rgba(0,0,0,0.15)')
    
    // Hover shadow (stronger)
    const hoverShadow = defs.append('filter')
      .attr('id', 'node-hover-shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')
    
    hoverShadow.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 4)
      .attr('stdDeviation', 6)
      .attr('flood-color', 'rgba(0,0,0,0.2)')
    
    // Create group for zoom/pan
    const g = svg.append('g').attr('class', 'tree-container')
    
    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    
    svg.call(zoom)
    
    // Filter data based on expanded nodes
    const filterData = (node) => {
      const nodeId = node.id || 'root'
      const isExpanded = expandedNodes.has(nodeId)
      
      if (!node.children || !isExpanded) {
        return { ...node, _children: node.children, children: null }
      }
      
      return {
        ...node,
        children: node.children.map(filterData)
      }
    }
    
    const filteredData = filterData(data)
    
    // Create hierarchy
    const root = d3.hierarchy(filteredData)
    
    // Calculate layout - horizontal tree
    const margin = { top: 20, right: 200, bottom: 20, left: 20 }
    const treeHeight = height - margin.top - margin.bottom
    
    const treeLayout = d3.tree()
      .size([treeHeight, width - margin.left - margin.right - 200])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.8))
    
    treeLayout(root)
    
    // Position the tree
    g.attr('transform', `translate(${margin.left + 20}, ${margin.top})`)
    
    // Curved link generator
    const linkGenerator = d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x)
    
    // Draw links
    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')  // slate-300
      .attr('stroke-width', 1.5)
      .attr('d', linkGenerator)
    
    // Determine node colors
    const getNodeColor = (d) => {
      if (d.depth === 0) return nodeColors.root
      if (d.data._children || d.data.children) return nodeColors.expandable
      return nodeColors.leaf
    }
    
    // Draw nodes as groups
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('data-testid', d => `node-${d.data.id || 'root'}`)
      .attr('transform', d => `translate(${d.y}, ${d.x})`)
      .style('cursor', 'pointer')
    
    // Node rectangles with rounded corners
    nodes.each(function(d) {
      const node = d3.select(this)
      const colors = getNodeColor(d)
      const size = getNodeSize(d.depth)
      const title = d.data.title || 'Untitled'
      const displayTitle = title.length > 35 ? title.slice(0, 35) + '...' : title
      const hasChildren = d.data._children || d.data.children
      const isExpanded = expandedNodes.has(d.data.id || 'root')
      
      // Calculate text width (approximate based on font size)
      const charWidth = size.fontSize * 0.6
      const textWidth = displayTitle.length * charWidth + size.padding * 2
      const boxWidth = Math.max(textWidth, 100)
      const boxHeight = size.height
      
      // Background rectangle
      const rect = node.append('rect')
        .attr('x', -12)
        .attr('y', -boxHeight / 2)
        .attr('width', boxWidth)
        .attr('height', boxHeight)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('fill', colors.bg)
        .attr('stroke', colors.border)
        .attr('stroke-width', d.depth === 0 ? 2 : 1)
        .attr('filter', isExpanded && hasChildren ? 'url(#node-shadow)' : null)
      
      // Hover and click handlers
      rect
        .on('click', (event) => {
          event.stopPropagation()
          if (hasChildren) {
            toggleExpand(d.data.id || 'root')
          } else {
            setSelectedNode(d)
          }
        })
        .on('mouseover', function() {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('fill', colors.hoverBg)
            .attr('filter', 'url(#node-hover-shadow)')
            .attr('transform', 'translate(0, -2)')
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('fill', colors.bg)
            .attr('filter', isExpanded && hasChildren ? 'url(#node-shadow)' : null)
            .attr('transform', null)
        })
      
      // Text label
      node.append('text')
        .attr('x', size.padding - 4)
        .attr('dy', '0.35em')
        .attr('fill', colors.text)
        .attr('font-size', `${size.fontSize}px`)
        .attr('font-weight', size.fontWeight)
        .attr('pointer-events', 'none')
        .text(displayTitle)
      
      // Chevron indicator for expandable nodes (animated rotation would need more work)
      if (hasChildren) {
        const chevronX = boxWidth - 20
        node.append('text')
          .attr('class', 'chevron')
          .attr('x', chevronX)
          .attr('dy', '0.35em')
          .attr('fill', colors.text)
          .attr('font-size', `${size.fontSize + 2}px`)
          .attr('font-weight', 'bold')
          .attr('pointer-events', 'none')
          .attr('opacity', 0.5)
          .text(isExpanded ? '‹' : '›')
      }
    })
    
    // Center the tree initially
    const bounds = g.node().getBBox()
    const scale = Math.min(
      (width - 40) / bounds.width,
      (height - 40) / bounds.height,
      1
    ) * 0.85
    
    const translateX = 50
    const translateY = (height - bounds.height * scale) / 2 - bounds.y * scale
    
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale))
    
  }, [data, dimensions, expandedNodes, toggleExpand])
  
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-150"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all duration-150"
          >
            Collapse
          </button>
        </div>
      </div>
      
      {/* Legend - refined colors */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-6 text-xs text-slate-600">
        <span className="font-medium text-slate-700">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: nodeColors.expandable.bg, border: `1px solid ${nodeColors.expandable.border}` }} />
          Section
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: nodeColors.leaf.bg, border: `1px solid ${nodeColors.leaf.border}` }} />
          Content
        </span>
        <span className="ml-auto text-slate-400">Drag to pan • Scroll to zoom</span>
      </div>
      
      {/* Tree visualization */}
      <div ref={containerRef} className="relative" style={{ height: dimensions.height }}>
        <svg
          ref={svgRef}
          width="100%"
          height={dimensions.height}
          className="bg-gradient-to-br from-slate-50 via-white to-slate-50"
        />
      </div>
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex gap-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <button
          onClick={() => {
            const svg = d3.select(svgRef.current)
            svg.transition().duration(300).call(
              d3.zoom().scaleBy,
              1.3
            )
          }}
          className="px-3 py-2 hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors"
        >
          +
        </button>
        <div className="w-px bg-gray-200" />
        <button
          onClick={() => {
            const svg = d3.select(svgRef.current)
            svg.transition().duration(300).call(
              d3.zoom().scaleBy,
              0.7
            )
          }}
          className="px-3 py-2 hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors"
        >
          −
        </button>
      </div>
      
      {/* Detail modal */}
      <DetailModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        renderContent={renderContent}
        tutorialId={tutorialId}
        onAnnotationRequest={onAnnotationRequest}
      />
    </div>
  )
}
