import React, { useState } from 'react'

/**
 * SummaryTree - Hierarchical document viewer with progressive disclosure
 * 
 * Each node shows a compact excerpt; clicking opens a modal with full content
 * rendered via TutorialEngine.
 */

// Simple inline icons
const ChevronRight = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

const ChevronDown = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const X = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// Tree node component
function TreeNode({ node, level = 0, onSelect, expandedNodes, toggleExpand }) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)
  
  const levelColors = [
    'border-indigo-400 bg-indigo-50',
    'border-violet-400 bg-violet-50',
    'border-pink-400 bg-pink-50',
    'border-amber-400 bg-amber-50',
    'border-emerald-400 bg-emerald-50',
  ]
  
  const colorClass = levelColors[level % levelColors.length]
  
  return (
    <div className="select-none">
      <div 
        className={`
          flex items-start gap-2 p-3 rounded-lg border-l-4 mb-2
          cursor-pointer transition-all hover:shadow-md
          ${colorClass}
        `}
        style={{ marginLeft: level * 24 }}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id) }}
            className="p-1 hover:bg-white/50 rounded transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        ) : (
          <div className="w-6" /> // Spacer for alignment
        )}
        
        {/* Node content */}
        <div 
          className="flex-1 min-w-0"
          onClick={() => onSelect(node)}
        >
          <h4 className="font-medium text-gray-900 text-sm truncate">
            {node.title}
          </h4>
          {node.excerpt && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {node.excerpt}
            </p>
          )}
        </div>
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Modal for full content
function DetailModal({ node, onClose, renderContent }) {
  if (!node) return null
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
            {node.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {renderContent ? (
            renderContent(node)
          ) : (
            <div className="prose prose-sm max-w-none">
              {node.content ? (
                <p>{JSON.stringify(node.content)}</p>
              ) : (
                <p className="text-gray-500 italic">No detailed content available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main SummaryTree component
export default function SummaryTree({ 
  data, 
  title = "Summary Tree",
  renderContent,
  className = ""
}) {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']))
  const [selectedNode, setSelectedNode] = useState(null)
  
  const toggleExpand = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }
  
  const expandAll = () => {
    const allIds = new Set()
    const collect = (node) => {
      allIds.add(node.id)
      node.children?.forEach(collect)
    }
    collect(data)
    setExpandedNodes(allIds)
  }
  
  const collapseAll = () => {
    setExpandedNodes(new Set(['root']))
  }
  
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            Collapse
          </button>
        </div>
      </div>
      
      {/* Tree */}
      <div className="p-4">
        <TreeNode
          node={data}
          onSelect={setSelectedNode}
          expandedNodes={expandedNodes}
          toggleExpand={toggleExpand}
        />
      </div>
      
      {/* Modal */}
      <DetailModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        renderContent={renderContent}
      />
    </div>
  )
}

// Export sub-components for flexibility
export { TreeNode, DetailModal }
