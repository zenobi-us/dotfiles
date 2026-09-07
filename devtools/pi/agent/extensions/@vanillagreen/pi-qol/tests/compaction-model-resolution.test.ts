import { expect, test } from "bun:test";
import { resolveConfiguredModel } from "../extensions/qol/compaction.ts";

test("compaction model resolution strips max thinking suffix", () => {
	const calls: Array<[string, string]> = [];
	const model = { provider: "anthropic", id: "claude-opus-5" };
	const ctx = {
		model,
		modelRegistry: {
			find(provider: string, id: string) {
				calls.push([provider, id]);
				return provider === "anthropic" && id === "claude-opus-5" ? model : undefined;
			},
		},
	} as any;

	expect(resolveConfiguredModel(ctx, "anthropic/claude-opus-5:max")).toBe(model);
	expect(calls).toEqual([["anthropic", "claude-opus-5"]]);
});