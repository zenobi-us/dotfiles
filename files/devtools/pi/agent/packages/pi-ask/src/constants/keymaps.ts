import { matchesKey } from "@earendil-works/pi-tui";
import type { AskConfig, AskConfigKeymaps } from "../config/schema.ts";

const DIGIT_SHORTCUT_PATTERN = /^[1-9]$/;
const LETTER_PATTERN = /^[a-z]$/;
const DIGIT_PATTERN = /^[0-9]$/;
const SYMBOL_PATTERN = /^[`\-=[\]\\;'.,/!@#$%^&*()_+|~{}:<>?]$/;
const FUNCTION_KEY_PATTERN = /^f([1-9]|1[0-2])$/;
const MODIFIER_ORDER = ["ctrl", "shift", "alt", "super"] as const;
const KNOWN_SPECIAL_KEYS = new Set([
	"esc",
	"enter",
	"tab",
	"space",
	"backspace",
	"delete",
	"insert",
	"clear",
	"home",
	"end",
	"pageUp",
	"pageDown",
	"up",
	"down",
	"left",
	"right",
	"f1",
	"f2",
	"f3",
	"f4",
	"f5",
	"f6",
	"f7",
	"f8",
	"f9",
	"f10",
	"f11",
	"f12",
] as const);
const RESERVED_BINDINGS = new Set([
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
]);

const CONTEXT_LABELS: Record<AskKeymapContext, string> = {
	global: "Global",
	main: "Main flow",
	editor: "Answer editor",
	noteEditor: "Note editor",
	settingsModal: "Settings modal",
};

type KeyId = Parameters<typeof matchesKey>[1];
type InputKey = KeyId | (string & {});
type ModifierName = (typeof MODIFIER_ORDER)[number];

export type AskKeymapContext = keyof AskConfigKeymaps;
export type AskKeymapAction<C extends AskKeymapContext = AskKeymapContext> =
	keyof AskConfigKeymaps[C] & string;
export type AskKeyBindingKind = "command" | "affordance";
export type AskKeyBindingId =
	| `${AskKeymapContext}.${string}`
	| "numberShortcut"
	| "fileReference";

export interface AskKeyBinding {
	contexts: readonly string[];
	description: string;
	id: AskKeyBindingId;
	keys: readonly InputKey[];
	kind: AskKeyBindingKind;
	label: string;
}

export type FooterKeymapContext =
	| "default"
	| "multi"
	| "submit"
	| "input"
	| "note";

export const DEFAULT_ASK_KEYMAPS: AskConfigKeymaps = {
	global: {
		dismiss: ["ctrl+c"],
		settings: ["?"],
	},
	main: {
		confirm: ["enter"],
		cancel: ["esc"],
		changeQuestionType: ["t"],
		toggle: ["space"],
		nextTab: ["tab", "right"],
		previousTab: ["shift+tab", "left"],
		nextOption: ["down"],
		previousOption: ["up"],
		optionNote: ["n"],
		questionNote: ["shift+n"],
	},
	editor: {
		submit: ["enter"],
		close: ["esc"],
		nextTabWhenEmpty: ["tab", "right"],
		previousTabWhenEmpty: ["shift+tab", "left"],
		nextOptionWhenEmpty: ["down"],
		previousOptionWhenEmpty: ["up"],
	},
	noteEditor: {
		save: ["enter"],
		close: ["esc"],
		nextTabWhenEmpty: ["tab", "right"],
		previousTabWhenEmpty: ["shift+tab", "left"],
		nextOptionWhenEmpty: ["down"],
		previousOptionWhenEmpty: ["up"],
	},
	settingsModal: {
		close: ["esc", "ctrl+c", "?"],
		nextOption: ["down"],
		previousOption: ["up"],
		toggle: ["enter", "space"],
	},
};

const DESCRIPTIONS: Record<AskKeymapContext, Record<string, string>> = {
	global: {
		dismiss: "Dismiss the active ask surface",
		settings: "Open ask settings",
	},
	main: {
		confirm: "Confirm selection, continue, or submit",
		cancel: "Cancel flow",
		changeQuestionType: "Change current question type",
		toggle: "Toggle selected option",
		nextTab: "Switch to next tab",
		previousTab: "Switch to previous tab",
		nextOption: "Move to next option/action",
		previousOption: "Move to previous option/action",
		optionNote: "Edit selected option note",
		questionNote: "Edit question note",
	},
	editor: {
		submit: "Submit custom answer",
		close: "Close editor and preserve draft",
		nextTabWhenEmpty: "Switch to next tab when editor is empty",
		previousTabWhenEmpty: "Switch to previous tab when editor is empty",
		nextOptionWhenEmpty: "Move to next option when editor is empty",
		previousOptionWhenEmpty: "Move to previous option when editor is empty",
	},
	noteEditor: {
		save: "Save note",
		close: "Close note editor",
		nextTabWhenEmpty: "Switch to next tab when editor is empty",
		previousTabWhenEmpty: "Switch to previous tab when editor is empty",
		nextOptionWhenEmpty: "Move to next option when editor is empty",
		previousOptionWhenEmpty: "Move to previous option when editor is empty",
	},
	settingsModal: {
		close: "Close settings",
		nextOption: "Move to next setting",
		previousOption: "Move to previous setting",
		toggle: "Toggle selected setting",
	},
};

const footerHint = (
	binding: AskKeyBinding,
	action: string,
	label = binding.label
) => `${label} ${action}`;

const footerKeyIdLabel = (binding: AskKeyBinding) => binding.keys.join(" / ");

export function formatKeybindingLabel(key: string): string {
	if (key === "up") {
		return "↑";
	}
	if (key === "down") {
		return "↓";
	}
	if (key === "left") {
		return "←";
	}
	if (key === "right") {
		return "→";
	}
	return key
		.split("+")
		.map((part) => {
			if (part.length <= 1) {
				return part.toUpperCase();
			}
			if (part === "pageUp" || part === "pageDown") {
				return part;
			}
			return part.charAt(0).toUpperCase() + part.slice(1);
		})
		.join("+");
}

export function formatBindingLabel(keys: readonly string[]): string {
	return keys.map(formatKeybindingLabel).join(" / ");
}

export function matchesBinding(data: string, binding: AskKeyBinding): boolean {
	return binding.keys.some((key) => {
		if (key.length === 1) {
			return data === key;
		}
		return matchesKey(data, key as KeyId);
	});
}

export function matchesDigitShortcut(data: string): number | null {
	return DIGIT_SHORTCUT_PATTERN.test(data) ? Number(data) : null;
}

export function getAskKeyBindings(
	config: AskConfig
): Record<string, AskKeyBinding> {
	const entries: [string, AskKeyBinding][] = [];
	for (const context of Object.keys(config.keymaps) as AskKeymapContext[]) {
		const actions = config.keymaps[context] as Record<
			string,
			readonly string[]
		>;
		for (const [action, keys] of Object.entries(actions)) {
			const id = `${context}.${action}` as AskKeyBindingId;
			entries.push([
				id,
				{
					contexts: [CONTEXT_LABELS[context]],
					description: DESCRIPTIONS[context][action] ?? action,
					id,
					keys,
					kind: "command",
					label: formatBindingLabel(keys),
				},
			]);
		}
	}
	entries.push([
		"numberShortcut",
		{
			contexts: ["Main flow", "Submit tab"],
			description: "Quick-select option or submit action",
			id: "numberShortcut",
			keys: ["1..9"],
			kind: "command",
			label: "1..9",
		},
	]);
	entries.push([
		"fileReference",
		{
			contexts: ["Editors"],
			description: "Reference files while typing answers or notes",
			id: "fileReference",
			keys: ["@"],
			kind: "affordance",
			label: "@",
		},
	]);
	return Object.fromEntries(entries);
}

export function getAskContextBindings<C extends AskKeymapContext>(
	config: AskConfig,
	context: C
): Record<AskKeymapAction<C>, AskKeyBinding> {
	const bindings = getAskKeyBindings(config);
	const actions = config.keymaps[context] as Record<string, readonly string[]>;
	return Object.fromEntries(
		Object.keys(actions).map((action) => [
			action,
			bindings[`${context}.${action}`],
		])
	) as Record<AskKeymapAction<C>, AskKeyBinding>;
}

export function getGlobalBindings(
	config: AskConfig
): Record<AskKeymapAction<"global">, AskKeyBinding> {
	return getAskContextBindings(config, "global");
}

export function getAskKeymaps(config: AskConfig): {
	customizable: readonly AskKeyBinding[];
	fixed: readonly AskKeyBinding[];
} {
	const bindings = getAskKeyBindings(config);
	return {
		customizable: Object.keys(bindings)
			.filter((id) => id !== "numberShortcut" && id !== "fileReference")
			.map((id) => bindings[id]),
		fixed: [bindings.numberShortcut, bindings.fileReference],
	};
}

export function renderFooterKeymaps(
	config: AskConfig,
	context: FooterKeymapContext
): string {
	const global = getGlobalBindings(config);
	const main = getAskContextBindings(config, "main");
	const editor = getAskContextBindings(config, "editor");
	const noteEditor = getAskContextBindings(config, "noteEditor");
	const bindings = getAskKeyBindings(config);
	const noteNavigationLabel = `${main.optionNote.label}/${main.questionNote.label}`;
	const hintsByContext: Record<FooterKeymapContext, readonly string[]> = {
		input: [
			footerHint(editor.submit, "submit"),
			footerHint(editor.close, "close"),
			footerHint(global.settings, "settings"),
		],
		note: [
			footerHint(noteEditor.save, "save"),
			footerHint(noteEditor.close, "close"),
			footerHint(global.settings, "settings"),
		],
		submit: [
			footerHint(bindings.numberShortcut, "hotkeys"),
			footerHint(main.confirm, "confirm"),
			footerHint(main.cancel, "cancel"),
			footerHint(global.settings, "settings"),
		],
		multi: [
			footerHint(main.toggle, "toggle"),
			footerHint(
				main.changeQuestionType,
				"question type",
				footerKeyIdLabel(main.changeQuestionType)
			),
			footerHint(main.confirm, "continue"),
			footerHint(main.optionNote, "note", noteNavigationLabel),
			footerHint(main.cancel, "dismiss"),
			footerHint(global.settings, "settings"),
		],
		default: [
			footerHint(
				main.changeQuestionType,
				"question type",
				footerKeyIdLabel(main.changeQuestionType)
			),
			footerHint(main.confirm, "confirm"),
			footerHint(main.optionNote, "note", noteNavigationLabel),
			footerHint(main.cancel, "dismiss"),
			footerHint(global.settings, "settings"),
		],
	};
	return ` ${hintsByContext[context].join(" · ")}`;
}

export function renderSettingsFooterKeymaps(config: AskConfig): string {
	const bindings = getAskContextBindings(config, "settingsModal");
	return `${bindings.toggle.label} to change · ${bindings.close.label} to close`;
}

export function normalizeConfiguredKeymaps(
	keymaps: unknown
): { ok: true; keymaps: AskConfigKeymaps } | { ok: false; error: string } {
	const candidate = normalizeLegacyFlatKeymaps(keymaps) ?? keymaps;
	if (!candidate) {
		return { ok: true, keymaps: cloneKeymaps(DEFAULT_ASK_KEYMAPS) };
	}
	if (!(candidate && typeof candidate === "object")) {
		return { ok: false, error: "Keymaps must be an object." };
	}

	const normalized = {} as AskConfigKeymaps;
	for (const context of Object.keys(
		DEFAULT_ASK_KEYMAPS
	) as AskKeymapContext[]) {
		const rawContext = (candidate as Record<string, unknown>)[context];
		if (!(rawContext && typeof rawContext === "object")) {
			return { ok: false, error: `Missing keymap context ${context}.` };
		}
		const contextResult = normalizeContextKeymaps(
			context,
			rawContext as Record<string, unknown>
		);
		if (!contextResult.ok) {
			return contextResult;
		}
		normalized[context] = contextResult.keymaps as never;
	}

	const globalDuplicates = validateCrossContextConflicts(normalized);
	if (globalDuplicates) {
		return { ok: false, error: globalDuplicates };
	}

	return { ok: true, keymaps: normalized };
}

function normalizeContextKeymaps(
	context: AskKeymapContext,
	rawContext: Record<string, unknown>
):
	| { ok: true; keymaps: Record<string, string[]> }
	| { ok: false; error: string } {
	const defaults = DEFAULT_ASK_KEYMAPS[context] as Record<
		string,
		readonly string[]
	>;
	const normalized: Record<string, string[]> = {};
	for (const action of Object.keys(defaults)) {
		const rawValue = rawContext[action];
		if (rawValue === undefined) {
			return { ok: false, error: `Missing keymap for ${context}.${action}.` };
		}
		const parsed = normalizeBindingList(rawValue);
		if (!parsed.ok) {
			return {
				ok: false,
				error: `Invalid keymap for ${context}.${action}: ${parsed.error}`,
			};
		}
		normalized[action] = parsed.keys;
	}

	const duplicateError = validateContextBindings(context, normalized);
	return duplicateError
		? { ok: false, error: duplicateError }
		: { ok: true, keymaps: normalized };
}

function normalizeBindingList(
	rawValue: unknown
): { ok: true; keys: string[] } | { ok: false; error: string } {
	const rawKeys = typeof rawValue === "string" ? [rawValue] : rawValue;
	if (!Array.isArray(rawKeys)) {
		return { ok: false, error: "binding must be a string or array of strings" };
	}
	if (rawKeys.length === 0) {
		return { ok: false, error: "empty binding list" };
	}
	const keys: string[] = [];
	for (const rawKey of rawKeys) {
		if (typeof rawKey !== "string") {
			return { ok: false, error: "binding list must contain only strings" };
		}
		const parsed = normalizeKeyId(rawKey);
		if (!parsed.ok) {
			return parsed;
		}
		if (!keys.includes(parsed.keyId)) {
			keys.push(parsed.keyId);
		}
	}
	return { ok: true, keys };
}

function validateContextBindings(
	context: AskKeymapContext,
	bindings: Record<string, readonly string[]>
): string | undefined {
	const seen = new Map<string, string>();
	for (const { action, key } of flattenBindings(bindings)) {
		if (RESERVED_BINDINGS.has(key)) {
			return `Reserved keymap for ${context}.${action}: ${formatKeybindingLabel(key)}.`;
		}
		const existing = seen.get(key);
		if (existing) {
			return `Duplicate keymap ${formatKeybindingLabel(key)} for ${context}.${existing} and ${context}.${action}.`;
		}
		seen.set(key, action);
	}
	return;
}

function validateCrossContextConflicts(
	keymaps: AskConfigKeymaps
): string | undefined {
	const globalSeen = new Map(
		flattenBindings(keymaps.global).map(({ action, key }) => [
			key,
			`global.${action}`,
		])
	);
	for (const { context, action, key } of flattenNonGlobalBindings(keymaps)) {
		const existing = globalSeen.get(key);
		if (existing) {
			return `Duplicate global keymap ${formatKeybindingLabel(key)} for ${existing} and ${context}.${action}.`;
		}
	}
	return;
}

function flattenNonGlobalBindings(keymaps: AskConfigKeymaps): Array<{
	action: string;
	context: AskKeymapContext;
	key: string;
}> {
	return (Object.keys(keymaps) as AskKeymapContext[])
		.filter((context) => context !== "global" && context !== "settingsModal")
		.flatMap((context) =>
			flattenBindings(
				keymaps[context] as Record<string, readonly string[]>
			).map((binding) => ({ ...binding, context }))
		);
}

function flattenBindings(
	bindings: Record<string, readonly string[]>
): Array<{ action: string; key: string }> {
	return Object.entries(bindings).flatMap(([action, keys]) =>
		keys.map((key) => ({ action, key }))
	);
}

export function normalizeLegacyFlatKeymaps(
	keymaps: unknown
): AskConfigKeymaps | undefined {
	if (!(keymaps && typeof keymaps === "object")) {
		return;
	}
	if ("main" in keymaps || "global" in keymaps) {
		return;
	}
	const raw = keymaps as Record<string, unknown>;
	const defaults = cloneKeymaps(DEFAULT_ASK_KEYMAPS);
	return {
		...defaults,
		global: {
			...defaults.global,
			dismiss: coerceLegacyBinding(raw.dismiss, defaults.global.dismiss),
		},
		main: {
			...defaults.main,
			confirm: coerceLegacyBinding(raw.confirm, defaults.main.confirm),
			cancel: coerceLegacyBinding(raw.cancel, defaults.main.cancel),
			toggle: coerceLegacyBinding(raw.toggle, defaults.main.toggle),
			optionNote: coerceLegacyBinding(raw.optionNote, defaults.main.optionNote),
			questionNote: coerceLegacyBinding(
				raw.questionNote,
				defaults.main.questionNote
			),
		},
		editor: {
			...defaults.editor,
			submit: coerceLegacyBinding(raw.confirm, defaults.editor.submit),
			close: coerceLegacyBinding(raw.cancel, defaults.editor.close),
		},
		noteEditor: {
			...defaults.noteEditor,
			save: coerceLegacyBinding(raw.confirm, defaults.noteEditor.save),
			close: coerceLegacyBinding(raw.cancel, defaults.noteEditor.close),
		},
	};
}

function coerceLegacyBinding(value: unknown, fallback: string[]): string[] {
	return typeof value === "string" ? [value] : fallback;
}

function normalizeKeyId(
	rawKey: string
): { ok: true; keyId: string } | { ok: false; error: string } {
	const normalizedInput = rawKey.trim();
	if (!normalizedInput) {
		return { ok: false, error: "empty binding" };
	}

	const parts = normalizedInput
		.toLowerCase()
		.split("+")
		.map((part) => part.trim())
		.filter(Boolean);
	if (parts.length === 0) {
		return { ok: false, error: "empty binding" };
	}

	const basePart = parts.at(-1);
	if (!basePart) {
		return { ok: false, error: "missing key" };
	}

	const modifiers = new Set<ModifierName>();
	for (const part of parts.slice(0, -1)) {
		const modifier = normalizeModifierName(part);
		if (!modifier) {
			return { ok: false, error: `unsupported modifier ${part}` };
		}
		modifiers.add(modifier);
	}

	const baseKey = normalizeBaseKey(basePart);
	if (!baseKey) {
		return { ok: false, error: `unsupported key ${basePart}` };
	}

	const modifierPrefix = MODIFIER_ORDER.filter((modifier) =>
		modifiers.has(modifier)
	);
	return { ok: true, keyId: [...modifierPrefix, baseKey].join("+") };
}

function cloneKeymaps(keymaps: AskConfigKeymaps): AskConfigKeymaps {
	return {
		global: {
			dismiss: [...keymaps.global.dismiss],
			settings: [...keymaps.global.settings],
		},
		main: {
			confirm: [...keymaps.main.confirm],
			cancel: [...keymaps.main.cancel],
			changeQuestionType: [...keymaps.main.changeQuestionType],
			toggle: [...keymaps.main.toggle],
			nextTab: [...keymaps.main.nextTab],
			previousTab: [...keymaps.main.previousTab],
			nextOption: [...keymaps.main.nextOption],
			previousOption: [...keymaps.main.previousOption],
			optionNote: [...keymaps.main.optionNote],
			questionNote: [...keymaps.main.questionNote],
		},
		editor: {
			submit: [...keymaps.editor.submit],
			close: [...keymaps.editor.close],
			nextTabWhenEmpty: [...keymaps.editor.nextTabWhenEmpty],
			previousTabWhenEmpty: [...keymaps.editor.previousTabWhenEmpty],
			nextOptionWhenEmpty: [...keymaps.editor.nextOptionWhenEmpty],
			previousOptionWhenEmpty: [...keymaps.editor.previousOptionWhenEmpty],
		},
		noteEditor: {
			save: [...keymaps.noteEditor.save],
			close: [...keymaps.noteEditor.close],
			nextTabWhenEmpty: [...keymaps.noteEditor.nextTabWhenEmpty],
			previousTabWhenEmpty: [...keymaps.noteEditor.previousTabWhenEmpty],
			nextOptionWhenEmpty: [...keymaps.noteEditor.nextOptionWhenEmpty],
			previousOptionWhenEmpty: [...keymaps.noteEditor.previousOptionWhenEmpty],
		},
		settingsModal: {
			close: [...keymaps.settingsModal.close],
			nextOption: [...keymaps.settingsModal.nextOption],
			previousOption: [...keymaps.settingsModal.previousOption],
			toggle: [...keymaps.settingsModal.toggle],
		},
	};
}

function normalizeModifierName(part: string): ModifierName | undefined {
	switch (part) {
		case "ctrl":
		case "control":
		case "ctl":
			return "ctrl";
		case "shift":
			return "shift";
		case "alt":
		case "option":
			return "alt";
		case "super":
		case "cmd":
		case "command":
		case "meta":
		case "win":
		case "windows":
			return "super";
		default:
			return;
	}
}

function normalizeBaseKey(part: string): string | undefined {
	const aliased = normalizeBaseKeyAlias(part);
	if (
		LETTER_PATTERN.test(aliased) ||
		DIGIT_PATTERN.test(aliased) ||
		SYMBOL_PATTERN.test(aliased)
	) {
		return aliased;
	}
	if (FUNCTION_KEY_PATTERN.test(aliased)) {
		return aliased;
	}
	if (
		KNOWN_SPECIAL_KEYS.has(
			aliased as typeof KNOWN_SPECIAL_KEYS extends Set<infer T> ? T : never
		)
	) {
		return aliased;
	}
	return;
}

function normalizeBaseKeyAlias(part: string): string {
	switch (part) {
		case "escape":
			return "esc";
		case "return":
			return "enter";
		case "spacebar":
			return "space";
		case "del":
			return "delete";
		case "ins":
			return "insert";
		case "pgup":
		case "pageup":
			return "pageUp";
		case "pgdown":
		case "pagedown":
			return "pageDown";
		case "arrowup":
			return "up";
		case "arrowdown":
			return "down";
		case "arrowleft":
			return "left";
		case "arrowright":
			return "right";
		default:
			return part;
	}
}
