import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'

/**
 * D3Tree - Beautiful hierarchical tree visualization
 * 
 * Features:
 * - Smooth animated transitions
 * - Curved link paths
 * - Click to expand/collapse
 * - Hover to highlight path
 * - Click node to view details
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

// Color palette for depth levels
const depthColors = [
  { node: '#6366f1', link: '#a5b4fc', bg: '#eef2ff' },  // Indigo - root
  { node: '#8b5cf6', link: '#c4b5fd', bg: '#f5f3ff' },  // Violet
  { node: '#ec4899', link: '#f9a8d4', bg: '#fdf2f8' },  // Pink
  { node: '#f59e0b', link: '#fcd34d', bg: '#fffbeb' },  // Amber
  { node: '#10b981', link: '#6ee7b7', bg: '#ecfdf5' },  // Emerald
  { node: '#06b6d4', link: '#67e8f9', bg: '#ecfeff' },  // Cyan
]

export default function D3Tree({ 
  data, 
  title = "Document Structure",
  renderContent,
  className = "",
  width = 900,
  height = 600,
  nodeRadius = 8,
  orientation = 'horizontal' // 'horizontal' or 'vertical'
}) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [dimensions, setDimensions] = useState({ width, height })
  const [transform, setTransform] = useState(d3.zoomIdentity)
  
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
        setDimensions({ width: rect.width, height: Math.max(500, rect.height) })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])
  
  // Build and render tree
  useEffect(() => {
    if (!svgRef.current || !data) return
    
    const svg = d3.select(svgRef.current)
    const { width, height } = dimensions
    
    // Clear previous content
    svg.selectAll('*').remove()
    
    // Create group for zoom/pan
    const g = svg.append('g')
      .attr('class', 'tree-container')
    
    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        setTransform(event.transform)
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
    
    // Calculate layout
    const margin = { top: 40, right: 120, bottom: 40, left: 120 }
    const treeWidth = width - margin.left - margin.right
    const treeHeight = height - margin.top - margin.bottom
    
    let treeLayout
    if (orientation === 'horizontal') {
      treeLayout = d3.tree()
        .size([treeHeight, treeWidth])
        .separation((a, b) => (a.parent === b.parent ? 1.5 : 2))
    } else {
      treeLayout = d3.tree()
        .size([treeWidth, treeHeight])
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.5))
    }
    
    treeLayout(root)
    
    // Position the tree
    g.attr('transform', `translate(${margin.left}, ${margin.top})`)
    
    // Link generator - curved lines
    const linkGenerator = orientation === 'horizontal'
      ? d3.linkHorizontal()
          .x(d => d.y)
          .y(d => d.x)
      : d3.linkVertical()
          .x(d => d.x)
          .y(d => d.y)
    
    // Draw links with gradient
    const links = g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', d => depthColors[d.source.depth % depthColors.length].link)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('d', linkGenerator)
    
    // Animate links
    links.each(function() {
      const path = d3.select(this)
      const totalLength = this.getTotalLength()
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0)
    })
    
    // Draw nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => orientation === 'horizontal'
        ? `translate(${d.y}, ${d.x})`
        : `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')
      .style('opacity', 0)
    
    // Animate nodes appearing
    nodes.transition()
      .duration(400)
      .delay((d, i) => i * 50)
      .style('opacity', 1)
    
    // Node circles with glow effect
    nodes.append('circle')
      .attr('r', d => d.data._children ? nodeRadius + 2 : nodeRadius)
      .attr('fill', d => depthColors[d.depth % depthColors.length].node)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', (d.data._children ? nodeRadius + 2 : nodeRadius) + 4)
        
        // Highlight path to root
        let current = d
        while (current) {
          g.selectAll('.link')
            .filter(l => l.target === current)
            .attr('stroke-width', 4)
            .attr('stroke-opacity', 1)
          current = current.parent
        }
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d.data._children ? nodeRadius + 2 : nodeRadius)
        
        // Reset links
        g.selectAll('.link')
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.6)
      })
      .on('click', (event, d) => {
        event.stopPropagation()
        const nodeId = d.data.id || 'root'
        if (d.data._children || d.data.children) {
          toggleExpand(nodeId)
        } else {
          setSelectedNode(d)
        }
      })
    
    // Expand/collapse indicator
    nodes.filter(d => d.data._children || d.data.children)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text(d => expandedNodes.has(d.data.id || 'root') ? '−' : '+')
    
    // Node labels
    nodes.append('text')
      .attr('dy', '0.35em')
      .attr('x', d => orientation === 'horizontal'
        ? (d.data._children || d.children ? -12 : 12)
        : 0)
      .attr('y', d => orientation === 'horizontal'
        ? 0
        : (d.data._children || d.children ? -18 : 18))
      .attr('text-anchor', d => {
        if (orientation === 'vertical') return 'middle'
        return (d.data._children || d.children) ? 'end' : 'start'
      })
      .attr('fill', '#374151')
      .attr('font-size', '12px')
      .attr('font-weight', d => d.depth === 0 ? '600' : '400')
      .text(d => {
        const title = d.data.title || 'Untitled'
        return title.length > 30 ? title.slice(0, 30) + '...' : title
      })
      .on('click', (event, d) => {
        event.stopPropagation()
        setSelectedNode(d)
      })
      .on('mouseover', function() {
        d3.select(this).attr('fill', '#6366f1')
      })
      .on('mouseout', function() {
        d3.select(this).attr('fill', '#374151')
      })
    
    // Center the tree initially
    const bounds = g.node().getBBox()
    const scale = Math.min(
      (width - 40) / bounds.width,
      (height - 40) / bounds.height,
      1.2
    )
    const translateX = (width - bounds.width * scale) / 2 - bounds.x * scale
    const translateY = (height - bounds.height * scale) / 2 - bounds.y * scale
    
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale))
    
  }, [data, dimensions, expandedNodes, orientation, nodeRadius, toggleExpand])
  
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
      
      {/* Instructions */}
      <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 text-xs text-indigo-700">
        <span className="font-medium">Tip:</span> Click nodes with <span className="font-mono bg-indigo-100 px-1 rounded">+</span> to expand. Click text to view content. Drag to pan, scroll to zoom.
      </div>
      
      {/* Tree visualization */}
      <div ref={containerRef} className="relative" style={{ height: dimensions.height }}>
        <svg
          ref={svgRef}
          width="100%"
          height={dimensions.height}
          className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/30"
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
