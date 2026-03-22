import type nunjucks from "nunjucks";
import type { AgentSpec, ExecutionState, LoopSpec, StepResult, StepSpec, WorkflowSpec } from "./types.js";
/** Options for executeLoop, including callback-injected dispatch to avoid circular imports. */
export interface LoopExecuteOptions {
    ctx: any;
    pi: any;
    signal?: AbortSignal;
    loadAgent: (name: string) => AgentSpec;
    dispatchAgent: (stepSpec: StepSpec, agentSpec: AgentSpec, prompt: string, opts: {
        cwd: string;
        sessionLogDir: string;
        stepName: string;
        signal?: AbortSignal;
    }) => Promise<StepResult>;
    runDir: string;
    spec: WorkflowSpec;
    templateEnv?: nunjucks.Environment;
    outputPath?: string;
}
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
export declare function executeLoop(loopSpec: LoopSpec, stepName: string, state: ExecutionState, options: LoopExecuteOptions): Promise<StepResult>;
//# sourceMappingURL=step-loop.d.ts.map