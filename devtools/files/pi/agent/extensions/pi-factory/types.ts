import type { Message } from "@mariozechner/pi-ai";
import type { ErrorDetails } from "./errors.js";

export interface UsageStats {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	cost: number;
	contextTokens: number;
	turns: number;
}

export interface ExecutionResult {
	taskId: string;
	agent: string;
	task: string;
	exitCode: number;
	messages: Message[];
	stderr: string;
	usage: UsageStats;
	model?: string;
	stopReason?: string;
	errorMessage?: string;
	step?: number;
	/** Final assistant text output, auto-populated on completion. */
	text: string;
	/** Path to the subagent's session .jsonl file. Use search_thread to explore. */
	sessionPath?: string;
}

export interface RunSummary {
	runId: string;
	status: "running" | "done" | "failed" | "cancelled";
	results: ExecutionResult[];
	observability?: {
		status: string;
		events: Array<{ time: number; type: string; message: string; data?: Record<string, unknown> }>;
		artifacts: string[];
		artifactsDir?: string;
		startedAt: number;
		endedAt?: number;
	} | null;
	error?: ErrorDetails;
	metadata?: Record<string, unknown>;
}
