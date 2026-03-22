/**
 * Monitor step executor — runs a monitor's classification as a workflow
 * verification gate. Lightweight: reads monitor spec, loads patterns,
 * renders prompt (Nunjucks or inline), calls LLM, parses verdict.
 *
 * Does NOT depend on pi-behavior-monitors — implements just enough to
 * classify. No event handling, steering, ceiling, or escalation.
 */
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { StepResult } from "./types.js";
interface MonitorSpec {
    name: string;
    classify: {
        model: string;
        context: string[];
        prompt: string;
        promptTemplate?: string;
    };
    patterns: {
        path: string;
    };
    instructions?: {
        path: string;
    };
}
/**
 * Find a monitor spec by name. Searches:
 *   1. .pi/monitors/ (project)
 *   2. ~/.pi/agent/monitors/ (user)
 *   3. pi-behavior-monitors examples (if installed as peer)
 */
export declare function findMonitorSpec(monitorName: string, cwd: string): {
    spec: MonitorSpec;
    dir: string;
} | null;
export interface MonitorStepOptions {
    cwd: string;
    ctx: ExtensionContext;
    signal?: AbortSignal;
    runDir?: string;
    outputPath?: string;
}
/**
 * Execute a monitor step: discover monitor, render prompt, classify, return verdict.
 *
 * - CLEAN → status: "completed", output: { verdict: "clean" }
 * - FLAG  → status: "failed",    output: { verdict: "flag", description }
 * - NEW   → status: "failed",    output: { verdict: "new", pattern, description }
 */
export declare function executeMonitor(monitorName: string, stepName: string, input: Record<string, unknown>, options: MonitorStepOptions): Promise<StepResult>;
/**
 * List all discoverable monitor names for validation.
 */
export declare function availableMonitors(cwd: string): string[];
export {};
//# sourceMappingURL=step-monitor.d.ts.map