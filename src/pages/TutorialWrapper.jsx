import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import MatrixDiscovery from '../tutorials/MatrixDiscovery.jsx'
import MatrixFromVectors from '../tutorials/MatrixFromVectors.jsx'
import LeastSquares from '../tutorials/LeastSquares.jsx'
import VectorProjectionLegacy from '../tutorials/VectorProjection.jsx'
import LeadLagCorrelation from '../tutorials/LeadLagCorrelation.jsx'
import EngineDemo from '../tutorials/EngineDemo.jsx'
import SchankianTreeView from '../tutorials/SchankianTreeView.jsx'
import { Container } from '../components/SharedUI.jsx'
import { AnnotatableContent } from '../components/AnnotationSystem.jsx'
import { TutorialEngine } from '../components/TutorialEngine/ElementRenderer.jsx'

// Legacy JSX component tutorials
const tutorialComponents = {
  'matrix-discovery': MatrixDiscovery,
  'matrix-from-vectors': MatrixFromVectors,
  'least-squares': LeastSquares,
  'vector-projection-legacy': VectorProjectionLegacy,
  'lead-lag-correlation': LeadLagCorrelation,
  'engine-demo': EngineDemo,
  'schankian-tree': SchankianTreeView
}

// JSON-based tutorials (loaded dynamically)
const jsonTutorials = ['vector-projection', 'engine-demo', 'matrix-from-vectors-engine', 'matrix-discovery-engine', 'lead-lag-correlation-engine', 'least-squares-engine', 'schankian-paper-draft', 'rotate-paper', 'neural-oscillations']

const tutorialMeta = {
  'matrix-discovery': {
    title: 'Matrix Discovery',
    subtitle: 'Interactive tool for discovering transformation matrices from input-output pairs',
    icon: '🔢',
    gradient: 'from-orange-500 to-amber-500',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    readTime: '12 min',
    exercises: 2,
    sections: ['Introduction', 'Input-Output Pairs', 'Matrix Solving', 'Exercises']
  },
  'matrix-from-vectors': {
    title: 'Matrix from Vectors',
    subtitle: 'Explore how vectors transform through matrices and visualize the geometric transformation',
    icon: '🎯',
    gradient: 'from-pink-500 to-rose-500',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    readTime: '10 min',
    exercises: 3,
    sections: ['Introduction', 'Vectors', 'Transformations', 'Visualization']
  },
  'least-squares': {
    title: 'Least Squares Regression',
    subtitle: 'Interactive exploration of fitting lines to data by minimizing squared errors',
    icon: '📊',
    gradient: 'from-indigo-500 to-blue-500',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '15 min',
    exercises: 2,
    sections: ['Introduction', 'The Problem', 'Minimizing Error', 'Interactive Demo']
  },
  'vector-projection': {
    title: 'Vector Projection',
    subtitle: 'Interactive exploration of projecting one 2D vector onto another',
    icon: '↗️',
    gradient: 'from-emerald-500 to-teal-500',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '8 min',
    exercises: 1,
    sections: ['Introduction', 'The Math', 'Interactive Demo']
  },
  'lead-lag-correlation': {
    title: 'Lead-Lag Correlation',
    subtitle: 'Discover predictive relationships in time series data with cross-correlation analysis',
    icon: '📈',
    gradient: 'from-blue-500 to-cyan-500',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    readTime: '10 min',
    exercises: 2,
    sections: ['Introduction', 'Cross-Correlation', 'Time Lags', 'Applications']
  },
  'engine-demo': {
    title: 'Tutorial Engine Demo',
    subtitle: 'A self-documenting demonstration of the data-driven tutorial system',
    icon: '🧪',
    gradient: 'from-violet-500 to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '8 min',
    exercises: 3,
    isExperimental: true,
    sections: ['Live State Bindings', 'Conditional Content', 'Computed Expressions', 'Layout Components', 'Code Blocks', 'AI Annotations']
  },
  'matrix-from-vectors-engine': {
    title: 'Matrix from Vectors (Engine)',
    subtitle: 'Find the transformation matrix from input-output observations — JSON-driven version',
    icon: '🎯',
    gradient: 'from-pink-500 to-rose-500',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    readTime: '10 min',
    exercises: 3,
    sections: ['The Core Problem', 'One Pair Isn\'t Enough', 'Multiple Pairs', 'Interactive Calculator', 'Two Systems', 'Deep Dives', 'Takeaways', 'Learn More']
  },
  'matrix-discovery-engine': {
    title: 'Matrix Discovery (Engine)',
    subtitle: 'Discover transformation matrices from input-output pairs using K-means clustering — JSON-driven version',
    icon: '🔍',
    gradient: 'from-orange-500 to-amber-500',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    readTime: '12 min',
    exercises: 2,
    sections: ['The Problem', 'Interactive Tool', 'The Algorithm', 'Choosing K', 'Applications', 'Key Takeaways']
  },
  'lead-lag-correlation-engine': {
    title: 'Lead-Lag Correlation (Engine)',
    subtitle: 'Find predictive relationships in time series data using cross-correlation — JSON-driven version',
    icon: '📈',
    gradient: 'from-blue-500 to-cyan-500',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    readTime: '10 min',
    exercises: 2,
    sections: ['What is Lead-Lag?', 'Interactive Playground', 'Key Concepts', 'Why Lag 0 Fails', 'The Math', 'Efficiency', 'Takeaways']
  },
  'least-squares-engine': {
    title: 'Least Squares (Engine)',
    subtitle: 'Finding the line that best fits your data by minimizing squared errors — JSON-driven version',
    icon: '📊',
    gradient: 'from-indigo-500 to-blue-500',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '15 min',
    exercises: 2,
    sections: ['The Problem', 'Interactive Playground', 'Why Squared?', 'The Formula', 'Matrix View', 'Geometry', 'Takeaways']
  },
  'schankian-paper-draft': {
    title: 'Schankian Operators Paper Draft',
    subtitle: 'Working draft: Learning Semantic Operators from Event Data',
    icon: '📝',
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    readTime: '30 min',
    exercises: 0,
    isExperimental: true,
    sections: ['Paper 1: Core Method', 'Paper 2: Entity State', 'Paper 2b: Implicit State', 'Paper 3: Temporal Structure', 'Paper 4: Vision', 'Connections', 'Implementation', 'Questions']
  },
  'schankian-tree': {
    title: 'Schankian Paper Tree View',
    subtitle: 'Hierarchical summary tree of the paper draft — click nodes to expand',
    icon: '🌳',
    gradient: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '5 min',
    exercises: 0,
    isExperimental: true,
    sections: ['Overview']
  },
  'rotate-paper': {
    title: 'RotatE Paper: Annotated Tutorial',
    subtitle: 'Knowledge Graph Embedding by Relational Rotation in Complex Space — Sun et al., ICLR 2019',
    icon: '🔄',
    gradient: 'from-cyan-500 to-blue-600',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    readTime: '45 min',
    exercises: 0,
    isExperimental: true,
    sections: ['Big Picture', 'Relation Patterns', 'The Model', 'Why It Works', 'Comparison', 'Results', 'Schankian Connection', 'Implementation']
  },
  'neural-oscillations': {
    title: 'Neural Oscillations & Memory',
    subtitle: 'How brain rhythms encode information — and why this matters for semantic operators',
    icon: '🧠',
    gradient: 'from-purple-500 to-pink-600',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    readTime: '30 min',
    exercises: 0,
    isExperimental: true,
    sections: ['Brain Rhythms', 'Theta Oscillations', 'Gamma & Binding', 'Superior Pattern Processing', 'Schankian Connection', 'Takeaways']
  }
}

// Tutorials that handle their own content layout (but we still wrap with header)
const selfContainedTutorials = ['engine-demo', 'schankian-tree']

// Animated progress bar component
function ProgressBar() {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const scrollTop = window.scrollY
      const progress = (scrollTop / documentHeight) * 100
      setProgress(Math.min(100, Math.max(0, progress)))
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-gray-900/50 z-50 backdrop-blur-sm">
      <div 
        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// Section progress indicator (side dots)
function SectionProgress({ sections, glowColor }) {
  const [activeSection, setActiveSection] = useState(0)
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const scrollTop = window.scrollY
      const progress = scrollTop / documentHeight
      
      // Calculate which section we're in
      const sectionIndex = Math.min(
        Math.floor(progress * sections.length),
        sections.length - 1
      )
      setActiveSection(sectionIndex)
      setProgress(progress)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections.length])
  
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
      <div className="flex flex-col items-center gap-3">
        {sections.map((section, i) => (
          <div key={i} className="group relative flex items-center">
            {/* Tooltip */}
            <div className="absolute right-full mr-3 px-2 py-1 bg-gray-900 text-white text-xs rounded 
              opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {section}
            </div>
            
            {/* Dot */}
            <button
              onClick={() => {
                const targetScroll = (i / sections.length) * (document.documentElement.scrollHeight - window.innerHeight)
                window.scrollTo({ top: targetScroll, behavior: 'smooth' })
              }}
              className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${i === activeSection 
                  ? 'scale-125 ring-4' 
                  : i < activeSection 
                    ? 'bg-indigo-400' 
                    : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                }
              `}
              style={i === activeSection ? { 
                backgroundColor: glowColor?.replace('0.4', '1') || '#6366f1',
                boxShadow: `0 0 12px ${glowColor || 'rgba(99, 102, 241, 0.5)'}`,
                '--tw-ring-color': glowColor?.replace('0.4', '0.25') || 'rgba(99, 102, 241, 0.25)'
              } : {}}
            />
          </div>
        ))}
        
        {/* Progress line */}
        <div className="absolute top-0 bottom-0 right-[5px] w-[3px] bg-gray-200 -z-10 rounded-full overflow-hidden">
          <div 
            className="w-full bg-gradient-to-b from-indigo-500 to-violet-500 transition-all duration-150"
            style={{ height: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Premium tutorial header with atmospheric effects (matching listing page)
function TutorialHeader({ meta, tutorialId, onRegroup }) {
  return (
    <header className="relative overflow-hidden">
      {/* Atmospheric gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent),
            radial-gradient(ellipse 60% 40% at 80% 50%, rgba(79, 70, 229, 0.15), transparent),
            radial-gradient(ellipse 50% 50% at 20% 80%, rgba(147, 51, 234, 0.1), transparent),
            linear-gradient(to bottom, #0f0e17, #1a1825)
          `
        }}
      />
      
      {/* Floating glow orbs (matching listing page) */}
      <div 
        className="absolute top-10 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-40"
        style={{ backgroundColor: meta.glowColor }}
      />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      <div className="relative max-w-3xl mx-auto px-6 sm:px-8 pt-16 pb-14">
        {/* Breadcrumb navigation */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-indigo-400 transition-colors">Tutorials</Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500">{meta.title}</span>
        </nav>
        
        {/* Experimental badge with glow */}
        {meta.isExperimental && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
            bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 animate-pulse" />
            Experimental
          </span>
        )}
        
        {/* Icon with shadow glow */}
        <div className={`
          w-16 h-16 rounded-2xl bg-gradient-to-br ${meta.gradient}
          flex items-center justify-center mb-6
          shadow-lg
        `}
          style={{ boxShadow: `0 0 40px ${meta.glowColor}` }}
        >
          <span className="text-3xl">{meta.icon}</span>
        </div>
        
        {/* Title with text glow */}
        <h1 
          className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
          style={{ textShadow: '0 0 80px rgba(99, 102, 241, 0.3)' }}
        >
          {meta.title}
        </h1>
        
        <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mb-6">
          {meta.subtitle}
        </p>
        
        {/* Meta info row - slightly larger for visibility */}
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{meta.readTime} read</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>{meta.exercises} interactive exercises</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>{meta.sections?.length || 0} sections</span>
          </div>
        </div>
        
        {/* Annotation hint */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
            bg-white/5 border border-white/10 text-sm text-gray-400">
            <span className="text-yellow-400">✨</span>
            Select any text to get AI explanations
          </div>
          
          {/* Tree view link */}
          <Link 
            to={`/tree/${tutorialId || ''}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
              bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400
              hover:bg-emerald-500/20 transition-colors"
          >
            <span>🌳</span>
            View as Tree
          </Link>
          
          {/* Regroup button */}
          {onRegroup && (
            <button
              onClick={onRegroup}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
                bg-violet-500/10 border border-violet-500/20 text-sm text-violet-400
                hover:bg-violet-500/20 transition-colors"
            >
              <span>🔄</span>
              Regroup & Tidy
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default function TutorialWrapper({ tutorial: propTutorial }) {
  const { tutorialId } = useParams()
  const [jsonTutorial, setJsonTutorial] = useState(propTutorial || null)
  const [loading, setLoading] = useState(!propTutorial && jsonTutorials.includes(tutorialId))
  const [annotations, setAnnotations] = useState([])
  
  // Load JSON tutorial if needed
  useEffect(() => {
    if (propTutorial || !jsonTutorials.includes(tutorialId)) return
    
    const loadTutorial = async () => {
      try {
        // Map tutorial IDs to JSON filenames (for cases where they differ)
        const jsonFilenames = {
          'matrix-from-vectors-engine': 'matrix-from-vectors',
          'matrix-discovery-engine': 'matrix-discovery',
          'lead-lag-correlation-engine': 'lead-lag-correlation',
          'least-squares-engine': 'least-squares'
        }
        const filename = jsonFilenames[tutorialId] || tutorialId
        const module = await import(`../content/${filename}.json`)
        // Vite may return the JSON directly or under .default
        setJsonTutorial(module.default || module)
      } catch (e) {
        console.error('Failed to load tutorial JSON:', e)
      } finally {
        setLoading(false)
      }
    }
    loadTutorial()
  }, [tutorialId, propTutorial])
  
  // Determine which mode we're in
  const isJsonTutorial = jsonTutorials.includes(tutorialId) || propTutorial
  const TutorialComponent = tutorialComponents[tutorialId]
  const meta = tutorialMeta[tutorialId]

  const handleAnnotationRequest = async ({ action, selectedText, context, tutorialId, question }) => {
    console.log('📝 Annotation request:', { action, selectedText, context, tutorialId, question })
    
    // Call the real annotation server
    try {
      const response = await fetch('http://localhost:5190/annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, selectedText, context, tutorialId, question })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Reload the tutorial content to show the new annotation
        if (data.updatedContent) {
          setJsonTutorial(data.updatedContent)
        }
      } else {
        console.error('Annotation server error:', await response.text())
      }
    } catch (e) {
      console.error('Failed to call annotation server:', e)
      alert('Annotation server not running. Start it with: node annotation-server.js')
    }
  }

  // Regroup and Tidy handler
  const handleRegroup = async () => {
    if (!tutorialId) return
    
    try {
      const response = await fetch('http://localhost:5190/regroup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorialId })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Regroup analysis:', data)
        
        // Show results to user
        if (data.sidebarCount === 0) {
          alert('No sidebars found to reorganize. Add some annotations first!')
        } else {
          const msg = `Found ${data.sidebarCount} sidebar(s).\n\n${data.message || 'Analysis complete.'}\n\nConsolidations suggested: ${data.suggestions?.consolidations?.length || 0}`
          alert(msg)
          // TODO: Show a modal with detailed suggestions and apply button
        }
      } else {
        const error = await response.json()
        console.error('Regroup error:', error)
        alert(`Regroup failed: ${error.error}`)
      }
    } catch (e) {
      console.error('Failed to call regroup:', e)
      alert('Annotation server not running. Start it with: node annotation-server.js')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-gray-500">Loading tutorial...</div>
      </div>
    )
  }

  // Not found
  if (!isJsonTutorial && (!TutorialComponent || !meta)) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Container className="py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tutorial not found</h1>
            <Link to="/" className="text-indigo-600 hover:text-indigo-700">
              ← Back to tutorials
            </Link>
          </div>
        </Container>
      </div>
    )
  }
  
  // JSON-based tutorial (new engine)
  if (isJsonTutorial && jsonTutorial) {
    const jsonMeta = {
      title: jsonTutorial.title,
      subtitle: jsonTutorial.subtitle,
      icon: meta?.icon || '📚',
      gradient: meta?.gradient || 'from-indigo-500 to-purple-500',
      glowColor: meta?.glowColor || 'rgba(99, 102, 241, 0.4)',
      readTime: jsonTutorial.readTime || meta?.readTime || '10 min',
      exercises: meta?.exercises || jsonTutorial.state ? Object.keys(jsonTutorial.state).length : 0,
      sections: jsonTutorial.content?.children?.filter(c => c.type === 'Section').map(s => s.props?.title) || [],
      isExperimental: meta?.isExperimental || false
    }
    
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ProgressBar />
        <TutorialHeader meta={jsonMeta} tutorialId={tutorialId} onRegroup={handleRegroup} />
        {jsonMeta.sections.length > 0 && (
          <SectionProgress sections={jsonMeta.sections} glowColor={jsonMeta.glowColor} />
        )}
        
        <AnnotatableContent 
          tutorialId={tutorialId}
          onAnnotationRequest={handleAnnotationRequest}
        >
          <Container className="py-12 max-w-3xl">
            <TutorialEngine 
              content={jsonTutorial.content} 
              state={jsonTutorial.state} 
            />
          </Container>
        </AnnotatableContent>
      </div>
    )
  }

  // Self-contained tutorials get the header but manage their own content
  if (selfContainedTutorials.includes(tutorialId)) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ProgressBar />
        <TutorialHeader meta={meta} tutorialId={tutorialId} onRegroup={handleRegroup} />
        {meta.sections && <SectionProgress sections={meta.sections} glowColor={meta.glowColor} />}
        <TutorialComponent />
      </div>
    )
  }

  // Legacy JSX tutorial
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ProgressBar />
      <TutorialHeader meta={meta} tutorialId={tutorialId} onRegroup={handleRegroup} />
      {meta.sections && <SectionProgress sections={meta.sections} glowColor={meta.glowColor} />}
      
      <AnnotatableContent 
        tutorialId={tutorialId}
        onAnnotationRequest={handleAnnotationRequest}
      >
        <TutorialComponent />
      </AnnotatableContent>
    </div>
  )
}
