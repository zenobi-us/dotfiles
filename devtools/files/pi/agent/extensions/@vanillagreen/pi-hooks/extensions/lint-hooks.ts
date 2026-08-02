import { isAbsolute, relative } from "node:path";

import { filterClippyErrors, findCargoWorkspaceRoot, runWorkspaceClippy } from "./cargo.js";

/**
 * Build the set of path strings worth grepping clippy output for. Cargo emits
 * paths relative to the workspace root (e.g. `ht-ds/src/lib.rs`), so we must
 * convert the absolute edit target before filtering. We keep the absolute form
 * too in case clippy ever surfaces it (`--message-format` JSON mode does).
 */
export function pathTokensForFilter(filePath: string, workspaceRoot: string | null): string[] {
	const tokens = new Set<string>();
	tokens.add(filePath);
	if (workspaceRoot && isAbsolute(filePath)) {
		const rel = relative(workspaceRoot, filePath);
		if (rel && !rel.startsWith("..")) tokens.add(rel);
	}
	return [...tokens];
}

const DIAGNOSTIC_HEADER = /^(error|warning|help|note)(\[[^\]]+\])?:/i;

/**
 * Split clippy stderr into diagnostic blocks, then return the ones that
 * reference any of `tokens` in their span pointer (e.g. ` --> file:line:col`).
 *
 * Each block starts at an `error:`/`warning:`/`help:`/`note:` line and runs
 * up to (but not including) the next such header. This preserves the full
 * rustc-style rendered diagnostic — the header, the file-line span, the
 * source snippet, and any `help:`/`note:` tails — rather than the single
 * `-->` line which on its own omits the lint name and message body.
 */
export function clippyDiagnosticsForTokens(output: string, tokens: string[], limit = 5): string[] {
	const lines = output.split("\n");
	const blocks: string[][] = [];
	let current: string[] | null = null;
	for (const line of lines) {
		if (DIAGNOSTIC_HEADER.test(line.trimStart())) {
			if (current) blocks.push(current);
			current = [line];
		} else if (current) {
			current.push(line);
		}
	}
	if (current) blocks.push(current);

	const matching: string[] = [];
	for (const block of blocks) {
		if (matching.length >= limit) break;
		const joined = block.join("\n");
		if (tokens.some((t) => joined.includes(t))) {
			matching.push(joined.trimEnd());
		}
	}
	return matching;
}

/**
 * Run workspace clippy and return rendered diagnostic blocks for `filePath`.
 * Each entry is the full multi-line clippy diagnostic (header, span pointer,
 * snippet, and help/note tails) so the agent sees the lint name and message
 * — not just the source location.
 */
export function clippyIssuesForFile(cwd: string, filePath: string, timeoutMs: number): string[] {
	const metadataBudget = Math.min(5000, Math.floor(timeoutMs / 4));
	const root = findCargoWorkspaceRoot(cwd, metadataBudget);
	if (!root) return [];

	const clippyBudget = Math.max(1, timeoutMs - metadataBudget);
	const r = runWorkspaceClippy(root, clippyBudget);
	if (r.timedOut) return [`pi-hooks post-edit: cargo clippy timed out after ${clippyBudget}ms.`];
	if (r.exitCode === 0) return [];

	const tokens = pathTokensForFilter(filePath, root);
	// Clippy renders diagnostics to stderr; check both streams in case message
	// format changes.
	return clippyDiagnosticsForTokens(`${r.stdout}\n${r.stderr}`, tokens);
}

/**
 * Run workspace clippy and return up to 15 error header lines. Used by the
 * end-of-turn check. Reuses the per-turn cache populated by
 * `clippyIssuesForFile` when no further edits happened in between, so a clean
 * post-edit run doesn't pay for a second clippy invocation at turn end.
 */
export function workspaceClippyErrors(cwd: string, timeoutMs: number): string[] {
	const metadataBudget = Math.min(5000, Math.floor(timeoutMs / 4));
	const root = findCargoWorkspaceRoot(cwd, metadataBudget);
	if (!root) return [];

	const clippyBudget = Math.max(1, timeoutMs - metadataBudget);
	const r = runWorkspaceClippy(root, clippyBudget);
	if (r.timedOut) return [`pi-hooks end-of-turn: cargo clippy timed out after ${clippyBudget}ms.`];
	if (r.exitCode === 0) return [];
	return filterClippyErrors(`${r.stdout}\n${r.stderr}`);
}
