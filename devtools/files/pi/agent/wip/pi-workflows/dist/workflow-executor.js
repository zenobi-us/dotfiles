/**
 * Workflow executor — orchestrates step execution with DAG-based layering,
 * parallel dispatch, timeout enforcement, state persistence, and TUI updates.
 */
import fs from "node:fs";
import path from "node:path";
import { readBlock, writeBlock } from "@davidorex/pi-project/src/block-api.js";
import { rollbackBlockFiles, snapshotBlockFiles, validateChangedBlocks, } from "@davidorex/pi-project/src/block-validation.js";
import { PROJECT_DIR } from "@davidorex/pi-project/src/project-dir.js";
import { validate, validateFromFile } from "@davidorex/pi-project/src/schema-validator.js";
import { truncateTail } from "@mariozechner/pi-coding-agent";
import { resolveCompletion } from "./completion.js";
import { buildPlanFromDeps, extractDependencies } from "./dag.js";
import { dispatch } from "./dispatch.js";
import { evaluateCondition, resolveExpressions } from "./expression.js";
import { buildResult, formatResult, generateRunId, getWorkflowDir, initRunDir, writeMetrics, writeState, } from "./state.js";
import { executeAgentStep } from "./step-agent.js";
import { executeCommand } from "./step-command.js";
import { executeForEach } from "./step-foreach.js";
import { executeGate } from "./step-gate.js";
import { executeLoop } from "./step-loop.js";
import { executeMonitor } from "./step-monitor.js";
import { executeParallelLayer, executeParallelStep } from "./step-parallel.js";
import { executePause } from "./step-pause.js";
import { persistStep, resolveSchemaPath, SIGKILL_GRACE_MS, WIDGET_ID, zeroUsage } from "./step-shared.js";
import { executeTransform } from "./step-transform.js";
import { createTemplateEnv } from "./template.js";
import { createProgressWidget } from "./tui.js";
// Re-export SIGKILL_GRACE_MS so tests that grep this file still find it
export { SIGKILL_GRACE_MS };
/** Module-level flag set by the Ctrl+H keybinding handler. */
let pauseRequested = false;
/** Set by the extension keybinding to request a pause after the current step. */
export function requestPause() {
    pauseRequested = true;
}
/** Clear the pause flag (called at the start of each workflow execution). */
function clearPauseRequest() {
    pauseRequested = false;
}
/**
 * Build a conservative execution plan that preserves declaration-order
 * sequencing for steps without explicit `${{ steps.X }}` dependencies.
 *
 * Steps with no explicit dependencies implicitly depend on the previous
 * step in declaration order. This ensures backward compatibility with
 * workflows written for sequential execution while still allowing
 * DAG-inferred parallelism for steps that DO have explicit dependencies
 * (e.g., diamond patterns where two steps both depend on an earlier step).
 */
function buildConservativePlan(spec) {
    const deps = extractDependencies(spec);
    const allSteps = Object.keys(spec.steps);
    // Add implicit declaration-order dependency for steps with no explicit deps.
    // If a step has no ${{ steps.X }} references at all, it depends on the
    // immediately preceding step in YAML order.
    for (let i = 1; i < allSteps.length; i++) {
        const stepDeps = deps.get(allSteps[i]);
        if (stepDeps.size === 0) {
            stepDeps.add(allSteps[i - 1]);
        }
    }
    return buildPlanFromDeps(allSteps, deps);
}
/**
 * Determine if a step type supports retry.
 * Agent, forEach, and loop steps are retryable.
 * Command, gate, and transform are deterministic and not retryable.
 */
function isRetryableStepType(stepSpec) {
    if (stepSpec.command || stepSpec.gate || stepSpec.transform || stepSpec.monitor)
        return false;
    return true;
}
/**
 * Execute a single step (agent, gate, transform, loop, or parallel).
 *
 * This is the central step type dispatcher. It delegates to the appropriate
 * step executor module based on the step spec type.
 * Returns true if the workflow should continue, false if it should stop
 * (due to failure, break, or cancellation).
 *
 * Supports per-step retry: if step.retry is configured and the step type
 * is retryable, failures (including block validation) trigger rollback
 * and re-execution with error context injected into the prompt.
 */
async function executeSingleStep(stepName, stepSpec, state, options) {
    const { ctx, signal, loadAgent, runDir, spec, widgetState } = options;
    // Check cancellation
    if (signal?.aborted) {
        state.steps[stepName] = {
            step: stepName,
            agent: stepSpec.agent ?? "",
            status: "failed",
            usage: zeroUsage(),
            durationMs: 0,
            error: "Workflow cancelled",
        };
        state.status = "failed";
        return false;
    }
    // Build expression scope
    const scope = { input: state.input, steps: state.steps };
    // Expose forEach bindings (as name + forEach metadata) if present on the state
    const stateAny = state;
    if (stateAny.forEach !== undefined) {
        scope.forEach = stateAny.forEach;
    }
    // Expose any custom bindings (e.g. from forEach as)
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
    // Evaluate `when` conditional
    if (stepSpec.when) {
        const conditionExpr = stepSpec.when.replace(/^\$\{\{\s*/, "").replace(/\s*\}\}$/, "");
        const shouldRun = evaluateCondition(conditionExpr, scope);
        if (!shouldRun) {
            persistStep(state, stepName, {
                step: stepName,
                agent: stepSpec.agent ?? "skipped",
                status: "skipped",
                usage: zeroUsage(),
                durationMs: 0,
            }, runDir, widgetState, ctx);
            return true;
        }
    }
    // Determine retry config
    const retryConfig = stepSpec.retry;
    const maxAttempts = retryConfig?.maxAttempts ?? 1;
    const canRetry = isRetryableStepType(stepSpec) && maxAttempts > 1;
    const totalAttempts = canRetry ? maxAttempts : 1;
    const priorErrors = [];
    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
        // Check cancellation between retry attempts
        if (attempt > 1 && signal?.aborted) {
            state.steps[stepName] = {
                step: stepName,
                agent: stepSpec.agent ?? "",
                status: "failed",
                usage: zeroUsage(),
                durationMs: 0,
                error: "Workflow cancelled",
            };
            state.status = "failed";
            return false;
        }
        // Snapshot project block files before step execution for post-step validation
        const blockSnapshot = snapshotBlockFiles(ctx.cwd);
        // Update widget: mark this step as current
        widgetState.currentStep = stepName;
        if (ctx.hasUI) {
            ctx.ui.setWidget(WIDGET_ID, createProgressWidget(widgetState));
        }
        // Build retry context for this attempt (if retrying)
        const retryContext = attempt > 1
            ? {
                attempt,
                priorErrors: [...priorErrors],
                steeringMessage: retryConfig?.steeringMessage,
            }
            : undefined;
        // Execute the step, then validate any changed block files
        // Reset failed status before re-attempt
        if (attempt > 1) {
            delete state.steps[stepName];
            state.status = "running";
        }
        const continueWorkflow = await executeStepByType(stepName, stepSpec, state, scope, options, retryContext);
        // Post-step block validation: if the step succeeded, validate changed project block files
        let blockValidationFailed = false;
        if (continueWorkflow && state.steps[stepName]?.status === "completed") {
            try {
                validateChangedBlocks(ctx.cwd, blockSnapshot);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                blockValidationFailed = true;
                priorErrors.push(msg);
                // Always rollback — invalid data must not persist
                rollbackBlockFiles(ctx.cwd, blockSnapshot);
                if (attempt < totalAttempts) {
                    // Retry
                    continue;
                }
                // Last attempt — mark failed
                state.steps[stepName].status = "failed";
                state.steps[stepName].error = msg;
                state.steps[stepName].attempt = attempt;
                state.steps[stepName].totalAttempts = attempt;
                state.steps[stepName].priorErrors = [...priorErrors];
                state.status = "failed";
                persistStep(state, stepName, state.steps[stepName], runDir, widgetState, ctx);
                // Check onExhausted
                if (retryConfig?.onExhausted === "skip") {
                    state.steps[stepName].status = "skipped";
                    state.steps[stepName].warnings = [
                        ...(state.steps[stepName].warnings ?? []),
                        `Step skipped after ${attempt} failed attempts (onExhausted: skip)`,
                    ];
                    state.status = "running";
                    persistStep(state, stepName, state.steps[stepName], runDir, widgetState, ctx);
                    return true;
                }
                return false;
            }
        }
        if (!continueWorkflow || state.steps[stepName]?.status === "failed") {
            const errorMsg = state.steps[stepName]?.error ?? "Step failed";
            priorErrors.push(errorMsg);
            if (attempt < totalAttempts && canRetry) {
                // Rollback block files and retry
                rollbackBlockFiles(ctx.cwd, blockSnapshot);
                continue;
            }
            // Last attempt or not retryable — annotate and return
            if (state.steps[stepName]) {
                state.steps[stepName].attempt = attempt;
                state.steps[stepName].totalAttempts = attempt;
                state.steps[stepName].priorErrors = attempt > 1 ? [...priorErrors] : undefined;
                persistStep(state, stepName, state.steps[stepName], runDir, widgetState, ctx);
            }
            // Check onExhausted
            if (canRetry && retryConfig?.onExhausted === "skip") {
                if (state.steps[stepName]) {
                    state.steps[stepName].status = "skipped";
                    state.steps[stepName].warnings = [
                        ...(state.steps[stepName].warnings ?? []),
                        `Step skipped after ${attempt} failed attempts (onExhausted: skip)`,
                    ];
                    state.status = "running";
                    persistStep(state, stepName, state.steps[stepName], runDir, widgetState, ctx);
                }
                return true;
            }
            return false;
        }
        // Success — annotate with attempt tracking
        if (state.steps[stepName]) {
            state.steps[stepName].attempt = attempt;
            state.steps[stepName].totalAttempts = attempt;
            state.steps[stepName].priorErrors = attempt > 1 ? [...priorErrors] : undefined;
        }
        // Parse step output into a summary for TUI display
        const stepOutput = state.steps[stepName]?.output;
        if (stepOutput && typeof stepOutput === "object") {
            const out = stepOutput;
            const summary = {};
            if (Array.isArray(out.tasks)) {
                summary.tasks = out.tasks
                    .filter((t) => t && typeof t === "object")
                    .map((t) => ({
                    name: String(t.name ?? "?"),
                    status: String(t.status ?? "?"),
                    files: Array.isArray(t.files_modified) ? t.files_modified.map(String) : undefined,
                }));
            }
            if (typeof out.test_count === "number") {
                summary.testCount = out.test_count;
            }
            if (typeof out.notes === "string") {
                summary.note = out.notes;
            }
            if (summary.tasks || summary.testCount || summary.note) {
                widgetState.outputSummaries.set(stepName, summary);
                if (ctx.hasUI) {
                    ctx.ui.setWidget(WIDGET_ID, createProgressWidget(widgetState));
                }
            }
        }
        return continueWorkflow;
    }
    // Should not reach here, but safety net
    return false;
}
/**
 * Execute a step based on its type (agent, gate, transform, etc.).
 * Factored out of executeSingleStep to allow post-step validation.
 */
async function executeStepByType(stepName, stepSpec, state, scope, options, retryContext) {
    const { ctx, signal, loadAgent, runDir, spec, widgetState } = options;
    // ── ForEach step (wraps any step type) ──
    if (stepSpec.forEach) {
        const asName = stepSpec.as ?? "item";
        const forEachResult = await executeForEach(stepName, stepSpec, state, stepSpec.forEach, asName, executeSingleStep, options);
        persistStep(state, stepName, forEachResult, runDir, widgetState, ctx);
        if (forEachResult.status === "failed") {
            state.status = "failed";
            return false;
        }
        return true;
    }
    // ── Gate step ──
    if (stepSpec.gate) {
        const resolvedCheck = String(resolveExpressions(stepSpec.gate.check, scope));
        const resolvedGate = { ...stepSpec.gate, check: resolvedCheck };
        const resolvedGateOutputPath = stepSpec.output?.path
            ? String(resolveExpressions(stepSpec.output.path, scope))
            : undefined;
        const gateResult = await executeGate(resolvedGate, stepName, {
            cwd: ctx.cwd,
            signal,
            timeoutMs: stepSpec.timeout ? stepSpec.timeout.seconds * 1000 : undefined,
            runDir,
            outputPath: resolvedGateOutputPath,
        });
        const gateOutput = gateResult.output;
        if (gateOutput.passed) {
            const onPass = stepSpec.gate.onPass ?? "continue";
            persistStep(state, stepName, gateResult, runDir, widgetState, ctx);
            return onPass !== "break";
        }
        else {
            const onFail = stepSpec.gate.onFail ?? "fail";
            if (onFail === "fail") {
                gateResult.status = "failed";
                gateResult.error = `Gate check failed (exit ${gateOutput.exitCode}): ${gateOutput.output}`;
                persistStep(state, stepName, gateResult, runDir, widgetState, ctx);
                state.status = "failed";
                return false;
            }
            else if (onFail === "continue") {
                persistStep(state, stepName, gateResult, runDir, widgetState, ctx);
                return true;
            }
            else if (onFail === "break") {
                persistStep(state, stepName, gateResult, runDir, widgetState, ctx);
                return false;
            }
        }
    }
    // ── Command step ──
    if (stepSpec.command) {
        const resolvedCommand = String(resolveExpressions(stepSpec.command, scope));
        const resolvedCommandOutputPath = stepSpec.output?.path
            ? String(resolveExpressions(stepSpec.output.path, scope))
            : undefined;
        const commandResult = await executeCommand(resolvedCommand, stepName, {
            cwd: ctx.cwd,
            signal,
            timeoutMs: stepSpec.timeout ? stepSpec.timeout.seconds * 1000 : undefined,
            runDir,
            outputPath: resolvedCommandOutputPath,
        }, stepSpec.output?.format);
        persistStep(state, stepName, commandResult, runDir, widgetState, ctx);
        if (commandResult.status === "failed") {
            state.status = "failed";
            return false;
        }
        return true;
    }
    // ── Monitor step ──
    if (stepSpec.monitor) {
        const resolvedInput = stepSpec.input ? resolveExpressions(stepSpec.input, scope) : {};
        const resolvedMonitorOutputPath = stepSpec.output?.path
            ? String(resolveExpressions(stepSpec.output.path, scope))
            : undefined;
        const monitorResult = await executeMonitor(stepSpec.monitor, stepName, resolvedInput, {
            cwd: ctx.cwd,
            ctx,
            signal,
            runDir,
            outputPath: resolvedMonitorOutputPath,
        });
        persistStep(state, stepName, monitorResult, runDir, widgetState, ctx);
        if (monitorResult.status === "failed") {
            state.status = "failed";
            return false;
        }
        return true;
    }
    // ── Transform step ──
    if (stepSpec.transform) {
        const resolvedTransformOutputPath = stepSpec.output?.path
            ? String(resolveExpressions(stepSpec.output.path, scope))
            : undefined;
        const transformResult = executeTransform(stepSpec.transform, stepName, scope, runDir, resolvedTransformOutputPath);
        persistStep(state, stepName, transformResult, runDir, widgetState, ctx);
        if (transformResult.status === "failed") {
            state.status = "failed";
            return false;
        }
        return true;
    }
    // ── Loop step ──
    if (stepSpec.loop) {
        const resolvedLoopOutputPath = stepSpec.output?.path
            ? String(resolveExpressions(stepSpec.output.path, scope))
            : undefined;
        const loopResult = await executeLoop(stepSpec.loop, stepName, state, {
            ctx,
            pi: options.pi,
            signal,
            loadAgent,
            runDir,
            spec,
            dispatchAgent: (s, a, p, o) => (options.dispatchFn ?? dispatch)(s, a, p, { ...o, modelConfig: options.modelConfig }),
            templateEnv: options.templateEnv,
            outputPath: resolvedLoopOutputPath,
        });
        persistStep(state, stepName, loopResult, runDir, widgetState, ctx);
        if (loopResult.status === "failed") {
            state.status = "failed";
            return false;
        }
        return true;
    }
    // ── Parallel step ──
    if (stepSpec.parallel) {
        const parallelResult = await executeParallelStep(stepSpec.parallel, stepName, state, executeSingleStep, options);
        persistStep(state, stepName, parallelResult, runDir, widgetState, ctx);
        if (parallelResult.status === "failed") {
            state.status = "failed";
            return false;
        }
        return true;
    }
    // ── Pause step ──
    if (stepSpec.pause !== undefined) {
        const message = typeof stepSpec.pause === "string" ? stepSpec.pause : undefined;
        const pauseResult = executePause(stepName, message);
        persistStep(state, stepName, pauseResult, runDir, widgetState, ctx);
        state.status = "paused";
        if (ctx.hasUI) {
            ctx.ui.notify(message || "Workflow paused. Use /workflow resume or Ctrl+J to continue.", "info");
        }
        return false;
    }
    // ── Agent step (default) ──
    const agentResult = await executeAgentStep(stepName, stepSpec, state, {
        ctx,
        signal,
        loadAgent,
        runDir,
        specFilePath: spec.filePath,
        widgetState,
        templateEnv: options.templateEnv,
        dispatchFn: options.dispatchFn,
        modelConfig: options.modelConfig,
        retryContext,
        onStepActivity: (activity) => {
            if (!widgetState.activities)
                widgetState.activities = new Map();
            const existing = widgetState.activities.get(stepName) || [];
            if (existing.length >= 5)
                existing.shift();
            existing.push(activity);
            widgetState.activities.set(stepName, existing);
            if (ctx.hasUI) {
                ctx.ui.setWidget(WIDGET_ID, createProgressWidget(widgetState));
            }
        },
    });
    persistStep(state, stepName, agentResult, runDir, widgetState, ctx);
    if (agentResult.status === "failed") {
        state.status = "failed";
        return false;
    }
    return true;
}
/**
 * Execute a workflow from a parsed spec and validated input.
 *
 * Runs steps sequentially (phase 1), resolving ${{ }} expressions,
 * dispatching subprocesses, validating outputs, persisting state,
 * updating TUI, and injecting the result into the conversation.
 *
 * Supports step types: agent (default), gate, transform, loop.
 * Supports `when` conditionals for skipping steps.
 *
 * Returns the WorkflowResult (also injected into conversation via sendMessage).
 */
export async function executeWorkflow(spec, input, options) {
    const { ctx, pi, signal, loadAgent } = options;
    clearPauseRequest();
    // 1. Validate input against workflow input schema (if defined)
    //    Skip on resume — input was validated on first run.
    if (!options.resume && spec.input) {
        validate(spec.input, input, `workflow input for '${spec.name}'`);
    }
    // 2. Initialize or resume run
    let runId;
    let runDir;
    let state;
    if (options.resume) {
        runId = options.resume.runId;
        runDir = options.resume.runDir;
        state = options.resume.state;
        // Reset failed steps so they re-run
        for (const [name, result] of Object.entries(state.steps)) {
            if (result.status === "failed") {
                delete state.steps[name];
            }
        }
        state.status = "running";
        input = state.input; // use original input
    }
    else {
        runId = generateRunId(spec.name);
        runDir = initRunDir(ctx.cwd, spec.name, runId);
        state = {
            input,
            steps: {},
            status: "running",
            workflowName: spec.name,
            specVersion: spec.version,
            startedAt: new Date().toISOString(),
        };
    }
    // 3. Show TUI progress widget
    const widgetState = {
        spec,
        state,
        startTime: Date.now(),
        activities: new Map(),
        outputSummaries: new Map(),
    };
    if (options.resume) {
        widgetState.resumedSteps = Object.keys(state.steps).filter((s) => state.steps[s].status === "completed" || state.steps[s].status === "skipped").length;
    }
    if (ctx.hasUI) {
        ctx.ui.setWidget(WIDGET_ID, createProgressWidget(widgetState));
    }
    // 4. Set working message
    if (ctx.hasUI) {
        ctx.ui.setWorkingMessage(`Running ${spec.name} workflow...`);
    }
    // 5. Load model config (project-level model assignments by role)
    let modelConfig = options.modelConfig;
    if (!modelConfig) {
        try {
            modelConfig = readBlock(ctx.cwd, "model-config");
        }
        catch {
            /* no config file — models come from agent specs or step specs */
        }
    }
    // 6. Build execution plan and execute layers
    const plan = buildConservativePlan(spec);
    const templateEnv = createTemplateEnv(ctx.cwd);
    const stepOpts = {
        ctx,
        pi,
        signal,
        loadAgent,
        runDir,
        spec,
        widgetState,
        templateEnv,
        dispatchFn: options.dispatchFn,
        modelConfig,
    };
    for (const layer of plan) {
        if (signal?.aborted) {
            // Mark first unprocessed step as cancelled
            for (const sn of layer.steps) {
                if (!state.steps[sn]) {
                    state.steps[sn] = {
                        step: sn,
                        agent: spec.steps[sn].agent ?? "",
                        status: "failed",
                        usage: zeroUsage(),
                        durationMs: 0,
                        error: "Workflow cancelled",
                    };
                }
            }
            state.status = "failed";
            break;
        }
        // Filter to only pending steps in this layer (resume support)
        const pendingSteps = layer.steps.filter((s) => !state.steps[s] || state.steps[s].status === "failed");
        if (pendingSteps.length === 0)
            continue; // entire layer already done
        if (pendingSteps.length === 1) {
            const stepName = pendingSteps[0];
            const stepSpec = spec.steps[stepName];
            const cont = await executeSingleStep(stepName, stepSpec, state, stepOpts);
            if (!cont)
                break;
        }
        else {
            // Run only the pending steps concurrently
            const pendingLayer = { steps: pendingSteps };
            await executeParallelLayer(pendingLayer, spec, state, executeSingleStep, stepOpts);
            if (state.status === "failed" || state.status === "paused")
                break;
        }
        // Check keybinding-initiated pause (between layers/steps)
        if (pauseRequested) {
            pauseRequested = false;
            state.status = "paused";
            try {
                writeState(runDir, state);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (ctx.hasUI) {
                    ctx.ui.notify(`Warning: state write failed after pause — resume may not work: ${msg}`, "error");
                }
            }
            if (ctx.hasUI) {
                ctx.ui.notify("Workflow paused. Use /workflow resume or Ctrl+J to continue.", "info");
            }
            break;
        }
    }
    // 5. Finalize
    if (state.status === "running") {
        state.status = "completed";
    }
    try {
        writeState(runDir, state);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (ctx.hasUI) {
            ctx.ui.notify(`Warning: final state write failed — run history may be incomplete: ${msg}`, "error");
        }
    }
    writeMetrics(runDir, state.steps);
    // 6. Process artifacts
    const writtenArtifacts = {};
    if (spec.artifacts) {
        const workflowDir = getWorkflowDir(ctx.cwd, spec.name);
        const artifactScope = {
            input: state.input,
            steps: state.steps,
            runId,
            runDir,
        };
        for (const [name, artifactSpec] of Object.entries(spec.artifacts)) {
            try {
                // Resolve the output path (may contain expressions)
                // Relative paths resolve against the workflow's output directory
                const resolvedPath = String(resolveExpressions(artifactSpec.path, artifactScope));
                const absolutePath = path.isAbsolute(resolvedPath) ? resolvedPath : path.resolve(workflowDir, resolvedPath);
                // Resolve the data source — wrap `from` as ${{ from }} for expression resolution
                const fromExpr = artifactSpec.from.startsWith("${{") ? artifactSpec.from : `\${{ ${artifactSpec.from} }}`;
                const data = resolveExpressions(fromExpr, artifactScope);
                // Validate against schema if specified
                if (artifactSpec.schema) {
                    const schemaPath = resolveSchemaPath(artifactSpec.schema, spec.filePath);
                    validateFromFile(schemaPath, data, `artifact '${name}'`);
                }
                // Route project block JSON targets through block-api for block-schema validation
                const workflowPrefix = path.join(ctx.cwd, PROJECT_DIR) + path.sep;
                if (absolutePath.startsWith(workflowPrefix) && absolutePath.endsWith(".json")) {
                    const blockName = path.basename(absolutePath, ".json");
                    writeBlock(ctx.cwd, blockName, data);
                    writtenArtifacts[name] = absolutePath;
                }
                else {
                    // Write non-block artifacts directly
                    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
                    if (typeof data === "string") {
                        fs.writeFileSync(absolutePath, data);
                    }
                    else {
                        fs.writeFileSync(absolutePath, JSON.stringify(data, null, 2));
                    }
                    writtenArtifacts[name] = absolutePath;
                }
            }
            catch (err) {
                // Artifact write failure is non-fatal — log warning, don't fail the workflow
                const msg = err instanceof Error ? err.message : String(err);
                if (ctx.hasUI) {
                    ctx.ui.notify(`Artifact '${name}' failed: ${msg}`, "warning");
                }
            }
        }
    }
    // 7. Clean up TUI
    if (ctx.hasUI) {
        ctx.ui.setWidget(WIDGET_ID, undefined);
        ctx.ui.setWorkingMessage(undefined);
    }
    // 8. Build and inject result
    const result = buildResult(spec, runId, runDir, state, state.status);
    // Attach written artifact paths to the result
    if (Object.keys(writtenArtifacts).length > 0) {
        result.artifacts = writtenArtifacts;
    }
    const triggerTurn = spec.triggerTurn !== false;
    if (state.status === "paused") {
        const completedCount = Object.values(state.steps).filter((s) => s.status === "completed").length;
        const totalCount = Object.keys(spec.steps).length;
        const pauseContent = `Workflow '${spec.name}' paused (${completedCount}/${totalCount} steps completed). Use /workflow resume ${spec.name} or Ctrl+J to continue.`;
        pi.sendMessage({ customType: "workflow-result", content: pauseContent, display: "verbose" }, { triggerTurn: false });
    }
    else {
        let content;
        if (spec.completion) {
            try {
                content = resolveCompletion(spec.completion, result, input);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                content = formatResult(result) + `\n\nCompletion template error: ${msg}`;
            }
        }
        else {
            content = formatResult(result);
        }
        // P7: Truncate completion message to avoid context overflow (50KB / 2000 lines)
        const truncated = truncateTail(content, { maxLines: 2000, maxBytes: 50 * 1024 });
        content = truncated.content;
        if (truncated.truncated) {
            content += `\n\n[Truncated: output exceeded ${truncated.truncatedBy === "bytes" ? "50KB" : "2000 lines"}. Full output in run dir: ${runDir}]`;
        }
        pi.sendMessage({ customType: "workflow-result", content, display: "verbose" }, { triggerTurn });
    }
    return result;
}
//# sourceMappingURL=workflow-executor.js.map