import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { Message } from "@mariozechner/pi-ai";
import { FactoryError } from "./errors.js";
import type { ObservabilityStore } from "./observability.js";
import type { ExecutionResult } from "./types.js";

// ── Single subagent spawn ──────────────────────────────────────────────

interface SpawnInput {
	runId: string;
	taskId: string;
	agent: string;
	systemPrompt: string;
	task: string;
	cwd: string;
	modelId: string;
	tools: string[];
	step?: number;
	signal?: AbortSignal;
	obs: ObservabilityStore;
	onProgress?: (result: ExecutionResult) => void;
	/** Parent session path — subagent can search_thread to explore parent context. */
	parentSessionPath?: string;
	/** Directory to write the subagent's session file into. */
	sessionDir?: string;
}

export interface SpawnHandle {
	taskId: string;
	join: () => Promise<ExecutionResult>;
	/** Makes SpawnHandle awaitable: `const result = await rt.spawn(...)` */
	then: <TResult1 = ExecutionResult, TResult2 = never>(
		onfulfilled?: ((value: ExecutionResult) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
	) => Promise<TResult1 | TResult2>;
}

function newUsage() {
	return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, contextTokens: 0, turns: 0 };
}

function writePromptToTempFile(name: string, prompt: string): { dir: string; filePath: string } {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-factory-prompt-"));
	const safeName = name.replace(/[^\w.-]+/g, "_");
	const filePath = path.join(tmpDir, `${safeName}.md`);
	fs.writeFileSync(filePath, prompt, { encoding: "utf-8", mode: 0o600 });
	return { dir: tmpDir, filePath };
}

export function extractFinalText(messages: Message[]): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		const msg = messages[i];
		if (msg.role !== "assistant") continue;
		const parts: string[] = [];
		for (const part of msg.content) {
			if (part.type === "text" && part.text.trim().length > 0) parts.push(part.text);
		}
		if (parts.length > 0) return parts.join("\n").trim();
	}
	return "";
}

export function spawnSubagent(input: SpawnInput): SpawnHandle {
	const promise = runSubagentProcess(input);
	const join = () => promise;
	return {
		taskId: input.taskId,
		join,
		then: (onfulfilled, onrejected) => promise.then(onfulfilled, onrejected),
	};
}

async function runSubagentProcess(input: SpawnInput): Promise<ExecutionResult> {
	input.obs.push(input.runId, "info", `spawn:${input.taskId}`, {
		agent: input.agent,
		model: input.modelId,
		tools: input.tools,
	});

	// Session file: write to sessionDir if provided, otherwise no session
	let sessionPath: string | undefined;
	// pi CLI requires --provider and --model as separate flags; "provider/model" as one --model value silently falls back to default
	const modelArgs: string[] = input.modelId.includes("/")
		? ["--provider", input.modelId.split("/")[0], "--model", input.modelId.split("/").slice(1).join("/")]
		: ["--model", input.modelId];
	const args: string[] = ["--mode", "json", "-p", ...modelArgs];
	if (input.sessionDir) {
		fs.mkdirSync(input.sessionDir, { recursive: true });
		sessionPath = path.join(input.sessionDir, `${input.taskId}.jsonl`);
		args.push("--session", sessionPath);
	} else {
		args.push("--no-session");
	}
	if (input.tools.length > 0) args.push("--tools", input.tools.join(","));

	let tmpDir: string | null = null;
	let tmpPromptPath: string | null = null;

	const result: ExecutionResult = {
		taskId: input.taskId,
		agent: input.agent,
		task: input.task,
		exitCode: -1,
		messages: [],
		stderr: "",
		usage: newUsage(),
		model: input.modelId,
		step: input.step,
		text: "",
		sessionPath: undefined, // populated after process exits and file confirmed
	};

	try {
		let prompt = input.systemPrompt.trim();
		if (input.parentSessionPath && fs.existsSync(input.parentSessionPath)) {
			prompt += `\n\nParent conversation session: ${input.parentSessionPath}\nUse search_thread to explore parent context if you need background on what led to this task.`;
		}
		if (prompt) {
			const temp = writePromptToTempFile(input.agent, prompt);
			tmpDir = temp.dir;
			tmpPromptPath = temp.filePath;
			args.push("--append-system-prompt", tmpPromptPath);
		}
		args.push(input.task);

		let aborted = false;
		const code = await new Promise<number>((resolve) => {
			const proc = spawn("pi", args, { cwd: input.cwd, stdio: ["ignore", "pipe", "pipe"], shell: false });
			let buffer = "";

			interface PiJsonLine {
				type?: string;
				message?: Message & { usage?: { input?: number; output?: number; cacheRead?: number; cacheWrite?: number; totalTokens?: number; cost?: { total?: number } } };
			}

			const processLine = (line: string) => {
				if (!line.trim()) return;
				let parsed: PiJsonLine;
				try {
					parsed = JSON.parse(line);
				} catch {
					return;
				}
				if (parsed.type === "message_end" && parsed.message) {
					const msg = parsed.message;
					result.messages.push(msg);
					if (msg.role === "assistant") {
						result.usage.turns += 1;
						const usage = msg.usage;
						if (usage) {
							result.usage.input += usage.input || 0;
							result.usage.output += usage.output || 0;
							result.usage.cacheRead += usage.cacheRead || 0;
							result.usage.cacheWrite += usage.cacheWrite || 0;
							result.usage.cost += usage.cost?.total || 0;
							result.usage.contextTokens = usage.totalTokens || 0;
						}
						if (msg.stopReason) result.stopReason = msg.stopReason;
						if (msg.errorMessage) result.errorMessage = msg.errorMessage;
						// Update text on every assistant message so progress shows output
						result.text = extractFinalText(result.messages);
					}
					input.onProgress?.({ ...result, messages: [...result.messages] });
				}
				if (parsed.type === "tool_result_end" && parsed.message) {
					result.messages.push(parsed.message);
					input.onProgress?.({ ...result, messages: [...result.messages] });
				}
			};

			proc.stdout.on("data", (chunk: Buffer) => {
				buffer += chunk.toString();
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";
				for (const line of lines) processLine(line);
			});
			proc.stderr.on("data", (chunk: Buffer) => {
				result.stderr += chunk.toString();
			});
			proc.on("close", (exitCode) => {
				if (killTimer) clearTimeout(killTimer);
				if (buffer.trim()) processLine(buffer);
				resolve(exitCode ?? 0);
			});
			proc.on("error", () => resolve(1));

			let killTimer: ReturnType<typeof setTimeout> | undefined;
			const kill = () => {
				aborted = true;
				proc.kill("SIGTERM");
				killTimer = setTimeout(() => {
					if (!proc.killed) proc.kill("SIGKILL");
				}, 3000);
			};
			if (input.signal?.aborted) kill();
			input.signal?.addEventListener("abort", kill, { once: true });
		});

		result.exitCode = code;
		result.text = extractFinalText(result.messages);
		if (sessionPath && fs.existsSync(sessionPath)) {
			result.sessionPath = sessionPath;
		}
		if (aborted) {
			throw new FactoryError({ code: "CANCELLED", message: "Subagent aborted.", recoverable: true });
		}
		return result;
	} finally {
		if (tmpPromptPath) try { fs.unlinkSync(tmpPromptPath); } catch {}
		if (tmpDir) try { fs.rmdirSync(tmpDir); } catch {}
	}
}

// ── Program runtime (spawn/join/parallel/sequence) ─────────────────────

export interface RuntimeSpawnInput {
	agent: string;
	systemPrompt: string;
	task: string;
	cwd: string;
	model: string;
	tools?: string[];
	step?: number;
	signal?: AbortSignal;
}

export interface ProgramRuntime {
	runId: string;
	spawn(input: RuntimeSpawnInput): SpawnHandle;
	join(handle: SpawnHandle): Promise<ExecutionResult>;
	join(handles: SpawnHandle[]): Promise<ExecutionResult[]>;
	parallel(label: string, inputs: RuntimeSpawnInput[]): Promise<ExecutionResult[]>;
	sequence(label: string, inputs: RuntimeSpawnInput[]): Promise<ExecutionResult[]>;
	shutdown(cancelRunning?: boolean): Promise<void>;
	workspace: { create(name?: string): string; cleanup(path: string): void };
	observe: {
		log(type: "info" | "warning" | "error", message: string, data?: Record<string, unknown>): void;
		artifact(relativePath: string, content: string): string | null;
	};
}

function validateModelSelector(model: string, agent: string): string {
	if (!model?.trim()) {
		throw new FactoryError({
			code: "INVALID_INPUT",
			message: `Spawn for '${agent}' requires a non-empty 'model'.`,
			recoverable: true,
		});
	}
	return model;
}

export function createProgramRuntime(
	ctx: ExtensionContext,
	runId: string,
	obs: ObservabilityStore,
	options?: {
		onTaskUpdate?: (result: ExecutionResult) => void;
		defaultSignal?: AbortSignal;
		parentSessionPath?: string;
		sessionDir?: string;
	},
): ProgramRuntime {
	let spawnCounter = 0;
	const runtimeAbort = new AbortController();
	const activeTasks = new Map<string, { controller: AbortController; promise: Promise<ExecutionResult> }>();

	function isSpawnHandle(value: unknown): value is SpawnHandle {
		return typeof value === "object" && value !== null && typeof (value as SpawnHandle).join === "function";
	}

	function joinInputError(received: unknown): FactoryError {
		const isLikelyExecutionResult =
			typeof received === "object" &&
			received !== null &&
			typeof (received as { taskId?: unknown }).taskId === "string" &&
			typeof (received as { text?: unknown }).text === "string";
		const hint = isLikelyExecutionResult
			? " It looks like you awaited rt.spawn() and passed an ExecutionResult to rt.join(). Use: const h = rt.spawn(...); const r = await rt.join(h)."
			: "";
		return new FactoryError({
			code: "INVALID_INPUT",
			message: `rt.join() expects a SpawnHandle or SpawnHandle[].${hint}`,
			recoverable: true,
		});
	}

	// Overloaded join — defined separately so TypeScript resolves the overloads
	function join(handle: SpawnHandle): Promise<ExecutionResult>;
	function join(handles: SpawnHandle[]): Promise<ExecutionResult[]>;
	function join(input: SpawnHandle | SpawnHandle[]): Promise<ExecutionResult | ExecutionResult[]> {
		if (Array.isArray(input)) {
			for (const handle of input) {
				if (!isSpawnHandle(handle)) throw joinInputError(handle);
			}
			return Promise.all(input.map(async (h) => {
				const result = await h.join();
				options?.onTaskUpdate?.(result);
				return result;
			}));
		}
		if (!isSpawnHandle(input)) throw joinInputError(input);
		return input.join().then((result) => {
			options?.onTaskUpdate?.(result);
			return result;
		});
	}

	const rt: ProgramRuntime = {
		runId,
		join,

		spawn({ agent, systemPrompt, task, cwd, model, tools, step, signal }) {
			if (!systemPrompt?.trim()) {
				throw new FactoryError({
					code: "INVALID_INPUT",
					message: `Spawn for '${agent}' requires non-empty systemPrompt.`,
					recoverable: true,
				});
			}

			const modelId = validateModelSelector(model, agent);

			spawnCounter += 1;
			const taskId = `task-${spawnCounter}`;
			const taskAbort = new AbortController();

			const relayAbort = () => taskAbort.abort();
			const boundSignals = [signal, options?.defaultSignal, runtimeAbort.signal].filter(
				(s): s is AbortSignal => Boolean(s),
			);
			for (const bound of boundSignals) {
				if (bound.aborted) taskAbort.abort();
				else bound.addEventListener("abort", relayAbort, { once: true });
			}

			const resolvedTools = tools ?? [];

			const handle = spawnSubagent({
				runId,
				taskId,
				agent,
				systemPrompt,
				task,
				cwd,
				modelId,
				tools: resolvedTools,
				step,
				signal: taskAbort.signal,
				obs,
				onProgress: (partial) => options?.onTaskUpdate?.(partial),
				parentSessionPath: options?.parentSessionPath,
				sessionDir: options?.sessionDir,
			});
			const taskPromise = handle.join().finally(() => {
				for (const bound of boundSignals) bound.removeEventListener("abort", relayAbort);
				activeTasks.delete(taskId);
			});
			activeTasks.set(taskId, { controller: taskAbort, promise: taskPromise });
			return {
				taskId,
				join: () => taskPromise,
				then: (onfulfilled?: any, onrejected?: any) => taskPromise.then(onfulfilled, onrejected),
			};
		},

		async parallel(label: string | RuntimeSpawnInput[], inputs?: RuntimeSpawnInput[]) {
			// Handle LLM calling parallel(inputs) without a label
			if (Array.isArray(label)) {
				inputs = label;
				label = "parallel";
			}
			if (!Array.isArray(inputs) || inputs.length === 0) {
				throw new FactoryError({ code: "INVALID_INPUT", message: `parallel('${label}'): inputs must be a non-empty array.`, recoverable: true });
			}
			obs.push(runId, "info", "parallel:start", { label, count: inputs.length });
			const handles = inputs.map((input, i) => {
				obs.push(runId, "info", "parallel:spawn", { label, index: i, step: input.step });
				return this.spawn(input);
			});
			const results = await Promise.all(handles.map(async (handle, i) => {
				const result = await handle.join();
				obs.push(runId, "info", "parallel:result", { label, index: i, taskId: result.taskId, exitCode: result.exitCode });
				return result;
			}));
			obs.push(runId, "info", "parallel:done", { label, count: results.length, success: results.filter((r) => r.exitCode === 0).length });
			return results;
		},

		async sequence(label: string | RuntimeSpawnInput[], inputs?: RuntimeSpawnInput[]) {
			// Handle LLM calling sequence(inputs) without a label
			if (Array.isArray(label)) {
				inputs = label;
				label = "sequence";
			}
			if (!Array.isArray(inputs) || inputs.length === 0) {
				throw new FactoryError({ code: "INVALID_INPUT", message: `sequence('${label}'): inputs must be a non-empty array.`, recoverable: true });
			}
			obs.push(runId, "info", "sequence:start", { label, count: inputs.length });
			const results: ExecutionResult[] = [];
			for (let i = 0; i < inputs.length; i++) {
				obs.push(runId, "info", "sequence:spawn", { label, index: i, step: inputs[i].step });
				const handle = this.spawn(inputs[i]);
				const result = await join(handle);
				obs.push(runId, "info", "sequence:result", { label, index: i, taskId: result.taskId, exitCode: result.exitCode });
				results.push(result);
			}
			obs.push(runId, "info", "sequence:done", { label, count: results.length, success: results.filter((r) => r.exitCode === 0).length });
			return results;
		},

		async shutdown(cancelRunning = true) {
			if (cancelRunning) {
				runtimeAbort.abort();
				for (const { controller } of activeTasks.values()) controller.abort();
			}
			const pending = Array.from(activeTasks.values()).map(({ promise }) => promise);
			if (pending.length > 0) await Promise.allSettled(pending);
			obs.push(runId, "info", "runtime:shutdown", { cancelRunning, pending: pending.length });
		},

		workspace: {
			create(name = "workspace") {
				const dir = fs.mkdtempSync(path.join(os.tmpdir(), `pi-factory-${name}-`));
				obs.push(runId, "info", "workspace:create", { path: dir });
				return dir;
			},
			cleanup(p: string) {
				try {
					fs.rmSync(p, { recursive: true, force: true });
					obs.push(runId, "info", "workspace:cleanup", { path: p });
				} catch (e) {
					obs.push(runId, "warning", "workspace:cleanup_failed", { path: p, error: String(e) });
				}
			},
		},

		observe: {
			log(type, message, data) { obs.push(runId, type, message, data); },
			artifact(relativePath, content) { return obs.writeArtifact(runId, relativePath, content); },
		},
	};

	return rt;
}

// ── Program module loader ──────────────────────────────────────────────

export async function loadProgramModule(code: string): Promise<{ run: (input: any, rt: ProgramRuntime) => Promise<any>; modulePath: string }> {
	if (!code.trim()) {
		throw new FactoryError({ code: "INVALID_INPUT", message: "Program code is empty.", recoverable: true });
	}

	const wrapped = code.includes("export") ? code : `export default async function(input, rt) {\n${code}\n}`;
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-factory-program-"));
	const modulePath = path.join(tmpDir, "program.ts");
	fs.writeFileSync(modulePath, wrapped, "utf-8");

	const mod: Record<string, unknown> = await import(pathToFileURL(modulePath).toString());
	const run = (typeof mod.run === "function" ? mod.run : mod.default) as
		((input: unknown, rt: ProgramRuntime) => Promise<unknown>) | undefined;
	if (typeof run !== "function") {
		throw new FactoryError({
			code: "RUNTIME",
			message: "Program code must export async run(input, rt) or default async function(input, rt).",
			recoverable: true,
		});
	}
	return { run, modulePath };
}
