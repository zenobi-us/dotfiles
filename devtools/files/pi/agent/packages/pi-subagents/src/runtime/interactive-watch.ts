import { existsSync, readFileSync, rmSync, statSync } from "node:fs";
import {
	closeSurface,
	consumeSubagentExitSignal,
	pollForExit,
} from "../mux.ts";
import type { RunningSubagent, SubagentResult } from "../types.ts";
import { findLastSubagentOutput, getNewEntries } from "../session/session.ts";
import { traceSubagentLaunch } from "../launch/trace.ts";

export interface InteractiveWatchRuntime {
	cleanupNoSessionSessionFile(running: RunningSubagent): void;
}

export async function watchSubagent(
	running: RunningSubagent,
	runtime: InteractiveWatchRuntime,
	signal: AbortSignal,
): Promise<SubagentResult> {
	const { name, task, surface, startTime, sessionFile } = running;
	if (!surface)
		throw new Error("watchSubagent called on a background agent (no surface)");

	try {
		traceSubagentLaunch("interactive.watch.start", { name, surface, sessionFile, signalAborted: signal.aborted });
		const pollResult = await pollForExit(surface, signal, {
			interval: 1000,
			sessionFile,
			doneSentinelFile: running.doneSentinelFile,
			onTick() {
				try {
					if (existsSync(sessionFile)) {
						const stat = statSync(sessionFile);
						const raw = readFileSync(sessionFile, "utf8");
						running.entries = raw
							.split("\n")
							.filter((line) => line.trim()).length;
						running.bytes = stat.size;
					}
				} catch {}
			},
		});

		traceSubagentLaunch("interactive.watch.pollResult", { name, surface, sessionFile, pollResult });
		const elapsed = Math.floor((Date.now() - startTime) / 1000);
		let summary: string;
		if (!running.noSession && existsSync(sessionFile)) {
			const allEntries = getNewEntries(
				sessionFile,
				running.launchEntryCount ?? 0,
			);
			summary =
				findLastSubagentOutput(allEntries) ??
				(pollResult.exitCode !== 0
					? `Sub-agent exited with code ${pollResult.exitCode}`
					: "Sub-agent exited without output");
		} else {
			summary =
				pollResult.exitCode !== 0
					? `Sub-agent exited with code ${pollResult.exitCode}`
					: "Sub-agent exited without output";
		}

		const errorMessage =
			pollResult.reason === "error" ? pollResult.errorMessage : undefined;
		const exitSignal =
			pollResult.outputTokens !== undefined
				? undefined
				: consumeSubagentExitSignal(sessionFile);
		cleanupDoneSentinel(running);
		try {
			closeSurface(surface);
		} catch {}
		runtime.cleanupNoSessionSessionFile(running);

		return {
			name,
			task,
			summary,
			sessionFile: running.noSession ? undefined : sessionFile,
			exitCode: pollResult.exitCode,
			elapsed,
			outputTokens: pollResult.outputTokens ?? exitSignal?.outputTokens,
			ping: pollResult.ping,
			errorMessage,
		};
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		traceSubagentLaunch("interactive.watch.error", { name, surface, sessionFile, errorMessage, signalAborted: signal.aborted });
		cleanupDoneSentinel(running);
		try {
			closeSurface(surface);
		} catch {}
		runtime.cleanupNoSessionSessionFile(running);

		if (signal.aborted) {
			return {
				name,
				task,
				summary: "Subagent cancelled.",
				exitCode: 1,
				elapsed: Math.floor((Date.now() - startTime) / 1000),
				outputTokens: 0,
				error: "cancelled",
			};
		}
		return {
			name,
			task,
			summary: `Subagent error: ${errorMessage}`,
			exitCode: 1,
			elapsed: Math.floor((Date.now() - startTime) / 1000),
			outputTokens: 0,
			error: errorMessage,
		};
	}
}

function cleanupDoneSentinel(running: RunningSubagent): void {
	if (!running.doneSentinelFile || !existsSync(running.doneSentinelFile)) return;
	try {
		rmSync(running.doneSentinelFile, { force: true });
	} catch {}
}
