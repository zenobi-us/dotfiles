import type { ExecutionState, WorkflowSpec } from "./types.js";
export interface IncompleteRun {
    runId: string;
    runDir: string;
    state: ExecutionState;
    completedSteps: string[];
    failedStep?: string;
    updatedAt?: string;
}
/**
 * Find the most recent incomplete run for a workflow.
 *
 * Scans .workflows/runs/<name>/runs/ for state.json files
 * with status "running" or "failed". Returns the most recent one
 * (by directory name, which encodes timestamp).
 *
 * Returns null if no incomplete runs exist.
 */
export declare function findIncompleteRun(cwd: string, workflowName: string): IncompleteRun | null;
/**
 * Validate that a saved state is compatible with the current workflow spec.
 *
 * Checks:
 * 1. Spec version matches (if both specify one)
 * 2. All completed steps still exist in the spec
 *
 * Returns null if compatible, or a string describing the incompatibility.
 */
export declare function validateResumeCompatibility(state: ExecutionState, spec: WorkflowSpec): string | null;
/**
 * Determine which steps need to run when resuming.
 *
 * Given the execution plan (layers of step names) and the set of
 * already-completed steps, returns the layer index to resume from
 * and which steps within that layer still need to run.
 *
 * For a partially-complete parallel layer (some steps done, some not),
 * returns only the incomplete steps from that layer.
 */
export declare function computeResumePoint(plan: Array<{
    steps: string[];
}>, completedSteps: Set<string>): {
    resumeLayerIndex: number;
    pendingStepsInLayer: string[];
} | null;
/**
 * Format a human-readable summary of an incomplete run for display.
 */
export declare function formatIncompleteRun(run: IncompleteRun, spec: WorkflowSpec): string;
//# sourceMappingURL=checkpoint.d.ts.map