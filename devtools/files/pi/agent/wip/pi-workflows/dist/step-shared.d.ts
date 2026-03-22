import type nunjucks from "nunjucks";
import type { ProgressWidgetState } from "./tui.js";
import type { AgentSpec, ExecutionState, StepResult, StepUsage } from "./types.js";
/** Grace period (ms) between SIGTERM and SIGKILL when killing subprocesses. */
export declare const SIGKILL_GRACE_MS = 3000;
/** Widget ID used for the workflow progress widget. */
export declare const WIDGET_ID = "workflow-progress";
/** Default max loop attempts when not specified. */
export declare const DEFAULT_MAX_ATTEMPTS = 3;
/**
 * Helper that returns a StepUsage with all zeroes.
 */
export declare function zeroUsage(): StepUsage;
/**
 * Add step usage into a running total (mutates `total`).
 */
export declare function addUsage(total: StepUsage, step: StepUsage): void;
/**
 * Resolve a schema path relative to the workflow spec file.
 * If the schema path is absolute, return as-is.
 * If relative, resolve against the directory containing the workflow spec.
 */
export declare function resolveSchemaPath(schemaPath: string, specFilePath: string): string;
/**
 * Build the prompt string sent to the subprocess.
 *
 * The prompt includes:
 * 1. The compiled task template (if set), or the resolved input as context
 * 2. Output instructions (if schema-bound)
 */
export declare function buildPrompt(step: {
    agent?: string;
    input?: Record<string, unknown>;
    output?: {
        format?: string;
        schema?: string;
    };
}, agentSpec: AgentSpec, resolvedInput: unknown, runDir: string, stepName: string): string;
/**
 * Persist step result to state and update TUI widget.
 * Replaces the repeated writeState + setWidget pattern.
 */
export declare function persistStep(state: ExecutionState, stepName: string, result: StepResult, runDir: string, widgetState: ProgressWidgetState, ctx: {
    hasUI: boolean;
    ui: {
        setWidget(id: string, w: unknown): void;
        notify?(msg: string, level: string): void;
    };
}): void;
/**
 * Compile an agent spec: render system and task templates through Nunjucks.
 *
 * Every agent's prompts go through Nunjucks. Plain text without template
 * tags renders to itself. The .md that pi receives is compiled output.
 */
export declare function compileAgentSpec(agentSpec: AgentSpec, resolvedInput: unknown, templateEnv?: nunjucks.Environment): AgentSpec;
//# sourceMappingURL=step-shared.d.ts.map