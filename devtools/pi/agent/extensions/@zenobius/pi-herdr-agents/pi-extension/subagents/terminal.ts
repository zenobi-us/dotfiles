import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
	closeHerdrSurface,
	createHerdrSurface,
	createHerdrSurfaceSplit,
	createHerdrWorktree,
	focusHerdrWorkspace,
	getHerdrPaneProcessInfo,
	waitForHerdrPiReady,
	waitForHerdrShellReady,
	isHerdrAvailable,
	isProcessAlive,
	readHerdrScreen,
	readHerdrScreenAsync,
	inspectHerdrPane,
	renameHerdrTab,
	renameHerdrWorkspace,
	sendHerdrCommand,
	sendHerdrEscape,
	waitForHerdrPaneAbsence,
	waitForProcessesExit,
	type HerdrPaneProcessInfo,
} from "./herdr.ts";

export type PaneId = string;
export type SplitDirection = "right" | "down";
export type { HerdrWorktreeSurface } from "./herdr.ts";

const SETUP_HINT = "Start pi inside herdr (`herdr`, then run `pi`).";

export function isTerminalAvailable(): boolean {
	return isHerdrAvailable();
}

export function terminalSetupHint(): string {
	return SETUP_HINT;
}

function assertTerminalAvailable(): void {
	if (!isTerminalAvailable())
		throw new Error(`herdr is not available. ${SETUP_HINT}`);
}

export function shellQuote(value: string): string {
	return "'" + value.replace(/'/g, "'\\''") + "'";
}

/** Create a new herdr tab and return its root pane ID. */
export function createSubagentPane(name: string): PaneId {
	assertTerminalAvailable();
	return createHerdrSurface(name);
}

/** Create a Git worktree in its own herdr workspace and return its root surface. */
export function createSubagentWorktree(
	name: string,
	cwd: string,
	branch: string,
	base: string,
): import("./herdr.ts").HerdrWorktreeSurface {
	assertTerminalAvailable();
	return createHerdrWorktree(name, cwd, branch, base);
}

/** Split the current herdr pane and return the child pane ID. */
export function splitCurrentPane(
	name: string,
	direction: SplitDirection,
): PaneId {
	assertTerminalAvailable();
	return createHerdrSurfaceSplit(name, direction);
}

export function renameCurrentTab(title: string): void {
	assertTerminalAvailable();
	renameHerdrTab(title);
}

export function renameCurrentWorkspace(title: string): void {
	assertTerminalAvailable();
	renameHerdrWorkspace(title);
}

export function focusWorkspace(workspaceId: string): void {
	assertTerminalAvailable();
	focusHerdrWorkspace(workspaceId);
}

export function runInPane(paneId: PaneId, command: string): void {
	assertTerminalAvailable();
	sendHerdrCommand(paneId, command);
}

export function interruptPane(paneId: PaneId): void {
	assertTerminalAvailable();
	sendHerdrEscape(paneId);
}

export function runScriptInPane(
	paneId: PaneId,
	command: string,
	options?: { scriptPath?: string; scriptPreamble?: string },
): string {
	const scriptPath =
		options?.scriptPath ??
		join(
			tmpdir(),
			"pi-herdr-subagent-scripts",
			`cmd-${Date.now()}-${Math.random().toString(16).slice(2, 8)}.sh`,
		);
	mkdirSync(dirname(scriptPath), { recursive: true });

	const scriptLines = ["#!/bin/bash"];
	if (options?.scriptPreamble)
		scriptLines.push(options.scriptPreamble.trimEnd());
	scriptLines.push(command);
	writeFileSync(scriptPath, `${scriptLines.join("\n")}\n`, { mode: 0o755 });

	runInPane(paneId, `bash ${shellQuote(scriptPath)}`);
	return scriptPath;
}

export function readPane(paneId: PaneId, lines = 50): string {
	assertTerminalAvailable();
	return readHerdrScreen(paneId, lines);
}

export async function readPaneAsync(
	paneId: PaneId,
	lines = 50,
): Promise<string> {
	assertTerminalAvailable();
	return readHerdrScreenAsync(paneId, lines);
}

export type { PaneInspection, HerdrAgentStatus } from "./lifecycle.ts";

export async function inspectPane(
	paneId: PaneId,
): Promise<import("./lifecycle.ts").PaneInspection> {
	assertTerminalAvailable();
	const result = await inspectHerdrPane(paneId);
	if (result.kind === "present") {
		return { ...result, observedAt: Date.now() };
	}
	return result;
}

export function closePane(paneId: PaneId): void {
	assertTerminalAvailable();
	closeHerdrSurface(paneId);
}

export type { HerdrPaneProcessInfo };

export function getPaneProcessInfo(paneId: PaneId): HerdrPaneProcessInfo {
	assertTerminalAvailable();
	return getHerdrPaneProcessInfo(paneId);
}

export async function waitForShellReady(
	paneId: PaneId,
	options?: { timeoutMs?: number; intervalMs?: number; signal?: AbortSignal },
): Promise<void> {
	assertTerminalAvailable();
	return waitForHerdrShellReady(paneId, options);
}

export async function waitForPiReady(
	paneId: PaneId,
	sessionFile: string,
	cwd: string,
): Promise<void> {
	assertTerminalAvailable();
	return waitForHerdrPiReady(paneId, sessionFile, cwd);
}

export async function waitForPaneAbsence(
	paneId: PaneId,
	options?: { timeoutMs?: number; intervalMs?: number },
): Promise<boolean> {
	assertTerminalAvailable();
	return waitForHerdrPaneAbsence(paneId, options);
}

export { isProcessAlive, waitForProcessesExit };
