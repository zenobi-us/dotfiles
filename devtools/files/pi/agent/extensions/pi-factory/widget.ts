import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { RunRecord } from "./registry.js";
import { formatElapsed, statusIcon, agentLabel } from "./format.js";

const MAX_VISIBLE = 6;

function truncate(text: string, max: number): string {
	const clean = text.replace(/[\n\r]+/g, " ").trim();
	return clean.length <= max ? clean : "…" + clean.slice(-(max - 1));
}

function infoLabel(run: RunRecord): string {
	const results = run.summary.results;
	// For programs with multiple children, show agent counts
	if (results.length > 1 || (results.length === 0 && run.status === "running")) {
		const done = results.filter(r => r.exitCode >= 0).length;
		const total = results.length;
		if (total === 0) return "starting…";
		if (done === total) return `${total} agents done`;
		return `${total} agents (${done} done)`;
	}
	// For single agent, show model
	const model = results[0]?.model ?? "";
	if (model) {
		const slash = model.lastIndexOf("/");
		return slash >= 0 ? model.slice(slash + 1) : model;
	}
	return "";
}

function outputTail(run: RunRecord): string {
	const results = run.summary.results;
	for (let i = results.length - 1; i >= 0; i--) {
		if (results[i].text) return truncate(results[i].text, 60);
	}
	if (run.summary.error?.message) return truncate(run.summary.error.message, 60);
	return "";
}

function renderLine(run: RunRecord, now: number): string {
	const icon = statusIcon(run.status);
	const elapsed = formatElapsed((run.completedAt ?? now) - run.startedAt);
	const agent = agentLabel(run);
	const info = infoLabel(run);
	const tail = outputTail(run);

	let line = `  ${icon} ${agent}  ${elapsed}`;
	if (info) line += `  ${info}`;
	if (tail) line += `  ${tail}`;
	return line;
}

export class FactoryWidget {
	private readonly key: string;
	constructor(key = "pi-factory") {
		this.key = key;
	}

	update(runs: RunRecord[], ctx: ExtensionContext): void {
		if (runs.length === 0) {
			this.clear(ctx);
			return;
		}

		const now = Date.now();

		// Sort: running first, then most recent first
		const sorted = [...runs].sort((a, b) => {
			if (a.status === "running" && b.status !== "running") return -1;
			if (a.status !== "running" && b.status === "running") return 1;
			return b.startedAt - a.startedAt;
		});

		const visible = sorted.slice(0, MAX_VISIBLE);
		const lines = [
			`─── factory (${runs.length} run${runs.length === 1 ? "" : "s"}) ───`,
			...visible.map((r) => renderLine(r, now)),
		];

		ctx.ui.setWidget(this.key, lines);
	}

	clear(ctx: ExtensionContext): void {
		ctx.ui.setWidget(this.key, undefined);
	}
}
