import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export type RunStatus = "queued" | "running" | "done" | "failed" | "cancelled";

export interface RunEvent {
	time: number;
	type: "status" | "info" | "warning" | "error" | "artifact";
	message: string;
	data?: Record<string, unknown>;
}

export interface RunRecord {
	runId: string;
	status: RunStatus;
	startedAt: number;
	endedAt?: number;
	events: RunEvent[];
	artifactsDir?: string;
	artifacts: string[];
}

export class ObservabilityStore {
	private readonly runs = new Map<string, RunRecord>();

	createRun(runId: string, withArtifacts: boolean, sessionDir?: string): RunRecord {
		const record: RunRecord = {
			runId,
			status: "queued",
			startedAt: Date.now(),
			events: [],
			artifacts: [],
		};
		if (withArtifacts) {
			const base = sessionDir
				? path.join(sessionDir, ".factory", runId)
				: fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagent-observe-"));
			fs.mkdirSync(base, { recursive: true });
			record.artifactsDir = base;
		}
		this.runs.set(runId, record);
		return record;
	}

	get(runId: string): RunRecord | undefined {
		return this.runs.get(runId);
	}

	setStatus(runId: string, status: RunStatus, message?: string): void {
		const run = this.runs.get(runId);
		if (!run) return;
		run.status = status;
		if (status === "done" || status === "failed" || status === "cancelled") run.endedAt = Date.now();
		if (message) this.push(runId, "status", message, { status });
	}

	push(runId: string, type: RunEvent["type"], message: string, data?: Record<string, unknown>): void {
		const run = this.runs.get(runId);
		if (!run) return;
		run.events.push({ time: Date.now(), type, message, data });
	}

	writeArtifact(runId: string, relativePath: string, content: string): string | null {
		const run = this.runs.get(runId);
		if (!run || !run.artifactsDir) return null;
		const fullPath = path.join(run.artifactsDir, relativePath);
		fs.mkdirSync(path.dirname(fullPath), { recursive: true });
		fs.writeFileSync(fullPath, content, "utf-8");
		run.artifacts.push(fullPath);
		this.push(runId, "artifact", `artifact:${relativePath}`, { path: fullPath });
		return fullPath;
	}

	toSummary(runId: string): Pick<RunRecord, "runId" | "status" | "startedAt" | "endedAt" | "events" | "artifacts" | "artifactsDir"> | null {
		const run = this.runs.get(runId);
		if (!run) return null;
		return {
			runId: run.runId,
			status: run.status,
			startedAt: run.startedAt,
			endedAt: run.endedAt,
			events: run.events,
			artifacts: run.artifacts,
			artifactsDir: run.artifactsDir,
		};
	}
}
