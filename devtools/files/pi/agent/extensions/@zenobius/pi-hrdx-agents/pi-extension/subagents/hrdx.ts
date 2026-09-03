import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const commandAvailability = new Map<string, boolean>();
const SOCKET_CLIENT = String.raw`
import net from "node:net";
const socket = process.argv[1];
const request = JSON.parse(process.argv[2]);
const client = net.createConnection(socket);
let buffer = "";
const fail = (message) => { console.error(message); process.exit(1); };
client.setTimeout(5000, () => fail("hrdx request timed out"));
client.on("error", (error) => fail(error.message));
client.on("data", (chunk) => {
  buffer += chunk.toString();
  const newline = buffer.indexOf("\n");
  if (newline < 0) return;
  const response = JSON.parse(buffer.slice(0, newline));
  if (response.error) fail((response.error.code ?? "error") + ": " + (response.error.message ?? "hrdx request failed"));
  else { process.stdout.write(JSON.stringify(response.result ?? null)); process.exit(0); }
});
client.on("connect", () => client.write(JSON.stringify(request) + "\n"));
`;

function hasCommand(command: string): boolean {
	if (commandAvailability.has(command)) return commandAvailability.get(command)!;
	try {
		if (process.platform === "win32") execFileSync("where.exe", [command], { stdio: "ignore" });
		else execFileSync("sh", ["-lc", `command -v ${command}`], { stdio: "ignore" });
		commandAvailability.set(command, true);
		return true;
	} catch {
		commandAvailability.set(command, false);
		return false;
	}
}

function socketPath(): string {
	if (process.platform === "darwin") return join(homedir(), "Library", "Application Support", "hrdx", "hrdx.sock");
	if (process.platform === "win32") return join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), "hrdx", "hrdx.sock");
	return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "hrdx", "hrdx.sock");
}

function requestSync(method: string, params: Record<string, unknown> = {}): any {
	const output = execFileSync(process.execPath, [
		"--input-type=module",
		"-e",
		SOCKET_CLIENT,
		socketPath(),
		JSON.stringify({ id: Math.random().toString(16).slice(2), method, params }),
	], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
	return JSON.parse(output || "null");
}

async function request(method: string, params: Record<string, unknown> = {}): Promise<any> {
	return requestSync(method, params);
}

export function isHrdxAvailable(): boolean {
	return process.env.HRDX === "1" && hasCommand("hrdx") && (() => {
		try { requestSync("ping"); return true; } catch { return false; }
	})();
}

export interface HrdxWorktreeSurface {
	path: string;
	branch: string;
	workspaceId: string;
	paneId: string;
}

export interface HrdxWorktreeInfo {
	branch: string;
	path: string;
	label?: string;
	workspaceId?: string;
	isLinkedWorktree: boolean;
}

export class HrdxWorktreeCreateError extends Error {
	readonly recoveredWorktree: Pick<HrdxWorktreeInfo, "path" | "branch" | "workspaceId">;
	constructor(message: string, recoveredWorktree: Pick<HrdxWorktreeInfo, "path" | "branch" | "workspaceId">) {
		super(message);
		this.name = "HrdxWorktreeCreateError";
		this.recoveredWorktree = recoveredWorktree;
	}
}

interface HrdxPane {
	pane_id: number;
	name?: string;
	kind?: string;
	running?: boolean;
	busy?: boolean;
}

interface HrdxStatus {
	workspaces?: Array<{ name: string; path: string; tabs?: Array<{ panes?: HrdxPane[] }> }>;
}

function status(): HrdxStatus { return requestSync("status") as HrdxStatus; }

function paneId(value: unknown): string {
	if (typeof value !== "number" && typeof value !== "string") throw new Error("hrdx response has no pane id");
	return String(value);
}

export function createHrdxSurface(_name: string): string {
	const workspace = status().workspaces?.find((item) => item.path === process.cwd());
	const result = workspace
		? requestSync("pane.create", { workspace: workspace.name, kind: "shell", split: "tab" })
		: requestSync("workspace.create", { path: process.cwd(), agent: "shell" });
	return paneId(result?.pane_id);
}

export function createHrdxWorktree(name: string, cwd: string, branch: string, base: string): HrdxWorktreeSurface {
	const path = mkdtempSync(join(tmpdir(), "pi-hrdx-worktree-"));
	rmSync(path, { recursive: true, force: true });
	execFileSync("git", ["worktree", "add", "-b", branch, path, base], { cwd, encoding: "utf8" });
	try {
		const result = requestSync("workspace.create", { path, agent: "shell" });
		return { path, branch, workspaceId: String(result?.workspace ?? path), paneId: paneId(result?.pane_id) };
	} catch (error) {
		throw new HrdxWorktreeCreateError(`hrdx workspace creation failed: ${error instanceof Error ? error.message : String(error)}`, { path, branch });
	}
}

export function sendHrdxText(surface: string, text: string, enter = false): void {
	requestSync("pane.send_text", { pane_id: Number(surface), text, enter });
}

export function sendHrdxEscape(surface: string): void { sendHrdxText(surface, "\u001b"); }
export function closeHrdxSurface(surface: string): void { requestSync("pane.close", { pane_id: Number(surface) }); }
export function readHrdxScreen(surface: string): string {
	const result = requestSync("pane.read", { pane_id: Number(surface) });
	return typeof result?.screen === "string" ? result.screen : "";
}
export async function readHrdxScreenAsync(surface: string): Promise<string> { return readHrdxScreen(surface); }

export type HrdxAgentStatus = "idle" | "working" | "blocked" | "done" | "unknown";
export type HrdxPaneInspection =
	| { kind: "present"; agent?: string; agentStatus: HrdxAgentStatus }
	| { kind: "missing"; error?: string }
	| { kind: "unavailable"; error: string };

function findPane(snapshot: HrdxStatus, surface: string): HrdxPane | undefined {
	const id = Number(surface);
	for (const workspace of snapshot.workspaces ?? [])
		for (const tab of workspace.tabs ?? [])
			for (const pane of tab.panes ?? []) if (pane.pane_id === id) return pane;
	return undefined;
}

export async function inspectHrdxPane(surface: string): Promise<HrdxPaneInspection> {
	try {
		const pane = findPane(status(), surface);
		if (!pane) return { kind: "missing", error: "pane not found" };
		if (pane.running === false) return { kind: "missing", error: "pane is not running" };
		return { kind: "present", agent: pane.kind, agentStatus: pane.busy ? "working" : "idle" };
	} catch (error) {
		return { kind: "unavailable", error: error instanceof Error ? error.message : String(error) };
	}
}

export async function waitForHrdxPane(surface: string, timeoutMs = 10_000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() <= deadline) {
		if ((await inspectHrdxPane(surface)).kind === "present") return;
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	throw new Error(`Timed out waiting for hrdx pane ${surface}`);
}

export async function waitForHrdxPaneAbsence(surface: string, timeoutMs = 5_000): Promise<boolean> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() <= deadline) {
		if ((await inspectHrdxPane(surface)).kind === "missing") return true;
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	return (await inspectHrdxPane(surface)).kind === "missing";
}

export async function waitForHrdxPiReady(surface: string, _sessionFile: string, _cwd: string): Promise<void> { await waitForHrdxPane(surface); }

export interface HrdxPaneProcessInfo {
	paneId: string;
	shellPid?: number;
	foregroundProcessGroupId?: number;
	pids: number[];
	foregroundProcesses: [];
}
export function getHrdxPaneProcessInfo(surface: string): HrdxPaneProcessInfo { return { paneId: surface, pids: [], foregroundProcesses: [] }; }
export function listHrdxWorktrees(cwd?: string): HrdxWorktreeInfo[] {
	const output = execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: cwd ?? process.cwd(), encoding: "utf8" });
	const worktrees: HrdxWorktreeInfo[] = [];
	let current: Partial<HrdxWorktreeInfo> = {};
	for (const line of `${output}\n`.split("\n")) {
		if (line.startsWith("worktree ")) {
			if (current.path) worktrees.push({ path: current.path, branch: current.branch ?? "(detached)", isLinkedWorktree: current.path !== (cwd ?? process.cwd()) });
			current = { path: line.slice(9) };
		} else if (line.startsWith("branch refs/heads/")) current.branch = line.slice(18);
	}
	if (current.path) worktrees.push({ path: current.path, branch: current.branch ?? "(detached)", isLinkedWorktree: current.path !== (cwd ?? process.cwd()) });
	try {
		const snapshot = status();
		for (const worktree of worktrees) {
			const workspace = snapshot.workspaces?.find((item) => item.path === worktree.path);
			if (workspace) worktree.workspaceId = workspace.name;
		}
	} catch {}
	return worktrees;
}

export function focusHrdxWorkspace(_workspaceId: string): void {}
export function renameHrdxTab(_title: string): void {}
export function renameHrdxWorkspace(_title: string): void {}

export const __hrdxTest__ = { socketPath, paneId, findPane };
