/*
 * Worktrunk integration for project-local Pi sessions.
 *
 * This extension does two small jobs:
 *
 * 1. Session marker sync
 *    Worktrunk has a state marker slot. Pi updates that slot when an agent is
 *    running, waiting on user input, ending, or shutting down. Shell prompts and
 *    Worktrunk-aware status surfaces can then show whether this checkout is
 *    currently being driven by an agent (`🤖`) or waiting for chat/user input
 *    (`💬`). Marker updates are best-effort: if `wt` is missing or the command
 *    fails, Pi keeps running and only skips the external status update.
 *
 * 2. Worktrunk tools for the agent
 *    The registered tools expose the narrow Worktrunk lifecycle operations the
 *    agent is allowed to perform when the user asks for Worktrunk-managed
 *    worktrees: create/switch with machine-readable JSON, and foreground
 *    removal. The tools intentionally return Worktrunk stdout/stderr and exit
 *    code so callers can handle normal `wt` errors without guessing.
 *
 * Runtime notes:
 * - Project-local extensions load from `.pi/extensions` after project trust.
 * - TypeScript is loaded by Pi directly; `tsconfig.json` exists for local checks.
 * - Set `WORKTRUNK_BIN` when the binary is not named `wt` or `git-wt.exe`.
 */
import type { ExecResult, ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const ROBOT_MARKER = "🤖";
const CHAT_MARKER = "💬";

/**
 * Resolves the Worktrunk executable for this session.
 *
 * `WORKTRUNK_BIN` is the escape hatch for local installs, wrappers, or test
 * runs. Windows uses the `git-wt.exe` shim; every other platform expects `wt`
 * on PATH.
 */
function worktrunkCommand(): string {
	const configuredCommand = process.env["WORKTRUNK_BIN"]?.trim();
	if (configuredCommand) return configuredCommand;
	if (process.platform === "win32") return "git-wt.exe";
	return "wt";
}

/**
 * Runs a Worktrunk command through Pi's extension executor.
 *
 * Keep all Worktrunk calls behind this seam so timeout, cancellation, binary
 * selection, and future logging stay consistent across commands and tools.
 */
async function runWorktrunk(pi: ExtensionAPI, args: readonly string[], signal?: AbortSignal): Promise<ExecResult> {
	return await pi.exec(worktrunkCommand(), [...args], { signal, timeout: 30_000 });
}

/**
 * Sets the external Worktrunk state marker and mirrors it into Pi's footer.
 *
 * Marker writes are deliberately best-effort. A failed marker update should not
 * block the agent, tool execution, or session lifecycle events.
 */
async function setMarker(pi: ExtensionAPI, marker: string, ctx?: ExtensionContext): Promise<void> {
	const result = await runWorktrunk(pi, ["config", "state", "marker", "set", marker], ctx?.signal);
	if (result.code !== 0) return;
	ctx?.ui.setStatus("worktrunk", `wt ${marker}`);
}

/**
 * Clears the external Worktrunk state marker during session shutdown.
 *
 * This keeps stale prompt/status markers from surviving after Pi exits. Failures
 * are ignored for the same reason as `setMarker`: Worktrunk status is auxiliary.
 */
async function clearMarker(pi: ExtensionAPI, ctx?: ExtensionContext): Promise<void> {
	const result = await runWorktrunk(pi, ["config", "state", "marker", "clear"], ctx?.signal);
	if (result.code !== 0) return;
	ctx?.ui.setStatus("worktrunk", "wt");
}

/**
 * Registers Worktrunk session hooks, a manual marker command, and two agent
 * tools for Worktrunk-managed worktrees.
 */
export default function worktrunk(pi: ExtensionAPI): void {
	pi.on("before_agent_start", async (_event, ctx) => {
		await setMarker(pi, ROBOT_MARKER, ctx);
	});

	pi.on("tool_call", async (event, ctx) => {
		// Waiting for an interactive question is a user turn, not autonomous agent work.
		if (event.toolName !== "ask_user" && event.toolName !== "question") return;
		await setMarker(pi, CHAT_MARKER, ctx);
	});

	pi.on("agent_end", async (_event, ctx) => {
		await setMarker(pi, CHAT_MARKER, ctx);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		await clearMarker(pi, ctx);
	});

	pi.registerCommand("worktrunk-marker", {
		description: "Set or clear the Worktrunk state marker: robot, chat, or clear.",
		handler: async (args, ctx) => {
			const action = args.trim().toLowerCase();
			if (action === "robot") {
				await setMarker(pi, ROBOT_MARKER, ctx);
				return;
			}
			if (action === "chat") {
				await setMarker(pi, CHAT_MARKER, ctx);
				return;
			}
			if (action === "clear") {
				await clearMarker(pi, ctx);
				return;
			}
			ctx.ui.notify("Usage: /worktrunk-marker robot|chat|clear", "error");
		},
	});

	pi.registerTool({
		name: "worktrunk_switch_create",
		label: "Worktrunk switch create",
		description: "Create/switch to a Worktrunk worktree and return Worktrunk's JSON output.",
		parameters: Type.Object({
			name: Type.String({ description: "Worktrunk worktree name" }),
		}),
		promptGuidelines: ["Use worktrunk_switch_create only when the user explicitly asks for a Worktrunk-managed worktree."],
		async execute(_toolCallId, params, signal) {
			// `--no-cd` keeps Pi's cwd under Pi's control; callers enter/use the path explicitly.
			const result = await runWorktrunk(pi, ["switch", "--create", params.name, "--no-cd", "--format=json", "--yes"], signal);
			const text = result.stdout.trim() || result.stderr.trim();
			return {
				content: [{ type: "text", text }],
				details: { code: result.code, stdout: result.stdout, stderr: result.stderr },
				isError: result.code !== 0,
			};
		},
	});

	pi.registerTool({
		name: "worktrunk_remove",
		label: "Worktrunk remove",
		description: "Remove a Worktrunk worktree path in the foreground.",
		parameters: Type.Object({
			path: Type.String({ description: "Worktree path to remove" }),
		}),
		promptGuidelines: ["Use worktrunk_remove only for Worktrunk-created worktrees the user asked to remove."],
		async execute(_toolCallId, params, signal) {
			// Foreground removal lets the agent see and report dirty-worktree or unmerged-branch refusals.
			const result = await runWorktrunk(pi, ["remove", "--foreground", params.path], signal);
			const text = result.stdout.trim() || result.stderr.trim() || `worktrunk remove exited ${result.code}`;
			return {
				content: [{ type: "text", text }],
				details: { code: result.code, stdout: result.stdout, stderr: result.stderr },
				isError: result.code !== 0,
			};
		},
	});
}
