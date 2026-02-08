import React from 'react'

/**
 * Quiz progress bar with visual indicators
 */
export default function QuizProgress({ current, total, progress, answers, questions }) {
  return (
    <div className="quiz-progress">
      {/* Main progress bar */}
      <div className="quiz-progress-bar">
        <div 
          className="quiz-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Question dots */}
      <div className="quiz-progress-dots">
        {questions.map((q, i) => {
          const answer = answers[q.id]
          const isCurrent = i === current - 1
          const isAnswered = !!answer
          const isCorrect = answer?.isCorrect
          
          return (
            <div
              key={q.id}
              className={`
                quiz-progress-dot
                ${isCurrent ? 'quiz-progress-dot-current' : ''}
                ${isAnswered && isCorrect ? 'quiz-progress-dot-correct' : ''}
                ${isAnswered && !isCorrect ? 'quiz-progress-dot-incorrect' : ''}
              `}
              title={`Question ${i + 1}${isAnswered ? (isCorrect ? ' ✓' : ' ✗') : ''}`}
            >
              {isAnswered && (
                <span className="quiz-progress-dot-icon">
                  {isCorrect ? '✓' : '✗'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
