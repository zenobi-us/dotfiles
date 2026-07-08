import type { AgentMessage } from "@earendil-works/pi-agent-core";
import { SessionManager, type ExtensionAPI, type ExtensionContext, type Theme } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { acquireVstackModalLock } from "../bridges.js";
import { generateQolSummary, serializeMessagesForSummary } from "../compaction.js";
import {
	DEFAULT_SESSION_SEARCH_SUMMARY_INPUT_CHARS,
	DEFAULT_SESSION_SEARCH_SUMMARY_MAX_TOKENS,
	SESSION_SEARCH_CONTEXT_TYPE,
	SESSION_SEARCH_STATUS_KEY,
} from "../constants.js";
import { settingNumber, settingString } from "../settings.js";
import { sessionDisplayName } from "./cache.js";
import { QolSessionSearchLoadingComponent } from "./component.js";
import { forEachSessionJsonlLine } from "./jsonl.js";
import type { QolSessionSearchPendingMessage, QolSessionSearchResult } from "./types.js";

export function trimSessionSummaryInput(text: string, cwd: string): string {
	const maxChars = Math.max(20_000, Math.floor(settingNumber("sessionSearch.summaryInputMaxChars", DEFAULT_SESSION_SEARCH_SUMMARY_INPUT_CHARS, cwd)));
	if (text.length <= maxChars) return text;
	const headChars = Math.floor(maxChars * 0.35);
	const tailChars = maxChars - headChars;
	const omitted = text.length - maxChars;
	return `${text.slice(0, headChars)}\n\n[... ${omitted.toLocaleString()} character(s) omitted from the middle of this imported session ...]\n\n${text.slice(-tailChars)}`;
}

function messagesForSessionSummary(sessionPath: string): AgentMessage[] {
	try {
		const manager = SessionManager.open(sessionPath);
		const context = manager.buildSessionContext();
		if (Array.isArray(context.messages) && context.messages.length > 0) return context.messages as AgentMessage[];
	} catch {
		// Fall back to a direct JSONL parse below.
	}
	try {
		const messages: AgentMessage[] = [];
		forEachSessionJsonlLine(sessionPath, (line) => {
			if (!line.trim()) return;
			let entry: any;
			try { entry = JSON.parse(line); } catch { return; }
			if (entry?.type === "message" && entry.message) messages.push(entry.message);
		});
		return messages;
	} catch {
		return [];
	}
}

export async function buildSessionSearchContextMessage(ctx: ExtensionContext, result: QolSessionSearchResult, customPrompt?: string, signal?: AbortSignal): Promise<QolSessionSearchPendingMessage> {
	const messages = messagesForSessionSummary(result.path);
	const fallbackText = result.allMessagesText || result.firstMessage;
	const conversationText = messages.length > 0 ? serializeMessagesForSummary(messages) : fallbackText;
	if (!conversationText.trim()) throw new Error("Selected session has no text content to summarize");
	const focus = customPrompt?.trim();
	const summary = await generateQolSummary(ctx, {
		conversationText: trimSessionSummaryInput(conversationText, ctx.cwd),
		maxTokens: Math.max(256, Math.floor(settingNumber("sessionSearch.summaryMaxTokens", DEFAULT_SESSION_SEARCH_SUMMARY_MAX_TOKENS, ctx.cwd))),
		model: settingString("sessionSearch.summaryModel", "current", ctx.cwd),
		customInstructions: [
			`Source session file: ${result.path}`,
			`Source project/cwd: ${result.cwd || sessionDisplayName(result)}`,
			focus ? `User focus: ${focus}` : "Focus on facts needed to continue or reference this previous session.",
		].join("\n"),
		purpose: "session-search",
		signal: signal ?? ctx.signal,
	});
	const title = sessionDisplayName(result);
	const content = [
		`## Session Search Context: ${title}`,
		`**Date:** ${result.modified.toISOString()} | **File:** ${result.path}`,
		focus ? `**Focus:** ${focus}` : undefined,
		"",
		summary.summary,
	].filter((line): line is string => line !== undefined).join("\n");
	return {
		content,
		details: {
			file: result.path,
			focus,
			model: summary.model,
			project: result.cwd || title,
			source: "pi-qol-session-search",
			via: summary.via,
		},
	};
}

export async function buildSessionSearchContextMessageWithLoader(ctx: ExtensionContext, result: QolSessionSearchResult, customPrompt: string | undefined, actionLabel: string): Promise<QolSessionSearchPendingMessage> {
	const title = sessionDisplayName(result);
	if (!ctx.hasUI) return buildSessionSearchContextMessage(ctx, result, customPrompt);
	ctx.ui.setStatus(SESSION_SEARCH_STATUS_KEY, `Summarizing ${title}...`);
	const releaseModalLock = acquireVstackModalLock();
	let failure: unknown;
	try {
		const message = await ctx.ui.custom<QolSessionSearchPendingMessage | null>((tui: any, theme: any, _kb: any, done: (value: QolSessionSearchPendingMessage | null) => void) => {
			let closed = false;
			const loader = new QolSessionSearchLoadingComponent(tui, theme, actionLabel, "Summarizing session context...", (value) => {
				if (closed) return;
				closed = true;
				done(value);
			});
			const finish = (value: QolSessionSearchPendingMessage | null) => {
				if (closed) return;
				closed = true;
				loader.dispose();
				done(value);
			};
			buildSessionSearchContextMessage(ctx, result, customPrompt, loader.signal)
				.then(finish)
				.catch((error) => {
					if (!loader.signal?.aborted) failure = error;
					finish(null);
				});
			return loader;
		}, {
			overlay: true,
			overlayOptions: {
				anchor: "center",
				width: Math.max(56, Math.min(92, Math.floor(settingNumber("sessionSearch.overlayWidth", 104, ctx.cwd) * 0.75))),
				maxHeight: "70%",
			},
		});
		if (failure) throw failure;
		if (!message) throw new Error("Session context summary cancelled");
		return message;
	} finally {
		releaseModalLock();
		ctx.ui.setStatus(SESSION_SEARCH_STATUS_KEY, undefined);
	}
}

export async function injectSessionSearchContext(pi: ExtensionAPI, ctx: ExtensionContext, result: QolSessionSearchResult, customPrompt?: string): Promise<void> {
	const title = sessionDisplayName(result);
	const message = await buildSessionSearchContextMessageWithLoader(ctx, result, customPrompt, "Inject + Context");
	pi.sendMessage({ customType: SESSION_SEARCH_CONTEXT_TYPE, content: message.content, details: message.details, display: true }, { deliverAs: "followUp", triggerTurn: false });
	ctx.ui.notify(`Session context injected: ${title}`, "info");
}

export function renderSessionSearchContextMessage(message: any, options: any, theme: Theme): Text {
	const raw = typeof message.content === "string"
		? message.content
		: Array.isArray(message.content)
			? message.content.map((part: any) => part?.type === "text" ? part.text ?? "" : "").join("")
			: "";
	const title = raw.match(/^## Session Search Context:\s*(.+)$/m)?.[1]?.trim() || "session";
	const date = raw.match(/\*\*Date:\*\*\s*([^|\n]+)/)?.[1]?.trim() || "";
	const header = `${theme.fg("customMessageLabel", theme.bold("Session context: "))}${theme.fg("accent", title)}${date ? theme.fg("muted", ` (${date})`) : ""}`;
	if (!options?.expanded) return new Text(`${header}${theme.fg("dim", "  ctrl+o to expand")}`, 0, 0);
	const body = raw.slice(raw.indexOf("\n") + 1).trim();
	return new Text(body ? `${header}\n\n${body}` : header, 0, 0);
}
