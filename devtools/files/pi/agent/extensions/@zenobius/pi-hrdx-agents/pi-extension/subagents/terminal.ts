import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
	closeHrdxSurface,
	createHrdxSurface,
	createHrdxWorktree,
	focusHrdxWorkspace,
	getHrdxPaneProcessInfo,
	inspectHrdxPane,
	isHrdxAvailable,
	readHrdxScreen,
	readHrdxScreenAsync,
	sendHrdxEscape,
	sendHrdxText,
	waitForHrdxPane,
	waitForHrdxPaneAbsence,
	type HrdxPaneProcessInfo,
	type HrdxWorktreeSurface,
} from "./hrdx.ts";

export type PaneId = string;
export type SplitDirection = "right" | "down";
export type { HrdxWorktreeSurface };

const SETUP_HINT = "Start pi inside hrdx (`hrdx`, then run `pi`).";

export function isTerminalAvailable(): boolean { return isHrdxAvailable(); }
export function terminalSetupHint(): string { return SETUP_HINT; }

function assertTerminalAvailable(): void {
	if (!isTerminalAvailable()) throw new Error(`hrdx is not available. ${SETUP_HINT}`);
}

export function shellQuote(value: string): string { return "'" + value.replace(/'/g, "'\\''") + "'"; }
export function createSubagentPane(name: string): PaneId { assertTerminalAvailable(); return createHrdxSurface(name); }
export function createSubagentWorktree(name: string, cwd: string, branch: string, base: string): HrdxWorktreeSurface {
	assertTerminalAvailable();
	return createHrdxWorktree(name, cwd, branch, base);
}
export function splitCurrentPane(_name: string, _direction: SplitDirection): PaneId {
	throw new Error("hrdx backend does not support splitting the current pane");
}
export function renameCurrentTab(_title: string): void { assertTerminalAvailable(); }
export function renameCurrentWorkspace(_title: string): void { assertTerminalAvailable(); }
export function focusWorkspace(workspaceId: string): void { assertTerminalAvailable(); focusHrdxWorkspace(workspaceId); }
export function runInPane(paneId: PaneId, command: string): void { assertTerminalAvailable(); sendHrdxText(paneId, command, true); }
export function interruptPane(paneId: PaneId): void { assertTerminalAvailable(); sendHrdxEscape(paneId); }

export function runScriptInPane(paneId: PaneId, command: string, options?: { scriptPath?: string; scriptPreamble?: string }): string {
	const scriptPath = options?.scriptPath ?? join(tmpdir(), "pi-hrdx-subagent-scripts", `cmd-${Date.now()}-${Math.random().toString(16).slice(2, 8)}.sh`);
	mkdirSync(dirname(scriptPath), { recursive: true });
	const scriptLines = ["#!/bin/bash"];
	if (options?.scriptPreamble) scriptLines.push(options.scriptPreamble.trimEnd());
	scriptLines.push(command);
	writeFileSync(scriptPath, `${scriptLines.join("\n")}\n`, { mode: 0o755 });
	runInPane(paneId, `bash ${shellQuote(scriptPath)}`);
	return scriptPath;
}

export function readPane(paneId: PaneId, _lines = 50): string { assertTerminalAvailable(); return readHrdxScreen(paneId); }
export async function readPaneAsync(paneId: PaneId, _lines = 50): Promise<string> { assertTerminalAvailable(); return readHrdxScreenAsync(paneId); }
export type { HrdxPaneInspection as PaneInspection, HrdxAgentStatus as HrdxAgentStatus } from "./hrdx.ts";
export async function inspectPane(paneId: PaneId): Promise<import("./lifecycle.ts").PaneInspection> {
	assertTerminalAvailable();
	const result = await inspectHrdxPane(paneId);
	if (result.kind === "present") return { ...result, observedAt: Date.now() };
	return result;
}
export function closePane(paneId: PaneId): void { assertTerminalAvailable(); closeHrdxSurface(paneId); }
export type { HrdxPaneProcessInfo as HrdxPaneProcessInfo };
export function getPaneProcessInfo(paneId: PaneId): HrdxPaneProcessInfo { assertTerminalAvailable(); return getHrdxPaneProcessInfo(paneId); }
export async function waitForShellReady(paneId: PaneId, _options?: { timeoutMs?: number; intervalMs?: number; signal?: AbortSignal }): Promise<void> { assertTerminalAvailable(); return waitForHrdxPane(paneId); }
export async function waitForPiReady(paneId: PaneId, _sessionFile: string, _cwd: string): Promise<void> { assertTerminalAvailable(); return waitForHrdxPane(paneId); }
export async function waitForPaneAbsence(paneId: PaneId, _options?: { timeoutMs?: number; intervalMs?: number }): Promise<boolean> { assertTerminalAvailable(); return waitForHrdxPaneAbsence(paneId); }
export { isProcessAlive, waitForProcessesExit } from "./processes.ts";
