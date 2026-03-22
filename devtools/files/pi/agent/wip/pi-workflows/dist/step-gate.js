/**
 * Gate step executor — runs a shell command and passes/fails based on exit code.
 */
import { persistStepOutput } from "./output.js";
import { SIGKILL_GRACE_MS, zeroUsage } from "./step-shared.js";
/**
 * Execute a gate step: runs a shell command, passes/fails based on exit code.
 *
 * The gate's check command is expected to already have ${{ }} expressions resolved
 * before being passed here.
 */
export async function executeGate(gate, stepName, options) {
    const startTime = Date.now();
    try {
        const { spawn } = await import("node:child_process");
        const output = await new Promise((resolve, reject) => {
            const proc = spawn("sh", ["-c", gate.check], {
                cwd: options.cwd,
                stdio: ["ignore", "pipe", "pipe"],
                detached: true,
            });
            let stdout = "";
            let stderr = "";
            let settled = false;
            proc.stdout.on("data", (d) => {
                stdout += d.toString();
            });
            proc.stderr.on("data", (d) => {
                stderr += d.toString();
            });
            // Kill the entire process group (sh + children like sleep)
            const killProc = () => {
                if (!proc.pid)
                    return;
                try {
                    process.kill(-proc.pid, "SIGTERM");
                }
                catch {
                    /* already dead */
                }
                setTimeout(() => {
                    if (!proc.pid)
                        return;
                    try {
                        process.kill(-proc.pid, "SIGKILL");
                    }
                    catch {
                        /* already dead */
                    }
                }, SIGKILL_GRACE_MS);
            };
            // Handle abort signal (from parallel cancellation or timeout)
            const onAbort = () => {
                killProc();
            };
            if (options.signal) {
                if (options.signal.aborted) {
                    killProc();
                }
                else {
                    options.signal.addEventListener("abort", onAbort, { once: true });
                }
            }
            // Handle step-level timeout
            let timeoutId;
            if (options.timeoutMs) {
                timeoutId = setTimeout(() => {
                    killProc();
                }, options.timeoutMs);
            }
            proc.on("close", (code) => {
                if (settled)
                    return;
                settled = true;
                if (timeoutId)
                    clearTimeout(timeoutId);
                if (options.signal)
                    options.signal.removeEventListener("abort", onAbort);
                if (code === 0) {
                    resolve(stdout);
                }
                else {
                    const err = new Error(`Process exited with code ${code}`);
                    err.status = code;
                    err.stdout = stdout;
                    err.stderr = stderr;
                    reject(err);
                }
            });
            proc.on("error", (err) => {
                if (settled)
                    return;
                settled = true;
                if (timeoutId)
                    clearTimeout(timeoutId);
                if (options.signal)
                    options.signal.removeEventListener("abort", onAbort);
                reject(err);
            });
        });
        const gateOutput = { passed: true, exitCode: 0, output: output.trim() };
        const result = {
            step: stepName,
            agent: "gate",
            status: "completed",
            textOutput: output.trim(),
            output: gateOutput,
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
        };
        if (options.runDir) {
            result.outputPath = persistStepOutput(options.runDir, stepName, gateOutput, undefined, options.outputPath);
        }
        return result;
    }
    catch (err) {
        const execErr = err;
        const exitCode = execErr.status ?? 1;
        const stderr = execErr.stderr?.trim() ?? "";
        const stdout = execErr.stdout?.trim() ?? "";
        const gateOutput = { passed: false, exitCode, output: stderr || stdout };
        const result = {
            step: stepName,
            agent: "gate",
            status: "completed",
            textOutput: stderr || stdout,
            output: gateOutput,
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
        };
        if (options.runDir) {
            result.outputPath = persistStepOutput(options.runDir, stepName, gateOutput, undefined, options.outputPath);
        }
        return result;
    }
}
//# sourceMappingURL=step-gate.js.map