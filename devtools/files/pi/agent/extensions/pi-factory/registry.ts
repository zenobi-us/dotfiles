import type { RunSummary } from "./types.js";
import type { ErrorDetails } from "./errors.js";

export type RunStatus = "running" | "done" | "failed" | "cancelled";

export interface RunRecord {
	runId: string;
	status: RunStatus;
	summary: RunSummary;
	promise?: Promise<RunSummary>;
	abort?: AbortController;
	startedAt: number;
	completedAt?: number;
	acknowledged?: boolean;
	/** Metadata stored at registration time (before results arrive). */
	task?: string;
}

export class RunRegistry {
	private runs = new Map<string, RunRecord>();

	register(runId: string, summary: RunSummary, promise: Promise<RunSummary>, abort: AbortController, meta?: { task?: string }): RunRecord {
		const record: RunRecord = {
			runId,
			status: "running",
			summary,
			promise,
			abort,
			startedAt: Date.now(),
			task: meta?.task,
		};

		this.runs.set(runId, record);

		return record;
	}

	get(runId: string): RunRecord | undefined {
		return this.runs.get(runId);
	}

	getActive(): RunRecord[] {
		return [...this.runs.values()].filter((r) => r.status === "running");
	}

	getAll(): RunRecord[] {
		return [...this.runs.values()];
	}

	updateSummary(runId: string, summary: RunSummary): void {
		const record = this.runs.get(runId);
		if (!record || record.status !== "running") return;
		record.summary = { ...summary, status: "running" };
	}

	complete(runId: string, summary: RunSummary): void {
		const record = this.runs.get(runId);
		if (!record) return;
		record.summary = summary;
		record.status = summary.status === "running" ? "done" : summary.status;
		record.completedAt = Date.now();
	}

	fail(runId: string, error: ErrorDetails): void {
		const record = this.runs.get(runId);
		if (!record) return;
		record.status = "failed";
		record.summary.status = "failed";
		record.summary.error = error;
		record.completedAt = Date.now();
	}

	cancel(runId: string): void {
		const record = this.runs.get(runId);
		if (!record) return;
		record.status = "cancelled";
		record.summary.status = "cancelled";
		record.completedAt = Date.now();
		record.abort?.abort();
	}

	acknowledge(runId: string): void {
		const record = this.runs.get(runId);
		if (record) record.acknowledged = true;
	}

	getVisible(): RunRecord[] {
		return [...this.runs.values()].filter((r) => r.status === "running" || !r.acknowledged);
	}

	loadHistorical(record: Omit<RunRecord, 'promise' | 'abort'>): void {
		this.runs.set(record.runId, record as RunRecord);
	}

	clear(): void {
		this.runs.clear();
	}

	/** Clear only non-active runs (historical/completed), preserving running ones. */
	clearHistorical(): void {
		for (const [id, record] of this.runs) {
			if (record.status !== "running") {
				this.runs.delete(id);
			}
		}
	}
}
