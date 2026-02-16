import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { keyHint } from "@mariozechner/pi-coding-agent";
import { Container, Spacer, Text } from "@mariozechner/pi-tui";
import { SubagentSchema, type SubagentParams, validateParams } from "./contract.js";
import { toErrorDetails } from "./errors.js";
import { ObservabilityStore } from "./observability.js";
import { RunRegistry } from "./registry.js";
import { confirmExecution, executeProgram } from "./executors/program-executor.js";
import { FactoryWidget } from "./widget.js";
import { FactoryOverlay } from "./overlay.js";
import { registerMessageRenderer, notifyCompletion } from "./notify.js";
import type { RunSummary } from "./types.js";

function writeRunJson(summary: RunSummary): void {
	const dir = summary.observability?.artifactsDir;
	if (!dir) return;
	try {
		const data = {
			runId: summary.runId,
			status: summary.status,
			task: (summary.metadata as any)?.task,
			startedAt: summary.observability?.startedAt,
			completedAt: summary.observability?.endedAt ?? Date.now(),
			results: summary.results.map(r => ({
				agent: r.agent, task: r.task, model: r.model,
				exitCode: r.exitCode, text: r.text,
				sessionPath: r.sessionPath, usage: r.usage,
			})),
			error: summary.error,
		};
		fs.writeFileSync(path.join(dir, "run.json"), JSON.stringify(data, null, 2));
	} catch {}
}

function generateRunId(): string {
	return `factory-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readEnabledModels(): string[] {
	try {
		const p = path.join(os.homedir(), ".pi", "agent", "settings.json");
		if (!fs.existsSync(p)) return [];
		const parsed: unknown = JSON.parse(fs.readFileSync(p, "utf-8"));
		if (typeof parsed === "object" && parsed !== null && "enabledModels" in parsed && Array.isArray((parsed as any).enabledModels)) {
			return (parsed as any).enabledModels.filter((m: unknown): m is string => typeof m === "string" && (m as string).length > 0);
		}
		return [];
	} catch {
		return [];
	}
}

// ── Text helpers ───────────────────────────────────────────────────────

function buildPrimaryContent(summary: RunSummary, forUpdate = false): string {
	if (summary.error) return `${summary.error.code}: ${summary.error.message}`;
	if (summary.results.length === 0) return forUpdate ? "(running...)" : "Completed.";
	if (summary.results.length === 1) {
		return summary.results[0].text || (forUpdate ? "(running...)" : "Completed.");
	}
	const lines = [`Program completed with ${summary.results.length} result(s):`];
	for (const r of summary.results) {
		lines.push(r.text ? `\n[${r.agent}]\n${r.text}` : `\n[${r.agent}] (no output)`);
	}
	return lines.join("\n").trim();
}

function renderCollapsed(summary: RunSummary, expanded: boolean, theme: any): Text {
	const icon =
		summary.status === "done" ? theme.fg("success", "✓") :
		summary.status === "running" ? theme.fg("warning", "⏳") :
		summary.status === "cancelled" ? theme.fg("warning", "◼") :
		theme.fg("error", "✗");

	let out = `${icon} ${theme.fg("toolTitle", theme.bold("subagent"))}`;
	out += ` ${theme.fg("muted", `[${summary.runId}]`)}`;
	if (summary.error) out += `\n${theme.fg("error", `${summary.error.code}: ${summary.error.message}`)}`;

	if (summary.results.length === 0) {
		out += `\n${theme.fg("muted", "(no results yet)")}`;
	} else {
		for (const r of summary.results.slice(-5)) {
			const rIcon =
				r.exitCode === 0 ? theme.fg("success", "✓") :
				summary.status === "running" || r.exitCode < 0 ? theme.fg("warning", "⏳") :
				theme.fg("error", "✗");
			const model = r.model ? ` ${theme.fg("muted", `[${r.model}]`)}` : "";
			out += `\n${rIcon} ${theme.fg("accent", r.agent)}${model} ${theme.fg("dim", r.task.slice(0, 80))}`;
		}
	}

	if (!expanded) out += `\n${theme.fg("muted", keyHint("expandTools", "to expand"))}`;
	return new Text(out, 0, 0);
}

function renderExpanded(summary: RunSummary, theme: any): Container {
	const container = new Container();
	container.addChild(renderCollapsed(summary, true, theme));
	container.addChild(new Spacer(1));

	if (summary.observability) {
		container.addChild(new Text(theme.fg("muted", "── observability ──"), 0, 0));
		for (const ev of summary.observability.events.slice(-30)) {
			const time = new Date(ev.time).toISOString();
			container.addChild(new Text(`${theme.fg("muted", time)} ${theme.fg("accent", ev.type)} ${theme.fg("toolOutput", ev.message)}`, 0, 0));
		}
		if (summary.observability.artifacts.length > 0) {
			container.addChild(new Spacer(1));
			container.addChild(new Text(theme.fg("muted", "artifacts:"), 0, 0));
			for (const a of summary.observability.artifacts) container.addChild(new Text(theme.fg("dim", `- ${a}`), 0, 0));
		}
	}

	if (summary.results.length > 0) {
		container.addChild(new Spacer(1));
		container.addChild(new Text(theme.fg("muted", "── outputs ──"), 0, 0));
		for (const r of summary.results) {
			container.addChild(new Spacer(1));
			container.addChild(new Text(`${theme.fg("accent", r.agent)} ${theme.fg("muted", `model=${r.model ?? "?"}`)}`, 0, 0));
			container.addChild(new Text(theme.fg("dim", r.task), 0, 0));
			if (r.text) container.addChild(new Text(r.text, 0, 0));
			if (r.sessionPath) container.addChild(new Text(theme.fg("dim", `session: ${r.sessionPath}`), 0, 0));
		}
	}

	return container;
}

function loadHistoricalRuns(ctx: ExtensionContext, registry: RunRegistry): void {
	const sessionDir = ctx.sessionManager.getSessionDir();
	if (!sessionDir) return;
	const factoryDir = path.join(sessionDir, ".factory");
	if (!fs.existsSync(factoryDir)) return;
	try {
		for (const entry of fs.readdirSync(factoryDir)) {
			const runJsonPath = path.join(factoryDir, entry, "run.json");
			if (!fs.existsSync(runJsonPath)) continue;
			try {
				const data = JSON.parse(fs.readFileSync(runJsonPath, "utf-8"));
				registry.loadHistorical({
					runId: data.runId,
					status: data.status ?? "done",
					summary: {
						runId: data.runId,
						status: data.status ?? "done",
						results: data.results ?? [],
						error: data.error,
						metadata: { task: data.task },
					},
					startedAt: data.startedAt ?? Date.now(),
					completedAt: data.completedAt,
					acknowledged: true,
					task: data.task,
				});
			} catch {}
		}
	} catch {}
}

// ── Extension entry point ──────────────────────────────────────────────

// ── Extension config ───────────────────────────────────────────────────
// Edit this object to customize behavior. It lives here so it's version-controlled
// alongside the extension code.

export const config = {
	/** Extra text appended to the tool description. Use for model selection hints, project conventions, etc. */
	prompt: "Use opus for most subagent operations, especially if they entail making changes across multiple files. If you need to search you can use faster models like glm-4.7 (cerebras one). If you need to use look at and reason over images (a screenshot is referenced) use gemini flash to see the changes.",
};

// ────────────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	// Register bundled skills from the skills/ subdirectory
	const extensionDir = import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname);
	const skillsDir = path.join(extensionDir, "skills");
	pi.on("resources_discover", () => {
		if (fs.existsSync(skillsDir)) {
			return { skillPaths: [skillsDir] };
		}
		return {};
	});
	const observability = new ObservabilityStore();
	const registry = new RunRegistry();
	const widget = new FactoryWidget();
	const enabledModels = readEnabledModels();
	const modelsText = enabledModels.length > 0 ? enabledModels.join(", ") : "(none in settings.json)";

	// Keep a reference to the current context for widget/notification updates
	let currentCtx: ExtensionContext | undefined;
	let pollTimer: ReturnType<typeof setInterval> | undefined;

	// Register the message renderer for completion notifications
	registerMessageRenderer(pi);

	// Widget polling — updates running jobs every 250ms
	function startPolling() {
		if (pollTimer) return;
		pollTimer = setInterval(() => {
			if (!currentCtx) return;
			const runs = registry.getVisible();
			widget.update(runs, currentCtx);
			// Stop polling if nothing is running
			if (registry.getActive().length === 0) {
				stopPolling();
			}
		}, 250);
	}

	function stopPolling() {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = undefined;
		}
	}

	// Lifecycle hooks
	pi.on("session_start", async (_event, ctx) => {
		currentCtx = ctx;
		loadHistoricalRuns(ctx, registry);
	});

	pi.on("session_switch", async (_event, ctx) => {
		currentCtx = ctx;
		registry.clearHistorical();
		loadHistoricalRuns(ctx, registry);
		widget.update(registry.getVisible(), ctx);
		if (registry.getActive().length > 0) startPolling();
		else stopPolling();
	});

	pi.on("session_shutdown", async () => {
		// Cancel all active runs
		for (const run of registry.getActive()) {
			registry.cancel(run.runId);
		}
		stopPolling();
	});

	// /factory command — overview of all runs (overlay UI)
	pi.registerCommand("factory", {
		description: "Show subagent run status",
		handler: async (_args, ctx) => {
			await ctx.ui.custom<void>(
				(tui, theme, _kb, done) => new FactoryOverlay(tui, theme, registry, done),
				{
					overlay: true,
					overlayOptions: {
						width: "90%",
						minWidth: 60,
						maxHeight: "95%",
						anchor: "center",
					},
				},
			);
		},
	});

	pi.registerTool({
		name: "subagent",
		label: "Subagent",
		description: [
			"Spawn subagents for delegated or orchestrated work.",
			`Enabled models: ${modelsText}`,
			"Runs TypeScript with rt.spawn/join/parallel/sequence for multi-agent orchestration.",
			"Code must export async run(input, rt). Requires user confirmation before execution.",
			"Each rt.spawn() needs: agent, systemPrompt, task, cwd, model. Use process.cwd() for cwd.",
			"Context flow: each subagent gets the parent session path and can use search_thread to explore it. Each subagent's session is persisted and available via result.sessionPath. Result text is auto-populated on result.text.",
			"Async by default: returns immediately with a runId. Results are delivered via notification when complete.",
			"Model selection: match model capability to task complexity. Use smaller/faster models for simple tasks, stronger models for complex reasoning. Vary your choices across the enabled models \u2014 don't default to one.",
			...(config.prompt ? [config.prompt] : []),
		].join(" "),
		parameters: SubagentSchema,

		async execute(_toolCallId, rawParams, signal, onUpdate, ctx): Promise<AgentToolResult<RunSummary>> {
			currentCtx = ctx;
			const params = validateParams(rawParams);
			const runId = generateRunId();
			const piSessionDir = ctx.sessionManager.getSessionDir() ?? undefined;
			observability.createRun(runId, true, piSessionDir);
			observability.setStatus(runId, "running", "run:start");

			const parentSessionPath = ctx.sessionManager.getSessionFile() ?? undefined;
			const run = observability.get(runId);
			const sessionDir = run?.artifactsDir ? path.join(run.artifactsDir, "sessions") : undefined;

			const emitUpdate = (summary: RunSummary) => {
				onUpdate?.({
					content: [{ type: "text", text: buildPrimaryContent(summary, true) }],
					details: summary,
				});
				// Update registry so overlay reads live data
				registry.updateSummary(runId, summary);
				// Also update widget with latest state
				widget.update(registry.getVisible(), ctx);
			};

			// Confirm BEFORE going async so user sees the dialog
			const confirmation = await confirmExecution(ctx, params.code);
			if (!confirmation.approved) {
				const msg = confirmation.reason ? `Cancelled: ${confirmation.reason}` : "Cancelled by user.";
				return {
					content: [{ type: "text", text: msg }],
					details: { runId, status: "cancelled" as const, results: [], error: { code: "CONFIRMATION_REJECTED", message: msg, recoverable: true } },
				};
			}

			const abort = new AbortController();

			// Wire parent signal to our abort controller
			if (signal) {
				if (signal.aborted) abort.abort();
				else signal.addEventListener("abort", () => abort.abort(), { once: true });
			}

			const promise = executeProgram({
				ctx,
				runId,
				code: params.code,
				task: params.task,
				cwd: ctx.cwd,
				obs: observability,
				onUpdate: emitUpdate,
				signal: abort.signal,
				parentSessionPath,
				sessionDir,
				skipConfirmation: true,
			});

			// Register in the registry
			const initialSummary: RunSummary = { runId, status: "running", results: [], observability: observability.toSummary(runId) };
			registry.register(runId, initialSummary, promise, abort, { task: params.task });

			// Wire completion: update observability, widget, and notify
			promise.then(
				(summary) => {
					try {
						observability.setStatus(runId, summary.status === "done" ? "done" : summary.status === "cancelled" ? "cancelled" : "failed");
						const fullSummary = { ...summary, observability: observability.toSummary(runId), metadata: { task: params.task } };
						registry.complete(runId, fullSummary);
						widget.update(registry.getVisible(), ctx);
						notifyCompletion(pi, registry, fullSummary);
						writeRunJson(fullSummary);
						widget.update(registry.getVisible(), ctx);
					} catch { /* shutting down */ }
				},
				(err) => {
					try {
						const details = toErrorDetails(err);
						observability.setStatus(runId, details.code === "CANCELLED" ? "cancelled" : "failed");
						const failedSummary: RunSummary = { runId, status: "failed", results: [], error: details, observability: observability.toSummary(runId), metadata: { task: params.task } };
						registry.fail(runId, details);
						notifyCompletion(pi, registry, failedSummary);
						writeRunJson(failedSummary);
						widget.update(registry.getVisible(), ctx);
					} catch { /* shutting down */ }
				},
			);

			// Start polling for widget updates
			startPolling();

			// Update widget immediately
			widget.update(registry.getVisible(), ctx);

			// Return immediately with artifact paths so orchestrator can check progress
			const artifactsDir = observability.get(runId)?.artifactsDir;
			const lines = [`Spawned '${params.task}' → ${runId}. Running async — results will be delivered when complete.`];
			if (artifactsDir) {
				lines.push(`Artifacts: ${artifactsDir}`);
				lines.push(`Status: ${artifactsDir}/run.json (written on completion)`);
				lines.push(`Sessions: ${artifactsDir}/sessions/`);
			}
			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: initialSummary,
			};
		},

		renderCall(args, theme) {
			const asyncLabel = ` ${theme.fg("dim", "(async)")}`;
			return new Text(`${theme.fg("toolTitle", theme.bold("subagent"))} ${theme.fg("accent", args.task)}${asyncLabel}`, 0, 0);
		},

		renderResult(result, options, theme) {
			const details = result.details;
			if (!details) {
				const txt = result.content[0];
				return new Text(txt?.type === "text" ? txt.text : "(no output)", 0, 0);
			}
			if (options.expanded) return renderExpanded(details, theme);
			return renderCollapsed(details, false, theme);
		},
	});
}
