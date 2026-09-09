import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Editor, type EditorTheme } from "@earendil-works/pi-tui";
import type { AskConfig } from "../config/schema.ts";
import { getAskConfigStore } from "../config/store.ts";
import {
	createQuestionWaitingNotification,
	notifyQuestionWaiting,
} from "../notifications.ts";
import {
	applyRemoteAskResponse,
	type RemoteAskFlowHandle,
	type RemoteAskResponse,
	type RemoteAskRuntime,
	type RemoteAskSource,
	type RemoteAskSubmitResolution,
} from "../remote-ask.ts";
import { createInitialState } from "../state/create.ts";
import {
	getEditorDraft,
	saveEditorDraft,
	submitEditorDraft,
	syncStateToSelection,
} from "../state/editor.ts";
import { cycleCurrentQuestionType } from "../state/question-type.ts";
import { toAskResult } from "../state/result.ts";
import {
	getCurrentOption,
	getCurrentQuestion,
	isSubmitTab,
} from "../state/selectors.ts";
import {
	applyNumberShortcut,
	cancelFlow,
	confirmCurrentSelection,
	dismissFlow,
	enterOptionNoteMode,
	enterQuestionNoteMode,
	moveOption,
	moveTab,
	toggleCurrentMultiOption,
} from "../state/transitions.ts";
import { isEditingView } from "../state/view.ts";
import type { AskParams, AskResult, AskState } from "../types.ts";
import { maybeAutoSubmitState } from "./auto-submit.ts";
import { createAskAutocompleteProvider } from "./autocomplete.ts";
import {
	DIRTY_DISMISS_NOTICE,
	shouldConfirmDirtyDismiss,
	shouldDiscardAfterConfirmation,
} from "./dismiss-guard.ts";
import type { AskInputCommand } from "./input.ts";
import { getInputCommand } from "./input.ts";
import { renderAskScreen } from "./render.ts";
import {
	getReviewShortcutHint,
	resolveReviewShortcutDoublePress,
} from "./review-shortcuts.ts";
import { showAskSettings } from "./show-settings.ts";

type CustomCallback = Parameters<ExtensionContext["ui"]["custom"]>[0];
type CustomCallbackArgs = CustomCallback extends (...args: infer T) => unknown
	? T
	: never;
type Tui = CustomCallbackArgs[0];
type Theme = CustomCallbackArgs[1];
type Keybindings = CustomCallbackArgs[2];
type Done = (result: AskResult) => void;
interface AskFlowOptions {
	allowFreeform?: boolean;
	presentSingleAsMulti?: boolean;
	remote?: {
		runtime: RemoteAskRuntime;
		source: RemoteAskSource;
		toolCallId?: string;
	};
}

type AskFlowParams = AskParams &
	Pick<ExtensionContext, "cwd"> & {
		config: AskConfig;
		configNotice?: string;
		ctx: ExtensionContext;
		flowOptions: AskFlowOptions;
	};

interface AskFlowController {
	config: AskConfig;
	configNotice?: string;
	ctx: ExtensionContext;
	dismissNotice?: string;
	done: Done;
	editor: Editor;
	pendingQuestionTypeChangeQuestionId?: string;
	pendingReviewShortcutActionIndex?: number;
	remoteFlow?: RemoteAskFlowHandle;
	settingsOpen: boolean;
	state: AskState;
	suppressAutoInputForSelection: boolean;
	theme: Theme;
	tui: Tui;
	unsubscribeConfig: () => void;
}

export async function runAskFlow(
	ctx: ExtensionContext,
	params: AskParams,
	options: AskFlowOptions = {}
): Promise<AskResult> {
	const store = getAskConfigStore();
	const { config, notice } = await store.ensureLoaded();
	const flowOptions = {
		...options,
		presentSingleAsMulti:
			options.presentSingleAsMulti ?? config.behaviour.presentSingleAsMulti,
	};
	if (ctx.mode !== "tui") {
		return {
			...toAskResult(createInitialState(params, flowOptions)),
			cancelled: true,
		};
	}
	return ctx.ui.custom<AskResult>((...args) =>
		createAskFlowController(args, {
			...params,
			config,
			configNotice: notice?.text,
			cwd: ctx.cwd,
			ctx,
			flowOptions,
		})
	);
}

function createAskFlowController(
	[tui, theme, _keybindings, done]: [
		Tui,
		Theme,
		Keybindings,
		(result: AskResult) => void,
	],
	params: AskFlowParams
) {
	const controller: AskFlowController = {
		config: params.config,
		configNotice: params.configNotice,
		ctx: params.ctx,
		dismissNotice: undefined,
		done,
		editor: createEditor(tui, theme, params.cwd),
		settingsOpen: false,
		state: createInitialState(params, params.flowOptions),
		suppressAutoInputForSelection: false,
		pendingQuestionTypeChangeQuestionId: undefined,
		pendingReviewShortcutActionIndex: undefined,
		theme,
		tui,
		unsubscribeConfig: () => {
			// replaced immediately after controller creation
		},
	};

	controller.unsubscribeConfig = getAskConfigStore().subscribe((config) => {
		controller.config = config;
		controller.configNotice = undefined;
		controller.state = maybeAutoSubmitState(
			controller.state,
			controller.config
		);
		refresh(controller);
		maybeFinish(controller);
	});

	controller.editor.onSubmit = (value) => submitEditor(controller, value);
	controller.remoteFlow = startRemoteFlow(controller, params);
	syncSelection(controller);
	notifyCurrentQuestion(controller).catch(() => {
		// Notification failures are best-effort and must not affect the ask flow.
	});

	return {
		get focused() {
			return controller.editor.focused;
		},
		set focused(value: boolean) {
			controller.editor.focused = value;
		},
		render: (width: number) => renderController(controller, width),
		invalidate() {
			controller.editor.invalidate();
		},
		handleInput(data: string) {
			handleControllerInput(controller, data);
		},
		dispose() {
			controller.remoteFlow?.dispose();
			controller.unsubscribeConfig();
		},
	};
}

function renderController(
	controller: AskFlowController,
	width: number
): string[] {
	return renderAskScreen({
		config: controller.config,
		editor: controller.editor,
		footerNotice: getFooterNotice(controller),
		reviewShortcutHint: getActiveReviewShortcutHint(controller),
		state: controller.state,
		theme: controller.theme,
		width,
	});
}

function handleControllerInput(controller: AskFlowController, data: string) {
	controller.editor.disableSubmit = !isNativeEditorSubmitEnabled(controller);
	const command = getInputCommand(
		controller.state,
		controller.config,
		data,
		isEditingView(controller.state) ? controller.editor.getText() : ""
	);
	if (isEditingView(controller.state)) {
		handleEditingCommand(controller, command, data);
		return;
	}
	handleNavigationCommand(controller, command);
}

function isNativeEditorSubmitEnabled(controller: AskFlowController): boolean {
	if (controller.state.view.kind === "input") {
		return controller.config.keymaps.editor.submit.includes("enter");
	}
	if (controller.state.view.kind === "note") {
		return controller.config.keymaps.noteEditor.save.includes("enter");
	}
	return true;
}

function handleEditingCommand(
	controller: AskFlowController,
	command: AskInputCommand,
	data: string
) {
	if (command.kind === "dismiss") {
		handleExitFlow(controller, dismissFlow(controller.state));
		return;
	}
	if (command.kind === "showSettings") {
		showSettingsModal(controller);
		return;
	}
	if (command.kind === "editMoveTab") {
		commitSavedEditorNavigation(controller, moveTab, command.delta);
		return;
	}
	if (command.kind === "editMoveOption") {
		commitSavedEditorNavigation(controller, moveOption, command.delta);
		return;
	}
	if (command.kind === "editClose") {
		closeEditor(controller);
		return;
	}
	if (command.kind === "editSubmit") {
		submitEditor(controller, controller.editor.getText());
		return;
	}
	if (command.kind === "delegateToEditor") {
		controller.editor.handleInput(data);
		refresh(controller);
	}
}

function handleNavigationCommand(
	controller: AskFlowController,
	command: AskInputCommand
) {
	switch (command.kind) {
		case "moveTab":
			clearReviewShortcutPending(controller);
			clearQuestionTypeChangePending(controller);
			commitState(controller, moveTab(controller.state, command.delta));
			return;
		case "moveOption":
			clearReviewShortcutPending(controller);
			clearQuestionTypeChangePending(controller);
			commitState(controller, moveOption(controller.state, command.delta));
			return;
		case "toggleMulti":
			clearReviewShortcutPending(controller);
			clearQuestionTypeChangePending(controller);
			handleToggleCurrentOption(controller);
			return;
		case "changeQuestionType":
			clearReviewShortcutPending(controller);
			handleChangeQuestionType(controller);
			return;
		case "openQuestionNote":
			clearQuestionTypeChangePending(controller);
			openQuestionNote(controller);
			return;
		case "openOptionNote":
			clearQuestionTypeChangePending(controller);
			openOptionNote(controller);
			return;
		case "confirm":
			clearReviewShortcutPending(controller);
			clearQuestionTypeChangePending(controller);
			commitState(controller, confirmCurrentSelection(controller.state), {
				finish: true,
			});
			return;
		case "cancel":
			clearReviewShortcutPending(controller);
			clearQuestionTypeChangePending(controller);
			handleExitFlow(controller, cancelFlow(controller.state));
			return;
		case "numberShortcut":
			if (handleReviewShortcutNumber(controller, command.digit)) {
				return;
			}
			clearReviewShortcutPending(controller);
			clearQuestionTypeChangePending(controller);
			commitState(
				controller,
				applyNumberShortcut(controller.state, command.digit)
			);
			return;
		case "dismiss":
			clearReviewShortcutPending(controller);
			clearQuestionTypeChangePending(controller);
			handleExitFlow(controller, dismissFlow(controller.state));
			return;
		case "showSettings":
			showSettingsModal(controller);
			return;
		case "ignore":
		case "editMoveTab":
		case "editMoveOption":
		case "editClose":
		case "editSubmit":
		case "delegateToEditor":
			return;
		default:
			return;
	}
}

function handleToggleCurrentOption(controller: AskFlowController) {
	const question = getCurrentQuestion(controller.state);
	if (!question) {
		return;
	}
	commitState(controller, toggleCurrentMultiOption(controller.state));
}

function handleChangeQuestionType(controller: AskFlowController) {
	const question = getCurrentQuestion(controller.state);
	if (!question || isSubmitTab(controller.state)) {
		return;
	}
	const confirmed =
		controller.pendingQuestionTypeChangeQuestionId === question.id;
	const result = cycleCurrentQuestionType(controller.state, { confirmed });
	controller.dismissNotice = result.notice;
	if (result.needsConfirmation) {
		controller.pendingQuestionTypeChangeQuestionId = question.id;
		refresh(controller);
		return;
	}
	clearQuestionTypeChangePending(controller);
	commitState(controller, result.state, { finish: true });
}

function openQuestionNote(controller: AskFlowController) {
	const question = getCurrentQuestion(controller.state);
	if (!question || isSubmitTab(controller.state)) {
		return;
	}
	commitState(
		controller,
		enterQuestionNoteMode(controller.state, question.id),
		{
			syncSelection: false,
		}
	);
}

function openOptionNote(controller: AskFlowController) {
	const question = getCurrentQuestion(controller.state);
	const option = getCurrentOption(controller.state);
	if (
		!(question && option) ||
		option.isCustomOption ||
		isSubmitTab(controller.state)
	) {
		return;
	}
	commitState(
		controller,
		enterOptionNoteMode(controller.state, question.id, option.value),
		{ syncSelection: false }
	);
}

function commitState(
	controller: AskFlowController,
	nextState: AskState,
	options: { finish?: boolean; syncSelection?: boolean } = {}
) {
	if (nextState.activeTabIndex !== controller.state.activeTabIndex) {
		clearFooterNotices(controller);
	}
	controller.suppressAutoInputForSelection = false;
	controller.state = nextState;
	if (options.syncSelection !== false) {
		syncSelection(controller);
	}
	controller.state = maybeAutoSubmitState(controller.state, controller.config);
	hydrateEditor(controller);
	refresh(controller);
	if (options.finish) {
		maybeFinish(controller);
	}
}

function submitEditor(controller: AskFlowController, value: string) {
	controller.suppressAutoInputForSelection = false;
	const nextState = submitEditorDraft(controller.state, value);
	if (nextState.activeTabIndex !== controller.state.activeTabIndex) {
		clearFooterNotices(controller);
	}
	controller.state = nextState;
	syncSelection(controller);
	controller.state = maybeAutoSubmitState(controller.state, controller.config);
	hydrateEditor(controller);
	refresh(controller);
	maybeFinish(controller);
}

function commitSavedEditorNavigation(
	controller: AskFlowController,
	navigate: (state: AskState, delta: 1 | -1) => AskState,
	delta: 1 | -1
) {
	commitState(controller, navigate(saveEditorState(controller), delta));
}

function closeEditor(controller: AskFlowController) {
	const nextState = saveEditorState(controller);
	controller.suppressAutoInputForSelection = nextState.view.kind !== "input";
	controller.state = nextState;
	refresh(controller);
}

function handleExitFlow(controller: AskFlowController, nextState: AskState) {
	if (!shouldRequestDismissConfirmation(controller)) {
		commitState(controller, nextState, { finish: true });
		return;
	}
	if (shouldDiscardAfterConfirmation(!!controller.dismissNotice)) {
		commitState(controller, nextState, { finish: true });
		return;
	}
	controller.dismissNotice = DIRTY_DISMISS_NOTICE;
	refresh(controller);
}

function shouldRequestDismissConfirmation(
	controller: AskFlowController
): boolean {
	return shouldConfirmDirtyDismiss({
		config: controller.config,
		state: controller.state,
		editingText: isEditingView(controller.state)
			? controller.editor.getText()
			: "",
	});
}

function clearFooterNotices(controller: AskFlowController) {
	controller.configNotice = undefined;
	controller.dismissNotice = undefined;
}

function clearReviewShortcutPending(controller: AskFlowController) {
	controller.pendingReviewShortcutActionIndex = undefined;
}

function clearQuestionTypeChangePending(controller: AskFlowController) {
	controller.pendingQuestionTypeChangeQuestionId = undefined;
}

function getActiveReviewShortcutHint(
	controller: AskFlowController
): string | undefined {
	if (
		!(
			isSubmitTab(controller.state) &&
			controller.config.behaviour.doublePressReviewShortcuts
		)
	) {
		return;
	}
	return getReviewShortcutHint(controller.pendingReviewShortcutActionIndex);
}

function handleReviewShortcutNumber(
	controller: AskFlowController,
	digit: number
): boolean {
	if (
		!(
			isSubmitTab(controller.state) &&
			controller.config.behaviour.doublePressReviewShortcuts
		)
	) {
		return false;
	}

	const resolution = resolveReviewShortcutDoublePress(
		digit,
		controller.pendingReviewShortcutActionIndex
	);
	if (resolution.actionIndex === undefined) {
		return false;
	}

	controller.pendingReviewShortcutActionIndex = resolution.pendingActionIndex;
	const nextState = resolution.confirmed
		? applyNumberShortcut(controller.state, digit)
		: {
				...controller.state,
				activeSubmitActionIndex: resolution.actionIndex,
			};
	commitState(controller, nextState, { finish: resolution.confirmed });
	return true;
}

function getFooterNotice(controller: AskFlowController): string | undefined {
	return controller.dismissNotice ?? controller.configNotice;
}

function showSettingsModal(controller: AskFlowController) {
	if (controller.settingsOpen) {
		return;
	}
	controller.settingsOpen = true;
	showAskSettings(controller.ctx).finally(() => {
		controller.settingsOpen = false;
		refresh(controller);
	});
}

function refresh(controller: AskFlowController) {
	controller.tui.requestRender();
}

async function notifyCurrentQuestion(
	controller: AskFlowController
): Promise<void> {
	const question = getCurrentQuestion(controller.state);
	if (!question) {
		return;
	}
	await notifyQuestionWaiting(
		controller.config,
		createQuestionWaitingNotification(question)
	);
}

function maybeFinish(controller: AskFlowController) {
	if (controller.state.completed) {
		const result = toAskResult(controller.state);
		controller.remoteFlow?.complete(result);
		controller.done(result);
	}
}

function startRemoteFlow(
	controller: AskFlowController,
	params: AskFlowParams
): RemoteAskFlowHandle | undefined {
	const remote = params.flowOptions.remote;
	if (!remote) {
		return;
	}
	return remote.runtime.startFlow({
		source: remote.source,
		toolCallId: remote.toolCallId,
		title: controller.state.title,
		questions: controller.state.questions,
		onSubmit: (response) => submitRemoteResponse(controller, response),
	});
}

function submitRemoteResponse(
	controller: AskFlowController,
	response: RemoteAskResponse
): RemoteAskSubmitResolution {
	const resolution = applyRemoteAskResponse(controller.state, response);
	if (!resolution.ok) {
		return resolution;
	}
	commitState(controller, resolution.state, { finish: true });
	return { ok: true };
}

function hydrateEditor(controller: AskFlowController) {
	controller.editor.setText(getEditorDraft(controller.state));
}

function syncSelection(controller: AskFlowController) {
	if (controller.suppressAutoInputForSelection) {
		return;
	}
	controller.state = syncStateToSelection(controller.state);
}

function saveEditorState(controller: AskFlowController): AskState {
	const text = controller.editor.getText();
	controller.editor.setText("");
	return saveEditorDraft(controller.state, text);
}

function createEditor(tui: Tui, theme: Theme, cwd: string) {
	const editor = new Editor(tui, createEditorTheme(theme));
	editor.setAutocompleteProvider(createAskAutocompleteProvider(cwd));
	return editor;
}

function createEditorTheme(theme: Theme): EditorTheme {
	return {
		borderColor: (text) => theme.fg("accent", text),
		selectList: {
			description: (text) => theme.fg("muted", text),
			noMatch: (text) => theme.fg("warning", text),
			scrollInfo: (text) => theme.fg("dim", text),
			selectedPrefix: (text) => theme.fg("accent", text),
			selectedText: (text) => theme.fg("accent", text),
		},
	};
}
