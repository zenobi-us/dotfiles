import type nunjucks from "nunjucks";
import { dispatch } from "./dispatch.js";
import type { ProgressWidgetState } from "./tui.js";
import type { AgentSpec, ExecutionState, StepResult, StepSpec } from "./types.js";
/** Retry context passed from the executor on retry attempts. */
export interface RetryContext {
    attempt: number;
    priorErrors: string[];
    steeringMessage?: string;
}
export interface AgentStepOptions {
    ctx: any;
    signal?: AbortSignal;
    loadAgent: (name: string) => AgentSpec;
    runDir: string;
    specFilePath: string;
    widgetState: ProgressWidgetState;
    templateEnv?: nunjucks.Environment;
    dispatchFn?: typeof dispatch;
    modelConfig?: import("./dispatch.js").ModelConfig;
    retryContext?: RetryContext;
    onStepActivity?: (activity: {
        tool: string;
        preview: string;
        timestamp: number;
    }) => void;
}
/**
 * Execute an agent step: resolve input, render templates, dispatch subprocess,
 * validate output, persist result.
 *
 * Returns the StepResult.
 */
export declare function executeAgentStep(stepName: string, stepSpec: StepSpec, state: ExecutionState, options: AgentStepOptions): Promise<StepResult>;
//# sourceMappingURL=step-agent.d.ts.map