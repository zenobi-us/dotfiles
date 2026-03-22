/**
 * Command step executor — runs a shell command and captures output as data.
 *
 * Unlike gate (which judges pass/fail), command captures stdout as structured
 * or text output for downstream steps. Non-zero exit codes produce a failed result.
 */
import { persistStepOutput } from "./output.js";
import { SIGKILL_GRACE_MS, zeroUsage } from "./step-shared.js";
/**
 * Execute a command step: runs a shell command, captures stdout as output.
 *
 * The command string is expected to already have ${{ }} expressions resolved
 * before being passed here.
 */
export async function executeCommand(command, stepName, options, outputFormat) {
    const startTime = Date.now();
    try {
        const { spawn } = await import("node:child_process");
        const { stdout, stderr } = await new Promise((resolve, reject) => {
            const proc = spawn("sh", ["-c", command], {
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
                    resolve({ stdout, stderr });
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
        // Exit 0: parse output
        let output;
        let textOutput;
        if (outputFormat === "json") {
            try {
                output = JSON.parse(stdout);
            }
            catch {
                output = { text: stdout.trim() };
            }
            textOutput = stdout.trim();
        }
        else {
            textOutput = stdout.trim();
            output = { text: textOutput };
        }
        const result = {
            step: stepName,
            agent: "command",
            status: "completed",
            output,
            textOutput,
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
        };
        if (options.runDir) {
            result.outputPath = persistStepOutput(options.runDir, stepName, output, textOutput, options.outputPath);
        }
        return result;
    }
    catch (err) {
        const execErr = err;
        const exitCode = execErr.status ?? 1;
        const stderr = execErr.stderr?.trim() ?? "";
        const stdout = execErr.stdout?.trim() ?? "";
        const result = {
            step: stepName,
            agent: "command",
            status: "failed",
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
            error: `Command failed (exit ${exitCode}): ${stderr || stdout || execErr.message || "unknown error"}`,
        };
        if (options.runDir) {
            persistStepOutput(options.runDir, stepName, { error: result.error, exitCode }, undefined, options.outputPath);
        }
        return result;
    }
}
//# sourceMappingURL=step-command.js.map