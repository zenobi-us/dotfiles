import type { CompletionSpec, WorkflowResult } from "./types.js";
/**
 * Resolve a completion spec into the final message string injected into
 * the main LLM conversation after workflow execution.
 *
 * Two forms:
 * - Template: the template string is resolved with ${{ }} expressions
 *   and returned as the full content.
 * - Message + include: the message is resolved, then each include path
 *   is resolved and appended as structured data.
 *
 * @param spec - the CompletionSpec from the workflow YAML
 * @param result - the completed WorkflowResult
 * @param executionInput - the original workflow input
 * @returns the resolved message string
 */
export declare function resolveCompletion(spec: CompletionSpec, result: WorkflowResult, executionInput: unknown): string;
//# sourceMappingURL=completion.d.ts.map