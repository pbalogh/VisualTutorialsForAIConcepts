import React from 'react'

/**
 * Fill in the Blank question component
 */
export default function FillInBlank({ question, answer, onChange }) {
  // Parse the question to find the blank position
  const parts = question.question.split('____')
  
  return (
    <div className="quiz-fill-blank">
      <div className="quiz-fill-question">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span>{part}</span>
            {i < parts.length - 1 && (
              <input
                type="text"
                className="quiz-fill-input"
                value={answer || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Your answer"
                autoFocus
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      <p className="quiz-fill-hint">
        Type your answer in the blank above
      </p>
    </div>
  )
}
