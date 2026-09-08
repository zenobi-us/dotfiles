export function stringifyError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function escapeRegex(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
