import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import QuizEngine from '../components/QuizEngine'
import { Container } from '../components/SharedUI.jsx'

/**
 * Quiz Wrapper - loads quiz JSON and renders QuizEngine
 */
export default function QuizWrapper() {
  const { tutorialId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        // Try to load the quiz JSON
        const module = await import(`../content/${tutorialId}-quiz.json`)
        setQuiz(module.default || module)
      } catch (e) {
        console.error('Failed to load quiz:', e)
        setError('Quiz not found for this tutorial.')
      } finally {
        setLoading(false)
      }
    }
    
    loadQuiz()
  }, [tutorialId])
  
  // Handle quiz completion
  const handleComplete = (score) => {
    console.log('Quiz completed:', score)
    // Could save to localStorage or send to server
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p>Loading quiz...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        {/* Header */}
        <header className="relative overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.3), transparent),
                linear-gradient(to bottom, #0f0e17, #1a1825)
              `
            }}
          />
          
          <div className="relative max-w-3xl mx-auto px-6 py-16">
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Link to="/" className="hover:text-indigo-400 transition-colors">Tutorials</Link>
              <span className="text-gray-600">/</span>
              <Link to={`/tutorial/${tutorialId}`} className="hover:text-indigo-400 transition-colors">
                {tutorialId}
              </Link>
              <span className="text-gray-600">/</span>
              <span className="text-gray-500">Quiz</span>
            </nav>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📝</span>
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">Quiz Not Available</h1>
              <p className="text-gray-400 mb-8">
                {error || 'No quiz has been created for this tutorial yet.'}
              </p>
              
              <div className="flex gap-4 justify-center">
                <Link 
                  to={`/tutorial/${tutorialId}`}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  ← Back to Tutorial
                </Link>
                <Link 
                  to="/"
                  className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  All Tutorials
                </Link>
              </div>
            </div>
          </div>
        </header>
      </div>
    )
  }
  
  // Quiz loaded - render QuizEngine
  return (
    <QuizEngine 
      quiz={quiz} 
      tutorialId={tutorialId}
      onComplete={handleComplete}
    />
  )
}
