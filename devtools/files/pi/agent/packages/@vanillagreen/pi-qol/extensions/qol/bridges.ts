import {
	CAVEMAN_BRIDGE_SYMBOL,
	PI_AGENTS_STATUSLINE_SYMBOL,
	QUESTION_SERVICE_SYMBOL,
	VSTACK_MODAL_LOCK_SYMBOL,
} from "./constants.js";

export interface CavemanBridge {
	isActive(): boolean;
	getMode(): string;
	getConfiguredMode?(cwd?: string): string;
	getLastActiveMode(): string;
	hasSessionOverride?(): boolean;
	isStatusBadgeEnabled?(cwd?: string): boolean;
	cycleMode?(cwd?: string): string;
	setMode?(mode: string, cwd?: string): string | undefined;
	subscribe(listener: () => void): () => void;
}

export interface PiAgentsStatuslineBridge {
	getCurrentSubagent(cwd?: string): { name: string; color?: string } | undefined;
}

export interface QuestionRequestLike {
	header?: string;
	question?: string;
}

export interface QuestionOpenedEventLike {
	requestId?: string;
	request?: QuestionRequestLike;
	source?: string;
}

export interface QuestionServiceLike {
	listPending(): unknown[];
	subscribe(listener: (event: any) => void): () => void;
}

interface VstackModalLock {
	depth: number;
}

export function readCavemanBridge(): CavemanBridge | undefined {
	const host = globalThis as unknown as Record<PropertyKey, unknown>;
	const value = host[CAVEMAN_BRIDGE_SYMBOL];
	return value && typeof value === "object" ? (value as CavemanBridge) : undefined;
}

export function readPiAgentsStatuslineBridge(): PiAgentsStatuslineBridge | undefined {
	const host = globalThis as unknown as Record<PropertyKey, unknown>;
	const value = host[PI_AGENTS_STATUSLINE_SYMBOL];
	return value && typeof value === "object" && typeof (value as PiAgentsStatuslineBridge).getCurrentSubagent === "function"
		? (value as PiAgentsStatuslineBridge)
		: undefined;
}

export function getQuestionService(): QuestionServiceLike | undefined {
	const service = (globalThis as unknown as Record<PropertyKey, unknown>)[QUESTION_SERVICE_SYMBOL];
	if (!service || typeof service !== "object") return undefined;
	const candidate = service as Partial<QuestionServiceLike>;
	if (typeof candidate.subscribe === "function" && typeof candidate.listPending === "function") return candidate as QuestionServiceLike;
	return undefined;
}

export function acquireVstackModalLock(): () => void {
	const host = globalThis as unknown as Record<PropertyKey, unknown>;
	const existing = host[VSTACK_MODAL_LOCK_SYMBOL] as VstackModalLock | undefined;
	const lock = existing && typeof existing.depth === "number" ? existing : { depth: 0 };
	host[VSTACK_MODAL_LOCK_SYMBOL] = lock;
	lock.depth += 1;
	let released = false;
	return () => {
		if (released) return;
		released = true;
		lock.depth = Math.max(0, lock.depth - 1);
	};
}
