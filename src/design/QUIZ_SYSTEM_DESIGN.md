# Quiz System Design Document

## Overview

A Khan Academy-style quiz system that pairs with each tutorial, providing interactive assessments with immediate feedback, animations, and sound effects.

## Quiz JSON Schema

```json
{
  "id": "vector-projection-quiz",
  "tutorialId": "vector-projection",
  "title": "Vector Projection Quiz",
  "description": "Test your understanding of vector projection concepts",
  "version": 1,
  "createdAt": "2025-02-08T00:00:00Z",
  "updatedAt": "2025-02-08T00:00:00Z",
  "settings": {
    "shuffleQuestions": false,
    "shuffleOptions": true,
    "showExplanations": true,
    "passingScore": 70,
    "allowRetry": true,
    "timedMode": false,
    "timeLimit": null
  },
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "difficulty": 1,
      "points": 10,
      "concept": "dot-product",
      "question": "What does the dot product measure?",
      "options": [
        { "id": "a", "text": "The length of the result of crossing two vectors" },
        { "id": "b", "text": "How much two vectors 'agree' in direction" },
        { "id": "c", "text": "The angle between two vectors in radians" },
        { "id": "d", "text": "The sum of two vectors" }
      ],
      "correctAnswer": "b",
      "explanation": "The dot product measures directional agreement. Positive = same direction, negative = opposite, zero = perpendicular.",
      "hint": "Think about what happens when vectors point the same way vs opposite ways."
    },
    {
      "id": "q2",
      "type": "true-false",
      "difficulty": 1,
      "points": 5,
      "concept": "projection-basics",
      "question": "The projection of vector a onto vector b depends on the length of b.",
      "correctAnswer": false,
      "explanation": "The projection only depends on the direction of b and the angle between a and b, not b's length.",
      "hint": "Try changing b's length in the visualization - what happens to the projection?"
    },
    {
      "id": "q3",
      "type": "fill-in-blank",
      "difficulty": 2,
      "points": 15,
      "concept": "projection-formula",
      "question": "The formula for projecting a onto b is: proj_b(a) = ((a · b) / |b|²) × ____",
      "correctAnswer": ["b", "vector b", "b vector"],
      "caseSensitive": false,
      "explanation": "We multiply by b to get a vector pointing in b's direction with the computed scalar magnitude.",
      "hint": "The result needs to be a vector pointing in which direction?"
    },
    {
      "id": "q4",
      "type": "ordering",
      "difficulty": 2,
      "points": 20,
      "concept": "projection-steps",
      "question": "Put these projection calculation steps in the correct order:",
      "items": [
        { "id": "s1", "text": "Multiply the scalar by vector b" },
        { "id": "s2", "text": "Calculate the dot product a · b" },
        { "id": "s3", "text": "Divide by |b|² (squared length of b)" }
      ],
      "correctOrder": ["s2", "s3", "s1"],
      "explanation": "First compute a·b (how much they agree), then normalize by |b|² to get the scalar, then multiply by b to get the projection vector.",
      "hint": "Start with measuring how the vectors align."
    },
    {
      "id": "q5",
      "type": "multiple-choice",
      "difficulty": 3,
      "points": 15,
      "concept": "perpendicular",
      "question": "If vectors a and b are perpendicular, what is proj_b(a)?",
      "options": [
        { "id": "a", "text": "The zero vector (0, 0)" },
        { "id": "b", "text": "Vector a itself" },
        { "id": "c", "text": "Vector b itself" },
        { "id": "d", "text": "A vector perpendicular to both" }
      ],
      "correctAnswer": "a",
      "explanation": "When vectors are perpendicular, the dot product is zero, so the entire projection becomes the zero vector.",
      "hint": "What is a · b when they're perpendicular?"
    }
  ]
}
```

### Question Type Schemas

#### Multiple Choice
```typescript
{
  type: "multiple-choice",
  question: string,
  options: { id: string, text: string }[],
  correctAnswer: string,  // id of correct option
  explanation: string,
  hint?: string
}
```

#### True/False
```typescript
{
  type: "true-false",
  question: string,
  correctAnswer: boolean,
  explanation: string,
  hint?: string
}
```

#### Fill in the Blank
```typescript
{
  type: "fill-in-blank",
  question: string,  // Use ____ for blank
  correctAnswer: string | string[],  // Multiple acceptable answers
  caseSensitive?: boolean,
  explanation: string,
  hint?: string
}
```

#### Ordering
```typescript
{
  type: "ordering",
  question: string,
  items: { id: string, text: string }[],
  correctOrder: string[],  // ids in correct order
  explanation: string,
  hint?: string
}
```

## Component Architecture

```
src/components/QuizEngine/
├── index.jsx              # Main export
├── QuizEngine.jsx         # Main orchestrator component
├── QuizProgress.jsx       # Progress bar with animation
├── QuizQuestion.jsx       # Question router/container
├── questions/
│   ├── MultipleChoice.jsx
│   ├── TrueFalse.jsx
│   ├── FillInBlank.jsx
│   └── Ordering.jsx
├── QuizFeedback.jsx       # Correct/incorrect feedback
├── QuizSummary.jsx        # Final results screen
├── QuizSounds.jsx         # Sound effect manager
└── QuizStyles.css         # Animations and styles
```

### Key Components

#### QuizEngine.jsx
- Manages quiz state (current question, answers, score)
- Handles question navigation
- Tracks time if timed mode
- Computes final score

#### QuizProgress.jsx
- Visual progress bar
- Current question indicator
- Animation on progress

#### QuizQuestion.jsx
- Routes to appropriate question type component
- Handles answer submission
- Shows hint button
- Displays feedback

#### QuizFeedback.jsx
- Immediate visual feedback (correct/incorrect)
- Confetti animation on correct
- Shake animation on incorrect
- Shows explanation
- Continue button

#### QuizSummary.jsx
- Final score with grade
- Question-by-question review
- Retry button
- Return to tutorial link

## Sound Effects

Using Web Audio API or simple audio files:
- `correct.mp3` - Satisfying "ding" on correct answer
- `incorrect.mp3` - Gentle "bonk" on incorrect
- `complete.mp3` - Celebratory sound on quiz completion
- Optional: streak sounds for multiple correct in a row

## Animations (CSS/Framer Motion)

1. **Progress bar** - Smooth fill animation
2. **Question entrance** - Slide in from right
3. **Option hover** - Scale up slightly
4. **Correct answer** - Green pulse + confetti
5. **Incorrect answer** - Red shake
6. **Score reveal** - Count up animation

## Routes & Integration

### New Route
```jsx
<Route path="/quiz/:tutorialId" element={<QuizWrapper />} />
```

### QuizWrapper Component
```jsx
// src/pages/QuizWrapper.jsx
export default function QuizWrapper() {
  const { tutorialId } = useParams()
  const [quiz, setQuiz] = useState(null)
  
  useEffect(() => {
    // Load quiz JSON from src/content/{tutorialId}-quiz.json
    import(`../content/${tutorialId}-quiz.json`)
      .then(module => setQuiz(module.default))
      .catch(err => console.error('Quiz not found'))
  }, [tutorialId])
  
  if (!quiz) return <Loading />
  
  return (
    <QuizEngine 
      quiz={quiz} 
      tutorialId={tutorialId}
      onComplete={(results) => console.log('Quiz complete:', results)}
    />
  )
}
```

### TutorialWrapper Updates
Add quiz link alongside tree view:
```jsx
<Link to={`/quiz/${tutorialId}`}>
  <span>📝</span> Take Quiz
</Link>
```

## Auto-generation Endpoint

### POST /api/generate-quiz

Request:
```json
{
  "tutorialId": "vector-projection",
  "questionCount": 5,
  "difficultyMix": { "easy": 2, "medium": 2, "hard": 1 }
}
```

Response:
```json
{
  "success": true,
  "quiz": { /* full quiz JSON */ },
  "message": "Generated 5 questions for vector-projection"
}
```

### Generation Strategy
1. Load tutorial JSON content
2. Extract key concepts from section titles and content
3. Generate questions for each concept using AI
4. Validate question format
5. Save to `src/content/{tutorialId}-quiz.json`

## Tutorial Metadata Updates

Add to `tutorialMeta` object:
```javascript
{
  // ... existing fields
  quizAvailable: true,
  quizQuestionCount: 5,
  lastQuizUpdate: "2025-02-08T00:00:00Z"
}
```

## Implementation Plan

### Phase 1: Core Components ✓
1. Create QuizEngine folder structure
2. Implement QuizEngine.jsx (state management)
3. Implement QuizProgress.jsx
4. Implement MultipleChoice question type
5. Implement TrueFalse question type
6. Implement QuizFeedback.jsx

### Phase 2: Route & Integration
1. Add QuizWrapper.jsx page
2. Add route to App.jsx
3. Create example quiz JSON for vector-projection
4. Add quiz link to TutorialWrapper

### Phase 3: Advanced Features
1. Implement FillInBlank question type
2. Implement Ordering question type
3. Implement QuizSummary.jsx
4. Add sound effects
5. Add animations/confetti

### Phase 4: Auto-generation
1. Add POST /api/generate-quiz endpoint
2. Implement question generation prompts
3. Add validation for generated questions
4. Test with multiple tutorials

## File Naming Convention

- Quiz content: `src/content/{tutorialId}-quiz.json`
- Generated quizzes tracked in `src/content/quiz-manifest.json`
