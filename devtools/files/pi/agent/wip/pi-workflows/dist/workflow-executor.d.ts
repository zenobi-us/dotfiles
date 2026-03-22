import { dispatch } from "./dispatch.js";
import { SIGKILL_GRACE_MS } from "./step-shared.js";
import type { AgentSpec, ExecutionState, WorkflowResult, WorkflowSpec } from "./types.js";
export { SIGKILL_GRACE_MS };
/** Set by the extension keybinding to request a pause after the current step. */
export declare function requestPause(): void;
export interface ExecuteOptions {
    /** pi extension context (for TUI, cwd, etc.) */
    ctx: any;
    /** pi extension API (for sendMessage) */
    pi: any;
    /** AbortSignal for cancellation (e.g. user presses Ctrl+C) */
    signal?: AbortSignal;
    /**
     * Agent spec loader. Given an agent name, returns the AgentSpec.
     * The executor does not know how to load agent specs — the caller provides this.
     * If the agent is not found, return a minimal spec with just the name.
     */
    loadAgent: (name: string) => AgentSpec;
    /** Injectable dispatch function for testing; defaults to real dispatch. */
    dispatchFn?: typeof dispatch;
    /** Project-level model config; loaded from .project/model-config.json if not provided. */
    modelConfig?: import("./dispatch.js").ModelConfig;
    /** Resume from an incomplete run instead of starting fresh. */
    resume?: {
        runId: string;
        runDir: string;
        state: ExecutionState;
    };
}
/** Retry context passed to step executors on retry attempts. */
export interface RetryContext {
    attempt: number;
    priorErrors: string[];
    steeringMessage?: string;
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
export declare function executeWorkflow(spec: WorkflowSpec, input: unknown, options: ExecuteOptions): Promise<WorkflowResult>;
//# sourceMappingURL=workflow-executor.d.ts.map