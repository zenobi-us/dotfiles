import type { RunSummary } from "./types.js";

export function formatElapsed(ms: number): string {
	const secs = Math.floor(ms / 1000);
	if (secs < 60) return `${secs}s`;
	const mins = Math.floor(secs / 60);
	const rem = secs % 60;
	if (rem === 0 || mins >= 10) return `${mins}m`;
	return `${mins}m ${rem}s`;
}

export function statusIcon(status: string): string {
	switch (status) {
		case "running": return "●";
		case "done": return "✓";
		case "failed": return "✗";
		case "cancelled": return "◼";
		default: return "?";
	}
}

export function agentLabel(record: { task?: string; summary?: { results: Array<{ agent: string }> }; runId: string }): string;
export function agentLabel(summary: RunSummary): string;
export function agentLabel(input: any): string {
	// RunRecord style (has .summary)
	if (input.summary) {
		if (input.task) return input.task;
		const results = input.summary.results;
		if (results.length > 0) return results[0].agent;
		return input.runId.slice(0, 8);
	}
	// RunSummary style (has .results directly, .metadata)
	const meta = input.metadata as Record<string, unknown> | undefined;
	if (typeof meta?.task === "string") return meta.task;
	if (input.results?.[0]?.agent) return input.results[0].agent;
	return input.runId.slice(0, 8);
}
