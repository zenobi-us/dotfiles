import { formatCost, formatDuration, formatTokens } from "./format.js";
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
export function createProgressWidget(widgetState) {
    return (tui, theme) => {
        /** Pulse interval (ms) for the elapsed-time ticker. Balances update frequency vs overhead. */
        const PULSE_INTERVAL_MS = 800;
        let pulseOn = true;
        const interval = setInterval(() => {
            pulseOn = !pulseOn;
            tui.requestRender();
        }, PULSE_INTERVAL_MS);
        return {
            render(width) {
                const lines = [];
                const stepNames = Object.keys(widgetState.spec.steps);
                const totalSteps = stepNames.length;
                // Parse current steps (may be comma-separated for parallel)
                const currentSteps = widgetState.currentStep?.split(", ") ?? [];
                const parallelCount = currentSteps.length;
                // Determine current step number
                let currentStepNum = 0;
                if (currentSteps.length > 0 && currentSteps[0]) {
                    const idx = stepNames.indexOf(currentSteps[0]);
                    currentStepNum = idx >= 0 ? idx + 1 : 0;
                }
                else {
                    // Count completed steps
                    currentStepNum = Object.values(widgetState.state.steps).filter((s) => s.status === "completed").length;
                }
                const elapsed = formatDuration(Date.now() - widgetState.startTime);
                const workflowName = theme.bold(widgetState.spec.name);
                const indicator = pulseOn ? theme.fg("accent", "\u25cf") : theme.fg("dim", "\u25cf");
                const parallelTag = parallelCount > 1 ? ` [${parallelCount} parallel]` : "";
                const headerLine = `${indicator} ${workflowName}  step ${currentStepNum}/${totalSteps}${parallelTag}  ${theme.fg("dim", elapsed)}`;
                lines.push(headerLine.length > width ? headerLine.slice(0, width) : headerLine);
                // Resumed indicator
                if (widgetState.resumedSteps) {
                    const resumedLine = `  ${theme.fg("dim", "\u21bb")} Resumed: ${widgetState.resumedSteps} steps from prior run`;
                    lines.push(resumedLine.length > width ? resumedLine.slice(0, width) : resumedLine);
                }
                // Paused indicator
                if (widgetState.state.status === "paused") {
                    const pausedLine = `  ${theme.fg("accent", "\u23f8")} Paused`;
                    lines.push(pausedLine.length > width ? pausedLine.slice(0, width) : pausedLine);
                }
                // Step lines
                for (const stepName of stepNames) {
                    const stepResult = widgetState.state.steps[stepName];
                    let line;
                    if (stepResult && stepResult.status === "skipped") {
                        // Skipped step: ⊘ stepName [skipped]
                        line = `  ${theme.fg("dim", "\u2298")} ${stepName} ${theme.fg("dim", "[skipped]")}`;
                    }
                    else if (stepResult && stepResult.status === "completed") {
                        const dur = formatDuration(stepResult.durationMs);
                        const cost = formatCost(stepResult.usage.cost);
                        const tok = formatTokens(stepResult.usage.input + stepResult.usage.output);
                        // Show step type indicator for gate/transform
                        const typeTag = stepResult.agent === "gate" ? " [gate]" : stepResult.agent === "transform" ? " [transform]" : "";
                        const truncTag = stepResult.truncated ? ` ${theme.fg("warning", "[truncated]")}` : "";
                        line = `  ${theme.fg("success", "\u2713")} ${stepName}${typeTag}  ${theme.fg("dim", dur)}  ${theme.fg("dim", cost)}  ${theme.fg("dim", tok)}${truncTag}`;
                        lines.push(line.length > width ? line.slice(0, width) : line);
                        // Render output summary sub-lines (capped at 3)
                        const summary = widgetState.outputSummaries?.get(stepName);
                        if (summary) {
                            let summaryLines = 0;
                            const MAX_SUMMARY_LINES = 3;
                            if (summary.tasks) {
                                for (const task of summary.tasks) {
                                    if (summaryLines >= MAX_SUMMARY_LINES)
                                        break;
                                    const files = task.files?.join(", ") || "";
                                    const statusIcon = task.status === "done" ? "\u2713" : task.status === "failed" ? "\u2717" : "\u00b7";
                                    const taskLine = `      ${theme.fg("dim", statusIcon)} ${theme.fg("dim", task.name)}${files ? "  " + theme.fg("dim", files) : ""}`;
                                    lines.push(taskLine.length > width ? taskLine.slice(0, width) : taskLine);
                                    summaryLines++;
                                }
                            }
                            if (summary.testCount && summaryLines < MAX_SUMMARY_LINES) {
                                const testLine = `      ${theme.fg("dim", `${summary.testCount} tests pass`)}`;
                                lines.push(testLine.length > width ? testLine.slice(0, width) : testLine);
                                summaryLines++;
                            }
                            if (summary.note && summaryLines < MAX_SUMMARY_LINES) {
                                const noteLine = `      ${theme.fg("dim", summary.note)}`;
                                lines.push(noteLine.length > width ? noteLine.slice(0, width) : noteLine);
                            }
                        }
                        continue; // skip the push below, already pushed
                    }
                    else if (stepResult && stepResult.status === "failed") {
                        const dur = formatDuration(stepResult.durationMs);
                        const errorPreview = stepResult.error || "Unknown error";
                        line = `  ${theme.fg("error", "\u2717")} ${stepName}  ${theme.fg("dim", dur)}  ${errorPreview}`;
                    }
                    else if (stepResult && stepResult.agent === "parallel") {
                        // Completed parallel step — show with sub-step count
                        const dur = formatDuration(stepResult.durationMs);
                        const cost = formatCost(stepResult.usage.cost);
                        const tok = formatTokens(stepResult.usage.input + stepResult.usage.output);
                        line = `  ${theme.fg("success", "\u2713")} ${stepName} [parallel]  ${theme.fg("dim", dur)}  ${theme.fg("dim", cost)}  ${theme.fg("dim", tok)}`;
                    }
                    else if (currentSteps.includes(stepName)) {
                        const stepElapsed = formatDuration(Date.now() - widgetState.startTime);
                        line = `  ${theme.fg("accent", "\u25b8")} ${theme.fg("accent", stepName)}  ${theme.fg("dim", stepElapsed + "...")}`;
                        lines.push(line.length > width ? line.slice(0, width) : line);
                        // Render most recent tool activity under running step
                        const activities = widgetState.activities?.get(stepName);
                        if (activities && activities.length > 0) {
                            const latest = activities[activities.length - 1];
                            const actLine = `      ${theme.fg("dim", latest.tool)} ${theme.fg("dim", latest.preview)}`;
                            lines.push(actLine.length > width ? actLine.slice(0, width) : actLine);
                        }
                        continue; // skip the push below, already pushed
                    }
                    else {
                        line = `  ${theme.fg("dim", "\u00b7")} ${stepName}`;
                    }
                    lines.push(line.length > width ? line.slice(0, width) : line);
                }
                return lines;
            },
            invalidate() {
                /* no cached state to clear */
            },
            dispose() {
                clearInterval(interval);
            },
        };
    };
}
//# sourceMappingURL=tui.js.map