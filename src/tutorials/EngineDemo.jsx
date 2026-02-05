import React, { useState } from 'react'
import { TutorialContent } from '../components/TutorialEngine'
import { Container, Header } from '../components/SharedUI'
import tutorialData from '../content/engine-demo.json'

const ANNOTATION_SERVER = 'http://localhost:5190'

export default function EngineDemo() {
  const [data, setData] = useState(tutorialData)
  const [status, setStatus] = useState(null) // 'loading' | 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('')
  
  const handleAnnotationRequest = async ({ action, selectedText, context, tutorialId }) => {
    console.log('📝 Annotation request:', { action, selectedText, context, tutorialId })
    
    // Skip visualize for now
    if (action === 'visualize') {
      alert('Visualize is not yet implemented. Try Explain or Go Deeper!')
      return
    }
    
    setStatus('loading')
    setStatusMessage(`Generating ${action} for "${selectedText.slice(0, 30)}..."`)
    
    try {
      const response = await fetch(`${ANNOTATION_SERVER}/annotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          selectedText,
          context,
          tutorialId: 'engine-demo' // hardcoded for this tutorial
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Server error')
      }
      
      const result = await response.json()
      console.log('✅ Annotation result:', result)
      
      // Update local state with new content
      setData(result.updatedContent)
      
      setStatus('success')
      setStatusMessage(`Added ${action} annotation! Changes committed to Git.`)
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setStatus(null)
        setStatusMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('❌ Annotation error:', error)
      setStatus('error')
      setStatusMessage(`Error: ${error.message}. Is the annotation server running?`)
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setStatus(null)
        setStatusMessage('')
      }, 5000)
    }
  }

  return (
    <Container className="py-12">
      <Header 
        title={data.title} 
        subtitle={data.subtitle}
      />
      
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800">
          <strong>🧪 Experimental:</strong> This tutorial is rendered entirely from JSON data. 
          Select any text and choose Explain or Go Deeper to add annotations!
        </p>
      </div>
      
      {/* Status indicator */}
      {status && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          status === 'loading' ? 'bg-blue-100 text-blue-800' :
          status === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {status === 'loading' && <span className="animate-spin">⏳</span>}
            {status === 'success' && <span>✅</span>}
            {status === 'error' && <span>❌</span>}
            <span className="text-sm font-medium">{statusMessage}</span>
          </div>
        </div>
      )}
      
      <TutorialContent 
        data={data} 
        onAnnotationRequest={handleAnnotationRequest}
      />
      
      <div className="mt-12 pt-8 border-t border-gray-200">
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
            View raw JSON data ({Math.round(JSON.stringify(data).length / 1024)}KB)
          </summary>
          <pre className="mt-4 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto max-h-96 text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        Annotation server: {ANNOTATION_SERVER}
      </div>
    </Container>
  )
}
