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
// - Indigo for root (authoritative) with emerald accent for header cohesion
// - Slate-blue for expandable sections (action available)  
// - Amber/warm for leaf content (content here)
const nodeColors = {
  root: { 
    bg: '#312e81',      // indigo-900
    border: '#10b981',  // emerald-500 - ties to header palette
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
  return { fontSize: 12, fontWeight: 400, height: 28, padding: 10 }  // Bumped from 11px to 12px
}

export default function D3Tree({ 
  data, 
  title = "Document Structure",
  renderContent,
  className = "",
  height = 600,
  tutorialId,
  onAnnotationRequest,
  onCombineNodes,  // Callback for combine operation
}) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [dimensions, setDimensions] = useState({ width: 900, height })
  
  // Track expanded nodes
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']))
  
  // Selection mode for tree operations
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedNodes, setSelectedNodes] = useState(new Set())
  
  // Preserve zoom/pan transform across re-renders
  const transformRef = useRef(null)
  const zoomRef = useRef(null)
  
  // Combine modal state
  const [showCombineModal, setShowCombineModal] = useState(false)
  const [combineNote, setCombineNote] = useState('')
  const [isCombining, setIsCombining] = useState(false)
  
  // Natural language command state
  const [nlCommand, setNlCommand] = useState('')
  const [isProcessingNL, setIsProcessingNL] = useState(false)
  
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
  
  const toggleNodeSelection = useCallback((nodeId, event) => {
    if (!selectionMode) return
    
    setSelectedNodes(prev => {
      const next = new Set(prev)
      if (event?.shiftKey && prev.size > 0) {
        // Shift-click: select range (simplified - just toggle for now)
        if (next.has(nodeId)) {
          next.delete(nodeId)
        } else {
          next.add(nodeId)
        }
      } else if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [selectionMode])
  
  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set())
  }, [])
  
  // Collect all node info for NL search
  const collectAllNodes = useCallback((node, parentPath = []) => {
    if (!node) return []
    const nodeId = node.id || 'root'
    const nodes = [{
      id: nodeId,
      title: node.title || '',
      excerpt: node.excerpt || node.contentPreview || '',
      path: parentPath
    }]
    
    if (node.children) {
      node.children.forEach(child => {
        nodes.push(...collectAllNodes(child, [...parentPath, nodeId]))
      })
    }
    return nodes
  }, [])
  
  // Expand all ancestors of given node IDs
  const expandAncestors = useCallback((nodeIds, allNodes) => {
    const toExpand = new Set(expandedNodes)
    nodeIds.forEach(nodeId => {
      const nodeInfo = allNodes.find(n => n.id === nodeId)
      if (nodeInfo) {
        nodeInfo.path.forEach(ancestorId => toExpand.add(ancestorId))
      }
    })
    setExpandedNodes(toExpand)
  }, [expandedNodes])
  
  // Process natural language command
  const processNLCommand = useCallback(async (command) => {
    if (!command.trim()) return
    
    setIsProcessingNL(true)
    try {
      const allNodes = collectAllNodes(data)
      
      // Call AI to interpret the command
      const response = await fetch('http://localhost:5190/nl-tree-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          nodes: allNodes.map(n => ({
            id: n.id,
            title: n.title,
            excerpt: n.excerpt?.slice(0, 100)
          })),
          tutorialId
        })
      })
      
      if (!response.ok) throw new Error('Command failed')
      
      const result = await response.json()
      console.log('NL command result:', result)
      
      if (result.action === 'select' && result.nodeIds?.length > 0) {
        // Expand ancestors and select nodes
        expandAncestors(result.nodeIds, allNodes)
        setSelectedNodes(new Set(result.nodeIds))
        setSelectionMode(true)
        setNlCommand('')
      } else if (result.action === 'combine' && result.nodeIds?.length >= 2) {
        // Expand ancestors, select nodes, and open combine modal
        expandAncestors(result.nodeIds, allNodes)
        setSelectedNodes(new Set(result.nodeIds))
        setSelectionMode(true)
        setCombineNote(result.editorNote || '')
        setShowCombineModal(true)
        setNlCommand('')
      } else if (result.action === 'promote' || result.action === 'split') {
        // These are structural changes - show confirmation then execute
        const confirmMsg = result.action === 'promote' 
          ? `Promote children of "${result.parentNodeId}" to top-level sections?\n\n${result.reasoning}`
          : `Split "${result.nodeId}" into separate sections?\n\n${result.reasoning}`
        
        if (confirm(confirmMsg)) {
          // Execute the structural change
          const execResponse = await fetch('http://localhost:5190/structure-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tutorialId,
              action: result.action,
              ...result
            })
          })
          
          if (execResponse.ok) {
            alert('Structure updated! Reloading...')
            window.location.reload()
          } else {
            const err = await execResponse.json()
            alert('Failed: ' + (err.error || 'Unknown error'))
          }
        }
        setNlCommand('')
      } else if (result.action === 'lint') {
        // Structure lint - analyze and optionally auto-fix
        if (confirm(`Run structure lint with auto-fix?\n\n${result.reasoning}`)) {
          const lintResponse = await fetch('http://localhost:5190/structure-lint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tutorialId,
              autoFix: result.autoFix !== false
            })
          })
          
          const lintResult = await lintResponse.json()
          
          if (lintResult.status === 'clean') {
            alert('✅ No structural issues found!')
          } else if (lintResult.status === 'fixed') {
            alert(`✅ Fixed ${lintResult.fixedCount} issues! Reloading...`)
            window.location.reload()
          } else if (lintResult.issues?.length > 0) {
            alert(`Found ${lintResult.issues.length} issues:\n\n` + 
              lintResult.issues.map(i => `• ${i.title}: ${i.suggestion}`).join('\n'))
          }
        }
        setNlCommand('')
      } else if (result.action === 'delete' && result.nodeIds?.length > 0) {
        // Show what will be deleted and confirm
        expandAncestors(result.nodeIds, allNodes)
        setSelectedNodes(new Set(result.nodeIds))
        setSelectionMode(true)
        
        if (confirm(`Delete ${result.nodeIds.length} nodes?\n\n${result.reasoning}`)) {
          // TODO: Implement delete endpoint
          alert('Delete not yet implemented')
        }
        setNlCommand('')
      } else if (result.message) {
        alert(result.message)
        setNlCommand('')
      }
    } catch (err) {
      console.error('NL command error:', err)
      alert('Failed to process command: ' + err.message)
    } finally {
      setIsProcessingNL(false)
    }
  }, [data, collectAllNodes, expandAncestors, tutorialId])
  
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
        transformRef.current = event.transform  // Save transform
      })
    
    zoomRef.current = zoom
    svg.call(zoom)
    
    // Restore previous transform if exists
    if (transformRef.current) {
      svg.call(zoom.transform, transformRef.current)
    }
    
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
    
    // Use nodeSize instead of size for consistent spacing regardless of node count
    // This gives each node a fixed amount of vertical space
    const nodeVerticalSpacing = 45 // Vertical space per node
    const nodeHorizontalSpacing = 300 // Horizontal space per level (increased for long titles)
    
    const treeLayout = d3.tree()
      .nodeSize([nodeVerticalSpacing, nodeHorizontalSpacing])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.3))
    
    treeLayout(root)
    
    // Position the tree
    g.attr('transform', `translate(${margin.left + 20}, ${margin.top})`)
    
    // Curved link generator
    const linkGenerator = d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x)
    
    // Draw links (thinner for less competition with nodes)
    g.selectAll('.link')
      .data(root.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')  // slate-300
      .attr('stroke-width', 1)    // Thinner: was 1.5
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
      
      // Build tooltip text - include content preview for generic nodes
      let tooltipText = title
      const preview = d.data.contentPreview || d.data.excerpt || d.data.text
      if (preview) {
        const previewText = typeof preview === 'string' ? preview.slice(0, 150) : ''
        if (previewText) tooltipText += '\n\n' + previewText + (preview.length > 150 ? '...' : '')
      }
      
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
        .attr('stroke', selectedNodes.has(d.data.id || 'root') ? '#6366f1' : colors.border)
        .attr('stroke-width', selectedNodes.has(d.data.id || 'root') ? 3 : (d.depth === 0 ? 2 : 1))
        .attr('filter', isExpanded && hasChildren ? 'url(#node-shadow)' : null)
      
      // Selection checkbox (only in selection mode)
      if (selectionMode) {
        const isSelected = selectedNodes.has(d.data.id || 'root')
        node.append('rect')
          .attr('x', -24)
          .attr('y', -8)
          .attr('width', 16)
          .attr('height', 16)
          .attr('rx', 3)
          .attr('fill', isSelected ? '#6366f1' : 'white')
          .attr('stroke', '#6366f1')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .on('click', (event) => {
            event.stopPropagation()
            toggleNodeSelection(d.data.id || 'root', event)
          })
        
        if (isSelected) {
          node.append('text')
            .attr('x', -20)
            .attr('y', 4)
            .attr('fill', 'white')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('pointer-events', 'none')
            .text('✓')
        }
      }
      
      // Hover and click handlers
      rect
        .on('click', (event) => {
          event.stopPropagation()
          if (selectionMode) {
            toggleNodeSelection(d.data.id || 'root', event)
          } else if (hasChildren) {
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
      
      // Tooltip - always show for richer context
      node.append('title').text(tooltipText)
      
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
    
    // Only center tree initially (when no saved transform)
    if (!transformRef.current) {
      const bounds = g.node().getBBox()
      const scale = Math.min(
        (width - 40) / bounds.width,
        (height - 40) / bounds.height,
        1
      ) * 0.85
      
      const translateX = 50
      const translateY = (height - bounds.height * scale) / 2 - bounds.y * scale
      
      const initialTransform = d3.zoomIdentity
        .translate(translateX, Math.max(20, translateY))
        .scale(scale)
      
      svg.call(zoom.transform, initialTransform)
      transformRef.current = initialTransform
    }
    
  }, [data, dimensions, expandedNodes, toggleExpand, selectionMode, selectedNodes, toggleNodeSelection])
  
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          {/* Selection mode toggle */}
          <button
            onClick={() => {
              setSelectionMode(!selectionMode)
              if (selectionMode) clearSelection()
            }}
            className={`text-xs px-3 py-1.5 rounded-md transition-all duration-150 ${
              selectionMode 
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {selectionMode ? '✓ Select Mode' : '☐ Select'}
          </button>
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
      
      {/* Natural language command bar */}
      <div className="px-4 py-2 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100">
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            processNLCommand(nlCommand)
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={nlCommand}
            onChange={(e) => setNlCommand(e.target.value)}
            placeholder='Try: "Select all nodes about pacemaker cells" or "Combine sections on theta rhythms"'
            className="flex-1 px-3 py-1.5 text-sm border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white"
            disabled={isProcessingNL}
          />
          <button
            type="submit"
            disabled={isProcessingNL || !nlCommand.trim()}
            className="px-4 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessingNL ? '...' : '✨ Go'}
          </button>
        </form>
      </div>
      
      {/* Selection toolbar - appears when nodes are selected */}
      {selectionMode && selectedNodes.size > 0 && (
        <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-3">
          <span className="text-sm text-indigo-700 font-medium">
            {selectedNodes.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCombineModal(true)}
              disabled={selectedNodes.size < 2}
              className="text-xs px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔗 Combine
            </button>
            <button
              onClick={() => {
                // TODO: Implement delete
                console.log('Delete:', Array.from(selectedNodes))
                alert(`Delete ${selectedNodes.size} nodes - coming soon!`)
              }}
              className="text-xs px-3 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              🗑️ Delete
            </button>
            <button
              onClick={() => {
                // TODO: Implement promote
                console.log('Promote:', Array.from(selectedNodes))
                alert(`Promote ${selectedNodes.size} nodes - coming soon!`)
              }}
              className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
            >
              📤 Promote
            </button>
          </div>
          <button
            onClick={clearSelection}
            className="ml-auto text-xs text-indigo-500 hover:text-indigo-700"
          >
            Clear
          </button>
        </div>
      )}
      
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
        <span className="ml-auto text-slate-400">
          {selectionMode ? 'Click nodes to select • Shift+click for multiple' : 'Drag to pan • Scroll to zoom'}
        </span>
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
      
      {/* Combine Modal */}
      {showCombineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">🔗 Combine {selectedNodes.size} Nodes</h2>
              <p className="text-sm text-gray-500 mt-1">
                AI will merge the selected content into a single cohesive section.
              </p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Editor's Note (optional)
              </label>
              <textarea
                value={combineNote}
                onChange={(e) => setCombineNote(e.target.value)}
                placeholder="e.g., 'Keep the apple analogy from section 1, drop the fish analogy. Emphasize the phase-locking mechanism.'"
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-2">
                Guide the AI on what to keep, remove, or emphasize when combining.
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCombineModal(false)
                  setCombineNote('')
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsCombining(true)
                  try {
                    if (onCombineNodes) {
                      await onCombineNodes(Array.from(selectedNodes), combineNote)
                    }
                    setShowCombineModal(false)
                    setCombineNote('')
                    clearSelection()
                    setSelectionMode(false)
                  } catch (err) {
                    console.error('Combine failed:', err)
                    alert('Failed to combine nodes: ' + err.message)
                  } finally {
                    setIsCombining(false)
                  }
                }}
                disabled={isCombining}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCombining ? 'Combining...' : 'Combine'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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
