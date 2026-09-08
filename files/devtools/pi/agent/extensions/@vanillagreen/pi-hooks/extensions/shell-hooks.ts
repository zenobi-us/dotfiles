import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { getBool, getNumber, readConfig, recordProjectTrust } from "./config.js";

const OUTPUT_LIMIT = 64_000;

export const SHELL_HOOK_EVENTS = [
	"project_trust",
	"resources_discover",
	"session_start",
	"session_info_changed",
	"session_before_switch",
	"session_before_fork",
	"session_before_compact",
	"session_compact",
	"session_shutdown",
	"session_before_tree",
	"session_tree",
	"context",
	"before_provider_request",
	"before_provider_headers",
	"after_provider_response",
	"before_agent_start",
	"agent_start",
	"agent_end",
	"agent_settled",
	"turn_start",
	"turn_end",
	"message_start",
	"message_update",
	"message_end",
	"tool_execution_start",
	"tool_execution_update",
	"tool_execution_end",
	"model_select",
	"thinking_level_select",
	"tool_call",
	"tool_result",
	"user_bash",
	"input",
] as const;

export type ShellHookEvent = (typeof SHELL_HOOK_EVENTS)[number];

type ShellHookContext = {
	cwd?: string;
	mode?: string;
	hasUI?: boolean;
	isProjectTrusted?: () => boolean;
	ui?: { notify?: (message: string, level?: "info" | "warning" | "error") => void };
};

type HookScript = { scope: "global" | "project"; path: string };

type RunOptions = {
	globalHookRoot?: string;
	projectHookRoot?: string;
	timeoutMs?: number;
	includeProject?: boolean;
};

function globalHookRoot(): string {
	return join(homedir(), ".pi", "agent", "hooks");
}

function projectHookRoot(cwd: string): string {
	let current = resolve(cwd);
	while (true) {
		const hookRoot = join(current, ".pi", "hooks");
		if (existsSync(hookRoot)) return hookRoot;
		if (existsSync(join(current, ".pi")) || existsSync(join(current, ".git")) || existsSync(join(current, ".vstack-lock.json"))) {
			return hookRoot;
		}
		const parent = dirname(current);
		if (parent === current) return join(resolve(cwd), ".pi", "hooks");
		current = parent;
	}
}

function listScripts(root: string, eventName: string, scope: HookScript["scope"]): HookScript[] {
	const dir = join(root, eventName);
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isFile() || entry.isSymbolicLink())
		.map((entry) => ({ scope, path: join(dir, entry.name) }))
		.sort((a, b) => a.path.localeCompare(b.path));
}

export function discoverHookScripts(eventName: ShellHookEvent, cwd: string, projectTrusted: boolean, opts: RunOptions = {}): HookScript[] {
	return [
		...listScripts(opts.globalHookRoot ?? globalHookRoot(), eventName, "global"),
		...(opts.includeProject ?? projectTrusted ? listScripts(opts.projectHookRoot ?? projectHookRoot(cwd), eventName, "project") : []),
	];
}

function safeJson(value: unknown): string {
	const seen = new WeakSet<object>();
	return JSON.stringify(value, (_key, v) => {
		if (typeof v === "bigint") return v.toString();
		if (typeof v === "function") return undefined;
		if (v && typeof v === "object") {
			if (seen.has(v)) return "[Circular]";
			seen.add(v);
		}
		return v;
	});
}

function appendLimited(current: string, chunk: Buffer): string {
	if (current.length >= OUTPUT_LIMIT) return current;
	return (current + chunk.toString("utf8")).slice(0, OUTPUT_LIMIT);
}

async function runScript(script: HookScript, eventName: ShellHookEvent, payload: string, cwd: string, timeoutMs: number): Promise<string | undefined> {
	return await new Promise((resolveDone) => {
		let stdout = "";
		let stderr = "";
		let timedOut = false;
		const child = spawn("bash", [script.path], {
			cwd,
			env: {
				...process.env,
				PI_HOOK_EVENT: eventName,
				PI_HOOK_SCOPE: script.scope,
				PI_HOOK_SCRIPT: script.path,
				PI_HOOK_CWD: cwd,
			},
			stdio: ["pipe", "pipe", "pipe"],
		});

		const timer = setTimeout(() => {
			timedOut = true;
			child.kill("SIGTERM");
		}, timeoutMs);

		child.stdout.on("data", (chunk: Buffer) => {
			stdout = appendLimited(stdout, chunk);
		});
		child.stderr.on("data", (chunk: Buffer) => {
			stderr = appendLimited(stderr, chunk);
		});
		child.on("error", (error) => {
			clearTimeout(timer);
			resolveDone(`${script.path}: ${error.message}`);
		});
		child.on("close", (code, signal) => {
			clearTimeout(timer);
			if (!timedOut && code === 0) return resolveDone(undefined);
			const detail = (stderr || stdout).trim();
			const status = timedOut ? `timed out after ${timeoutMs}ms` : `exited ${code ?? signal ?? "unknown"}`;
			resolveDone(`${script.path} ${status}${detail ? `: ${detail}` : ""}`);
		});
		child.stdin.end(payload);
	});
}

export async function runEventScripts(
	eventName: ShellHookEvent,
	event: unknown,
	ctx: ShellHookContext,
	opts: RunOptions = {},
): Promise<string | undefined> {
	const cwd = ctx.cwd ? resolve(ctx.cwd) : process.cwd();
	const cfg = readConfig(cwd);
	if (!getBool(cfg, "enabled") || !getBool(cfg, "shellHooks")) return undefined;

	let trusted = false;
	try {
		trusted = ctx.isProjectTrusted?.() === true;
	} catch {
		trusted = false;
	}

	const scripts = discoverHookScripts(eventName, cwd, trusted, opts);
	if (scripts.length === 0) return undefined;

	const payload = safeJson({ eventName, event, cwd, mode: ctx.mode, hasUI: ctx.hasUI });
	const failures: string[] = [];
	const timeoutMs = opts.timeoutMs ?? getNumber(cfg, "shellHookTimeoutMs");
	for (const script of scripts) {
		const failure = await runScript(script, eventName, payload, cwd, timeoutMs);
		if (failure) failures.push(failure);
	}
	return failures.length ? `pi-hooks ${eventName} script failed: ${failures.join("\n")}` : undefined;
}

function resultForFailure(eventName: ShellHookEvent, failure: string, ctx: ShellHookContext): unknown {
	if (eventName === "tool_call") return { block: true, reason: failure };
	if (eventName === "session_before_switch" || eventName === "session_before_fork" || eventName === "session_before_compact" || eventName === "session_before_tree") {
		ctx.ui?.notify?.(failure, "warning");
		return { cancel: true };
	}
	ctx.ui?.notify?.(failure, "warning");
	return undefined;
}

export function installShellHooks(pi: ExtensionAPI): void {
	pi.on("project_trust", async (event, ctx) => {
		await runEventScripts("project_trust", event, ctx, { includeProject: false });
		return { trusted: "undecided" };
	});

	for (const eventName of SHELL_HOOK_EVENTS) {
		if (eventName === "project_trust") continue;
		(pi.on as (event: string, handler: (event: unknown, ctx: ShellHookContext) => Promise<unknown>) => void)(eventName, async (event, ctx) => {
			recordProjectTrust(ctx);
			const failure = await runEventScripts(eventName, event, ctx);
			return failure ? resultForFailure(eventName, failure, ctx) : undefined;
		});
	}
}
