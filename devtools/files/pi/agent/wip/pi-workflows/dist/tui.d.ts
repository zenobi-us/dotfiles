/**
 * TUI progress widget for workflow execution.
 * Shows step status, timing, cost, and parallel execution indicators.
 */
import type { Theme } from "@mariozechner/pi-coding-agent";
import type { Component, TUI } from "@mariozechner/pi-tui";
import type { ExecutionState, WorkflowSpec } from "./types.js";
export interface StepActivity {
    tool: string;
    preview: string;
    timestamp: number;
}
export interface StepOutputSummary {
    tasks?: Array<{
        name: string;
        status: string;
        files?: string[];
    }>;
    testCount?: number;
    note?: string;
}
export interface ProgressWidgetState {
    spec: WorkflowSpec;
    state: ExecutionState;
    currentStep?: string;
    startTime: number;
    parallelSubSteps?: Record<string, import("./types.js").StepResult>;
    resumedSteps?: number;
    activities: Map<string, StepActivity[]>;
    outputSummaries: Map<string, StepOutputSummary>;
}
/**
 * Create a widget factory for ctx.ui.setWidget().
 * Returns a function that pi calls to get the component.
 *
 * The returned component renders a compact progress view:
 *   ─────────────────────────────────────
 *   ● bugfix  step 2/3              1m32s
 *     ✓ diagnose     42s   $0.03  12k tok
 *     ▸ fix           50s   8k tok...
 *     · verify
 *   ─────────────────────────────────────
 */
export declare function createProgressWidget(widgetState: ProgressWidgetState): (tui: TUI, theme: Theme) => Component & {
    dispose?(): void;
};
//# sourceMappingURL=tui.d.ts.map