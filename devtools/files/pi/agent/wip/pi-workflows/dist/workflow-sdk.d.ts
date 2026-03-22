import { EXPRESSION_ROOTS, FILTER_NAMES } from "./expression.js";
import type { AgentSpec, WorkflowSpec } from "./types.js";
import type { StepTypeDescriptor } from "./workflow-spec.js";
import { STEP_TYPES } from "./workflow-spec.js";
export type { StepTypeDescriptor };
export { EXPRESSION_ROOTS, FILTER_NAMES, STEP_TYPES };
export declare function filterNames(): string[];
export declare function stepTypes(): StepTypeDescriptor[];
export declare function expressionRoots(): readonly string[];
export declare function availableAgents(cwd: string, builtinDir?: string): AgentSpec[];
export declare function availableTemplates(cwd: string, builtinDir?: string): string[];
export declare function availableSchemas(cwd: string, builtinDir?: string): string[];
export declare function availableWorkflows(cwd: string): WorkflowSpec[];
export interface ExpressionRef {
    expression: string;
    field: string;
    stepRefs: string[];
    filterName?: string;
}
/**
 * Extract all ${{ }} expressions from a workflow spec with their source locations.
 * Walks the entire spec tree including nested steps in loops and parallel blocks.
 */
export declare function extractExpressions(spec: WorkflowSpec): ExpressionRef[];
export declare function declaredSteps(spec: WorkflowSpec): string[];
export declare function declaredAgentRefs(spec: WorkflowSpec): string[];
export declare function declaredMonitorRefs(spec: WorkflowSpec): string[];
export declare function declaredSchemaRefs(spec: WorkflowSpec): string[];
export interface ValidationIssue {
    severity: "error" | "warning";
    message: string;
    field: string;
}
export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
}
/**
 * Validate a workflow spec against the filesystem: resolve agents, schemas,
 * step references, and filter names. Returns structured issues rather than
 * throwing — intended for authoring-time validation, not execution-time.
 */
export declare function validateWorkflow(spec: WorkflowSpec, cwd: string): ValidationResult;
//# sourceMappingURL=workflow-sdk.d.ts.map