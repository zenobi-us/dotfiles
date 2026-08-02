export interface NativeOpenAiWebSearchRewriteResult<T = unknown> {
	payload: T;
	rewritten: string[];
}

export interface NativeOpenAiWebSearchOptions {
	externalWebAccess?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toolName(tool: Record<string, unknown>): string | undefined {
	if (typeof tool.name === "string") return tool.name;
	const nested = isRecord(tool.function) ? tool.function : undefined;
	return typeof nested?.name === "string" ? nested.name : undefined;
}

export function rewriteNativeOpenAiWebSearch<T>(payload: T, options: NativeOpenAiWebSearchOptions = {}): NativeOpenAiWebSearchRewriteResult<T> {
	if (!isRecord(payload) || !Array.isArray(payload.tools)) return { payload, rewritten: [] };
	const externalWebAccess = options.externalWebAccess ?? true;
	const rewritten: string[] = [];
	const tools = payload.tools.map((candidate) => {
		if (!isRecord(candidate)) return candidate;
		const name = toolName(candidate);
		if (name === "web_search") {
			rewritten.push(name);
			return { type: "web_search", external_web_access: externalWebAccess };
		}
		return candidate;
	});
	return { payload: { ...payload, tools } as T, rewritten };
}
