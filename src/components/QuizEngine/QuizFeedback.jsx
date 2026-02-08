import React, { useEffect, useState, useRef } from 'react'

/**
 * Feedback component shown after answering
 * Shows correct/incorrect animation and explanation
 */
export default function QuizFeedback({ 
  isCorrect, 
  question, 
  userAnswer, 
  explanation, 
  onNext,
  isLastQuestion 
}) {
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiRef = useRef(null)
  
  // Trigger confetti for correct answers
  useEffect(() => {
    if (isCorrect) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    }
  }, [isCorrect])
  
  // Format the user's answer for display
  const formatAnswer = () => {
    switch (question.type) {
      case 'multiple-choice':
        const option = question.options.find(o => o.id === userAnswer)
        return option?.text || userAnswer
        
      case 'true-false':
        return userAnswer ? 'True' : 'False'
        
      case 'fill-in-blank':
        return userAnswer
        
      case 'ordering':
        return question.items
          ?.filter(item => userAnswer.includes(item.id))
          .sort((a, b) => userAnswer.indexOf(a.id) - userAnswer.indexOf(b.id))
          .map((item, i) => `${i + 1}. ${item.text}`)
          .join(' → ')
        
      default:
        return String(userAnswer)
    }
  }
  
  // Format the correct answer for display
  const formatCorrectAnswer = () => {
    switch (question.type) {
      case 'multiple-choice':
        const option = question.options.find(o => o.id === question.correctAnswer)
        return option?.text || question.correctAnswer
        
      case 'true-false':
        return question.correctAnswer ? 'True' : 'False'
        
      case 'fill-in-blank':
        return Array.isArray(question.correctAnswer) 
          ? question.correctAnswer.join(' or ')
          : question.correctAnswer
        
      case 'ordering':
        return question.items
          ?.filter(item => question.correctOrder.includes(item.id))
          .sort((a, b) => question.correctOrder.indexOf(a.id) - question.correctOrder.indexOf(b.id))
          .map((item, i) => `${i + 1}. ${item.text}`)
          .join(' → ')
        
      default:
        return String(question.correctAnswer)
    }
  }
  
  return (
    <div className={`quiz-feedback ${isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-incorrect'}`}>
      {/* Confetti effect */}
      {showConfetti && (
        <div className="quiz-confetti" ref={confettiRef}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="quiz-confetti-piece"
              style={{
                '--delay': `${Math.random() * 0.5}s`,
                '--x': `${Math.random() * 200 - 100}px`,
                '--rotation': `${Math.random() * 720}deg`,
                '--color': ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'][i % 5]
              }}
            />
          ))}
        </div>
      )}
      
      {/* Result icon */}
      <div className={`quiz-feedback-icon ${isCorrect ? 'animate-bounce-in' : 'animate-shake'}`}>
        {isCorrect ? '🎉' : '😔'}
      </div>
      
      {/* Result message */}
      <h3 className="quiz-feedback-title">
        {isCorrect ? 'Correct!' : 'Not quite...'}
      </h3>
      
      {/* Answer comparison */}
      <div className="quiz-feedback-answers">
        <div className={`quiz-feedback-answer ${isCorrect ? 'quiz-answer-correct' : 'quiz-answer-incorrect'}`}>
          <span className="quiz-answer-label">Your answer:</span>
          <span className="quiz-answer-value">{formatAnswer()}</span>
        </div>
        
        {!isCorrect && (
          <div className="quiz-feedback-answer quiz-answer-correct">
            <span className="quiz-answer-label">Correct answer:</span>
            <span className="quiz-answer-value">{formatCorrectAnswer()}</span>
          </div>
        )}
      </div>
      
      {/* Explanation */}
      {explanation && (
        <div className="quiz-feedback-explanation animate-fade-in">
          <span className="quiz-explanation-icon">💡</span>
          <p>{explanation}</p>
        </div>
      )}
      
      {/* Continue button */}
      <button className="quiz-feedback-button" onClick={onNext}>
        {isLastQuestion ? 'See Results' : 'Next Question'}
        <span className="quiz-button-arrow">→</span>
      </button>
    </div>
  )
}
