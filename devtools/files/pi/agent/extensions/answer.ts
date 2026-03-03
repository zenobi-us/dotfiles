/**
 * Q&A extraction hook - extracts questions from assistant responses
 *
 * Custom interactive TUI for answering questions.
 *
 * Demonstrates the "prompt generator" pattern with custom TUI:
 * 1. /answer command gets the last assistant message
 * 2. Shows a spinner while extracting questions as structured JSON
 * 3. Presents an interactive TUI to navigate and answer questions
 * 4. Submits the compiled answers when done
 */

import { complete, type Model, type Api, type UserMessage } from "@mariozechner/pi-ai";
import { Type } from "@sinclair/typebox";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { BorderedLoader } from "@mariozechner/pi-coding-agent";
import {
	type Component,
	Editor,
	type EditorTheme,
	Key,
	matchesKey,
	truncateToWidth,
	type TUI,
	visibleWidth,
	wrapTextWithAnsi,
} from "@mariozechner/pi-tui";

// Structured output format for question extraction
interface ExtractedQuestion {
	question: string;
	context?: string;
}

interface ExtractionResult {
	questions: ExtractedQuestion[];
}

const SYSTEM_PROMPT = `You are a question extractor. Given text from a conversation, extract any questions that need answering.

Output a JSON object with this structure:
{
  "questions": [
    {
      "question": "The question text",
      "context": "Optional context that helps answer the question"
    }
  ]
}

Rules:
- Extract all questions that require user input
- Keep questions in the order they appeared
- Be concise with question text
- Include context only when it provides essential information for answering
- If no questions are found, return {"questions": []}

Example output:
{
  "questions": [
    {
      "question": "What is your preferred database?",
      "context": "We can only configure MySQL and PostgreSQL because of what is implemented."
    },
    {
      "question": "Should we use TypeScript or JavaScript?"
    }
  ]
}`;

/** Maximum output cost per million tokens for extraction models */
const DEFAULT_MAX_OUTPUT_COST = 1.0;

interface ModelInfo {
	id: string;
	provider: string;
	cost: {
		input: number;
		output: number;
		cacheRead: number;
		cacheWrite: number;
	};
}

interface ModelSelection {
	model: Model<Api>;
	modelId: string;
	source: "auto" | "fallback";
	cost: ModelInfo["cost"] | null;
}

/**
 * Calculate cost score for model comparison.
 * Higher score = more expensive.
 * Models with $0/$0 pricing (request-based) get deprioritized.
 */
function calculateCostScore(model: ModelInfo): number {
	const { input, output } = model.cost;
	if (input === 0 && output === 0) {
		return Number.MAX_SAFE_INTEGER;
	}
	return input + output * 2;
}

/**
 * Check if a model name suggests it's a cheap/lite variant.
 */
function isCheapModelName(id: string): boolean {
	return /(mini|flash|nano|haiku|lite|micro|free)/i.test(id);
}

/**
 * Select the cheapest available model for question extraction.
 *
 * Strategy (mirrors cheap-commits):
 *  1. Token-based models under the cost threshold, sorted by cost
 *  2. Token-based models with cheap-sounding names
 *  3. Any token-based model (cheapest)
 *  4. Request-based models ($0/$0)
 *  5. Current model as last resort
 */
async function selectExtractionModel(
	currentModel: Model<Api>,
	modelRegistry: {
		find: (provider: string, modelId: string) => Model<Api> | undefined;
		getApiKey: (model: Model<Api>) => Promise<string | undefined>;
		getAvailable: () => Promise<ModelInfo[]>;
	},
): Promise<ModelSelection> {
	const available = await modelRegistry.getAvailable();

	if (available.length === 0) {
		return { model: currentModel, modelId: currentModel.id, source: "fallback", cost: null };
	}

	const tokenBased = available.filter((m) => !(m.cost.input === 0 && m.cost.output === 0));

	// Tier 1: token-based models under the cost threshold
	const cheapModels = tokenBased
		.filter((m) => m.cost.output <= DEFAULT_MAX_OUTPUT_COST)
		.sort((a, b) => calculateCostScore(a) - calculateCostScore(b));

	// Tier 2: cheap-sounding names
	const cheapNamed = tokenBased
		.filter((m) => isCheapModelName(m.id))
		.sort((a, b) => calculateCostScore(a) - calculateCostScore(b));

	// Tier 3: any token-based (cheapest)
	const anyTokenBased = [...tokenBased].sort((a, b) => calculateCostScore(a) - calculateCostScore(b));

	// Tier 4: request-based ($0/$0)
	const requestBased = available
		.filter((m) => m.cost.input === 0 && m.cost.output === 0)
		.sort((a, b) => a.id.localeCompare(b.id));

	const candidates = [cheapModels, cheapNamed, anyTokenBased, requestBased];

	for (const tier of candidates) {
		if (tier.length === 0) continue;
		const best = tier[0];
		const found = modelRegistry.find(best.provider, best.id);
		if (found) {
			const apiKey = await modelRegistry.getApiKey(found);
			if (apiKey) {
				return {
					model: found,
					modelId: `${best.provider}/${best.id}`,
					source: "auto",
					cost: best.cost,
				};
			}
		}
	}

	return { model: currentModel, modelId: currentModel.id, source: "fallback", cost: null };
}

/**
 * Parse the JSON response from the LLM.
 * Handles raw JSON, markdown code blocks, and JSON embedded in prose.
 */
function parseExtractionResult(text: string): ExtractionResult | null {
	try {
		let jsonStr = text;

		// Try markdown code block first
		const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
		if (jsonMatch) {
			jsonStr = jsonMatch[1].trim();
		} else {
			// Try to extract JSON object from surrounding prose
			const braceStart = text.indexOf("{");
			const braceEnd = text.lastIndexOf("}");
			if (braceStart !== -1 && braceEnd > braceStart) {
				jsonStr = text.slice(braceStart, braceEnd + 1);
			}
		}

		const parsed = JSON.parse(jsonStr);
		if (parsed && Array.isArray(parsed.questions)) {
			return parsed as ExtractionResult;
		}
		return null;
	} catch {
		return null;
	}
}

const ANSWER_TOOL_PARAMS = Type.Object({
	text: Type.Optional(
		Type.String({
			description:
				"Text to extract questions from. If omitted, the tool uses the last completed assistant message in the current branch.",
		}),
	),
});

type ExtractionInputSource = "provided" | "last_assistant";

function resolveExtractionInput(
	ctx: ExtensionContext,
	text?: string,
): { text: string; source: ExtractionInputSource } | { error: string } {
	const provided = text?.trim();
	if (provided) {
		return { text: provided, source: "provided" };
	}

	const branch = ctx.sessionManager.getBranch();
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type !== "message") {
			continue;
		}

		const msg = entry.message;
		if (!("role" in msg) || msg.role !== "assistant") {
			continue;
		}

		if (msg.stopReason !== "stop") {
			return { error: `Last assistant message incomplete (${msg.stopReason})` };
		}

		const textParts = msg.content
			.filter((c): c is { type: "text"; text: string } => c.type === "text")
			.map((c) => c.text)
			.filter(Boolean);

		if (textParts.length > 0) {
			return { text: textParts.join("\n"), source: "last_assistant" };
		}
	}

	return { error: "No assistant messages found" };
}

async function extractQuestions(
	ctx: ExtensionContext,
	sourceText: string,
	extractionModel: Model<Api>,
	signal?: AbortSignal,
): Promise<{ questions?: ExtractedQuestion[]; cancelled?: boolean; error?: string }> {
	try {
		const apiKey = await ctx.modelRegistry.getApiKey(extractionModel);
		if (!apiKey) {
			return { error: `No API key configured for ${extractionModel.id}` };
		}

		const userMessage: UserMessage = {
			role: "user",
			content: [{ type: "text", text: sourceText }],
			timestamp: Date.now(),
		};

		const response = await complete(
			extractionModel,
			{ systemPrompt: SYSTEM_PROMPT, messages: [userMessage] },
			{ apiKey, signal },
		);

		if (response.stopReason === "aborted") {
			return { cancelled: true };
		}

		const responseText = response.content
			.filter((c): c is { type: "text"; text: string } => c.type === "text")
			.map((c) => c.text)
			.join("\n");

		const parsed = parseExtractionResult(responseText);
		if (!parsed) {
			return { error: "Question extraction returned invalid JSON" };
		}

		return { questions: parsed.questions };
	} catch (error) {
		if (signal?.aborted) {
			return { cancelled: true };
		}
		const message = error instanceof Error ? error.message : String(error);
		return { error: `Question extraction failed: ${message}` };
	}
}

function formatQuestionsForTool(questions: ExtractedQuestion[]): string {
	if (questions.length === 0) {
		return "No questions found.";
	}

	const lines = ["Extracted questions:"];
	for (let i = 0; i < questions.length; i++) {
		const q = questions[i];
		lines.push(`${i + 1}. ${q.question}`);
		if (q.context) {
			lines.push(`   Context: ${q.context}`);
		}
	}
	return lines.join("\n");
}

/**
 * Interactive Q&A component for answering extracted questions
 */
class QnAComponent implements Component {
	private questions: ExtractedQuestion[];
	private answers: string[];
	private currentIndex: number = 0;
	private editor: Editor;
	private tui: TUI;
	private onDone: (result: string | null) => void;
	private showingConfirmation: boolean = false;

	// Cache
	private cachedWidth?: number;
	private cachedLines?: string[];

	// Colors - using proper reset sequences
	private dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
	private bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
	private cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
	private green = (s: string) => `\x1b[32m${s}\x1b[0m`;
	private yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
	private gray = (s: string) => `\x1b[90m${s}\x1b[0m`;

	constructor(
		questions: ExtractedQuestion[],
		tui: TUI,
		onDone: (result: string | null) => void,
	) {
		this.questions = questions;
		this.answers = questions.map(() => "");
		this.tui = tui;
		this.onDone = onDone;

		// Create a minimal theme for the editor
		const editorTheme: EditorTheme = {
			borderColor: this.dim,
			selectList: {
				selectedBg: (s: string) => `\x1b[44m${s}\x1b[0m`,
				matchHighlight: this.cyan,
				itemSecondary: this.gray,
			},
		};

		this.editor = new Editor(tui, editorTheme);
		// Disable the editor's built-in submit (which clears the editor)
		// We'll handle Enter ourselves to preserve the text
		this.editor.disableSubmit = true;
		this.editor.onChange = () => {
			this.invalidate();
			this.tui.requestRender();
		};
	}

	private allQuestionsAnswered(): boolean {
		this.saveCurrentAnswer();
		return this.answers.every((a) => (a?.trim() || "").length > 0);
	}

	private saveCurrentAnswer(): void {
		this.answers[this.currentIndex] = this.editor.getText();
	}

	private navigateTo(index: number): void {
		if (index < 0 || index >= this.questions.length) return;
		this.saveCurrentAnswer();
		this.currentIndex = index;
		this.editor.setText(this.answers[index] || "");
		this.invalidate();
	}

	private submit(): void {
		this.saveCurrentAnswer();

		// Build the response text
		const parts: string[] = [];
		for (let i = 0; i < this.questions.length; i++) {
			const q = this.questions[i];
			const a = this.answers[i]?.trim() || "(no answer)";
			parts.push(`Q: ${q.question}`);
			if (q.context) {
				parts.push(`> ${q.context}`);
			}
			parts.push(`A: ${a}`);
			parts.push("");
		}

		this.onDone(parts.join("\n").trim());
	}

	private cancel(): void {
		this.onDone(null);
	}

	invalidate(): void {
		this.cachedWidth = undefined;
		this.cachedLines = undefined;
	}

	handleInput(data: string): void {
		// Handle confirmation dialog
		if (this.showingConfirmation) {
			if (matchesKey(data, Key.enter) || data.toLowerCase() === "y") {
				this.submit();
				return;
			}
			if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c")) || data.toLowerCase() === "n") {
				this.showingConfirmation = false;
				this.invalidate();
				this.tui.requestRender();
				return;
			}
			return;
		}

		// Global navigation and commands
		if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"))) {
			this.cancel();
			return;
		}

		// Tab / Shift+Tab for navigation
		if (matchesKey(data, Key.tab)) {
			if (this.currentIndex < this.questions.length - 1) {
				this.navigateTo(this.currentIndex + 1);
				this.tui.requestRender();
			}
			return;
		}
		if (matchesKey(data, Key.shift("tab"))) {
			if (this.currentIndex > 0) {
				this.navigateTo(this.currentIndex - 1);
				this.tui.requestRender();
			}
			return;
		}

		// Arrow up/down for question navigation when editor is empty
		// (Editor handles its own cursor navigation when there's content)
		if (matchesKey(data, Key.up) && this.editor.getText() === "") {
			if (this.currentIndex > 0) {
				this.navigateTo(this.currentIndex - 1);
				this.tui.requestRender();
				return;
			}
		}
		if (matchesKey(data, Key.down) && this.editor.getText() === "") {
			if (this.currentIndex < this.questions.length - 1) {
				this.navigateTo(this.currentIndex + 1);
				this.tui.requestRender();
				return;
			}
		}

		// Handle Enter ourselves (editor's submit is disabled)
		// Plain Enter moves to next question or shows confirmation on last question
		// Shift+Enter adds a newline (handled by editor)
		if (matchesKey(data, Key.enter) && !matchesKey(data, Key.shift("enter"))) {
			this.saveCurrentAnswer();
			if (this.currentIndex < this.questions.length - 1) {
				this.navigateTo(this.currentIndex + 1);
			} else {
				// On last question - show confirmation
				this.showingConfirmation = true;
			}
			this.invalidate();
			this.tui.requestRender();
			return;
		}

		// Pass to editor
		this.editor.handleInput(data);
		this.invalidate();
		this.tui.requestRender();
	}

	render(width: number): string[] {
		if (this.cachedLines && this.cachedWidth === width) {
			return this.cachedLines;
		}

		const lines: string[] = [];
		const boxWidth = Math.min(width - 4, 120); // Allow wider box
		const contentWidth = boxWidth - 4; // 2 chars padding on each side

		// Helper to create horizontal lines (dim the whole thing at once)
		const horizontalLine = (count: number) => "─".repeat(count);

		// Helper to create a box line
		const boxLine = (content: string, leftPad: number = 2): string => {
			const paddedContent = " ".repeat(leftPad) + content;
			const contentLen = visibleWidth(paddedContent);
			const rightPad = Math.max(0, boxWidth - contentLen - 2);
			return this.dim("│") + paddedContent + " ".repeat(rightPad) + this.dim("│");
		};

		const emptyBoxLine = (): string => {
			return this.dim("│") + " ".repeat(boxWidth - 2) + this.dim("│");
		};

		const padToWidth = (line: string): string => {
			const len = visibleWidth(line);
			return line + " ".repeat(Math.max(0, width - len));
		};

		// Title
		lines.push(padToWidth(this.dim("╭" + horizontalLine(boxWidth - 2) + "╮")));
		const title = `${this.bold(this.cyan("Questions"))} ${this.dim(`(${this.currentIndex + 1}/${this.questions.length})`)}`;
		lines.push(padToWidth(boxLine(title)));
		lines.push(padToWidth(this.dim("├" + horizontalLine(boxWidth - 2) + "┤")));

		// Progress indicator
		const progressParts: string[] = [];
		for (let i = 0; i < this.questions.length; i++) {
			const answered = (this.answers[i]?.trim() || "").length > 0;
			const current = i === this.currentIndex;
			if (current) {
				progressParts.push(this.cyan("●"));
			} else if (answered) {
				progressParts.push(this.green("●"));
			} else {
				progressParts.push(this.dim("○"));
			}
		}
		lines.push(padToWidth(boxLine(progressParts.join(" "))));
		lines.push(padToWidth(emptyBoxLine()));

		// Current question
		const q = this.questions[this.currentIndex];
		const questionText = `${this.bold("Q:")} ${q.question}`;
		const wrappedQuestion = wrapTextWithAnsi(questionText, contentWidth);
		for (const line of wrappedQuestion) {
			lines.push(padToWidth(boxLine(line)));
		}

		// Context if present
		if (q.context) {
			lines.push(padToWidth(emptyBoxLine()));
			const contextText = this.gray(`> ${q.context}`);
			const wrappedContext = wrapTextWithAnsi(contextText, contentWidth - 2);
			for (const line of wrappedContext) {
				lines.push(padToWidth(boxLine(line)));
			}
		}

		lines.push(padToWidth(emptyBoxLine()));

		// Render the editor component (multi-line input) with padding
		// Skip the first and last lines (editor's own border lines)
		const answerPrefix = this.bold("A: ");
		const editorWidth = contentWidth - 4 - 3; // Extra padding + space for "A: "
		const editorLines = this.editor.render(editorWidth);
		for (let i = 1; i < editorLines.length - 1; i++) {
			if (i === 1) {
				// First content line gets the "A: " prefix
				lines.push(padToWidth(boxLine(answerPrefix + editorLines[i])));
			} else {
				// Subsequent lines get padding to align with the first line
				lines.push(padToWidth(boxLine("   " + editorLines[i])));
			}
		}

		lines.push(padToWidth(emptyBoxLine()));

		// Confirmation dialog or footer with controls
		if (this.showingConfirmation) {
			lines.push(padToWidth(this.dim("├" + horizontalLine(boxWidth - 2) + "┤")));
			const confirmMsg = `${this.yellow("Submit all answers?")} ${this.dim("(Enter/y to confirm, Esc/n to cancel)")}`;
			lines.push(padToWidth(boxLine(truncateToWidth(confirmMsg, contentWidth))));
		} else {
			lines.push(padToWidth(this.dim("├" + horizontalLine(boxWidth - 2) + "┤")));
			const controls = `${this.dim("Tab/Enter")} next · ${this.dim("Shift+Tab")} prev · ${this.dim("Shift+Enter")} newline · ${this.dim("Esc")} cancel`;
			lines.push(padToWidth(boxLine(truncateToWidth(controls, contentWidth))));
		}
		lines.push(padToWidth(this.dim("╰" + horizontalLine(boxWidth - 2) + "╯")));

		this.cachedWidth = width;
		this.cachedLines = lines;
		return lines;
	}
}

export default function (pi: ExtensionAPI) {
	const answerHandler = async (ctx: ExtensionContext) => {
		if (!ctx.hasUI) {
			ctx.ui.notify("answer requires interactive mode", "error");
			return;
		}

		if (!ctx.model) {
			ctx.ui.notify("No model selected", "error");
			return;
		}

		const input = resolveExtractionInput(ctx);
		if ("error" in input) {
			ctx.ui.notify(input.error, "error");
			return;
		}

		const selection = await selectExtractionModel(ctx.model, ctx.modelRegistry);
		type InteractiveExtractionOutcome =
			| { status: "ok"; questions: ExtractedQuestion[] }
			| { status: "cancelled" }
			| { status: "error"; message: string };

		const extractionOutcome = await ctx.ui.custom<InteractiveExtractionOutcome>((tui, theme, _kb, done) => {
			const sourceLabel = selection.source === "auto" ? "auto" : "fallback";
			const loader = new BorderedLoader(tui, theme, `Extracting questions using ${selection.modelId} [${sourceLabel}]...`);
			let settled = false;
			const finish = (result: InteractiveExtractionOutcome) => {
				if (settled) {
					return;
				}
				settled = true;
				done(result);
			};

			loader.onAbort = () => finish({ status: "cancelled" });

			void extractQuestions(ctx, input.text, selection.model, loader.signal)
				.then((result) => {
					if (result.cancelled) {
						finish({ status: "cancelled" });
						return;
					}
					if (result.error) {
						finish({ status: "error", message: result.error });
						return;
					}
					finish({ status: "ok", questions: result.questions ?? [] });
				})
				.catch((error) => {
					const message = error instanceof Error ? error.message : String(error);
					finish({ status: "error", message: `Question extraction failed: ${message}` });
				});

			return loader;
		});

		if (extractionOutcome.status === "cancelled") {
			ctx.ui.notify("Cancelled", "info");
			return;
		}

		if (extractionOutcome.status === "error") {
			ctx.ui.notify(extractionOutcome.message, "error");
			return;
		}

		if (extractionOutcome.questions.length === 0) {
			ctx.ui.notify("No questions found in the last message", "info");
			return;
		}

		const answersResult = await ctx.ui.custom<string | null>((tui, _theme, _kb, done) => {
			return new QnAComponent(extractionOutcome.questions, tui, done);
		});

		if (answersResult === null) {
			ctx.ui.notify("Cancelled", "info");
			return;
		}

		pi.sendMessage(
			{
				customType: "answers",
				content: "I answered your questions in the following way:\n\n" + answersResult,
				display: true,
			},
			{ triggerTurn: true },
		);
	};

	pi.registerTool({
		name: "answer",
		label: "Answer",
		description:
			"Extract questions that need user input from supplied text or, if omitted, from the last completed assistant message on the current branch.",
		parameters: ANSWER_TOOL_PARAMS,
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			if (!ctx.model) {
				return {
					content: [{ type: "text", text: "No model selected" }],
					details: { error: "no_model" },
					isError: true,
				};
			}

			const input = resolveExtractionInput(ctx, params.text);
			if ("error" in input) {
				return {
					content: [{ type: "text", text: input.error }],
					details: { error: "no_input" },
					isError: true,
				};
			}

			const selection = await selectExtractionModel(ctx.model, ctx.modelRegistry);
			const extraction = await extractQuestions(ctx, input.text, selection.model, signal);

			if (extraction.cancelled) {
				return {
					content: [{ type: "text", text: "Cancelled" }],
					details: {
						cancelled: true,
						modelId: selection.modelId,
						modelSource: selection.source,
						source: input.source,
					},
				};
			}

			if (extraction.error) {
				return {
					content: [{ type: "text", text: extraction.error }],
					details: {
						error: extraction.error,
						modelId: selection.modelId,
						modelSource: selection.source,
						source: input.source,
					},
					isError: true,
				};
			}

			const questions = extraction.questions ?? [];
			return {
				content: [{ type: "text", text: formatQuestionsForTool(questions) }],
				details: {
					questions,
					questionCount: questions.length,
					modelId: selection.modelId,
					modelSource: selection.source,
					source: input.source,
				},
			};
		},
	});

	pi.registerCommand("answer", {
		description: "Extract questions from last assistant message into interactive Q&A",
		handler: (_args, ctx) => answerHandler(ctx),
	});

	pi.registerShortcut("ctrl+.", {
		description: "Extract and answer questions",
		handler: answerHandler,
	});
}
