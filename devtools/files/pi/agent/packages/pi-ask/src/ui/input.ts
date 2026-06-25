import { matchesKey } from "@earendil-works/pi-tui";
import type { AskConfig } from "../config/schema.ts";
import {
	type AskKeyBinding,
	getAskContextBindings,
	getGlobalBindings,
	matchesBinding,
	matchesDigitShortcut,
} from "../constants/keymaps.ts";
import type { AskState } from "../types.ts";

export type AskInputCommand =
	| { kind: "moveTab"; delta: 1 | -1 }
	| { kind: "moveOption"; delta: 1 | -1 }
	| { kind: "toggleMulti" }
	| { kind: "openQuestionNote" }
	| { kind: "openOptionNote" }
	| { kind: "confirm" }
	| { kind: "cancel" }
	| { kind: "changeQuestionType" }
	| { kind: "dismiss" }
	| { kind: "showSettings" }
	| { kind: "numberShortcut"; digit: number }
	| { kind: "editMoveTab"; delta: 1 | -1 }
	| { kind: "editMoveOption"; delta: 1 | -1 }
	| { kind: "editClose" }
	| { kind: "editSubmit" }
	| { kind: "delegateToEditor" }
	| { kind: "ignore" };

export function getInputCommand(
	state: AskState,
	config: AskConfig,
	data: string,
	editingText = ""
): AskInputCommand {
	const global = getGlobalBindings(config);
	if (matchesBinding(data, global.dismiss)) {
		return { kind: "dismiss" };
	}
	if (matchesBinding(data, global.settings) && editingText.length === 0) {
		return { kind: "showSettings" };
	}

	if (state.view.kind === "input") {
		return getAnswerEditorInputCommand(config, data, editingText);
	}
	if (state.view.kind === "note") {
		return getNoteEditorInputCommand(config, data, editingText);
	}

	return getNavigationInputCommand(config, data);
}

function getAnswerEditorInputCommand(
	config: AskConfig,
	data: string,
	editingText: string
): AskInputCommand {
	const bindings = getAskContextBindings(config, "editor");
	if (matchesBinding(data, bindings.submit)) {
		return isNativeEditorSubmit(data)
			? { kind: "delegateToEditor" }
			: { kind: "editSubmit" };
	}
	if (matchesBinding(data, bindings.close)) {
		return { kind: "editClose" };
	}
	return getEmptyEditorNavigationCommand(bindings, data, editingText);
}

function getNoteEditorInputCommand(
	config: AskConfig,
	data: string,
	editingText: string
): AskInputCommand {
	const bindings = getAskContextBindings(config, "noteEditor");
	if (matchesBinding(data, bindings.save)) {
		return isNativeEditorSubmit(data)
			? { kind: "delegateToEditor" }
			: { kind: "editSubmit" };
	}
	if (matchesBinding(data, bindings.close)) {
		return { kind: "editClose" };
	}
	return getEmptyEditorNavigationCommand(bindings, data, editingText);
}

function getEmptyEditorNavigationCommand(
	bindings: {
		nextTabWhenEmpty: AskKeyBinding;
		previousTabWhenEmpty: AskKeyBinding;
		previousOptionWhenEmpty: AskKeyBinding;
		nextOptionWhenEmpty: AskKeyBinding;
	},
	data: string,
	editingText: string
): AskInputCommand {
	if (editingText.length === 0) {
		if (matchesBinding(data, bindings.nextTabWhenEmpty)) {
			return { kind: "editMoveTab", delta: 1 };
		}
		if (matchesBinding(data, bindings.previousTabWhenEmpty)) {
			return { kind: "editMoveTab", delta: -1 };
		}
		if (matchesBinding(data, bindings.previousOptionWhenEmpty)) {
			return { kind: "editMoveOption", delta: -1 };
		}
		if (matchesBinding(data, bindings.nextOptionWhenEmpty)) {
			return { kind: "editMoveOption", delta: 1 };
		}
	}
	return { kind: "delegateToEditor" };
}

function isNativeEditorSubmit(data: string): boolean {
	return matchesKey(data, "enter");
}

function getNavigationInputCommand(
	config: AskConfig,
	data: string
): AskInputCommand {
	const bindings = getAskContextBindings(config, "main");
	if (matchesBinding(data, bindings.nextTab)) {
		return { kind: "moveTab", delta: 1 };
	}
	if (matchesBinding(data, bindings.previousTab)) {
		return { kind: "moveTab", delta: -1 };
	}
	if (matchesBinding(data, bindings.previousOption)) {
		return { kind: "moveOption", delta: -1 };
	}
	if (matchesBinding(data, bindings.nextOption)) {
		return { kind: "moveOption", delta: 1 };
	}
	if (matchesBinding(data, bindings.toggle)) {
		return { kind: "toggleMulti" };
	}
	if (matchesBinding(data, bindings.changeQuestionType)) {
		return { kind: "changeQuestionType" };
	}
	if (matchesBinding(data, bindings.confirm)) {
		return { kind: "confirm" };
	}
	if (matchesBinding(data, bindings.cancel)) {
		return { kind: "cancel" };
	}
	if (matchesBinding(data, bindings.questionNote)) {
		return { kind: "openQuestionNote" };
	}
	if (matchesBinding(data, bindings.optionNote)) {
		return { kind: "openOptionNote" };
	}

	const digit = matchesDigitShortcut(data);
	return digit === null
		? { kind: "ignore" }
		: { kind: "numberShortcut", digit };
}
