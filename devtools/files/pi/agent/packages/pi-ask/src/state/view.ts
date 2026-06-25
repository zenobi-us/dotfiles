import type { AskState, ViewState } from "../types.ts";

export function navigateView(): ViewState {
	return { kind: "navigate" };
}

export function submitView(): ViewState {
	return { kind: "submit" };
}

export function inputView(questionId: string): ViewState {
	return { kind: "input", questionId };
}

export function questionNoteView(questionId: string): ViewState {
	return { kind: "note", questionId };
}

export function optionNoteView(
	questionId: string,
	optionValue: string
): ViewState {
	return { kind: "note", questionId, optionValue };
}

export function isEditingView(state: AskState): boolean {
	return state.view.kind === "input" || state.view.kind === "note";
}
