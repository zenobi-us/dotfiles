/**
 * Pause step executor — halts workflow execution at a deliberate checkpoint.
 * The workflow can be resumed later via /workflow resume or Ctrl+J.
 */
import type { StepResult } from "./types.js";
/**
 * Execute a pause step.
 *
 * Returns a completed result immediately. The executor is responsible
 * for setting state.status = "paused" and stopping the loop.
 *
 * @param stepName - name of the pause step
 * @param message - optional message to display (from pause field)
 * @returns StepResult with status "completed"
 */
export declare function executePause(stepName: string, message?: string): StepResult;
//# sourceMappingURL=step-pause.d.ts.map