import type { AgentSpec, StepResult, StepSpec, StepUsage } from "./types.js";
export interface ModelConfig {
    default?: string;
    by_role?: Record<string, string>;
}
export interface DispatchOptions {
    cwd: string;
    sessionLogDir: string;
    stepName: string;
    signal?: AbortSignal;
    timeoutMs?: number;
    onEvent?: (event: ProcessEvent) => void;
    modelConfig?: ModelConfig;
}
export interface ProcessEvent {
    type: string;
    raw: unknown;
    toolName?: string;
    toolArgs?: string;
    messageText?: string;
    usage?: Partial<StepUsage>;
}
export declare function extractText(content: unknown): string;
export declare function extractToolArgsPreview(args: unknown): string;
export declare function buildArgs(step: StepSpec, agentSpec: AgentSpec, prompt: string, options: DispatchOptions): string[];
/**
 * Spawn a pi subprocess for a workflow step and collect the result.
 *
 * Builds CLI args from the step spec and agent spec.
 * Streams stdout as newline-delimited JSON.
 * Collects messages, usage, timing.
 * Returns StepResult when the process exits.
 */
export declare function dispatch(step: StepSpec, agentSpec: AgentSpec, prompt: string, options: DispatchOptions): Promise<StepResult>;
//# sourceMappingURL=dispatch.d.ts.map