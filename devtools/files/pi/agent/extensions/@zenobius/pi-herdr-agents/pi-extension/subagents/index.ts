import type {
	AgentToolResult,
	ExtensionAPI,
	ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { keyHint } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "@sinclair/typebox";
import {
	Box,
	Text,
	truncateToWidth,
	visibleWidth,
} from "@earendil-works/pi-tui";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
	readdirSync,
	readFileSync,
	realpathSync,
	existsSync,
	mkdirSync,
	rmSync,
	statSync,
} from "node:fs";
import { homedir } from "node:os";
import {
	isTerminalAvailable,
	terminalSetupHint,
	createSubagentPane,
	runScriptInPane,
	closePane,
	interruptPane,
	shellQuote,
	readPaneAsync,
	inspectPane,
	getPaneProcessInfo,
	waitForShellReady,
	waitForPaneAbsence,
	waitForProcessesExit,
} from "./terminal.ts";
import { waitForCompletion } from "./completion.ts";
import {
	buildAuthenticatedModelCatalog,
	resolveRuntimePlan,
	resolveRuntimePlans,
	wrapPiModelRegistry,
	THINKING_LEVELS,
	isThinkingLevel,
	type ResolvedRuntimePlan,
	type ThinkingLevel,
} from "./runtime-routing.ts";
import { loadModelConfig, resolveModelDefault } from "./model-config.ts";
import {
	beginWorkflowCancellation,
	cancelTerminationResult,
	claimWorkflowTerminal,
	createWorkflowJournal,
	createWorkflowReaderCheckout,
	createWorkflowTerminalGate,
	disposeWorkflowReaderCheckout,
	executeWorkflow,
	formatApprovalPacket,
	prepareWorkflow,
	recoverWorkflowStartup,
	sameWorkflowCandidate,
	validateWorkflowApproval,
	type PendingWorkflow,
	type WorkflowReaderCheckout,
	type WorkflowRole,
	type WorkflowRolePolicy,
	type WorkflowTerminalGate,
	type WorkflowTerminalOutcome,
} from "./workflow.ts";

import {
	findLastAssistantMessage,
	inspectFinalAssistantMessage,
	findObservedSessionRuntime,
	getNewEntries,
	createBtwSessionSnapshot,
} from "./session.ts";
import {
	type SubagentStatusState,
	capStatusLines,
	formatElapsedDuration,
	formatStatusAggregate,
	normalizeStatusName,
	loadStatusConfig,
} from "./status.ts";
import {
	readSubagentActivityFile,
	type ActivityReadResult,
	type SubagentActivityState,
} from "./activity.ts";
import {
	createLifecycle,
	formatLifecycleTransitionLine,
	lifecycleTransition,
	markCompleted,
	markCompletionDetected,
	markDelivery,
	markFailed,
	markInterruptRequested,
	markProcessRunning,
	observeActivity,
	observePaneInspection,
	projectLifecycle,
	type LifecycleProjection,
	type SubagentLifecycle,
	type PaneInspection,
} from "./lifecycle.ts";
import { listHerdrWorktrees } from "./herdr.ts";
import {
	captureWorktreeHandoff,
	launchPiSubagent,
	launchPiWorktreeHandoff,
	persistWorktreeResult,
	runSubagentScript,
	writeWorktreeManifest,
	buildSubagentToolAllowlist,
	type WorktreeHandoff,
	type WorktreeLaunch,
} from "./launch.ts";

/** Absolute path to `pi-extension/subagents`. https://github.com/nodejs/node/issues/37845 */
const SUBAGENTS_DIR = dirname(fileURLToPath(import.meta.url));

// Survive /reload: replace presentation timers while keeping active completion
// watchers and their registry alive. Old module closures continue watching the
// children; the reloaded module adopts the shared registry for status/interrupts.
const WIDGET_INTERVAL_KEY = Symbol.for("pi-subagents/widget-interval");
const STATUS_INTERVAL_KEY = Symbol.for("pi-subagents/status-interval");
const RUNTIME_KEY = Symbol.for("pi-subagents/runtime");

const BTW_BOUNDARY = `You are answering an ephemeral BTW side question.
Treat inherited conversation history only as reference context. Do not resume or complete an
earlier task. Answer only the question after this boundary. Do not modify the workspace unless
that side question explicitly requests a mutation.

BTW question:
`;

interface BtwChild {
	surface: string;
	sessionFile: string;
	launchScriptFile: string;
}

function getFirstText(
	content: readonly { type: string; text?: string }[],
): string {
	const first = content[0];
	return first?.type === "text" ? (first.text ?? "") : "";
}

{
	const prevInterval = (globalThis as any)[WIDGET_INTERVAL_KEY];
	if (prevInterval) {
		clearInterval(prevInterval);
		(globalThis as any)[WIDGET_INTERVAL_KEY] = null;
	}
	const prevStatusInterval = (globalThis as any)[STATUS_INTERVAL_KEY];
	if (prevStatusInterval) {
		clearInterval(prevStatusInterval);
		(globalThis as any)[STATUS_INTERVAL_KEY] = null;
	}
}

function buildSubagentRoutingGuidelines(catalog?: string): string[] {
	return [
		"For orchestrated subagent work, explicitly set both model and thinking for every child: first choose a fast, mid, or frontier provider-family tier matched to task complexity, then set thinking within that model's supported range.",
		"Use fast tier for bounded mechanical work and recon, mid tier for ordinary implementation or review, and frontier tier for architecture, security, hard diagnosis, or adversarial review. Use minimal/low thinking for mechanical work, medium for ordinary work, and high+ for hard work.",
		"Review agents must use a different provider/family than the model that produced the work; a stronger model in the same family is quality escalation, not independent review. Use an exact authenticated provider/model-id from the live catalog below, never an alias or fuzzy name.",
		"Omitting model and thinking still inherits the parent runtime, but this is a discouraged fallback for orchestrated children.",
		"Before launching a new group of subagents, choose a short task slug and name each new child <task>-<role>[-n], for example login-api or login-test2. Use only plan, research, ui, api, build, test, review, browser, security, perf, or merge as roles; leave existing names unchanged. After the final launch, print name | agent kind | role | model | worktree, then use each name in prompts, handoffs, and results.",
		catalog ??
			"Authenticated subagent model catalog becomes available after session start.",
	];
}

const subagentRoutingGuidelines = buildSubagentRoutingGuidelines();

const ThinkingLevelSchema = Type.Union(
	THINKING_LEVELS.map((level) => Type.Literal(level)),
	{
		description:
			"Pi thinking level. Pick the model tier first, then set thinking within that model's range: minimal/low for bounded mechanical work, medium for ordinary implementation or review, high+ for architecture, security, or hard diagnosis. Omitting still inherits the parent level; do not omit on orchestrated child work.",
	},
);

const SubagentParams = Type.Object({
	name: Type.String({
		description:
			"Short stable label for the subagent; for a new coordinated group use <task>-<role>[-n] (shown in the widget and pane title)",
	}),
	task: Type.String({ description: "Task/prompt for the sub-agent" }),
	agent: Type.Optional(
		Type.String({
			description:
				"Agent name to load defaults from (e.g. 'worker', 'scout', 'reviewer'). Discovery precedence is project .pi/agents, global ~/.pi/agent/agents, then package-bundled agents.",
		}),
	),
	systemPrompt: Type.Optional(
		Type.String({
			description:
				"Role/system-prompt text for a bare spawn. Named agents keep their definition body.",
		}),
	),
	model: Type.Optional(
		Type.String({
			description:
				"Explicitly pick an exact authenticated provider/model-id in a fast, mid, or frontier provider-family tier matched to the task, or use an ordered comma-separated fallback list. Review must use a different provider/family than the producing model. Omitting still inherits the parent model; do not omit for orchestrated children. Fallbacks are Pi-backed only and cannot be used with worktrees.",
		}),
	),
	thinking: Type.Optional(ThinkingLevelSchema),
	skills: Type.Optional(
		Type.String({
			description: "Comma-separated skills (overrides agent default)",
		}),
	),
	tools: Type.Optional(
		Type.String({
			description: "Comma-separated tools (overrides agent default)",
		}),
	),
	cwd: Type.Optional(
		Type.String({
			description:
				"Working directory for the sub-agent. Without worktree, the agent starts in this folder. With worktree, this selects the source Git repository and the agent starts at the created worktree root.",
		}),
	),
	worktree: Type.Optional(
		Type.Object({
			branch: Type.String({
				minLength: 1,
				description: "New branch name for an isolated Herdr-managed Git worktree",
			}),
			base: Type.Optional(
				Type.String({
					description:
						"Git revision to branch from. Defaults to the source checkout's committed HEAD.",
				}),
			),
		}),
	),
	fork: Type.Optional(
		Type.Boolean({
			description:
				"Force the full-context fork mode for this spawn. The sub-agent inherits the current session conversation, overriding any agent frontmatter session-mode.",
		}),
	),
	interactive: Type.Optional(
		Type.Boolean({
			description:
				"Mark the subagent as interactive (long-running, user drives the conversation in its own pane). When true, the main session is not woken by status transitions (stalled/recovered) for this subagent. If omitted, falls back to the agent's `interactive` frontmatter, otherwise the inverse of `auto-exit` (agents that auto-exit are autonomous and get stall pings; agents that don't are interactive and stay quiet).",
		}),
	),
});

type SubagentSessionMode = "standalone" | "lineage-only" | "fork";

interface AgentDefaults {
	model?: string;
	tools?: string;
	skills?: string;
	thinking?: ThinkingLevel;
	denyTools?: string;
	spawning?: boolean;
	autoExit?: boolean;
	interactive?: boolean;
	systemPromptMode?: "append" | "replace";
	sessionMode?: SubagentSessionMode;
	cwd?: string;
	body?: string;
	disableModelInvocation?: boolean;
}

type AgentSource = "package" | "global" | "project";

interface AgentDefinition extends AgentDefaults {
	name: string;
	description?: string;
	disableModelInvocation: boolean;
}

interface ListedAgentDefinition extends AgentDefinition {
	source: AgentSource;
	path: string;
	provider?: string;
	providerVersion?: string;
}

interface AgentDiagnostic {
	code: string;
	message: string;
	path?: string;
	agentName?: string;
	provider?: string;
}

interface AgentCatalog {
	agents: ListedAgentDefinition[];
	diagnostics: AgentDiagnostic[];
}

const ROLE_PACK_DISCOVERY_EVENT = "pi-herdr-subagents:roles:discover:v1";

/** Tools that are gated by `spawning: false` */
const SPAWNING_TOOLS = new Set([
	"subagent",
	"subagent_interrupt",
	"subagents_list",
	"subagent_resume",
]);

/**
 * Resolve the effective set of denied tool names from agent defaults.
 * `spawning: false` expands to all SPAWNING_TOOLS.
 * `deny-tools` adds individual tool names on top.
 */
function resolveDenyTools(agentDefs: AgentDefaults | null): Set<string> {
	const denied = new Set<string>();
	if (!agentDefs) return denied;

	// spawning: false → deny all spawning tools
	if (agentDefs.spawning === false) {
		for (const t of SPAWNING_TOOLS) denied.add(t);
	}

	// deny-tools: explicit list
	if (agentDefs.denyTools) {
		for (const t of agentDefs.denyTools
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean)) {
			denied.add(t);
		}
	}

	return denied;
}

/** Resolve the global agent config directory, respecting PI_CODING_AGENT_DIR. */
function getAgentConfigDir(): string {
	return process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent");
}

function getBundledAgentsDir(): string {
	return join(SUBAGENTS_DIR, "../../agents");
}

function getFrontmatterValue(
	frontmatter: string,
	key: string,
): string | undefined {
	const prefix = `${key}:`;
	const line = frontmatter
		.split("\n")
		.find((candidate) => candidate.startsWith(prefix));
	return line?.slice(prefix.length).trim() || undefined;
}

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
	return value == null ? undefined : value === "true";
}

function parseSessionMode(
	value: string | undefined,
): SubagentSessionMode | undefined {
	if (value === "standalone" || value === "lineage-only" || value === "fork") {
		return value;
	}
	return undefined;
}

function parseAgentDefinition(
	content: string,
	fallbackName: string,
): AgentDefinition | null {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return null;

	const frontmatter = match[1];
	const body = content.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
	const systemPromptMode = getFrontmatterValue(frontmatter, "system-prompt");
	const thinking = getFrontmatterValue(frontmatter, "thinking");

	return {
		name: getFrontmatterValue(frontmatter, "name") ?? fallbackName,
		description: getFrontmatterValue(frontmatter, "description"),
		model: getFrontmatterValue(frontmatter, "model"),
		tools: getFrontmatterValue(frontmatter, "tools"),
		systemPromptMode:
			systemPromptMode === "replace"
				? "replace"
				: systemPromptMode === "append"
					? "append"
					: undefined,
		skills:
			getFrontmatterValue(frontmatter, "skills") ??
			getFrontmatterValue(frontmatter, "skill"),
		thinking: thinking && isThinkingLevel(thinking) ? thinking : undefined,
		denyTools: getFrontmatterValue(frontmatter, "deny-tools"),
		spawning: parseOptionalBoolean(getFrontmatterValue(frontmatter, "spawning")),
		autoExit: parseOptionalBoolean(getFrontmatterValue(frontmatter, "auto-exit")),
		interactive: parseOptionalBoolean(
			getFrontmatterValue(frontmatter, "interactive"),
		),
		sessionMode: parseSessionMode(
			getFrontmatterValue(frontmatter, "session-mode"),
		),
		cwd: getFrontmatterValue(frontmatter, "cwd"),
		body: body || undefined,
		disableModelInvocation:
			getFrontmatterValue(
				frontmatter,
				"disable-model-invocation",
			)?.toLowerCase() === "true",
	};
}

function legacyExternalCliDiagnostic(
	content: string,
	agentName: string,
	path: string,
): AgentDiagnostic | null {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	const cli = match ? getFrontmatterValue(match[1], "cli") : undefined;
	if (!match || !cli) return null;
	const resolvedAgentName = getFrontmatterValue(match[1], "name") ?? agentName;
	return {
		code: "external-cli-unsupported",
		message: `Role "${resolvedAgentName}" requests external CLI "${cli}" in ${path}. pi-herdr-agents is Pi-only; remove the cli and cli-model fields and select Claude through an authenticated Pi provider/model ID.`,
		path,
		agentName: resolvedAgentName,
	};
}

function listMarkdownFiles(path: string): string[] {
	const stat = statSync(path);
	if (stat.isFile()) return path.endsWith(".md") ? [path] : [];
	if (!stat.isDirectory()) return [];
	return readdirSync(path)
		.filter((entry) => entry.endsWith(".md"))
		.sort((left, right) => left.localeCompare(right))
		.map((entry) => join(path, entry));
}

function findPackageMetadata(path: string): {
	provider?: string;
	providerVersion?: string;
} {
	let current = statSync(path).isDirectory() ? path : dirname(path);
	while (true) {
		const packagePath = join(current, "package.json");
		if (existsSync(packagePath)) {
			try {
				const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
				return {
					provider: typeof pkg.name === "string" ? pkg.name : undefined,
					providerVersion: typeof pkg.version === "string" ? pkg.version : undefined,
				};
			} catch {
				return {};
			}
		}
		const parent = dirname(current);
		if (parent === current) return {};
		current = parent;
	}
}

function discoverRolePackPaths(pi?: Pick<ExtensionAPI, "events">): {
	paths: string[];
	diagnostics: AgentDiagnostic[];
} {
	const paths = new Set<string>();
	const diagnostics: AgentDiagnostic[] = [];
	if (!pi?.events) return { paths: [], diagnostics };

	try {
		pi.events.emit(ROLE_PACK_DISCOVERY_EVENT, {
			apiVersion: 1,
			register(path: unknown) {
				if (typeof path !== "string" || !isAbsolute(path)) {
					diagnostics.push({
						code: "invalid-role-pack-path",
						message: "Role packs must register an absolute file or directory path.",
					});
					return;
				}
				paths.add(resolve(path));
			},
		});
	} catch (error) {
		diagnostics.push({
			code: "role-pack-discovery-failed",
			message: `Role-pack discovery failed: ${error instanceof Error ? error.message : String(error)}`,
		});
	}

	return { paths: [...paths], diagnostics };
}

function discoverAgentCatalog(pi?: Pick<ExtensionAPI, "events">): AgentCatalog {
	const agents = new Map<string, ListedAgentDefinition>();
	const diagnostics: AgentDiagnostic[] = [];

	const addDirectory = (path: string, source: AgentSource) => {
		if (!existsSync(path)) return;
		for (const filePath of listMarkdownFiles(path)) {
			const fallbackName = basename(filePath, ".md");
			const content = readFileSync(filePath, "utf8");
			const legacyDiagnostic = legacyExternalCliDiagnostic(
				content,
				fallbackName,
				filePath,
			);
			if (legacyDiagnostic) {
				diagnostics.push(legacyDiagnostic);
				agents.delete(legacyDiagnostic.agentName ?? fallbackName);
				continue;
			}
			const parsed = parseAgentDefinition(content, fallbackName);
			if (parsed) agents.set(parsed.name, { ...parsed, source, path: filePath });
		}
	};

	addDirectory(getBundledAgentsDir(), "package");

	const discovered = discoverRolePackPaths(pi);
	diagnostics.push(...discovered.diagnostics);
	const contributed = new Map<string, ListedAgentDefinition[]>();
	for (const registeredPath of discovered.paths) {
		if (!existsSync(registeredPath)) {
			diagnostics.push({
				code: "missing-role-pack-path",
				message: `Registered role-pack path does not exist: ${registeredPath}`,
				path: registeredPath,
			});
			continue;
		}

		let metadata: ReturnType<typeof findPackageMetadata>;
		let roleFiles: string[];
		try {
			metadata = findPackageMetadata(registeredPath);
			roleFiles = listMarkdownFiles(registeredPath);
		} catch (error) {
			diagnostics.push({
				code: "unreadable-role-pack-path",
				message: `Cannot read registered role-pack path ${registeredPath}: ${error instanceof Error ? error.message : String(error)}`,
				path: registeredPath,
			});
			continue;
		}
		if (roleFiles.length === 0 && statSync(registeredPath).isFile()) {
			diagnostics.push({
				code: "invalid-role-pack-file",
				message: `Registered role-pack file must use the .md extension: ${registeredPath}`,
				path: registeredPath,
				provider: metadata.provider,
			});
			continue;
		}

		for (const filePath of roleFiles) {
			const fallbackName = basename(filePath, ".md");
			let content: string;
			try {
				content = readFileSync(filePath, "utf8");
			} catch (error) {
				diagnostics.push({
					code: "unreadable-role-definition",
					message: `Cannot read role definition ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
					path: filePath,
					agentName: fallbackName,
					provider: metadata.provider,
				});
				continue;
			}
			const legacyDiagnostic = legacyExternalCliDiagnostic(
				content,
				fallbackName,
				filePath,
			);
			if (legacyDiagnostic) {
				diagnostics.push({ ...legacyDiagnostic, provider: metadata.provider });
				continue;
			}
			const parsed = parseAgentDefinition(content, fallbackName);
			if (!parsed) {
				diagnostics.push({
					code: "invalid-role-definition",
					message: `Role definition must start with frontmatter: ${filePath}`,
					path: filePath,
					agentName: fallbackName,
					provider: metadata.provider,
				});
				continue;
			}
			if (parsed.name !== fallbackName) {
				diagnostics.push({
					code: "role-name-mismatch",
					message: `Role name "${parsed.name}" must match filename "${fallbackName}" in ${filePath}`,
					path: filePath,
					agentName: fallbackName,
					provider: metadata.provider,
				});
				continue;
			}
			if (!parsed.description) {
				diagnostics.push({
					code: "missing-role-description",
					message: `Role "${parsed.name}" must declare a description in ${filePath}`,
					path: filePath,
					agentName: parsed.name,
					provider: metadata.provider,
				});
				continue;
			}
			const definitions = contributed.get(parsed.name) ?? [];
			definitions.push({
				...parsed,
				source: "package",
				path: filePath,
				...metadata,
			});
			contributed.set(parsed.name, definitions);
		}
	}

	for (const [name, definitions] of contributed) {
		if (agents.has(name)) {
			diagnostics.push({
				code: "bundled-role-collision",
				message: `Role pack cannot replace bundled role "${name}"; use a global or project override instead.`,
				agentName: name,
			});
			continue;
		}
		if (definitions.length > 1) {
			const providers = definitions
				.map((definition) => definition.provider ?? definition.path)
				.sort((left, right) => left.localeCompare(right))
				.join(", ");
			diagnostics.push({
				code: "duplicate-package-role",
				message: `Role "${name}" is contributed by multiple role packs: ${providers}`,
				agentName: name,
			});
			continue;
		}
		agents.set(name, definitions[0]);
	}

	addDirectory(join(getAgentConfigDir(), "agents"), "global");
	addDirectory(join(process.cwd(), ".pi", "agents"), "project");

	return { agents: [...agents.values()], diagnostics };
}

function discoverAgentDefinitions(
	pi?: Pick<ExtensionAPI, "events">,
): ListedAgentDefinition[] {
	return discoverAgentCatalog(pi).agents;
}

function workflowRoles(catalog: AgentCatalog): WorkflowRole[] {
	return catalog.agents.map((agent) => ({
		name: agent.name,
		source: agent.source,
		path: agent.path,
		body: agent.body,
		model: agent.model,
		thinking: agent.thinking,
		tools: agent.tools,
		skills: agent.skills,
		denyTools: agent.denyTools,
		spawning: agent.spawning,
		autoExit: agent.autoExit,
		interactive: agent.interactive,
		sessionMode: agent.sessionMode,
		cwd: agent.cwd,
		disableModelInvocation: agent.disableModelInvocation,
	}));
}

function formatAgentSource(agent: ListedAgentDefinition): string {
	return agent.source === "package" && agent.provider
		? `package:${agent.provider}`
		: agent.source;
}

function formatVisibleAgentDefinitions(
	agents: ListedAgentDefinition[],
): string[] {
	return agents
		.filter((agent) => !agent.disableModelInvocation)
		.map((agent) => {
			const badge = ` (${formatAgentSource(agent)})`;
			const desc = agent.description ? ` — ${agent.description}` : "";
			const model = agent.model ? ` [${agent.model}]` : "";
			return `• ${agent.name}${badge}${model}${desc}`;
		});
}

function formatAgentDiagnostics(diagnostics: AgentDiagnostic[]): string[] {
	return diagnostics.map((diagnostic) => `! ${diagnostic.message}`);
}

function resolveEffectiveSessionMode(
	params: Static<typeof SubagentParams>,
	agentDefs: AgentDefaults | null,
): SubagentSessionMode {
	if (params.fork) return "fork";
	return agentDefs?.sessionMode ?? "standalone";
}

function resolveLaunchBehavior(
	params: Static<typeof SubagentParams>,
	agentDefs: AgentDefaults | null,
): {
	sessionMode: SubagentSessionMode;
	seededSessionMode: "lineage-only" | "fork" | null;
	inheritsConversationContext: boolean;
	taskDelivery: "direct" | "artifact";
} {
	const sessionMode = resolveEffectiveSessionMode(params, agentDefs);
	const inheritsConversationContext = sessionMode === "fork";
	return {
		sessionMode,
		seededSessionMode: sessionMode === "standalone" ? null : sessionMode,
		inheritsConversationContext,
		taskDelivery: inheritsConversationContext ? "direct" : "artifact",
	};
}

/**
 * Decide whether a subagent is interactive (user-driven, long-running).
 *
 * Resolution order:
 *   1. Explicit `interactive` tool parameter wins.
 *   2. Explicit `interactive` frontmatter field on the agent.
 *   3. Default: the inverse of `auto-exit`. Agents that auto-exit are
 *      autonomous (scout, worker, reviewer) and the parent session should be
 *      woken on stall/recovery transitions. Agents that don't auto-exit are
 *      driven by the user in their own pane (planner, iterate/fork) and
 *      stall pings are noise.
 *
 * When no agent defs exist at all (bare `subagent({ name, task })` call,
 * typical for `/iterate` with `fork: true`), `autoExit` is undefined and the
 * subagent is treated as interactive — matching the intent of iterate.
 */
function resolveEffectiveAutoExit(
	params: Static<typeof SubagentParams>,
	agentDefs: AgentDefaults | null,
): boolean {
	// Named agents preserve their declared behavior. Bare tool calls are
	// autonomous by default, including full-context forks: `fork` controls
	// context inheritance, not whether the child should remain open. Interactive
	// flows such as /iterate opt out explicitly with `interactive: true`.
	if (agentDefs) return agentDefs.autoExit ?? false;
	return params.interactive !== true;
}

function resolveEffectiveInteractive(
	params: Static<typeof SubagentParams>,
	agentDefs: AgentDefaults | null,
): boolean {
	if (params.interactive != null) return params.interactive;
	if (agentDefs?.interactive != null) return agentDefs.interactive;
	return !resolveEffectiveAutoExit(params, agentDefs);
}

function loadAgentDefaults(
	agentName: string,
	pi?: Pick<ExtensionAPI, "events">,
): ListedAgentDefinition | null {
	return (
		discoverAgentCatalog(pi).agents.find((agent) => agent.name === agentName) ??
		null
	);
}

function formatElapsed(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}m ${s}s`;
}

function muxUnavailableResult() {
	return {
		content: [
			{
				type: "text" as const,
				text: `Subagents require herdr. ${terminalSetupHint()}`,
			},
		],
		details: { error: "herdr not available" },
	};
}

/**
 * Build the internal artifact directory path for the current session.
 * Used by the subagents extension to stash task files, system prompts, and
 * launch scripts for sub-agents. Path convention:
 *   <sessionDir>/artifacts/<session-id>/
 */
function getArtifactDir(sessionDir: string, sessionId: string): string {
	return join(sessionDir, "artifacts", sessionId);
}

function shouldRetainSubagentSurface(
	running: Pick<RunningSubagent, "worktree"> | { worktree?: unknown },
): boolean {
	return !!running.worktree;
}

const BUNDLED_WORKTREE_WARNINGS: Readonly<Record<string, string>> = {
	scout:
		"The bundled scout role is read-only and normally does not need a new worktree. " +
		"Use an ordinary pane instead; to inspect an existing worker result, start it in the retained worktree path. " +
		"Herdr worktree workspaces persist until explicitly removed.",
	reviewer:
		"The bundled reviewer role is read-only and normally does not need a new worktree. " +
		"Use an ordinary pane instead; to review an existing worker result, start it in the retained worktree path. " +
		"Herdr worktree workspaces persist until explicitly removed.",
	"adversarial-reviewer":
		"The bundled adversarial-reviewer coordinates read-only reviewers and writes review artifacts. " +
		"It normally uses an ordinary pane, not a new worktree. " +
		"Herdr worktree workspaces persist until explicitly removed.",
};

function resolveWorktreeLaunchWarning(
	params: Pick<Static<typeof SubagentParams>, "agent" | "worktree">,
	pi?: Pick<ExtensionAPI, "events">,
): string | undefined {
	if (!params.worktree || !params.agent) return undefined;
	const warning = BUNDLED_WORKTREE_WARNINGS[params.agent];
	return warning && loadAgentDefaults(params.agent, pi)?.source === "package"
		? warning
		: undefined;
}

function finalizeSubagentSurface(
	running: RunningSubagent,
	state: "ready_for_review" | "failed" | "needs_help",
	ignoreCloseError = false,
): WorktreeHandoff | undefined {
	if (running.worktree) {
		let handoff = captureWorktreeHandoff(running.worktree);
		try {
			persistWorktreeResult(running.worktree, state, handoff);
		} catch (error: any) {
			handoff = {
				...handoff,
				gitError: [
					handoff.gitError,
					`Manifest update failed: ${error?.message ?? String(error)}`,
				]
					.filter(Boolean)
					.join("; "),
			};
		}
		return handoff;
	}

	try {
		closePane(running.surface);
	} catch (error) {
		if (!ignoreCloseError) throw error;
	}
	return undefined;
}

const statusConfig = loadStatusConfig();
const modelConfig = loadModelConfig();

const MAX_RESULT_PRESENTATION_CHARS = 16_000;
const MAX_SESSION_REFERENCE_CHARS = 10_000;
const RESULT_CONTINUATION_PROMPT =
	"Parent action: Continue the parent task using this result; do not return an empty response.";

function abbreviateMiddle(
	value: string,
	maxChars: number,
	marker: string,
): string {
	if (value.length <= maxChars) return value;

	const retainedChars = maxChars - marker.length;
	const headChars = Math.ceil(retainedChars / 2);
	const tailChars = Math.floor(retainedChars / 2);
	return (
		value.slice(0, headChars) +
		marker +
		(tailChars ? value.slice(-tailChars) : "")
	);
}

function boundResultPresentation(body: string, sessionRef: string): string {
	const boundedSessionRef = abbreviateMiddle(
		sessionRef,
		MAX_SESSION_REFERENCE_CHARS,
		"\n[... session reference abbreviated ...]\n",
	);
	if (body.length + boundedSessionRef.length <= MAX_RESULT_PRESENTATION_CHARS) {
		return body + boundedSessionRef;
	}

	const marker = boundedSessionRef
		? "\n\n[... result abbreviated; full output remains in the child session below ...]\n\n"
		: "\n\n[... result abbreviated ...]\n\n";
	const retainedChars =
		MAX_RESULT_PRESENTATION_CHARS - marker.length - boundedSessionRef.length;
	return (
		abbreviateMiddle(body, retainedChars + marker.length, marker) +
		boundedSessionRef
	);
}

function formatSessionReference(sessionFile?: string): string {
	return sessionFile
		? `\n\nSession: ${sessionFile}\nResume: pi --session ${sessionFile}`
		: "";
}

function resolveUnexpectedErrorPresentation(
	prefix: string,
	error: unknown,
	sessionFile?: string,
): string {
	const message = error instanceof Error ? error.message : String(error);
	return boundResultPresentation(
		`${prefix}: ${message}`,
		formatSessionReference(sessionFile),
	);
}

function sendSubagentResult(
	api: Pick<ExtensionAPI, "sendMessage">,
	content: string,
	details: Record<string, unknown>,
): void {
	const resultContent = boundResultPresentation(content, "");
	const promptContent = boundResultPresentation(
		`${resultContent}\n\n${RESULT_CONTINUATION_PROMPT}`,
		"",
	);
	api.sendMessage(
		{
			customType: "subagent_result",
			content: promptContent,
			display: true,
			details: { ...details, resultContent },
		},
		{ triggerTurn: true, deliverAs: "steer" },
	);
}

function formatWorktreeHandoff(worktree: WorktreeHandoff): string {
	const state = worktree.gitError
		? "inspection unknown"
		: worktree.conflicted
			? "conflicted"
			: worktree.clean
				? "clean"
				: "dirty";
	const ahead =
		worktree.commitsAhead == null
			? "commits ahead unknown"
			: `${worktree.commitsAhead} commit${worktree.commitsAhead === 1 ? "" : "s"} ahead`;
	const lines = [
		"Worktree result retained for review:",
		`Worktree: ${worktree.path}`,
		`Workspace: ${worktree.workspaceId}`,
		`Branch: ${worktree.branch}`,
		`Base/head: ${worktree.baseSha} -> ${worktree.headSha ?? "unknown"}`,
		`State: ${state} · ${ahead}`,
	];
	if (worktree.changedFiles?.length)
		lines.push(`Changed: ${worktree.changedFiles.join(", ")}`);
	if (worktree.untrackedFiles?.length)
		lines.push(`Untracked: ${worktree.untrackedFiles.join(", ")}`);
	if (worktree.gitError)
		lines.push(`Git inspection warning: ${worktree.gitError}`);
	lines.push(
		"After review and preservation, remove the workspace with:",
		`  herdr worktree remove --workspace ${worktree.workspaceId}`,
	);
	return lines.join("\n");
}

function resolveResultPresentation(
	result: Pick<
		SubagentResult,
		| "exitCode"
		| "elapsed"
		| "summary"
		| "sessionFile"
		| "errorMessage"
		| "fallbackAttempts"
		| "worktree"
	>,
	name: string,
	runtimeMismatch?: string,
): string {
	const sessionRef = formatSessionReference(result.sessionFile);
	let body: string;

	if (result.errorMessage) {
		// Auto-retry exhausted or other agent-loop error. The subagent did not
		// produce a usable result — surface the underlying provider/network
		// failure so the orchestrator can decide whether to retry, resume, or
		// change approach instead of silently treating the run as completed.
		body =
			`Sub-agent "${name}" failed after ${formatElapsed(result.elapsed)} ` +
			`(provider/agent error — auto-retry exhausted).\n\n` +
			`Error: ${result.errorMessage}\n\n` +
			`The subagent did not produce a result. You can retry by spawning a new ` +
			`subagent or resume the session with subagent_resume.`;
	} else {
		body =
			result.exitCode === 0
				? `Sub-agent "${name}" completed (${formatElapsed(result.elapsed)}).\n\n${result.summary}`
				: `Sub-agent "${name}" failed (exit code ${result.exitCode}).\n\n${result.summary}`;
	}

	if (result.fallbackAttempts && result.fallbackAttempts.length > 1) {
		body += `\n\nModels attempted: ${result.fallbackAttempts.join(", ")}`;
	}
	if (result.worktree) body += `\n\n${formatWorktreeHandoff(result.worktree)}`;
	const runtimeWarning = runtimeMismatch
		? `\n\nRuntime warning: ${runtimeMismatch}`
		: "";
	return boundResultPresentation(body, sessionRef + runtimeWarning);
}

/**
 * Result from running a single subagent.
 */
interface SubagentResult {
	name: string;
	task: string;
	summary: string;
	sessionFile?: string;
	exitCode: number;
	elapsed: number;
	error?: string;
	/** Provider/agent error message when auto-retry exhausted (overload, rate limit, etc.). */
	errorMessage?: string;
	/** Ordered models launched for this run, including failed fallback attempts. */
	fallbackAttempts?: string[];
	ping?: { name: string; message: string };
	worktree?: WorktreeHandoff;
}

/**
 * State for a launched (but not yet completed) subagent.
 */
interface RunningSubagent {
	id: string;
	name: string;
	task: string;
	agent?: string;
	surface: string;
	startTime: number;
	sessionFile: string;
	launchScriptFile?: string;
	activityFile?: string;
	activity?: SubagentActivityState;
	activityRead?: {
		ok: boolean;
		reason?: "missing" | "invalid" | "wrong-id";
		error?: string;
	};
	abortController?: AbortController;
	/**
	 * Optional legacy status snapshot retained only for hydrating pre-lifecycle
	 * runtime entries after /reload. Live observation uses `lifecycle` only.
	 */
	statusState?: SubagentStatusState;
	lifecycle: SubagentLifecycle;
	/** Last projected kind used to detect stalled/recovered transitions. */
	lastProjectedKind?: LifecycleProjection["kind"];
	/**
	 * When true, status transitions (stalled/recovered) do not wake the parent
	 * session via a steer message. The widget still updates locally. Used for
	 * long-running agents where the user drives the conversation in the
	 * subagent's pane (e.g. planner).
	 */
	interactive: boolean;
	/** Parent-resolved model/thinking selection and provenance. */
	runtimePlan: ResolvedRuntimePlan | undefined;
	worktree?: WorktreeLaunch;
}

interface WorkflowChildHandle {
	controller: AbortController;
	surface?: string;
}

interface WorkflowOwner {
	runId: string;
	candidate: PendingWorkflow;
	children: Map<string, WorkflowChildHandle>;
	controller: AbortController;
	worker?: { terminate(): Promise<number> };
	gate: WorkflowTerminalGate;
	checkout?: string;
	journal?: ReturnType<typeof createWorkflowJournal>;
	cancelPromise?: Promise<WorkflowTerminalOutcome>;
}

interface WorkflowCancelHooks {
	getProcessInfo?: typeof getPaneProcessInfo;
	closeSurface?: typeof closePane;
	waitAbsence?: typeof waitForPaneAbsence;
	waitExit?: typeof waitForProcessesExit;
}

interface SubagentRuntime {
	runningSubagents: Map<string, RunningSubagent>;
	pendingWorkflow?: PendingWorkflow;
	activeWorkflow?: WorkflowOwner;
	workflowOutcomes: Map<string, WorkflowTerminalOutcome>;
	workflowStartupScanned: boolean;
	workflowCancelHooks?: WorkflowCancelHooks;
	pi?: ExtensionAPI;
	latestCtx?: ExtensionContext;
	modelCatalog?: string;
}

function createSubagentRuntime(): SubagentRuntime {
	return {
		runningSubagents: new Map<string, RunningSubagent>(),
		workflowOutcomes: new Map<string, WorkflowTerminalOutcome>(),
		workflowStartupScanned: false,
	};
}

/** Runtime state preserved across /reload. */
const runtime: SubagentRuntime =
	(globalThis as any)[RUNTIME_KEY] ??
	((globalThis as any)[RUNTIME_KEY] = createSubagentRuntime());
if (!runtime.workflowOutcomes) {
	runtime.workflowOutcomes = new Map<string, WorkflowTerminalOutcome>();
}
if (runtime.workflowStartupScanned === undefined) {
	runtime.workflowStartupScanned = false;
}
const runningSubagents = runtime.runningSubagents;

export function shouldPreserveSubagentsOnShutdown(reason: unknown): boolean {
	return (
		reason === "reload" ||
		reason === "new" ||
		reason === "resume" ||
		reason === "fork"
	);
}

export function cleanupSubagentsForShutdown(
	reason: unknown,
	agents: Map<string, Pick<RunningSubagent, "abortController" | "lifecycle">>,
): void {
	if (shouldPreserveSubagentsOnShutdown(reason)) return;

	for (const agent of agents.values()) {
		if (agent.lifecycle) {
			agent.lifecycle = markDelivery(agent.lifecycle, "suppressed");
		}
		agent.abortController?.abort();
	}
	agents.clear();
}

export function shouldDeliverSubagentCompletion(
	running: Pick<RunningSubagent, "lifecycle">,
): boolean {
	// Authoritative gate: only pending deliveries may be sent.
	// Missing lifecycle (pre-migration fixtures) defaults to pending/true.
	return (running.lifecycle?.delivery ?? "pending") === "pending";
}

export function selectCompletionApi<T>(previous: T, current: T | undefined): T {
	return current ?? previous;
}

// ── Widget management ──

/** Interval timer for widget re-renders. */
let widgetInterval: ReturnType<typeof setInterval> | null = null;

/** Interval timer for status transition checks. */
let statusInterval: ReturnType<typeof setInterval> | null = null;

function formatElapsedMMSS(startTime: number, endTime = Date.now()): string {
	const seconds = Math.floor((endTime - startTime) / 1000);
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const ACTIVE_ACCENT = "\x1b[38;2;77;163;255m";
const OPEN_ACCENT = "\x1b[38;2;214;158;46m";
const RST = "\x1b[0m";

/**
 * Build a bordered content line: │left          right│
 * Left content is truncated if needed, right is preserved, padded to fill width.
 */
function borderLine(
	left: string,
	right: string,
	width: number,
	accent = ACTIVE_ACCENT,
): string {
	if (width <= 0) return "";
	if (width === 1) return `${accent}│${RST}`;

	// width = total visible chars for the whole line including │ and │
	const contentWidth = Math.max(0, width - 2); // space inside the two │ chars
	const rightVis = visibleWidth(right);

	// If the status chunk alone is too wide, prefer preserving it in compact form
	// rather than overflowing the terminal.
	if (rightVis >= contentWidth) {
		const truncRight = truncateToWidth(right, contentWidth);
		const rightPad = Math.max(0, contentWidth - visibleWidth(truncRight));
		return `${accent}│${RST}${truncRight}${" ".repeat(rightPad)}${accent}│${RST}`;
	}

	const maxLeft = Math.max(0, contentWidth - rightVis);
	const truncLeft = truncateToWidth(left, maxLeft);
	const leftVis = visibleWidth(truncLeft);
	const pad = Math.max(0, contentWidth - leftVis - rightVis);
	return `${accent}│${RST}${truncLeft}${" ".repeat(pad)}${right}${accent}│${RST}`;
}

/**
 * Build the bordered top line: ╭─ Title ──── info ─╮
 * All chars are accounted for within `width`.
 */
function borderTop(
	title: string,
	info: string,
	width: number,
	accent = ACTIVE_ACCENT,
): string {
	if (width <= 0) return "";
	if (width === 1) return `${accent}╭${RST}`;

	// ╭─ Title ───...─── info ─╮
	// overhead: ╭─ (2) + space around title (2) + space around info (2) + ─╮ (2) = but we simplify
	const inner = Math.max(0, width - 2); // inside ╭ and ╮
	const titlePart = `─ ${title} `;
	const infoPart = ` ${info} ─`;
	const fillLen = Math.max(0, inner - titlePart.length - infoPart.length);
	const fill = "─".repeat(fillLen);
	const content = `${titlePart}${fill}${infoPart}`
		.slice(0, inner)
		.padEnd(inner, "─");
	return `${accent}╭${content}╮${RST}`;
}

/**
 * Build the bordered bottom line: ╰──────────────────╯
 */
function borderBottom(width: number, accent = ACTIVE_ACCENT): string {
	if (width <= 0) return "";
	if (width === 1) return `${accent}╰${RST}`;

	const inner = Math.max(0, width - 2);
	return `${accent}╰${"─".repeat(inner)}╯${RST}`;
}

function formatLifecycleWidgetLabel(
	projection: ReturnType<typeof projectLifecycle>,
	now: number,
): string {
	const duration =
		projection.stateDurationSince == null
			? ""
			: ` ${formatElapsedDuration(now - projection.stateDurationSince)}`;
	if (projection.kind === "active")
		return projection.label
			? ` active · ${projection.label}${duration} `
			: ` active${duration} `;
	if (projection.kind === "blocked") return ` blocked${duration} `;
	if (projection.kind === "running") return " running… ";
	if (projection.kind === "waiting") return ` waiting${duration} `;
	if (projection.kind === "interrupted") return ` interrupted${duration} `;
	if (projection.kind === "stalled") return ` stalled${duration} `;
	// completed/failed exist as lifecycle projections for delivery bookkeeping,
	// but the row is removed immediately after result delivery — so the only
	// visible terminal handoff label is finalizing.
	if (
		projection.kind === "finalizing" ||
		projection.kind === "completed" ||
		projection.kind === "failed"
	) {
		return " finalizing… ";
	}
	return " starting… ";
}

function renderSubagentWidgetLines(
	agents: RunningSubagent[],
	width: number,
): string[] {
	const now = Date.now();
	const rendered = agents.map((agent) => ({
		agent,
		projection: projectLifecycle(ensureLifecycle(agent), now),
	}));
	const activeCount = rendered.filter(
		({ projection }) =>
			projection.kind === "active" ||
			projection.kind === "starting" ||
			projection.kind === "running" ||
			projection.kind === "blocked",
	).length;
	const openCount = agents.length - activeCount;
	const info =
		activeCount > 0
			? openCount > 0
				? `${activeCount} active · ${openCount} open`
				: `${activeCount} active`
			: `${openCount} open`;
	const accent = activeCount > 0 ? ACTIVE_ACCENT : OPEN_ACCENT;

	const lines: string[] = [borderTop("Subagents", info, width, accent)];

	for (const { agent, projection } of rendered) {
		const elapsed = formatElapsedMMSS(
			agent.startTime,
			projection.runtimeEndedAt ?? now,
		);
		const agentTag = agent.agent ? ` (${agent.agent})` : "";
		const left = ` ${elapsed}  ${agent.name}${agentTag} `;
		const runtimeTag = agent.runtimePlan
			? `${agent.runtimePlan.modelId}|${agent.runtimePlan.thinking} · `
			: "";
		const right = statusConfig.enabled
			? ` ${runtimeTag}${formatLifecycleWidgetLabel(projection, now).trim()} `
			: ` ${runtimeTag}starting… `;

		lines.push(borderLine(left, right, width, accent));
	}

	lines.push(borderBottom(width, accent));
	return lines;
}

function updateWidget() {
	const latestCtx = runtime.latestCtx;
	if (!latestCtx?.hasUI) return;

	if (runningSubagents.size === 0) {
		latestCtx.ui.setWidget("subagent-status", undefined);
		if (widgetInterval) {
			clearInterval(widgetInterval);
			widgetInterval = null;
			(globalThis as any)[WIDGET_INTERVAL_KEY] = null;
		}
		return;
	}

	latestCtx.ui.setWidget(
		"subagent-status",
		(_tui: any, _theme: any) => {
			return {
				invalidate() {},
				render(width: number) {
					return renderSubagentWidgetLines(
						Array.from(runningSubagents.values()),
						width,
					);
				},
			};
		},
		{ placement: "aboveEditor" },
	);
}

/**
 * Build the positional prompt args for a Pi CLI subagent launch.
 *
 * In artifact-backed launches (lineage-only, standalone), Pi's buildInitialMessage()
 * concatenates @file content with messages[0] into one initial prompt. That breaks
 * /skill: expansion because the message no longer starts with "/skill:". Only
 * messages[1..] are sent as separate follow-up prompts where /skill: is recognized.
 *
 * When there are skill prompts AND artifact-backed delivery, we prepend an empty
 * first positional message so that /skill: args land in messages[1..] and arrive
 * as standalone prompts in the child session.
 */
function buildPiPromptArgs(params: {
	effectiveSkills?: string;
	taskDelivery: "direct" | "artifact";
	taskArg: string;
}): string[] {
	const skillPrompts = (params.effectiveSkills ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
		.map((skill) => `/skill:${skill}`);

	const needsSeparator =
		params.taskDelivery === "artifact" && skillPrompts.length > 0;

	return [...(needsSeparator ? [""] : []), ...skillPrompts, params.taskArg];
}

function ensureLifecycle(running: RunningSubagent): SubagentLifecycle {
	if (running.lifecycle) return running.lifecycle;
	let lifecycle = createLifecycle(running.startTime);
	const state = running.statusState;
	if (
		state?.activityLabel === "interrupted" &&
		state.localOverrideAtMs != null
	) {
		lifecycle = markInterruptRequested(lifecycle, state.localOverrideAtMs);
	} else if (state?.phase === "done") {
		// Legacy activity "done" means the turn ended, not that completion
		// evidence was recorded. Hydrate as Herdr-style waiting and let the
		// preserved watcher consume sidecar/sentinel evidence.
		const observedAt = state.lastActivityAtMs ?? running.startTime;
		lifecycle = observePaneInspection(
			lifecycle,
			{ kind: "present", observedAt, agentStatus: "done" },
			observedAt,
		);
	} else if (
		state?.phase === "active" ||
		state?.phase === "waiting" ||
		state?.phase === "starting"
	) {
		lifecycle = observeActivity(
			lifecycle,
			{
				ok: true,
				activity: {
					version: 1,
					runningChildId: running.id,
					createdAt: running.startTime,
					updatedAt: state.lastActivityAtMs ?? running.startTime,
					sequence: state.lastActivitySequence ?? 0,
					latestEvent:
						state.latestEvent === "agent_end" ? "agent_end" : "agent_start",
					phase: state.phase,
					agentActive: state.phase === "active",
					turnActive: state.phase === "active",
					providerActive: false,
					toolActive: state.activeScope === "tool",
					...(state.activeScope ? { activeScope: state.activeScope as any } : {}),
					...(state.activeSinceMs == null
						? {}
						: { activeSince: state.activeSinceMs }),
					...(state.waitingSinceMs == null
						? {}
						: { waitingSince: state.waitingSinceMs }),
					...(state.activityLabel && state.activeScope === "tool"
						? { toolName: state.activityLabel }
						: {}),
				},
			},
			state.lastActivityAtMs ?? running.startTime,
		);
	} else if (running.startTime) {
		// Pre-lifecycle Pi agents without a known phase still get a running process.
		lifecycle = markProcessRunning(lifecycle, running.startTime);
	}
	running.lifecycle = lifecycle;
	return lifecycle;
}

function observeRunningSubagent(
	running: RunningSubagent,
	observedAt = Date.now(),
) {
	ensureLifecycle(running);

	const activityFile = running.activityFile;
	const read: ActivityReadResult = activityFile
		? readSubagentActivityFile(activityFile, running.id)
		: { ok: false, reason: "missing" };

	running.activityRead = read.ok
		? { ok: true }
		: { ok: false, reason: read.reason, error: read.error };

	if (read.ok) running.activity = read.activity;
	running.lifecycle = observeActivity(
		ensureLifecycle(running),
		read,
		observedAt,
	);
}

function resolveInterruptTarget(params: {
	id?: string;
	name?: string;
}): { running: RunningSubagent } | { error: string } {
	const requestedId = params.id?.trim();
	if (requestedId) {
		const running = runningSubagents.get(requestedId);
		return running
			? { running }
			: { error: `No running subagent with id "${requestedId}".` };
	}

	const requestedName = params.name?.trim();
	if (!requestedName) {
		return { error: "Provide a running subagent id or exact display name." };
	}

	const matches = Array.from(runningSubagents.values()).filter(
		(running) => running.name === requestedName,
	);
	if (matches.length === 1) return { running: matches[0] };
	if (matches.length === 0) {
		return { error: `No running subagent named "${requestedName}".` };
	}

	const candidates = matches
		.map((running) => `${running.name} [${running.id}]`)
		.join(", ");
	return {
		error: `Ambiguous subagent name "${requestedName}". Matches: ${candidates}`,
	};
}

function requestSubagentInterrupt(
	running: RunningSubagent,
	interruptPaneKey: (surface: string) => void = interruptPane,
): { ok: true } | { error: string } {
	try {
		interruptPaneKey(running.surface);
		return { ok: true };
	} catch (error: any) {
		return {
			error:
				`Failed to send Escape to subagent "${running.name}" via herdr: ` +
				`${error?.message ?? String(error)}`,
		};
	}
}

interface SubagentInterruptDetails {
	error?: string;
	id?: string;
	name?: string;
	status?: "interrupt_requested";
}

function handleSubagentInterrupt(
	params: { id?: string; name?: string },
	interruptPaneKey: (surface: string) => void = interruptPane,
): AgentToolResult<SubagentInterruptDetails> {
	const resolved = resolveInterruptTarget(params);
	if ("error" in resolved) {
		return {
			content: [{ type: "text" as const, text: resolved.error }],
			details: { error: resolved.error },
		};
	}

	const running = resolved.running;
	const now = Date.now();
	observeRunningSubagent(running, now);

	const interruption = requestSubagentInterrupt(running, interruptPaneKey);
	if ("error" in interruption) {
		return {
			content: [{ type: "text" as const, text: interruption.error }],
			details: {
				error: interruption.error,
				id: running.id,
				name: running.name,
			},
		};
	}

	running.lifecycle = markInterruptRequested(ensureLifecycle(running), now);
	updateWidget();

	return {
		content: [
			{
				type: "text" as const,
				text: `Interrupt requested for subagent "${running.name}".`,
			},
		],
		details: {
			id: running.id,
			name: running.name,
			status: "interrupt_requested",
		},
	};
}

function startStatusRefresh(pi: ExtensionAPI) {
	if (!statusConfig.enabled || statusInterval) return;

	statusInterval = setInterval(() => {
		if (runningSubagents.size === 0) {
			if (statusInterval) {
				clearInterval(statusInterval);
				statusInterval = null;
				(globalThis as any)[STATUS_INTERVAL_KEY] = null;
			}
			return;
		}

		const transitionLines: string[] = [];
		const now = Date.now();
		let shouldRefreshWidget = false;

		for (const running of runningSubagents.values()) {
			// Dual-writes lifecycle + statusState for reload hydration; steers use lifecycle only.
			observeRunningSubagent(running, now);
			const projection = projectLifecycle(ensureLifecycle(running), now);
			const transition = lifecycleTransition(
				running.lastProjectedKind,
				projection.kind,
			);
			if (running.lastProjectedKind !== projection.kind) {
				shouldRefreshWidget = true;
			}
			running.lastProjectedKind = projection.kind;

			// Interactive subagents (long-running, user-driven) intentionally don't
			// wake the parent session on stalled/recovered transitions — the user is
			// working in the subagent's pane, and a steer message here would burn an
			// orchestrator turn on a no-op "still waiting" ping. Widget still updates.
			if (transition && !running.interactive) {
				transitionLines.push(
					formatLifecycleTransitionLine(
						normalizeStatusName(running.name),
						projection,
						transition,
						now,
						running.startTime,
						formatElapsedDuration,
					),
				);
			}
		}

		if (shouldRefreshWidget) updateWidget();

		if (transitionLines.length > 0) {
			const capped = capStatusLines(transitionLines, statusConfig.lineLimit);
			pi.sendMessage(
				{
					customType: "subagent_status",
					content: formatStatusAggregate(transitionLines, statusConfig.lineLimit),
					display: true,
					details: { lines: capped.visibleLines, overflow: capped.overflow },
				},
				{ triggerTurn: true, deliverAs: "steer" },
			);
		}
	}, 1000);

	(globalThis as any)[STATUS_INTERVAL_KEY] = statusInterval;
}

function buildBtwLaunchCommand(params: {
	cwd: string;
	sessionFile: string;
	question: string;
	model: string;
	thinking: string;
	agentDir?: string;
}): string {
	const parts = [
		"pi",
		"--session",
		shellQuote(params.sessionFile),
		"--no-extensions",
		"--model",
		shellQuote(params.model),
		"--thinking",
		shellQuote(params.thinking),
		shellQuote(BTW_BOUNDARY + params.question),
	];
	const envPrefix = params.agentDir
		? `PI_CODING_AGENT_DIR=${shellQuote(params.agentDir)} `
		: "";
	return `cd ${shellQuote(params.cwd)} && ${envPrefix}${parts.join(" ")}`;
}

function buildWorkflowChildCommand(params: {
	checkout: string;
	sessionFile: string;
	id: string;
	name: string;
	model: string;
	thinking: ThinkingLevel;
	tools: string[];
	rolePrompt?: string;
	task: string;
}): string {
	const parts = [
		"pi",
		"--no-extensions",
		"--no-skills",
		"--no-prompt-templates",
		"--no-context-files",
		"--no-approve",
		"--session",
		shellQuote(params.sessionFile),
		"-e",
		shellQuote(join(SUBAGENTS_DIR, "subagent-done.ts")),
		"--model",
		shellQuote(params.model),
		"--thinking",
		shellQuote(params.thinking),
		"--tools",
		shellQuote(params.tools.join(",")),
	];
	if (params.rolePrompt)
		parts.push("--system-prompt", shellQuote(params.rolePrompt));
	parts.push(shellQuote(params.task));
	const denied =
		"caller_ping,subagent_done,subagent,subagent_interrupt,subagent_resume,subagents_list,herdr_workflow";
	const env = [
		`PI_DENY_TOOLS=${shellQuote(denied)}`,
		`PI_SUBAGENT_AUTO_EXIT=1`,
		`PI_SUBAGENT_NAME=${shellQuote(params.name)}`,
		`PI_SUBAGENT_ID=${shellQuote(params.id)}`,
		`PI_SUBAGENT_SESSION=${shellQuote(params.sessionFile)}`,
		// Inherit the parent agent dir so workflow children resolve the same
		// deterministic/test provider configuration as the approving parent.
		...(process.env.PI_CODING_AGENT_DIR
			? [`PI_CODING_AGENT_DIR=${shellQuote(process.env.PI_CODING_AGENT_DIR)}`]
			: []),
	].join(" ");
	return `cd ${shellQuote(params.checkout)} && ${env} ${parts.join(" ")}; echo '__SUBAGENT_DONE_'$?'__'`;
}

function resolveWorkflowReviewNode(
	rolePolicies: WorkflowRolePolicy[],
	node: string | undefined,
	legacyRole: string | undefined,
): { policy: WorkflowRolePolicy } | { error: string } {
	const target = node ?? legacyRole ?? "";
	const matches = rolePolicies.filter((value) =>
		node === undefined ? value.role === legacyRole : value.id === node,
	);
	if (matches.length === 1) return { policy: matches[0] };
	if (node === undefined && matches.length > 1) {
		return {
			error: `Workflow role ${JSON.stringify(legacyRole)} is ambiguous; use a review node ID.`,
		};
	}
	return {
		error: `Workflow review node ${JSON.stringify(target)} is unavailable.`,
	};
}

export const __test__ = {
	borderLine,
	renderSubagentWidgetLines,
	loadAgentDefaults,
	discoverAgentDefinitions,
	resolveEffectiveSessionMode,
	resolveLaunchBehavior,
	resolveEffectiveAutoExit,
	resolveEffectiveInteractive,
	buildSubagentToolAllowlist,
	buildPiPromptArgs,
	buildBtwLaunchCommand,
	buildWorkflowChildCommand,
	resolveWorkflowReviewNode,
	observeRunningSubagent,
	resolveDenyTools,
	resolveInterruptTarget,
	requestSubagentInterrupt,
	handleSubagentInterrupt,
	resolveResultPresentation,
	resolveUnexpectedErrorPresentation,
	sendSubagentResult,
	shouldRetainSubagentSurface,
	resolveWorktreeLaunchWarning,
	captureWorktreeHandoff,
	runSubagentScript,
	writeWorktreeManifest,
	runningSubagents,
	formatElapsed,
	setWorkflowCancelHooks(hooks: WorkflowCancelHooks | undefined) {
		runtime.workflowCancelHooks = hooks;
	},
	getActiveWorkflow() {
		return runtime.activeWorkflow;
	},
};

function startWidgetRefresh() {
	if (widgetInterval) return;
	updateWidget(); // immediate first render
	widgetInterval = setInterval(() => {
		updateWidget();
	}, 1000);
	(globalThis as any)[WIDGET_INTERVAL_KEY] = widgetInterval;
}

/**
 * Launch a subagent: creates the herdr pane, builds the command, and
 * sends it. Returns a RunningSubagent — does NOT poll.
 *
 * Call watchSubagent() on the returned object to observe completion.
 */
async function launchSubagent(
	params: typeof SubagentParams.static,
	ctx: {
		sessionManager: {
			getSessionFile(): string | null | undefined;
			getSessionId(): string;
			getSessionDir(): string;
		};
		cwd: string;
		model?: { provider: string; id: string };
		modelRegistry: {
			find(provider: string, modelId: string): any;
			getAvailable?: () => any[];
			getAll?: () => any[];
			hasConfiguredAuth?: (model: any) => boolean;
		};
	},
	parentThinking: ThinkingLevel,
	options?: {
		surface?: string;
		runtimePlan?: ResolvedRuntimePlan;
		id?: string;
	},
): Promise<RunningSubagent> {
	const id = options?.id ?? Math.random().toString(16).slice(2, 10);

	const agentDefs = params.agent
		? loadAgentDefaults(params.agent, runtime.pi)
		: null;
	if (params.agent && !agentDefs) {
		const diagnostic = discoverAgentCatalog(runtime.pi).diagnostics.find(
			(candidate) => candidate.agentName === params.agent,
		);
		throw new Error(
			diagnostic?.message ?? `Agent "${params.agent}" was not found.`,
		);
	}
	if (!ctx.model)
		throw new Error("Subagent launch requires a resolved parent model");
	const runtimePlan =
		options?.runtimePlan ??
		resolveRuntimePlan(
			{ model: params.model, thinking: params.thinking },
			{
				model: resolveModelDefault(params.agent, agentDefs?.model, modelConfig),
				thinking: agentDefs?.thinking,
			},
			{
				provider: ctx.model.provider,
				modelId: ctx.model.id,
				thinking: parentThinking,
			},
			wrapPiModelRegistry(ctx.modelRegistry),
		);
	const effectiveTools = params.tools ?? agentDefs?.tools;
	const effectiveSkills = params.skills ?? agentDefs?.skills;
	const effectiveAutoExit = resolveEffectiveAutoExit(params, agentDefs);
	const effectiveInteractive = resolveEffectiveInteractive(params, agentDefs);
	const parentSessionFile = ctx.sessionManager.getSessionFile();
	if (!parentSessionFile) throw new Error("No session file");

	const running = await launchPiSubagent({
		kind: "fresh",
		id,
		name: params.name,
		task: params.task,
		agent: params.agent,
		cwd: params.cwd,
		worktree: params.worktree,
		fork: params.fork,
		surface: options?.surface,
		parent: {
			cwd: ctx.cwd,
			invocationCwd: process.cwd(),
			sessionFile: parentSessionFile,
			sessionId: ctx.sessionManager.getSessionId(),
			sessionDir: ctx.sessionManager.getSessionDir(),
			agentDir: getAgentConfigDir(),
		},
		runtimePlan,
		behavior: {
			tools: effectiveTools,
			skills: effectiveSkills,
			deniedTools: [...resolveDenyTools(agentDefs)],
			autoExit: effectiveAutoExit,
			interactive: effectiveInteractive,
			identity: agentDefs?.body ?? params.systemPrompt,
			systemPromptMode: agentDefs?.systemPromptMode,
			sessionMode: resolveEffectiveSessionMode(params, agentDefs),
			cwd: agentDefs?.cwd,
		},
	});
	runningSubagents.set(id, running);
	return running;
}

/**
 * Watch a launched subagent until it exits. Polls for completion, extracts
 * the summary from the session file, and closes ordinary panes. Worktree
 * workspaces are retained for parent review.
 */
function resolveSubagentRuntimePlans(
	params: typeof SubagentParams.static,
	ctx: Parameters<typeof launchSubagent>[1],
	parentThinking: ThinkingLevel,
): ResolvedRuntimePlan[] {
	const agentDefs = params.agent
		? loadAgentDefaults(params.agent, runtime.pi)
		: null;
	if (params.agent && !agentDefs) {
		const diagnostic = discoverAgentCatalog(runtime.pi).diagnostics.find(
			(candidate) => candidate.agentName === params.agent,
		);
		throw new Error(
			diagnostic?.message ?? `Agent "${params.agent}" was not found.`,
		);
	}
	if (!ctx.model)
		throw new Error("Subagent launch requires a resolved parent model");
	const plans = resolveRuntimePlans(
		{ model: params.model, thinking: params.thinking },
		{
			model: resolveModelDefault(params.agent, agentDefs?.model, modelConfig),
			thinking: agentDefs?.thinking,
		},
		{
			provider: ctx.model.provider,
			modelId: ctx.model.id,
			thinking: parentThinking,
		},
		wrapPiModelRegistry(ctx.modelRegistry),
	);
	if (params.worktree && plans.length > 1) {
		throw new Error("Model fallbacks are not supported for worktree subagents.");
	}
	return plans;
}

async function launchSubagentWithFallbacks(
	params: typeof SubagentParams.static,
	ctx: Parameters<typeof launchSubagent>[1],
	parentThinking: ThinkingLevel,
	plans: ResolvedRuntimePlan[],
): Promise<{ running: RunningSubagent; index: number }> {
	const failures: string[] = [];
	for (const [index, plan] of plans.entries()) {
		try {
			return {
				running: await launchSubagent(params, ctx, parentThinking, {
					runtimePlan: plan,
				}),
				index,
			};
		} catch (error) {
			failures.push(
				`${plan.model}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
	throw new Error(
		`Subagent could not launch with any configured model. Attempted: ${plans.map((plan) => plan.model).join(", ")}. ${failures.join("; ")}`,
	);
}

async function watchSubagent(
	running: RunningSubagent,
	signal: AbortSignal,
): Promise<SubagentResult> {
	const { name, task, surface, startTime, sessionFile } = running;

	try {
		const result = await waitForCompletion(signal, {
			intervalMs: 1000,
			sessionFile,
			readTerminalTail: () => readPaneAsync(surface, 5),
			inspectPane: async () => inspectPane(surface),
			onPaneInspection: (inspection: PaneInspection, observedAt: number) => {
				ensureLifecycle(running);
				running.lifecycle = observePaneInspection(
					running.lifecycle,
					inspection,
					observedAt,
				);
				updateWidget();
			},
			onTick() {
				observeRunningSubagent(running);
			},
		});

		const detectedAt = Date.now();
		running.lifecycle = markCompletionDetected(
			running.lifecycle,
			result,
			detectedAt,
		);
		updateWidget();
		const elapsed = Math.floor((detectedAt - startTime) / 1000);

		let summary: string;
		if (existsSync(sessionFile)) {
			const allEntries = getNewEntries(sessionFile, 0);
			const observed = findObservedSessionRuntime(allEntries);
			if (running.runtimePlan && observed.provider && observed.modelId) {
				const observedModel = `${observed.provider}/${observed.modelId}`;
				const observedThinking =
					observed.thinking === "off" ||
					observed.thinking === "minimal" ||
					observed.thinking === "low" ||
					observed.thinking === "medium" ||
					observed.thinking === "high" ||
					observed.thinking === "xhigh" ||
					observed.thinking === "max"
						? observed.thinking
						: undefined;
				const mismatch =
					observedModel === running.runtimePlan.model
						? undefined
						: `Resolved model ${running.runtimePlan.model} but child reported ${observedModel}`;
				running.runtimePlan = {
					...running.runtimePlan,
					...(observedThinking ? { thinking: observedThinking } : {}),
					observed: {
						model: observedModel,
						...(observedThinking ? { thinking: observedThinking } : {}),
					},
					...(mismatch ? { runtimeMismatch: mismatch } : {}),
				};
			}
			summary =
				findLastAssistantMessage(allEntries) ??
				(result.errorMessage
					? `Subagent error: ${result.errorMessage}`
					: result.exitCode === 0
						? "Sub-agent exited without output"
						: `Sub-agent exited with code ${result.exitCode}`);
		} else {
			summary = result.errorMessage
				? `Subagent error: ${result.errorMessage}`
				: result.exitCode === 0
					? "Sub-agent exited without output"
					: `Sub-agent exited with code ${result.exitCode}`;
		}

		const worktreeHandoff = finalizeSubagentSurface(
			running,
			result.ping
				? "needs_help"
				: result.exitCode === 0
					? "ready_for_review"
					: "failed",
		);
		running.lifecycle =
			result.exitCode === 0
				? markCompleted(running.lifecycle, Date.now())
				: markFailed(
						running.lifecycle,
						result.errorMessage ?? summary,
						Date.now(),
						result.exitCode,
					);

		return {
			name,
			task,
			summary,
			sessionFile,
			exitCode: result.exitCode,
			elapsed,
			ping: result.ping,
			...(result.errorMessage ? { errorMessage: result.errorMessage } : {}),
			...(worktreeHandoff ? { worktree: worktreeHandoff } : {}),
		};
	} catch (err: any) {
		const worktreeHandoff = finalizeSubagentSurface(running, "failed", true);
		running.lifecycle = markFailed(
			running.lifecycle,
			signal.aborted ? "Subagent cancelled." : (err?.message ?? String(err)),
			Date.now(),
			1,
		);
		updateWidget();

		if (signal.aborted) {
			return {
				name,
				task,
				summary: "Subagent cancelled.",
				exitCode: 1,
				elapsed: Math.floor((Date.now() - startTime) / 1000),
				error: "cancelled",
				sessionFile,
				...(worktreeHandoff ? { worktree: worktreeHandoff } : {}),
			};
		}
		return {
			name,
			task,
			summary: `Subagent error: ${err?.message ?? String(err)}`,
			exitCode: 1,
			elapsed: Math.floor((Date.now() - startTime) / 1000),
			error: err?.message ?? String(err),
			...(worktreeHandoff ? { worktree: worktreeHandoff } : {}),
		};
	}
}

async function watchSubagentWithFallbacks(
	initial: RunningSubagent,
	initialPlanIndex: number,
	params: typeof SubagentParams.static,
	ctx: Parameters<typeof launchSubagent>[1],
	parentThinking: ThinkingLevel,
	plans: ResolvedRuntimePlan[],
	signal: AbortSignal,
): Promise<{ running: RunningSubagent; result: SubagentResult }> {
	let running = initial;
	let nextPlan = initialPlanIndex + 1;
	const attempts = [running.runtimePlan?.model].filter(
		(model): model is string => !!model,
	);

	for (;;) {
		const result = await watchSubagent(running, signal);
		const shouldRetry = !!result.errorMessage && nextPlan < plans.length;
		if (!shouldRetry) {
			return { running, result: { ...result, fallbackAttempts: attempts } };
		}

		runningSubagents.delete(running.id);
		updateWidget();
		const launchErrors: string[] = [];
		let launchedFallback = false;
		while (nextPlan < plans.length) {
			const plan = plans[nextPlan++];
			attempts.push(plan.model);
			try {
				running = await launchSubagent(params, ctx, parentThinking, {
					runtimePlan: plan,
					id: initial.id,
				});
				running.abortController = initial.abortController;
				launchedFallback = true;
				startWidgetRefresh();
				startStatusRefresh(runtime.pi!);
				break;
			} catch (error) {
				launchErrors.push(
					`${plan.model}: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}
		if (!launchedFallback) {
			return {
				running,
				result: {
					...result,
					errorMessage: `${result.errorMessage}\n\nFallback launch failures: ${launchErrors.join("; ")}`,
					fallbackAttempts: attempts,
				},
			};
		}
	}
}

export default function subagentsExtension(pi: ExtensionAPI) {
	runtime.pi = pi;
	let btwChild: BtwChild | undefined;

	const closeBtw = async (): Promise<boolean> => {
		const child = btwChild;
		if (!child) return false;

		let paneMissing = false;
		try {
			paneMissing = (await inspectPane(child.surface)).kind === "missing";
		} catch {
			// Best effort: try closing the pane directly when inspection is unavailable.
		}

		if (!paneMissing) {
			try {
				interruptPane(child.surface);
			} catch {
				// Escape is best effort; pane close is authoritative for this MVP.
			}
			closePane(child.surface);
		}

		btwChild = undefined;
		for (const file of [child.sessionFile, child.launchScriptFile]) {
			try {
				rmSync(file, { force: true });
			} catch {
				// Ephemeral artifact cleanup is best effort.
			}
		}
		return true;
	};

	// Capture the UI context for widget updates and restore presentation for
	// subagents whose watchers survived a reload.
	pi.on("session_start", (_event, ctx) => {
		runtime.latestCtx = ctx;
		if (!runtime.workflowStartupScanned) {
			runtime.workflowStartupScanned = true;
			recoverWorkflowStartup(
				ctx.cwd,
				runtime.activeWorkflow
					? new Set([runtime.activeWorkflow.runId])
					: new Set(),
			);
		}
		const pendingSession = runtime.pendingWorkflow?.parentSession;
		if (
			pendingSession &&
			(ctx.sessionManager.getSessionId() !== pendingSession.id ||
				ctx.sessionManager.getSessionFile() !== pendingSession.file)
		) {
			runtime.pendingWorkflow = undefined;
		}
		runtime.modelCatalog = buildAuthenticatedModelCatalog(
			wrapPiModelRegistry(ctx.modelRegistry),
		);
		const refreshedGuidelines = buildSubagentRoutingGuidelines(
			runtime.modelCatalog,
		);
		subagentRoutingGuidelines.splice(
			0,
			subagentRoutingGuidelines.length,
			...refreshedGuidelines,
		);
		if (runningSubagents.size > 0) {
			startWidgetRefresh();
			startStatusRefresh(pi);
			updateWidget();
		}
	});

	// Clean up on session shutdown
	pi.on("session_shutdown", async (event, _ctx) => {
		if (widgetInterval) {
			clearInterval(widgetInterval);
			widgetInterval = null;
			(globalThis as any)[WIDGET_INTERVAL_KEY] = null;
		}
		if (statusInterval) {
			clearInterval(statusInterval);
			statusInterval = null;
			(globalThis as any)[STATUS_INTERVAL_KEY] = null;
		}

		const shutdownReason = (event as any).reason;
		cleanupSubagentsForShutdown(shutdownReason, runningSubagents);
		if (
			shutdownReason === "new" ||
			shutdownReason === "resume" ||
			shutdownReason === "fork"
		) {
			runtime.pendingWorkflow = undefined;
		}
		try {
			await closeBtw();
		} catch {
			// Best effort during parent shutdown; the Herdr pane remains recoverable.
		}
	});

	// Tools denied via PI_DENY_TOOLS env var (set by parent agent based on frontmatter)
	const deniedTools = new Set(
		(process.env.PI_SUBAGENT_ID ? (process.env.PI_DENY_TOOLS ?? "") : "")
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean),
	);

	const shouldRegister = (name: string) => !deniedTools.has(name);
	const prepareCandidate = (
		ctx: ExtensionContext,
		path: string,
		parentSession: PendingWorkflow["parentSession"],
		roles = workflowRoles(discoverAgentCatalog(pi)),
	) =>
		prepareWorkflow({
			cwd: ctx.cwd,
			path,
			roles,
			modelRegistry: wrapPiModelRegistry(ctx.modelRegistry),
			parentSession,
		});
	const workflowFailure = (
		code: string,
		message: string,
		retryable = false,
	) => ({
		ok: false,
		code,
		message,
		retryable,
	});
	const runWorkflowAgent = async (
		owner: WorkflowOwner,
		candidate: PendingWorkflow,
		checkout: string,
		journal: ReturnType<typeof createWorkflowJournal>,
		roles: WorkflowRole[],
		prompt: string,
		options: unknown,
	) => {
		if (owner.controller.signal.aborted || owner.gate.phase !== "running") {
			return workflowFailure("cancelled", "Workflow cancelled.");
		}
		if (!options || typeof options !== "object" || Array.isArray(options)) {
			return workflowFailure(
				"workflow_agent_options",
				"Workflow agent options must contain kind: review and one declared review node.",
			);
		}
		const entries = Object.entries(options as Record<string, unknown>);
		const {
			kind,
			node,
			role: legacyRole,
		} = options as {
			kind?: unknown;
			node?: unknown;
			role?: unknown;
		};
		if (
			entries.length !== 2 ||
			kind !== "review" ||
			(typeof node !== "string" && typeof legacyRole !== "string")
		) {
			return workflowFailure(
				"workflow_agent_options",
				"Workflow agent options must contain only kind: review and one declared review node.",
			);
		}
		const resolved = resolveWorkflowReviewNode(
			candidate.rolePolicies,
			typeof node === "string" ? node : undefined,
			typeof legacyRole === "string" ? legacyRole : undefined,
		);
		if ("error" in resolved)
			return workflowFailure("policy_error", resolved.error);
		const { policy } = resolved;
		const nodeId = policy.id;
		const role = roles.find((value) => value.name === policy.role);
		if (!role || role.disableModelInvocation || policy.tools.length === 0) {
			return workflowFailure(
				"policy_error",
				`Workflow review node ${JSON.stringify(nodeId)} is unavailable.`,
			);
		}
		const id = `workflow-${candidate.runId}-${Math.random().toString(16).slice(2, 10)}`;
		const sessionFile = join(dirname(candidate.path), "sessions", `${id}.jsonl`);
		let surface: string | undefined;
		let launched = false;
		const childController = new AbortController();
		const onOwnerAbort = () => childController.abort();
		if (owner.controller.signal.aborted) childController.abort();
		else
			owner.controller.signal.addEventListener("abort", onOwnerAbort, {
				once: true,
			});
		try {
			if (childController.signal.aborted)
				return workflowFailure("cancelled", "Workflow cancelled.");
			mkdirSync(dirname(sessionFile), { recursive: true });
			surface = createSubagentPane(`${candidate.runId}: ${nodeId}`);
			owner.children.set(id, { controller: childController, surface });
			await waitForShellReady(surface, { signal: childController.signal });
			if (childController.signal.aborted)
				return workflowFailure("cancelled", "Workflow cancelled.");
			const command = buildWorkflowChildCommand({
				checkout,
				sessionFile,
				id,
				name: nodeId,
				model: policy.model,
				thinking: policy.thinking,
				tools: policy.tools,
				rolePrompt: role.body,
				task: prompt,
			});
			journal.append("agent_started", {
				id,
				node: nodeId,
				role: role.name,
				sessionFile,
				tools: policy.tools,
			});
			runScriptInPane(surface, command, {
				scriptPath: join(dirname(candidate.path), "launch", `${id}.sh`),
			});
			launched = true;
			const watched = await watchSubagent(
				{
					id,
					name: nodeId,
					task: prompt,
					surface,
					startTime: Date.now(),
					sessionFile,
					interactive: false,
					runtimePlan: undefined,
					lifecycle: createLifecycle(Date.now()),
				},
				childController.signal,
			);
			surface = undefined;
			if (childController.signal.aborted || watched.error === "cancelled") {
				return workflowFailure("cancelled", "Workflow cancelled.");
			}
			const sessionExists = existsSync(sessionFile);
			const childEntries = sessionExists ? getNewEntries(sessionFile, 0) : [];
			const finalAssistant = inspectFinalAssistantMessage(childEntries);
			journal.append("agent_completed", {
				id,
				node: nodeId,
				role: role.name,
				sessionFile,
				sessionExists,
				exitCode: watched.exitCode,
				...(watched.errorMessage ? { errorMessage: watched.errorMessage } : {}),
				finalAssistantContentLength: finalAssistant.contentLength,
				...(finalAssistant.stopReason
					? { finalAssistantStopReason: finalAssistant.stopReason }
					: {}),
			});
			if (watched.exitCode !== 0 || watched.errorMessage) {
				return workflowFailure(
					"child_error",
					watched.errorMessage ??
						`Workflow child exited with code ${watched.exitCode}`,
				);
			}
			if (!finalAssistant.text) {
				return workflowFailure(
					"empty_completion",
					`Workflow child completed without assistant text${
						finalAssistant.stopReason
							? ` (stopReason: ${finalAssistant.stopReason})`
							: ""
					}.`,
				);
			}
			const summary = finalAssistant.text;
			const observed = findObservedSessionRuntime(childEntries);
			const observedModel =
				observed.provider && observed.modelId
					? `${observed.provider}/${observed.modelId}`
					: undefined;
			if (
				observedModel !== policy.model ||
				observed.thinking !== policy.thinking
			) {
				return workflowFailure(
					"workflow_runtime_mismatch",
					"Workflow child did not report the approved provider/model and thinking.",
				);
			}
			return { ok: true, value: summary, sessionFile };
		} catch (error) {
			if (childController.signal.aborted)
				return workflowFailure("cancelled", "Workflow cancelled.");
			const message = error instanceof Error ? error.message : String(error);
			return workflowFailure(launched ? "child_error" : "launch_error", message);
		} finally {
			owner.controller.signal.removeEventListener("abort", onOwnerAbort);
			owner.children.delete(id);
			if (surface) {
				try {
					closePane(surface);
				} catch (error) {
					journal.append("pane_close_failed", {
						surface,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
		}
	};
	const deliverWorkflowOutcome = (
		candidate: PendingWorkflow,
		journal: ReturnType<typeof createWorkflowJournal>,
		outcome: WorkflowTerminalOutcome,
		checkoutResult?: WorkflowReaderCheckout,
	) => {
		const envelope = {
			runId: candidate.runId,
			state: outcome.state,
			...(outcome.result === undefined ? {} : { result: outcome.result }),
			...(outcome.error ? { error: outcome.error } : {}),
			...(checkoutResult ? { checkout: checkoutResult } : {}),
		};
		const terminalEventId = journal.append(outcome.state, { envelope });
		const content =
			outcome.state === "cancelled"
				? `Workflow ${candidate.runId} cancelled.\n\nJournal: ${journal.path}`
				: `Workflow ${candidate.runId} ${outcome.state}.\n\nResult:\n${JSON.stringify(envelope)}\n\nJournal: ${journal.path}`;
		try {
			selectCompletionApi(pi, runtime.pi).sendMessage(
				{
					customType: "herdr_workflow_result",
					content,
					display: true,
					details: { ...envelope, journal: journal.path },
				},
				{ triggerTurn: true, deliverAs: "steer" },
			);
			journal.append("delivery", {
				terminalEventId,
				state: outcome.state,
				targetSession: candidate.parentSession.file,
				status: "sent",
			});
		} catch {
			journal.append("delivery", {
				terminalEventId,
				state: outcome.state,
				targetSession: candidate.parentSession.file,
				status: "failed",
			});
		}
		return outcome;
	};
	const finalizeWorkflow = (
		owner: WorkflowOwner,
		outcome: WorkflowTerminalOutcome,
		checkoutResult?: WorkflowReaderCheckout,
	) => {
		if (!claimWorkflowTerminal(owner.gate, outcome)) {
			return (
				owner.gate.outcome ?? runtime.workflowOutcomes.get(owner.runId) ?? outcome
			);
		}
		runtime.workflowOutcomes.set(owner.runId, outcome);
		const journal = owner.journal;
		if (journal)
			deliverWorkflowOutcome(owner.candidate, journal, outcome, checkoutResult);
		if (runtime.activeWorkflow?.runId === owner.runId)
			runtime.activeWorkflow = undefined;
		return outcome;
	};
	const cancelWorkflow = async (
		owner: WorkflowOwner,
		options: WorkflowCancelHooks = {},
	): Promise<WorkflowTerminalOutcome> => {
		if (owner.cancelPromise) return owner.cancelPromise;

		// Claim the gate first. Only the claimer creates cancelPromise, and it is
		// assigned before any await so concurrent callers await the real outcome.
		const begin = beginWorkflowCancellation(owner.gate);
		if (!begin.claimed) {
			if (begin.outcome) return begin.outcome;
			while (!owner.cancelPromise && owner.gate.phase === "cancelling") {
				await new Promise((resolve) => setImmediate(resolve));
			}
			if (owner.cancelPromise) return owner.cancelPromise;
			const previous =
				owner.gate.outcome ?? runtime.workflowOutcomes.get(owner.runId);
			if (previous) return previous;
			return {
				state: "failed" as const,
				error: {
					code: "cancel_termination_failed",
					message:
						"Workflow cancellation lost its in-flight waiter without a terminal outcome.",
				},
			};
		}

		// Publish the waiter immediately so concurrent cancel callers never invent success.
		let settle!: (outcome: WorkflowTerminalOutcome) => void;
		const deferred = new Promise<WorkflowTerminalOutcome>((resolve) => {
			settle = resolve;
		});
		owner.cancelPromise = deferred;

		const hooks = { ...runtime.workflowCancelHooks, ...options };
		const getProcessInfo = hooks.getProcessInfo ?? getPaneProcessInfo;
		const closeSurface = hooks.closeSurface ?? closePane;
		const waitAbsence = hooks.waitAbsence ?? waitForPaneAbsence;
		const waitExit = hooks.waitExit ?? waitForProcessesExit;
		void (async () => {
			try {
				owner.controller.abort();
				const children = [...owner.children.values()];
				const captured: Array<{
					surface?: string;
					pids: number[];
					identityUnconfirmed: boolean;
				}> = [];
				for (const child of children) {
					child.controller.abort();
					const pids: number[] = [];
					let identityUnconfirmed = false;
					if (child.surface) {
						try {
							const info = getProcessInfo(child.surface);
							pids.push(...info.pids);
							owner.journal?.append("cancel_process_info", {
								surface: child.surface,
								pids: info.pids,
								shellPid: info.shellPid,
								foregroundProcessGroupId: info.foregroundProcessGroupId,
							});
							// Active panes with no waitable PIDs lack exit proof.
							if (info.pids.length === 0) identityUnconfirmed = true;
						} catch (error) {
							identityUnconfirmed = true;
							owner.journal?.append("cancel_process_info_failed", {
								surface: child.surface,
								error: error instanceof Error ? error.message : String(error),
							});
						}
					}
					captured.push({
						surface: child.surface,
						pids,
						identityUnconfirmed,
					});
				}
				for (const child of captured) {
					if (!child.surface) continue;
					try {
						closeSurface(child.surface);
					} catch (error) {
						owner.journal?.append("pane_close_failed", {
							surface: child.surface,
							error: error instanceof Error ? error.message : String(error),
						});
					}
				}
				const surviving: number[] = [];
				let identityUnconfirmed = false;
				for (const child of captured) {
					if (child.identityUnconfirmed) identityUnconfirmed = true;
					if (child.surface) {
						const gone = await waitAbsence(child.surface, {
							timeoutMs: 5_000,
							intervalMs: 50,
						});
						if (!gone) {
							// Pane still present after close: treat as unconfirmed termination.
							identityUnconfirmed = true;
							owner.journal?.append("cancel_pane_still_present", {
								surface: child.surface,
							});
						}
					}
					if (child.pids.length > 0) {
						surviving.push(
							...(await waitExit(child.pids, {
								timeoutMs: 5_000,
								intervalMs: 50,
							})),
						);
					}
				}
				const uniqueSurvivors = [...new Set(surviving)];
				const termination = cancelTerminationResult(
					uniqueSurvivors,
					owner.checkout,
					{ identityUnconfirmed },
				);
				let checkoutResult: WorkflowReaderCheckout | undefined =
					termination.checkout;
				if (termination.retainCheckout) {
					if (owner.checkout) {
						owner.journal?.append("reader_checkout_retained", {
							path: owner.checkout,
							reason: "cancel_termination_failed",
							survivingPids: uniqueSurvivors,
							identityUnconfirmed,
						});
					}
					settle(finalizeWorkflow(owner, termination.outcome, checkoutResult));
					return;
				}
				if (owner.checkout && owner.journal) {
					checkoutResult = disposeWorkflowReaderCheckout(
						owner.candidate,
						owner.checkout,
						owner.journal,
					);
					owner.checkout = undefined;
				}
				settle(finalizeWorkflow(owner, termination.outcome, checkoutResult));
			} catch (error) {
				settle(
					finalizeWorkflow(owner, {
						state: "failed",
						error: {
							code: "cancel_termination_failed",
							message: error instanceof Error ? error.message : String(error),
						},
					}),
				);
			}
		})();
		return deferred;
	};
	const deliverWorkflow = async (
		owner: WorkflowOwner,
		candidate: PendingWorkflow,
		journal: ReturnType<typeof createWorkflowJournal>,
		roles: WorkflowRole[],
	) => {
		owner.journal = journal;
		journal.append("started");
		let execution: WorkflowTerminalOutcome;
		try {
			owner.checkout = createWorkflowReaderCheckout(candidate, journal);
			execution = await executeWorkflow(candidate, {
				signal: owner.controller.signal,
				onWorker: (worker) => {
					owner.worker = worker;
				},
				onLog: (message) => journal.append("workflow_log", { message }),
				onAgent: async (prompt, options) => {
					const result = await runWorkflowAgent(
						owner,
						candidate,
						owner.checkout!,
						journal,
						roles,
						prompt,
						options,
					);
					// Cancel may already have written the terminal + delivery; do not
					// append late agent results after the journal has terminalized.
					if (owner.gate.phase === "running") {
						journal.append("agent_result", { result });
					}
					return result;
				},
			});
		} catch (error) {
			execution = {
				state: "failed",
				error: {
					code: "workflow_runner_error",
					message: error instanceof Error ? error.message : String(error),
				},
			};
		}
		if (owner.gate.phase === "cancelling" || owner.gate.phase === "terminal") {
			if (owner.cancelPromise) await owner.cancelPromise;
			return;
		}
		let checkoutResult: WorkflowReaderCheckout | undefined;
		if (owner.checkout) {
			checkoutResult = disposeWorkflowReaderCheckout(
				candidate,
				owner.checkout,
				journal,
			);
			owner.checkout = undefined;
		}
		finalizeWorkflow(owner, execution, checkoutResult);
	};

	// Workflow control is parent-only. Workflow children must not be able to
	// prepare a revision or acquire approval for any later execution slice.
	if (!process.env.PI_SUBAGENT_ID)
		pi.registerTool({
			name: "herdr_workflow",
			label: "Herdr Workflow",
			description:
				"Prepare, start, or cancel one exact project-local workflow. Preparation validates and compiles the script without evaluating it. Start requires the matching user approval. Cancel stops queued and active children under the process-global terminal gate.",
			parameters: Type.Object({
				action: Type.Union([
					Type.Literal("prepare"),
					Type.Literal("start"),
					Type.Literal("cancel"),
				]),
				path: Type.Optional(Type.String()),
				runId: Type.Optional(Type.String()),
			}),
			async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
				if (params.action === "prepare") {
					if (runtime.activeWorkflow) {
						return {
							content: [
								{
									type: "text",
									text: "Error: a workflow is already active in this Pi process.",
								},
							],
							details: { error: "workflow_active" },
						};
					}
					if (!isTerminalAvailable()) return muxUnavailableResult();
					if (!params.path) {
						return {
							content: [
								{
									type: "text",
									text: "Error: workflow preparation requires path.",
								},
							],
							details: { error: "workflow_path_required" },
						};
					}
					const sessionFile = ctx.sessionManager.getSessionFile();
					const leafId = ctx.sessionManager.getLeafId();
					if (!sessionFile || !leafId) {
						return {
							content: [
								{
									type: "text",
									text:
										"Error: start pi with a persistent session before preparing a workflow.",
								},
							],
							details: { error: "workflow_persistent_session_required" },
						};
					}
					runtime.pendingWorkflow = undefined;
					try {
						const candidate = prepareCandidate(ctx, params.path, {
							id: ctx.sessionManager.getSessionId(),
							file: sessionFile,
							prepareLeafId: leafId,
						});
						runtime.pendingWorkflow = candidate;
						return {
							content: [{ type: "text", text: formatApprovalPacket(candidate) }],
							details: {
								runId: candidate.runId,
								scriptHash: candidate.scriptHash,
								repository: candidate.repository,
								baseSha: candidate.baseSha,
								sources: candidate.sources,
								rolePolicies: candidate.rolePolicies,
							},
						};
					} catch (error) {
						return {
							content: [
								{
									type: "text",
									text: `Workflow preparation failed: ${error instanceof Error ? error.message : String(error)}`,
								},
							],
							details: { error: "workflow_prepare_failed" },
						};
					}
				}
				if (params.action === "start") {
					const candidate = runtime.pendingWorkflow;
					if (
						!candidate ||
						params.runId !== candidate.runId ||
						runtime.activeWorkflow
					) {
						return {
							content: [
								{
									type: "text",
									text: "Error: no matching pending workflow can be started.",
								},
							],
							details: { error: "workflow_start_rejected" },
						};
					}
					try {
						const sessionFile = ctx.sessionManager.getSessionFile();
						if (!sessionFile)
							throw new Error("No persistent parent session is available");
						const approval = validateWorkflowApproval(candidate, {
							sessionId: ctx.sessionManager.getSessionId(),
							sessionFile,
							branch: ctx.sessionManager.getBranch(),
						});
						const approvedRoles = workflowRoles(discoverAgentCatalog(pi));
						const revalidated = prepareCandidate(
							ctx,
							candidate.path,
							candidate.parentSession,
							approvedRoles,
						);
						if (!sameWorkflowCandidate(candidate, revalidated)) {
							throw new Error("Workflow candidate changed after preparation");
						}
						const journal = createWorkflowJournal(candidate, approval);
						runtime.pendingWorkflow = undefined;
						runtime.workflowOutcomes.delete(candidate.runId);
						const owner: WorkflowOwner = {
							runId: candidate.runId,
							candidate,
							children: new Map(),
							controller: new AbortController(),
							gate: createWorkflowTerminalGate(),
							journal,
						};
						runtime.activeWorkflow = owner;
						void deliverWorkflow(owner, candidate, journal, approvedRoles);
						return {
							content: [
								{
									type: "text",
									text: `Workflow ${candidate.runId} started in the background.`,
								},
							],
							details: {
								runId: candidate.runId,
								journal: journal.path,
								status: "started",
							},
						};
					} catch (error) {
						return {
							content: [
								{
									type: "text",
									text: `Workflow start failed: ${error instanceof Error ? error.message : String(error)}`,
								},
							],
							details: { error: "workflow_start_failed" },
						};
					}
				}
				if (params.action === "cancel") {
					if (!params.runId) {
						return {
							content: [
								{
									type: "text",
									text: "Error: workflow cancellation requires runId.",
								},
							],
							details: { error: "workflow_run_id_required" },
						};
					}
					const owner = runtime.activeWorkflow;
					if (!owner || owner.runId !== params.runId) {
						const previous = runtime.workflowOutcomes.get(params.runId);
						if (previous) {
							return {
								content: [
									{
										type: "text",
										text: `Workflow ${params.runId} already ended as ${previous.state}.`,
									},
								],
								details: {
									runId: params.runId,
									status: previous.state,
									outcome: previous,
								},
							};
						}
						return {
							content: [
								{
									type: "text",
									text: "Error: no matching active workflow can be cancelled.",
								},
							],
							details: { error: "workflow_cancel_rejected" },
						};
					}
					try {
						const root = realpathSync(
							execFileSync("git", ["-C", ctx.cwd, "rev-parse", "--show-toplevel"], {
								encoding: "utf8",
							}).trim(),
						);
						const commonDir = realpathSync(
							execFileSync(
								"git",
								[
									"-C",
									ctx.cwd,
									"rev-parse",
									"--path-format=absolute",
									"--git-common-dir",
								],
								{ encoding: "utf8" },
							).trim(),
						);
						if (
							root !== owner.candidate.repository.root ||
							commonDir !== owner.candidate.repository.commonDir
						) {
							return {
								content: [
									{
										type: "text",
										text:
											"Error: workflow cancellation must use the approved repository identity.",
									},
								],
								details: { error: "workflow_cancel_identity_mismatch" },
							};
						}
					} catch (error) {
						return {
							content: [
								{
									type: "text",
									text: `Workflow cancellation failed: ${error instanceof Error ? error.message : String(error)}`,
								},
							],
							details: { error: "workflow_cancel_identity_failed" },
						};
					}
					const outcome = await cancelWorkflow(owner);
					return {
						content: [
							{
								type: "text",
								text:
									outcome.state === "cancelled"
										? `Workflow ${owner.runId} cancelled.`
										: `Workflow ${owner.runId} ended as ${outcome.state}${outcome.error ? `: ${outcome.error.message}` : "."}`,
							},
						],
						details: { runId: owner.runId, status: outcome.state, outcome },
					};
				}
				return {
					content: [{ type: "text", text: "Error: unsupported workflow action." }],
					details: { error: "workflow_action_unavailable" },
				};
			},
		});

	// ── subagent tool ──
	if (shouldRegister("subagent"))
		pi.registerTool({
			name: "subagent",
			label: "Subagent",
			description:
				"Spawn a sub-agent in a dedicated terminal herdr pane, or in an isolated Herdr-managed Git worktree when worktree is provided. " +
				"Use unique worktree branches for independent writing tasks; use ordinary panes for read-only tasks. The worktree base is committed state, so uncommitted parent changes are not copied. " +
				"Worktree runs retain their workspace after completion for parent review; they are not pushed, merged, or removed automatically. " +
				"This is a fire-and-forget async tool: the call returns immediately with only an acknowledgement. " +
				"When the sub-agent finishes, the harness AUTOMATICALLY delivers its result as a steer message that wakes you up and starts a new turn — you do not need to do anything to receive it. " +
				"DO NOT write polling loops, sleep/wait commands, tail/watch scripts, or repeatedly read session/log files to detect completion. DO NOT call subagents_list or any other tool to 'check' status. All of that is wasted work — the harness handles delivery for you. " +
				"DO NOT fabricate, assume, or summarize results after calling this tool. " +
				"After spawning, either end your turn immediately, or work on other independent tasks (including spawning more subagents in parallel). The harness will wake you with the result when it is ready.",
			promptSnippet:
				"Spawn a sub-agent in a dedicated terminal herdr pane, or in an isolated Herdr-managed Git worktree when worktree is provided. " +
				"Use unique worktree branches for independent writing tasks; use ordinary panes for read-only tasks. The worktree base is committed state, so uncommitted parent changes are not copied. " +
				"Worktree runs retain their workspace after completion for parent review; they are not pushed, merged, or removed automatically. " +
				"This is a fire-and-forget async tool: the call returns immediately with only an acknowledgement. " +
				"When the sub-agent finishes, the harness AUTOMATICALLY delivers its result as a steer message that wakes you up and starts a new turn — you do not need to do anything to receive it. " +
				"DO NOT write polling loops, sleep/wait commands, tail/watch scripts, or repeatedly read session/log files to detect completion. DO NOT call subagents_list or any other tool to 'check' status. All of that is wasted work — the harness handles delivery for you. " +
				"DO NOT fabricate, assume, or summarize results after calling this tool. " +
				"After spawning, either end your turn immediately, or work on other independent tasks (including spawning more subagents in parallel). The harness will wake you with the result when it is ready.",
			promptGuidelines: subagentRoutingGuidelines,
			parameters: SubagentParams,

			async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
				// Prevent self-spawning (e.g. planner spawning another planner)
				const currentAgent = process.env.PI_SUBAGENT_AGENT;
				if (params.agent && currentAgent && params.agent === currentAgent) {
					return {
						content: [
							{
								type: "text",
								text: `You are the ${currentAgent} agent — do not start another ${currentAgent}. You were spawned to do this work yourself. Complete the task directly.`,
							},
						],
						details: { error: "self-spawn blocked" },
					};
				}

				const legacyRoleDiagnostic = params.agent
					? discoverAgentCatalog(runtime.pi).diagnostics.find(
							(candidate) =>
								candidate.agentName === params.agent &&
								candidate.code === "external-cli-unsupported",
						)
					: undefined;
				if (legacyRoleDiagnostic) {
					return {
						content: [
							{ type: "text", text: `Error: ${legacyRoleDiagnostic.message}` },
						],
						details: { error: legacyRoleDiagnostic.code },
					};
				}

				// Validate prerequisites
				if (!isTerminalAvailable()) {
					return muxUnavailableResult();
				}

				if (!ctx.sessionManager.getSessionFile()) {
					return {
						content: [
							{
								type: "text",
								text:
									"Error: no session file. Start pi with a persistent session to use subagents.",
							},
						],
						details: { error: "no session file" },
					};
				}

				// Launch the subagent (creates pane, sends command)
				const parentThinking = pi.getThinkingLevel();
				if (
					parentThinking !== "off" &&
					parentThinking !== "minimal" &&
					parentThinking !== "low" &&
					parentThinking !== "medium" &&
					parentThinking !== "high" &&
					parentThinking !== "xhigh" &&
					parentThinking !== "max"
				) {
					throw new Error(`Unsupported parent thinking level: ${parentThinking}`);
				}
				const runtimePlans = resolveSubagentRuntimePlans(
					params,
					ctx,
					parentThinking,
				);
				const worktreeLaunchWarning = resolveWorktreeLaunchWarning(
					params,
					runtime.pi,
				);
				const { running, index: initialPlanIndex } =
					await launchSubagentWithFallbacks(
						params,
						ctx,
						parentThinking,
						runtimePlans,
					);

				// Create a separate AbortController for the watcher
				// (the tool's signal completes when we return)
				const watcherAbort = new AbortController();
				running.abortController = watcherAbort;

				// Start widget refresh and status supervision when the first agent launches
				startWidgetRefresh();
				startStatusRefresh(pi);

				// Fire-and-forget: start watching in background
				watchSubagentWithFallbacks(
					running,
					initialPlanIndex,
					params,
					ctx,
					parentThinking,
					runtimePlans,
					watcherAbort.signal,
				)
					.then(({ running: completedRunning, result }) => {
						if (!shouldDeliverSubagentCompletion(completedRunning)) {
							completedRunning.lifecycle = markDelivery(
								completedRunning.lifecycle,
								"suppressed",
							);
							runningSubagents.delete(completedRunning.id);
							updateWidget();
							return;
						}
						completedRunning.lifecycle = markDelivery(
							completedRunning.lifecycle,
							"delivered",
						);
						runningSubagents.delete(completedRunning.id);
						updateWidget();
						const completionApi = selectCompletionApi(pi, runtime.pi);

						if (result.ping) {
							// Subagent is requesting help — steer a ping message with session path for resume
							const worktreeRef = result.worktree
								? `\n\n${formatWorktreeHandoff(result.worktree)}`
								: "";
							const sessionRef = `\n\nSession: ${result.sessionFile}\nResume: pi --session ${result.sessionFile}`;
							completionApi.sendMessage(
								{
									customType: "subagent_ping",
									content: `Sub-agent "${result.ping.name}" needs help (${formatElapsed(result.elapsed)}):\n\n${result.ping.message}${worktreeRef}${sessionRef}`,
									display: true,
									details: {
										name: result.ping.name,
										message: result.ping.message,
										agent: running.agent,
										sessionFile: result.sessionFile,
										...(result.worktree ? { worktree: result.worktree } : {}),
									},
								},
								{ triggerTurn: true, deliverAs: "steer" },
							);
							return;
						}

						const presentation = resolveResultPresentation(
							result,
							completedRunning.name,
							completedRunning.runtimePlan?.runtimeMismatch,
						);

						sendSubagentResult(completionApi, presentation, {
							name: completedRunning.name,
							task: completedRunning.task,
							agent: completedRunning.agent,
							exitCode: result.exitCode,
							elapsed: result.elapsed,
							sessionFile: result.sessionFile,
							...(result.errorMessage ? { errorMessage: result.errorMessage } : {}),
							...(result.fallbackAttempts
								? { fallbackAttempts: result.fallbackAttempts }
								: {}),
							...(result.worktree ? { worktree: result.worktree } : {}),
							...(completedRunning.runtimePlan
								? { runtimePlan: completedRunning.runtimePlan }
								: {}),
						});
					})
					.catch((err) => {
						if (!shouldDeliverSubagentCompletion(running)) {
							running.lifecycle = markDelivery(running.lifecycle, "suppressed");
							runningSubagents.delete(running.id);
							updateWidget();
							return;
						}
						running.lifecycle = markDelivery(running.lifecycle, "delivered");
						runningSubagents.delete(running.id);
						updateWidget();
						sendSubagentResult(
							selectCompletionApi(pi, runtime.pi),
							resolveUnexpectedErrorPresentation(
								`Sub-agent "${running.name}" error`,
								err,
								running.sessionFile,
							),
							{
								name: running.name,
								task: running.task,
								error: err?.message,
								sessionFile: running.sessionFile,
								...(running.worktree ? { worktree: running.worktree } : {}),
							},
						);
					});

				// Return immediately
				return {
					content: [
						{
							type: "text",
							text:
								`Sub-agent "${params.name}" launched and is now running in the background` +
								(running.worktree
									? ` in worktree ${running.worktree.path} on branch ${running.worktree.branch}. `
									: ". ") +
								(worktreeLaunchWarning ? `Warning: ${worktreeLaunchWarning} ` : "") +
								`Do NOT generate or assume any results — you have no idea what the sub-agent will do or produce. ` +
								`The results will be delivered to you automatically as a steer message when the sub-agent finishes. ` +
								`Until then, move on to other work or tell the user you're waiting.`,
						},
					],
					details: {
						id: running.id,
						name: params.name,
						task: params.task,
						agent: params.agent,
						sessionFile: running.sessionFile,
						launchScriptFile: running.launchScriptFile,
						model: running.runtimePlan?.model,
						thinking: running.runtimePlan?.thinking,
						runtimePlan: running.runtimePlan,
						...(running.worktree ? { worktree: running.worktree } : {}),
						...(worktreeLaunchWarning ? { warning: worktreeLaunchWarning } : {}),
						status: "started",
					},
				};
			},

			renderCall(args, theme) {
				const partialArgs = args as Record<string, unknown>;
				const name =
					typeof partialArgs.name === "string" && partialArgs.name
						? partialArgs.name
						: "(unnamed)";
				const task = typeof partialArgs.task === "string" ? partialArgs.task : "";
				const agent =
					typeof partialArgs.agent === "string" && partialArgs.agent
						? theme.fg("dim", ` (${partialArgs.agent})`)
						: "";
				const cwdHint =
					typeof partialArgs.cwd === "string" && partialArgs.cwd
						? theme.fg("dim", ` in ${partialArgs.cwd}`)
						: "";
				const worktree = partialArgs.worktree as { branch?: unknown } | undefined;
				const worktreeHint =
					typeof worktree?.branch === "string"
						? theme.fg("dim", ` on ${worktree.branch} (worktree)`)
						: "";
				let text =
					"▸ " +
					theme.fg("toolTitle", theme.bold(name)) +
					agent +
					cwdHint +
					worktreeHint;

				// Show a one-line task preview. renderCall is called repeatedly as the
				// LLM generates tool arguments, so args.task grows token by token.
				// We keep it compact here — Ctrl+O on renderResult expands the full content.
				if (task) {
					const firstLine = task.split("\n").find((l: string) => l.trim()) ?? "";
					const preview =
						firstLine.length > 100 ? firstLine.slice(0, 100) + "…" : firstLine;
					if (preview) {
						text += "\n" + theme.fg("toolOutput", preview);
					}
					const totalLines = task.split("\n").length;
					if (totalLines > 1) {
						text += theme.fg("muted", ` (${totalLines} lines)`);
					}
				}

				return new Text(text, 0, 0);
			},

			renderResult(result, _opts, theme) {
				const details = result.details as any;
				const name = details?.name ?? "(unnamed)";

				// "Started" result — tool returned immediately
				if (details?.status === "started") {
					const runtime = details?.model
						? ` — ${details.model}${details.thinking ? ` · ${details.thinking}` : ""}`
						: " — started";
					const worktree = details?.worktree?.branch
						? ` · ${details.worktree.branch}`
						: "";
					return new Text(
						theme.fg("accent", "▸") +
							" " +
							theme.fg("toolTitle", theme.bold(name)) +
							theme.fg("dim", runtime + worktree),
						0,
						0,
					);
				}

				// Fallback (shouldn't happen)
				return new Text(theme.fg("dim", getFirstText(result.content)), 0, 0);
			},
		});

	// ── subagent_interrupt tool ──
	if (shouldRegister("subagent_interrupt"))
		pi.registerTool({
			name: "subagent_interrupt",
			label: "Interrupt Subagent",
			description:
				"Send Escape to the active turn of a currently running Pi-backed subagent. " +
				"The child pane, session, watcher, and running entry remain alive; this returns only a local acknowledgement " +
				"and does not emit a subagent_result solely because of this request.",
			promptSnippet:
				"Send Escape to the active turn of a currently running Pi-backed subagent. " +
				"The child pane, session, watcher, and running entry remain alive; this returns only a local acknowledgement " +
				"and does not emit a subagent_result solely because of this request.",
			parameters: Type.Object({
				id: Type.Optional(
					Type.String({ description: "Exact running subagent id" }),
				),
				name: Type.Optional(
					Type.String({ description: "Exact running subagent display name" }),
				),
			}),

			async execute(_toolCallId, params) {
				return handleSubagentInterrupt(params);
			},

			renderCall(args, theme) {
				const target = args.id ? `${args.id}` : (args.name ?? "(unknown)");
				return new Text(
					theme.fg("accent", "▸") +
						" " +
						theme.fg("toolTitle", theme.bold(target)) +
						theme.fg("dim", " — interrupt turn"),
					0,
					0,
				);
			},

			renderResult(result, _opts, theme) {
				const details = result.details as any;
				if (details?.status === "interrupt_requested") {
					return new Text(
						theme.fg("accent", "▸") +
							" " +
							theme.fg(
								"toolTitle",
								theme.bold(details.name ?? details.id ?? "subagent"),
							) +
							theme.fg("dim", " — interrupt requested"),
						0,
						0,
					);
				}

				return new Text(theme.fg("dim", getFirstText(result.content)), 0, 0);
			},
		});

	// ── subagents_list tool ──
	if (shouldRegister("subagents_list"))
		pi.registerTool({
			name: "subagents_list",
			label: "List Subagents",
			description:
				"List all available package, global, and project subagent definitions. " +
				"Project agents override global definitions, which override package definitions.",
			promptSnippet:
				"List all available package, global, and project subagent definitions. " +
				"Project agents override global definitions, which override package definitions.",
			parameters: Type.Object({}),

			async execute() {
				const catalog = discoverAgentCatalog(pi);
				const list = catalog.agents.filter(
					(agent) => !agent.disableModelInvocation,
				);
				const lines = [
					...formatVisibleAgentDefinitions(list),
					...formatAgentDiagnostics(catalog.diagnostics),
				];

				return {
					content: [
						{
							type: "text",
							text: lines.join("\n") || "No subagent definitions found.",
						},
					],
					details: { agents: list, diagnostics: catalog.diagnostics },
				};
			},

			renderResult(result, _opts, theme) {
				const details = result.details as any;
				const agents = details?.agents ?? [];
				const diagnostics = details?.diagnostics ?? [];
				if (agents.length === 0 && diagnostics.length === 0) {
					return new Text(theme.fg("dim", "No subagent definitions found."), 0, 0);
				}
				const lines = agents.map((a: any) => {
					const source =
						a.source === "package" && a.provider ? `package:${a.provider}` : a.source;
					const badge = theme.fg("accent", ` (${source})`);
					const desc = a.description ? theme.fg("dim", ` — ${a.description}`) : "";
					const model = a.model ? theme.fg("dim", ` [${a.model}]`) : "";
					return `  ${theme.fg("toolTitle", theme.bold(a.name))}${badge}${model}${desc}`;
				});
				for (const diagnostic of diagnostics) {
					lines.push(theme.fg("warning", `  ! ${diagnostic.message}`));
				}
				return new Text(lines.join("\n"), 0, 0);
			},
		});

	// ── subagent_resume tool ──
	if (shouldRegister("subagent_resume"))
		pi.registerTool({
			name: "subagent_resume",
			label: "Resume Subagent",
			description:
				"Resume a previous Pi-backed sub-agent session in a new herdr pane. " +
				"This does not reattach a retained managed worktree; continue worktree-bound follow-up in its existing workspace. " +
				"This is a fire-and-forget async tool: the call returns immediately with only an acknowledgement. " +
				"When the resumed sub-agent finishes, the harness AUTOMATICALLY delivers its result as a steer message that wakes you up and starts a new turn — you do not need to do anything to receive it. " +
				"DO NOT write polling loops, sleep/wait commands, tail/watch scripts, or repeatedly read session/log files to detect completion. DO NOT poll for status. All of that is wasted work — the harness handles delivery for you. " +
				"DO NOT fabricate or assume results. After resuming, either end your turn or work on other independent tasks; the harness will wake you when the result is ready. " +
				"Use when a sub-agent was cancelled or needs follow-up work.",
			promptSnippet:
				"Resume a previous Pi-backed sub-agent session in a new herdr pane. " +
				"This does not reattach a retained managed worktree; continue worktree-bound follow-up in its existing workspace. " +
				"This is a fire-and-forget async tool: the call returns immediately with only an acknowledgement. " +
				"When the resumed sub-agent finishes, the harness AUTOMATICALLY delivers its result as a steer message that wakes you up and starts a new turn — you do not need to do anything to receive it. " +
				"DO NOT write polling loops, sleep/wait commands, tail/watch scripts, or repeatedly read session/log files to detect completion. DO NOT poll for status. All of that is wasted work — the harness handles delivery for you. " +
				"DO NOT fabricate or assume results. After resuming, either end your turn or work on other independent tasks; the harness will wake you when the result is ready. " +
				"Use when a sub-agent was cancelled or needs follow-up work.",
			parameters: Type.Object({
				sessionPath: Type.String({
					description: "Path to the session .jsonl file to resume",
				}),
				name: Type.Optional(
					Type.String({
						description: "Display name for the terminal tab. Default: 'Resume'",
					}),
				),
				message: Type.Optional(
					Type.String({
						description:
							"Optional message to send after resuming (e.g. follow-up instructions)",
					}),
				),
				autoExit: Type.Optional(
					Type.Boolean({
						description:
							"Whether the resumed session should automatically exit after completing its response. Defaults to true for autonomous follow-up work; set false for interactive resumed sessions.",
					}),
				),
			}),

			renderCall(args, theme) {
				const name = args.name ?? "Resume";
				const text =
					"▸ " +
					theme.fg("toolTitle", theme.bold(name)) +
					theme.fg("dim", " — resuming session");
				return new Text(text, 0, 0);
			},

			renderResult(result, _opts, theme) {
				const details = result.details as any;
				const name = details?.name ?? "Resume";

				if (details?.status === "started") {
					return new Text(
						theme.fg("accent", "▸") +
							" " +
							theme.fg("toolTitle", theme.bold(name)) +
							theme.fg("dim", " — resumed"),
						0,
						0,
					);
				}

				// Fallback
				return new Text(theme.fg("dim", getFirstText(result.content)), 0, 0);
			},

			async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
				const name = params.name ?? "Resume";
				const id = Math.random().toString(16).slice(2, 10);

				if (!isTerminalAvailable()) {
					return muxUnavailableResult();
				}

				if (!existsSync(params.sessionPath)) {
					return {
						content: [
							{
								type: "text",
								text: `Error: session file not found: ${params.sessionPath}`,
							},
						],
						details: { error: "session not found" },
					};
				}

				// Record entry count before resuming so we can extract new messages
				const entryCountBefore = getNewEntries(params.sessionPath, 0).length;

				const running: RunningSubagent = await launchPiSubagent({
					kind: "resume",
					id,
					name,
					sessionFile: params.sessionPath,
					message: params.message,
					parent: {
						sessionId: ctx.sessionManager.getSessionId(),
						sessionDir: ctx.sessionManager.getSessionDir(),
					},
					behavior: { autoExit: params.autoExit },
				});
				runningSubagents.set(id, running);
				startWidgetRefresh();
				startStatusRefresh(pi);

				// Fire-and-forget watcher
				const watcherAbort = new AbortController();
				running.abortController = watcherAbort;

				watchSubagent(running, watcherAbort.signal)
					.then((result) => {
						if (!shouldDeliverSubagentCompletion(running)) {
							running.lifecycle = markDelivery(running.lifecycle, "suppressed");
							runningSubagents.delete(running.id);
							updateWidget();
							return;
						}
						running.lifecycle = markDelivery(running.lifecycle, "delivered");
						runningSubagents.delete(running.id);
						updateWidget();
						const completionApi = selectCompletionApi(pi, runtime.pi);

						if (result.ping) {
							const sessionRef = `\n\nSession: ${params.sessionPath}\nResume: pi --session ${params.sessionPath}`;
							completionApi.sendMessage(
								{
									customType: "subagent_ping",
									content: `Sub-agent "${result.ping.name}" needs help (${formatElapsed(result.elapsed)}):\n\n${result.ping.message}${sessionRef}`,
									display: true,
									details: {
										name: result.ping.name,
										message: result.ping.message,
										sessionFile: params.sessionPath,
									},
								},
								{ triggerTurn: true, deliverAs: "steer" },
							);
							return;
						}

						const allEntries = getNewEntries(params.sessionPath, entryCountBefore);
						const summary =
							findLastAssistantMessage(allEntries) ??
							(result.errorMessage
								? `Subagent error: ${result.errorMessage}`
								: result.exitCode === 0
									? "Resumed session exited without new output"
									: `Resumed session exited with code ${result.exitCode}`);
						const presentation = resolveResultPresentation(
							{ ...result, summary, sessionFile: params.sessionPath },
							name,
							running.runtimePlan?.runtimeMismatch,
						);

						sendSubagentResult(completionApi, presentation, {
							name,
							task: params.message ?? "resumed session",
							exitCode: result.exitCode,
							elapsed: result.elapsed,
							sessionFile: params.sessionPath,
							...(result.errorMessage ? { errorMessage: result.errorMessage } : {}),
							...(running.runtimePlan ? { runtimePlan: running.runtimePlan } : {}),
						});
					})
					.catch((err) => {
						if (!shouldDeliverSubagentCompletion(running)) {
							running.lifecycle = markDelivery(running.lifecycle, "suppressed");
							runningSubagents.delete(running.id);
							updateWidget();
							return;
						}
						running.lifecycle = markDelivery(running.lifecycle, "delivered");
						runningSubagents.delete(running.id);
						updateWidget();
						sendSubagentResult(
							selectCompletionApi(pi, runtime.pi),
							resolveUnexpectedErrorPresentation(
								"Resume error",
								err,
								params.sessionPath,
							),
							{ name, error: err?.message, sessionFile: params.sessionPath },
						);
					});

				return {
					content: [{ type: "text", text: `Session "${name}" resumed.` }],
					details: {
						id,
						name,
						sessionPath: params.sessionPath,
						launchScriptFile: running.launchScriptFile,
						status: "started",
					},
				};
			},
		});

	pi.registerCommand("btw", {
		description:
			"Open an ephemeral side-question session in a background Herdr tab",
		handler: async (args, ctx) => {
			const question = args.trim();
			if (!question) {
				ctx.ui.notify("Usage: /btw <question>", "warning");
				return;
			}
			if (!isTerminalAvailable()) {
				ctx.ui.notify(terminalSetupHint(), "error");
				return;
			}

			let sessionFile: string | undefined;
			let surface: string | undefined;
			let launchScriptFile: string | undefined;
			try {
				await ctx.waitForIdle();
				if (btwChild) await closeBtw();

				const parentSessionFile = ctx.sessionManager.getSessionFile();
				const leafId = ctx.sessionManager.getLeafId();
				if (!parentSessionFile || !leafId) {
					throw new Error("No completed session context is available for BTW");
				}
				if (!ctx.model) throw new Error("No parent model is selected");

				sessionFile = createBtwSessionSnapshot(parentSessionFile, leafId);
				surface = createSubagentPane("BTW");
				await waitForShellReady(surface);

				const artifactDir = getArtifactDir(
					ctx.sessionManager.getSessionDir(),
					ctx.sessionManager.getSessionId(),
				);
				launchScriptFile = join(
					artifactDir,
					"subagent-scripts",
					`btw-${Date.now()}-${Math.random().toString(16).slice(2, 8)}.sh`,
				);
				const command = buildBtwLaunchCommand({
					cwd: ctx.cwd,
					sessionFile,
					question,
					model: `${ctx.model.provider}/${ctx.model.id}`,
					thinking: pi.getThinkingLevel(),
					agentDir: process.env.PI_CODING_AGENT_DIR,
				});
				runScriptInPane(surface, command, {
					scriptPath: launchScriptFile,
					scriptPreamble: [
						"# BTW side-question session",
						`# Session: ${sessionFile}`,
						`# Generated: ${new Date().toISOString()}`,
					].join("\n"),
				});
				btwChild = { surface, sessionFile, launchScriptFile };
				ctx.ui.notify("BTW opened in a background Herdr tab.", "info");
			} catch (error) {
				if (surface) {
					try {
						closePane(surface);
					} catch {
						// Leave the pane for manual recovery if launch cleanup fails.
					}
				}
				for (const file of [sessionFile, launchScriptFile]) {
					if (!file) continue;
					try {
						rmSync(file, { force: true });
					} catch {
						// Best effort.
					}
				}
				ctx.ui.notify(
					`BTW failed: ${error instanceof Error ? error.message : String(error)}`,
					"error",
				);
			}
		},
	});

	pi.registerCommand("btw-close", {
		description: "Close the current BTW side-question session",
		handler: async (_args, ctx) => {
			try {
				if (!(await closeBtw())) {
					ctx.ui.notify("No BTW session is open.", "info");
					return;
				}
				ctx.ui.notify("BTW session closed.", "info");
			} catch (error) {
				ctx.ui.notify(
					`Could not close BTW session: ${error instanceof Error ? error.message : String(error)}`,
					"warning",
				);
			}
		},
	});

	pi.registerCommand("worktree", {
		description:
			"Fork this session into a worktree; use /worktree list to inspect them",
		handler: async (args, ctx) => {
			const trimmed = args.trim();
			const parts = trimmed.split(/\s+/).filter(Boolean);
			if (trimmed === "list") {
				if (!isTerminalAvailable()) {
					ctx.ui.notify(terminalSetupHint(), "error");
					return;
				}
				try {
					const worktrees = listHerdrWorktrees(ctx.cwd);
					ctx.ui.notify(
						worktrees
							.map(
								(worktree) =>
									`${worktree.branch} — ${worktree.path}${worktree.workspaceId ? ` (${worktree.workspaceId})` : ""}`,
							)
							.join("\n") || "No worktrees found.",
						"info",
					);
				} catch (error) {
					ctx.ui.notify(
						`Worktree list failed: ${error instanceof Error ? error.message : String(error)}`,
						"error",
					);
				}
				return;
			}

			const branch = parts.shift();
			if (!branch || branch === "list") {
				ctx.ui.notify("Usage: /worktree <name> [task] | /worktree list", "warning");
				return;
			}
			if (!isTerminalAvailable()) {
				ctx.ui.notify(terminalSetupHint(), "error");
				return;
			}

			try {
				await ctx.waitForIdle();
				const sessionFile = ctx.sessionManager.getSessionFile();
				const leafId = ctx.sessionManager.getLeafId();
				if (!sessionFile || !leafId) {
					throw new Error(
						"Start pi with a completed persistent session before handing off",
					);
				}
				if (!ctx.model) throw new Error("No parent model is selected");
				const thinking = pi.getThinkingLevel();
				if (!isThinkingLevel(thinking)) {
					throw new Error(`Unsupported parent thinking level: ${thinking}`);
				}
				const task =
					parts.join(" ") || "Continue the current work in the new worktree.";
				const runtimePlan = resolveRuntimePlan(
					{},
					{},
					{
						provider: ctx.model.provider,
						modelId: ctx.model.id,
						thinking,
					},
					wrapPiModelRegistry(ctx.modelRegistry),
				);
				const result = await launchPiWorktreeHandoff({
					kind: "fresh",
					name: `wt: ${branch}`,
					task,
					cwd: ctx.cwd,
					worktree: { branch },
					handoff: { leafId },
					parent: {
						cwd: ctx.cwd,
						invocationCwd: process.cwd(),
						sessionFile,
						sessionId: ctx.sessionManager.getSessionId(),
						sessionDir: ctx.sessionManager.getSessionDir(),
						agentDir: getAgentConfigDir(),
					},
					runtimePlan,
					behavior: {
						deniedTools: [],
						autoExit: false,
						interactive: true,
						sessionMode: "standalone",
					},
				});
				const worktree = result.running.worktree;
				if (!worktree) {
					throw new Error("Worktree handoff did not return worktree metadata");
				}
				ctx.ui.notify(
					result.focusError
						? `Worktree launched, but workspace focus failed: ${result.focusError}\nWorktree: ${worktree.path}`
						: `Worktree launched in ${worktree.path} (workspace ${worktree.workspaceId}).`,
					result.focusError ? "warning" : "info",
				);
			} catch (error) {
				ctx.ui.notify(
					`Worktree launch failed: ${error instanceof Error ? error.message : String(error)}`,
					"error",
				);
			}
		},
	});

	// /iterate command — fork the session into a subagent
	pi.registerCommand("iterate", {
		description:
			"Fork session into a subagent for focused work (bugfixes, iteration)",
		handler: async (args, _ctx) => {
			const task = args.trim() || "";
			const toolCall = task
				? `Use subagent to fork an interactive session. fork: true, interactive: true, name: "Iterate", task: ${JSON.stringify(task)}`
				: `Use subagent to fork an interactive session. fork: true, interactive: true, name: "Iterate", task: "The user wants to do some hands-on work. Help them with whatever they need."`;
			pi.sendUserMessage(toolCall);
		},
	});

	// /subagent command — spawn a subagent by name, or list available agents
	pi.registerCommand("subagent", {
		description:
			"Spawn a subagent: /subagent <agent> <task>; list agents: /subagent list",
		handler: async (args, ctx) => {
			const trimmed = args.trim();
			if (trimmed === "list") {
				const catalog = discoverAgentCatalog(pi);
				const lines = [
					...formatVisibleAgentDefinitions(catalog.agents),
					...formatAgentDiagnostics(catalog.diagnostics),
				];
				ctx.ui.notify(lines.join("\n") || "No subagent definitions found.", "info");
				return;
			}
			if (!trimmed) {
				ctx.ui.notify(
					"Usage: /subagent <agent> [task] | /subagent list",
					"warning",
				);
				return;
			}

			const spaceIdx = trimmed.indexOf(" ");
			const agentName = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
			const task = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();

			const catalog = discoverAgentCatalog(pi);
			const defs = catalog.agents.find((agent) => agent.name === agentName);
			if (!defs) {
				const diagnostic = catalog.diagnostics.find(
					(candidate) => candidate.agentName === agentName,
				);
				ctx.ui.notify(
					diagnostic?.message ?? `Agent "${agentName}" not found.`,
					"error",
				);
				return;
			}

			const taskText =
				task || `You are the ${agentName} agent. Wait for instructions.`;
			const displayName = agentName[0].toUpperCase() + agentName.slice(1);
			const toolCall = `Use subagent with agent: "${agentName}", name: "${displayName}", task: ${JSON.stringify(taskText)}`;
			pi.sendUserMessage(toolCall);
		},
	});

	// ── subagent_result message renderer ──
	pi.registerMessageRenderer("subagent_result", (message, options, theme) => {
		const details = message.details as any;
		if (!details) return undefined;

		return {
			invalidate() {},
			render(width: number): string[] {
				const name = details.name ?? "subagent";
				const exitCode = details.exitCode ?? 0;
				const errorMessage =
					typeof details.errorMessage === "string" ? details.errorMessage : "";
				const failed = exitCode !== 0 || !!errorMessage;
				const elapsed =
					details.elapsed == null ? "?" : formatElapsed(details.elapsed);
				const bgFn = failed
					? (text: string) => theme.bg("toolErrorBg", text)
					: (text: string) => theme.bg("toolSuccessBg", text);
				const icon = failed ? theme.fg("error", "✗") : theme.fg("success", "✓");
				const status = errorMessage
					? "failed (provider/agent error)"
					: failed
						? `failed (exit ${exitCode})`
						: "completed";
				const agentTag = details.agent
					? theme.fg("dim", ` (${details.agent})`)
					: "";

				const header = `${icon} ${theme.fg("toolTitle", theme.bold(name))}${agentTag} ${theme.fg("dim", "—")} ${status} ${theme.fg("dim", `(${elapsed})`)}`;
				const rawContent =
					typeof details.resultContent === "string"
						? details.resultContent
						: typeof message.content === "string"
							? message.content
							: "";

				// Clean summary (remove session ref and leading label for display)
				const summary = rawContent
					.replace(/\n\nSession: .+\nResume: .+$/, "")
					.replace(`Sub-agent "${name}" completed (${elapsed}).\n\n`, "")
					.replace(`Sub-agent "${name}" failed (exit code ${exitCode}).\n\n`, "")
					.replace(
						new RegExp(
							`^Sub-agent "${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" failed after ${elapsed} \\(provider/agent error — auto-retry exhausted\\)\\.\\n\\n`,
						),
						"",
					);

				// Build content for the box
				const contentLines = [header];

				if (options.expanded) {
					// Full view: complete summary + session info
					if (summary) {
						for (const line of summary.split("\n")) {
							contentLines.push(line.slice(0, width - 6));
						}
					}
					if (details.sessionFile) {
						contentLines.push("");
						contentLines.push(theme.fg("dim", `Session: ${details.sessionFile}`));
						contentLines.push(
							theme.fg("dim", `Resume:  pi --session ${details.sessionFile}`),
						);
					}
				} else {
					// Collapsed: preview + expand hint
					if (summary) {
						const previewLines = summary.split("\n").slice(0, 5);
						for (const line of previewLines) {
							contentLines.push(theme.fg("dim", line.slice(0, width - 6)));
						}
						const totalLines = summary.split("\n").length;
						if (totalLines > 5) {
							contentLines.push(theme.fg("muted", `… ${totalLines - 5} more lines`));
						}
					}
					contentLines.push(
						theme.fg("muted", keyHint("app.tools.expand", "to expand")),
					);
				}

				// Render via Box for background + padding, with blank line above for separation
				const box = new Box(1, 1, bgFn);
				box.addChild(new Text(contentLines.join("\n"), 0, 0));
				return ["", ...box.render(width)];
			},
		};
	});

	// ── subagent_status message renderer ──
	pi.registerMessageRenderer("subagent_status", (message, options, theme) => {
		const details = message.details as any;
		const lines = Array.isArray(details?.lines) ? details.lines : [];
		const overflow = typeof details?.overflow === "number" ? details.overflow : 0;
		if (lines.length === 0 && overflow === 0) return undefined;

		return {
			invalidate() {},
			render(width: number): string[] {
				const lineWidth = Math.max(0, width - 6);
				const contentLines = [
					`${theme.fg("accent", "•")} ${theme.fg("toolTitle", theme.bold("Subagent status"))}`,
					...lines.map((line: string) =>
						theme.fg("dim", truncateToWidth(line, lineWidth)),
					),
				];

				if (overflow > 0) {
					contentLines.push(theme.fg("muted", `+${overflow} more running.`));
				}
				if (!options.expanded) {
					contentLines.push(
						theme.fg("muted", keyHint("app.tools.expand", "to expand")),
					);
				}

				const box = new Box(1, 1, (text: string) =>
					theme.bg("customMessageBg", text),
				);
				box.addChild(new Text(contentLines.join("\n"), 0, 0));
				return ["", ...box.render(width)];
			},
		};
	});

	// ── subagent_ping message renderer ──
	pi.registerMessageRenderer("subagent_ping", (message, options, theme) => {
		const details = message.details as any;
		if (!details) return undefined;

		return {
			invalidate() {},
			render(width: number): string[] {
				const name = details.name ?? "subagent";
				const agentTag = details.agent
					? theme.fg("dim", ` (${details.agent})`)
					: "";
				const bgFn = (text: string) => theme.bg("toolSuccessBg", text);

				const icon = theme.fg("accent", "?");
				const header = `${icon} ${theme.fg("toolTitle", theme.bold(name))}${agentTag} ${theme.fg("dim", "— needs help")}`;

				const contentLines = [header];

				if (options.expanded) {
					contentLines.push("");
					contentLines.push(details.message ?? "");
					if (details.sessionFile) {
						contentLines.push("");
						contentLines.push(theme.fg("dim", `Session: ${details.sessionFile}`));
					}
				} else {
					const preview = (details.message ?? "")
						.split("\n")[0]
						.slice(0, width - 10);
					contentLines.push(theme.fg("dim", preview));
					contentLines.push(
						theme.fg("muted", keyHint("app.tools.expand", "to expand")),
					);
				}

				const box = new Box(1, 1, bgFn);
				box.addChild(new Text(contentLines.join("\n"), 0, 0));
				return ["", ...box.render(width)];
			},
		};
	});

	// /plan command — start the full planning workflow
	pi.registerCommand("plan", {
		description: "Start a planning session: /plan <what to build>",
		handler: async (args, ctx) => {
			const task = args.trim();
			if (!task) {
				ctx.ui.notify("Usage: /plan <what to build>", "warning");
				return;
			}

			// Load the plan skill from the subagents extension directory
			const planSkillPath = join(SUBAGENTS_DIR, "plan-skill.md");
			let content = readFileSync(planSkillPath, "utf8");
			content = content.replace(/^---\n[\s\S]*?\n---\n*/, "");
			pi.sendUserMessage(
				`<skill name="plan" location="${planSkillPath}">\n${content.trim()}\n</skill>\n\n${task}`,
			);
		},
	});
}
