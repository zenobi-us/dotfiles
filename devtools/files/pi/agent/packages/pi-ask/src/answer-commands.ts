import {
	BorderedLoader,
	type ExtensionAPI,
	type ExtensionCommandContext,
	type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import {
	extractAskParams,
	selectExtractionModel,
} from "./answer-extraction.ts";
import {
	type AskPayloadSource,
	appendAskPayload,
	findLatestPayloadInCurrentBranch,
} from "./ask-payload-store.ts";
import {
	invalidPayloadResponse,
	successfulResponse,
	validateParams,
} from "./ask-tool-helpers.ts";
import { getAskConfigStore } from "./config/store.ts";
import type { RemoteAskRuntime, RemoteAskSource } from "./remote-ask.ts";
import type { AskParams, AskResult } from "./types.ts";
import { runAskFlow } from "./ui/controller.ts";

interface AssistantTextSource {
	entryId: string;
	text: string;
}

type ExtractionSelection = Exclude<
	Awaited<ReturnType<typeof selectExtractionModel>>,
	{ error: string }
>;

type ExtractionUiResult =
	| { cancelled: true }
	| { error: string }
	| { params: AskParams };

export function registerAnswerCommands(
	pi: ExtensionAPI,
	remoteAsk?: RemoteAskRuntime
): void {
	pi.registerCommand("answer", {
		description:
			"Extract questions from the latest assistant message into an ask form",
		handler: async (_args, ctx) => runAnswerCommand(pi, ctx, remoteAsk),
	});

	pi.registerCommand("answer:again", {
		description: "Reopen the previous /answer form on this branch",
		handler: async (_args, ctx) =>
			runReplayCommand(pi, ctx, {
				missingMessage:
					"No previous /answer form found on this branch; use /answer first.",
				noticePrefix: "Reopening previous /answer form on this branch",
				remoteSource: "answer:again",
				source: "answer-extraction",
				remoteAsk,
			}),
	});

	pi.registerCommand("ask:replay", {
		description: "Replay the previous ask_user form on this branch",
		handler: async (_args, ctx) =>
			runReplayCommand(pi, ctx, {
				missingMessage: "No previous ask_user form found on this branch.",
				noticePrefix: "Replaying previous ask_user form on this branch",
				remoteSource: "ask:replay",
				source: "tool",
				remoteAsk,
			}),
	});
}

async function runAnswerCommand(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	remoteAsk?: RemoteAskRuntime
): Promise<void> {
	if (ctx.mode !== "tui") {
		ctx.ui.notify("/answer requires interactive TUI mode.", "error");
		return;
	}

	const assistant = findLatestAssistantText(ctx);
	if ("error" in assistant) {
		ctx.ui.notify(assistant.error, "error");
		return;
	}

	const config = await getAskConfigStore().getConfig();
	const selected = await selectExtractionModel(
		ctx,
		config.answer.extractionModels
	);
	if ("error" in selected) {
		ctx.ui.notify(selected.error, "error");
		return;
	}
	if (selected.usedFallback) {
		ctx.ui.notify(
			`Configured extraction models unavailable; using current chat model ${selected.model.provider}/${selected.model.id}.`,
			"info"
		);
	}

	const params = await extractAndValidateAnswerParams(
		ctx,
		assistant,
		selected,
		config
	);
	if (!params) {
		return;
	}

	appendAskPayload(pi, {
		params,
		source: "answer-extraction",
		sourceEntryId: assistant.entryId,
	});

	await runAskAndSendSubmittedResult(pi, ctx, params, {
		allowFreeform: true,
		remoteAsk,
		remoteSource: "answer",
	});
}

async function extractAndValidateAnswerParams(
	ctx: ExtensionCommandContext,
	assistant: AssistantTextSource,
	selected: ExtractionSelection,
	config: Awaited<ReturnType<ReturnType<typeof getAskConfigStore>["getConfig"]>>
): Promise<AskParams | undefined> {
	const extraction = await withHiddenWorkingRow(ctx, () =>
		runExtractionUi(ctx, assistant, selected, config)
	);
	if ("cancelled" in extraction) {
		ctx.ui.notify("Question extraction cancelled.", "info");
		return;
	}
	if ("error" in extraction) {
		ctx.ui.notify(formatExtractionError(extraction.error), "error");
		return;
	}
	if (!isAskParamsCandidate(extraction.params)) {
		ctx.ui.notify("Question extraction returned an invalid ask form.", "error");
		return;
	}
	if (extraction.params.questions.length === 0) {
		ctx.ui.notify(
			"No questions found in the latest assistant message.",
			"info"
		);
		return;
	}
	const validation = validateParams(extraction.params, { allowFreeform: true });
	if (!validation.ok) {
		const response = invalidPayloadResponse(
			extraction.params,
			validation.issues
		);
		ctx.ui.notify(response.content[0].text, "error");
		return;
	}
	return extraction.params;
}

function runExtractionUi(
	ctx: ExtensionCommandContext,
	assistant: AssistantTextSource,
	selected: ExtractionSelection,
	config: Awaited<ReturnType<ReturnType<typeof getAskConfigStore>["getConfig"]>>
): Promise<ExtractionUiResult> {
	return ctx.ui.custom<ExtractionUiResult>((tui, theme, _keybindings, done) => {
		let completed = false;
		const doneOnce = (result: ExtractionUiResult) => {
			if (completed) {
				return;
			}
			completed = true;
			done(result);
		};
		const loader = new BorderedLoader(
			tui,
			theme,
			`Extracting questions using ${selected.model.provider}/${selected.model.id}...`
		);
		loader.onAbort = () => doneOnce({ cancelled: true });
		extractAskParams({
			assistantText: assistant.text,
			auth: selected.auth,
			model: selected.model,
			onRetry: (attempt, maxRetries) => {
				ctx.ui.notify(
					`Retrying extraction JSON repair (${attempt}/${maxRetries})...`,
					"info"
				);
			},
			retries: config.answer.extractionRetries,
			signal: loader.signal,
			timeoutMs: config.answer.extractionTimeoutMs,
		})
			.then((params) => doneOnce({ params }))
			.catch((error) => doneOnce({ error: formatErrorMessage(error) }));
		return loader;
	});
}

function formatErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.name ? `${error.name}: ${error.message}` : error.message;
	}
	return String(error);
}

function isAskParamsCandidate(value: unknown): value is AskParams {
	return (
		!!value &&
		typeof value === "object" &&
		Array.isArray((value as { questions?: unknown }).questions)
	);
}

function formatExtractionError(error: string): string {
	if (error.includes("valid JSON")) {
		return error;
	}
	if (error.includes("cancelled")) {
		return "Question extraction cancelled.";
	}
	if (
		error.includes("aborted") ||
		error.includes("AbortError") ||
		error.includes("timed out")
	) {
		return "Question extraction timed out. Try again or configure a faster extraction model.";
	}
	return error;
}

async function runReplayCommand(
	pi: ExtensionAPI,
	ctx: ExtensionCommandContext,
	options: {
		missingMessage: string;
		noticePrefix: string;
		remoteAsk?: RemoteAskRuntime;
		remoteSource: RemoteAskSource;
		source: AskPayloadSource;
	}
): Promise<void> {
	if (ctx.mode !== "tui") {
		ctx.ui.notify("Ask replay requires interactive TUI mode.", "error");
		return;
	}
	const lookup = findLatestPayloadInCurrentBranch(ctx, options.source);
	if (!lookup.data) {
		ctx.ui.notify(
			lookup.invalidMatchFound
				? "Previous form exists on this branch but is no longer compatible."
				: options.missingMessage,
			"info"
		);
		return;
	}
	ctx.ui.notify(
		`${options.noticePrefix}: ${lookup.data.params.questions.length} question(s).`,
		"info"
	);
	await runAskAndSendSubmittedResult(pi, ctx, lookup.data.params, {
		allowFreeform: options.source === "answer-extraction",
		remoteAsk: options.remoteAsk,
		remoteSource: options.remoteSource,
	});
}

async function runAskAndSendSubmittedResult(
	pi: Pick<ExtensionAPI, "sendUserMessage">,
	ctx: ExtensionContext,
	params: AskParams,
	options: {
		allowFreeform: boolean;
		remoteAsk?: RemoteAskRuntime;
		remoteSource: RemoteAskSource;
	}
): Promise<void> {
	const result = await withHiddenWorkingRow(ctx, () =>
		runAskFlow(ctx, params, {
			allowFreeform: options.allowFreeform,
			remote: options.remoteAsk
				? { runtime: options.remoteAsk, source: options.remoteSource }
				: undefined,
		})
	);
	if (result.cancelled) {
		ctx.ui.notify("Ask form cancelled.", "info");
		return;
	}
	sendAskResult(pi, result, ctx);
}

async function withHiddenWorkingRow<T>(
	ctx: ExtensionContext,
	run: () => Promise<T>
): Promise<T> {
	ctx.ui.setWorkingVisible(false);
	try {
		return await run();
	} finally {
		ctx.ui.setWorkingVisible(true);
	}
}

function sendAskResult(
	pi: Pick<ExtensionAPI, "sendUserMessage">,
	result: AskResult,
	ctx: Pick<ExtensionContext, "isIdle">
): void {
	const response = successfulResponse(result);
	const text = response.content[0];
	pi.sendUserMessage(
		text.text,
		ctx.isIdle() ? undefined : { deliverAs: "followUp" }
	);
}

function findLatestAssistantText(
	ctx: Pick<ExtensionContext, "sessionManager">
): AssistantTextSource | { error: string } {
	const branch = ctx.sessionManager.getBranch();
	for (let index = branch.length - 1; index >= 0; index--) {
		const entry = branch[index];
		if (entry.type !== "message") {
			continue;
		}
		const message = entry.message;
		if (!("role" in message) || message.role !== "assistant") {
			continue;
		}
		if (message.stopReason !== "stop") {
			return {
				error: `Latest assistant message is incomplete (${message.stopReason}); wait for it to finish, then run /answer again.`,
			};
		}
		const text = message.content
			.filter(
				(part): part is { text: string; type: "text" } => part.type === "text"
			)
			.map((part) => part.text)
			.join("\n")
			.trim();
		if (text) {
			return { entryId: entry.id, text };
		}
	}
	return { error: "No assistant message found to extract questions from." };
}
