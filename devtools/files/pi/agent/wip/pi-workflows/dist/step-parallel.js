/**
 * Parallel step executors — concurrent step execution within a layer
 * or within a single parallel step declaration.
 */
import { addUsage, WIDGET_ID, zeroUsage } from "./step-shared.js";
import { createProgressWidget } from "./tui.js";
/**
 * Execute all steps in a layer concurrently.
 *
 * All steps start at the same time. If any step fails, remaining steps
 * are cancelled via a shared AbortController. All results are collected
 * before proceeding to the next layer.
 *
 * Parallel steps write to distinct keys in `state.steps`, which is safe
 * in single-threaded Node.js. `writeState` uses atomic write (tmp + rename),
 * so concurrent calls are safe — last one wins.
 */
export async function executeParallelLayer(layer, spec, state, executeSingleStep, options) {
    const { ctx, signal, widgetState } = options;
    // Create a child AbortController to cancel siblings on failure
    const layerController = new AbortController();
    if (signal) {
        if (signal.aborted) {
            layerController.abort(signal.reason);
        }
        else {
            signal.addEventListener("abort", () => layerController.abort(signal.reason), { once: true });
        }
    }
    // Update widget to show all parallel steps as running
    widgetState.currentStep = layer.steps.join(", ");
    if (ctx.hasUI) {
        ctx.ui.setWidget(WIDGET_ID, createProgressWidget(widgetState));
    }
    // Launch all steps concurrently
    const promises = layer.steps.map(async (stepName) => {
        const stepSpec = spec.steps[stepName];
        const success = await executeSingleStep(stepName, stepSpec, state, {
            ...options,
            signal: layerController.signal,
        });
        if (!success && !layerController.signal.aborted) {
            layerController.abort(new Error(`Step '${stepName}' failed`));
        }
        return { stepName, success };
    });
    const results = await Promise.allSettled(promises);
    // Check for failures
    for (const result of results) {
        if (result.status === "rejected") {
            state.status = "failed";
            break;
        }
        if (result.status === "fulfilled" && !result.value.success) {
            state.status = "failed";
            break;
        }
    }
}
/**
 * Execute a parallel step — runs all named sub-steps concurrently.
 *
 * Similar to executeParallelLayer but operates on sub-steps within
 * a single declared step. The parallel step's result aggregates
 * all sub-step results. Sub-step outputs are accessible via
 * `${{ steps.<parallelStepName>.output.<subStepName> }}`.
 */
export async function executeParallelStep(parallelSpec, stepName, state, executeSingleStep, options) {
    const startTime = Date.now();
    const { signal } = options;
    const parallelController = new AbortController();
    if (signal) {
        if (signal.aborted) {
            parallelController.abort(signal.reason);
        }
        else {
            signal.addEventListener("abort", () => parallelController.abort(signal.reason), { once: true });
        }
    }
    // Sub-steps share the outer state for reading but write to their own keys
    const subResults = {};
    const subPromises = Object.entries(parallelSpec).map(async ([subName, subSpec]) => {
        const success = await executeSingleStep(subName, subSpec, state, {
            ...options,
            signal: parallelController.signal,
        });
        subResults[subName] = state.steps[subName];
        if (!success && !parallelController.signal.aborted) {
            parallelController.abort(new Error(`Sub-step '${subName}' failed`));
        }
        return success;
    });
    const settled = await Promise.allSettled(subPromises);
    // Aggregate usage and outputs
    const totalUsage = zeroUsage();
    const subOutputs = {};
    let anyFailed = false;
    for (const [subName] of Object.entries(parallelSpec)) {
        const sub = subResults[subName];
        if (sub) {
            addUsage(totalUsage, sub.usage);
            subOutputs[subName] = sub.output ?? sub.textOutput;
            if (sub.status === "failed")
                anyFailed = true;
        }
    }
    // Check for rejected promises too
    for (const s of settled) {
        if (s.status === "rejected")
            anyFailed = true;
    }
    return {
        step: stepName,
        agent: "parallel",
        status: anyFailed ? "failed" : "completed",
        output: subOutputs,
        textOutput: JSON.stringify(subOutputs, null, 2),
        usage: totalUsage,
        durationMs: Date.now() - startTime,
    };
}
//# sourceMappingURL=step-parallel.js.map