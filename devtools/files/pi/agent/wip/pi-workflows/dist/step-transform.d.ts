/**
 * Transform step executor — produces output by resolving expressions in a mapping.
 * No LLM call, no subprocess, no shell command — pure expression resolution.
 */
import type { StepResult, TransformSpec } from "./types.js";
/**
 * Execute a transform step: produces output by resolving expressions in the mapping.
 * No LLM call, no subprocess, no shell command — pure expression resolution.
 */
export declare function executeTransform(transform: TransformSpec, stepName: string, scope: Record<string, unknown>, runDir?: string, outputPath?: string): StepResult;
//# sourceMappingURL=step-transform.d.ts.map