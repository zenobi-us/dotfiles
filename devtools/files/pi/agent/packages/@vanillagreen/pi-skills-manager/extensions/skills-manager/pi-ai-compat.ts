import * as piAi from "@earendil-works/pi-ai";

const dynamicImport = (specifier: string) => import(specifier);

type RetryAssistantCall = (
	produce: () => Promise<any>,
	policy: { enabled: boolean; maxRetries: number; baseDelayMs: number },
	signal: AbortSignal | undefined,
	callbacks?: { onRetryScheduled?: (attempt: number, maxAttempts: number, delayMs: number, errorMessage: string) => void | Promise<void> },
) => Promise<any>;

export async function completeSimple(
	model: unknown,
	context: unknown,
	options?: unknown,
	deps: { root?: any; loadCompat?: () => Promise<any> } = {},
): Promise<any> {
	const rootCompleteSimple = (deps.root ?? piAi as any).completeSimple;
	if (typeof rootCompleteSimple === "function") return await rootCompleteSimple(model, context, options);
	const compat = deps.loadCompat ? await deps.loadCompat() : await dynamicImport("@earendil-works/pi-ai/compat") as any;
	return await compat.completeSimple(model, context, options);
}

export async function retrySkillGenerationCompat(
	produce: () => Promise<any>,
	signal: AbortSignal | undefined,
	onRetryScheduled?: (attempt: number, maxAttempts: number, delayMs: number, errorMessage: string) => void | Promise<void>,
	deps: { root?: any } = {},
): Promise<any> {
	const candidate = (deps.root ?? piAi as any).retryAssistantCall as RetryAssistantCall | undefined;
	if (typeof candidate !== "function") return produce();
	return candidate(produce, { enabled: true, maxRetries: 3, baseDelayMs: 2000 }, signal, { onRetryScheduled });
}
