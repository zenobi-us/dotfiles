export function isAbortError(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	const name = "name" in error ? String((error as { name?: unknown }).name) : "";
	const message = "message" in error ? String((error as { message?: unknown }).message) : "";
	return name === "AbortError" || message.toLowerCase().includes("aborted");
}

export async function resolveSkillDraft(
	generate: () => Promise<string>,
	fallback: () => string,
	signal: AbortSignal | undefined,
	onFallback: (error: unknown) => void,
): Promise<string | null> {
	if (signal?.aborted) return null;
	try {
		const draft = await generate();
		return signal?.aborted ? null : draft;
	} catch (error) {
		if (signal?.aborted || isAbortError(error)) return null;
		onFallback(error);
		return fallback();
	}
}
