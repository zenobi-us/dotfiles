import { FactoryError } from "./errors.js";

export function resolveModel(selector: string, registry?: unknown): string {
	const [provider, id] = selector.includes("/") ? selector.split("/", 2) : [undefined, selector];
	if (!id) {
		throw new FactoryError({ code: "MODEL_NOT_FOUND", message: `Invalid model selector: '${selector}'.`, recoverable: true });
	}

	if (registry) {
		const models = listModels(registry);
		const found = models.find((m) => m.id === id && (!provider || m.provider === provider));
		if (!found && models.length > 0) {
			throw new FactoryError({
				code: "MODEL_NOT_FOUND",
				message: `Model '${selector}' not found in registry.`,
				recoverable: true,
				meta: { available: models.map((m) => `${m.provider}/${m.id}`).slice(0, 20) },
			});
		}
	}

	return selector;
}

function listModels(registry: any): Array<{ provider?: string; id?: string }> {
	if (Array.isArray(registry?.models)) return registry.models;
	try {
		const v = registry?.getModels?.();
		if (Array.isArray(v)) return v;
	} catch {}
	return [];
}

export function resolveTools(requested?: string[], active?: string[]): string[] {
	const source = requested?.length ? requested : active ?? [];
	const seen = new Set<string>();
	return source
		.map((t) => normalize(t))
		.filter((t) => {
			if (!t || seen.has(t)) return false;
			seen.add(t);
			return true;
		});
}

function normalize(tool: string): string {
	let t = tool.trim();
	if (t.startsWith("functions.")) t = t.slice("functions.".length);
	if (t.startsWith("mcp:")) return t;
	return t.toLowerCase();
}
