export function safeFileName(value: string): string {
	return value.replace(/[^\w.-]+/g, "_");
}

export function shellQuote(value: string): string {
	return `'${value.replace(/'/g, `'\\''`)}'`;
}
