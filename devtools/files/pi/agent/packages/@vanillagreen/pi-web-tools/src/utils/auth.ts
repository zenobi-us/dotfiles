export function requireApiKey(value: string | undefined, provider: string, setup: string): string {
	if (value && value.trim()) return value.trim();
	throw new Error(`${provider} API key is required. ${setup}`);
}
