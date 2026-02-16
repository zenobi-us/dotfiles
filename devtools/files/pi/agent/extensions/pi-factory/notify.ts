import fs from "node:fs";
import path from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Box, Text } from "@mariozechner/pi-tui";
import type { RunSummary } from "./types.js";
import type { RunRegistry } from "./registry.js";
import { formatElapsed, statusIcon, agentLabel } from "./format.js";

const CUSTOM_TYPE = "pi-factory:complete";
const TEXT_TRUNCATE = 500;

function elapsedMs(summary: RunSummary): number {
	const obs = summary.observability;
	if (obs?.startedAt) {
		const end = obs.endedAt ?? Date.now();
		return end - obs.startedAt;
	}
	return 0;
}

function totalCost(summary: RunSummary): number {
	return summary.results.reduce((sum, r) => sum + (r.usage?.cost ?? 0), 0);
}

const SUMMARY_TRUNCATE = 200;

function writeResultsFile(summary: RunSummary): string | null {
	const artifactsDir = summary.observability?.artifactsDir;
	if (!artifactsDir) return null;
	try {
		const resultsPath = path.join(artifactsDir, "results.md");
		const lines: string[] = [`# ${agentLabel(summary)} — ${summary.status}\n`];
		for (const r of summary.results) {
			const model = r.model ? ` (${r.model})` : "";
			lines.push(`## ${r.agent}${model}\n`);
			if (r.task) lines.push(`**Task:** ${r.task}\n`);
			lines.push(r.text || "(no output)");
			if (r.sessionPath) lines.push(`\n**Session:** ${r.sessionPath}`);
			lines.push("");
		}
		fs.writeFileSync(resultsPath, lines.join("\n"));
		return resultsPath;
	} catch {
		return null;
	}
}

function buildContentLine(summary: RunSummary): string {
	const name = agentLabel(summary);
	const elapsed = formatElapsed(elapsedMs(summary));
	if (summary.status === "cancelled") {
		const reason = summary.error?.message ?? "Cancelled by user.";
		return `Subagent '${name}' cancelled (${elapsed}). ${reason} Do not investigate — move on or retry with a different approach.`;
	}

	const resultsPath = writeResultsFile(summary);
	const parts = [`Subagent '${name}' ${summary.status} (${elapsed}).`];

	// Include error message so the LLM knows what went wrong and can fix its code
	if (summary.error) {
		parts.push(`Error: ${summary.error.code}: ${summary.error.message}`);
	}

	// Truncated summary per child
	if (summary.results.length > 0) {
		for (const r of summary.results) {
			const snippet = r.text
				? r.text.slice(0, SUMMARY_TRUNCATE) + (r.text.length > SUMMARY_TRUNCATE ? "…" : "")
				: "(no output)";
			parts.push(`[${r.agent}] ${snippet}`);
		}
	}

	if (resultsPath) {
		parts.push(`Full results: ${resultsPath}`);
	}

	return parts.join("\n");
}

export function registerMessageRenderer(pi: ExtensionAPI): void {
	pi.registerMessageRenderer(CUSTOM_TYPE, (message, { expanded }, theme) => {
		const summaries = (message.details as { summaries: RunSummary[] } | undefined)?.summaries ?? [];

		const lines: string[] = [];

		for (const summary of summaries) {
			const icon = statusIcon(summary.status);
			const name = agentLabel(summary);
			const elapsed = formatElapsed(elapsedMs(summary));
			const color = summary.status === "done" ? "success" : summary.status === "failed" ? "error" : "warning";

			lines.push(`${theme.fg(color, icon)} ${theme.fg("accent", name)}  ${summary.status}  ${theme.fg("dim", elapsed)}`);

			if (expanded) {
				const resultText = summary.results[0]?.text;
				if (resultText) {
					const truncated = resultText.length > TEXT_TRUNCATE ? resultText.slice(0, TEXT_TRUNCATE) + "…" : resultText;
					lines.push(theme.fg("dim", `  ${truncated.replace(/\n/g, "\n  ")}`));
				}

				const model = summary.results[0]?.model;
				if (model) {
					lines.push(theme.fg("dim", `  model: ${model}`));
				}

				const cost = totalCost(summary);
				if (cost > 0) {
					lines.push(theme.fg("dim", `  cost: $${cost.toFixed(4)}`));
				}

				if (summaries.length > 1) {
					lines.push("");
				}
			}
		}

		const box = new Box(1, 1, (t) => theme.bg("customMessageBg", t));
		box.addChild(new Text(lines.join("\n"), 0, 0));
		return box;
	});
}

export function notifyCompletion(pi: ExtensionAPI, registry: RunRegistry, summary: RunSummary): void {
	const content = buildContentLine(summary);

	pi.sendMessage(
		{
			customType: CUSTOM_TYPE,
			content,
			display: true,
			details: { summaries: [summary] },
		},
		{ triggerTurn: true, deliverAs: "followUp" },
	);

	registry.acknowledge(summary.runId);
}
