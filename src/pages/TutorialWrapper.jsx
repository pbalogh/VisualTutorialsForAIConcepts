import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import MatrixDiscovery from '../tutorials/MatrixDiscovery.jsx'
import MatrixFromVectors from '../tutorials/MatrixFromVectors.jsx'
import LeastSquares from '../tutorials/LeastSquares.jsx'
import VectorProjection from '../tutorials/VectorProjection.jsx'
import LeadLagCorrelation from '../tutorials/LeadLagCorrelation.jsx'
import EngineDemo from '../tutorials/EngineDemo.jsx'
import { Container } from '../components/SharedUI.jsx'
import { AnnotatableContent } from '../components/AnnotationSystem.jsx'

const tutorialComponents = {
  'matrix-discovery': MatrixDiscovery,
  'matrix-from-vectors': MatrixFromVectors,
  'least-squares': LeastSquares,
  'vector-projection': VectorProjection,
  'lead-lag-correlation': LeadLagCorrelation,
  'engine-demo': EngineDemo
}

const tutorialMeta = {
  'matrix-discovery': {
    title: 'Matrix Discovery',
    subtitle: 'Interactive tool for discovering transformation matrices from input-output pairs',
    icon: '🔢',
    gradient: 'from-orange-500 to-amber-500',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    readTime: '12 min',
    exercises: 2
  },
  'matrix-from-vectors': {
    title: 'Matrix from Vectors',
    subtitle: 'Explore how vectors transform through matrices and visualize the geometric transformation',
    icon: '🎯',
    gradient: 'from-pink-500 to-rose-500',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    readTime: '10 min',
    exercises: 3
  },
  'least-squares': {
    title: 'Least Squares Regression',
    subtitle: 'Interactive exploration of fitting lines to data by minimizing squared errors',
    icon: '📊',
    gradient: 'from-indigo-500 to-blue-500',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    readTime: '15 min',
    exercises: 2
  },
  'vector-projection': {
    title: 'Vector Projection',
    subtitle: 'Interactive exploration of projecting one 2D vector onto another',
    icon: '↗️',
    gradient: 'from-emerald-500 to-teal-500',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    readTime: '8 min',
    exercises: 1
  },
  'lead-lag-correlation': {
    title: 'Lead-Lag Correlation',
    subtitle: 'Discover predictive relationships in time series data with cross-correlation analysis',
    icon: '📈',
    gradient: 'from-blue-500 to-cyan-500',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    readTime: '10 min',
    exercises: 2
  },
  'engine-demo': {
    title: 'Tutorial Engine Demo',
    subtitle: 'A self-documenting demonstration of the data-driven tutorial system',
    icon: '🧪',
    gradient: 'from-violet-500 to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    readTime: '8 min',
    exercises: 3,
    isExperimental: true
  }
}

// Tutorials that handle their own content layout (but we still wrap with header)
const selfContainedTutorials = ['engine-demo']

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

// Premium tutorial header with atmospheric effects
function TutorialHeader({ meta }) {
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
      
      {/* Ambient glow from icon color */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: meta.glowColor }}
      />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      <div className="relative max-w-3xl mx-auto px-6 sm:px-8 pt-16 pb-12">
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
        
        {/* Meta info row */}
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{meta.readTime} read</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>{meta.exercises} interactive exercises</span>
          </div>
        </div>
        
        {/* Annotation hint */}
        <div className="mt-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
          bg-white/5 border border-white/10 text-sm text-gray-400">
          <span className="text-yellow-400">✨</span>
          Select any text to get AI explanations
        </div>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#fafafa] to-transparent" />
    </header>
  )
}

export default function TutorialWrapper() {
  const { tutorialId } = useParams()
  const TutorialComponent = tutorialComponents[tutorialId]
  const meta = tutorialMeta[tutorialId]
  const [annotations, setAnnotations] = useState([])

  const handleAnnotationRequest = async ({ action, selectedText, context, tutorialId }) => {
    console.log('📝 Annotation request:', { action, selectedText, context, tutorialId })
    
    const mockResponse = {
      id: `ann-${Date.now()}`,
      type: action,
      trigger: selectedText,
      content: `[Mock ${action}] This is where the AI-generated ${action} for "${selectedText}" would appear.`,
      createdAt: new Date().toISOString(),
    }
    
    setAnnotations(prev => [...prev, mockResponse])
    alert(`✅ ${action.toUpperCase()} requested for: "${selectedText}"\n\nIn production, this would call an API to generate content.`)
  }

  if (!TutorialComponent || !meta) {
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

  // Self-contained tutorials get the header but manage their own content
  if (selfContainedTutorials.includes(tutorialId)) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <ProgressBar />
        <TutorialHeader meta={meta} />
        <TutorialComponent />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ProgressBar />
      <TutorialHeader meta={meta} />
      
      <AnnotatableContent 
        tutorialId={tutorialId}
        onAnnotationRequest={handleAnnotationRequest}
      >
        <TutorialComponent />
      </AnnotatableContent>
      
      {/* Annotation log (debug) */}
      {annotations.length > 0 && (
        <div className="fixed bottom-4 left-4 max-w-sm bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-h-64 overflow-auto z-40">
          <div className="text-xs font-medium text-gray-500 mb-2">
            Annotation Log ({annotations.length})
          </div>
          {annotations.map((ann) => (
            <div key={ann.id} className="text-xs border-t border-gray-100 pt-2 mt-2">
              <span className="font-medium">{ann.type}:</span> {ann.trigger}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
