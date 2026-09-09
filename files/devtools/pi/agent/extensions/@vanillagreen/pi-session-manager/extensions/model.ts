import { SessionManager, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { ModelInfo, SessionManagerContext } from "./types.js";

export function pinSessionModel(sessionPath: string, model: NonNullable<ExtensionContext["model"]>, thinkingLevel?: string): void {
	const manager = SessionManager.open(sessionPath);
	const context = manager.buildSessionContext();
	if (context.model?.provider !== model.provider || context.model?.modelId !== model.id) {
		manager.appendModelChange(model.provider, model.id);
	}
	if (thinkingLevel) {
		const branch = manager.getBranch();
		const lastThinking = [...branch].reverse().find((entry: any) => entry?.type === "thinking_level_change") as { thinkingLevel?: string } | undefined;
		if (lastThinking?.thinkingLevel !== thinkingLevel) manager.appendThinkingLevelChange(thinkingLevel as any);
	}
}

export function sessionModelInfo(sessionPath: string): ModelInfo | undefined {
	try {
		const model = SessionManager.open(sessionPath).buildSessionContext().model;
		if (!model?.provider || !model?.modelId) return undefined;
		return { provider: model.provider, id: model.modelId };
	} catch {
		return undefined;
	}
}

export function currentModelInfo(ctx: SessionManagerContext): ModelInfo | undefined {
	return ctx.model ? { provider: ctx.model.provider, id: ctx.model.id } : undefined;
}

export function sameModel(a: ModelInfo | undefined, b: ModelInfo | undefined): boolean {
	return Boolean(a && b && a.provider === b.provider && a.id === b.id);
}

export function modelLabel(model: ModelInfo | undefined): string {
	return model ? `${model.provider}/${model.id}` : "unknown model";
}
