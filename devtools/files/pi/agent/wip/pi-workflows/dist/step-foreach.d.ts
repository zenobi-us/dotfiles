/**
 * ForEach step executor — iterates over an array, executing the step body
 * once per element with the element bound to a named variable in scope.
 */
import type { ExecutionState, StepResult, StepSpec } from "./types.js";
/** Options for forEach execution, matching the StepExecOptions pattern. */
interface ForEachOptions {
    ctx: any;
    pi: any;
    signal?: AbortSignal;
    loadAgent: (name: string) => any;
    runDir: string;
    spec: any;
    widgetState: any;
    templateEnv?: any;
    dispatchFn?: any;
}
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
export declare function executeForEach(stepName: string, stepSpec: StepSpec, state: ExecutionState, forEachExpr: string, asName: string, executeSingleStep: (name: string, spec: StepSpec, state: ExecutionState, opts: ForEachOptions) => Promise<boolean>, options: ForEachOptions): Promise<StepResult>;
export {};
//# sourceMappingURL=step-foreach.d.ts.map