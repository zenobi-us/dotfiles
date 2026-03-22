/**
 * Monitor step executor — runs a monitor's classification as a workflow
 * verification gate. Lightweight: reads monitor spec, loads patterns,
 * renders prompt (Nunjucks or inline), calls LLM, parses verdict.
 *
 * Does NOT depend on pi-behavior-monitors — implements just enough to
 * classify. No event handling, steering, ceiling, or escalation.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { complete } from "@mariozechner/pi-ai";
import nunjucks from "nunjucks";
import { persistStepOutput } from "./output.js";
import { zeroUsage } from "./step-shared.js";
// ── Discovery ────────────────────────────────────────────────────────────────
/**
 * Find a monitor spec by name. Searches:
 *   1. .pi/monitors/ (project)
 *   2. ~/.pi/agent/monitors/ (user)
 *   3. pi-behavior-monitors examples (if installed as peer)
 */
export function findMonitorSpec(monitorName, cwd) {
    const searchDirs = [
        path.join(cwd, ".pi", "monitors"),
        path.join(os.homedir(), ".pi", "agent", "monitors"),
    ];
    // Also check pi-behavior-monitors examples via node_modules
    try {
        const bmPath = require.resolve("@davidorex/pi-behavior-monitors/package.json", { paths: [cwd] });
        searchDirs.push(path.join(path.dirname(bmPath), "examples"));
    }
    catch {
        // pi-behavior-monitors not installed — skip
    }
    for (const dir of searchDirs) {
        const filePath = path.join(dir, `${monitorName}.monitor.json`);
        try {
            const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            if (raw.name && raw.classify && raw.patterns?.path) {
                return {
                    spec: {
                        name: raw.name,
                        classify: {
                            model: raw.classify.model ?? "claude-sonnet-4-20250514",
                            context: Array.isArray(raw.classify.context) ? raw.classify.context : [],
                            prompt: raw.classify.prompt ?? "",
                            promptTemplate: typeof raw.classify.promptTemplate === "string" ? raw.classify.promptTemplate : undefined,
                        },
                        patterns: { path: raw.patterns.path },
                        instructions: raw.instructions?.path ? { path: raw.instructions.path } : undefined,
                    },
                    dir,
                };
            }
        }
        catch {
            // file doesn't exist or is invalid — try next
        }
    }
    return null;
}
// ── Pattern & instruction loading ────────────────────────────────────────────
function loadPatterns(dir, patternsPath) {
    try {
        const resolved = path.resolve(dir, patternsPath);
        return JSON.parse(fs.readFileSync(resolved, "utf-8"));
    }
    catch {
        return [];
    }
}
function loadInstructions(dir, instructionsPath) {
    if (!instructionsPath)
        return [];
    try {
        const resolved = path.resolve(dir, instructionsPath);
        return JSON.parse(fs.readFileSync(resolved, "utf-8"));
    }
    catch {
        return [];
    }
}
function formatPatterns(patterns) {
    return patterns.map((p, i) => `${i + 1}. [${p.severity ?? "warning"}] ${p.description}`).join("\n");
}
function formatInstructions(instructions) {
    if (instructions.length === 0)
        return "";
    const lines = instructions.map((i) => `- ${i.text}`).join("\n");
    return `\nOperating instructions from the user (follow these strictly):\n${lines}\n`;
}
// ── Template rendering ───────────────────────────────────────────────────────
function createTemplateEnv(cwd) {
    const searchPaths = [];
    const projectDir = path.join(cwd, ".pi", "monitors");
    const userDir = path.join(os.homedir(), ".pi", "agent", "monitors");
    if (fs.existsSync(projectDir))
        searchPaths.push(projectDir);
    if (fs.existsSync(userDir))
        searchPaths.push(userDir);
    // pi-behavior-monitors examples
    try {
        const bmPath = require.resolve("@davidorex/pi-behavior-monitors/package.json", { paths: [cwd] });
        const exDir = path.join(path.dirname(bmPath), "examples");
        if (fs.existsSync(exDir))
            searchPaths.push(exDir);
    }
    catch {
        /* not installed */
    }
    const loader = searchPaths.length > 0 ? new nunjucks.FileSystemLoader(searchPaths) : undefined;
    return new nunjucks.Environment(loader, { autoescape: false, throwOnUndefined: false });
}
function renderPrompt(spec, dir, input, templateEnv) {
    const patterns = loadPatterns(dir, spec.patterns.path);
    if (patterns.length === 0)
        return null;
    const instructions = loadInstructions(dir, spec.instructions?.path);
    // Build context: patterns, instructions, plus any input fields
    const context = {
        patterns: formatPatterns(patterns),
        instructions: formatInstructions(instructions),
        iteration: 0,
        ...input,
    };
    if (spec.classify.promptTemplate) {
        try {
            return templateEnv.render(spec.classify.promptTemplate, context);
        }
        catch {
            // Fall through to inline prompt
            if (!spec.classify.prompt)
                return null;
        }
    }
    if (!spec.classify.prompt)
        return null;
    return spec.classify.prompt.replace(/\{(\w+)\}/g, (match, key) => {
        return String(context[key] ?? match);
    });
}
// ── Verdict parsing ──────────────────────────────────────────────────────────
function parseVerdict(raw) {
    const text = raw.trim();
    if (text.startsWith("CLEAN"))
        return { verdict: "clean" };
    if (text.startsWith("NEW:")) {
        const rest = text.slice(4);
        const pipe = rest.indexOf("|");
        if (pipe !== -1) {
            return { verdict: "new", pattern: rest.slice(0, pipe).trim(), description: rest.slice(pipe + 1).trim() };
        }
        return { verdict: "new", pattern: rest.trim(), description: rest.trim() };
    }
    if (text.startsWith("FLAG:"))
        return { verdict: "flag", description: text.slice(5).trim() };
    return { verdict: "clean" };
}
function extractText(parts) {
    return parts
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
}
/**
 * Execute a monitor step: discover monitor, render prompt, classify, return verdict.
 *
 * - CLEAN → status: "completed", output: { verdict: "clean" }
 * - FLAG  → status: "failed",    output: { verdict: "flag", description }
 * - NEW   → status: "failed",    output: { verdict: "new", pattern, description }
 */
export async function executeMonitor(monitorName, stepName, input, options) {
    const startTime = Date.now();
    // 1. Discover monitor
    const found = findMonitorSpec(monitorName, options.cwd);
    if (!found) {
        return {
            step: stepName,
            agent: `monitor:${monitorName}`,
            status: "failed",
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
            error: `Monitor '${monitorName}' not found`,
        };
    }
    const { spec, dir } = found;
    // 2. Render prompt
    const templateEnv = createTemplateEnv(options.cwd);
    const prompt = renderPrompt(spec, dir, input, templateEnv);
    if (!prompt) {
        return {
            step: stepName,
            agent: `monitor:${monitorName}`,
            status: "completed",
            output: { verdict: "clean", note: "No patterns loaded — nothing to classify" },
            textOutput: "CLEAN (no patterns)",
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
        };
    }
    // 3. Resolve model
    const { provider, modelId } = parseModelSpec(spec.classify.model);
    const model = options.ctx.modelRegistry.find(provider, modelId);
    if (!model) {
        return {
            step: stepName,
            agent: `monitor:${monitorName}`,
            status: "failed",
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
            error: `Model '${spec.classify.model}' not found in registry`,
        };
    }
    const apiKey = await options.ctx.modelRegistry.getApiKey(model);
    if (!apiKey) {
        return {
            step: stepName,
            agent: `monitor:${monitorName}`,
            status: "failed",
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
            error: `No API key for model '${spec.classify.model}'`,
        };
    }
    // 4. Classify
    let response;
    try {
        response = await complete(model, { messages: [{ role: "user", content: [{ type: "text", text: prompt }], timestamp: Date.now() }] }, { apiKey, maxTokens: 150, signal: options.signal });
    }
    catch (err) {
        if (options.signal?.aborted) {
            return {
                step: stepName,
                agent: `monitor:${monitorName}`,
                status: "failed",
                usage: zeroUsage(),
                durationMs: Date.now() - startTime,
                error: "Monitor classification cancelled",
            };
        }
        const msg = err instanceof Error ? err.message : String(err);
        return {
            step: stepName,
            agent: `monitor:${monitorName}`,
            status: "failed",
            usage: zeroUsage(),
            durationMs: Date.now() - startTime,
            error: `Classification failed: ${msg}`,
        };
    }
    // 5. Parse verdict
    const rawText = extractText(response.content);
    const verdict = parseVerdict(rawText);
    const durationMs = Date.now() - startTime;
    // Estimate usage from response
    const usage = zeroUsage();
    // Token counts not directly available from complete() — leave as zero
    const output = {
        verdict: verdict.verdict,
        ...(verdict.description ? { description: verdict.description } : {}),
        ...(verdict.pattern ? { pattern: verdict.pattern } : {}),
    };
    const result = {
        step: stepName,
        agent: `monitor:${monitorName}`,
        status: verdict.verdict === "clean" ? "completed" : "failed",
        output,
        textOutput: rawText.trim(),
        usage,
        durationMs,
        ...(verdict.verdict !== "clean" ? { error: verdict.description ?? "Monitor flagged an issue" } : {}),
    };
    if (options.runDir) {
        result.outputPath = persistStepOutput(options.runDir, stepName, output, rawText.trim(), options.outputPath);
    }
    return result;
}
// ── Utility ──────────────────────────────────────────────────────────────────
function parseModelSpec(spec) {
    const slashIndex = spec.indexOf("/");
    if (slashIndex !== -1) {
        return { provider: spec.slice(0, slashIndex), modelId: spec.slice(slashIndex + 1) };
    }
    return { provider: "anthropic", modelId: spec };
}
/**
 * List all discoverable monitor names for validation.
 */
export function availableMonitors(cwd) {
    const searchDirs = [
        path.join(cwd, ".pi", "monitors"),
        path.join(os.homedir(), ".pi", "agent", "monitors"),
    ];
    try {
        const bmPath = require.resolve("@davidorex/pi-behavior-monitors/package.json", { paths: [cwd] });
        searchDirs.push(path.join(path.dirname(bmPath), "examples"));
    }
    catch {
        /* not installed */
    }
    const seen = new Set();
    for (const dir of searchDirs) {
        try {
            for (const file of fs.readdirSync(dir)) {
                if (file.endsWith(".monitor.json")) {
                    seen.add(file.replace(".monitor.json", ""));
                }
            }
        }
        catch {
            /* dir doesn't exist */
        }
    }
    return Array.from(seen).sort();
}
//# sourceMappingURL=step-monitor.js.map