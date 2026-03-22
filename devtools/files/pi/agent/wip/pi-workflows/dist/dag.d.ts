/**
 * DAG dependency analysis and execution planning for workflow steps.
 * Extracts `${{ steps.X }}` references, builds a dependency graph,
 * and produces layered execution plans for parallel dispatch.
 */
import type { WorkflowSpec } from "./types.js";
/**
 * A single layer in the execution plan.
 * All steps in a layer are independent and can run concurrently.
 */
export interface ExecutionLayer {
    steps: string[];
}
/**
 * The full execution plan: an ordered list of layers.
 * Steps in the same layer have no mutual dependencies.
 * Steps in layer N depend only on steps in layers 0..N-1.
 */
export type ExecutionPlan = ExecutionLayer[];
/**
 * Extract all step dependencies from a workflow spec.
 *
 * Scans all expression-bearing fields in each step:
 * - `input` values (recursive — expressions can be nested in objects/arrays)
 * - `when` condition
 * - `gate.check` (may contain ${{ }})
 * - `transform.mapping` values (recursive)
 * - `loop.attempts` (may be an expression)
 *
 * Does NOT descend into loop sub-steps — a loop step's internal steps
 * are the loop's own concern, not part of the top-level DAG.
 *
 * Returns a map: stepName → Set of step names it depends on.
 */
export declare function extractDependencies(spec: WorkflowSpec): Map<string, Set<string>>;
/**
 * Build an execution plan from a pre-computed dependency map.
 * Performs topological sort, grouping independent steps into layers.
 * Throws if the dependency graph contains a cycle.
 */
export declare function buildPlanFromDeps(allSteps: string[], deps: Map<string, Set<string>>): ExecutionPlan;
/**
 * Build an execution plan from a workflow spec.
 *
 * Performs topological sort, grouping independent steps into layers.
 * Steps within a layer can execute concurrently.
 *
 * Throws if the dependency graph contains a cycle.
 */
export declare function buildExecutionPlan(spec: WorkflowSpec): ExecutionPlan;
/**
 * Check if an execution plan is fully sequential
 * (every layer has exactly one step).
 */
export declare function isSequential(plan: ExecutionPlan): boolean;
//# sourceMappingURL=dag.d.ts.map