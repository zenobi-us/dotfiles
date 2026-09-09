import {
	DEFAULT_ASK_KEYMAPS,
	normalizeConfiguredKeymaps,
} from "../constants/keymaps.ts";
import type {
	AskConfig,
	AskConfigFileV5,
	AskConfigKeymaps,
	AskNotificationChannel,
} from "./schema.ts";

const DEFAULT_EXTRACTION_RETRIES = 1;
const MAX_EXTRACTION_RETRIES = 3;
const DEFAULT_EXTRACTION_TIMEOUT_MS = 30_000;

export const DEFAULT_ASK_CONFIG: AskConfig = {
	answer: {
		extractionModels: [
			{ provider: "openai-codex", id: "gpt-5.4-mini" },
			{ provider: "github-copilot", id: "gpt-5.4-mini" },
			{ provider: "anthropic", id: "claude-haiku-4-5" },
		],
		extractionRetries: DEFAULT_EXTRACTION_RETRIES,
		extractionTimeoutMs: DEFAULT_EXTRACTION_TIMEOUT_MS,
	},
	behaviour: {
		autoSubmitWhenAnsweredWithoutNotes: false,
		confirmDismissWhenDirty: true,
		doublePressReviewShortcuts: true,
		presentSingleAsMulti: false,
		showFooterHints: true,
	},
	keymaps: cloneKeymaps(DEFAULT_ASK_KEYMAPS),
	notifications: {
		channels: ["bell"],
		enabled: true,
	},
};

export function normalizeAskConfig(
	config?: Partial<AskConfigFileV5> | AskConfig
): AskConfig {
	return {
		answer: {
			extractionModels:
				config?.answer?.extractionModels?.filter(isValidModelPreference) ??
				DEFAULT_ASK_CONFIG.answer.extractionModels,
			extractionRetries: clampInteger(
				config?.answer?.extractionRetries,
				0,
				MAX_EXTRACTION_RETRIES,
				DEFAULT_EXTRACTION_RETRIES
			),
			extractionTimeoutMs: positiveNumberOrDefault(
				config?.answer?.extractionTimeoutMs,
				DEFAULT_EXTRACTION_TIMEOUT_MS
			),
		},
		behaviour: {
			autoSubmitWhenAnsweredWithoutNotes:
				config?.behaviour?.autoSubmitWhenAnsweredWithoutNotes ??
				DEFAULT_ASK_CONFIG.behaviour.autoSubmitWhenAnsweredWithoutNotes,
			confirmDismissWhenDirty:
				config?.behaviour?.confirmDismissWhenDirty ??
				DEFAULT_ASK_CONFIG.behaviour.confirmDismissWhenDirty,
			doublePressReviewShortcuts:
				config?.behaviour?.doublePressReviewShortcuts ??
				DEFAULT_ASK_CONFIG.behaviour.doublePressReviewShortcuts,
			showFooterHints:
				config?.behaviour?.showFooterHints ??
				DEFAULT_ASK_CONFIG.behaviour.showFooterHints,
			presentSingleAsMulti:
				config?.behaviour?.presentSingleAsMulti ??
				DEFAULT_ASK_CONFIG.behaviour.presentSingleAsMulti,
		},
		keymaps: mergeKeymaps(config?.keymaps),
		notifications: {
			channels: normalizeNotificationChannels(config?.notifications?.channels),
			enabled:
				config?.notifications?.enabled ??
				DEFAULT_ASK_CONFIG.notifications.enabled,
		},
	};
}

export function toAskConfigFileV5(config: AskConfig): AskConfigFileV5 {
	const normalized = normalizeAskConfig(config);
	return {
		schemaVersion: 5,
		answer: {
			extractionModels: normalized.answer.extractionModels,
			extractionRetries: normalized.answer.extractionRetries,
			extractionTimeoutMs: normalized.answer.extractionTimeoutMs,
		},
		behaviour: {
			autoSubmitWhenAnsweredWithoutNotes:
				normalized.behaviour.autoSubmitWhenAnsweredWithoutNotes,
			confirmDismissWhenDirty: normalized.behaviour.confirmDismissWhenDirty,
			doublePressReviewShortcuts:
				normalized.behaviour.doublePressReviewShortcuts,
			presentSingleAsMulti: normalized.behaviour.presentSingleAsMulti,
			showFooterHints: normalized.behaviour.showFooterHints,
		},
		keymaps: cloneKeymaps(normalized.keymaps),
		notifications: {
			channels: normalized.notifications.channels,
			enabled: normalized.notifications.enabled,
		},
	};
}

function mergeKeymaps(keymaps: unknown): AskConfigKeymaps {
	const normalized = normalizeConfiguredKeymaps(keymaps);
	return normalized.ok ? normalized.keymaps : cloneKeymaps(DEFAULT_ASK_KEYMAPS);
}

function cloneKeymaps(keymaps: AskConfigKeymaps): AskConfigKeymaps {
	return {
		global: {
			dismiss: [...keymaps.global.dismiss],
			settings: [...keymaps.global.settings],
		},
		main: {
			cancel: [...keymaps.main.cancel],
			changeQuestionType: [...keymaps.main.changeQuestionType],
			confirm: [...keymaps.main.confirm],
			nextOption: [...keymaps.main.nextOption],
			nextTab: [...keymaps.main.nextTab],
			optionNote: [...keymaps.main.optionNote],
			previousOption: [...keymaps.main.previousOption],
			previousTab: [...keymaps.main.previousTab],
			questionNote: [...keymaps.main.questionNote],
			toggle: [...keymaps.main.toggle],
		},
		editor: {
			close: [...keymaps.editor.close],
			nextOptionWhenEmpty: [...keymaps.editor.nextOptionWhenEmpty],
			nextTabWhenEmpty: [...keymaps.editor.nextTabWhenEmpty],
			previousOptionWhenEmpty: [...keymaps.editor.previousOptionWhenEmpty],
			previousTabWhenEmpty: [...keymaps.editor.previousTabWhenEmpty],
			submit: [...keymaps.editor.submit],
		},
		noteEditor: {
			close: [...keymaps.noteEditor.close],
			nextOptionWhenEmpty: [...keymaps.noteEditor.nextOptionWhenEmpty],
			nextTabWhenEmpty: [...keymaps.noteEditor.nextTabWhenEmpty],
			previousOptionWhenEmpty: [...keymaps.noteEditor.previousOptionWhenEmpty],
			previousTabWhenEmpty: [...keymaps.noteEditor.previousTabWhenEmpty],
			save: [...keymaps.noteEditor.save],
		},
		settingsModal: {
			close: [...keymaps.settingsModal.close],
			nextOption: [...keymaps.settingsModal.nextOption],
			previousOption: [...keymaps.settingsModal.previousOption],
			toggle: [...keymaps.settingsModal.toggle],
		},
	};
}

function normalizeNotificationChannels(
	channels: unknown
): AskNotificationChannel[] {
	if (!Array.isArray(channels)) {
		return DEFAULT_ASK_CONFIG.notifications.channels;
	}
	const normalized = channels.filter(isValidNotificationChannel);
	return normalized.length > 0
		? normalized
		: DEFAULT_ASK_CONFIG.notifications.channels;
}

function isValidNotificationChannel(
	value: unknown
): value is AskNotificationChannel {
	if (value === "bell" || value === "osc9" || value === "osc777") {
		return true;
	}
	return (
		!!value &&
		typeof value === "object" &&
		(value as { type?: unknown }).type === "command" &&
		typeof (value as { command?: unknown }).command === "string" &&
		(value as { command: string }).command.trim().length > 0
	);
}

function isValidModelPreference(
	value: unknown
): value is { id: string; provider: string } {
	return (
		!!value &&
		typeof value === "object" &&
		typeof (value as { id?: unknown }).id === "string" &&
		(value as { id: string }).id.trim().length > 0 &&
		typeof (value as { provider?: unknown }).provider === "string" &&
		(value as { provider: string }).provider.trim().length > 0
	);
}

function clampInteger(
	value: unknown,
	min: number,
	max: number,
	fallback: number
): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return fallback;
	}
	return Math.max(min, Math.min(max, Math.trunc(value)));
}

function positiveNumberOrDefault(value: unknown, fallback: number): number {
	return typeof value === "number" && Number.isFinite(value) && value > 0
		? value
		: fallback;
}
