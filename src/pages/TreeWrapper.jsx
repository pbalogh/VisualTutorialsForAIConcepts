import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import D3Tree from '../components/SummaryTree/D3Tree.jsx'
import { Container } from '../components/SharedUI.jsx'
import { TutorialEngine } from '../components/TutorialEngine/ElementRenderer.jsx'

// JSON-based tutorials that can have tree views
const jsonTutorials = ['vector-projection', 'engine-demo', 'matrix-from-vectors-engine', 'matrix-discovery-engine', 'lead-lag-correlation-engine', 'least-squares-engine', 'schankian-paper-draft', 'rotate-paper', 'neural-oscillations']

// Map tutorial IDs to JSON filenames
const jsonFilenames = {
  'matrix-from-vectors-engine': 'matrix-from-vectors',
  'matrix-discovery-engine': 'matrix-discovery',
  'lead-lag-correlation-engine': 'lead-lag-correlation',
  'least-squares-engine': 'least-squares'
}

// Generate tree from tutorial content if no explicit tree exists
function generateTreeFromContent(content, tutorialTitle) {
  if (!content || !content.children) {
    return { id: 'root', title: tutorialTitle, children: [] }
  }
  
  const children = content.children
    .filter(child => child.type === 'Section')
    .map((section, idx) => {
      const sectionId = `section-${idx}`
      const sectionTitle = section.props?.title || `Section ${idx + 1}`
      
      // Extract subsections (h3, h4 elements) with their content
      const subsections = []
      if (section.children) {
        const sectionChildren = Array.isArray(section.children) ? section.children : [section.children]
        let currentSubsection = null
        let currentContent = []
        
        sectionChildren.forEach((child, subIdx) => {
          if (child.type === 'h3' || child.type === 'h4') {
            // Save previous subsection if exists
            if (currentSubsection) {
              subsections.push({
                id: currentSubsection.id,
                title: currentSubsection.title,
                excerpt: extractExcerpt(currentContent),
                content: currentContent.length > 0 ? { type: 'Fragment', children: currentContent } : null
              })
            }
            
            const text = typeof child.children === 'string' 
              ? child.children 
              : (Array.isArray(child.children) 
                  ? child.children.find(c => typeof c === 'string') || `Subsection ${subIdx}`
                  : `Subsection ${subIdx}`)
            currentSubsection = {
              id: `${sectionId}-sub-${subsections.length}`,
              title: text
            }
            currentContent = []
          } else if (currentSubsection) {
            // Add content to current subsection
            currentContent.push(child)
          }
        })
        
        // Don't forget the last subsection
        if (currentSubsection) {
          subsections.push({
            id: currentSubsection.id,
            title: currentSubsection.title,
            excerpt: extractExcerpt(currentContent),
            content: currentContent.length > 0 ? { type: 'Fragment', children: currentContent } : null
          })
        }
      }
      
      return {
        id: sectionId,
        title: sectionTitle,
        excerpt: extractExcerpt(section.children),
        content: section, // Store full section content
        children: subsections.length > 0 ? subsections : undefined
      }
    })
  
  return {
    id: 'root',
    title: tutorialTitle,
    children,
    content: content // Store full tutorial content for root
  }
}

// Extract first paragraph text as excerpt
function extractExcerpt(children, maxLength = 120) {
  if (!children) return ''
  const arr = Array.isArray(children) ? children : [children]
  
  for (const child of arr) {
    if (child.type === 'p' && typeof child.children === 'string') {
      const text = child.children
      return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
    }
  }
  return ''
}

// Tree header component
function TreeHeader({ title, subtitle, tutorialId }) {
  return (
    <header className="relative overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.3), transparent),
            radial-gradient(ellipse 60% 40% at 80% 50%, rgba(5, 150, 105, 0.15), transparent),
            linear-gradient(to bottom, #0f0e17, #1a1825)
          `
        }}
      />
      
      <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-40 bg-emerald-500/40" />
      
      <div className="relative max-w-4xl mx-auto px-6 sm:px-8 pt-12 pb-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-emerald-400 transition-colors">Tutorials</Link>
          <span className="text-gray-600">/</span>
          <Link to={`/tutorial/${tutorialId}`} className="hover:text-emerald-400 transition-colors">
            {title}
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500">Tree View</span>
        </nav>
        
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 shadow-lg"
          style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)' }}
        >
          <span className="text-2xl">🌳</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
          {title}
        </h1>
        
        <p className="text-lg text-gray-400 mb-4">
          {subtitle || 'Hierarchical overview — click nodes to expand'}
        </p>
        
        {/* Link back to tutorial */}
        <Link 
          to={`/tutorial/${tutorialId}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          <span>📖</span>
          View Full Tutorial
        </Link>
      </div>
    </header>
  )
}

export default function TreeWrapper() {
  const { tutorialId } = useParams()
  const [tutorial, setTutorial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const loadTutorial = async () => {
      try {
        const filename = jsonFilenames[tutorialId] || tutorialId
        const module = await import(`../content/${filename}.json`)
        setTutorial(module.default || module)
      } catch (e) {
        console.error('Failed to load tutorial:', e)
        setError('Tutorial not found or has no tree view available.')
      } finally {
        setLoading(false)
      }
    }
    loadTutorial()
  }, [tutorialId])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-gray-500">Loading tree view...</div>
      </div>
    )
  }
  
  if (error || !tutorial) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Container className="py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Tree view not available'}</h1>
            <Link to="/" className="text-emerald-600 hover:text-emerald-700">
              ← Back to tutorials
            </Link>
          </div>
        </Container>
      </div>
    )
  }
  
  // Use explicit tree if present, otherwise generate from content
  const treeData = tutorial.tree || generateTreeFromContent(tutorial.content, tutorial.title)
  
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TreeHeader 
        title={tutorial.title} 
        subtitle={tutorial.subtitle}
        tutorialId={tutorialId}
      />
      
      <Container className="py-8 max-w-6xl">
        <D3Tree 
          data={treeData}
          title={`${tutorial.title} — Structure`}
          className="shadow-lg"
          height={600}
          renderContent={(node) => {
            if (node.content) {
              return <TutorialEngine content={node.content} state={tutorial.state || {}} />
            }
            return <p className="text-gray-500 italic">No detailed content available for this section.</p>
          }}
        />
      </Container>
    </div>
  )
}
