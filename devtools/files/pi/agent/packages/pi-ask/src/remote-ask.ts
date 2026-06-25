import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type {
	AskQuestion,
	AskResult,
	AskSelectedOption,
	AskState,
	AskStateAnswer,
} from "./types.ts";

export const PI_ASK_STARTED_EVENT = "@eko24ive/pi-ask:started";
export const PI_ASK_COMPLETED_EVENT = "@eko24ive/pi-ask:completed";
export const PI_ASK_SUBMIT_EVENT = "@eko24ive/pi-ask:submit";
export const PI_ASK_SUBMIT_RESULT_EVENT = "@eko24ive/pi-ask:submit-result";

export type RemoteAskSource = "tool" | "answer" | "answer:again" | "ask:replay";

export interface RemoteAskAnswer {
	customText?: string;
	note?: string;
	optionNotes?: Record<string, string>;
	values?: string[];
}

export type RemoteAskResponse =
	| {
			answers: Record<string, RemoteAskAnswer>;
			kind: "answer";
			mode?: "submit" | "elaborate";
	  }
	| { kind: "cancel" };

export interface RemoteAskStartedEvent {
	createdAt: number;
	flowId: string;
	questions: AskQuestion[];
	source: RemoteAskSource;
	title?: string;
	toolCallId?: string;
	version: 1;
}

export interface RemoteAskCompletedEvent {
	completedAt: number;
	flowId: string;
	result: AskResult;
	source: RemoteAskSource;
	toolCallId?: string;
	version: 1;
}

export interface RemoteAskSubmitEvent {
	flowId: string;
	requestId: string;
	response: RemoteAskResponse;
	version: 1;
}

export type RemoteAskSubmitError =
	| "flow_not_found"
	| "invalid_answer"
	| "invalid_request";

export type RemoteAskSubmitResultEvent = {
	flowId: string;
	requestId: string;
	version: 1;
} & (
	| { ok: true }
	| { error: RemoteAskSubmitError; message: string; ok: false }
);

export interface RemoteAskFlowOptions {
	source: RemoteAskSource;
	toolCallId?: string;
}

export interface RemoteAskFlowInput extends RemoteAskFlowOptions {
	onSubmit: (response: RemoteAskResponse) => RemoteAskSubmitResolution;
	questions: AskQuestion[];
	title?: string;
}

interface ActiveRemoteAskFlow extends RemoteAskFlowInput {
	flowId: string;
}

export type RemoteAskSubmitResolution =
	| { ok: true }
	| { error: RemoteAskSubmitError; message: string; ok: false };

export interface RemoteAskFlowHandle {
	complete: (result: AskResult) => void;
	dispose: () => void;
	flowId: string;
}

export interface RemoteAskRuntime {
	disposeAll: () => void;
	startFlow: (flow: RemoteAskFlowInput) => RemoteAskFlowHandle;
}

type EventBus = ExtensionAPI["events"];

export function createRemoteAskRuntime(events: EventBus): RemoteAskRuntime {
	const activeFlows = new Map<string, ActiveRemoteAskFlow>();
	const unsubscribeSubmit = events.on(PI_ASK_SUBMIT_EVENT, (data) => {
		handleSubmitEvent(events, activeFlows, data);
	});

	return {
		disposeAll() {
			activeFlows.clear();
			unsubscribeSubmit();
		},
		startFlow(flow) {
			return startRemoteAskFlow(events, activeFlows, flow);
		},
	};
}

function handleSubmitEvent(
	events: EventBus,
	activeFlows: Map<string, ActiveRemoteAskFlow>,
	data: unknown
): void {
	const request = parseSubmitEvent(data);
	if (!request.ok) {
		emitSubmitResult(events, {
			version: 1,
			requestId: request.requestId,
			flowId: request.flowId,
			ok: false,
			error: "invalid_request",
			message: request.message,
		});
		return;
	}

	const event = request.event;
	const flow = activeFlows.get(event.flowId);
	if (!flow) {
		emitSubmitResult(events, failedSubmit(event));
		return;
	}

	emitSubmitResult(events, {
		version: 1,
		requestId: event.requestId,
		flowId: event.flowId,
		...flow.onSubmit(event.response),
	});
}

function startRemoteAskFlow(
	events: EventBus,
	activeFlows: Map<string, ActiveRemoteAskFlow>,
	flow: RemoteAskFlowInput
): RemoteAskFlowHandle {
	const flowId = createFlowId(flow.toolCallId);
	let completed = false;
	activeFlows.set(flowId, { ...flow, flowId });
	queueMicrotask(() => {
		if (completed || !activeFlows.has(flowId)) {
			return;
		}
		events.emit(PI_ASK_STARTED_EVENT, {
			version: 1,
			flowId,
			toolCallId: flow.toolCallId,
			source: flow.source,
			title: flow.title,
			questions: cloneQuestions(flow.questions),
			createdAt: Date.now(),
		} satisfies RemoteAskStartedEvent);
	});

	return {
		flowId,
		complete(result) {
			if (completed) {
				return;
			}
			completed = true;
			activeFlows.delete(flowId);
			events.emit(PI_ASK_COMPLETED_EVENT, {
				version: 1,
				flowId,
				toolCallId: flow.toolCallId,
				source: flow.source,
				result,
				completedAt: Date.now(),
			} satisfies RemoteAskCompletedEvent);
		},
		dispose() {
			if (completed) {
				return;
			}
			activeFlows.delete(flowId);
		},
	};
}

function cloneQuestions(questions: AskQuestion[]): AskQuestion[] {
	return questions.map((question) => ({
		...question,
		options: question.options.map((option) => ({ ...option })),
	}));
}

function emitSubmitResult(
	events: EventBus,
	result: RemoteAskSubmitResultEvent
): void {
	events.emit(PI_ASK_SUBMIT_RESULT_EVENT, result);
}

function failedSubmit(event: RemoteAskSubmitEvent): RemoteAskSubmitResultEvent {
	return {
		version: 1,
		requestId: event.requestId,
		flowId: event.flowId,
		ok: false,
		error: "flow_not_found",
		message: "Ask flow is not active.",
	};
}

export function applyRemoteAskResponse(
	state: AskState,
	response: RemoteAskResponse
): { state: AskState } & RemoteAskSubmitResolution {
	if (response.kind === "cancel") {
		return {
			ok: true,
			state: { ...state, cancelled: true, completed: true },
		};
	}

	const validation = validateAnswerResponse(state, response);
	if (!validation.ok) {
		return { ...validation, state };
	}

	return {
		ok: true,
		state: {
			...state,
			answers: validation.answers,
			activeTabIndex: state.questions.length,
			activeSubmitActionIndex: response.mode === "elaborate" ? 1 : 0,
			completed: true,
			mode: response.mode ?? "submit",
			view: { kind: "submit" },
		},
	};
}

function validateAnswerResponse(
	state: AskState,
	response: Extract<RemoteAskResponse, { kind: "answer" }>
):
	| { answers: Record<string, AskStateAnswer>; ok: true }
	| { error: "invalid_answer"; message: string; ok: false } {
	if (!isPlainObject(response.answers)) {
		return invalidAnswer("Answer response must include an answers object.");
	}
	if (
		response.mode &&
		response.mode !== "submit" &&
		response.mode !== "elaborate"
	) {
		return invalidAnswer('Answer mode must be "submit" or "elaborate".');
	}

	const answers: Record<string, AskStateAnswer> = {};
	for (const [questionId, answer] of Object.entries(response.answers)) {
		const question = state.questions.find(
			(candidate) => candidate.id === questionId
		);
		if (!question) {
			return invalidAnswer(`Unknown question id "${questionId}".`);
		}
		const normalized = normalizeRemoteAnswer(question, answer);
		if (!normalized.ok) {
			return normalized;
		}
		answers[questionId] = normalized.answer;
	}

	return { ok: true, answers };
}

function normalizeRemoteAnswer(
	question: AskQuestion,
	answer: unknown
):
	| { answer: AskStateAnswer; ok: true }
	| { error: "invalid_answer"; message: string; ok: false } {
	const parts = parseRemoteAnswerParts(question, answer);
	if (!parts.ok) {
		return parts;
	}
	const selected = normalizeSelectedValues(question, parts.values);
	if (!selected.ok) {
		return selected;
	}
	const optionNotes = normalizeOptionNotes(question, parts.optionNotes);
	if (!optionNotes.ok) {
		return optionNotes;
	}

	const trimmedCustomText = parts.customText?.trim();
	return {
		ok: true,
		answer: {
			selected: selected.selected,
			customSelected: trimmedCustomText ? true : undefined,
			customText: trimmedCustomText ? parts.customText : undefined,
			note: parts.note?.trim() ? parts.note : undefined,
			optionNotes: optionNotes.optionNotes,
		},
	};
}

function parseRemoteAnswerParts(
	question: AskQuestion,
	answer: unknown
):
	| {
			customText?: string;
			note?: string;
			ok: true;
			optionNotes?: Record<string, string>;
			values: string[];
	  }
	| { error: "invalid_answer"; message: string; ok: false } {
	if (!isPlainObject(answer)) {
		return invalidAnswer(
			`Answer for question "${question.id}" must be an object.`
		);
	}
	if (answer.values !== undefined && !isStringArray(answer.values)) {
		return invalidAnswer(
			`Answer values for question "${question.id}" must be strings.`
		);
	}
	const values = answer.values ?? [];
	const scalarError = validateRemoteAnswerScalars(question, answer, values);
	if (scalarError) {
		return scalarError;
	}
	return {
		ok: true,
		values,
		customText: answer.customText as string | undefined,
		note: answer.note as string | undefined,
		optionNotes: answer.optionNotes as Record<string, string> | undefined,
	};
}

function validateRemoteAnswerScalars(
	question: AskQuestion,
	answer: Record<string, unknown>,
	values: string[]
): { error: "invalid_answer"; message: string; ok: false } | undefined {
	if (new Set(values).size !== values.length) {
		return invalidAnswer(
			`Answer values for question "${question.id}" must be unique.`
		);
	}
	if (question.type !== "multi" && values.length > 1) {
		return invalidAnswer(
			`Question "${question.id}" accepts only one selected value.`
		);
	}
	if (
		answer.customText !== undefined &&
		typeof answer.customText !== "string"
	) {
		return invalidAnswer(
			`Custom text for question "${question.id}" must be a string.`
		);
	}
	if (
		typeof answer.customText === "string" &&
		answer.customText.trim() &&
		question.type !== "multi" &&
		values.length > 0
	) {
		return invalidAnswer(
			`Question "${question.id}" cannot combine a selected value and custom text.`
		);
	}
	if (answer.note !== undefined && typeof answer.note !== "string") {
		return invalidAnswer(
			`Note for question "${question.id}" must be a string.`
		);
	}
	if (answer.optionNotes !== undefined && !isStringRecord(answer.optionNotes)) {
		return invalidAnswer(
			`Option notes for question "${question.id}" must be string values.`
		);
	}
}

function normalizeSelectedValues(
	question: AskQuestion,
	values: string[]
):
	| { ok: true; selected: AskSelectedOption[] }
	| { error: "invalid_answer"; message: string; ok: false } {
	const selected: AskSelectedOption[] = [];
	for (const value of values) {
		const optionIndex = question.options.findIndex(
			(option) => option.value === value
		);
		if (optionIndex < 0) {
			return invalidAnswer(
				`Unknown option value "${value}" for question "${question.id}".`
			);
		}
		const option = question.options[optionIndex];
		selected.push({
			value: option.value,
			label: option.label,
			index: optionIndex + 1,
		});
	}
	return { ok: true, selected };
}

function normalizeOptionNotes(
	question: AskQuestion,
	optionNotes: Record<string, string> | undefined
):
	| { ok: true; optionNotes?: Record<string, string> }
	| { error: "invalid_answer"; message: string; ok: false } {
	const entries = Object.entries(optionNotes ?? {}).filter(([, value]) =>
		value.trim()
	);
	for (const [value] of entries) {
		if (!question.options.some((option) => option.value === value)) {
			return invalidAnswer(
				`Unknown option note value "${value}" for question "${question.id}".`
			);
		}
	}
	return {
		ok: true,
		optionNotes: entries.length > 0 ? Object.fromEntries(entries) : undefined,
	};
}

function parseSubmitEvent(
	data: unknown
):
	| { event: RemoteAskSubmitEvent; ok: true }
	| { flowId: string; message: string; ok: false; requestId: string } {
	const fallback = { requestId: "", flowId: "" };
	if (!isPlainObject(data)) {
		return {
			...fallback,
			ok: false,
			message: "Submit event must be an object.",
		};
	}
	const requestId = typeof data.requestId === "string" ? data.requestId : "";
	const flowId = typeof data.flowId === "string" ? data.flowId : "";
	if (data.version !== 1) {
		return {
			requestId,
			flowId,
			ok: false,
			message: "Submit event version must be 1.",
		};
	}
	if (!requestId) {
		return {
			requestId,
			flowId,
			ok: false,
			message: "Submit event requestId is required.",
		};
	}
	if (!flowId) {
		return {
			requestId,
			flowId,
			ok: false,
			message: "Submit event flowId is required.",
		};
	}
	const response = parseRemoteResponse(data.response);
	if (!response.ok) {
		return { requestId, flowId, ok: false, message: response.message };
	}
	return {
		ok: true,
		event: {
			version: 1,
			requestId,
			flowId,
			response: response.response,
		},
	};
}

function parseRemoteResponse(
	data: unknown
): { ok: true; response: RemoteAskResponse } | { message: string; ok: false } {
	if (!isPlainObject(data)) {
		return { ok: false, message: "Submit response must be an object." };
	}
	if (data.kind === "cancel") {
		return { ok: true, response: { kind: "cancel" } };
	}
	if (data.kind === "answer") {
		return {
			ok: true,
			response: {
				kind: "answer",
				answers: data.answers as Record<string, RemoteAskAnswer>,
				mode: data.mode as "submit" | "elaborate" | undefined,
			},
		};
	}
	return {
		ok: false,
		message: 'Submit response kind must be "answer" or "cancel".',
	};
}

function invalidAnswer(message: string): {
	error: "invalid_answer";
	message: string;
	ok: false;
} {
	return { ok: false, error: "invalid_answer", message };
}

function createFlowId(toolCallId?: string): string {
	if (toolCallId) {
		return `tool:${toolCallId}`;
	}
	return `flow:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((item) => typeof item === "string")
	);
}

function isStringRecord(value: unknown): value is Record<string, string> {
	return (
		isPlainObject(value) &&
		Object.values(value).every((item) => typeof item === "string")
	);
}
