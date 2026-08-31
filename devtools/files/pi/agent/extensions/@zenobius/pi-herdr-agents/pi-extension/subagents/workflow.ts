import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
	appendFileSync,
	closeSync,
	existsSync,
	lstatSync,
	openSync,
	readdirSync,
	realpathSync,
	readFileSync,
	writeSync,
} from "node:fs";
import { Worker } from "node:worker_threads";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import {
	isThinkingLevel,
	parseExactModelRef,
	resolveRuntimePlan,
	type ModelRegistryAdapter,
	type ThinkingLevel,
} from "./runtime-routing.ts";

const MAX_WORKFLOW_BYTES = 256 * 1024;
const MAX_AGENTS = 8;
const MAX_CONCURRENCY = 4;
const MAX_LOGS = 100;
const MAX_LOG_CHARS = 4_000;
const MAX_RESULT_BYTES = 64 * 1024;
const DEFAULT_DEADLINE_MS = 30 * 60 * 1_000;
const CANCELLED_AGENT_RESULT = Object.freeze({
	ok: false as const,
	code: "cancelled",
	message: "Workflow cancelled.",
	retryable: false as const,
});
const READ_ONLY_TOOLS = new Set(["read", "grep", "find", "ls"]);
const METADATA_FIELDS = new Set([
	"version",
	"name",
	"sources",
	"baseSha",
	"maxAgents",
	"maxConcurrency",
	"roles",
]);
const ROLE_FIELDS = new Set(["id", "role", "kind", "model", "thinking"]);

export class WorkflowPreparationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "WorkflowPreparationError";
	}
}

export interface WorkflowRole {
	name: string;
	source: string;
	path: string;
	body?: string;
	model?: string;
	thinking?: ThinkingLevel;
	tools?: string;
	skills?: string;
	denyTools?: string;
	spawning?: boolean;
	autoExit?: boolean;
	interactive?: boolean;
	sessionMode?: string;
	cwd?: string;
	disableModelInvocation?: boolean;
}

interface WorkflowMetadataRole {
	id: string;
	role: string;
	kind: "review";
	model: string;
	thinking: ThinkingLevel;
}

interface WorkflowMetadata {
	version: 1;
	name: string;
	sources: string[];
	baseSha: string;
	maxAgents: number;
	maxConcurrency: number;
	roles: WorkflowMetadataRole[];
}

export interface WorkflowRolePolicy {
	id: string;
	role: string;
	model: string;
	thinking: ThinkingLevel;
	tools: string[];
	promptHash: string;
	fingerprint: string;
}

export interface PendingWorkflow {
	runId: string;
	path: string;
	scriptHash: string;
	bytes: string;
	metadata: WorkflowMetadata;
	repository: { root: string; commonDir: string };
	baseSha: string;
	sources: string[];
	rolePolicies: WorkflowRolePolicy[];
	parentSession: { id: string; file: string; prepareLeafId: string };
}

export interface PrepareWorkflowInput {
	cwd: string;
	path: string;
	roles: WorkflowRole[];
	modelRegistry: ModelRegistryAdapter;
	parentSession: PendingWorkflow["parentSession"];
	extensionDenyTools?: ReadonlySet<string>;
}

function fail(message: string): never {
	throw new WorkflowPreparationError(message);
}

function hash(value: string): string {
	return createHash("sha256").update(value).digest("hex");
}

function git(cwd: string, args: string[]): string {
	try {
		return execFileSync("git", ["-C", cwd, ...args], {
			encoding: "utf8",
		}).trim();
	} catch {
		return fail(`Git command failed: git ${args.join(" ")}`);
	}
}

function contains(root: string, path: string): boolean {
	const rel = relative(root, path);
	return (
		rel === "" ||
		(!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
	);
}

function requireRegularPath(path: string, label: string) {
	let stat: ReturnType<typeof lstatSync>;
	try {
		stat = lstatSync(path);
	} catch {
		fail(`${label} does not exist: ${path}`);
	}
	if (stat.isSymbolicLink()) fail(`${label} must not be a symlink: ${path}`);
}

function resolveArtifact(cwd: string, requestedPath: string) {
	const repositoryPath = git(cwd, ["rev-parse", "--show-toplevel"]);
	const root = realpathSync(repositoryPath);
	const requested = resolve(cwd, requestedPath);
	const requestedCwd = resolve(cwd);
	const canonicalCwd = realpathSync(requestedCwd);
	for (let candidate = requested; ; candidate = dirname(candidate)) {
		if (candidate === requestedCwd || candidate === canonicalCwd) break;
		requireRegularPath(candidate, "workflow artifact path");
		if (candidate === dirname(candidate))
			fail("workflow path must be inside the current project");
	}
	const path = realpathSync(requested);
	const plans = join(root, ".pi", "plans");
	if (!contains(plans, path)) fail("workflow path must be inside .pi/plans");

	const parts = relative(plans, path).split(sep);
	if (
		parts.length !== 2 ||
		parts[0] === "" ||
		parts[0] === "." ||
		parts[0] === ".." ||
		parts[1] !== "workflow.js"
	) {
		fail("workflow path must have the shape .pi/plans/<run>/workflow.js");
	}

	try {
		lstatSync(join(dirname(path), "run.jsonl"));
		fail("workflow run journal already exists");
	} catch (error) {
		if (error instanceof WorkflowPreparationError) throw error;
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			fail(
				`Cannot inspect workflow run journal: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	return { root, path, runId: parts[0] };
}

function object(value: unknown, label: string): Record<string, unknown> {
	if (value == null || typeof value !== "object" || Array.isArray(value)) {
		fail(`${label} must be an object`);
	}
	return value as Record<string, unknown>;
}

function exactKeys(
	value: Record<string, unknown>,
	allowed: ReadonlySet<string>,
	label: string,
) {
	const unsupported = Object.keys(value).filter((key) => !allowed.has(key));
	if (unsupported.length > 0)
		fail(`${label} has unsupported field(s): ${unsupported.join(", ")}`);
}

function string(value: unknown, label: string): string {
	if (typeof value !== "string" || value.trim() === "")
		fail(`${label} must be a non-empty string`);
	return value;
}

function positiveInteger(
	value: unknown,
	label: string,
	maximum: number,
): number {
	if (
		!Number.isInteger(value) ||
		(value as number) < 1 ||
		(value as number) > maximum
	) {
		fail(`${label} must be an integer from 1 to ${maximum}`);
	}
	return value as number;
}

function parseMetadata(source: string): WorkflowMetadata {
	const match = source.match(/^\/\* herdr-workflow\n([\s\S]*?)\n\*\//);
	if (!match)
		fail("workflow metadata must be the first herdr-workflow comment");

	let parsed: unknown;
	try {
		parsed = JSON.parse(match[1]);
	} catch {
		return fail("workflow metadata must contain valid JSON");
	}
	const metadata = object(parsed, "workflow metadata");
	exactKeys(metadata, METADATA_FIELDS, "workflow metadata");
	if (metadata.version !== 1) fail("workflow metadata version must be 1");
	const name = string(metadata.name, "workflow metadata name");
	const baseSha = string(metadata.baseSha, "workflow metadata baseSha");
	if (!/^[a-f0-9]{40}$/.test(baseSha))
		fail("workflow metadata baseSha must be a full lowercase commit SHA");
	const maxAgents = positiveInteger(
		metadata.maxAgents,
		"workflow metadata maxAgents",
		MAX_AGENTS,
	);
	const maxConcurrency = positiveInteger(
		metadata.maxConcurrency,
		"workflow metadata maxConcurrency",
		MAX_CONCURRENCY,
	);
	if (maxConcurrency > maxAgents)
		fail("workflow metadata maxConcurrency cannot exceed maxAgents");
	if (!Array.isArray(metadata.sources) || metadata.sources.length === 0) {
		fail("workflow metadata sources must be a non-empty array");
	}
	const sources = metadata.sources.map((source, index) =>
		string(source, `workflow metadata sources[${index}]`),
	);
	if (!Array.isArray(metadata.roles) || metadata.roles.length === 0) {
		fail("workflow metadata roles must be a non-empty array");
	}
	const nodeIds = new Set<string>();
	const roles = metadata.roles.map((candidate, index) => {
		const role = object(candidate, `workflow metadata roles[${index}]`);
		exactKeys(role, ROLE_FIELDS, `workflow metadata roles[${index}]`);
		const name = string(role.role, `workflow metadata roles[${index}].role`);
		const id =
			role.id === undefined
				? name
				: string(role.id, `workflow metadata roles[${index}].id`);
		if (nodeIds.has(id))
			fail(`workflow metadata has duplicate review node ${JSON.stringify(id)}`);
		nodeIds.add(id);
		if (role.kind !== "review")
			fail(`workflow role ${JSON.stringify(name)} must have kind "review"`);
		const model = string(
			role.model,
			`workflow role ${JSON.stringify(name)} model`,
		);
		const thinking = string(
			role.thinking,
			`workflow role ${JSON.stringify(name)} thinking`,
		);
		if (!isThinkingLevel(thinking))
			fail(`workflow role ${JSON.stringify(name)} has unsupported thinking`);
		return { id, role: name, kind: "review" as const, model, thinking };
	});

	return {
		version: 1,
		name,
		sources,
		baseSha,
		maxAgents,
		maxConcurrency,
		roles,
	};
}

function isProvenanceSource(source: string): boolean {
	if (/^#[0-9]+$/.test(source) || /^[A-Z][A-Z0-9]+-[0-9]+$/.test(source))
		return true;
	try {
		const url = new URL(source);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function validateSources(root: string, sources: string[]) {
	for (const source of sources) {
		if (isProvenanceSource(source)) continue;
		const path = resolve(root, source);
		if (!contains(root, path))
			fail(`local source escapes the repository: ${source}`);
		try {
			if (!contains(root, realpathSync(path))) {
				fail(
					`local source escapes the repository through a symlink: ${source}`,
				);
			}
		} catch (error) {
			if (error instanceof WorkflowPreparationError) throw error;
			fail(`local source does not exist: ${source}`);
		}
	}
}

function deriveTools(
	role: WorkflowRole,
	extensionDenyTools: ReadonlySet<string>,
): string[] {
	const roleDenyTools = new Set(
		(role.denyTools ?? "")
			.split(",")
			.map((tool) => tool.trim())
			.filter(Boolean),
	);
	if (role.spawning === false) {
		for (const tool of [
			"subagent",
			"subagent_interrupt",
			"subagent_resume",
			"subagents_list",
		]) {
			roleDenyTools.add(tool);
		}
	}
	return [
		...new Set(
			(role.tools ?? "")
				.split(",")
				.map((tool) => tool.trim())
				.filter(Boolean),
		),
	].filter(
		(tool) =>
			READ_ONLY_TOOLS.has(tool) &&
			!roleDenyTools.has(tool) &&
			!extensionDenyTools.has(tool),
	);
}

function resolveRolePolicies(
	metadata: WorkflowMetadata,
	roles: WorkflowRole[],
	modelRegistry: ModelRegistryAdapter,
	extensionDenyTools: ReadonlySet<string>,
): WorkflowRolePolicy[] {
	const available = new Map(roles.map((role) => [role.name, role]));
	return metadata.roles.map((declared) => {
		const role = available.get(declared.role);
		if (!role || role.disableModelInvocation)
			fail(`workflow role ${JSON.stringify(declared.role)} is unavailable`);
		const model = parseExactModelRef(declared.model);
		if (!model || declared.model !== `${model.provider}/${model.modelId}`) {
			fail(
				`workflow role ${JSON.stringify(declared.role)} model must be an exact provider/model-id`,
			);
		}
		const found = modelRegistry.find(model.provider, model.modelId);
		if (!found || !modelRegistry.hasConfiguredAuth(found)) {
			fail(
				`workflow role ${JSON.stringify(declared.role)} model is not authenticated`,
			);
		}
		try {
			resolveRuntimePlan(
				{ model: declared.model, thinking: declared.thinking },
				{},
				{
					provider: model.provider,
					modelId: model.modelId,
					thinking: declared.thinking,
				},
				modelRegistry,
			);
		} catch (error) {
			fail(
				`workflow role ${JSON.stringify(declared.role)} runtime is invalid: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
		const tools = deriveTools(role, extensionDenyTools);
		if (tools.length === 0)
			fail(
				`workflow role ${JSON.stringify(declared.role)} has no permitted read-only tools`,
			);
		const promptHash = hash(role.body ?? "");
		const fingerprint = hash(
			JSON.stringify({
			role: {
				name: role.name,
				source: role.source,
				path: role.path,
				body: role.body ?? "",
				model: role.model,
				thinking: role.thinking,
				tools: role.tools,
				skills: role.skills,
				denyTools: role.denyTools,
				spawning: role.spawning,
				autoExit: role.autoExit,
				interactive: role.interactive,
				sessionMode: role.sessionMode,
				cwd: role.cwd,
			},
			runtime: { model: declared.model, thinking: declared.thinking },
			tools,
			}),
		);
		return {
			id: declared.id,
			role: declared.role,
			model: declared.model,
			thinking: declared.thinking,
			tools,
			promptHash,
			fingerprint,
		};
	});
}

export function prepareWorkflow(input: PrepareWorkflowInput): PendingWorkflow {
	if (
		!input.parentSession.id ||
		!input.parentSession.file ||
		!input.parentSession.prepareLeafId
	) {
		fail("workflow preparation requires a persistent parent session");
	}
	const artifact = resolveArtifact(input.cwd, input.path);
	const bytes = readFileSync(artifact.path, "utf8");
	if (Buffer.byteLength(bytes) > MAX_WORKFLOW_BYTES)
		fail("workflow source exceeds 256 KiB");
	const metadata = parseMetadata(bytes);
	try {
		new Function(`async () => {\n${bytes}\n}`);
	} catch (error) {
		fail(
			`workflow JavaScript does not compile: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
	const baseSha = git(artifact.root, [
		"rev-parse",
		"--verify",
		`${metadata.baseSha}^{commit}`,
	]);
	if (baseSha !== metadata.baseSha)
		fail("workflow metadata baseSha must resolve to the exact commit");
	const commonDir = realpathSync(
		git(artifact.root, [
			"rev-parse",
			"--path-format=absolute",
			"--git-common-dir",
		]),
	);
	validateSources(artifact.root, metadata.sources);
	const rolePolicies = resolveRolePolicies(
		metadata,
		input.roles,
		input.modelRegistry,
		input.extensionDenyTools ?? new Set(),
	);

	return {
		runId: artifact.runId,
		path: artifact.path,
		scriptHash: hash(bytes),
		bytes,
		metadata,
		repository: { root: artifact.root, commonDir },
		baseSha,
		sources: metadata.sources,
		rolePolicies,
		parentSession: input.parentSession,
	};
}

export interface WorkflowApproval {
	entryId: string;
}

interface WorkflowSessionEntry {
	id?: unknown;
	type?: unknown;
	message?: { role?: unknown; content?: unknown };
}

function userMessageText(entry: WorkflowSessionEntry): string | undefined {
	if (entry.type !== "message" || entry.message?.role !== "user")
		return undefined;
	if (!Array.isArray(entry.message.content)) return undefined;
	const text = entry.message.content
		.filter(
			(block): block is { type: string; text: string } =>
				!!block &&
				typeof block === "object" &&
			(block as { type?: unknown }).type === "text" &&
			typeof (block as { text?: unknown }).text === "string",
		)
		.map((block) => block.text)
		.join("");
	return text || undefined;
}

export function validateWorkflowApproval(
	candidate: PendingWorkflow,
	parent: {
		sessionId: string;
		sessionFile: string;
		branch: WorkflowSessionEntry[];
	},
): WorkflowApproval {
	if (
		parent.sessionId !== candidate.parentSession.id ||
		parent.sessionFile !== candidate.parentSession.file
	) {
		fail(
			"workflow approval must use the parent session that prepared the candidate",
		);
	}
	const leaf = parent.branch.findIndex(
		(entry) => entry.id === candidate.parentSession.prepareLeafId,
	);
	if (leaf === -1)
		fail("workflow preparation is not on the active parent branch");
	let approval: WorkflowSessionEntry | undefined;
	for (const entry of parent.branch.slice(leaf + 1)) {
		if (userMessageText(entry) !== undefined) approval = entry;
	}
	const text = approval && userMessageText(approval);
	const expected = `APPROVE ${candidate.scriptHash.slice(0, 8)}`;
	if (text !== expected || typeof approval?.id !== "string") {
		fail(
			`workflow approval must be the latest user message and exactly ${expected}`,
		);
	}
	return { entryId: approval.id };
}

export function sameWorkflowCandidate(
	left: PendingWorkflow,
	right: PendingWorkflow,
): boolean {
	return (
		JSON.stringify({
		scriptHash: left.scriptHash,
		repository: left.repository,
		baseSha: left.baseSha,
		sources: left.sources,
		rolePolicies: left.rolePolicies,
		}) ===
		JSON.stringify({
		scriptHash: right.scriptHash,
		repository: right.repository,
		baseSha: right.baseSha,
		sources: right.sources,
		rolePolicies: right.rolePolicies,
		})
	);
}

export interface WorkflowJournal {
	path: string;
	append(type: string, details?: Record<string, unknown>): string;
}

const WORKFLOW_TERMINAL_EVENTS = new Set<WorkflowTerminalState>([
	"completed",
	"failed",
	"cancelled",
	"interrupted",
]);

export interface WorkflowStartupRecord {
	runId: string;
	journalPath: string;
	lastEvent?: Record<string, unknown>;
	interrupted: boolean;
}

function readLastValidWorkflowEvent(path: string): Record<string, unknown> | undefined {
	let lines: string[];
	try {
		lines = readFileSync(path, "utf8").split("\n");
	} catch {
		return undefined;
	}
	for (let index = lines.length - 1; index >= 0; index -= 1) {
		if (!lines[index].trim()) continue;
		try {
			const event: unknown = JSON.parse(lines[index]);
			if (
				event &&
				typeof event === "object" &&
				!Array.isArray(event) &&
				typeof (event as Record<string, unknown>).type === "string"
			) {
				return event as Record<string, unknown>;
			}
		} catch {
			// A torn final line is not evidence of a newer workflow state.
		}
	}
	return undefined;
}

function workflowRepositoryIdentity(cwd: string): string {
	return realpathSync(git(cwd, ["rev-parse", "--show-toplevel"]));
}

/**
 * Recover only evidence left running by a full process restart. This is a
 * startup scan, not replay: terminal and delivery events are settled, and no
 * checkout or child process is touched.
 */
export function recoverWorkflowStartup(
	cwd: string,
	liveRunIds: ReadonlySet<string> = new Set(),
): WorkflowStartupRecord[] {
	let root: string;
	try {
		root = workflowRepositoryIdentity(cwd);
	} catch {
		return [];
	}
	const plans = join(root, ".pi", "plans");
	let entries;
	try {
		entries = readdirSync(plans, { withFileTypes: true, encoding: "utf8" });
	} catch {
		return [];
	}
	const records: WorkflowStartupRecord[] = [];
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const runId = entry.name;
		const journalPath = join(plans, runId, "run.jsonl");
		let stat: ReturnType<typeof lstatSync>;
		try {
			stat = lstatSync(journalPath);
		} catch {
			continue;
		}
		if (!stat.isFile() || stat.isSymbolicLink()) continue;
		const lastEvent = readLastValidWorkflowEvent(journalPath);
		const record: WorkflowStartupRecord = {
			runId,
			journalPath,
			lastEvent,
			interrupted: false,
		};
		if (!lastEvent || liveRunIds.has(runId)) {
			records.push(record);
			continue;
		}
		const type = lastEvent.type;
		if (typeof type !== "string" || type === "approved") {
			records.push(record);
			continue;
		}
		if (type === "delivery" || WORKFLOW_TERMINAL_EVENTS.has(type as WorkflowTerminalState)) {
			records.push(record);
			continue;
		}
		const event = {
			id: randomUUID(),
			type: "interrupted",
			at: new Date().toISOString(),
			envelope: {
				runId,
				state: "interrupted",
				error: {
					code: "process_restarted",
					message: "Workflow was interrupted by a full process restart.",
				},
			},
		};
		try {
			const journal = readFileSync(journalPath, "utf8");
			const separator = journal.length > 0 && !journal.endsWith("\n") ? "\n" : "";
			appendFileSync(journalPath, `${separator}${JSON.stringify(event)}\n`, "utf8");
			record.lastEvent = event;
			record.interrupted = true;
		} catch {
			// Preserve the journal and report its last known evidence.
		}
		records.push(record);
	}
	return records;
}

export function createWorkflowJournal(
	candidate: PendingWorkflow,
	approval: WorkflowApproval,
): WorkflowJournal {
	const path = join(dirname(candidate.path), "run.jsonl");
	const append = (type: string, details: Record<string, unknown> = {}) => {
		const id = randomUUID();
		appendFileSync(
			path,
			`${JSON.stringify({ id, type, at: new Date().toISOString(), ...details })}\n`,
			"utf8",
		);
		return id;
	};
	let fd: number | undefined;
	try {
		fd = openSync(path, "wx");
		writeSync(
			fd,
			`${JSON.stringify({
			id: randomUUID(),
			type: "approved",
			at: new Date().toISOString(),
			scriptHash: candidate.scriptHash,
			repository: candidate.repository,
			baseSha: candidate.baseSha,
			preparingSession: candidate.parentSession,
			approvingUserEntryId: approval.entryId,
			sources: candidate.sources,
			rolePolicies: candidate.rolePolicies,
			})}\n`,
		);
	} catch (error) {
		fail(
			`Cannot create workflow journal: ${error instanceof Error ? error.message : String(error)}`,
		);
	} finally {
		if (fd !== undefined) closeSync(fd);
	}
	return { path, append };
}

export interface WorkflowReaderCheckout {
	path: string;
	status: "disposed" | "retained";
	reason?: string;
}

export function createWorkflowReaderCheckout(
	candidate: PendingWorkflow,
	journal: WorkflowJournal,
): string {
	const path = join(dirname(candidate.path), "reader-checkout");
	if (existsSync(path))
		throw new Error(`Workflow reader checkout already exists: ${path}`);
	let created = false;
	try {
		execFileSync(
			"git",
			["worktree", "add", "--detach", path, candidate.baseSha],
			{
			cwd: candidate.repository.root,
			stdio: "pipe",
			},
		);
		created = true;
		const head = git(path, ["rev-parse", "HEAD"]);
		const commonDir = realpathSync(
			git(path, ["rev-parse", "--path-format=absolute", "--git-common-dir"]),
		);
		if (
			head !== candidate.baseSha ||
			commonDir !== candidate.repository.commonDir
		) {
			throw new Error(
				"Workflow reader checkout identity does not match the approved repository and base",
			);
		}
		journal.append("reader_checkout_ready", { path, baseSha: head, commonDir });
		return path;
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		if (created) journal.append("reader_checkout_retained", { path, reason });
		throw new Error(
			`Cannot create approved workflow reader checkout: ${reason}`,
		);
	}
}

export function disposeWorkflowReaderCheckout(
	candidate: PendingWorkflow,
	path: string,
	journal: WorkflowJournal,
): WorkflowReaderCheckout {
	try {
		const status = execFileSync(
			"git",
			["status", "--porcelain=v1", "--untracked-files=all"],
			{
			cwd: path,
			encoding: "utf8",
			},
		);
		if (status) {
			journal.append("reader_checkout_retained", { path, reason: "dirty" });
			return { path, status: "retained", reason: "dirty" };
		}
		execFileSync("git", ["worktree", "remove", path], {
			cwd: candidate.repository.root,
			stdio: "pipe",
		});
		journal.append("reader_checkout_disposed", { path });
		return { path, status: "disposed" };
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		journal.append("reader_checkout_retained", { path, reason });
		return { path, status: "retained", reason };
	}
}

export type JsonValue =
	| null
	| boolean
	| number
	| string
	| JsonValue[]
	| { [key: string]: JsonValue };

export type WorkflowTerminalState =
	| "completed"
	| "failed"
	| "cancelled"
	| "interrupted";

export type WorkflowExecutionResult =
	| { state: "completed"; result: JsonValue }
	| { state: "failed"; error: { code: string; message: string } }
	| { state: "cancelled"; error?: { code: string; message: string } }
	| { state: "interrupted"; error?: { code: string; message: string } };

export type WorkflowGatePhase = "running" | "cancelling" | "terminal";

export interface WorkflowTerminalOutcome {
	state: WorkflowTerminalState;
	result?: JsonValue;
	error?: { code: string; message: string };
}

export interface WorkflowTerminalGate {
	phase: WorkflowGatePhase;
	outcome?: WorkflowTerminalOutcome;
}

export function createWorkflowTerminalGate(): WorkflowTerminalGate {
	return { phase: "running" };
}

export function beginWorkflowCancellation(
	gate: WorkflowTerminalGate,
): { claimed: true } | { claimed: false; outcome?: WorkflowTerminalOutcome } {
	if (gate.phase === "terminal") {
		if (!gate.outcome)
			throw new Error("Workflow terminal gate is missing its outcome");
		return { claimed: false, outcome: gate.outcome };
	}
	if (gate.phase === "cancelling") {
		return gate.outcome
			? { claimed: false, outcome: gate.outcome }
			: { claimed: false };
	}
	gate.phase = "cancelling";
	return { claimed: true };
}

export function claimWorkflowTerminal(
	gate: WorkflowTerminalGate,
	outcome: WorkflowTerminalOutcome,
): boolean {
	if (gate.phase === "terminal") return false;
	if (
		gate.phase === "cancelling" &&
		outcome.state !== "cancelled" &&
		outcome.state !== "failed"
	) {
		return false;
	}
	gate.phase = "terminal";
	gate.outcome = outcome;
	return true;
}

/** Map confirmed process exit evidence into the cancel terminal outcome. */
export function cancelTerminationResult(
	survivingPids: readonly number[],
	checkoutPath?: string,
	options: { identityUnconfirmed?: boolean } = {},
): {
	outcome: WorkflowTerminalOutcome;
	checkout?: WorkflowReaderCheckout;
	retainCheckout: boolean;
} {
	const unconfirmed =
		survivingPids.length > 0 || options.identityUnconfirmed === true;
	if (unconfirmed) {
		const message =
			survivingPids.length > 0
				? `Workflow cancellation could not confirm process exit for: ${survivingPids.join(", ")}`
				: "Workflow cancellation could not confirm process exit: active pane process identity was not captured.";
		return {
			retainCheckout: true,
			outcome: {
				state: "failed",
				error: {
					code: "cancel_termination_failed",
					message,
				},
			},
			...(checkoutPath
				? {
						checkout: {
							path: checkoutPath,
							status: "retained" as const,
							reason: "cancel_termination_failed",
						},
					}
				: {}),
		};
	}
	return {
		retainCheckout: false,
		outcome: {
			state: "cancelled",
			error: { code: "cancelled", message: "Workflow cancelled." },
		},
	};
}

function validateJson(
	value: unknown,
	seen = new Set<object>(),
): value is JsonValue {
	if (value === null || typeof value === "boolean" || typeof value === "string")
		return true;
	if (typeof value === "number") return Number.isFinite(value);
	if (typeof value !== "object" || seen.has(value)) return false;
	if (
		Object.getPrototypeOf(value) !== Object.prototype &&
		!Array.isArray(value)
	)
		return false;
	seen.add(value);
	const valid = Array.isArray(value)
		? Array.from(
				{ length: value.length },
				(_, index) =>
				Object.hasOwn(value, index) && validateJson(value[index], seen),
			).every(Boolean) &&
			Reflect.ownKeys(value).every(
				(key) =>
					typeof key === "string" &&
					(key === "length" ||
						(/^(0|[1-9]\d*)$/.test(key) && Number(key) < value.length)),
			)
		: Reflect.ownKeys(value).every(
			(key) =>
				typeof key === "string" &&
				Object.prototype.propertyIsEnumerable.call(value, key) &&
				validateJson(value[key as keyof typeof value], seen),
		);
	seen.delete(value);
	return valid;
}

export async function executeWorkflow(
	candidate: PendingWorkflow,
	options: {
		deadlineMs?: number;
		signal?: AbortSignal;
		onLog?: (message: string) => void;
		onWorker?: (worker: Worker) => void;
		onAgent?: (
			prompt: string,
			options: unknown,
		) => JsonValue | Promise<JsonValue>;
	} = {},
): Promise<WorkflowExecutionResult> {
	return new Promise((resolve) => {
		const worker = new Worker(
			new URL("./workflow-worker.js", import.meta.url),
			{
			workerData: { source: candidate.bytes, filename: candidate.path },
			},
		);
		options.onWorker?.(worker);
		let settled = false;
		let logs = 0;
		let agents = 0;
		let activeAgents = 0;
		const agentQueue: Array<(forced?: JsonValue) => void> = [];
		const drainQueue = (result: JsonValue = CANCELLED_AGENT_RESULT) => {
			const queued = agentQueue.splice(0);
			for (const start of queued) start(result);
		};
		const invokeAgent = (prompt: string, agentOptions: unknown) =>
			new Promise<JsonValue>((resolveAgent) => {
				const start = (forced?: JsonValue) => {
					if (forced !== undefined) {
						resolveAgent(forced);
						return;
					}
					if (options.signal?.aborted) {
						resolveAgent(CANCELLED_AGENT_RESULT);
						return;
					}
				activeAgents += 1;
					void (async () => {
				try {
					const result = await options.onAgent?.(prompt, agentOptions);
							resolveAgent(
								result ?? {
						ok: false,
						code: "agent_unavailable",
									message:
										"Workflow agent execution is not available in this slice",
						retryable: false,
								},
							);
				} catch (error) {
							resolveAgent({
						ok: false,
						code: "workflow_agent_error",
						message: error instanceof Error ? error.message : String(error),
						retryable: false,
					});
				} finally {
					activeAgents -= 1;
							const next = agentQueue.shift();
							if (next) next();
				}
					})();
			};
				if (options.signal?.aborted) {
					resolveAgent(CANCELLED_AGENT_RESULT);
					return;
				}
				if (activeAgents < candidate.metadata.maxConcurrency) start();
				else agentQueue.push(start);
		});
		const finish = (result: WorkflowExecutionResult) => {
			if (settled) return;
			settled = true;
			clearTimeout(deadline);
			options.signal?.removeEventListener("abort", onAbort);
			drainQueue();
			void worker.terminate().finally(() => resolve(result));
		};
		const fail = (code: string, message: string) =>
			finish({ state: "failed", error: { code, message } });
		const onAbort = () =>
			finish({
				state: "cancelled",
				error: { code: "cancelled", message: "Workflow cancelled." },
			});
		const deadline = setTimeout(
			() => fail("workflow_deadline", "Workflow deadline exceeded"),
			options.deadlineMs ?? DEFAULT_DEADLINE_MS,
		);
		if (options.signal) {
			if (options.signal.aborted) {
				onAbort();
				return;
			}
			options.signal.addEventListener("abort", onAbort, { once: true });
		}

		worker.on("message", (message: unknown) => {
			if (settled) return;
			if (!message || typeof message !== "object")
				return fail("workflow_protocol", "Invalid workflow Worker message");
			const event = message as Record<string, unknown>;
			if (event.type === "log") {
				if (typeof event.message !== "string")
					return fail("workflow_protocol", "Workflow log must be a string");
				if (++logs > MAX_LOGS || event.message.length > MAX_LOG_CHARS) {
					return fail("workflow_limit", "Workflow log limit exceeded");
				}
				try {
					options.onLog?.(event.message);
				} catch (error) {
					return fail(
						"workflow_log_error",
						error instanceof Error ? error.message : String(error),
					);
				}
				return;
			}
			if (event.type === "agent") {
				const id = typeof event.id === "string" ? event.id : "";
				const prompt = event.prompt;
				if (!id || typeof prompt !== "string")
					return fail("workflow_protocol", "Invalid workflow agent request");
				if (options.signal?.aborted) {
					worker.postMessage({
						type: "agent_result",
						id,
						result: CANCELLED_AGENT_RESULT,
					});
					return;
				}
				if (++agents > candidate.metadata.maxAgents) {
					worker.postMessage({
						type: "agent_result",
						id,
						result: {
							ok: false,
							code: "agent_limit",
							message: "Workflow agent limit exceeded.",
							retryable: false,
						},
					});
					return;
				}
				if (prompt.length > 100_000)
					return fail("workflow_limit", "Workflow prompt limit exceeded");
				void invokeAgent(prompt, event.options).then((result) => {
					if (settled) return;
					if (!validateJson(result))
						return fail(
							"workflow_agent_result_invalid",
							"Workflow agent returned a non-JSON-compatible result",
						);
					worker.postMessage({ type: "agent_result", id, result });
				});
				return;
			}
			if (event.type === "error") {
				return fail(
					"workflow_error",
					typeof event.message === "string"
						? event.message
						: "Workflow Worker failed",
				);
			}
			if (event.type !== "result")
				return fail("workflow_protocol", "Unknown workflow Worker message");
			if (!validateJson(event.result))
				return fail(
					"workflow_result_invalid",
					"Workflow returned a non-JSON-compatible result",
				);
			const serialized = JSON.stringify(event.result);
			if (Buffer.byteLength(serialized) > MAX_RESULT_BYTES) {
				return fail("workflow_result_limit", "Workflow result exceeds 64 KiB");
			}
			finish({ state: "completed", result: event.result });
		});
		worker.once("error", (error: unknown) =>
			fail(
				"workflow_worker_error",
				error instanceof Error ? error.message : String(error),
			),
		);
		worker.once("exit", (code: number) => {
			if (!settled)
				fail(
					"workflow_worker_exit",
					`Workflow Worker exited with code ${code}`,
				);
		});
	});
}

export function formatApprovalPacket(candidate: PendingWorkflow): string {
	return [
		`Prepared workflow ${candidate.runId}; no workflow has started.`,
		`Script SHA-256: ${candidate.scriptHash}`,
		`Repository: ${candidate.repository.root}`,
		`Git common directory: ${candidate.repository.commonDir}`,
		`Base commit: ${candidate.baseSha}`,
		`Sources: ${candidate.sources.join(", ")}`,
		`Review nodes: ${candidate.rolePolicies.map((role) => `${role.id}: ${role.role} (${role.model}, ${role.thinking}; ${role.tools.join(", ")})`).join("; ")}`,
		`Review-node policy fingerprints: ${candidate.rolePolicies.map((role) => `${role.id}=${role.fingerprint}`).join(", ")}`,
		`To execute this exact workflow once, reply: APPROVE ${candidate.scriptHash.slice(0, 8)}`,
	].join("\n");
}
