import { applyPatch, resolvePatchPath, type ApplyPatchResult } from "../patch/apply.js";
import { parseApplyPatch } from "../patch/parser.js";

export interface ApplyPatchInput {
	input: string;
}

export const applyPatchToolSchema = {
	type: "object",
	additionalProperties: false,
	properties: {
		input: { type: "string", description: "Codex apply_patch text beginning with *** Begin Patch and ending with *** End Patch." },
	},
	required: ["input"],
};

export function applyPatchTargetPaths(input: string, cwd: string, allowAbsolutePaths: boolean): string[] {
	const parsed = parseApplyPatch(input);
	const paths = new Set<string>();
	for (const action of parsed.actions) {
		paths.add(resolvePatchPath(action.path, { allowAbsolutePaths, cwd }));
		if (action.moveTo) paths.add(resolvePatchPath(action.moveTo, { allowAbsolutePaths, cwd }));
	}
	return [...paths].sort();
}

async function withMutationQueue(path: string, fn: () => Promise<void>): Promise<void> {
	try {
		const mod = await import("@earendil-works/pi-coding-agent");
		const queue = (mod as { withFileMutationQueue?: (path: string, fn: () => Promise<void>) => Promise<void> }).withFileMutationQueue;
		if (typeof queue === "function") return queue(path, fn);
	} catch {
		// Unit tests can run outside Pi without peer dependencies installed.
	}
	return fn();
}

export async function executeApplyPatchTool(params: ApplyPatchInput, cwd: string, allowAbsolutePaths: boolean): Promise<{ content: Array<{ type: "text"; text: string }>; details: ApplyPatchResult }> {
	if (!params || typeof params.input !== "string") throw new Error("apply_patch requires an input string.");
	const targets = applyPatchTargetPaths(params.input, cwd, allowAbsolutePaths);
	let result: ApplyPatchResult | undefined;
	const runAt = async (index: number): Promise<void> => {
		if (index >= targets.length) {
			result = await applyPatch(params.input, { allowAbsolutePaths, cwd });
			return;
		}
		await withMutationQueue(targets[index]!, () => runAt(index + 1));
	};
	await runAt(0);
	if (!result) throw new Error("apply_patch did not produce a result.");
	const fileCount = result.files.length;
	return {
		content: [{ type: "text", text: `${result.summary}\nFiles changed: ${fileCount}` }],
		details: result,
	};
}

export function createApplyPatchToolDefinition(options: { cwd?: string; allowAbsolutePaths?: boolean | ((cwd: string) => boolean); deferRendering?: boolean } = {}) {
	const definition: Record<string, unknown> = {
		renderShell: "self",
		name: "apply_patch",
		label: "Apply Patch",
		description: "Apply a Codex-style patch locally. Use the input argument with a patch beginning *** Begin Patch and ending *** End Patch. Pi native edit/write remain available unless strict patch mode is enabled.",
		promptSnippet: "Apply Codex-style multi-file patches using the input argument.",
		promptGuidelines: ["Use apply_patch for concise multi-file edits when a Codex-style patch is clearer than separate edit/write calls."],
		parameters: applyPatchToolSchema,
		async execute(_toolCallId: string, params: ApplyPatchInput, _signal: AbortSignal | undefined, _onUpdate: unknown, ctx: { cwd: string }) {
			const cwd = ctx?.cwd ?? options.cwd ?? process.cwd();
			const allowAbsolutePaths = typeof options.allowAbsolutePaths === "function" ? options.allowAbsolutePaths(cwd) : Boolean(options.allowAbsolutePaths);
			return executeApplyPatchTool(params, cwd, allowAbsolutePaths);
		},
	};
	return definition;
}
