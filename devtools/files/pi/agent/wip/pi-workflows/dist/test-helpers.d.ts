import type { StepSpec, WorkflowSpec } from "./types.js";
/**
 * Create a mock extension context for testing.
 */
export declare function mockCtx(cwd: string): any;
/**
 * Create a mock pi API for testing.
 */
export declare function mockPi(): any;
/**
 * Create a minimal WorkflowSpec for testing.
 * A fresh temp directory is created for filePath.
 */
export declare function makeSpec(overrides: Partial<WorkflowSpec> & {
    steps: Record<string, StepSpec>;
}): WorkflowSpec;
//# sourceMappingURL=test-helpers.d.ts.map