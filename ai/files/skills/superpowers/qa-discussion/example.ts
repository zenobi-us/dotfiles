/**
 * Example Usage of the Q&A Discussion Skill
 *
 * This file demonstrates various use cases and patterns for the qa-discussion skill,
 * including different question types, validation patterns, and session analysis.
 */

import {
  conductDiscussion,
  Question,
  DiscussionSession,
  SingleChoiceQuestion,
  MultiChoiceQuestion,
  OpenEndedQuestion
} from './index';

// ============================================================================
// EXAMPLE 1: Simple Quiz with Single and Multiple Choice
// ============================================================================

/**
 * Basic assessment covering different question types
 */
async function exampleSimpleQuiz(): Promise<void> {
  console.log('📚 Running Simple Quiz Example\n');

  const questions: Question[] = [
    {
      id: 'q1',
      text: 'What is the capital of France?',
      type: 'single',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: 'Paris',
      hint: 'It is known as the City of Light'
    },
    {
      id: 'q2',
      text: 'Which of these are programming languages? (Select all that apply)',
      type: 'multiple',
      options: ['JavaScript', 'HTML', 'Python', 'CSS'],
      correctAnswers: ['JavaScript', 'Python'],
      minSelections: 2
    },
    {
      id: 'q3',
      text: 'Describe the capital you selected in Question 1. What makes it special?',
      type: 'open',
      minLength: 20,
      validation: (answer) => answer.length >= 20 && !answer.includes('xyz')
    }
  ];

  try {
    const session = await conductDiscussion(questions);
    console.log('\n📊 Session Results:\n');
    console.log(`Session ID: ${session.sessionId}`);
    console.log(`Completion Time: ${(session.summary.completionTime / 1000).toFixed(2)}s`);
    console.log(`Success Rate: ${(session.summary.successRate * 100).toFixed(1)}%`);
  } catch (error) {
    console.error('Quiz failed:', error);
  }
}

// ============================================================================
// EXAMPLE 2: Onboarding Assessment
// ============================================================================

/**
 * Onboarding questionnaire for new team members
 * Focuses on validation of practical knowledge
 */
async function exampleOnboarding(): Promise<void> {
  console.log('👥 Running Onboarding Assessment Example\n');

  const questions: Question[] = [
    {
      id: 'onboard_1',
      text: 'What is our primary tech stack?',
      type: 'single',
      options: ['TypeScript + React', 'Python + Django', 'Go + Vue', 'Rust + Svelte'],
      correctAnswer: 'TypeScript + React'
    },
    {
      id: 'onboard_2',
      text: 'Which tools do you have access to for development?',
      type: 'multiple',
      options: ['Git', 'Docker', 'Kubernetes', 'Jenkins', 'AWS'],
      correctAnswers: ['Git', 'Docker', 'AWS'],
      minSelections: 3,
      maxSelections: 5,
      hint: 'Check with your team lead if unsure'
    },
    {
      id: 'onboard_3',
      text: 'Explain your understanding of our code review process',
      type: 'open',
      minLength: 30,
      validation: (answer) =>
        answer.includes('review') ||
        answer.includes('PR') ||
        answer.includes('approve')
    }
  ];

  try {
    const session = await conductDiscussion(questions);

    // Analyze session
    console.log('\n📋 Onboarding Summary:\n');
    if (session.summary.successRate === 1.0) {
      console.log(
        '✅ All answers validated! Team member is ready to begin.'
      );
    } else {
      console.log(
        `⚠️ ${session.summary.invalidResponses} answers need follow-up.`
      );
      session.responses.forEach((response) => {
        if (!response.isValid) {
          console.log(`  - Q${response.questionId}: "${response.answer}"`);
          console.log(`    Error: ${response.validationError}`);
        }
      });
    }
  } catch (error) {
    console.error('Onboarding assessment failed:', error);
  }
}

// ============================================================================
// EXAMPLE 3: Customer Feedback Survey
// ============================================================================

/**
 * Customer satisfaction survey with mostly open-ended questions
 * Demonstrates feedback-only mode (no correct answers)
 */
async function exampleFeedbackSurvey(): Promise<void> {
  console.log('💬 Running Customer Feedback Survey Example\n');

  const questions: Question[] = [
    {
      id: 'feedback_1',
      text: 'How satisfied are you with our service?',
      type: 'single',
      options: ['Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']
      // Note: No correctAnswer - this is feedback-only
    },
    {
      id: 'feedback_2',
      text: 'Which features do you use most? (Select all that apply)',
      type: 'multiple',
      options: ['Dashboard', 'Analytics', 'Reports', 'Integration', 'API'],
      minSelections: 1,
      maxSelections: 5
      // No correctAnswers - recording preferences, not testing
    },
    {
      id: 'feedback_3',
      text: 'What improvements would you like to see?',
      type: 'open',
      minLength: 10
      // No validation function - accepting any substantial response
    },
    {
      id: 'feedback_4',
      text: 'Would you recommend us to others?',
      type: 'single',
      options: ['Yes', 'Maybe', 'No']
    }
  ];

  try {
    const session = await conductDiscussion(questions);

    // Analyze feedback
    console.log('\n📈 Feedback Analysis:\n');
    console.log(`Total Responses Collected: ${session.summary.completedQuestions}`);
    console.log(`Average Time per Question: ${
      (session.summary.completionTime / session.summary.completedQuestions / 1000).toFixed(2)
    }s`);

    // Group by question
    const satisfaction = session.responses.find((r) => r.questionId === 'feedback_1');
    const improvements = session.responses.find((r) => r.questionId === 'feedback_3');

    if (satisfaction) {
      console.log(`\nSatisfaction Level: ${satisfaction.answer}`);
    }
    if (improvements) {
      console.log(`\nRequested Improvements: "${improvements.answer}"`);
    }
  } catch (error) {
    console.error('Feedback survey failed:', error);
  }
}

// ============================================================================
// EXAMPLE 4: Technical Knowledge Assessment
// ============================================================================

/**
 * Advanced technical assessment with complex validation rules
 */
async function exampleTechnicalAssessment(): Promise<void> {
  console.log('🔬 Running Technical Assessment Example\n');

  const questions: Question[] = [
    {
      id: 'tech_1',
      text: 'Which are characteristics of functional programming?',
      type: 'multiple',
      options: [
        'Immutability',
        'First-class functions',
        'Global state management',
        'Pure functions',
        'Side effects encouraged'
      ],
      correctAnswers: ['Immutability', 'First-class functions', 'Pure functions'],
      minSelections: 3
    },
    {
      id: 'tech_2',
      text: 'Explain the concept of "closure" in JavaScript with an example',
      type: 'open',
      minLength: 50,
      validation: (answer: string) => {
        // Custom validation: answer should mention function and scope
        const lowerAnswer = answer.toLowerCase();
        return lowerAnswer.includes('function') && lowerAnswer.includes('scope');
      }
    },
    {
      id: 'tech_3',
      text: 'What is the time complexity of binary search?',
      type: 'single',
      options: ['O(n)', 'O(log n)', 'O(n²)', 'O(2ⁿ)'],
      correctAnswer: 'O(log n)',
      hint: 'Think about how the search space is divided'
    }
  ];

  try {
    const session = await conductDiscussion(questions);

    // Generate assessment report
    console.log('\n🎓 Assessment Report:\n');
    console.log(`Score: ${session.summary.validResponses}/${session.summary.totalQuestions}`);
    console.log(`Pass: ${session.summary.successRate >= 0.7 ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Efficiency: ${session.summary.averageAttempts.toFixed(1)} attempts per question`);

    if (session.summary.successRate < 0.7) {
      console.log('\nFailed Responses:');
      session.responses
        .filter((r) => !r.isValid)
        .forEach((r) => {
          console.log(`\n  ${r.questionId}:`);
          console.log(`    Your answer: "${r.answer}"`);
          console.log(`    Issue: ${r.validationError}`);
        });
    }
  } catch (error) {
    console.error('Technical assessment failed:', error);
  }
}

// ============================================================================
// EXAMPLE 5: Interactive Session Analysis
// ============================================================================

/**
 * Helper function to demonstrate session analysis capabilities
 */
function analyzeSession(session: DiscussionSession): void {
  console.log('\n📊 Detailed Session Analysis:\n');

  // Question performance
  console.log('Question Performance:');
  session.responses.forEach((response, idx) => {
    const status = response.isValid ? '✓' : '✗';
    console.log(
      `  ${idx + 1}. [${status}] ${response.questionId} - ${response.attempts} attempt(s)`
    );
    if (!response.isValid) {
      console.log(`     → Error: ${response.validationError}`);
    }
  });

  // Difficulty analysis
  console.log('\nDifficulty Analysis:');
  const avgAttempts = session.summary.averageAttempts;
  if (avgAttempts > 1.5) {
    console.log('  ⚠️  Questions are challenging (avg > 1.5 attempts)');
  } else {
    console.log('  ✓ Questions are appropriately difficult');
  }

  // Time analysis
  console.log('\nTiming:');
  const timePerQuestion = session.summary.completionTime / session.summary.completedQuestions;
  console.log(`  Total Time: ${(session.summary.completionTime / 1000).toFixed(1)}s`);
  console.log(`  Average per Question: ${(timePerQuestion / 1000).toFixed(2)}s`);

  // Recommendations
  console.log('\nRecommendations:');
  if (session.summary.successRate === 1.0) {
    console.log('  • All answers validated - excellent performance!');
  } else if (session.summary.successRate >= 0.8) {
    console.log('  • Good performance overall, minor clarifications needed');
  } else {
    console.log('  • Consider reviewing the content and retrying');
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

/**
 * Run all examples (in real usage, you'd run one at a time)
 */
async function runAllExamples(): Promise<void> {
  console.log('🚀 Q&A Discussion Skill - Examples\n');
  console.log('═'.repeat(70) + '\n');

  // Examples are designed to be run individually based on your needs:
  // - exampleSimpleQuiz()        → Basic mixed question types
  // - exampleOnboarding()        → Onboarding with validation
  // - exampleFeedbackSurvey()    → Feedback collection (no scoring)
  // - exampleTechnicalAssessment() → Complex validation rules

  console.log(
    'Examples available:\n' +
    '1. exampleSimpleQuiz() - Basic mixed question types\n' +
    '2. exampleOnboarding() - Onboarding assessment\n' +
    '3. exampleFeedbackSurvey() - Feedback collection\n' +
    '4. exampleTechnicalAssessment() - Technical knowledge test\n'
  );
}

// Export for use
export {
  exampleSimpleQuiz,
  exampleOnboarding,
  exampleFeedbackSurvey,
  exampleTechnicalAssessment,
  analyzeSession,
  runAllExamples
};
