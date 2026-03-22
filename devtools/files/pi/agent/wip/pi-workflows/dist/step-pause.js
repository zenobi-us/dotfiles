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
export function executePause(stepName, message) {
    return {
        step: stepName,
        agent: "pause",
        status: "completed",
        output: message ? { message } : undefined,
        textOutput: message || "Workflow paused",
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 },
        durationMs: 0,
    };
}
//# sourceMappingURL=step-pause.js.map