export type AskQuestionType = "single" | "multi" | "preview";

export interface AskOption {
	description?: string;
	freeform?: boolean;
	label: string;
	preview?: string;
	value: string;
}

export interface AskQuestionInput {
	id: string;
	label?: string;
	options: AskOption[];
	prompt: string;
	required?: boolean;
	type?: AskQuestionType;
}

export interface AskParams {
	questions: AskQuestionInput[];
	title?: string;
}

export interface AskValidationIssue {
	message: string;
	path: string;
}

export interface AskValidationError {
	issues: AskValidationIssue[];
	kind: "invalid_input";
}

export interface AskQuestion
	extends Omit<AskQuestionInput, "type" | "required" | "label"> {
	label: string;
	presentedType?: AskQuestionType;
	requestedType?: AskQuestionType;
	required: boolean;
	type: AskQuestionType;
}

export interface AskSelectedOption {
	index: number;
	label: string;
	value: string;
}

export interface AskStateAnswer {
	customSelected?: boolean;
	customText?: string;
	note?: string;
	optionNotes?: Record<string, string>;
	selected: AskSelectedOption[];
}

export interface AskResultAnswer {
	customText?: string;
	indices: number[];
	labels: string[];
	note?: string;
	optionNotes?: Record<string, string>;
	values: string[];
}

export interface AskQuestionSummary {
	id: string;
	label: string;
	presentedType?: AskQuestionType;
	prompt: string;
	type: AskQuestionType;
}

export interface AskElaborationQuestionContext extends AskQuestionSummary {
	options: AskOption[];
}

export interface AskElaborationQuestionItem {
	answer?: AskResultAnswer;
	answered: boolean;
	note: string;
	question: AskElaborationQuestionContext;
	target: {
		kind: "question";
	};
}

export interface AskElaborationOptionItem {
	answer?: AskResultAnswer;
	answered: boolean;
	note: string;
	option: AskOption;
	question: AskElaborationQuestionContext;
	selected: boolean;
	target: {
		kind: "option";
		optionValue: string;
	};
}

export type AskElaborationItem =
	| AskElaborationQuestionItem
	| AskElaborationOptionItem;

export interface AskElaborationPayload {
	instruction: string;
	items: AskElaborationItem[];
	nextAction: "clarify" | "clarify_then_reask";
}

export interface AskContinuationQuestionState {
	status: "answered" | "needs_clarification" | "unanswered";
}

export interface AskContinuationPayload {
	affectedQuestionIds: string[];
	preservedAnswers: Record<string, AskResultAnswer>;
	questionStates: Record<string, AskContinuationQuestionState>;
	strategy: "refine_only" | "resume";
}

export interface AskResult {
	answers: Record<string, AskResultAnswer>;
	cancelled: boolean;
	continuation?: AskContinuationPayload;
	elaboration?: AskElaborationPayload;
	error?: AskValidationError;
	mode: "submit" | "elaborate";
	questions: AskQuestionSummary[];
	title?: string;
}

export type ViewState =
	| { kind: "navigate" }
	| { kind: "submit" }
	| { kind: "input"; questionId: string }
	| { kind: "note"; questionId: string; optionValue?: string };

export interface AskState {
	activeOptionIndex: number;
	activeSubmitActionIndex: number;
	activeTabIndex: number;
	answers: Record<string, AskStateAnswer>;
	cancelled: boolean;
	completed: boolean;
	mode: "submit" | "elaborate";
	questions: AskQuestion[];
	title?: string;
	view: ViewState;
}

export interface AskDisplayOption extends AskOption {
	isCustomOption?: boolean;
	isFreeformOnlyOption?: boolean;
}

export type AskAction =
	| { type: "MOVE_TAB"; delta: 1 | -1 }
	| { type: "MOVE_OPTION"; delta: 1 | -1 }
	| { type: "OPEN_INPUT"; questionId: string }
	| { type: "OPEN_QUESTION_NOTE"; questionId: string }
	| { type: "OPEN_OPTION_NOTE"; questionId: string; optionValue: string }
	| { type: "CONFIRM" }
	| { type: "TOGGLE_MULTI" }
	| { type: "NUMBER_SHORTCUT"; digit: number }
	| { type: "SAVE_INPUT"; value: string; submit?: boolean }
	| { type: "SAVE_NOTE"; value: string }
	| { type: "CANCEL" };
