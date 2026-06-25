import {
	type Api,
	complete,
	type Model,
	type UserMessage,
} from "@earendil-works/pi-ai";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AskConfig } from "./config/schema.ts";
import type { AskParams } from "./types.ts";

export const ANSWER_EXTRACTION_SYSTEM_PROMPT = `You extract user-input questions from an assistant message and return ONLY raw JSON.

Return JSON matching this TypeScript shape:
{
  "title"?: string,
  "questions": [
    {
      "id": string,
      "label"?: string,
      "prompt": string,
      "type"?: "single" | "multi" | "preview",
      "required"?: boolean,
      "options": [
        {
          "value": string,
          "label": string,
          "description"?: string,
          "preview"?: string,
          "freeform"?: boolean
        }
      ]
    }
  ]
}

Rules:
- Output raw JSON only. No Markdown. No prose. No code fences.
- Extract questions that require user input.
- Ignore generic conversational or clarification prompts such as "How can I help?", "Could you clarify?", or "Let me know what you need" unless they include concrete choices.
- Extract a question when it has explicit choices or when the user should type their own answer.
- Preserve question order.
- Generate stable snake_case ids.
- Choose question type from the question semantics.
- Use type "single" when one answer is expected.
- Use type "multi" when multiple answers could reasonably be selected.
- Use type "preview" when options need preview-pane detail and every option has non-empty preview text.
- Avoid defaulting mechanically; infer from whether the options are mutually exclusive, can coexist, or need preview-pane detail.
- Each extracted question must have at least one option.
- Options rule:
  - Extract options only from choices explicitly offered by the assistant.
  - If the assistant gives concrete choices, use those choices as normal options.
  - If the assistant gives examples only, do not treat examples as choices unless they are presented as selectable answers.
  - If no concrete choices are given and the user should type their own answer, create exactly one freeform option: {"value":"freeform","label":"Type answer","freeform":true}.
  - Never invent options.
  - Never mix a freeform option with normal options.
- Provide clear, distinct options. Do not add filler options.
- Do not create an option that merely restates the question.
- Include descriptions only when helpful.
- Return {"questions":[]} if no questions are found.`;

interface SelectedExtractionModel {
	auth: { apiKey?: string; headers?: Record<string, string> };
	model: Model<Api>;
	usedFallback: boolean;
}

export async function selectExtractionModel(
	ctx: Pick<ExtensionContext, "model" | "modelRegistry">,
	preferences: AskConfig["answer"]["extractionModels"]
): Promise<SelectedExtractionModel | { error: string }> {
	for (const preference of preferences) {
		const model = ctx.modelRegistry.find(preference.provider, preference.id);
		if (!model) {
			continue;
		}
		const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
		if (auth.ok) {
			return { model, auth, usedFallback: false };
		}
	}

	if (!ctx.model) {
		return {
			error:
				"No available extraction model. Configure answer.extractionModels or select a chat model.",
		};
	}

	const auth = await ctx.modelRegistry.getApiKeyAndHeaders(ctx.model);
	if (!auth.ok) {
		return {
			error: `No auth for fallback chat model: ${ctx.model.provider}/${ctx.model.id}.`,
		};
	}

	return { model: ctx.model, auth, usedFallback: true };
}

export async function extractAskParams(options: {
	assistantText: string;
	model: Model<Api>;
	auth: { apiKey?: string; headers?: Record<string, string> };
	retries: number;
	signal?: AbortSignal;
	timeoutMs: number;
	onRetry?: (attempt: number, maxRetries: number) => void;
}): Promise<AskParams> {
	let lastCandidate: AskParams | undefined;
	let lastResponse = "";
	let lastError = "";
	for (let attempt = 0; attempt <= options.retries; attempt++) {
		if (attempt > 0) {
			options.onRetry?.(attempt, options.retries);
		}
		const responseText = await runExtractionAttempt({
			...options,
			attempt,
			lastError,
			lastResponse,
		});
		lastResponse = responseText;
		const parsed = parseExtractionCandidate(responseText);
		if (!parsed.ok) {
			lastError = parsed.error;
			continue;
		}
		lastCandidate = parsed.params;
		if (parsed.issues.length === 0) {
			return parsed.params;
		}
		lastError = parsed.issues.join("\n");
	}
	if (lastCandidate) {
		return repairExtractionParams(lastCandidate);
	}
	throw new Error(
		"Question extraction did not return valid JSON after retries."
	);
}

async function runExtractionAttempt(options: {
	assistantText: string;
	attempt: number;
	auth: { apiKey?: string; headers?: Record<string, string> };
	lastError: string;
	lastResponse: string;
	model: Model<Api>;
	signal?: AbortSignal;
	timeoutMs: number;
}): Promise<string> {
	const controller = new AbortController();
	let timedOut = false;
	const timeout = setTimeout(() => {
		timedOut = true;
		controller.abort();
	}, options.timeoutMs);
	const abortFromParent = () => controller.abort();
	options.signal?.addEventListener("abort", abortFromParent, { once: true });
	try {
		const userMessage: UserMessage = {
			role: "user",
			content: [
				{
					type: "text",
					text:
						options.attempt === 0
							? options.assistantText
							: formatRetryPrompt(options),
				},
			],
			timestamp: Date.now(),
		};
		const response = await complete(
			options.model,
			{
				systemPrompt: ANSWER_EXTRACTION_SYSTEM_PROMPT,
				messages: [userMessage],
			},
			{
				apiKey: options.auth.apiKey,
				headers: options.auth.headers,
				signal: controller.signal,
			}
		);
		if (response.stopReason === "aborted") {
			throw new Error(
				timedOut
					? "Question extraction timed out. Try again or configure a faster extraction model."
					: "Question extraction cancelled."
			);
		}
		return response.content
			.filter(
				(part): part is { text: string; type: "text" } => part.type === "text"
			)
			.map((part) => part.text)
			.join("\n");
	} finally {
		clearTimeout(timeout);
		options.signal?.removeEventListener("abort", abortFromParent);
	}
}

const MAX_EXTRACTED_OPTIONS_PER_QUESTION = 4;

function parseExtractionCandidate(
	responseText: string
):
	| { ok: true; params: AskParams; issues: string[] }
	| { ok: false; error: string } {
	try {
		const parsed = JSON.parse(responseText.trim()) as unknown;
		if (!isAskParamsLike(parsed)) {
			return { ok: false, error: "root.questions must be an array" };
		}
		return {
			ok: true,
			params: parsed,
			issues: collectExtractionBusinessIssues(parsed),
		};
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

function isAskParamsLike(value: unknown): value is AskParams {
	return (
		!!value &&
		typeof value === "object" &&
		Array.isArray((value as { questions?: unknown }).questions)
	);
}

export function collectExtractionBusinessIssues(params: AskParams): string[] {
	const issues: string[] = [];
	params.questions.forEach((question, questionIndex) => {
		if (isGenericConversationalPrompt(question.prompt)) {
			issues.push(
				`questions[${questionIndex}].prompt is generic conversational text; omit this question unless it includes concrete choices`
			);
		}
		if (question.options.length > MAX_EXTRACTED_OPTIONS_PER_QUESTION) {
			issues.push(
				`questions[${questionIndex}].options has ${question.options.length} items; max is ${MAX_EXTRACTED_OPTIONS_PER_QUESTION}`
			);
		}
		if (
			question.options.length === 1 &&
			optionRestatesQuestion(question.options[0]?.label, question.prompt)
		) {
			issues.push(
				`questions[${questionIndex}].options[0] merely restates the question; omit this question or provide meaningful distinct options`
			);
		}
	});
	return issues;
}

export function repairExtractionParams(params: AskParams): AskParams {
	return {
		...params,
		questions: params.questions
			.filter((question) => !isGenericConversationalPrompt(question.prompt))
			.filter(
				(question) =>
					question.options.length !== 1 ||
					!optionRestatesQuestion(question.options[0]?.label, question.prompt)
			)
			.map((question) => ({
				...question,
				options: capOptionsPreservingOther(question.options),
			})),
	};
}

function capOptionsPreservingOther<T extends { label: string; value: string }>(
	options: T[]
): T[] {
	if (options.length <= MAX_EXTRACTED_OPTIONS_PER_QUESTION) {
		return options;
	}
	const other = options.find((option) => isOtherOption(option));
	if (!other) {
		return options.slice(0, MAX_EXTRACTED_OPTIONS_PER_QUESTION);
	}
	const head = options
		.filter((option) => option !== other)
		.slice(0, MAX_EXTRACTED_OPTIONS_PER_QUESTION - 1);
	return [...head, other];
}

function isOtherOption(option: { label: string; value: string }): boolean {
	const label = normalizeText(option.label);
	const value = normalizeText(option.value);
	return (
		label === "other" || label.includes("something else") || value === "other"
	);
}

function optionRestatesQuestion(
	label: string | undefined,
	prompt: string
): boolean {
	if (!label) {
		return false;
	}
	const normalizedLabel = normalizeText(label);
	const normalizedPrompt = normalizeText(prompt);
	return (
		normalizedLabel.length > 8 &&
		(normalizedPrompt.includes(normalizedLabel) ||
			normalizedLabel.includes(normalizedPrompt))
	);
}

function isGenericConversationalPrompt(prompt: string): boolean {
	const normalized = normalizeText(prompt);
	return [
		"how can i help",
		"could you clarify",
		"let me know what you need",
		"what else is on your mind",
		"anything on your mind i can help with",
	].some((phrase) => normalized.includes(phrase));
}

function normalizeText(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

function formatRetryPrompt(options: {
	assistantText: string;
	lastError: string;
	lastResponse: string;
}): string {
	return `Your previous response was not valid raw JSON.

JSON.parse error:
${options.lastError}

Previous response:
${options.lastResponse}

Original assistant message:
${options.assistantText}

Return ONLY valid raw JSON matching the schema and fix the reported issues. No Markdown. No prose.`;
}
