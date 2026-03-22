import type { WorkflowSpec } from "./types.js";
/** Descriptor for a workflow step type — used by SDK and spec validation. */
export interface StepTypeDescriptor {
    name: string;
    field: string;
    retryable: boolean;
    supportsInput: boolean;
    supportsOutput: boolean;
}
/** Step type registry — add a step type here, parsing and SDK both see it automatically. */
export declare const STEP_TYPES: StepTypeDescriptor[];
/** Set of valid step type field names — derived from STEP_TYPES. */
export declare const STEP_TYPE_FIELDS: Set<string>;
/**
 * Error class for spec parsing failures.
 */
export declare class WorkflowSpecError extends Error {
    readonly filePath: string;
    readonly reason: string;
    constructor(filePath: string, reason: string);
}
/**
 * Parse a YAML string into a WorkflowSpec.
 * Validates structure (required fields, types).
 * Does NOT validate JSON Schemas or resolve agent references — that happens at execution time.
 *
 * @param content - raw YAML string
 * @param filePath - absolute path to the file (stored on the spec, used in error messages)
 * @param source - "user" or "project"
 * @throws WorkflowSpecError on invalid structure
 */
export declare function parseWorkflowSpec(content: string, filePath: string, source: "user" | "project"): WorkflowSpec;
//# sourceMappingURL=workflow-spec.d.ts.map