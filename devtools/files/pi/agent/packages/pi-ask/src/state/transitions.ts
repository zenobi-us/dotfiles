import type { AskAction, AskState } from "../types.ts";
import {
	emptyAnswer,
	isAnswerAnswered,
	isAnswerEmpty,
	saveCustomText,
	saveOptionNote,
	saveQuestionNote,
	setCustomSelected,
	setSingleSelection,
	toggleSelection,
} from "./answers.ts";
import {
	cancelFlow as cancelFlowBase,
	createInitialState as createInitialStateBase,
	dismissFlow as dismissFlowBase,
	moveOption as moveOptionBase,
	moveTab as moveTabBase,
} from "./navigation.ts";
import {
	getAnswer,
	getCurrentOption,
	getCurrentQuestion,
	getQuestionById,
	getRenderableOptions,
	isSubmitTab,
} from "./selectors.ts";
import {
	inputView,
	navigateView,
	optionNoteView,
	questionNoteView,
	submitView,
} from "./view.ts";

const SUBMIT_ACTION_COUNT = 3;

export function createInitialState(params: {
	title?: string;
	questions: AskState["questions"];
}): AskState {
	return createInitialStateBase(params);
}

export function moveTab(state: AskState, delta: number): AskState {
	return moveTabBase(state, delta);
}

export function moveOption(state: AskState, delta: number): AskState {
	return moveOptionBase(state, delta);
}

export function cancelFlow(state: AskState): AskState {
	return cancelFlowBase(state);
}

export function dismissFlow(state: AskState): AskState {
	return dismissFlowBase(state);
}

export function reduceAskState(state: AskState, action: AskAction): AskState {
	switch (action.type) {
		case "MOVE_TAB":
			return moveTabBase(state, action.delta);
		case "MOVE_OPTION":
			return moveOptionBase(state, action.delta);
		case "OPEN_INPUT":
			return setView(state, inputView(action.questionId));
		case "OPEN_QUESTION_NOTE":
			return setView(state, questionNoteView(action.questionId));
		case "OPEN_OPTION_NOTE":
			return setView(
				state,
				optionNoteView(action.questionId, action.optionValue)
			);
		case "CONFIRM":
			return confirmCurrentSelection(state);
		case "TOGGLE_MULTI":
			return toggleCurrentMultiOption(state);
		case "NUMBER_SHORTCUT":
			return applyNumberShortcut(state, action.digit);
		case "SAVE_INPUT":
			return saveInputValue(state, action.value, action.submit ?? false);
		case "SAVE_NOTE":
			return saveNoteValue(state, action.value);
		case "CANCEL":
			return cancelFlowBase(state);
		default:
			return state;
	}
}

export function enterInputMode(state: AskState, questionId: string): AskState {
	return reduceAskState(state, { type: "OPEN_INPUT", questionId });
}

export function enterQuestionNoteMode(
	state: AskState,
	questionId: string
): AskState {
	return reduceAskState(state, { type: "OPEN_QUESTION_NOTE", questionId });
}

export function enterOptionNoteMode(
	state: AskState,
	questionId: string,
	optionValue: string
): AskState {
	return reduceAskState(state, {
		type: "OPEN_OPTION_NOTE",
		questionId,
		optionValue,
	});
}

export function toggleCurrentOption(state: AskState): AskState {
	return activateCurrentOption(state, "toggle");
}

export function toggleCurrentMultiOption(state: AskState): AskState {
	return toggleCurrentOption(state);
}

export function confirmCurrentSelection(state: AskState): AskState {
	if (isSubmitTab(state)) {
		return completeSubmitAction(state);
	}
	return activateCurrentOption(state, "confirm");
}

export function applyNumberShortcut(state: AskState, digit: number): AskState {
	if (digit <= 0) {
		return state;
	}

	if (isSubmitTab(state)) {
		if (digit > SUBMIT_ACTION_COUNT) {
			return state;
		}
		return confirmCurrentSelection({
			...state,
			activeSubmitActionIndex: digit - 1,
		});
	}

	const question = getCurrentQuestion(state);
	const index = digit - 1;
	const option = question ? getRenderableOptions(question)[index] : undefined;
	if (!(question && option)) {
		return state;
	}

	return activateCurrentOption({ ...state, activeOptionIndex: index }, "digit");
}

export function saveCustomAnswer(state: AskState, rawValue: string): AskState {
	return saveInputValue(state, rawValue, false);
}

export function submitCustomAnswer(
	state: AskState,
	rawValue: string
): AskState {
	return saveInputValue(state, rawValue, true);
}

export function saveNote(state: AskState, rawValue: string): AskState {
	return saveNoteValue(state, rawValue);
}

function completeSubmitAction(state: AskState): AskState {
	if (state.activeSubmitActionIndex === 2) {
		return { ...state, cancelled: true, completed: true };
	}
	if (state.activeSubmitActionIndex === 1) {
		return { ...state, mode: "elaborate", completed: true };
	}
	return { ...state, mode: "submit", completed: true };
}

function activateCurrentOption(
	state: AskState,
	trigger: "toggle" | "confirm" | "digit"
): AskState {
	const question = getCurrentQuestion(state);
	const option = getCurrentOption(state);
	if (!(question && option)) {
		return state;
	}
	if (option.isCustomOption) {
		return activateCustomOption(state, question.id, question.type, trigger);
	}
	if (question.type === "multi") {
		if (trigger === "confirm") {
			return advanceToNextTab(state);
		}
		return updateAnswer(state, question.id, (answer) =>
			toggleSelection(answer, option, state.activeOptionIndex)
		);
	}

	const nextState = updateAnswer(state, question.id, (answer) => {
		if (trigger === "toggle") {
			const isSelected = answer.selected.some(
				(selection) => selection.value === option.value
			);
			if (isSelected) {
				return {
					...answer,
					selected: [],
				};
			}
		}
		return setSingleSelection(answer, option, state.activeOptionIndex);
	});
	return trigger === "toggle" ? nextState : advanceToNextTab(nextState);
}

function activateCustomOption(
	state: AskState,
	questionId: string,
	questionType: AskState["questions"][number]["type"],
	trigger: "toggle" | "confirm" | "digit"
): AskState {
	if (questionType === "multi" && trigger !== "confirm") {
		const answer = getAnswer(state, questionId);
		if (answer?.customText?.trim()) {
			return updateAnswer(state, questionId, (currentAnswer) =>
				setCustomSelected(currentAnswer, !answer.customSelected)
			);
		}
	}
	return setView(state, inputView(questionId));
}

function saveInputValue(
	state: AskState,
	rawValue: string,
	submit: boolean
): AskState {
	if (state.view.kind !== "input") {
		return state;
	}

	const question = getQuestionById(state, state.view.questionId);
	if (!question) {
		return exitEditingView(state);
	}

	const nextState = updateAnswer(
		exitEditingView(state),
		question.id,
		(answer) =>
			saveCustomText(
				answer,
				rawValue,
				question.type === "multi" ? "multi" : "single"
			)
	);
	if (
		question.type === "multi" ||
		!(submit && isAnswerAnswered(nextState.answers[question.id]))
	) {
		return nextState;
	}
	return advanceToNextTab(nextState);
}

function saveNoteValue(state: AskState, rawValue: string): AskState {
	if (state.view.kind !== "note") {
		return exitEditingView(state);
	}

	const { questionId, optionValue } = state.view;
	const nextState = updateAnswer(
		exitEditingView(state),
		questionId,
		(answer) =>
			optionValue
				? saveOptionNote(answer, optionValue, rawValue)
				: saveQuestionNote(answer, rawValue)
	);
	return nextState;
}

function setView(state: AskState, view: AskState["view"]): AskState {
	return {
		...state,
		view,
	};
}

function exitEditingView(state: AskState): AskState {
	return {
		...state,
		view: isSubmitTab(state) ? submitView() : navigateView(),
	};
}

function advanceToNextTab(state: AskState): AskState {
	const nextTab = Math.min(state.activeTabIndex + 1, state.questions.length);
	return {
		...state,
		activeTabIndex: nextTab,
		activeOptionIndex: 0,
		activeSubmitActionIndex: 0,
		view: nextTab === state.questions.length ? submitView() : navigateView(),
	};
}

function updateAnswer(
	state: AskState,
	questionId: string,
	mutate: (
		answer: ReturnType<typeof emptyAnswer>
	) => ReturnType<typeof emptyAnswer>
): AskState {
	const existing = getAnswer(state, questionId) ?? emptyAnswer();
	const nextAnswer = mutate(existing);
	const answers = { ...state.answers };
	if (isAnswerEmpty(nextAnswer)) {
		delete answers[questionId];
	} else {
		answers[questionId] = nextAnswer;
	}
	return {
		...state,
		answers,
	};
}
