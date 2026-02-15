# QA-Discussion Skill - Quick Start Guide

## 30-Second Setup

```typescript
import { conductDiscussion, Question } from './index';

const questions: Question[] = [
  {
    id: 'q1',
    text: 'What is 2 + 2?',
    type: 'single',
    options: ['3', '4', '5'],
    correctAnswer: '4'
  }
];

const session = await conductDiscussion(questions);
console.log(session.summary);
```

## All Question Types

### Single Choice
```typescript
{
  id: 'q1',
  text: 'Pick one',
  type: 'single',
  options: ['A', 'B', 'C'],
  correctAnswer: 'B'  // Optional
}
```

### Multiple Choice
```typescript
{
  id: 'q2',
  text: 'Pick all that apply',
  type: 'multiple',
  options: ['A', 'B', 'C', 'D'],
  correctAnswers: ['A', 'C'],  // Optional
  minSelections: 1,
  maxSelections: 3
}
```

### Open-Ended
```typescript
{
  id: 'q3',
  text: 'Your thoughts?',
  type: 'open',
  minLength: 10,
  maxLength: 500,  // Optional
  validation: (answer) => answer.length > 10  // Optional
}
```

## Session Results

```typescript
session.sessionId           // Unique ID
session.responses           // All answers
  .answer                  // User's response
  .isValid                 // Passed validation
  .attempts                // Number of tries
  .validationError         // Error (if invalid)

session.summary
  .successRate             // 0.0 to 1.0
  .validResponses          // Valid answer count
  .completionTime          // Milliseconds
  .averageAttempts         // Tries per question
```

## Common Patterns

### Feedback-Only Survey
```typescript
// Omit correctAnswer/correctAnswers for feedback mode
const questions: Question[] = [
  {
    id: 'feedback',
    text: 'How satisfied are you?',
    type: 'single',
    options: ['Very', 'Somewhat', 'Not Really']
    // No correctAnswer = feedback-only
  }
];
```

### Knowledge Assessment
```typescript
// Include correct answers for grading
const questions: Question[] = [
  {
    id: 'test1',
    text: 'What is X?',
    type: 'single',
    options: ['Wrong', 'Correct', 'Wrong'],
    correctAnswer: 'Correct'
  }
];

// Access results
if (session.summary.successRate === 1.0) {
  console.log('Perfect score!');
}
```

### Custom Validation
```typescript
{
  id: 'email',
  text: 'Enter your email',
  type: 'open',
  validation: (answer) => answer.includes('@')
}
```

## Error Handling

```typescript
try {
  const session = await conductDiscussion(questions);
  // Process results
} catch (error) {
  console.error('Discussion failed:', error.message);
}
```

## Exported Functions

| Function | Purpose |
|----------|---------|
| `conductDiscussion()` | Main entry point |
| `displayQuestion()` | Show single question |
| `validateAnswer()` | Validate input |
| `validateSingleChoice()` | Single choice validator |
| `validateMultipleChoice()` | Multiple choice validator |
| `validateOpenEnded()` | Open-ended validator |

## Tips

1. **Feedback-only**: Omit `correctAnswer`/`correctAnswers`
2. **Better feedback**: Write specific validation error messages
3. **Hints**: Add `hint` property to any question
4. **Constraints**: Use `minSelections`/`maxSelections` for multiple choice
5. **Validation**: Use custom functions for complex rules

## File Locations

- **SKILL.md** - OpenCode metadata
- **index.ts** - Full implementation (724 lines)
- **example.ts** - 5 complete examples
- **README.md** - Comprehensive docs
- **QUICK-START.md** - This file

## See Also

- README.md for detailed documentation
- example.ts for complete working examples
- index.ts for type definitions and JSDoc

---

**Ready to use!** Import and call `conductDiscussion()`.
