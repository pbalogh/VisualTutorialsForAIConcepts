import React from 'react'

/**
 * Multiple Choice question component
 */
export default function MultipleChoice({ question, answer, onChange, options }) {
  const displayOptions = options || question.options
  
  return (
    <div className="quiz-options">
      {displayOptions.map((option, index) => {
        const isSelected = answer === option.id
        const letter = String.fromCharCode(65 + index) // A, B, C, D...
        
        return (
          <button
            key={option.id}
            className={`quiz-option ${isSelected ? 'quiz-option-selected' : ''}`}
            onClick={() => onChange(option.id)}
          >
            <span className="quiz-option-letter">{letter}</span>
            <span className="quiz-option-text">{option.text}</span>
            {isSelected && (
              <span className="quiz-option-check">✓</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
