import { SessionManager } from "@earendil-works/pi-coding-agent";
import {
	appendFileSync,
	copyFileSync,
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { dirname, join } from "node:path";

export interface SessionEntry {
	type: string;
	id: string;
	parentId?: string;
	[key: string]: unknown;
}

export interface MessageEntry extends SessionEntry {
	type: "message";
	message: {
		role: "user" | "assistant" | "toolResult";
		content: Array<{ type: string; text?: string; [key: string]: unknown }>;
	};
}

export type SeededSubagentSessionMode = "lineage-only" | "fork";

export interface WorktreeSessionFork {
	sessionFile: string;
	sourceSessionFile: string;
	handoffMessage: string;
}

function getForkContentLines(parentSessionFile: string): string[] {
	const raw = readFileSync(parentSessionFile, "utf8");
	const lines = raw.split("\n").filter((line) => line.trim());

	let truncateAt = lines.length;
	for (let i = lines.length - 1; i >= 0; i--) {
		try {
			const entry = JSON.parse(lines[i]);
			if (entry.type === "message" && entry.message?.role === "user") {
				truncateAt = i;
				break;
			}
		} catch {
			// ignore malformed lines
		}
	}

	return lines.slice(0, truncateAt).filter((line) => {
		try {
			return JSON.parse(line).type !== "session";
		} catch {
			return true;
		}
	});
}

export function createBtwSessionSnapshot(
	parentSessionFile: string,
	leafId: string,
): string {
	const detached = SessionManager.open(parentSessionFile);
	const childSessionFile = detached.createBranchedSession(leafId);
	if (!childSessionFile || !existsSync(childSessionFile)) {
		throw new Error("Pi did not persist the BTW child session");
	}
	return childSessionFile;
}

export function seedSubagentSessionFile(params: {
	mode: SeededSubagentSessionMode;
	parentSessionFile: string;
	childSessionFile: string;
	childCwd: string;
}): void {
	const header = {
		type: "session",
		version: 3,
		id: randomUUID(),
		timestamp: new Date().toISOString(),
		cwd: params.childCwd,
		parentSession: params.parentSessionFile,
	};
	const contentLines =
		params.mode === "fork" ? getForkContentLines(params.parentSessionFile) : [];
	const lines = [JSON.stringify(header), ...contentLines];

	mkdirSync(dirname(params.childSessionFile), { recursive: true });
	writeFileSync(params.childSessionFile, lines.join("\n") + "\n", "utf8");
}

/**
 * Copy only the active Pi branch into a session rooted at another cwd.
 * Pi's native branched-session writer supplies compaction and label fidelity;
 * the temporary source-directory file is rewritten with the target cwd.
 */
export function createWorktreeSessionFork(params: {
	parentSessionFile: string;
	leafId: string;
	childSessionFile: string;
	childCwd: string;
	handoffMessage: string;
}): WorktreeSessionFork {
	const source = SessionManager.open(params.parentSessionFile);
	const temporaryFile = source.createBranchedSession(params.leafId);
	if (!temporaryFile || !existsSync(temporaryFile)) {
		throw new Error("Pi did not persist the worktree session fork");
	}

	try {
		const lines = readFileSync(temporaryFile, "utf8")
			.split("\n")
			.filter((line) => line.trim());
		const header = JSON.parse(lines[0]) as Record<string, unknown>;
		header.cwd = params.childCwd;
		header.parentSession = params.parentSessionFile;
		mkdirSync(dirname(params.childSessionFile), { recursive: true });
		writeFileSync(
			params.childSessionFile,
			[JSON.stringify(header), ...lines.slice(1)].join("\n") + "\n",
			"utf8",
		);
	} finally {
		rmSync(temporaryFile, { force: true });
	}

	SessionManager.open(params.childSessionFile).appendCustomMessageEntry(
		"pi-herdr-worktree-handoff",
		params.handoffMessage,
		true,
		{
			sourceSessionFile: params.parentSessionFile,
			childCwd: params.childCwd,
		},
	);
	return {
		sessionFile: params.childSessionFile,
		sourceSessionFile: params.parentSessionFile,
		handoffMessage: params.handoffMessage,
	};
}

function parseEntry(line: string): SessionEntry {
	try {
		return JSON.parse(line) as SessionEntry;
	} catch (error) {
		throw new Error(
			`Invalid session entry: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

function readEntries(sessionFile: string): SessionEntry[] {
	return readFileSync(sessionFile, "utf8")
		.split("\n")
		.filter((line) => line.trim())
		.map(parseEntry);
}

/**
 * Return the id of the last entry in the session file (current branch point / leaf).
 */
export function getLeafId(sessionFile: string): string | null {
	const entries = readEntries(sessionFile);
	return entries.length > 0 ? entries[entries.length - 1].id : null;
}

/**
 * Return entries added after `afterLine` (1-indexed count of existing entries).
 */
export function getNewEntries(
	sessionFile: string,
	afterLine: number,
): SessionEntry[] {
	return readFileSync(sessionFile, "utf8")
		.split("\n")
		.filter((line) => line.trim())
		.slice(afterLine)
		.map(parseEntry);
}

/**
 * Find the last assistant message text in a list of entries.
 *
 * Falls back to the `errorMessage` field when the last assistant message has
 * `stopReason: "error"` and no usable text content — this happens when
 * auto-retry exhausts on a provider overload / rate limit / server error, and
 * without this fallback the parent would silently see a stale earlier message.
 */
export interface ObservedSessionRuntime {
	provider?: string;
	modelId?: string;
	thinking?: string;
}

/** Read the effective model and thinking entries recorded by Pi at session startup. */
export function findObservedSessionRuntime(
	entries: SessionEntry[],
): ObservedSessionRuntime {
	const observed: ObservedSessionRuntime = {};
	for (const entry of entries) {
		if (entry.type === "model_change") {
			if (typeof entry.provider === "string")
				observed.provider = entry.provider;
			if (typeof entry.modelId === "string") observed.modelId = entry.modelId;
		} else if (
			entry.type === "thinking_level_change" &&
			typeof entry.thinkingLevel === "string"
		) {
			observed.thinking = entry.thinkingLevel;
		}
	}
	return observed;
}

export interface FinalAssistantMessage {
	text: string | null;
	contentLength: number;
	stopReason?: string;
}

/** Inspect only the final assistant message for workflow completion evidence. */
export function inspectFinalAssistantMessage(
	entries: SessionEntry[],
): FinalAssistantMessage {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.type !== "message") continue;
		const msg = entry as MessageEntry;
		if (msg.message.role !== "assistant") continue;

		const texts = msg.message.content
			.filter(
				(block) => block.type === "text" && typeof block.text === "string",
			)
			.map((block) => block.text as string);
		const text = texts.join("\n");
		const stopReason = (msg.message as { stopReason?: unknown }).stopReason;
		return {
			text: text.trim() ? text : null,
			contentLength: text.length,
			...(typeof stopReason === "string" ? { stopReason } : {}),
		};
	}
	return { text: null, contentLength: 0 };
}

export function findLastAssistantMessage(
	entries: SessionEntry[],
): string | null {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.type !== "message") continue;
		const msg = entry as MessageEntry;
		if (msg.message.role !== "assistant") continue;

		const texts = msg.message.content
			.filter(
				(block) =>
					block.type === "text" &&
					typeof block.text === "string" &&
					block.text.trim() !== "",
			)
			.map((block) => block.text as string);

		if (texts.length > 0 && texts.join("").trim()) return texts.join("\n");

		const stopReason = (msg.message as { stopReason?: unknown }).stopReason;
		const errorMessage = (msg.message as { errorMessage?: unknown })
			.errorMessage;
		if (
			stopReason === "error" &&
			typeof errorMessage === "string" &&
			errorMessage.trim() !== ""
		) {
			return `Subagent error: ${errorMessage.trim()}`;
		}
	}
	return null;
}

/**
 * Append a branch_summary entry to the session file.
 * Returns the new entry's id.
 */
export function appendBranchSummary(
	sessionFile: string,
	branchPointId: string,
	fromId: string | null,
	summary: string,
): string {
	const id = randomBytes(4).toString("hex");
	const entry = {
		type: "branch_summary",
		id,
		parentId: branchPointId,
		timestamp: new Date().toISOString(),
		fromId: fromId ?? branchPointId,
		summary,
	};
	appendFileSync(sessionFile, JSON.stringify(entry) + "\n", "utf8");
	return id;
}

/**
 * Copy the session file to destDir for parallel worker isolation.
 * Returns the path of the copy.
 */
export function copySessionFile(sessionFile: string, destDir: string): string {
	const id = randomBytes(4).toString("hex");
	const dest = join(destDir, `subagent-${id}.jsonl`);
	copyFileSync(sessionFile, dest);
	return dest;
}

/**
 * Read new entries from sourceFile (after afterLine), append them to targetFile.
 * Returns the appended entries.
 */
export function mergeNewEntries(
	sourceFile: string,
	targetFile: string,
	afterLine: number,
): SessionEntry[] {
	const entries = getNewEntries(sourceFile, afterLine);
	for (const entry of entries) {
		appendFileSync(targetFile, JSON.stringify(entry) + "\n", "utf8");
	}
	return entries;
}
