/**
 * Q&A Discussion Skill for OpenCode
 *
 * Conducts structured Q&A discussions with users, handling multiple choice,
 * single choice, and open-ended questions. Tracks progress, validates answers,
 * and provides comprehensive summary reports.
 *
 * Usage:
 *   const session = await conductDiscussion(questions);
 *   console.log(session.summary);
 */

import * as readline from 'readline';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Base question interface with common properties
 */
interface BaseQuestion {
  /** Unique identifier for the question */
  id: string;
  /** The question text displayed to user */
  text: string;
  /** Type of question */
  type: 'single' | 'multiple' | 'open';
  /** Optional hint displayed below question */
  hint?: string;
}

/**
 * Single choice question - user selects one correct answer
 */
interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single';
  /** Available options for user to choose from */
  options: string[];
  /** The single correct answer (optional for feedback-only mode) */
  correctAnswer?: string;
}

/**
 * Multiple choice question - user selects one or more correct answers
 */
interface MultiChoiceQuestion extends BaseQuestion {
  type: 'multiple';
  /** Available options for user to choose from */
  options: string[];
  /** All correct answers (optional for feedback-only mode) */
  correctAnswers?: string[];
  /** Minimum number of selections required */
  minSelections?: number;
  /** Maximum number of selections allowed */
  maxSelections?: number;
}

/**
 * Open-ended question - user provides free-form text
 */
interface OpenEndedQuestion extends BaseQuestion {
  type: 'open';
  /** Optional custom validation function for the answer */
  validation?: (answer: string) => boolean;
  /** Minimum character length (default 1) */
  minLength?: number;
  /** Maximum character length (no limit if omitted) */
  maxLength?: number;
}

/** Union type of all question types */
type Question = SingleChoiceQuestion | MultiChoiceQuestion | OpenEndedQuestion;

/**
 * User response stored with validation status
 */
interface StoredResponse {
  /** ID of the question answered */
  questionId: string;
  /** The question text */
  questionText: string;
  /** User's raw input/answer */
  answer: string;
  /** Whether the answer passed validation */
  isValid: boolean;
  /** Number of attempts before getting valid answer (1 = first try) */
  attempts: number;
  /** Timestamp when answer was submitted */
  timestamp: Date;
  /** Validation error message if invalid (from last attempt) */
  validationError?: string;
}

/**
 * Summary statistics for the completed discussion
 */
interface DiscussionSummary {
  /** Total number of questions in discussion */
  totalQuestions: number;
  /** Number of questions completed */
  completedQuestions: number;
  /** Total attempts across all questions */
  totalAttempts: number;
  /** Number of responses that passed validation */
  validResponses: number;
  /** Number of responses that failed validation */
  invalidResponses: number;
  /** Time taken to complete discussion in milliseconds */
  completionTime: number;
  /** Success rate: validResponses / completedQuestions */
  successRate: number;
  /** Average attempts per question */
  averageAttempts: number;
}

/**
 * Complete session object containing all discussion data
 */
interface DiscussionSession {
  /** Unique session identifier */
  sessionId: string;
  /** Total number of questions */
  totalQuestions: number;
  /** Number of completed questions */
  completedQuestions: number;
  /** All responses in order */
  responses: StoredResponse[];
  /** Summary statistics */
  summary: DiscussionSummary;
  /** Timestamp when session started */
  startTime: Date;
  /** Timestamp when session ended */
  endTime?: Date;
}

// ============================================================================
// READLINE INTERFACE
// ============================================================================

/**
 * Create a readline interface for user input
 * Reuses singleton instance to avoid multiple listeners
 */
let rlInterface: readline.Interface | null = null;

function getRLInterface(): readline.Interface {
  if (!rlInterface) {
    rlInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return rlInterface;
}

/**
 * Prompt user for input with a question
 * @param question - The prompt text
 * @returns Promise that resolves to user's input
 */
function promptUser(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = getRLInterface();
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Close the readline interface gracefully
 */
function closeRLInterface(): void {
  if (rlInterface) {
    rlInterface.close();
    rlInterface = null;
  }
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

/**
 * Clear console and prepare for next question
 * Uses different approaches based on platform
 */
function clearScreen(): void {
  try {
    process.stdout.write('\x1Bc'); // Try ANSI clear
  } catch {
    // Fallback: multiple newlines
    console.log('\n'.repeat(3));
  }
}

/**
 * Display a question with formatting and progress indicator
 * @param question - The question to display
 * @param index - Current question index (0-based)
 * @param total - Total number of questions
 */
async function displayQuestion(
  question: Question,
  index: number,
  total: number
): Promise<void> {
  clearScreen();

  // Progress indicator
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Question ${index + 1} of ${total}`);
  console.log(`${'═'.repeat(70)}\n`);

  // Question text
  console.log(question.text);
  if (question.hint) {
    console.log(`\n💡 Hint: ${question.hint}`);
  }
  console.log();

  // Display options based on question type
  if (question.type === 'single') {
    displaySingleChoiceOptions(question);
  } else if (question.type === 'multiple') {
    displayMultipleChoiceOptions(question);
  } else if (question.type === 'open') {
    displayOpenEndedInstructions(question);
  }

  console.log();
}

/**
 * Display single choice options with numbering
 */
function displaySingleChoiceOptions(question: SingleChoiceQuestion): void {
  console.log('Options:');
  question.options.forEach((option, idx) => {
    console.log(`  ${idx + 1}. ${option}`);
  });
  console.log('\n→ Select one option (enter the number):');
}

/**
 * Display multiple choice options with numbering
 */
function displayMultipleChoiceOptions(question: MultiChoiceQuestion): void {
  console.log('Options:');
  question.options.forEach((option, idx) => {
    console.log(`  ${idx + 1}. ${option}`);
  });

  const minSel = question.minSelections ?? 1;
  const maxSel = question.maxSelections ?? question.options.length;

  if (minSel === maxSel && minSel > 1) {
    console.log(`\n→ Select exactly ${minSel} options (separate with commas, e.g., 1,3,4):`);
  } else {
    console.log(
      `\n→ Select ${minSel}-${maxSel} options (separate with commas, e.g., 1,2,3):`
    );
  }
}

/**
 * Display open-ended question instructions
 */
function displayOpenEndedInstructions(question: OpenEndedQuestion): void {
  let instruction = '→ Enter your response:';

  if (question.minLength || question.maxLength) {
    const parts: string[] = [];
    if (question.minLength) {
      parts.push(`minimum ${question.minLength} characters`);
    }
    if (question.maxLength) {
      parts.push(`maximum ${question.maxLength} characters`);
    }
    instruction += ` (${parts.join(', ')})`;
  }

  console.log(instruction);
}

/**
 * Display validation error message with context
 */
function displayValidationError(error: string): void {
  console.log(`\n❌ ${error}`);
  console.log('Please try again.\n');
}

/**
 * Display success message
 */
function displaySuccess(): void {
  console.log('\n✓ Answer recorded\n');
}

/**
 * Display final summary report
 */
function displaySummaryReport(session: DiscussionSession): void {
  clearScreen();

  console.log(`\n${'═'.repeat(70)}`);
  console.log('Discussion Complete');
  console.log(`${'═'.repeat(70)}\n`);

  console.log(`Total Questions: ${session.summary.totalQuestions}`);
  console.log(`Completed: ${session.summary.completedQuestions}`);
  console.log(`Valid Responses: ${session.summary.validResponses}`);
  console.log(`Invalid Responses: ${session.summary.invalidResponses}`);
  console.log(`Success Rate: ${(session.summary.successRate * 100).toFixed(1)}%`);
  console.log(`Total Attempts: ${session.summary.totalAttempts}`);
  console.log(`Average Attempts: ${session.summary.averageAttempts.toFixed(1)}`);
  console.log(
    `Time Taken: ${(session.summary.completionTime / 1000).toFixed(1)}s`
  );

  console.log(`\n${'─'.repeat(70)}\n`);
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Parse and validate single choice answer
 * @param input - User's input string
 * @param question - The single choice question
 * @returns Validation result with error message if invalid
 */
function validateSingleChoice(
  input: string,
  question: SingleChoiceQuestion
): { valid: boolean; error?: string; answer?: string } {
  if (!input) {
    return { valid: false, error: 'Response cannot be empty' };
  }

  const num = parseInt(input, 10);

  if (isNaN(num) || num < 1 || num > question.options.length) {
    return {
      valid: false,
      error: `Invalid selection. Please enter a number between 1 and ${question.options.length}`
    };
  }

  const selectedOption = question.options[num - 1];

  // If no correct answer is specified, accept any valid option
  if (!question.correctAnswer) {
    return { valid: true, answer: selectedOption };
  }

  // Validate against correct answer
  const isCorrect = selectedOption === question.correctAnswer;

  return {
    valid: isCorrect,
    error: isCorrect ? undefined : `Incorrect. The correct answer is: ${question.correctAnswer}`,
    answer: selectedOption
  };
}

/**
 * Parse and validate multiple choice answer
 * @param input - User's input string (comma-separated numbers)
 * @param question - The multiple choice question
 * @returns Validation result with error message if invalid
 */
function validateMultipleChoice(
  input: string,
  question: MultiChoiceQuestion
): { valid: boolean; error?: string; answer?: string } {
  if (!input) {
    return { valid: false, error: 'Response cannot be empty' };
  }

  // Parse comma-separated numbers
  const parts = input.split(',').map((s) => s.trim());
  const numbers: number[] = [];

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num)) {
      return {
        valid: false,
        error: 'Invalid format. Use comma-separated numbers (e.g., 1,2,3)'
      };
    }
    if (num < 1 || num > question.options.length) {
      return {
        valid: false,
        error: `Invalid selection. Numbers must be between 1 and ${question.options.length}`
      };
    }
    if (numbers.includes(num)) {
      return {
        valid: false,
        error: 'Duplicate selections are not allowed'
      };
    }
    numbers.push(num);
  }

  // Check min/max selections
  const minSel = question.minSelections ?? 1;
  const maxSel = question.maxSelections ?? question.options.length;

  if (numbers.length < minSel) {
    return {
      valid: false,
      error: `Please select at least ${minSel} option(s). You selected ${numbers.length}`
    };
  }

  if (numbers.length > maxSel) {
    return {
      valid: false,
      error: `Please select at most ${maxSel} option(s). You selected ${numbers.length}`
    };
  }

  const selectedOptions = numbers.map((n) => question.options[n - 1]);
  const answerString = selectedOptions.join(', ');

  // If no correct answers are specified, accept any valid selection
  if (!question.correctAnswers || question.correctAnswers.length === 0) {
    return { valid: true, answer: answerString };
  }

  // Validate against correct answers
  const correctSet = new Set(question.correctAnswers);
  const selectedSet = new Set(selectedOptions);
  const isCorrect =
    selectedSet.size === correctSet.size &&
    Array.from(selectedSet).every((item) => correctSet.has(item));

  return {
    valid: isCorrect,
    error: isCorrect
      ? undefined
      : `Incorrect. The correct answers are: ${question.correctAnswers.join(', ')}`,
    answer: answerString
  };
}

/**
 * Validate open-ended answer
 * @param input - User's input text
 * @param question - The open-ended question
 * @returns Validation result with error message if invalid
 */
function validateOpenEnded(
  input: string,
  question: OpenEndedQuestion
): { valid: boolean; error?: string; answer?: string } {
  if (!input) {
    return { valid: false, error: 'Response cannot be empty' };
  }

  // Check length constraints
  const minLen = question.minLength ?? 1;
  const maxLen = question.maxLength;

  if (input.length < minLen) {
    return {
      valid: false,
      error: `Response too short. Minimum ${minLen} characters required. You provided ${input.length}`
    };
  }

  if (maxLen && input.length > maxLen) {
    return {
      valid: false,
      error: `Response too long. Maximum ${maxLen} characters allowed. You provided ${input.length}`
    };
  }

  // Apply custom validation if provided
  if (question.validation) {
    const customValid = question.validation(input);
    if (!customValid) {
      return {
        valid: false,
        error: 'Response did not meet validation criteria. Please provide a more complete answer'
      };
    }
  }

  return { valid: true, answer: input };
}

/**
 * Validate an answer against a question
 * Routes to specific validator based on question type
 * @param input - User's answer input
 * @param question - The question being answered
 * @returns Validation result
 */
async function validateAnswer(
  input: string,
  question: Question
): Promise<{ valid: boolean; error?: string; answer?: string }> {
  if (question.type === 'single') {
    return validateSingleChoice(input, question);
  } else if (question.type === 'multiple') {
    return validateMultipleChoice(input, question);
  } else {
    return validateOpenEnded(input, question);
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Store a validated response in the session
 * @param responses - Array to store response in
 * @param question - The question that was answered
 * @param answer - The validated answer string
 * @param isValid - Whether answer passed validation
 * @param attempts - Number of attempts taken
 * @param validationError - Error message if validation failed
 */
function storeResponse(
  responses: StoredResponse[],
  question: Question,
  answer: string,
  isValid: boolean,
  attempts: number,
  validationError?: string
): void {
  responses.push({
    questionId: question.id,
    questionText: question.text,
    answer,
    isValid,
    attempts,
    timestamp: new Date(),
    validationError
  });
}

/**
 * Calculate summary statistics from responses
 */
function calculateSummary(
  responses: StoredResponse[],
  totalQuestions: number,
  startTime: Date,
  endTime: Date
): DiscussionSummary {
  const validResponses = responses.filter((r) => r.isValid).length;
  const invalidResponses = responses.filter((r) => !r.isValid).length;
  const totalAttempts = responses.reduce((sum, r) => sum + r.attempts, 0);
  const completedQuestions = responses.length;

  return {
    totalQuestions,
    completedQuestions,
    totalAttempts,
    validResponses,
    invalidResponses,
    completionTime: endTime.getTime() - startTime.getTime(),
    successRate: completedQuestions > 0 ? validResponses / completedQuestions : 0,
    averageAttempts: completedQuestions > 0 ? totalAttempts / completedQuestions : 0
  };
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `qa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// MAIN DISCUSSION FUNCTION
// ============================================================================

/**
 * Conduct a complete Q&A discussion session
 *
 * Displays each question one at a time, collects and validates responses,
 * and returns a complete session record with summary statistics.
 *
 * @param questions - Array of Question objects to ask
 * @returns Promise resolving to complete DiscussionSession
 *
 * @throws Error if no questions provided or invalid question structure
 *
 * @example
 * ```typescript
 * const questions: Question[] = [
 *   {
 *     id: 'q1',
 *     text: 'What is 2 + 2?',
 *     type: 'single',
 *     options: ['3', '4', '5'],
 *     correctAnswer: '4'
 *   }
 * ];
 *
 * const session = await conductDiscussion(questions);
 * console.log(session.summary);
 * ```
 */
async function conductDiscussion(questions: Question[]): Promise<DiscussionSession> {
  // Validate input
  if (!questions || questions.length === 0) {
    throw new Error('No questions provided for discussion');
  }

  // Validate question structure
  for (const q of questions) {
    if (!q.id || !q.text || !q.type) {
      throw new Error('Each question must have id, text, and type');
    }
    if (!['single', 'multiple', 'open'].includes(q.type)) {
      throw new Error(`Invalid question type: ${q.type}`);
    }
  }

  // Initialize session
  const sessionId = generateSessionId();
  const startTime = new Date();
  const responses: StoredResponse[] = [];

  try {
    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      let attempts = 0;
      let validationError: string | undefined;

      // Re-prompt until valid answer received
      let valid = false;
      while (!valid) {
        // Display question
        await displayQuestion(question, i, questions.length);

        // Get user input
        const input = await promptUser('Your answer: ');
        attempts++;

        // Validate answer
        const result = await validateAnswer(input, question);

        if (result.valid) {
          // Valid answer - record and move on
          storeResponse(responses, question, result.answer!, true, attempts);
          displaySuccess();
          valid = true;
        } else {
          // Invalid answer - show error and re-prompt
          validationError = result.error;
          displayValidationError(result.error!);
        }
      }
    }

    // Calculate summary
    const endTime = new Date();
    const summary = calculateSummary(
      responses,
      questions.length,
      startTime,
      endTime
    );

    // Create session object
    const session: DiscussionSession = {
      sessionId,
      totalQuestions: questions.length,
      completedQuestions: responses.length,
      responses,
      summary,
      startTime,
      endTime
    };

    // Display summary report
    displaySummaryReport(session);

    return session;
  } finally {
    // Clean up readline interface
    closeRLInterface();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Main function
  conductDiscussion,
  // Display functions (for testing/customization)
  displayQuestion,
  displayValidationError,
  displaySummaryReport,
  displaySuccess,
  // Validation functions (for testing/reuse)
  validateAnswer,
  validateSingleChoice,
  validateMultipleChoice,
  validateOpenEnded,
  // Type definitions
  Question,
  SingleChoiceQuestion,
  MultiChoiceQuestion,
  OpenEndedQuestion,
  DiscussionSession,
  StoredResponse,
  DiscussionSummary
};
