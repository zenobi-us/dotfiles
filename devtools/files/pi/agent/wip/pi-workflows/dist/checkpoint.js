/**
 * Checkpoint and resume logic for workflow runs.
 *
 * Finds incomplete runs, validates they match the current spec,
 * and provides state needed to resume execution.
 */
import fs from "node:fs";
import path from "node:path";
import { readState } from "./state.js";
import { WORKFLOWS_DIR } from "./workflows-dir.js";
/**
 * Find the most recent incomplete run for a workflow.
 *
 * Scans .workflows/runs/<name>/runs/ for state.json files
 * with status "running" or "failed". Returns the most recent one
 * (by directory name, which encodes timestamp).
 *
 * Returns null if no incomplete runs exist.
 */
export function findIncompleteRun(cwd, workflowName) {
    const runsDir = path.join(cwd, WORKFLOWS_DIR, "runs", workflowName, "runs");
    if (!fs.existsSync(runsDir))
        return null;
    const entries = fs
        .readdirSync(runsDir)
        .filter((e) => {
        const stat = fs.statSync(path.join(runsDir, e));
        return stat.isDirectory();
    })
        .sort() // lexicographic — timestamp-based IDs sort chronologically
        .reverse(); // most recent first
    for (const runId of entries) {
        const runDir = path.join(runsDir, runId);
        const state = readState(runDir);
        if (!state)
            continue;
        if (state.status === "running" || state.status === "failed" || state.status === "paused") {
            const completedSteps = Object.entries(state.steps)
                .filter(([, r]) => r.status === "completed" || r.status === "skipped")
                .map(([name]) => name);
            const failedStep = Object.entries(state.steps).find(([, r]) => r.status === "failed")?.[0];
            return {
                runId,
                runDir,
                state,
                completedSteps,
                failedStep,
                updatedAt: state.updatedAt,
            };
        }
    }
    return null;
}
/**
 * Validate that a saved state is compatible with the current workflow spec.
 *
 * Checks:
 * 1. Spec version matches (if both specify one)
 * 2. All completed steps still exist in the spec
 *
 * Returns null if compatible, or a string describing the incompatibility.
 */
export function validateResumeCompatibility(state, spec) {
    // Check version match
    if (state.specVersion && spec.version && state.specVersion !== spec.version) {
        return `Spec version changed: run has '${state.specVersion}', current is '${spec.version}'`;
    }
    // Check all completed steps still exist in spec
    const specStepNames = new Set(Object.keys(spec.steps));
    for (const stepName of Object.keys(state.steps)) {
        if (!specStepNames.has(stepName)) {
            return `Step '${stepName}' was completed in the saved run but no longer exists in the workflow spec`;
        }
    }
    return null; // compatible
}
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
export function computeResumePoint(plan, completedSteps) {
    for (let i = 0; i < plan.length; i++) {
        const layer = plan[i];
        const pending = layer.steps.filter((s) => !completedSteps.has(s));
        if (pending.length > 0) {
            return { resumeLayerIndex: i, pendingStepsInLayer: pending };
        }
    }
    // All steps completed — nothing to resume
    return null;
}
/**
 * Format a human-readable summary of an incomplete run for display.
 */
export function formatIncompleteRun(run, spec) {
    const totalSteps = Object.keys(spec.steps).length;
    const completed = run.completedSteps.length;
    const status = run.state.status === "paused" ? "paused" : run.state.status === "running" ? "interrupted" : "failed";
    const failedInfo = run.failedStep ? ` at step '${run.failedStep}'` : "";
    const timeInfo = run.updatedAt ? ` (last updated: ${run.updatedAt})` : "";
    return `Found ${status} run${failedInfo}: ${completed}/${totalSteps} steps completed${timeInfo}. Run ID: ${run.runId}`;
}
//# sourceMappingURL=checkpoint.js.map