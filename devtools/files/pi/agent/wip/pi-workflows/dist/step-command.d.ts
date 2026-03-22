/**
 * Command step executor — runs a shell command and captures output as data.
 *
 * Unlike gate (which judges pass/fail), command captures stdout as structured
 * or text output for downstream steps. Non-zero exit codes produce a failed result.
 */
import type { StepResult } from "./types.js";
/**
 * Execute a command step: runs a shell command, captures stdout as output.
 *
 * The command string is expected to already have ${{ }} expressions resolved
 * before being passed here.
 */
export declare function executeCommand(command: string, stepName: string, options: {
    cwd: string;
    signal?: AbortSignal;
    timeoutMs?: number;
    runDir?: string;
    outputPath?: string;
}, outputFormat?: "json" | "text"): Promise<StepResult>;
//# sourceMappingURL=step-command.d.ts.map