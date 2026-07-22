const THINKING_LEVELS = new Set(["off", "minimal", "low", "medium", "high", "xhigh"]);

export function parseAllowedModels(raw: string | undefined): string[] {
	if (!raw?.trim()) return [];
	return raw
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function splitModelRef(ref: string): { model: string; thinking?: string } {
	const idx = ref.lastIndexOf(":");
	if (idx === -1) return { model: ref };
	const suffix = ref.slice(idx + 1);
	if (!THINKING_LEVELS.has(suffix)) return { model: ref };
	return { model: ref.slice(0, idx), thinking: suffix };
}

/**
 * Combine a model and a separate thinking level into one ref. If the model
 * string already carries a valid thinking suffix, it wins and `thinking` is
 * ignored. Returns undefined when no model is given.
 */
export function buildModelRef(
	model: string | undefined,
	thinking: string | undefined,
): string | undefined {
	const trimmedModel = model?.trim();
	if (!trimmedModel) return undefined;
	if (splitModelRef(trimmedModel).thinking) return trimmedModel;
	const trimmedThinking = thinking?.trim();
	return trimmedThinking ? `${trimmedModel}:${trimmedThinking}` : trimmedModel;
}

function isModelAllowed(
	effectiveModelRef: string,
	allowedModelRef: string,
): boolean {
	const effective = splitModelRef(effectiveModelRef);
	const allowed = splitModelRef(allowedModelRef);
	if (allowed.model !== effective.model) return false;
	return !allowed.thinking || allowed.thinking === effective.thinking;
}

export function assertModelAllowed(
	effectiveModelRef: string | undefined,
	allowedModelsRaw: string | undefined,
	agentName: string | undefined,
	implicitAllowedModelRefs: string[] = [],
): void {
	const explicitAllowedModels = parseAllowedModels(allowedModelsRaw);
	if (explicitAllowedModels.length === 0) return;
	const allowedModels = [...implicitAllowedModelRefs.filter(Boolean), ...explicitAllowedModels];
	if (!effectiveModelRef) {
		throw new Error(`Agent '${agentName ?? "subagent"}' defines allowed-models but no model was resolved.`);
	}
	if (allowedModels.some((entry) => isModelAllowed(effectiveModelRef, entry))) return;
	throw new Error(
		`Model '${effectiveModelRef}' is not allowed for agent '${agentName ?? "subagent"}'. ` +
		`Allowed models: ${allowedModels.join(", ")}.`,
	);
}

export function renderAllowedModelChoices(
	allowedModelsRaw: string | undefined,
): string | undefined {
	const allowed = parseAllowedModels(allowedModelsRaw);
	return allowed.length > 0 ? allowed.join(" | ") : undefined;
}
