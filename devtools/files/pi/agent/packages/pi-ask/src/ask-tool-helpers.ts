import {
	type ExtensionContext,
	getMarkdownTheme,
	keyText,
} from "@earendil-works/pi-coding-agent";
import {
	type Component,
	Container,
	Markdown,
	type MarkdownTheme,
	Spacer,
	Text,
	truncateToWidth,
} from "@earendil-works/pi-tui";
import { UI_DIMENSIONS } from "./constants/ui.ts";
import { renderResultText } from "./result.ts";
import { createInitialState } from "./state/create.ts";
import { collectValidationIssues } from "./state/normalize.ts";
import { summarizeResult, toAskResult } from "./state/result.ts";
import type { AskParams, AskResult, AskValidationIssue } from "./types.ts";

export const ASK_TOOL_DESCRIPTION =
	"Interactive clarification tool for cases where the next step depends on user preferences, missing requirements, or choosing between multiple valid directions. Ask a short structured interview, collect normalized answers, and continue using those answers explicitly instead of guessing. Supports single-select, multi-select, and preview-pane questions. Always include a machine-readable `value` for every option. Use `preview` only when every option includes `preview` text; descriptions alone are not enough.";

export const ASK_TOOL_PROMPT_GUIDELINES = [
	"Use `ask_user` before making preference-sensitive decisions about scope, tone, UX, naming, architecture, docs, or implementation direction.",
	"When multiple valid directions exist, call `ask_user` with 1-3 concise questions instead of committing to one path on your own.",
	"When calling `ask_user`, prefer one focused decision per question. Use short labels. Provide clear, distinct options. Do not add filler options.",
	"When calling `ask_user`, always include a non-empty machine-readable `value` for every option.",
	"When calling `ask_user`, choose question `type` from the question semantics: `single` means one answer is expected, `multi` means multiple answers could reasonably be selected, and `preview` means options need preview-pane detail.",
	'When calling `ask_user`, use `type: "preview"` only when every option includes non-empty `preview` text. Option descriptions do not satisfy this requirement.',
	"After an `ask_user` elaboration or follow-up note, prefer another structured `ask_user` follow-up if a choice is still needed instead of switching to plain-text multiple choice in chat.",
	"When prior `ask_user` answers narrow the branch, bundle the next 2-3 related unresolved decisions into one follow-up `ask_user` call when possible.",
	"Use one-at-a-time `ask_user` follow-up calls only when the next question materially depends on the previous answer.",
] as const;

interface ValidateParamsOptions {
	allowFreeform?: boolean;
	presentSingleAsMulti?: boolean;
}

export function validateParams(
	params: AskParams,
	options: ValidateParamsOptions = {},
):
	| { ok: true; state: ReturnType<typeof createInitialState> }
	| { ok: false; issues: AskValidationIssue[] } {
	const issues = collectValidationIssues(params, options);
	if (issues.length > 0) {
		return { ok: false, issues };
	}

	return {
		ok: true,
		state: createInitialState(params, options),
	};
}

export function invalidPayloadResponse(
	params: AskParams,
	issues: AskValidationIssue[],
) {
	return {
		content: [{ type: "text" as const, text: formatValidationError(issues) }],
		details: errorResultDetails(params, issues),
	};
}

export function nonInteractiveResponse(
	state: ReturnType<typeof createInitialState>,
) {
	return {
		content: [
			{ type: "text" as const, text: formatNonInteractiveMessage(state) },
		],
		details: {
			...toAskResult(state),
			cancelled: true,
		},
	};
}

export function successfulResponse(result: AskResult) {
	return {
		content: [{ type: "text" as const, text: summarizeResult(result) }],
		details: result,
	};
}

type ToolTheme = ExtensionContext["ui"]["theme"];
type ToolStatusTone = "error" | "muted" | "success" | "warning";
type ToolRenderContext = { args?: unknown; isPartial?: boolean };
type ToolRenderOptions = { expanded?: boolean; isPartial?: boolean };
type UnknownRecord = Record<string, unknown>;

interface ToolStatusLineOptions {
	context?: string;
	expandable?: boolean;
	item: string;
	status: string;
	tone?: ToolStatusTone;
}

export function renderAskToolCall(
	args: unknown,
	theme: ToolTheme,
	context?: ToolRenderContext,
) {
	if (context?.isPartial === false) {
		return new Container();
	}

	return renderToolStatusLine(theme, {
		context: formatQuestionCount(getQuestions(args).length),
		item: getAskSubject(args),
		status: "Waiting",
		tone: "warning",
	});
}

export function renderAskToolResult(
	result: {
		content: Array<{ type?: string; text?: string }>;
		details?: AskResult;
	},
	options: ToolRenderOptions,
	theme: ToolTheme,
	context?: ToolRenderContext,
) {
	if (options.isPartial) {
		return new Container();
	}

	const content = getTextContent(result.content);
	const details = isRecord(result.details) ? result.details : undefined;
	const source = details ?? context?.args;
	const body = buildExpandedResultMarkdown(details, content);
	const expanded = options.expanded === true;
	const status = getResultStatus(details, content);
	const container = new Container();

	container.addChild(
		renderToolStatusLine(theme, {
			context: getResultContext(details),
			expandable: !expanded && body.length > 0,
			item: getAskSubject(source),
			status: status.label,
			tone: status.tone,
		}),
	);

	if (expanded && body) {
		container.addChild(new Spacer(1));
		container.addChild(renderMarkdownSafely(body, getMarkdownTheme()));
	}

	return container;
}

function renderToolStatusLine(
	theme: ToolTheme,
	options: ToolStatusLineOptions,
): Text {
	const separator = theme.fg("dim", " · ");
	const parts = [
		theme.fg("toolTitle", theme.bold("• Ask User")) +
			" " +
			theme.fg("accent", `\`${options.item}\``),
		theme.fg(options.tone ?? "muted", options.status),
	];

	if (options.context) {
		parts.push(theme.fg("muted", options.context));
	}
	if (options.expandable) {
		const shortcut = keyText("app.tools.expand").trim();
		parts.push(theme.fg("muted", shortcut ? `${shortcut} expand` : "expand"));
	}

	return new Text(parts.join(separator), 0, 0);
}

function renderMarkdownSafely(
	text: string,
	markdownTheme: MarkdownTheme,
): Component {
	const fallback = new Text(text, 0, 0);
	let markdown: Markdown;

	try {
		markdown = new Markdown(text, 0, 0, markdownTheme);
	} catch {
		return fallback;
	}

	return {
		render(width) {
			try {
				return markdown.render(width);
			} catch {
				return fallback.render(width);
			}
		},
		invalidate() {
			markdown.invalidate();
			fallback.invalidate();
		},
	};
}

function getResultStatus(
	details: UnknownRecord | undefined,
	content: string,
): { label: string; tone: ToolStatusTone } {
	if (!details) {
		return { label: "Result Unavailable", tone: "error" };
	}
	if (isRecord(details.error)) {
		return { label: "Invalid Input", tone: "error" };
	}
	if (content.startsWith("Needs user input:")) {
		return { label: "Needs TUI", tone: "warning" };
	}
	if (details.cancelled === true) {
		return { label: "Cancelled", tone: "warning" };
	}
	if (details.mode === "elaborate") {
		return { label: "Needs Clarification", tone: "warning" };
	}
	return { label: "Submitted", tone: "success" };
}

function getResultContext(
	details: UnknownRecord | undefined,
): string | undefined {
	if (!details) {
		return;
	}

	const questions = getQuestions(details);
	if (isRecord(details.error)) {
		const issues = Array.isArray(details.error.issues)
			? details.error.issues.filter(isRecord).length
			: 0;
		return issues > 0 ? `${issues} issue${issues === 1 ? "" : "s"}` : undefined;
	}
	if (details.mode === "elaborate" && isRecord(details.elaboration)) {
		const items = Array.isArray(details.elaboration.items)
			? details.elaboration.items.filter(isRecord).length
			: 0;
		if (items > 0) {
			return `${items} item${items === 1 ? "" : "s"}`;
		}
	}

	return `${countAnswers(details.answers)}/${questions.length} answered`;
}

function getAskSubject(value: unknown): string {
	const record = isRecord(value) ? value : undefined;
	const title = typeof record?.title === "string" ? record.title.trim() : "";
	if (title) {
		return truncateToWidth(title, UI_DIMENSIONS.callLabelTruncateWidth);
	}

	const labels = getQuestions(value)
		.map((question, index) => {
			const label =
				typeof question.label === "string" ? question.label.trim() : "";
			return label || `Q${index + 1}`;
		})
		.join(", ");

	return labels
		? truncateToWidth(labels, UI_DIMENSIONS.callLabelTruncateWidth)
		: "Clarification";
}

function getQuestions(value: unknown): UnknownRecord[] {
	if (!isRecord(value) || !Array.isArray(value.questions)) {
		return [];
	}
	return value.questions.filter(isRecord);
}

function countAnswers(value: unknown): number {
	if (!isRecord(value)) {
		return 0;
	}
	return Object.values(value).filter((answer) => {
		if (!isRecord(answer)) {
			return false;
		}
		const labels = Array.isArray(answer.labels)
			? answer.labels.filter(
					(label) => typeof label === "string" && label.trim(),
				)
			: [];
		return (
			labels.length > 0 ||
			(typeof answer.customText === "string" &&
				answer.customText.trim().length > 0)
		);
	}).length;
}

function formatQuestionCount(count: number): string {
	return `${count} question${count === 1 ? "" : "s"}`;
}

function buildExpandedResultMarkdown(
	details: UnknownRecord | undefined,
	content: string,
): string {
	if (!details) {
		return formatResultTextAsMarkdown(content);
	}
	if (isRecord(details.error) || content.startsWith("Needs user input:")) {
		return content.trim();
	}
	if (details.mode !== "elaborate" && countAnswers(details.answers) === 0) {
		return "";
	}

	try {
		const result = details as unknown as AskResult;
		const renderable =
			details.cancelled === true ? { ...result, cancelled: false } : result;
		return formatResultTextAsMarkdown(renderResultText(renderable));
	} catch {
		return formatResultTextAsMarkdown(content);
	}
}

function formatResultTextAsMarkdown(text: string): string {
	return text
		.trim()
		.split(/\r?\n/)
		.filter((line) => line.trim())
		.map(
			(line) =>
				`${line.startsWith("  ") ? "  " : ""}- ${escapeMarkdownText(line)}`,
		)
		.join("\n");
}

function escapeMarkdownText(value: string): string {
	return value
		.replace(/\r?\n/g, " ")
		.replace(/([\\`*_[\]])/g, "\\$1")
		.trim();
}

function getTextContent(
	content: Array<{ type?: string; text?: string }>,
): string {
	const text = content.find((part) => part.type === "text");
	return typeof text?.text === "string" ? text.text : "";
}

function isRecord(value: unknown): value is UnknownRecord {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

function errorResultDetails(
	params: AskParams,
	issues: AskValidationIssue[],
): AskResult {
	return {
		title: params.title,
		cancelled: true,
		mode: "submit",
		questions: [],
		answers: {},
		error: {
			kind: "invalid_input",
			issues,
		},
	};
}

function formatValidationError(issues: AskValidationIssue[]): string {
	return [
		"Invalid ask_user payload:",
		...issues.map((issue) => `- ${issue.path}: ${issue.message}`),
	].join("\n");
}

function formatNonInteractiveMessage(
	state: ReturnType<typeof createInitialState>,
): string {
	const lines = [
		"Needs user input: ask_user requires interactive TUI mode.",
		"Run same tool call in interactive TUI mode, or ask user these questions manually:",
	];

	for (const [index, question] of state.questions.entries()) {
		lines.push(`${index + 1}. ${question.label}: ${question.prompt}`);
		for (const option of question.options) {
			lines.push(`   - ${option.label} [${option.value}]`);
		}
		lines.push("   - Type your own [custom]");
	}

	lines.push(
		"details.questions contains normalized pending questions. details.answers stays empty until user responds.",
	);
	return lines.join("\n");
}
