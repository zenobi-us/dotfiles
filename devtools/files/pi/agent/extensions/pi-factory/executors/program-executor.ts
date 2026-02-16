import { highlightCode, type ExtensionContext } from "@mariozechner/pi-coding-agent";
import { matchesKey, truncateToWidth, wrapTextWithAnsi } from "@mariozechner/pi-tui";
import { FactoryError, toErrorDetails } from "../errors.js";
import type { ObservabilityStore } from "../observability.js";
import { createProgramRuntime, loadProgramModule } from "../runtime.js";
import type { ExecutionResult, RunSummary } from "../types.js";

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

function isExecutionResult(v: unknown): v is ExecutionResult {
	return isRecord(v) && typeof v.taskId === "string" && typeof v.agent === "string";
}

// ── Confirmation UI ────────────────────────────────────────────────────

export async function confirmExecution(ctx: ExtensionContext, code: string): Promise<{ approved: boolean; reason?: string }> {
	if (!ctx.hasUI) return { approved: true };

	const lines = highlightCode(code, "typescript");
	const displayLines = lines.length > 0 ? lines : code.split("\n");

	const result = await ctx.ui.custom<{ approved: boolean; reason?: string }>(
		(tui, theme, _keybindings, done) => {
			let offset = 0;
			let collectingReason = false;
			let reason = "";

			const codeRows = () => Math.max(8, Math.min(42, tui.terminal.rows - 14));
			const clamp = () => {
				offset = Math.max(0, Math.min(offset, Math.max(0, displayLines.length - codeRows())));
			};
			const boxLine = (text: string, w: number) => `│ ${truncateToWidth(text, w, "…", true)} │`;

			return {
				render(width: number) {
					clamp();
					const totalW = Math.max(40, width);
					const contentW = Math.max(20, totalW - 4);
					const rows = codeRows();
					const end = Math.min(displayLines.length, offset + rows);
					const out: string[] = [];

					out.push(`┌${"─".repeat(totalW - 2)}┐`);
					for (const l of wrapTextWithAnsi(theme.bold("Run subagent program?"), contentW)) out.push(boxLine(l, contentW));
					for (const l of wrapTextWithAnsi(
						theme.fg("muted", `Lines ${offset + 1}-${end} / ${displayLines.length}`),
						contentW,
					))
						out.push(boxLine(l, contentW));
					out.push(boxLine(theme.fg("dim", ""), contentW));

					for (let i = offset; i < end; i++) {
						out.push(boxLine(`${theme.fg("dim", String(i + 1).padStart(4, " "))} ${displayLines[i]}`, contentW));
					}

					out.push(boxLine(theme.fg("dim", ""), contentW));
					if (collectingReason) {
						for (const l of wrapTextWithAnsi(theme.fg("warning", "Reject reason (optional):"), contentW))
							out.push(boxLine(l, contentW));
						for (const l of wrapTextWithAnsi(`${theme.fg("accent", "> ")}${reason || theme.fg("dim", "(empty)")}`, contentW))
							out.push(boxLine(l, contentW));
						for (const l of wrapTextWithAnsi(theme.fg("muted", "Enter reject • Backspace edit • Esc back"), contentW))
							out.push(boxLine(l, contentW));
					} else {
						for (const l of wrapTextWithAnsi(
							theme.fg("muted", "↑/↓ scroll • Enter/Y confirm • N reject • Esc cancel"),
							contentW,
						))
							out.push(boxLine(l, contentW));
					}
					out.push(`└${"─".repeat(totalW - 2)}┘`);
					return out;
				},
				invalidate() {},
				handleInput(data: string) {
					if (collectingReason) {
						if (matchesKey(data, "return")) { done({ approved: false, reason: reason.trim() || undefined }); return; }
						if (matchesKey(data, "escape")) { collectingReason = false; tui.requestRender(); return; }
						if (matchesKey(data, "ctrl+c")) { done({ approved: false }); return; }
						if (matchesKey(data, "backspace") || data === "\x7f") { reason = reason.slice(0, -1); tui.requestRender(); return; }
						if (data.length === 1 && data >= " " && data !== "\x7f") { reason += data; tui.requestRender(); }
						return;
					}
					if (matchesKey(data, "return") || data === "y" || data === "Y") { done({ approved: true }); return; }
					if (data === "n" || data === "N") { collectingReason = true; tui.requestRender(); return; }
					if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) { done({ approved: false }); return; }
					if (matchesKey(data, "up") || data === "k") { offset -= 1; tui.requestRender(); return; }
					if (matchesKey(data, "down") || data === "j") { offset += 1; tui.requestRender(); return; }
					if (matchesKey(data, "pageUp")) { offset -= codeRows(); tui.requestRender(); return; }
					if (matchesKey(data, "pageDown")) { offset += codeRows(); tui.requestRender(); }
				},
			};
		},
		{ overlay: true, overlayOptions: { anchor: "center", width: "92%", maxHeight: "90%", margin: 1 } },
	);

	return result ?? { approved: false };
}

// ── Program execution ──────────────────────────────────────────────────

export async function executeProgram(input: {
	ctx: ExtensionContext;
	runId: string;
	code: string;
	task: string;
	cwd: string;
	obs: ObservabilityStore;
	onUpdate?: (summary: RunSummary) => void;
	signal?: AbortSignal;
	parentSessionPath?: string;
	sessionDir?: string;
	skipConfirmation?: boolean;
}): Promise<RunSummary> {
	const { ctx, runId, code, obs } = input;
	const resultsByTask = new Map<string, ExecutionResult>();
	const results: ExecutionResult[] = [];

	const sync = () => {
		results.splice(0, results.length, ...resultsByTask.values());
	};
	const emit = (status: RunSummary["status"], error?: RunSummary["error"]) => {
		sync();
		input.onUpdate?.({ runId, status, results: [...results], observability: obs.toSummary(runId), error });
	};

	let runtime: ReturnType<typeof createProgramRuntime> | null = null;
	try {
		if (!input.skipConfirmation) {
			const confirmation = await confirmExecution(ctx, code);
			if (!confirmation.approved) {
				throw new FactoryError({
					code: "CONFIRMATION_REJECTED",
					message: confirmation.reason ? `Cancelled: ${confirmation.reason}` : "Cancelled by user.",
					recoverable: true,
				});
			}
		}

		emit("running");
		obs.push(runId, "info", "program:start", { codeBytes: code.length });

		// Write program source to artifacts for later inspection
		obs.writeArtifact(runId, "program.ts", code);

		runtime = createProgramRuntime(ctx, runId, obs, {
			defaultSignal: input.signal,
			onTaskUpdate: (result) => {
				resultsByTask.set(result.taskId, result);
				emit("running");
			},
			parentSessionPath: input.parentSessionPath,
			sessionDir: input.sessionDir,
		});

		const module = await loadProgramModule(code);

		let programResult: unknown;
		const runPromise = module.run({ task: input.task }, runtime!);
		// Prevent unhandled rejection if runPromise rejects before being awaited
		runPromise.catch(() => {});

		if (input.signal) {
			if (input.signal.aborted) {
				throw new FactoryError({ code: "CANCELLED", message: "Cancelled before execution.", recoverable: true });
			}
			let onAbort: (() => void) | undefined;
			const cancelled = new Promise<never>((_resolve, reject) => {
				onAbort = () => reject(new FactoryError({ code: "CANCELLED", message: "Cancelled.", recoverable: true }));
				input.signal?.addEventListener("abort", onAbort, { once: true });
			});
			try {
				programResult = await Promise.race([runPromise, cancelled]);
			} finally {
				if (onAbort) input.signal?.removeEventListener("abort", onAbort);
			}
		} else {
			programResult = await runPromise;
		}

		if (isRecord(programResult) && Array.isArray(programResult.results)) {
			for (const r of programResult.results) {
				if (!isExecutionResult(r)) continue;
				resultsByTask.set(r.taskId, r);
			}
		}

		emit("done");
		return { runId, status: "done", results, observability: obs.toSummary(runId), metadata: { modulePath: module.modulePath } };
	} catch (error) {
		const details = toErrorDetails(error);
		obs.push(runId, "error", details.message, { code: details.code });
		const status = details.code === "CANCELLED" || details.code === "CONFIRMATION_REJECTED" ? "cancelled" : "failed";
		emit(status, details);
		return { runId, status, results, observability: obs.toSummary(runId), error: details };
	} finally {
		if (runtime) {
			try { await runtime.shutdown(true); } catch (e) { obs.push(runId, "warning", "shutdown_failed", { error: String(e) }); }
		}
	}
}
