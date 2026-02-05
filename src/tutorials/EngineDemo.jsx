import React, { useState } from 'react'
import { TutorialContent } from '../components/TutorialEngine'
import { Container } from '../components/SharedUI'
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
          tutorialId: 'engine-demo'
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Server error')
      }
      
      const result = await response.json()
      console.log('✅ Annotation result:', result)
      
      setData(result.updatedContent)
      
      setStatus('success')
      setStatusMessage(`Added ${action} annotation! Changes committed to Git.`)
      
      setTimeout(() => {
        setStatus(null)
        setStatusMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('❌ Annotation error:', error)
      setStatus('error')
      setStatusMessage(`Error: ${error.message}. Is the annotation server running?`)
      
      setTimeout(() => {
        setStatus(null)
        setStatusMessage('')
      }, 5000)
    }
  }

  return (
    <>
      {/* Status indicator */}
      {status && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-lg max-w-sm border ${
          status === 'loading' ? 'bg-blue-50 text-blue-800 border-blue-200' :
          status === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {status === 'loading' && <span className="animate-spin text-lg">⏳</span>}
            {status === 'success' && <span className="text-lg">✅</span>}
            {status === 'error' && <span className="text-lg">❌</span>}
            <span className="text-sm font-medium">{statusMessage}</span>
          </div>
        </div>
      )}
      
      <Container size="narrow" className="py-12">
        {/* Tutorial content */}
        <article className="prose-tutorial">
          <TutorialContent 
            data={data} 
            onAnnotationRequest={handleAnnotationRequest}
          />
        </article>
        
        {/* Footer info */}
        <footer className="mt-16 pt-8 border-t border-slate-200">
          <div className="bg-slate-50 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">How It Works</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              This entire tutorial is defined as a JSON file. The TutorialEngine recursively renders it using a component registry. 
              Each element has a 'type' (component name) and optional 'props' and 'children'.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              When you request an annotation, the server calls Claude (via AWS Bedrock or Anthropic API), generates contextual content, 
              inserts it into the JSON, and commits to Git — all automatically.
            </p>
          </div>
          
          <details className="mt-6 text-sm">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-700 font-medium">
              ▶ View raw JSON data ({Math.round(JSON.stringify(data).length / 1024)}KB)
            </summary>
            <pre className="mt-4 p-6 bg-slate-900 text-slate-100 rounded-xl overflow-auto max-h-96 text-xs
              shadow-inner ring-1 ring-white/10">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
          
          <p className="mt-4 text-xs text-slate-400">
            Annotation server: {ANNOTATION_SERVER}
          </p>
        </footer>
      </Container>
    </>
  )
}
