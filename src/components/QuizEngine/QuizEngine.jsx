import React, { useState, useEffect, useCallback, useRef } from 'react'
import QuizProgress from './QuizProgress'
import QuizQuestion from './QuizQuestion'
import QuizFeedback from './QuizFeedback'
import QuizSummary from './QuizSummary'
import { playSound } from './QuizSounds'
import './QuizStyles.css'

/**
 * Main Quiz Engine component
 * Orchestrates the entire quiz experience
 */
export default function QuizEngine({ quiz, tutorialId, onComplete }) {
  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: { answer, isCorrect, timeSpent } }
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAnswer, setLastAnswer] = useState(null)
  const [isComplete, setIsComplete] = useState(false)
  const [streak, setStreak] = useState(0)
  
  // Timing
  const questionStartTime = useRef(Date.now())
  
  // Shuffle questions if enabled
  const [questions, setQuestions] = useState([])
  
  useEffect(() => {
    if (!quiz?.questions) return
    
    let qs = [...quiz.questions]
    if (quiz.settings?.shuffleQuestions) {
      qs = shuffleArray(qs)
    }
    setQuestions(qs)
  }, [quiz])
  
  // Current question
  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const progress = totalQuestions > 0 ? ((currentIndex) / totalQuestions) * 100 : 0
  
  // Calculate score
  const calculateScore = useCallback(() => {
    let correct = 0
    let total = 0
    let points = 0
    let maxPoints = 0
    
    questions.forEach(q => {
      const answer = answers[q.id]
      maxPoints += q.points || 10
      if (answer) {
        total++
        if (answer.isCorrect) {
          correct++
          points += q.points || 10
        }
      }
    })
    
    return {
      correct,
      total,
      points,
      maxPoints,
      percentage: maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0
    }
  }, [questions, answers])
  
  // Handle answer submission
  const handleSubmit = useCallback((answer) => {
    if (!currentQuestion) return
    
    const timeSpent = Date.now() - questionStartTime.current
    const isCorrect = checkAnswer(currentQuestion, answer)
    
    // Update answers
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        answer,
        isCorrect,
        timeSpent
      }
    }))
    
    // Update streak
    if (isCorrect) {
      setStreak(prev => prev + 1)
      playSound('correct', streak + 1)
    } else {
      setStreak(0)
      playSound('incorrect')
    }
    
    // Show feedback
    setLastAnswer({ answer, isCorrect, question: currentQuestion })
    setShowFeedback(true)
  }, [currentQuestion, streak])
  
  // Move to next question
  const handleNext = useCallback(() => {
    setShowFeedback(false)
    setLastAnswer(null)
    
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1)
      questionStartTime.current = Date.now()
    } else {
      // Quiz complete
      setIsComplete(true)
      const score = calculateScore()
      playSound('complete', score.percentage >= (quiz.settings?.passingScore || 70))
      onComplete?.(score)
    }
  }, [currentIndex, totalQuestions, calculateScore, quiz.settings?.passingScore, onComplete])
  
  // Retry quiz
  const handleRetry = useCallback(() => {
    setCurrentIndex(0)
    setAnswers({})
    setShowFeedback(false)
    setLastAnswer(null)
    setIsComplete(false)
    setStreak(0)
    questionStartTime.current = Date.now()
    
    // Re-shuffle if enabled
    if (quiz.settings?.shuffleQuestions) {
      setQuestions(shuffleArray([...quiz.questions]))
    }
  }, [quiz])
  
  // Loading state
  if (!quiz || questions.length === 0) {
    return (
      <div className="quiz-loading">
        <div className="quiz-loading-spinner" />
        <p>Loading quiz...</p>
      </div>
    )
  }
  
  // Complete state
  if (isComplete) {
    return (
      <QuizSummary
        quiz={quiz}
        questions={questions}
        answers={answers}
        score={calculateScore()}
        tutorialId={tutorialId}
        onRetry={quiz.settings?.allowRetry ? handleRetry : null}
      />
    )
  }
  
  return (
    <div className="quiz-engine">
      {/* Header */}
      <div className="quiz-header">
        <h1 className="quiz-title">{quiz.title}</h1>
        <div className="quiz-meta">
          Question {currentIndex + 1} of {totalQuestions}
          {streak >= 3 && (
            <span className="quiz-streak">🔥 {streak} streak!</span>
          )}
        </div>
      </div>
      
      {/* Progress */}
      <QuizProgress 
        current={currentIndex + 1} 
        total={totalQuestions}
        progress={progress}
        answers={answers}
        questions={questions}
      />
      
      {/* Question Area */}
      <div className="quiz-content">
        {showFeedback ? (
          <QuizFeedback
            isCorrect={lastAnswer.isCorrect}
            question={lastAnswer.question}
            userAnswer={lastAnswer.answer}
            explanation={quiz.settings?.showExplanations ? lastAnswer.question.explanation : null}
            onNext={handleNext}
            isLastQuestion={currentIndex === totalQuestions - 1}
          />
        ) : (
          <QuizQuestion
            question={currentQuestion}
            onSubmit={handleSubmit}
            shuffleOptions={quiz.settings?.shuffleOptions}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Check if the answer is correct based on question type
 */
function checkAnswer(question, answer) {
  switch (question.type) {
    case 'multiple-choice':
      return answer === question.correctAnswer
      
    case 'true-false':
      return answer === question.correctAnswer
      
    case 'fill-in-blank': {
      const correct = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : [question.correctAnswer]
      const userAnswer = question.caseSensitive ? answer : answer.toLowerCase().trim()
      return correct.some(c => {
        const correctAnswer = question.caseSensitive ? c : c.toLowerCase().trim()
        return userAnswer === correctAnswer
      })
    }
      
    case 'ordering':
      return JSON.stringify(answer) === JSON.stringify(question.correctOrder)
      
    default:
      return false
  }
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
