/**
 * Gate step executor — runs a shell command and passes/fails based on exit code.
 */
import type { GateSpec, StepResult } from "./types.js";
/**
 * Execute a gate step: runs a shell command, passes/fails based on exit code.
 *
 * The gate's check command is expected to already have ${{ }} expressions resolved
 * before being passed here.
 */
export declare function executeGate(gate: GateSpec, stepName: string, options: {
    cwd: string;
    signal?: AbortSignal;
    timeoutMs?: number;
    runDir?: string;
    outputPath?: string;
}): Promise<StepResult>;
//# sourceMappingURL=step-gate.d.ts.map