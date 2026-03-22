import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { formatCost, formatDuration } from "./format.js";
import { WORKFLOWS_DIR } from "./workflows-dir.js";
/**
 * Generate a unique run ID.
 * Format: <workflow-name>-<yyyymmdd>-<hhmmss>-<4 hex chars>
 * Example: "bugfix-20260312-214041-a3f2"
 */
export function generateRunId(workflowName) {
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    const dd = now.getDate().toString().padStart(2, "0");
    const hh = now.getHours().toString().padStart(2, "0");
    const min = now.getMinutes().toString().padStart(2, "0");
    const ss = now.getSeconds().toString().padStart(2, "0");
    const hex = crypto.randomBytes(2).toString("hex");
    return `${workflowName}-${yyyy}${mm}${dd}-${hh}${min}${ss}-${hex}`;
}
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
export function initRunDir(cwd, workflowName, runId) {
    const runDir = path.join(cwd, WORKFLOWS_DIR, "runs", workflowName, "runs", runId);
    fs.mkdirSync(path.join(runDir, "sessions"), { recursive: true });
    fs.mkdirSync(path.join(runDir, "outputs"), { recursive: true });
    return runDir;
}
/**
 * Get the workflow output directory (parent of runs/).
 * This is where artifacts are written.
 *
 * @param cwd - project root
 * @param workflowName - name of the workflow
 * @returns absolute path to .workflows/runs/<workflowName>/
 */
export function getWorkflowDir(cwd, workflowName) {
    return path.join(cwd, WORKFLOWS_DIR, "runs", workflowName);
}
/**
 * Write execution state to state.json in the run directory.
 * Overwrites on each call (not append).
 * Uses atomic write: write to .state.json.tmp, then fs.renameSync to state.json.
 */
export function writeState(runDir, state) {
    state.updatedAt = new Date().toISOString();
    const tmpPath = path.join(runDir, ".state.json.tmp");
    const finalPath = path.join(runDir, "state.json");
    try {
        fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), "utf-8");
        fs.renameSync(tmpPath, finalPath);
    }
    catch (err) {
        // Best-effort cleanup of partial tmp file
        try {
            fs.unlinkSync(tmpPath);
        }
        catch {
            /* ignore cleanup failure */
        }
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to write workflow state to ${finalPath} (status: ${state.status}): ${msg}`);
    }
}
/**
 * Read execution state from state.json.
 * Returns null if file doesn't exist.
 */
export function readState(runDir) {
    const statePath = path.join(runDir, "state.json");
    try {
        const content = fs.readFileSync(statePath, "utf-8");
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Write a step's structured output to outputs/<stepName>.json.
 */
export function writeStepOutput(runDir, stepName, output) {
    const outputPath = path.join(runDir, "outputs", `${stepName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
}
/**
 * Write aggregated metrics to metrics.json.
 */
export function writeMetrics(runDir, steps) {
    const total = aggregateUsage(steps);
    const totalDurationMs = Object.values(steps).reduce((sum, s) => sum + s.durationMs, 0);
    const metrics = {
        totalUsage: total,
        totalDurationMs,
        steps: Object.fromEntries(Object.entries(steps).map(([name, s]) => [name, { usage: s.usage, durationMs: s.durationMs }])),
    };
    try {
        fs.writeFileSync(path.join(runDir, "metrics.json"), JSON.stringify(metrics, null, 2), "utf-8");
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`[pi-workflows] Warning: failed to write metrics to ${runDir}/metrics.json: ${msg}\n`);
    }
}
/**
 * Aggregate usage across all steps.
 */
export function aggregateUsage(steps) {
    const total = {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        cost: 0,
        turns: 0,
    };
    for (const step of Object.values(steps)) {
        if (step.usage) {
            total.input += step.usage.input;
            total.output += step.usage.output;
            total.cacheRead += step.usage.cacheRead;
            total.cacheWrite += step.usage.cacheWrite;
            total.cost += step.usage.cost;
            total.turns += step.usage.turns;
        }
    }
    return total;
}
/**
 * Build a WorkflowResult from execution state.
 * Aggregates usage across steps, computes total duration,
 * sets output to the last completed step's output (or explicit workflow output if defined).
 */
export function buildResult(spec, runId, runDir, state, status) {
    const totalUsage = aggregateUsage(state.steps);
    const totalDurationMs = Object.values(state.steps).reduce((sum, s) => sum + s.durationMs, 0);
    // Determine output: last completed step's output
    let output;
    const stepNames = Object.keys(spec.steps);
    for (let i = stepNames.length - 1; i >= 0; i--) {
        const stepName = stepNames[i];
        const stepResult = state.steps[stepName];
        if (stepResult && stepResult.status === "completed") {
            output = stepResult.output ?? stepResult.textOutput;
            break;
        }
    }
    return {
        workflow: spec.name,
        runId,
        status,
        steps: state.steps,
        output,
        totalUsage,
        totalDurationMs,
        runDir,
    };
}
/**
 * Format a WorkflowResult as human-readable text for injection into the conversation.
 */
export function formatResult(result) {
    const stepEntries = Object.values(result.steps);
    const totalSteps = stepEntries.length;
    const completedSteps = stepEntries.filter((s) => s.status === "completed").length;
    const duration = formatDuration(result.totalDurationMs);
    const cost = formatCost(result.totalUsage.cost);
    const lines = [];
    if (result.status === "completed") {
        lines.push(`Workflow '${result.workflow}' completed (${totalSteps} steps, ${duration}, ${cost})`);
    }
    else if (result.status === "paused") {
        lines.push(`Workflow '${result.workflow}' paused (${completedSteps}/${totalSteps} steps completed, ${duration}, ${cost})`);
    }
    else {
        // Find the failed step name
        const failedStep = stepEntries.find((s) => s.status === "failed");
        const failedName = failedStep ? failedStep.step : "unknown";
        lines.push(`Workflow '${result.workflow}' failed at step '${failedName}' (${completedSteps}/${totalSteps} steps, ${duration}, ${cost})`);
    }
    lines.push("");
    lines.push("Steps:");
    for (const step of stepEntries) {
        const stepDuration = formatDuration(step.durationMs);
        const stepCost = formatCost(step.usage.cost);
        if (step.status === "completed") {
            lines.push(`  \u2713 ${step.step}  ${stepDuration}  ${stepCost}  (${step.usage.turns} turns)`);
        }
        else if (step.status === "failed") {
            const errorPreview = step.error || "Unknown error";
            lines.push(`  \u2717 ${step.step}  ${stepDuration}  ${stepCost}  ${errorPreview}`);
        }
        else {
            // skipped
            lines.push(`  \u00b7 ${step.step}`);
        }
    }
    if (result.status === "completed") {
        lines.push("");
        lines.push(`Total: ${result.totalUsage.input} input + ${result.totalUsage.output} output tokens, ${cost}`);
    }
    if (result.artifacts && Object.keys(result.artifacts).length > 0) {
        lines.push("");
        lines.push("Artifacts:");
        for (const [name, artifactPath] of Object.entries(result.artifacts)) {
            lines.push(`  ${name} \u2192 ${artifactPath}`);
        }
    }
    lines.push("");
    lines.push(`Session logs: ${result.runDir}/sessions/`);
    return lines.join("\n");
}
//# sourceMappingURL=state.js.map