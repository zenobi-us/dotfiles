/**
 * Agent step executor — dispatches an LLM subprocess and validates output.
 */
import fs from "node:fs";
import path from "node:path";
import { validateFromFile } from "@davidorex/pi-project/src/schema-validator.js";
import { dispatch } from "./dispatch.js";
import { resolveExpressions } from "./expression.js";
import { persistStepOutput } from "./output.js";
import { buildPrompt, compileAgentSpec, resolveSchemaPath, zeroUsage } from "./step-shared.js";
/**
 * Execute an agent step: resolve input, render templates, dispatch subprocess,
 * validate output, persist result.
 *
 * Returns the StepResult.
 */
export async function executeAgentStep(stepName, stepSpec, state, options) {
    const { ctx, signal, loadAgent, runDir, specFilePath, templateEnv } = options;
    const agentName = stepSpec.agent;
    const scope = { input: state.input, steps: state.steps };
    // Expose forEach bindings (as name + forEach metadata) if present on the state
    const stateAny = state;
    if (stateAny.forEach !== undefined) {
        scope.forEach = stateAny.forEach;
    }
    for (const key of Object.keys(stateAny)) {
        if (key !== "input" &&
            key !== "steps" &&
            key !== "status" &&
            key !== "loop" &&
            key !== "workflowName" &&
            key !== "specVersion" &&
            key !== "startedAt" &&
            key !== "updatedAt" &&
            key !== "forEach") {
            scope[key] = stateAny[key];
        }
    }
    // Resolve input expressions
    let resolvedInput;
    try {
        resolvedInput = resolveExpressions(stepSpec.input ?? {}, scope);
    }
    catch (err) {
        return {
            step: stepName,
            agent: agentName,
            status: "failed",
            usage: zeroUsage(),
            durationMs: 0,
            error: err instanceof Error ? err.message : String(err),
        };
    }
    // Load and optionally render agent template
    let agentSpec;
    try {
        agentSpec = loadAgent(agentName);
    }
    catch (err) {
        return {
            step: stepName,
            agent: agentName,
            status: "failed",
            usage: zeroUsage(),
            durationMs: 0,
            error: err instanceof Error ? err.message : String(err),
        };
    }
    // Inject output schema into template context if available
    if (stepSpec.output?.schema && typeof resolvedInput === "object" && resolvedInput !== null) {
        const schemaPath = resolveSchemaPath(stepSpec.output.schema, options.specFilePath);
        try {
            const schemaContent = fs.readFileSync(schemaPath, "utf8");
            resolvedInput.output_schema = schemaContent;
        }
        catch {
            /* schema file not found — template can still render without it */
        }
    }
    agentSpec = compileAgentSpec(agentSpec, resolvedInput, templateEnv);
    let prompt = buildPrompt(stepSpec, agentSpec, resolvedInput, runDir, stepName);
    // Inject retry context if this is a retry attempt
    if (options.retryContext) {
        const rc = options.retryContext;
        const retryParts = [];
        retryParts.push(`## Retry Context (attempt ${rc.attempt})\n`);
        retryParts.push("Your previous attempt failed. The filesystem has been rolled back to its pre-attempt state.\n");
        retryParts.push("### Prior Errors");
        for (let i = 0; i < rc.priorErrors.length; i++) {
            retryParts.push(`${i + 1}. ${rc.priorErrors[i]}`);
        }
        retryParts.push("");
        if (rc.steeringMessage) {
            retryParts.push("### Steering");
            retryParts.push(rc.steeringMessage);
            retryParts.push("");
        }
        retryParts.push("---\n");
        prompt = retryParts.join("\n") + prompt;
    }
    const dispatchFn = options.dispatchFn ?? dispatch;
    const result = await dispatchFn(stepSpec, agentSpec, prompt, {
        cwd: ctx.cwd,
        sessionLogDir: path.join(runDir, "sessions"),
        stepName,
        signal,
        timeoutMs: stepSpec.timeout ? stepSpec.timeout.seconds * 1000 : undefined,
        onEvent: (event) => {
            if (event.type === "tool_execution_start" && event.toolName && options.onStepActivity) {
                options.onStepActivity({
                    tool: event.toolName,
                    preview: event.toolArgs || "",
                    timestamp: Date.now(),
                });
            }
        },
        modelConfig: options.modelConfig,
    });
    // Resolve output path from spec (may contain ${{ }} expressions)
    const resolvedOutputPath = stepSpec.output?.path
        ? String(resolveExpressions(stepSpec.output.path, scope))
        : undefined;
    // Validate output against schema (if defined)
    if (stepSpec.output?.schema && result.status === "completed") {
        const schemaPath = resolveSchemaPath(stepSpec.output.schema, specFilePath);
        try {
            const outputFilePath = path.join(runDir, "outputs", `${stepName}.json`);
            if (fs.existsSync(outputFilePath)) {
                const rawOutput = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
                validateFromFile(schemaPath, rawOutput, `step output for '${stepName}'`);
                result.output = rawOutput;
            }
            else {
                try {
                    const parsed = JSON.parse(result.textOutput || "");
                    validateFromFile(schemaPath, parsed, `step output for '${stepName}'`);
                    result.output = parsed;
                    result.outputPath = persistStepOutput(runDir, stepName, parsed, undefined, resolvedOutputPath);
                }
                catch {
                    result.status = "failed";
                    result.error = `Step '${stepName}' has output schema but no valid JSON output was produced`;
                }
            }
        }
        catch (err) {
            result.status = "failed";
            result.error = err instanceof Error ? err.message : String(err);
        }
    }
    else {
        result.outputPath = persistStepOutput(runDir, stepName, result.output, result.textOutput, resolvedOutputPath);
    }
    return result;
}
//# sourceMappingURL=step-agent.js.map