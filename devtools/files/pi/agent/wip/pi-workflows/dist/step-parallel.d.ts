/**
 * Parallel step executors — concurrent step execution within a layer
 * or within a single parallel step declaration.
 */
import type nunjucks from "nunjucks";
import type { ExecutionLayer } from "./dag.js";
import type { ProgressWidgetState } from "./tui.js";
import type { ExecutionState, StepResult, StepSpec, WorkflowSpec } from "./types.js";
/** Options shared by parallel execution helpers. */
export interface ParallelOptions {
    ctx: any;
    pi: any;
    signal?: AbortSignal;
    loadAgent: (name: string) => any;
    runDir: string;
    spec: WorkflowSpec;
    widgetState: ProgressWidgetState;
    templateEnv?: nunjucks.Environment;
}
/** Callback type for executing a single step — injected to avoid circular imports. */
export type SingleStepExecutor = (stepName: string, stepSpec: StepSpec, state: ExecutionState, options: ParallelOptions) => Promise<boolean>;
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
export declare function executeParallelLayer(layer: ExecutionLayer, spec: WorkflowSpec, state: ExecutionState, executeSingleStep: SingleStepExecutor, options: ParallelOptions): Promise<void>;
/**
 * Execute a parallel step — runs all named sub-steps concurrently.
 *
 * Similar to executeParallelLayer but operates on sub-steps within
 * a single declared step. The parallel step's result aggregates
 * all sub-step results. Sub-step outputs are accessible via
 * `${{ steps.<parallelStepName>.output.<subStepName> }}`.
 */
export declare function executeParallelStep(parallelSpec: Record<string, StepSpec>, stepName: string, state: ExecutionState, executeSingleStep: SingleStepExecutor, options: ParallelOptions): Promise<StepResult>;
//# sourceMappingURL=step-parallel.d.ts.map