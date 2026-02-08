import React, { useState, useEffect, useMemo } from 'react'
import MultipleChoice from './questions/MultipleChoice'
import TrueFalse from './questions/TrueFalse'
import FillInBlank from './questions/FillInBlank'
import Ordering from './questions/Ordering'

/**
 * Question router - renders appropriate question type component
 */
export default function QuizQuestion({ question, onSubmit, shuffleOptions }) {
  const [answer, setAnswer] = useState(null)
  const [showHint, setShowHint] = useState(false)
  
  // Reset state when question changes
  useEffect(() => {
    setAnswer(null)
    setShowHint(false)
  }, [question.id])
  
  // Shuffle options if enabled (for multiple choice)
  const shuffledOptions = useMemo(() => {
    if (!question.options || !shuffleOptions) return question.options
    return [...question.options].sort(() => Math.random() - 0.5)
  }, [question.options, shuffleOptions, question.id])
  
  // Handle submit
  const handleSubmit = () => {
    if (answer === null || answer === undefined) return
    onSubmit(answer)
  }
  
  // Determine if submit is enabled
  const canSubmit = answer !== null && answer !== undefined && 
    (question.type !== 'fill-in-blank' || answer.trim() !== '') &&
    (question.type !== 'ordering' || answer.length === question.items?.length)
  
  // Difficulty indicator
  const difficultyLabel = {
    1: { text: 'Easy', color: 'text-green-600 bg-green-100' },
    2: { text: 'Medium', color: 'text-amber-600 bg-amber-100' },
    3: { text: 'Hard', color: 'text-red-600 bg-red-100' }
  }[question.difficulty] || { text: 'Medium', color: 'text-amber-600 bg-amber-100' }
  
  // Render the question type component
  const renderQuestionType = () => {
    const props = {
      question,
      answer,
      onChange: setAnswer,
      options: shuffledOptions
    }
    
    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoice {...props} />
      case 'true-false':
        return <TrueFalse {...props} />
      case 'fill-in-blank':
        return <FillInBlank {...props} />
      case 'ordering':
        return <Ordering {...props} />
      default:
        return <p className="text-red-500">Unknown question type: {question.type}</p>
    }
  }
  
  return (
    <div className="quiz-question animate-slide-in">
      {/* Question header */}
      <div className="quiz-question-header">
        <span className={`quiz-difficulty ${difficultyLabel.color}`}>
          {difficultyLabel.text}
        </span>
        <span className="quiz-points">
          {question.points || 10} pts
        </span>
      </div>
      
      {/* Question text */}
      <h2 className="quiz-question-text">{question.question}</h2>
      
      {/* Question type component */}
      <div className="quiz-question-body">
        {renderQuestionType()}
      </div>
      
      {/* Hint section */}
      {question.hint && (
        <div className="quiz-hint-section">
          {showHint ? (
            <div className="quiz-hint animate-fade-in">
              <span className="quiz-hint-icon">💡</span>
              <span className="quiz-hint-text">{question.hint}</span>
            </div>
          ) : (
            <button 
              className="quiz-hint-button"
              onClick={() => setShowHint(true)}
            >
              Need a hint?
            </button>
          )}
        </div>
      )}
      
      {/* Submit button */}
      <div className="quiz-submit-section">
        <button
          className={`quiz-submit-button ${canSubmit ? '' : 'quiz-submit-disabled'}`}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          Submit Answer
        </button>
      </div>
    </div>
  )
}
