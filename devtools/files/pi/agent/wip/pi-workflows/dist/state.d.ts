import type { ExecutionState, StepResult, StepUsage, WorkflowResult, WorkflowSpec } from "./types.js";
/**
 * Generate a unique run ID.
 * Format: <workflow-name>-<yyyymmdd>-<hhmmss>-<4 hex chars>
 * Example: "bugfix-20260312-214041-a3f2"
 */
export declare function generateRunId(workflowName: string): string;
/**
 * Initialize the run directory structure.
 * Creates:
 *   .workflows/runs/<workflowName>/runs/<runId>/
 *   .workflows/runs/<workflowName>/runs/<runId>/sessions/
 *   .workflows/runs/<workflowName>/runs/<runId>/outputs/
 *
 * Each workflow owns a directory under .workflows/runs/<name>/.
 * Run state goes in runs/<runId>/; artifacts live at the workflow level.
 *
 * @param cwd - project root
 * @param workflowName - name of the workflow
 * @param runId - unique run identifier
 * @returns absolute path to the run directory
 */
export declare function initRunDir(cwd: string, workflowName: string, runId: string): string;
/**
 * Get the workflow output directory (parent of runs/).
 * This is where artifacts are written.
 *
 * @param cwd - project root
 * @param workflowName - name of the workflow
 * @returns absolute path to .workflows/runs/<workflowName>/
 */
export declare function getWorkflowDir(cwd: string, workflowName: string): string;
/**
 * Write execution state to state.json in the run directory.
 * Overwrites on each call (not append).
 * Uses atomic write: write to .state.json.tmp, then fs.renameSync to state.json.
 */
export declare function writeState(runDir: string, state: ExecutionState): void;
/**
 * Read execution state from state.json.
 * Returns null if file doesn't exist.
 */
export declare function readState(runDir: string): ExecutionState | null;
/**
 * Write a step's structured output to outputs/<stepName>.json.
 */
export declare function writeStepOutput(runDir: string, stepName: string, output: unknown): void;
/**
 * Write aggregated metrics to metrics.json.
 */
export declare function writeMetrics(runDir: string, steps: Record<string, StepResult>): void;
/**
 * Aggregate usage across all steps.
 */
export declare function aggregateUsage(steps: Record<string, StepResult>): StepUsage;
/**
 * Build a WorkflowResult from execution state.
 * Aggregates usage across steps, computes total duration,
 * sets output to the last completed step's output (or explicit workflow output if defined).
 */
export declare function buildResult(spec: WorkflowSpec, runId: string, runDir: string, state: ExecutionState, status: "completed" | "failed" | "paused"): WorkflowResult;
/**
 * Format a WorkflowResult as human-readable text for injection into the conversation.
 */
export declare function formatResult(result: WorkflowResult): string;
//# sourceMappingURL=state.d.ts.map