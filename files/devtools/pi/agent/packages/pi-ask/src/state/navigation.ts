import { clamp } from "../math.ts";
import type { AskState } from "../types.ts";
import {
	getCurrentQuestion,
	getRenderableOptions,
	isSubmitTab,
} from "./selectors.ts";
import { isEditingView, navigateView, submitView } from "./view.ts";

const SUBMIT_ACTION_COUNT = 3;

export function createInitialState(params: {
	title?: string;
	questions: AskState["questions"];
}): AskState {
	return {
		title: params.title,
		questions: params.questions,
		activeTabIndex: 0,
		activeOptionIndex: 0,
		activeSubmitActionIndex: 0,
		view: navigateView(),
		answers: {},
		completed: false,
		cancelled: false,
		mode: "submit",
	};
}

export function moveTab(state: AskState, delta: number): AskState {
	const normalizedDelta = delta < 0 ? -1 : 1;
	const totalTabs = state.questions.length + 1;
	const activeTabIndex =
		(state.activeTabIndex + normalizedDelta + totalTabs) % totalTabs;
	return {
		...state,
		activeTabIndex,
		activeOptionIndex: 0,
		activeSubmitActionIndex: 0,
		view:
			activeTabIndex >= state.questions.length ? submitView() : navigateView(),
	};
}

export function moveOption(state: AskState, delta: number): AskState {
	const normalizedDelta = delta < 0 ? -1 : 1;
	if (isSubmitTab(state)) {
		return {
			...state,
			activeSubmitActionIndex: clamp(
				state.activeSubmitActionIndex + normalizedDelta,
				0,
				SUBMIT_ACTION_COUNT - 1
			),
		};
	}

	const options = getRenderableOptions(getCurrentQuestion(state));
	return {
		...state,
		activeOptionIndex: clamp(
			state.activeOptionIndex + normalizedDelta,
			0,
			Math.max(0, options.length - 1)
		),
	};
}

export function cancelFlow(state: AskState): AskState {
	if (isEditingView(state)) {
		return {
			...state,
			view: isSubmitTab(state) ? submitView() : navigateView(),
		};
	}
	return {
		...state,
		cancelled: true,
		completed: true,
	};
}

export function dismissFlow(state: AskState): AskState {
	const nextState = cancelFlow(state);
	return nextState.completed ? nextState : cancelFlow(nextState);
}
