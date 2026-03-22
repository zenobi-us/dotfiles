import type { WorkflowSpec } from "./types.js";
/**
 * Discover all workflow specs from project, user, and builtin directories.
 *
 * Scans (highest priority first):
 *   1. .workflows/                (project-level, source: "project")
 *   2. ~/.pi/agent/workflows/     (user-level, source: "user")
 *   3. <package>/workflows/       (builtin workflows, source: "user")
 *
 * Higher-priority specs shadow lower-priority specs with the same name.
 *
 * @param cwd - current working directory (project root)
 * @param builtinDir - optional path to builtin workflows (defaults to workflows/ relative to package root)
 * @returns Array of parsed WorkflowSpec objects. Specs that fail parsing are
 *          skipped with a warning (logged to stderr), not thrown.
 */
export declare function discoverWorkflows(cwd: string, builtinDir?: string): WorkflowSpec[];
/**
 * Find a workflow by name from discovered workflows.
 * Returns undefined if not found.
 */
export declare function findWorkflow(name: string, cwd: string, builtinDir?: string): WorkflowSpec | undefined;
//# sourceMappingURL=workflow-discovery.d.ts.map