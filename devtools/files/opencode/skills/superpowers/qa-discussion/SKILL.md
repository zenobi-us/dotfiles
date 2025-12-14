---
name: qa-discussion
description: Conducts structured Q&A discussions with users, handling multiple choice, single choice, and open-ended questions one at a time - tracks progress, validates answers, and provides summary reports for complete discussions
---

# Q&A Discussion Conductor

## Overview

Systematically conduct structured Q&A discussions with users. Handles multiple question types, tracks progress, validates responses, and generates comprehensive summary reports. Perfect for assessments, onboarding, feedback collection, or educational interactions.

## Core Capabilities

**Question Types:**
- **Multiple Choice**: Select one or more correct answers from options
- **Single Choice**: Select exactly one correct answer from options  
- **Open-Ended**: Free-form text responses with optional validation

**Session Features:**
- Progress tracking (Question X of Y)
- One question at a time for clarity
- Smart re-prompting on invalid answers with helpful feedback
- Complete response logging with validation status
- Summary report after discussion completion

## When to Use

Use this skill when you need to:
- Conduct structured assessments or quizzes
- Gather feedback through systematic questioning
- Onboard users with validated knowledge checks
- Create educational interactions with tracking
- Run audits or compliance checks requiring documented responses

**Don't use when:**
- Questions are casual or conversational (just chat naturally)
- You don't need to validate or track responses
- The discussion is exploratory rather than structured

## The Process

### Step 1: Define Questions

Create a structured question array with all necessary metadata:

```typescript
const questions: Question[] = [
  {
    id: 'q1',
    text: 'What is the capital of France?',
    type: 'single',
    options: ['London', 'Paris', 'Berlin', 'Madrid'],
    correctAnswer: 'Paris'
  },
  {
    id: 'q2',
    text: 'Select all that apply: Which are JavaScript frameworks?',
    type: 'multiple',
    options: ['React', 'Django', 'Vue', 'Laravel'],
    correctAnswers: ['React', 'Vue']
  },
  {
    id: 'q3',
    text: 'Explain why you chose your answer above',
    type: 'open',
    validation: (answer) => answer.length >= 10
  }
];
```

### Step 2: Conduct the Discussion

Call the main function to start:

```typescript
const session = await conductDiscussion(questions);
```

The skill will:
1. Display each question clearly with progress indicator
2. Wait for user response
3. Validate against question criteria
4. Re-prompt if invalid with helpful feedback
5. Store validated response
6. Move to next question
7. Generate summary when complete

### Step 3: Review Results

Access the session data for reporting:

```typescript
// Session structure:
{
  totalQuestions: number;
  completedQuestions: number;
  responses: Array<{
    questionId: string;
    text: string;
    answer: string;
    isValid: boolean;
    attempts: number;
  }>;
  summary: {
    totalAttempts: number;
    validResponses: number;
    invalidResponses: number;
    completionTime: number;
  };
}
```

## Display Conventions

**Question Presentation:**
- Clear title showing question number and total (e.g., "Question 1 of 5")
- Question text prominently displayed
- Options numbered for easy reference (1, 2, 3...)
- Instructions vary by type:
  - Single choice: "Select one option (enter number)"
  - Multiple choice: "Select all that apply (enter numbers separated by commas)"
  - Open-ended: "Enter your response (minimum 10 characters)"

**Validation Feedback:**
- Invalid input: "Invalid selection. Please enter 1, 2, 3, or 4"
- Multiple choice format error: "Invalid format. Use: 1,2,3"
- Open-ended validation failed: "Response too short. Please provide more detail"
- Empty input: "Response cannot be empty"

**Progress Display:**
- Each question shows: "Question 2 of 7"
- Visual spacing between questions for clarity
- Summary displayed after final question

## Error Handling

**Input Validation:**
- Out of range selections → re-prompt with valid range
- Wrong format (single choice given multiple) → explain expected format
- Empty responses → ask to provide an answer
- Custom validation failures → explain criteria with helpful message

**Session Errors:**
- No questions provided → throw clear error
- Invalid question type → validate during setup
- Timeout/interruption → save progress and allow resume

## Key Principles

- **One question at a time** - Never show multiple questions together
- **Clear feedback** - Always explain why an answer is invalid
- **Complete tracking** - Log every response with validation status
- **Flexible validation** - Support exact match, list validation, and custom functions
- **User-friendly** - Numbered options, clear instructions, helpful messages
- **Resumable** - Design allows pausing and resuming if needed

## Example Usage

See @index.ts for complete implementation with:
- Full TypeScript types for all question types
- Comprehensive error handling
- Real-world usage examples
- Integration patterns
