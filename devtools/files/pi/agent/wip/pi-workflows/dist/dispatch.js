/**
 * Subprocess dispatch for workflow steps — spawns pi in JSON mode,
 * collects events, usage, and output. Supports cancellation and timeout.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SIGKILL_GRACE_MS } from "./step-shared.js";
/**
 * Prompt length threshold (chars) for switching to @file argument passing.
 * Avoids OS-level argument length limits (typically 128–256 KB) with headroom
 * for the rest of the CLI args. 8000 chars is well under all limits while
 * keeping short prompts as direct args for simplicity.
 */
const PROMPT_ARG_LIMIT = 8000;
/** Maximum stdout buffer size (10 MB) to prevent OOM from runaway subprocesses. */
const MAX_STDOUT_BYTES = 10 * 1024 * 1024;
export function extractText(content) {
    if (!content || !Array.isArray(content))
        return "";
    for (const part of content) {
        if (part && typeof part === "object" && "type" in part && part.type === "text" && "text" in part) {
            return String(part.text);
        }
    }
    return "";
}
export function extractToolArgsPreview(args) {
    if (!args || typeof args !== "object")
        return "";
    const obj = args;
    for (const key of ["command", "path", "pattern", "query", "task"]) {
        if (typeof obj[key] === "string") {
            const val = obj[key];
            return val.length > 60 ? val.slice(0, 57) + "..." : val;
        }
    }
    return "";
}
export function buildArgs(step, agentSpec, prompt, options) {
    const args = ["--mode", "json"];
    // Session log
    args.push("--session-dir", options.sessionLogDir);
    // Model: step > agent spec > model-config by role > model-config default
    const model = step.model ??
        agentSpec.model ??
        (agentSpec.role && options.modelConfig?.by_role?.[agentSpec.role]) ??
        options.modelConfig?.default;
    if (model) {
        const modelArg = `${model}:${agentSpec.thinking ?? "off"}`;
        args.push("--models", modelArg);
    }
    // Tool filtering
    if (agentSpec.tools?.length) {
        const builtinTools = [];
        const extensionPaths = [];
        for (const tool of agentSpec.tools) {
            if (tool.includes("/") || tool.endsWith(".ts") || tool.endsWith(".js")) {
                extensionPaths.push(tool);
            }
            else {
                builtinTools.push(tool);
            }
        }
        if (builtinTools.length > 0)
            args.push("--tools", builtinTools.join(","));
        for (const ext of extensionPaths)
            args.push("--extension", ext);
    }
    // Extension scoping
    if (agentSpec.extensions !== undefined) {
        args.push("--no-extensions");
        for (const ext of agentSpec.extensions)
            args.push("--extension", ext);
    }
    // Skill scoping
    if (agentSpec.skills?.length) {
        args.push("--no-skills");
        // Skills are injected via --append-system-prompt, not CLI flags
    }
    // System prompt (if agent spec has one)
    // Write to temp file if present, pass via --append-system-prompt
    // (handled in dispatch() body, not buildArgs)
    // Prompt — use @file for long prompts
    args.push("-p");
    args.push(prompt); // or @<tmpfile> if prompt > 8000 chars
    return args;
}
/**
 * Spawn a pi subprocess for a workflow step and collect the result.
 *
 * Builds CLI args from the step spec and agent spec.
 * Streams stdout as newline-delimited JSON.
 * Collects messages, usage, timing.
 * Returns StepResult when the process exits.
 */
export async function dispatch(step, agentSpec, prompt, options) {
    const startTime = Date.now();
    const args = buildArgs(step, agentSpec, prompt, options);
    // Handle long prompts: write to temp file
    let tmpDir = null;
    if (prompt.length > PROMPT_ARG_LIMIT) {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-wf-"));
        const promptFile = path.join(tmpDir, "prompt.md");
        fs.writeFileSync(promptFile, prompt, { mode: 0o600 });
        // Replace last two args ("-p", prompt) with ("-p", "@<file>")
        args[args.length - 1] = `@${promptFile}`;
    }
    // Handle system prompt: write to temp file
    if (agentSpec.systemPrompt) {
        if (!tmpDir)
            tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-wf-"));
        const sysFile = path.join(tmpDir, "system.md");
        fs.writeFileSync(sysFile, agentSpec.systemPrompt, { mode: 0o600 });
        // Insert before -p flag
        const pIdx = args.indexOf("-p");
        args.splice(pIdx, 0, "--append-system-prompt", sysFile);
    }
    const proc = spawn("pi", args, {
        cwd: options.cwd,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
    });
    // Cancellation support
    if (options.signal) {
        const kill = () => {
            proc.kill("SIGTERM");
            setTimeout(() => {
                if (!proc.killed)
                    proc.kill("SIGKILL");
            }, SIGKILL_GRACE_MS);
        };
        if (options.signal.aborted)
            kill();
        else
            options.signal.addEventListener("abort", kill, { once: true });
    }
    // Timeout support: SIGTERM after deadline, SIGKILL after 5s grace
    let timedOut = false;
    let timeoutTimer;
    let killTimer;
    if (options.timeoutMs) {
        timeoutTimer = setTimeout(() => {
            timedOut = true;
            proc.kill("SIGTERM");
            killTimer = setTimeout(() => {
                if (!proc.killed)
                    proc.kill("SIGKILL");
            }, SIGKILL_GRACE_MS);
        }, options.timeoutMs);
    }
    // Collect result
    const messages = [];
    const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 };
    let lastAssistantText = "";
    let stderrBuf = "";
    function processEvent(evt) {
        // Track messages
        if (evt.type === "message_end" && evt.message) {
            messages.push(evt.message);
            if (evt.message.role === "assistant") {
                usage.turns++;
                const u = evt.message.usage;
                if (u) {
                    usage.input += u.input || 0;
                    usage.output += u.output || 0;
                    usage.cacheRead += u.cacheRead || 0;
                    usage.cacheWrite += u.cacheWrite || 0;
                    usage.cost += u.cost?.total || 0;
                }
                // Extract text from last assistant message
                const text = extractText(evt.message.content);
                if (text)
                    lastAssistantText = text;
            }
        }
        // Forward to TUI callback
        if (options.onEvent) {
            options.onEvent({
                type: evt.type || "unknown",
                raw: evt,
                toolName: evt.type === "tool_execution_start" ? evt.toolName : undefined,
                toolArgs: evt.type === "tool_execution_start" ? extractToolArgsPreview(evt.args) : undefined,
                messageText: evt.type === "message_end" && evt.message?.role === "assistant"
                    ? extractText(evt.message.content)
                    : undefined,
                usage: evt.type === "message_end" && evt.message?.role === "assistant" && evt.message.usage
                    ? {
                        input: evt.message.usage.input,
                        output: evt.message.usage.output,
                        cost: evt.message.usage.cost?.total,
                    }
                    : undefined,
            });
        }
    }
    // Stream stdout as newline-delimited JSON
    let buf = "";
    let bufBytes = 0;
    let stdoutTruncated = false;
    proc.stdout.on("data", (chunk) => {
        bufBytes += chunk.length;
        if (bufBytes > MAX_STDOUT_BYTES) {
            if (!stdoutTruncated) {
                stdoutTruncated = true;
                // Process any remaining partial line in buf before discarding
                if (buf.trim()) {
                    try {
                        const evt = JSON.parse(buf);
                        processEvent(evt);
                    }
                    catch {
                        // incomplete JSON line — discard
                    }
                    buf = "";
                }
            }
            return;
        }
        buf += chunk.toString();
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const evt = JSON.parse(line);
                processEvent(evt);
            }
            catch {
                // Skip unparseable lines
            }
        }
    });
    proc.stderr.on("data", (chunk) => {
        stderrBuf += chunk.toString();
    });
    // Wait for process to exit
    const exitCode = await new Promise((resolve) => {
        proc.on("close", (code) => {
            // Process remaining buffer
            if (buf.trim()) {
                try {
                    const evt = JSON.parse(buf);
                    processEvent(evt);
                }
                catch {
                    // Skip unparseable remainder
                }
            }
            resolve(code);
        });
    });
    // Clear timeout timers
    if (timeoutTimer)
        clearTimeout(timeoutTimer);
    if (killTimer)
        clearTimeout(killTimer);
    // Cleanup temp files
    if (tmpDir) {
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        catch {
            // Best-effort cleanup
        }
    }
    // Timeout overrides exit code interpretation
    if (timedOut) {
        const warnings = [];
        if (stdoutTruncated) {
            warnings.push(`Stdout exceeded ${MAX_STDOUT_BYTES / (1024 * 1024)}MB limit — ` +
                `output stream was truncated at ${bufBytes} bytes. ` +
                `Usage counters (tokens, cost, turns) and textOutput may be incomplete.`);
        }
        return {
            step: options.stepName,
            agent: step.agent,
            status: "failed",
            output: undefined,
            textOutput: lastAssistantText,
            sessionLog: options.sessionLogDir,
            usage,
            durationMs: Date.now() - startTime,
            error: `Step timed out after ${options.timeoutMs / 1000}s`,
            truncated: stdoutTruncated || undefined,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    }
    const warnings = [];
    if (stdoutTruncated) {
        warnings.push(`Stdout exceeded ${MAX_STDOUT_BYTES / (1024 * 1024)}MB limit — ` +
            `output stream was truncated at ${bufBytes} bytes. ` +
            `Usage counters (tokens, cost, turns) and textOutput may be incomplete.`);
    }
    return {
        step: options.stepName,
        agent: step.agent,
        status: exitCode === 0 ? "completed" : "failed",
        output: undefined, // structured output handled by caller (workflow-executor)
        textOutput: lastAssistantText,
        sessionLog: options.sessionLogDir,
        usage,
        durationMs: Date.now() - startTime,
        error: exitCode !== 0 ? stderrBuf.trim() || "Process exited with code " + exitCode : undefined,
        truncated: stdoutTruncated || undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}
//# sourceMappingURL=dispatch.js.map