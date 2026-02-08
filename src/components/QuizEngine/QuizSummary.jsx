import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Quiz summary shown after completion
 */
export default function QuizSummary({ quiz, questions, answers, score, tutorialId, onRetry }) {
  // Determine grade
  const getGrade = (percentage) => {
    if (percentage >= 90) return { letter: 'A', color: 'text-emerald-500', bg: 'bg-emerald-100' }
    if (percentage >= 80) return { letter: 'B', color: 'text-green-500', bg: 'bg-green-100' }
    if (percentage >= 70) return { letter: 'C', color: 'text-amber-500', bg: 'bg-amber-100' }
    if (percentage >= 60) return { letter: 'D', color: 'text-orange-500', bg: 'bg-orange-100' }
    return { letter: 'F', color: 'text-red-500', bg: 'bg-red-100' }
  }
  
  const grade = getGrade(score.percentage)
  const passed = score.percentage >= (quiz.settings?.passingScore || 70)
  
  return (
    <div className="quiz-summary">
      {/* Header */}
      <div className="quiz-summary-header">
        <h1 className="quiz-summary-title">Quiz Complete!</h1>
        <p className="quiz-summary-subtitle">{quiz.title}</p>
      </div>
      
      {/* Score circle */}
      <div className="quiz-summary-score">
        <div className={`quiz-score-circle ${grade.bg}`}>
          <span className={`quiz-score-grade ${grade.color}`}>{grade.letter}</span>
          <span className="quiz-score-percentage">{score.percentage}%</span>
        </div>
        
        <div className="quiz-score-details">
          <div className="quiz-score-stat">
            <span className="quiz-stat-value">{score.correct}</span>
            <span className="quiz-stat-label">Correct</span>
          </div>
          <div className="quiz-score-divider" />
          <div className="quiz-score-stat">
            <span className="quiz-stat-value">{score.total - score.correct}</span>
            <span className="quiz-stat-label">Incorrect</span>
          </div>
          <div className="quiz-score-divider" />
          <div className="quiz-score-stat">
            <span className="quiz-stat-value">{score.points}/{score.maxPoints}</span>
            <span className="quiz-stat-label">Points</span>
          </div>
        </div>
      </div>
      
      {/* Pass/fail message */}
      <div className={`quiz-summary-message ${passed ? 'quiz-passed' : 'quiz-failed'}`}>
        {passed ? (
          <>
            <span className="quiz-message-icon">🎉</span>
            <span>Great job! You passed the quiz!</span>
          </>
        ) : (
          <>
            <span className="quiz-message-icon">📚</span>
            <span>Keep learning! Review the material and try again.</span>
          </>
        )}
      </div>
      
      {/* Question review */}
      <div className="quiz-summary-review">
        <h3 className="quiz-review-title">Question Review</h3>
        <div className="quiz-review-list">
          {questions.map((q, i) => {
            const answer = answers[q.id]
            const isCorrect = answer?.isCorrect
            
            return (
              <div key={q.id} className="quiz-review-item">
                <div className={`quiz-review-icon ${isCorrect ? 'quiz-review-correct' : 'quiz-review-incorrect'}`}>
                  {isCorrect ? '✓' : '✗'}
                </div>
                <div className="quiz-review-content">
                  <span className="quiz-review-number">Q{i + 1}</span>
                  <span className="quiz-review-question">{q.question.slice(0, 80)}{q.question.length > 80 ? '...' : ''}</span>
                </div>
                <div className="quiz-review-points">
                  {isCorrect ? `+${q.points || 10}` : '0'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Actions */}
      <div className="quiz-summary-actions">
        {onRetry && (
          <button className="quiz-action-retry" onClick={onRetry}>
            <span>🔄</span> Try Again
          </button>
        )}
        <Link to={`/tutorial/${tutorialId}`} className="quiz-action-tutorial">
          <span>📖</span> Back to Tutorial
        </Link>
        <Link to="/" className="quiz-action-home">
          <span>🏠</span> All Tutorials
        </Link>
      </div>
    </div>
  )
}
