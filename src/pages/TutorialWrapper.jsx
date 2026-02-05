import React, { useState } from 'react'
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

// Tutorials that handle their own annotation (like EngineDemo)
const selfContainedTutorials = ['engine-demo']

export default function TutorialWrapper() {
  const { tutorialId } = useParams()
  const TutorialComponent = tutorialComponents[tutorialId]
  const [annotations, setAnnotations] = useState([])

  const handleAnnotationRequest = async ({ action, selectedText, context, tutorialId }) => {
    console.log('📝 Annotation request:', { action, selectedText, context, tutorialId })
    
    // For now, just log it - later this will POST to Netlify Function / Lambda
    // The endpoint would:
    // 1. Call Claude with the context + selection + action type
    // 2. Return generated content
    // 3. Optionally persist to storage
    
    const mockResponse = {
      id: `ann-${Date.now()}`,
      type: action,
      trigger: selectedText,
      content: `[Mock ${action}] This is where the AI-generated ${action} for "${selectedText}" would appear. Context: "${context.slice(0, 100)}..."`,
      createdAt: new Date().toISOString(),
    }
    
    setAnnotations(prev => [...prev, mockResponse])
    
    // TODO: Replace with real API call
    // const response = await fetch('/.netlify/functions/annotate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ action, selectedText, context, tutorialId })
    // })
    // const data = await response.json()
    // setAnnotations(prev => [...prev, data])
    
    alert(`✅ ${action.toUpperCase()} requested for: "${selectedText}"\n\nIn production, this would call an API to generate content.\n\nCheck console for details.`)
  }

  if (!TutorialComponent) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tutorial not found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-700">
            ← Back to listing
          </Link>
        </div>
      </Container>
    )
  }

  // Self-contained tutorials manage their own layout and annotations
  if (selfContainedTutorials.includes(tutorialId)) {
    return (
      <div>
        <div className="border-b border-gray-200 bg-gray-50">
          <Container className="py-4 flex justify-between items-center">
            <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to tutorials
            </Link>
            <div className="text-sm text-gray-500">
              💡 Select any text to annotate
            </div>
          </Container>
        </div>
        <TutorialComponent />
      </div>
    )
  }

  return (
    <div>
      <div className="border-b border-gray-200 bg-gray-50">
        <Container className="py-4 flex justify-between items-center">
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to tutorials
          </Link>
          <div className="text-sm text-gray-500">
            💡 Select any text to annotate
          </div>
        </Container>
      </div>
      
      <AnnotatableContent 
        tutorialId={tutorialId}
        onAnnotationRequest={handleAnnotationRequest}
      >
        <TutorialComponent />
      </AnnotatableContent>
      
      {/* Show logged annotations for debugging */}
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
