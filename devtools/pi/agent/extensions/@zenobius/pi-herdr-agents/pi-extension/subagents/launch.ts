import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { getSubagentActivityFile } from "./activity.ts";
import { createLifecycle, type SubagentLifecycle } from "./lifecycle.ts";
import type { ResolvedRuntimePlan } from "./runtime-routing.ts";
import { HerdrWorktreeCreateError } from "./herdr.ts";
import {
	createWorktreeSessionFork,
	seedSubagentSessionFile,
} from "./session.ts";
import {
	createSubagentPane,
	createSubagentWorktree,
	runScriptInPane,
	shellQuote,
	waitForPiReady,
	waitForShellReady,
	focusWorkspace,
	type HerdrWorktreeSurface,
} from "./terminal.ts";

const SUBAGENTS_DIR = dirname(fileURLToPath(import.meta.url));

type SubagentSessionMode = "standalone" | "lineage-only" | "fork";

export interface WorktreeLaunch {
	path: string;
	workspaceId: string;
	paneId: string;
	branch: string;
	baseRef: string;
	baseSha: string;
	manifestFile: string;
	sessionFile?: string;
	sourceSessionFile?: string;
	handoffMessage?: string;
}

export interface WorktreeHandoff extends WorktreeLaunch {
	headSha: string | null;
	commitsAhead: number | null;
	clean: boolean | null;
	conflicted: boolean | null;
	changedFiles: string[] | null;
	untrackedFiles: string[] | null;
	gitError?: string;
}

export interface FreshPiLaunchRequest {
	kind: "fresh";
	id?: string;
	name: string;
	task: string;
	agent?: string;
	cwd?: string;
	worktree?: { branch: string; base?: string };
	fork?: boolean;
	handoff?: { leafId: string };
	surface?: string;
	parent: {
		cwd: string;
		invocationCwd?: string;
		sessionFile: string;
		sessionId: string;
		sessionDir: string;
		agentDir?: string;
	};
	runtimePlan: ResolvedRuntimePlan;
	behavior: {
		tools?: string;
		skills?: string;
		deniedTools: readonly string[];
		autoExit: boolean;
		interactive: boolean;
		identity?: string;
		systemPromptMode?: "append" | "replace";
		sessionMode: SubagentSessionMode;
		cwd?: string;
	};
}

export interface ResumePiLaunchRequest {
	kind: "resume";
	id?: string;
	name: string;
	sessionFile: string;
	message?: string;
	parent: {
		sessionId: string;
		sessionDir: string;
	};
	behavior?: {
		autoExit?: boolean;
		interactive?: boolean;
	};
}

export type PiLaunchRequest = FreshPiLaunchRequest | ResumePiLaunchRequest;

export interface PiRunningChild {
	id: string;
	name: string;
	task: string;
	agent?: string;
	surface: string;
	startTime: number;
	sessionFile: string;
	launchScriptFile: string;
	activityFile: string;
	interactive: boolean;
	runtimePlan: ResolvedRuntimePlan | undefined;
	worktree?: WorktreeLaunch;
	lifecycle: SubagentLifecycle;
}

export interface PiLaunchOperations {
	createPane(name: string): string;
	createWorktree(
		name: string,
		cwd: string,
		branch: string,
		base: string,
	): HerdrWorktreeSurface;
	waitForShellReady(surface: string): Promise<void>;
	runScript(
		surface: string,
		command: string,
		options: { scriptPath: string; scriptPreamble: string },
	): string;
	waitForPiReady?(
		surface: string,
		sessionFile: string,
		cwd: string,
	): Promise<void>;
	focusWorkspace?(workspaceId: string): void;
}

const defaultOperations: PiLaunchOperations = {
	createPane: createSubagentPane,
	createWorktree: createSubagentWorktree,
	waitForShellReady,
	runScript: runScriptInPane,
	waitForPiReady,
	focusWorkspace,
};

interface ResolvedLaunch {
	request: FreshPiLaunchRequest;
	id: string;
	startTime: number;
	agentDir: string;
	localAgentDir: string | null;
	sourceCwd: string;
	artifactDir: string;
	sessionMode: SubagentSessionMode;
	taskDelivery: "direct" | "artifact";
}

interface PreparedSurface {
	surface: string;
	targetCwd: string;
	effectiveAgentDir: string;
	localAgentDir: string | null;
	worktree?: WorktreeLaunch;
}

interface PreparedSession extends PreparedSurface {
	sessionFile: string;
	activityFile: string;
}

interface PreparedArtifacts extends PreparedSession {
	taskArg: string;
	systemPromptFile?: string;
}

/**
 * Launch one validated Pi-backed request. Lifecycle watching and parent
 * delivery begin only after this transaction returns the running child.
 */
export async function launchPiSubagent(
	request: PiLaunchRequest,
	operations: PiLaunchOperations = defaultOperations,
): Promise<PiRunningChild> {
	return request.kind === "resume"
		? launchResumedPiSubagent(request, operations)
		: launchFreshPiSubagent(request, operations);
}

export async function launchPiWorktreeHandoff(
	request: FreshPiLaunchRequest,
	operations: PiLaunchOperations = defaultOperations,
): Promise<{ running: PiRunningChild; focusError?: string }> {
	if (!request.worktree || !request.handoff) {
		throw new Error("A worktree handoff requires a worktree and active leaf");
	}
	const running = await launchPiSubagent(request, operations);
	if (!running.worktree) {
		throw new Error("Worktree handoff did not create a managed worktree");
	}
	try {
		operations.focusWorkspace?.(running.worktree.workspaceId);
	} catch (error) {
		const focusError = errorMessage(error);
		writeWorktreeManifest(running.worktree.manifestFile, {
			state: "running",
			focusError,
		});
		return {
			running,
			focusError,
		};
	}
	return { running };
}

async function launchFreshPiSubagent(
	request: FreshPiLaunchRequest,
	operations: PiLaunchOperations,
): Promise<PiRunningChild> {
	const resolved = resolveLaunchRequest(request);
	const surface = prepareLaunchSurface(resolved, operations);

	try {
		const session = prepareChildSession(resolved, surface);
		const handoffArtifacts = request.handoff
			? prepareTaskArtifacts(resolved, session)
			: undefined;
		await confirmShellReady(session, operations);
		const artifacts =
			handoffArtifacts ?? prepareTaskArtifacts(resolved, session);
		const command = buildPiCommand(resolved, artifacts);
		const launchScriptFile = startPiProcess(
			resolved,
			artifacts,
			command,
			operations,
		);
		if (request.handoff) {
			if (!operations.waitForPiReady) {
				throw new Error("Pi startup confirmation is unavailable");
			}
			await operations.waitForPiReady(
				artifacts.surface,
				artifacts.sessionFile,
				artifacts.targetCwd,
			);
			if (artifacts.worktree) {
				persistWorktreeResult(artifacts.worktree, "running");
			}
		}
		return createRunningChild(resolved, artifacts, launchScriptFile);
	} catch (error) {
		if (!surface.worktree) throw error;
		const handoff = captureWorktreeHandoff(surface.worktree);
		try {
			persistWorktreeResult(surface.worktree, "failed", handoff);
		} catch {
			// The launch error remains authoritative when persistence also fails.
		}
		throw new Error(
			`Failed to launch subagent; worktree retained at ${surface.worktree.path} ` +
				`(workspace ${surface.worktree.workspaceId}): ${errorMessage(error)}`,
		);
	}
}

function resolveLaunchRequest(request: FreshPiLaunchRequest): ResolvedLaunch {
	const id = request.id ?? Math.random().toString(16).slice(2, 10);
	const agentDir =
		request.parent.agentDir ??
		process.env.PI_CODING_AGENT_DIR ??
		join(homedir(), ".pi", "agent");
	const rawCwd = request.cwd ?? request.behavior.cwd;
	const cwdBase =
		request.cwd == null && request.behavior.cwd != null
			? agentDir
			: (request.parent.invocationCwd ?? request.parent.cwd);
	const sourceCwd = rawCwd
		? rawCwd.startsWith("/")
			? rawCwd
			: join(cwdBase, rawCwd)
		: request.parent.cwd;
	const localAgentDir = rawCwd ? join(sourceCwd, ".pi", "agent") : null;
	const sessionMode = request.fork ? "fork" : request.behavior.sessionMode;
	return {
		request,
		id,
		startTime: Date.now(),
		agentDir,
		localAgentDir:
			localAgentDir && existsSync(localAgentDir) ? localAgentDir : null,
		sourceCwd,
		artifactDir: join(
			request.parent.sessionDir,
			"artifacts",
			request.parent.sessionId,
		),
		sessionMode,
		taskDelivery: sessionMode === "fork" ? "direct" : "artifact",
	};
}

function prepareLaunchSurface(
	resolved: ResolvedLaunch,
	operations: PiLaunchOperations,
): PreparedSurface {
	const { request } = resolved;
	if (!request.worktree) {
		return {
			surface: request.surface ?? operations.createPane(request.name),
			targetCwd: resolved.sourceCwd,
			effectiveAgentDir: resolved.localAgentDir ?? resolved.agentDir,
			localAgentDir: resolved.localAgentDir,
		};
	}
	if (request.surface)
		throw new Error("A worktree subagent cannot use a pre-created pane");

	const baseRef = request.worktree.base ?? "HEAD";
	const baseSha = resolveGitCommit(resolved.sourceCwd, baseRef);
	const manifestFile = join(
		resolved.artifactDir,
		"worktree-runs",
		`${resolved.id}.json`,
	);
	const ownership = {
		id: resolved.id,
		name: request.name,
		sourceCwd: resolved.sourceCwd,
		branch: request.worktree.branch,
		baseRef,
		baseSha,
		createdAt: resolved.startTime,
	};
	writeWorktreeManifest(manifestFile, {
		state: "provisioning",
		...ownership,
	});

	let created: HerdrWorktreeSurface;
	try {
		created = operations.createWorktree(
			request.name,
			resolved.sourceCwd,
			request.worktree.branch,
			baseSha,
		);
	} catch (error) {
		writeWorktreeManifest(manifestFile, {
			state: "failed",
			...ownership,
			...(error instanceof HerdrWorktreeCreateError
				? error.recoveredWorktree
				: {}),
			error: errorMessage(error),
		});
		throw error;
	}

	const worktree: WorktreeLaunch = {
		path: created.path,
		workspaceId: created.workspaceId,
		paneId: created.paneId,
		branch: created.branch,
		baseRef,
		baseSha,
		manifestFile,
	};
	writeWorktreeManifest(manifestFile, {
		state: "provisioned",
		...ownership,
		...worktree,
	});
	const isolatedAgentDir = join(created.path, ".pi", "agent");
	const hasIsolatedAgentDir = existsSync(isolatedAgentDir);
	return {
		surface: created.paneId,
		targetCwd: created.path,
		effectiveAgentDir: hasIsolatedAgentDir
			? isolatedAgentDir
			: resolved.agentDir,
		localAgentDir: hasIsolatedAgentDir ? isolatedAgentDir : null,
		worktree,
	};
}

function prepareChildSession(
	resolved: ResolvedLaunch,
	surface: PreparedSurface,
): PreparedSession {
	const sessionDir = getDefaultSessionDirFor(
		surface.targetCwd,
		surface.effectiveAgentDir,
	);
	const timestamp = timestampForFile();
	const uuid = [
		resolved.id,
		Math.random().toString(16).slice(2, 10),
		Math.random().toString(16).slice(2, 10),
		Math.random().toString(16).slice(2, 6),
	].join("-");
	const sessionFile = join(sessionDir, `${timestamp}_${uuid}.jsonl`);
	if (surface.worktree) {
		surface.worktree.sessionFile = sessionFile;
		writeWorktreeManifest(surface.worktree.manifestFile, { sessionFile });
	}
	const activityFile = getSubagentActivityFile(
		resolved.artifactDir,
		resolved.id,
	);
	return { ...surface, sessionFile, activityFile };
}

async function confirmShellReady(
	session: PreparedSession,
	operations: PiLaunchOperations,
): Promise<void> {
	await operations.waitForShellReady(session.surface);
}

function buildWorktreeHandoffMessage(
	request: FreshPiLaunchRequest,
	worktree: WorktreeLaunch,
	sessionFile: string,
): string {
	const task = request.task.slice(0, 2000);
	return [
		"Worktree handoff context:",
		`Branch: ${worktree.branch}`,
		`Base commit: ${worktree.baseSha}`,
		`Worktree: ${worktree.path}`,
		`Source session: ${request.parent.sessionFile}`,
		`Fork session: ${sessionFile}`,
		"",
		"Requested task:",
		task || "Continue the current work in this worktree.",
	].join("\n");
}

function prepareTaskArtifacts(
	resolved: ResolvedLaunch,
	session: PreparedSession,
): PreparedArtifacts {
	const { request } = resolved;
	if (request.handoff) {
		if (!session.worktree) {
			throw new Error("A worktree handoff requires a managed worktree");
		}
		const handoffMessage = buildWorktreeHandoffMessage(
			request,
			session.worktree,
			session.sessionFile,
		);
		createWorktreeSessionFork({
			parentSessionFile: request.parent.sessionFile,
			leafId: request.handoff.leafId,
			childSessionFile: session.sessionFile,
			childCwd: session.targetCwd,
			handoffMessage,
		});
		session.worktree.sourceSessionFile = request.parent.sessionFile;
		session.worktree.handoffMessage = handoffMessage;
		writeWorktreeManifest(session.worktree.manifestFile, {
			sourceSessionFile: request.parent.sessionFile,
			handoffMessage,
		});
	} else if (resolved.sessionMode !== "standalone") {
		seedSubagentSessionFile({
			mode: resolved.sessionMode,
			parentSessionFile: request.parent.sessionFile,
			childSessionFile: session.sessionFile,
			childCwd: session.targetCwd,
		});
	}
	mkdirSync(dirname(session.activityFile), { recursive: true });

	const identityInSystemPrompt =
		request.behavior.systemPromptMode && request.behavior.identity;
	const roleBlock =
		request.behavior.identity && !identityInSystemPrompt
			? `\n\n${request.behavior.identity}`
			: "";
	const modeHint = request.behavior.autoExit
		? "Complete your task autonomously."
		: "Complete your task. When finished, call the subagent_done tool. The user can interact with you at any time.";
	const summaryInstruction = request.behavior.autoExit
		? "Your FINAL assistant message should summarize what you accomplished."
		: "Your FINAL assistant message (before calling subagent_done or before the user exits) should summarize what you accomplished.";
	const fullTask = request.handoff
		? request.task
		: resolved.sessionMode === "fork"
			? request.task
			: `${roleBlock}\n\n${modeHint}\n\n${request.task}\n\n${summaryInstruction}`;
	let taskArg = fullTask;
	if (resolved.taskDelivery === "artifact" && !request.handoff) {
		const artifactPath = join(
			resolved.artifactDir,
			`context/${safeName(request.name) || "subagent"}-${timestampForFile(false)}.md`,
		);
		mkdirSync(dirname(artifactPath), { recursive: true });
		writeFileSync(artifactPath, fullTask, "utf8");
		taskArg = `@${artifactPath}`;
	}

	let systemPromptFile: string | undefined;
	if (identityInSystemPrompt) {
		systemPromptFile = join(
			resolved.artifactDir,
			`context/${safeName(request.name) || "subagent"}-sysprompt-${timestampForFile(false)}.md`,
		);
		mkdirSync(dirname(systemPromptFile), { recursive: true });
		writeFileSync(systemPromptFile, identityInSystemPrompt, "utf8");
	}
	return { ...session, taskArg, systemPromptFile };
}

function buildPiCommand(
	resolved: ResolvedLaunch,
	artifacts: PreparedArtifacts,
): string {
	const { request } = resolved;
	const parts = [
		"pi",
		"--session",
		shellQuote(artifacts.sessionFile),
		...(request.handoff
			? []
			: ["-e", shellQuote(join(SUBAGENTS_DIR, "subagent-done.ts"))]),
		"--model",
		shellQuote(request.runtimePlan.model),
		"--thinking",
		shellQuote(request.runtimePlan.thinking),
	];
	if (artifacts.systemPromptFile) {
		parts.push(
			request.behavior.systemPromptMode === "replace"
				? "--system-prompt"
				: "--append-system-prompt",
			shellQuote(artifacts.systemPromptFile),
		);
	}
	const toolAllowlist = buildSubagentToolAllowlist(
		request.behavior.tools,
		request.behavior.autoExit,
	);
	if (toolAllowlist) parts.push("--tools", shellQuote(toolAllowlist));
	if (!request.handoff) {
		for (const prompt of buildPromptArgs(
			request.behavior.skills,
			resolved.taskDelivery,
			artifacts.taskArg,
		)) {
			parts.push(shellQuote(prompt));
		}
	}

	const env: string[] = [];
	if (artifacts.localAgentDir) {
		env.push(`PI_CODING_AGENT_DIR=${shellQuote(artifacts.localAgentDir)}`);
	} else if (process.env.PI_CODING_AGENT_DIR) {
		env.push(
			`PI_CODING_AGENT_DIR=${shellQuote(process.env.PI_CODING_AGENT_DIR)}`,
		);
	}
	if (!request.handoff) {
		if (request.behavior.deniedTools.length > 0) {
			env.push(
				`PI_DENY_TOOLS=${shellQuote(request.behavior.deniedTools.join(","))}`,
			);
		}
		env.push(`PI_SUBAGENT_NAME=${shellQuote(request.name)}`);
		if (request.agent)
			env.push(`PI_SUBAGENT_AGENT=${shellQuote(request.agent)}`);
		env.push(
			`PI_SUBAGENT_AUTO_EXIT=${request.behavior.autoExit ? "1" : "0"}`,
		);
		env.push(`PI_SUBAGENT_SESSION=${shellQuote(artifacts.sessionFile)}`);
		env.push(`PI_SUBAGENT_ID=${shellQuote(resolved.id)}`);
		env.push(`PI_SUBAGENT_ACTIVITY_FILE=${shellQuote(artifacts.activityFile)}`);
		env.push(`PI_SUBAGENT_SURFACE=${shellQuote(artifacts.surface)}`);
	}

	const piCommand =
		`cd ${shellQuote(artifacts.targetCwd)} && ` +
		`${env.join(" ")} ${parts.join(" ")}`;
	return request.handoff
		? piCommand
		: `${piCommand}; echo '__SUBAGENT_DONE_'$?'__'`;
}

function startPiProcess(
	resolved: ResolvedLaunch,
	artifacts: PreparedArtifacts,
	command: string,
	operations: PiLaunchOperations,
): string {
	const launchScriptFile = join(
		resolved.artifactDir,
		"subagent-scripts",
		`${safeName(resolved.request.name) || "subagent"}-${resolved.id}.sh`,
	);
	if (artifacts.worktree && !resolved.request.handoff) {
		persistWorktreeResult(artifacts.worktree, "running");
	}
	return operations.runScript(artifacts.surface, command, {
		scriptPath: launchScriptFile,
		scriptPreamble: [
			`# Subagent launch script for ${resolved.request.name}`,
			`# Generated: ${new Date().toISOString()}`,
			`# Session: ${artifacts.sessionFile}`,
			`# Surface: ${artifacts.surface}`,
		].join("\n"),
	});
}

function createRunningChild(
	resolved: ResolvedLaunch,
	artifacts: PreparedArtifacts,
	launchScriptFile: string,
): PiRunningChild {
	return {
		id: resolved.id,
		name: resolved.request.name,
		task: resolved.request.task,
		agent: resolved.request.agent,
		surface: artifacts.surface,
		startTime: resolved.startTime,
		sessionFile: artifacts.sessionFile,
		launchScriptFile,
		activityFile: artifacts.activityFile,
		interactive: resolved.request.behavior.interactive,
		runtimePlan: resolved.request.runtimePlan,
		worktree: artifacts.worktree,
		lifecycle: createLifecycle(resolved.startTime),
	};
}

async function launchResumedPiSubagent(
	request: ResumePiLaunchRequest,
	operations: PiLaunchOperations,
): Promise<PiRunningChild> {
	const id = request.id ?? Math.random().toString(16).slice(2, 10);
	const autoExit = request.behavior?.autoExit ?? true;
	const interactive = request.behavior?.interactive ?? !autoExit;
	const startTime = Date.now();
	const artifactDir = join(
		request.parent.sessionDir,
		"artifacts",
		request.parent.sessionId,
	);
	const surface = operations.createPane(request.name);
	await operations.waitForShellReady(surface);
	const activityFile = getSubagentActivityFile(artifactDir, id);
	mkdirSync(dirname(activityFile), { recursive: true });

	let messageFile: string | undefined;
	if (request.message) {
		messageFile = join(
			artifactDir,
			"subagent-resume",
			`${safeName(request.name) || "resume"}-${timestampForFile(false)}.md`,
		);
		mkdirSync(dirname(messageFile), { recursive: true });
		writeFileSync(messageFile, request.message, "utf8");
	}

	const env = [
		...(process.env.PI_CODING_AGENT_DIR
			? [`PI_CODING_AGENT_DIR=${shellQuote(process.env.PI_CODING_AGENT_DIR)}`]
			: []),
		`PI_SUBAGENT_NAME=${shellQuote(request.name)}`,
		`PI_SUBAGENT_SESSION=${shellQuote(request.sessionFile)}`,
		`PI_SUBAGENT_ID=${shellQuote(id)}`,
		`PI_SUBAGENT_ACTIVITY_FILE=${shellQuote(activityFile)}`,
		`PI_SUBAGENT_AUTO_EXIT=${autoExit ? "1" : "0"}`,
	];
	const command = [
		...env,
		"pi",
		"--session",
		shellQuote(request.sessionFile),
		"-e",
		shellQuote(join(SUBAGENTS_DIR, "subagent-done.ts")),
		...(messageFile ? [shellQuote(`@${messageFile}`)] : []),
	].join(" ");
	const launchScriptFile = operations.runScript(
		surface,
		`${command}; echo '__SUBAGENT_DONE_'$?'__'`,
		{
			scriptPath: join(
				artifactDir,
				"subagent-scripts",
				`${safeName(request.name) || "resume"}-resume-${Date.now()}.sh`,
			),
			scriptPreamble: [
				`# Subagent resume script for ${request.name}`,
				`# Generated: ${new Date().toISOString()}`,
				`# Session: ${request.sessionFile}`,
				`# Surface: ${surface}`,
				...(messageFile ? [`# Resume message file: ${messageFile}`] : []),
			].join("\n"),
		},
	);
	return {
		id,
		name: request.name,
		task: request.message ?? "resumed session",
		surface,
		startTime,
		sessionFile: request.sessionFile,
		launchScriptFile,
		activityFile,
		interactive,
		runtimePlan: undefined,
		lifecycle: createLifecycle(startTime),
	};
}

export function buildSubagentToolAllowlist(
	tools?: string,
	autoExit = false,
): string | null {
	const requested = (tools ?? "")
		.split(",")
		.map((tool) => tool.trim())
		.filter(Boolean);
	if (requested.length === 0) return null;
	const allow = new Set(requested);
	allow.delete("subagent_done");
	allow.add("caller_ping");
	if (!autoExit) allow.add("subagent_done");
	return [...allow].join(",");
}

function buildPromptArgs(
	skills: string | undefined,
	taskDelivery: "direct" | "artifact",
	taskArg: string,
): string[] {
	const skillPrompts = (skills ?? "")
		.split(",")
		.map((skill) => skill.trim())
		.filter(Boolean)
		.map((skill) => `/skill:${skill}`);
	return [
		...(taskDelivery === "artifact" && skillPrompts.length > 0 ? [""] : []),
		...skillPrompts,
		taskArg,
	];
}

function getDefaultSessionDirFor(cwd: string, agentDir: string): string {
	const safePath = `--${cwd.replace(/^[/\\]/, "").replace(/[/\\:]/g, "-")}--`;
	const sessionDir = join(agentDir, "sessions", safePath);
	mkdirSync(sessionDir, { recursive: true });
	return sessionDir;
}

function timestampForFile(includeMilliseconds = true): string {
	return (
		new Date()
			.toISOString()
			.replace(/[:.]/g, "-")
			.slice(0, includeMilliseconds ? 23 : 19) +
		(includeMilliseconds ? "Z" : "")
	);
}

function safeName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function resolveGitCommit(cwd: string, ref: string): string {
	return execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], {
		cwd,
		encoding: "utf8",
	}).trim();
}

export function writeWorktreeManifest(
	path: string,
	value: Record<string, unknown>,
): void {
	mkdirSync(dirname(path), { recursive: true });
	let existing: Record<string, unknown> = {};
	if (existsSync(path)) {
		try {
			existing = JSON.parse(readFileSync(path, "utf8"));
		} catch {
			existing = {};
		}
	}
	const tempPath = `${path}.tmp`;
	writeFileSync(
		tempPath,
		`${JSON.stringify(
			{
				...existing,
				...value,
				version: 1,
				kind: "worktree-run",
				owner: "pi-herdr-subagents",
				updatedAt: Date.now(),
			},
			null,
			2,
		)}\n`,
	);
	renameSync(tempPath, path);
}

function gitPathList(cwd: string, args: string[]): string[] {
	return execFileSync("git", args, { cwd, encoding: "utf8" })
		.split("\0")
		.filter(Boolean);
}

export function captureWorktreeHandoff(
	worktree: WorktreeLaunch,
): WorktreeHandoff {
	try {
		const headSha = resolveGitCommit(worktree.path, "HEAD");
		const status = execFileSync(
			"git",
			["status", "--porcelain=v1", "--untracked-files=all", "-z"],
			{ cwd: worktree.path, encoding: "utf8" },
		);
		const untrackedFiles = gitPathList(worktree.path, [
			"ls-files",
			"--others",
			"--exclude-standard",
			"-z",
		]);
		const conflictedFiles = gitPathList(worktree.path, [
			"diff",
			"--name-only",
			"--diff-filter=U",
			"-z",
		]);
		const changedFiles = new Set([
			...gitPathList(worktree.path, [
				"diff",
				"--name-only",
				"-z",
				`${worktree.baseSha}...HEAD`,
			]),
			...gitPathList(worktree.path, ["diff", "--name-only", "-z"]),
			...gitPathList(worktree.path, ["diff", "--cached", "--name-only", "-z"]),
			...untrackedFiles,
		]);
		const commitsAhead = Number.parseInt(
			execFileSync(
				"git",
				["rev-list", "--count", `${worktree.baseSha}..HEAD`],
				{ cwd: worktree.path, encoding: "utf8" },
			).trim(),
			10,
		);
		return {
			...worktree,
			headSha,
			commitsAhead: Number.isFinite(commitsAhead) ? commitsAhead : 0,
			clean: status.length === 0,
			conflicted: conflictedFiles.length > 0,
			changedFiles: [...changedFiles].sort(),
			untrackedFiles: untrackedFiles.sort(),
		};
	} catch (error) {
		return {
			...worktree,
			headSha: null,
			commitsAhead: null,
			clean: null,
			conflicted: null,
			changedFiles: null,
			untrackedFiles: null,
			gitError: errorMessage(error),
		};
	}
}

export function persistWorktreeResult(
	worktree: WorktreeLaunch,
	state: "running" | "ready_for_review" | "failed" | "needs_help",
	handoff?: WorktreeHandoff,
): void {
	writeWorktreeManifest(worktree.manifestFile, {
		state,
		...worktree,
		...handoff,
	});
}

export function runSubagentScript(
	surface: string,
	command: string,
	options: Parameters<typeof runScriptInPane>[2],
	worktree?: WorktreeLaunch,
	run: typeof runScriptInPane = runScriptInPane,
): string {
	if (worktree) persistWorktreeResult(worktree, "running");
	try {
		return run(surface, command, options);
	} catch (error) {
		if (!worktree) throw error;
		const handoff = captureWorktreeHandoff(worktree);
		try {
			persistWorktreeResult(worktree, "failed", handoff);
		} catch {
			// The launch error remains authoritative when persistence also fails.
		}
		throw new Error(
			`Failed to launch subagent; worktree retained at ${worktree.path} ` +
				`(workspace ${worktree.workspaceId}): ${errorMessage(error)}`,
		);
	}
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
