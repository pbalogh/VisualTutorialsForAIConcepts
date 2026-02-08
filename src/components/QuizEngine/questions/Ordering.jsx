import React, { useState, useEffect } from 'react'

/**
 * Ordering question component - drag and drop to reorder items
 */
export default function Ordering({ question, answer, onChange }) {
  const [items, setItems] = useState([])
  const [draggedIndex, setDraggedIndex] = useState(null)
  
  // Initialize items (shuffled)
  useEffect(() => {
    if (question.items) {
      const shuffled = [...question.items].sort(() => Math.random() - 0.5)
      setItems(shuffled)
      onChange(shuffled.map(item => item.id))
    }
  }, [question.id])
  
  // Handle drag start
  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }
  
  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    const newItems = [...items]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, removed)
    
    setItems(newItems)
    setDraggedIndex(index)
    onChange(newItems.map(item => item.id))
  }
  
  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }
  
  // Move item up or down (for non-drag interaction)
  const moveItem = (fromIndex, direction) => {
    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= items.length) return
    
    const newItems = [...items]
    const [removed] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, removed)
    
    setItems(newItems)
    onChange(newItems.map(item => item.id))
  }
  
  return (
    <div className="quiz-ordering">
      <p className="quiz-ordering-hint">
        Drag items or use arrows to put them in the correct order
      </p>
      
      <div className="quiz-ordering-list">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`quiz-ordering-item ${draggedIndex === index ? 'quiz-ordering-dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <span className="quiz-ordering-number">{index + 1}</span>
            <span className="quiz-ordering-text">{item.text}</span>
            <div className="quiz-ordering-arrows">
              <button
                className="quiz-ordering-arrow"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                title="Move up"
              >
                ▲
              </button>
              <button
                className="quiz-ordering-arrow"
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                title="Move down"
              >
                ▼
              </button>
            </div>
            <span className="quiz-ordering-handle">⋮⋮</span>
          </div>
        ))}
      </div>
    </div>
  )
}
