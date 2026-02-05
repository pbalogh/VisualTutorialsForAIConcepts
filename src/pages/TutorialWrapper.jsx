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
    readTime: '12 min',
    exercises: 2
  },
  'matrix-from-vectors': {
    title: 'Matrix from Vectors',
    subtitle: 'Explore how vectors transform through matrices and visualize the geometric transformation',
    icon: '🎯',
    gradient: 'from-pink-500 to-rose-500',
    readTime: '10 min',
    exercises: 3
  },
  'least-squares': {
    title: 'Least Squares Regression',
    subtitle: 'Interactive exploration of fitting lines to data by minimizing squared errors',
    icon: '📊',
    gradient: 'from-indigo-500 to-blue-500',
    readTime: '15 min',
    exercises: 2
  },
  'vector-projection': {
    title: 'Vector Projection',
    subtitle: 'Interactive exploration of projecting one 2D vector onto another',
    icon: '↗️',
    gradient: 'from-emerald-500 to-teal-500',
    readTime: '8 min',
    exercises: 1
  },
  'lead-lag-correlation': {
    title: 'Lead-Lag Correlation',
    subtitle: 'Discover predictive relationships in time series data with cross-correlation analysis',
    icon: '📈',
    gradient: 'from-blue-500 to-cyan-500',
    readTime: '10 min',
    exercises: 2
  },
  'engine-demo': {
    title: 'Tutorial Engine Demo',
    subtitle: 'A self-documenting demonstration of the data-driven tutorial system',
    icon: '🧪',
    gradient: 'from-violet-500 to-purple-600',
    readTime: '8 min',
    exercises: 3,
    isExperimental: true
  }
}

// Tutorials that handle their own content layout (but we still wrap with header)
const selfContainedTutorials = ['engine-demo']

// Progress bar component
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
    <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// Tutorial header component
function TutorialHeader({ meta }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      <div className="relative max-w-4xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        {/* Back link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Back to tutorials
        </Link>
        
        <div className="flex items-start gap-6">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${meta.gradient}
            flex items-center justify-center flex-shrink-0
            shadow-lg shadow-black/20`}
          >
            <span className="text-3xl">{meta.icon}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Experimental badge */}
            {meta.isExperimental && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                bg-gradient-to-r from-violet-500 to-purple-500 text-white mb-3">
                Experimental
              </span>
            )}
            
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {meta.title}
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg text-slate-300 mt-3 leading-relaxed">
              {meta.subtitle}
            </p>
            
            {/* Meta info */}
            <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {meta.readTime} read
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {meta.exercises} interactive exercises
              </span>
            </div>
          </div>
        </div>
        
        {/* Annotation hint */}
        <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
          <span className="text-yellow-400">✨</span>
          Select any text to annotate
        </div>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
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
      <div className="min-h-screen bg-slate-50">
        <Container className="py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tutorial not found</h1>
            <Link to="/" className="text-blue-600 hover:text-blue-700">
              ← Back to listing
            </Link>
          </div>
        </Container>
      </div>
    )
  }

  // Self-contained tutorials get the header but manage their own content
  if (selfContainedTutorials.includes(tutorialId)) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ProgressBar />
        <TutorialHeader meta={meta} />
        <TutorialComponent />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
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
        <div className="fixed bottom-4 left-4 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-h-64 overflow-auto z-40">
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
