import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'

/**
 * D3Tree - Beautiful hierarchical tree visualization
 * 
 * Inspired by: Text in rounded boxes, chevron indicators, color-coded nodes
 */

const X = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// Detail modal component
function DetailModal({ node, onClose, renderContent }) {
  if (!node) return null
  
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {node.data?.title || node.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {renderContent ? renderContent(node.data || node) : (
            <p className="text-gray-500 italic">No detailed content available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Colors: Blue for expandable, green for leaf nodes
const nodeColors = {
  expandable: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },  // Blue
  leaf: { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },  // Green
  root: { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' },  // Indigo for root
}

export default function D3Tree({ 
  data, 
  title = "Document Structure",
  renderContent,
  className = "",
  height = 600,
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
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.5))
    
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
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1.5)
      .attr('d', linkGenerator)
    
    // Draw nodes as groups
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('data-testid', d => `node-${d.data.id || 'root'}`)
      .attr('transform', d => `translate(${d.y}, ${d.x})`)
      .style('cursor', 'pointer')
    
    // Determine node colors
    const getNodeColor = (d) => {
      if (d.depth === 0) return nodeColors.root
      if (d.data._children || d.data.children) return nodeColors.expandable
      return nodeColors.leaf
    }
    
    // Node rectangles with rounded corners
    nodes.each(function(d) {
      const node = d3.select(this)
      const colors = getNodeColor(d)
      const title = d.data.title || 'Untitled'
      const displayTitle = title.length > 35 ? title.slice(0, 35) + '...' : title
      const hasChildren = d.data._children || d.data.children
      const isExpanded = expandedNodes.has(d.data.id || 'root')
      
      // Calculate text width (approximate)
      const textWidth = displayTitle.length * 7 + 24
      const boxWidth = Math.max(textWidth, 80)
      const boxHeight = 28
      
      // Background rectangle
      node.append('rect')
        .attr('x', -10)
        .attr('y', -boxHeight / 2)
        .attr('width', boxWidth)
        .attr('height', boxHeight)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', colors.bg)
        .attr('stroke', colors.border)
        .attr('stroke-width', 1)
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
            .attr('stroke-width', 2)
            .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('stroke-width', 1)
            .attr('filter', null)
        })
      
      // Text label
      node.append('text')
        .attr('x', 4)
        .attr('dy', '0.35em')
        .attr('fill', colors.text)
        .attr('font-size', '12px')
        .attr('font-weight', d.depth === 0 ? '600' : '400')
        .attr('pointer-events', 'none')
        .text(displayTitle)
      
      // Chevron indicator for expandable nodes
      if (hasChildren) {
        node.append('text')
          .attr('x', boxWidth - 16)
          .attr('dy', '0.35em')
          .attr('fill', colors.text)
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('pointer-events', 'none')
          .attr('opacity', 0.6)
          .text(isExpanded ? '<' : '>')
      }
    })
    
    // Center the tree initially
    const bounds = g.node().getBBox()
    const scale = Math.min(
      (width - 40) / bounds.width,
      (height - 40) / bounds.height,
      1
    ) * 0.9
    
    const translateX = 40
    const translateY = (height - bounds.height * scale) / 2 - bounds.y * scale
    
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale))
    
  }, [data, dimensions, expandedNodes, toggleExpand])
  
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Collapse
          </button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-6 text-xs text-gray-600">
        <span className="font-medium">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: nodeColors.expandable.bg, border: `1px solid ${nodeColors.expandable.border}` }} />
          Section (click to expand)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: nodeColors.leaf.bg, border: `1px solid ${nodeColors.leaf.border}` }} />
          Content (click to view)
        </span>
        <span className="ml-auto text-gray-400">Drag to pan • Scroll to zoom</span>
      </div>
      
      {/* Tree visualization */}
      <div ref={containerRef} className="relative" style={{ height: dimensions.height }}>
        <svg
          ref={svgRef}
          width="100%"
          height={dimensions.height}
          className="bg-gradient-to-br from-slate-50 via-white to-blue-50/20"
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
          className="px-3 py-2 hover:bg-gray-100 text-gray-600 text-sm font-medium"
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
          className="px-3 py-2 hover:bg-gray-100 text-gray-600 text-sm font-medium"
        >
          −
        </button>
      </div>
      
      {/* Detail modal */}
      <DetailModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        renderContent={renderContent}
      />
    </div>
  )
}
