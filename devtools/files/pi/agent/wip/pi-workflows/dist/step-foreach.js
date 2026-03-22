/**
 * ForEach step executor — iterates over an array, executing the step body
 * once per element with the element bound to a named variable in scope.
 */
import { resolveExpression, resolveExpressions } from "./expression.js";
import { persistStepOutput } from "./output.js";
import { addUsage, zeroUsage } from "./step-shared.js";
/**
 * Execute a forEach step: iterates over an array and executes the step body
 * for each element.
 *
 * @param stepName - the name of the forEach step
 * @param stepSpec - the full step spec (including forEach, as, and the body type)
 * @param state - current execution state
 * @param forEachExpr - the forEach expression string (without ${{ }} delimiters)
 * @param asName - the variable name to bind each element (default: "item")
 * @param executeSingleStep - the step executor function to delegate to
 * @param options - step execution options
 * @returns combined StepResult with array output
 */
export async function executeForEach(stepName, stepSpec, state, forEachExpr, asName, executeSingleStep, options) {
    const startTime = Date.now();
    const scope = { input: state.input, steps: state.steps };
    // Resolve the forEach expression to get the array
    const rawExpr = forEachExpr.replace(/^\$\{\{\s*/, "").replace(/\s*\}\}$/, "");
    let array;
    try {
        array = resolveExpression(rawExpr, scope);
    }
    catch (err) {
        return {
            step: stepName,
            agent: "forEach",
            status: "failed",
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
            error: `forEach expression failed: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
    if (!Array.isArray(array)) {
        return {
            step: stepName,
            agent: "forEach",
            status: "failed",
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
            error: `forEach expression must resolve to an array, got ${typeof array}`,
        };
    }
    // Empty array → completed with empty output
    if (array.length === 0) {
        return {
            step: stepName,
            agent: "forEach",
            status: "completed",
            output: [],
            textOutput: "[]",
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
        };
    }
    // Create the step body (strip forEach/as fields)
    const bodySpec = { ...stepSpec };
    delete bodySpec.forEach;
    delete bodySpec.as;
    const outputs = [];
    const totalUsage = zeroUsage();
    let failed = false;
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        const iterStepName = `${stepName}[${i}]`;
        // Create a scoped copy of state for this iteration
        // The as binding and forEach metadata are added to a proxy state
        // that exposes them in the expression scope
        const iterState = {
            ...state,
            steps: { ...state.steps },
            // Store forEach bindings that the executor can pick up
            [asName]: element,
            forEach: { index: i, length: array.length },
        };
        const cont = await executeSingleStep(iterStepName, bodySpec, iterState, options);
        // Copy iteration results back to main state
        const iterResult = iterState.steps[iterStepName];
        if (iterResult) {
            state.steps[iterStepName] = iterResult;
            outputs.push(iterResult.output);
            addUsage(totalUsage, iterResult.usage);
        }
        if (!cont || (iterResult && iterResult.status === "failed")) {
            failed = true;
            break;
        }
    }
    const result = {
        step: stepName,
        agent: "forEach",
        status: failed ? "failed" : "completed",
        output: outputs,
        textOutput: JSON.stringify(outputs, null, 2),
        usage: totalUsage,
        durationMs: Date.now() - startTime,
        error: failed ? `forEach iteration failed` : undefined,
    };
    // Persist the collected output
    if (options.runDir) {
        const outputPath = stepSpec.output?.path ? String(resolveExpressions(stepSpec.output.path, scope)) : undefined;
        result.outputPath = persistStepOutput(options.runDir, stepName, outputs, undefined, outputPath);
    }
    return result;
}
//# sourceMappingURL=step-foreach.js.map