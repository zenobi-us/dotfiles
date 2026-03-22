/**
 * Shared helpers for step executors — constants, usage aggregation,
 * prompt building, schema resolution, state persistence, and template resolution.
 */
import path from "node:path";
import { writeState } from "./state.js";
import { renderTemplate, renderTemplateFile } from "./template.js";
import { createProgressWidget } from "./tui.js";
/** Grace period (ms) between SIGTERM and SIGKILL when killing subprocesses. */
export const SIGKILL_GRACE_MS = 3000;
/** Widget ID used for the workflow progress widget. */
export const WIDGET_ID = "workflow-progress";
/** Default max loop attempts when not specified. */
export const DEFAULT_MAX_ATTEMPTS = 3;
/**
 * Helper that returns a StepUsage with all zeroes.
 */
export function zeroUsage() {
    return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 };
}
/**
 * Add step usage into a running total (mutates `total`).
 */
export function addUsage(total, step) {
    total.input += step.input;
    total.output += step.output;
    total.cacheRead += step.cacheRead;
    total.cacheWrite += step.cacheWrite;
    total.cost += step.cost;
    total.turns += step.turns;
}
/**
 * Resolve a schema path relative to the workflow spec file.
 * If the schema path is absolute, return as-is.
 * If relative, resolve against the directory containing the workflow spec.
 */
export function resolveSchemaPath(schemaPath, specFilePath) {
    if (path.isAbsolute(schemaPath))
        return schemaPath;
    return path.resolve(path.dirname(specFilePath), schemaPath);
}
/**
 * Build the prompt string sent to the subprocess.
 *
 * The prompt includes:
 * 1. The compiled task template (if set), or the resolved input as context
 * 2. Output instructions (if schema-bound)
 */
export function buildPrompt(step, agentSpec, resolvedInput, runDir, stepName) {
    const parts = [];
    // Task template was compiled by compileAgentSpec — use it
    if (agentSpec.taskTemplate) {
        parts.push(agentSpec.taskTemplate);
    }
    else if (resolvedInput && typeof resolvedInput === "object" && Object.keys(resolvedInput).length > 0) {
        // No task template — serialize input as JSON
        parts.push("## Input\n");
        parts.push("```json");
        parts.push(JSON.stringify(resolvedInput, null, 2));
        parts.push("```\n");
    }
    else if (typeof resolvedInput === "string") {
        parts.push(resolvedInput);
    }
    // Output instructions (if schema-bound)
    if (step.output?.format === "json" || step.output?.schema) {
        const outputPath = path.join(runDir, "outputs", `${stepName}.json`);
        parts.push("\n---");
        parts.push(`**Output:** Write your result as valid JSON to: ${outputPath}`);
        if (step.output.schema) {
            parts.push(`The output must conform to the JSON Schema at: ${resolveSchemaPath(step.output.schema, "")}`);
        }
    }
    return parts.join("\n");
}
/**
 * Persist step result to state and update TUI widget.
 * Replaces the repeated writeState + setWidget pattern.
 */
export function persistStep(state, stepName, result, runDir, widgetState, ctx) {
    state.steps[stepName] = result;
    // Clear activity buffer for completed step
    widgetState.activities?.delete(stepName);
    try {
        writeState(runDir, state);
    }
    catch (err) {
        if (ctx.hasUI && ctx.ui.notify) {
            const msg = err instanceof Error ? err.message : String(err);
            ctx.ui.notify(`State write failed after step '${stepName}': ${msg}`, "error");
        }
        throw err; // re-throw — state write failure is fatal
    }
    if (ctx.hasUI) {
        ctx.ui.setWidget(WIDGET_ID, createProgressWidget(widgetState));
    }
}
/**
 * Compile an agent spec: render system and task templates through Nunjucks.
 *
 * Every agent's prompts go through Nunjucks. Plain text without template
 * tags renders to itself. The .md that pi receives is compiled output.
 */
export function compileAgentSpec(agentSpec, resolvedInput, templateEnv) {
    if (!templateEnv)
        return agentSpec;
    const ctx = typeof resolvedInput === "object" && resolvedInput !== null ? resolvedInput : {};
    let result = agentSpec;
    // System prompt: file template or inline — always rendered
    if (agentSpec.promptTemplate) {
        const rendered = renderTemplateFile(templateEnv, agentSpec.promptTemplate, ctx);
        result = { ...result, systemPrompt: rendered, promptTemplate: undefined };
    }
    else if (agentSpec.systemPrompt) {
        const rendered = renderTemplate(templateEnv, agentSpec.systemPrompt, ctx);
        result = { ...result, systemPrompt: rendered };
    }
    // Task prompt: file template — rendered from typed input
    if (agentSpec.taskTemplate) {
        const rendered = renderTemplateFile(templateEnv, agentSpec.taskTemplate, ctx);
        result = { ...result, taskTemplate: rendered };
    }
    return result;
}
//# sourceMappingURL=step-shared.js.map