export interface NativeToolRewriteResult<T = unknown> {
	payload: T;
	rewritten: string[];
}

export interface NativeToolRewriteOptions {
	imageModel?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toolName(tool: Record<string, unknown>): string | undefined {
	if (typeof tool.name === "string") return tool.name;
	const nested = isRecord(tool.function) ? tool.function : undefined;
	return typeof nested?.name === "string" ? nested.name : undefined;
}

function imageToolConfig(tool: Record<string, unknown>, options: NativeToolRewriteOptions): Record<string, unknown> {
	const parameters = isRecord(tool.parameters) ? tool.parameters : isRecord(isRecord(tool.function) ? tool.function.parameters : undefined) ? (tool.function as Record<string, unknown>).parameters as Record<string, unknown> : {};
	const config: Record<string, unknown> = { type: "image_generation" };
	if (typeof options.imageModel === "string" && options.imageModel.trim()) config.model = options.imageModel.trim();
	for (const key of ["size", "quality", "background", "output_format"]) {
		const value = parameters[key];
		if (typeof value === "string") config[key] = value;
	}
	if (!config.output_format) config.output_format = "png";
	if (!config.action) config.action = "auto";
	return config;
}

export function rewriteNativeOpenAiTools<T>(payload: T, options: NativeToolRewriteOptions = {}): NativeToolRewriteResult<T> {
	if (!isRecord(payload) || !Array.isArray(payload.tools)) return { payload, rewritten: [] };
	const rewritten: string[] = [];
	const tools = payload.tools.map((candidate) => {
		if (!isRecord(candidate)) return candidate;
		const name = toolName(candidate);
		if (name === "image_generation") {
			rewritten.push(name);
			return imageToolConfig(candidate, options);
		}
		return candidate;
	});
	return { payload: { ...payload, tools } as T, rewritten };
}
