import type { Component, TUI } from "@mariozechner/pi-tui";
import { matchesKey, truncateToWidth, visibleWidth, wrapTextWithAnsi } from "@mariozechner/pi-tui";
import type { Theme } from "@mariozechner/pi-coding-agent";
import type { RunRegistry, RunRecord } from "./registry.js";
import { formatElapsed, agentLabel } from "./format.js";

/**
 * Factory overlay — shows subagent run status in a bordered panel.
 *
 * Design principles (learned from overlay-qa-tests):
 * - Every content line uses truncateToWidth(s, innerW, "...", true) for exact-width padding
 * - Fixed layout heights (MAX_RUNS_VISIBLE, MAX_DETAIL_LINES) — no terminal.rows dependency
 * - All multiline text is flattened to single lines before rendering
 * - Border rendering follows the exact pattern from the QA tests
 */

const MAX_RUNS_VISIBLE = 8;
const MAX_DETAIL_LINES = 18;

export class FactoryOverlay implements Component {
	private tui: TUI;
	private theme: Theme;
	private registry: RunRegistry;
	private done: () => void;

	private selectedIndex = 0;
	private runListScroll = 0;
	private detailScroll = 0;
	private refreshTimer: ReturnType<typeof setInterval> | undefined;
	private renderTimeout: ReturnType<typeof setTimeout> | undefined;

	constructor(tui: TUI, theme: Theme, registry: RunRegistry, done: () => void) {
		this.tui = tui;
		this.theme = theme;
		this.registry = registry;
		this.done = done;
		this.startAutoRefresh();
	}

	// ── Rendering ──────────────────────────────────────────────────────

	render(width: number): string[] {
		const t = this.theme;
		const innerW = Math.max(10, width - 2);
		const border = (c: string) => t.fg("border", c);
		const pad = (s: string) => truncateToWidth(s, innerW, "...", true);
		const lines: string[] = [];

		const runs = this.getSortedRuns();

		// ── Top border with title ──
		const title = ` factory (${runs.length} run${runs.length === 1 ? "" : "s"}) `;
		const titleW = visibleWidth(title);
		const leftPad = Math.floor((innerW - titleW) / 2);
		const rightPad = innerW - titleW - leftPad;
		lines.push(
			border("╭") +
			border("─".repeat(Math.max(0, leftPad))) +
			t.fg("accent", title) +
			border("─".repeat(Math.max(0, rightPad))) +
			border("╮"),
		);

		if (runs.length === 0) {
			lines.push(border("│") + pad(t.fg("muted", " No subagent runs.")) + border("│"));
			lines.push(border("│") + pad("") + border("│"));
			lines.push(border("│") + pad(t.fg("dim", " Esc to close")) + border("│"));
			lines.push(border("╰") + border("─".repeat(innerW)) + border("╯"));
			return lines;
		}

		// Clamp selection and scroll
		this.selectedIndex = Math.max(0, Math.min(this.selectedIndex, runs.length - 1));
		this.clampRunListScroll(runs.length);

		// ── Run list (fixed height: MAX_RUNS_VISIBLE) ──
		lines.push(border("│") + pad("") + border("│"));

		const visibleRuns = runs.slice(this.runListScroll, this.runListScroll + MAX_RUNS_VISIBLE);
		let runLinesRendered = 0;

		// Scroll-up indicator
		if (this.runListScroll > 0) {
			lines.push(border("│") + pad(t.fg("dim", ` ▲ ${this.runListScroll} more above`)) + border("│"));
			runLinesRendered++;
		}

		for (let i = 0; i < visibleRuns.length && runLinesRendered < MAX_RUNS_VISIBLE; i++) {
			const globalIdx = this.runListScroll + i;
			const r = visibleRuns[i]!;
			const selected = globalIdx === this.selectedIndex;
			const prefix = selected ? t.fg("accent", "▶ ") : "  ";
			const line = this.formatRunLine(r, innerW - 4); // 4 = 2 prefix + 2 side padding
			lines.push(border("│") + pad(" " + prefix + line) + border("│"));
			runLinesRendered++;
		}

		// Scroll-down indicator
		const remaining = runs.length - this.runListScroll - visibleRuns.length;
		if (remaining > 0 && runLinesRendered < MAX_RUNS_VISIBLE) {
			lines.push(border("│") + pad(t.fg("dim", ` ▼ ${remaining} more below`)) + border("│"));
			runLinesRendered++;
		}

		// Pad run list to fixed height
		while (runLinesRendered < MAX_RUNS_VISIBLE) {
			lines.push(border("│") + pad("") + border("│"));
			runLinesRendered++;
		}

		// ── Separator ──
		lines.push(border("├") + border("─".repeat(innerW)) + border("┤"));

		// ── Detail pane (fixed height: MAX_DETAIL_LINES) ──
		const selectedRun = runs[this.selectedIndex];
		let detailRendered = 0;

		if (selectedRun) {
			const allDetailLines = this.buildDetailLines(selectedRun, innerW - 2);

			// Clamp detail scroll
			const maxScroll = Math.max(0, allDetailLines.length - MAX_DETAIL_LINES);
			this.detailScroll = Math.max(0, Math.min(this.detailScroll, maxScroll));

			const scrolled = allDetailLines.slice(this.detailScroll, this.detailScroll + MAX_DETAIL_LINES);

			if (this.detailScroll > 0) {
				lines.push(border("│") + pad(t.fg("dim", ` ▲ ${this.detailScroll} more above`)) + border("│"));
				detailRendered++;
			}

			for (const dl of scrolled) {
				if (detailRendered >= MAX_DETAIL_LINES) break;
				lines.push(border("│") + pad(" " + dl) + border("│"));
				detailRendered++;
			}

			const belowCount = allDetailLines.length - this.detailScroll - scrolled.length;
			if (belowCount > 0 && detailRendered < MAX_DETAIL_LINES) {
				lines.push(border("│") + pad(t.fg("dim", ` ▼ ${belowCount} more below`)) + border("│"));
				detailRendered++;
			}
		}

		// Pad detail to fixed height
		while (detailRendered < MAX_DETAIL_LINES) {
			lines.push(border("│") + pad("") + border("│"));
			detailRendered++;
		}

		// ── Footer ──
		lines.push(border("├") + border("─".repeat(innerW)) + border("┤"));
		lines.push(border("│") + pad(t.fg("dim", " j/k select  J/K scroll detail  c cancel  Esc close")) + border("│"));
		lines.push(border("╰") + border("─".repeat(innerW)) + border("╯"));

		return lines;
	}

	// ── Detail builder ─────────────────────────────────────────────────

	private buildDetailLines(r: RunRecord, maxWidth: number): string[] {
		const t = this.theme;
		const lines: string[] = [];
		const flat = (s: string) => s.replace(/[\n\r]+/g, " ").trim();

		// Task
		const task = flat(r.task ?? r.summary.results[0]?.task ?? "(no task)");
		lines.push(t.fg("muted", "Task: ") + task);

		// Model
		const model = r.summary.results[0]?.model ?? "";
		if (model) lines.push(t.fg("muted", "Model: ") + model);

		// Status + elapsed
		const elapsed = formatElapsed((r.completedAt ?? Date.now()) - r.startedAt);
		lines.push(t.fg("muted", "Status: ") + r.status + "  " + t.fg("dim", elapsed));

		// Session path
		const sessionPath = r.summary.results[0]?.sessionPath;
		if (sessionPath) {
			lines.push(t.fg("muted", "Session: ") + t.fg("dim", sessionPath));
		}

		// Usage stats
		for (const res of r.summary.results) {
			if (res.usage) {
				const u = res.usage;
				const parts: string[] = [];
				if (u.input > 0 || u.output > 0) parts.push(`${u.input} in / ${u.output} out`);
				if (u.turns > 0) parts.push(`${u.turns} turns`);
				if (u.cost > 0) parts.push(`$${u.cost.toFixed(4)}`);
				if (parts.length > 0) {
					lines.push(t.fg("muted", "Usage: ") + t.fg("dim", parts.join("  ")));
				}
			}
		}

		// Error
		if (r.summary.error) {
			lines.push("");
			lines.push(t.fg("error", "Error: " + flat(`${r.summary.error.code} — ${r.summary.error.message}`)));
		}

		// Child agent results
		if (r.summary.results.length > 0) {
			lines.push("");
			lines.push(t.fg("muted", "── Child Agents ──"));

			for (const res of r.summary.results) {
				const icon =
					res.exitCode === 0 ? t.fg("success", "✓") :
					res.exitCode > 0 ? t.fg("error", "✗") :
					t.fg("warning", "?");

				const modelLabel = res.model
					? " " + t.fg("muted", `[${res.model.includes("/") ? res.model.split("/").pop() : res.model}]`)
					: "";

				lines.push(icon + " " + t.fg("accent", res.agent) + modelLabel);
				lines.push(t.fg("dim", "  Task: " + flat(res.task)));

				if (res.text) {
					// Wrap output text, indent each line
					const wrapped = wrapTextWithAnsi(flat(res.text), maxWidth - 2);
					for (const wl of wrapped) lines.push("  " + wl);
				} else {
					lines.push(t.fg("dim", "  (no output)"));
				}

				lines.push("");
			}
		}

		return lines;
	}

	// ── Run line formatting ────────────────────────────────────────────

	private formatRunLine(r: RunRecord, maxWidth: number): string {
		const t = this.theme;
		const elapsed = formatElapsed((r.completedAt ?? Date.now()) - r.startedAt);

		const statusIcon =
			r.status === "running" ? t.fg("warning", "●") :
			r.status === "done" ? t.fg("success", "✓") :
			r.status === "cancelled" ? t.fg("muted", "◼") :
			t.fg("error", "✗");

		const agent = agentLabel(r);
		const model = r.summary.results[0]?.model ?? "";
		const modelShort = model.includes("/") ? model.split("/").pop()! : model;

		const parts = [statusIcon, t.fg("accent", agent), t.fg("dim", elapsed)];
		if (modelShort) parts.push(t.fg("muted", modelShort));

		const exitCodes = r.summary.results
			.filter(res => res.exitCode >= 0)
			.map(res => res.exitCode);
		if (exitCodes.length > 0) {
			const allZero = exitCodes.every(c => c === 0);
			parts.push(t.fg(allZero ? "success" : "error", `exit=${exitCodes.join(",")}`));
		}

		return truncateToWidth(parts.join("  "), maxWidth);
	}

	// ── Helpers ────────────────────────────────────────────────────────

	private getSortedRuns(): RunRecord[] {
		return this.registry.getAll().sort((a, b) => {
			if (a.status === "running" && b.status !== "running") return -1;
			if (b.status === "running" && a.status !== "running") return 1;
			return b.startedAt - a.startedAt;
		});
	}

	private clampRunListScroll(total: number): void {
		const maxScroll = Math.max(0, total - MAX_RUNS_VISIBLE);
		this.runListScroll = Math.max(0, Math.min(this.runListScroll, maxScroll));
		// Ensure selected item is visible
		if (this.selectedIndex < this.runListScroll) {
			this.runListScroll = this.selectedIndex;
		} else if (this.selectedIndex >= this.runListScroll + MAX_RUNS_VISIBLE) {
			this.runListScroll = this.selectedIndex - MAX_RUNS_VISIBLE + 1;
		}
	}

	// ── Input handling ─────────────────────────────────────────────────

	handleInput(data: string): void {
		const runs = this.getSortedRuns();

		if (matchesKey(data, "escape")) {
			this.dispose();
			this.done();
			return;
		}

		// j/k — select run
		if (matchesKey(data, "j")) {
			if (this.selectedIndex < runs.length - 1) {
				this.selectedIndex++;
				this.detailScroll = 0;
			}
			return;
		}
		if (matchesKey(data, "k")) {
			if (this.selectedIndex > 0) {
				this.selectedIndex--;
				this.detailScroll = 0;
			}
			return;
		}

		// J/K — scroll detail pane
		if (matchesKey(data, "shift+j")) {
			this.detailScroll++;
			return;
		}
		if (matchesKey(data, "shift+k")) {
			if (this.detailScroll > 0) this.detailScroll--;
			return;
		}

		// c — cancel selected run
		if (matchesKey(data, "c")) {
			const selected = runs[this.selectedIndex];
			if (selected && selected.status === "running") {
				this.registry.cancel(selected.runId);
			}
			return;
		}
	}

	// ── Auto-refresh ───────────────────────────────────────────────────

	private startAutoRefresh(): void {
		this.refreshTimer = setInterval(() => {
			if (this.registry.getActive().length > 0) {
				this.debouncedRender();
			}
		}, 500);
	}

	private debouncedRender(): void {
		if (this.renderTimeout) clearTimeout(this.renderTimeout);
		this.renderTimeout = setTimeout(() => {
			this.renderTimeout = undefined;
			this.tui.requestRender();
		}, 16);
	}

	invalidate(): void {
		// No-op: we don't cache lines, render() is always fresh
	}

	dispose(): void {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
			this.refreshTimer = undefined;
		}
		if (this.renderTimeout) {
			clearTimeout(this.renderTimeout);
			this.renderTimeout = undefined;
		}
	}
}
