import * as piAi from "@earendil-works/pi-ai";

const dynamicImport = (specifier: string) => import(specifier);

export interface PiAiCompatDeps {
	root?: any;
	loadCompat?: () => Promise<any>;
}

type RetryAssistantCall = (
	produce: () => Promise<any>,
	policy: { enabled: boolean; maxRetries: number; baseDelayMs: number },
	signal: AbortSignal | undefined,
	callbacks?: {
		onRetryScheduled?: (attempt: number, maxAttempts: number, delayMs: number, errorMessage: string) => void | Promise<void>;
		onRetryAttemptStart?: () => void | Promise<void>;
		onRetryFinished?: (success: boolean, attempt: number, finalError?: string) => void | Promise<void>;
	},
) => Promise<any>;

export async function complete(model: unknown, context: unknown, options?: unknown, deps: PiAiCompatDeps = {}): Promise<any> {
	const rootComplete = (deps.root ?? piAi as any).complete;
	if (typeof rootComplete === "function") return await rootComplete(model, context, options);
	const compat = deps.loadCompat ? await deps.loadCompat() : await dynamicImport("@earendil-works/pi-ai/compat") as any;
	return await compat.complete(model, context, options);
}

export async function retryAssistantCallCompat(
	produce: () => Promise<any>,
	signal: AbortSignal | undefined,
	callbacks?: Parameters<RetryAssistantCall>[3],
	deps: { root?: any } = {},
): Promise<any> {
	const candidate = (deps.root ?? piAi as any).retryAssistantCall as RetryAssistantCall | undefined;
	if (typeof candidate !== "function") return produce();
	return candidate(produce, { enabled: true, maxRetries: 3, baseDelayMs: 2000 }, signal, callbacks);
}