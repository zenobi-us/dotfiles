/**
 * Loop step executor — runs sub-steps repeatedly until a gate breaks,
 * max attempts is reached, or a step fails.
 */
import path from "node:path";
import { evaluateCondition, resolveExpressions } from "./expression.js";
import { persistStepOutput } from "./output.js";
import { executeGate } from "./step-gate.js";
import { addUsage, buildPrompt, compileAgentSpec, DEFAULT_MAX_ATTEMPTS, zeroUsage } from "./step-shared.js";
import { executeTransform } from "./step-transform.js";
/**
 * Execute a loop step: runs sub-steps repeatedly until a gate breaks,
 * max attempts is reached, or a step fails.
 *
 * Loop sub-steps can be agent, gate, or transform steps.
 * Gates inside loops support onPass: "break" (stop looping on success)
 * and onFail: "continue" (retry on failure, the default inside loops).
 *
 * The loop scope provides ${{ loop.iteration }}, ${{ loop.maxAttempts }},
 * and ${{ loop.priorAttempts }} for expression resolution inside sub-steps.
 */
export async function executeLoop(loopSpec, stepName, state, options) {
    const { ctx, signal, loadAgent, dispatchAgent, runDir } = options;
    const startTime = Date.now();
    // Resolve maxAttempts (may be a ${{ }} expression)
    const scope = { input: state.input, steps: state.steps };
    let maxAttempts;
    if (loopSpec.attempts) {
        const resolved = resolveExpressions(loopSpec.attempts, scope);
        maxAttempts = Number(resolved);
        if (isNaN(maxAttempts) || maxAttempts < 1)
            maxAttempts = loopSpec.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    }
    else {
        maxAttempts = loopSpec.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    }
    const allAttempts = [];
    let loopStatus = "failed"; // assume failure until break
    let lastIterationSteps = {};
    for (let iteration = 0; iteration < maxAttempts; iteration++) {
        // Check cancellation
        if (signal?.aborted)
            break;
        const iterationSteps = {};
        let shouldBreak = false;
        let iterationFailed = false;
        // Execute sub-steps sequentially
        const subStepEntries = Object.entries(loopSpec.steps);
        for (const [subName, subSpec] of subStepEntries) {
            if (signal?.aborted)
                break;
            // Build scope with loop context
            const subScope = {
                input: state.input,
                steps: { ...state.steps, ...iterationSteps }, // see prior sub-steps in this iteration
                loop: {
                    iteration,
                    maxAttempts,
                    priorAttempts: allAttempts,
                },
            };
            // Handle `when` conditional
            if (subSpec.when) {
                const condExpr = subSpec.when.replace(/^\$\{\{\s*/, "").replace(/\s*\}\}$/, "");
                if (!evaluateCondition(condExpr, subScope)) {
                    iterationSteps[subName] = {
                        step: subName,
                        agent: subSpec.agent ?? "skipped",
                        status: "skipped",
                        usage: zeroUsage(),
                        durationMs: 0,
                    };
                    continue;
                }
            }
            // Execute sub-step based on type
            let result;
            if (subSpec.gate) {
                const resolvedCheck = String(resolveExpressions(subSpec.gate.check, subScope));
                result = await executeGate({ ...subSpec.gate, check: resolvedCheck }, subName, { cwd: ctx.cwd, signal });
                // Handle gate pass/fail with break/continue
                const passed = result.output?.passed;
                if (passed && subSpec.gate.onPass === "break") {
                    iterationSteps[subName] = result;
                    shouldBreak = true;
                    loopStatus = "completed";
                    break;
                }
                if (!passed) {
                    if (subSpec.gate.onFail === "break") {
                        iterationSteps[subName] = result;
                        shouldBreak = true;
                        break;
                    }
                    if (subSpec.gate.onFail === "fail") {
                        // Explicitly set to "fail" — stop the loop
                        result.status = "failed";
                        iterationSteps[subName] = result;
                        iterationFailed = true;
                        break;
                    }
                    // Default inside loops is "continue" — proceed to next sub-step
                    // (or end iteration, triggering retry)
                }
            }
            else if (subSpec.transform) {
                result = executeTransform(subSpec.transform, subName, subScope);
                if (result.status === "failed") {
                    iterationSteps[subName] = result;
                    iterationFailed = true;
                    break;
                }
            }
            else if (subSpec.agent) {
                // Resolve input, load agent, dispatch
                let resolvedInput;
                try {
                    resolvedInput = resolveExpressions(subSpec.input ?? {}, subScope);
                }
                catch (err) {
                    iterationSteps[subName] = {
                        step: subName,
                        agent: subSpec.agent,
                        status: "failed",
                        usage: zeroUsage(),
                        durationMs: 0,
                        error: err instanceof Error ? err.message : String(err),
                    };
                    iterationFailed = true;
                    break;
                }
                let agentSpec;
                try {
                    agentSpec = loadAgent(subSpec.agent);
                }
                catch (err) {
                    iterationSteps[subName] = {
                        step: subName,
                        agent: subSpec.agent,
                        status: "failed",
                        usage: zeroUsage(),
                        durationMs: 0,
                        error: err instanceof Error ? err.message : String(err),
                    };
                    iterationFailed = true;
                    break;
                }
                agentSpec = compileAgentSpec(agentSpec, resolvedInput, options.templateEnv);
                const prompt = buildPrompt(subSpec, agentSpec, resolvedInput, runDir, `${stepName}-${iteration}-${subName}`);
                result = await dispatchAgent(subSpec, agentSpec, prompt, {
                    cwd: ctx.cwd,
                    sessionLogDir: path.join(runDir, "sessions"),
                    stepName: `${stepName}-${iteration}-${subName}`,
                    signal,
                });
                if (result.status === "failed") {
                    iterationSteps[subName] = result;
                    iterationFailed = true;
                    break;
                }
            }
            else {
                continue; // unknown step type, skip
            }
            iterationSteps[subName] = result;
        }
        // Record this iteration
        lastIterationSteps = iterationSteps;
        allAttempts.push({ iteration, steps: iterationSteps });
        if (shouldBreak)
            break;
        if (iterationFailed) {
            // Agent step failed within loop — stop the loop (not just the iteration)
            loopStatus = "failed";
            break;
        }
        // End of iteration without break — loop continues to next iteration
    }
    // If loop exhausted without break or failure, run onExhausted
    if (loopStatus !== "completed" && loopSpec.onExhausted) {
        const exhaustedScope = {
            input: state.input,
            steps: state.steps,
            loop: {
                iteration: allAttempts.length,
                maxAttempts,
                priorAttempts: allAttempts,
                allAttempts,
            },
        };
        let resolvedInput;
        let exhaustedError;
        try {
            resolvedInput = resolveExpressions(loopSpec.onExhausted.input ?? {}, exhaustedScope);
        }
        catch (err) {
            exhaustedError = err instanceof Error ? err.message : String(err);
            // Still proceed with onExhausted — let the agent run with empty input
            // but record the expression error so it's visible in the result
        }
        if (loopSpec.onExhausted.agent) {
            let agentSpec;
            try {
                agentSpec = loadAgent(loopSpec.onExhausted.agent);
            }
            catch (err) {
                lastIterationSteps["_exhausted"] = {
                    step: `${stepName}-exhausted`,
                    agent: loopSpec.onExhausted.agent,
                    status: "failed",
                    usage: zeroUsage(),
                    durationMs: 0,
                    error: err instanceof Error ? err.message : String(err),
                };
                agentSpec = null;
            }
            if (agentSpec) {
                const prompt = buildPrompt(loopSpec.onExhausted, agentSpec, resolvedInput, runDir, `${stepName}-exhausted`);
                const exhaustedResult = await dispatchAgent(loopSpec.onExhausted, agentSpec, prompt, {
                    cwd: ctx.cwd,
                    sessionLogDir: path.join(runDir, "sessions"),
                    stepName: `${stepName}-exhausted`,
                    signal,
                });
                if (exhaustedResult && exhaustedError) {
                    exhaustedResult.error = `Expression error in onExhausted input: ${exhaustedError}. Agent ran with empty input.`;
                }
                // Include exhausted result in the loop's output
                lastIterationSteps["_exhausted"] = exhaustedResult;
            }
        }
        if (!loopSpec.onExhausted.agent && exhaustedError) {
            lastIterationSteps["_exhausted"] = {
                step: `${stepName}-exhausted`,
                agent: "exhausted",
                status: "failed",
                usage: zeroUsage(),
                durationMs: 0,
                error: `Expression error in onExhausted input: ${exhaustedError}`,
            };
        }
    }
    // Aggregate usage across all iterations
    const totalUsage = zeroUsage();
    for (const attempt of allAttempts) {
        for (const result of Object.values(attempt.steps)) {
            addUsage(totalUsage, result.usage);
        }
    }
    const loopOutput = {
        iterations: allAttempts.length,
        maxAttempts,
        attempts: allAttempts,
        lastIteration: lastIterationSteps,
    };
    const loopTextOutput = `Loop '${stepName}': ${allAttempts.length}/${maxAttempts} iterations, status: ${loopStatus}`;
    const result = {
        step: stepName,
        agent: "loop",
        status: loopStatus,
        output: loopOutput,
        textOutput: loopTextOutput,
        usage: totalUsage,
        durationMs: Date.now() - startTime,
    };
    // Propagate truncation from any sub-step
    const anyTruncated = allAttempts.some((a) => Object.values(a.steps).some((s) => s.truncated));
    if (anyTruncated) {
        result.truncated = true;
        result.warnings = [
            ...(result.warnings ?? []),
            "One or more loop sub-steps had truncated stdout — usage totals may undercount.",
        ];
    }
    result.outputPath = persistStepOutput(runDir, stepName, loopOutput, loopTextOutput, options.outputPath);
    return result;
}
//# sourceMappingURL=step-loop.js.map