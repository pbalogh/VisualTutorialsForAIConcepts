import React from 'react'
import SummaryTree from '../components/SummaryTree/SummaryTree.jsx'
import { TutorialEngine } from '../components/TutorialEngine/ElementRenderer.jsx'
import treeData from '../content/schankian-tree.json'

/**
 * SchankianTreeView - Summary tree view of the Schankian paper draft
 * 
 * Demonstrates the SummaryTree component with real content
 */
export default function SchankianTreeView() {
  // Render node content using TutorialEngine
  const renderContent = (node) => {
    if (node.content) {
      return <TutorialEngine content={node.content} state={{}} />
    }
    
    // If no content but has excerpt, show that
    if (node.excerpt) {
      return (
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-600">{node.excerpt}</p>
          {node.children && node.children.length > 0 && (
            <p className="text-sm text-gray-400 mt-4">
              This node has {node.children.length} child nodes. 
              Close this modal and expand the tree to explore them.
            </p>
          )}
        </div>
      )
    }
    
    return (
      <p className="text-gray-500 italic">
        No detailed content available for this node.
      </p>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Schankian Paper Overview
          </h1>
          <p className="text-gray-600">
            Hierarchical summary tree. Click any node to see full details.
            Expand/collapse to navigate the structure.
          </p>
        </div>
        
        {/* Tree */}
        <SummaryTree
          data={treeData}
          title="Paper Structure"
          renderContent={renderContent}
          className="shadow-lg"
        />
        
        {/* Footer - Design Decisions */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📐 Design Decisions</h3>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800">Grouping Structure</h4>
              <p>Organized by paper (4 papers + reading list). Each paper expands into its key concepts. This mirrors the tutorial structure but makes it navigable at a glance.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800">What's Included</h4>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Core ideas from each paper section</li>
                <li>Key examples (Lego, Marlowe Chair)</li>
                <li>Results tables (Phase 1 operator recovery)</li>
                <li>Reading list organized by relevance</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800">What's Excluded (for now)</h4>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Open questions section (better in full tutorial)</li>
                <li>Implementation status (changes frequently)</li>
                <li>Deep dives / AI annotations (modal can't nest well)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800">Depth Choices</h4>
              <p>3 levels max: Paper → Concept → Detail. Deeper than 3 levels becomes hard to navigate in a tree. If more detail needed, the modal shows full content.</p>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Tree data: <code className="bg-gray-100 px-1 rounded">src/content/schankian-tree.json</code>
                <br />
                Component: <code className="bg-gray-100 px-1 rounded">src/components/SummaryTree/SummaryTree.jsx</code>
              </p>
            </div>
          </div>
        </div>
        
        {/* Link to full tutorial */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Full paper draft with all details: {' '}
            <a href="/tutorial/schankian-paper-draft" className="text-indigo-600 hover:underline font-medium">
              📝 Schankian Paper Draft Tutorial
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
