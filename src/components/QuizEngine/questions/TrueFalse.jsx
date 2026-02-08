import React from 'react'

/**
 * True/False question component
 */
export default function TrueFalse({ question, answer, onChange }) {
  return (
    <div className="quiz-options quiz-true-false">
      <button
        className={`quiz-option quiz-tf-option ${answer === true ? 'quiz-option-selected' : ''}`}
        onClick={() => onChange(true)}
      >
        <span className="quiz-tf-icon">✓</span>
        <span className="quiz-option-text">True</span>
      </button>
      
      <button
        className={`quiz-option quiz-tf-option ${answer === false ? 'quiz-option-selected' : ''}`}
        onClick={() => onChange(false)}
      >
        <span className="quiz-tf-icon">✗</span>
        <span className="quiz-option-text">False</span>
      </button>
    </div>
  )
}
