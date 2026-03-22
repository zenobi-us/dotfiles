/**
 * Behavior monitors for pi — watches agent activity, classifies against
 * pattern libraries, steers corrections, and writes structured findings
 * to JSON files for downstream consumption.
 *
 * Monitor definitions are JSON files (.monitor.json) with typed blocks:
 * classify (LLM side-channel), patterns (JSON library), actions (steer + write).
 * Patterns and instructions are JSON arrays conforming to schemas.
 */
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { complete } from "@mariozechner/pi-ai";
import { getAgentDir } from "@mariozechner/pi-coding-agent";
import { Box, Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import nunjucks from "nunjucks";
const EXTENSION_DIR = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = path.join(EXTENSION_DIR, "examples");
export const COLLECTOR_DESCRIPTORS = [
  { name: "user_text", description: "Most recent user message text" },
  { name: "assistant_text", description: "Most recent assistant message text" },
  {
    name: "tool_results",
    description: "Tool results with tool name and error status",
    limits: "Last 5, truncated 2000 chars",
  },
  {
    name: "tool_calls",
    description: "Tool calls and results interleaved",
    limits: "Last 20, truncated 2000 chars",
  },
  {
    name: "custom_messages",
    description: "Custom extension messages since last user message",
  },
  {
    name: "project_vision",
    description: ".project/project.json vision, core_value, name",
  },
  {
    name: "project_conventions",
    description: ".project/conformance-reference.json principle names",
  },
  {
    name: "git_status",
    description: "Output of git status --porcelain",
    limits: "5s timeout",
  },
];
export const WHEN_CONDITIONS = [
  {
    name: "always",
    description: "Fire every time the event occurs",
    parameterized: false,
  },
  {
    name: "has_tool_results",
    description: "Fire only if tool results present since last user message",
    parameterized: false,
  },
  {
    name: "has_file_writes",
    description:
      "Fire only if write or edit tool called since last user message",
    parameterized: false,
  },
  {
    name: "has_bash",
    description: "Fire only if bash tool called since last user message",
    parameterized: false,
  },
  {
    name: "every(N)",
    description:
      "Fire every Nth activation (counter resets when user text changes)",
    parameterized: true,
  },
  {
    name: "tool(name)",
    description:
      "Fire only if specific named tool called since last user message",
    parameterized: true,
  },
];
export const VERDICT_TYPES = ["clean", "flag", "new"];
export const SCOPE_TARGETS = ["main", "subagent", "all", "workflow"];
export const VALID_EVENTS = new Set([
  "message_end",
  "turn_end",
  "agent_end",
  "command",
]);
function isValidEvent(event) {
  return VALID_EVENTS.has(event);
}
// =============================================================================
// Discovery
// =============================================================================
function discoverMonitors() {
  const dirs = [];
  // project-local
  let cwd = process.cwd();
  while (true) {
    const candidate = path.join(cwd, ".pi", "monitors");
    if (isDir(candidate)) {
      dirs.push(candidate);
      break;
    }
    const parent = path.dirname(cwd);
    if (parent === cwd) break;
    cwd = parent;
  }
  // global
  const globalDir = path.join(getAgentDir(), "monitors");
  if (isDir(globalDir)) dirs.push(globalDir);
  const seen = new Map();
  for (const dir of dirs) {
    for (const file of listMonitorFiles(dir)) {
      const monitor = parseMonitorJson(path.join(dir, file), dir);
      if (monitor && !seen.has(monitor.name)) {
        seen.set(monitor.name, monitor);
      }
    }
  }
  return Array.from(seen.values());
}
function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
function listMonitorFiles(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith(".monitor.json"));
  } catch {
    return [];
  }
}
function parseMonitorJson(filePath, dir) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
  let spec;
  try {
    spec = JSON.parse(raw);
  } catch {
    console.error(`[monitors] Failed to parse ${filePath}`);
    return null;
  }
  const name = spec.name;
  if (!name) return null;
  const event = String(spec.event ?? "message_end");
  if (!isValidEvent(event)) {
    console.error(
      `[${name}] Invalid event: ${event}. Must be one of: ${[...VALID_EVENTS].join(", ")}`,
    );
    return null;
  }
  const classify = spec.classify;
  if (!classify?.prompt && !classify?.promptTemplate) {
    console.error(
      `[${name}] Missing classify.prompt or classify.promptTemplate`,
    );
    return null;
  }
  const patternsSpec = spec.patterns;
  if (!patternsSpec?.path) {
    console.error(`[${name}] Missing patterns.path`);
    return null;
  }
  const scope = spec.scope;
  const instructions = spec.instructions;
  const actions = spec.actions;
  return {
    name,
    description: String(spec.description ?? ""),
    event: event,
    when: String(spec.when ?? "always"),
    scope: scope ?? { target: "main" },
    classify: {
      model: classify.model ?? "claude-sonnet-4-20250514",
      context: Array.isArray(classify.context)
        ? classify.context
        : ["tool_results", "assistant_text"],
      excludes: Array.isArray(classify.excludes) ? classify.excludes : [],
      prompt: classify.prompt ?? "",
      promptTemplate:
        typeof classify.promptTemplate === "string"
          ? classify.promptTemplate
          : undefined,
    },
    patterns: {
      path: patternsSpec.path,
      learn: patternsSpec.learn !== false,
    },
    instructions: {
      path: instructions?.path ?? `${name}.instructions.json`,
    },
    actions: actions ?? {},
    ceiling: Number(spec.ceiling) || 5,
    escalate: spec.escalate === "dismiss" ? "dismiss" : "ask",
    dir,
    resolvedPatternsPath: path.resolve(dir, patternsSpec.path),
    resolvedInstructionsPath: path.resolve(
      dir,
      instructions?.path ?? `${name}.instructions.json`,
    ),
    // runtime state
    activationCount: 0,
    whileCount: 0,
    lastUserText: "",
    dismissed: false,
  };
}
// =============================================================================
// Example seeding
// =============================================================================
function resolveProjectMonitorsDir() {
  let cwd = process.cwd();
  while (true) {
    const piDir = path.join(cwd, ".pi");
    if (isDir(piDir)) return path.join(piDir, "monitors");
    const parent = path.dirname(cwd);
    if (parent === cwd) break;
    cwd = parent;
  }
  return path.join(process.cwd(), ".pi", "monitors");
}
function seedExamples() {
  if (discoverMonitors().length > 0) return 0;
  if (!isDir(EXAMPLES_DIR)) return 0;
  const targetDir = resolveProjectMonitorsDir();
  fs.mkdirSync(targetDir, { recursive: true });
  if (listMonitorFiles(targetDir).length > 0) return 0;
  const files = fs.readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith(".json"));
  let copied = 0;
  for (const file of files) {
    const dest = path.join(targetDir, file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(EXAMPLES_DIR, file), dest);
      copied++;
    }
  }
  return copied;
}
// =============================================================================
// Context collection
// =============================================================================
const TRUNCATE = 2000;
function extractText(parts) {
  return parts
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}
function extractUserText(parts) {
  if (typeof parts === "string") return parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}
function trunc(text) {
  return text.length <= TRUNCATE
    ? text
    : `${text.slice(0, TRUNCATE)} [TRUNCATED]`;
}
function isMessageEntry(entry) {
  return entry.type === "message";
}
function collectUserText(branch) {
  let foundAssistant = false;
  for (let i = branch.length - 1; i >= 0; i--) {
    const entry = branch[i];
    if (!isMessageEntry(entry)) continue;
    if (!foundAssistant) {
      if (entry.message.role === "assistant") foundAssistant = true;
      continue;
    }
    if (entry.message.role === "user")
      return extractUserText(entry.message.content);
  }
  return "";
}
function collectAssistantText(branch) {
  for (let i = branch.length - 1; i >= 0; i--) {
    const entry = branch[i];
    if (isMessageEntry(entry) && entry.message.role === "assistant") {
      return extractText(entry.message.content);
    }
  }
  return "";
}
function collectToolResults(branch, limit = 5) {
  const results = [];
  for (let i = branch.length - 1; i >= 0 && results.length < limit; i--) {
    const entry = branch[i];
    if (!isMessageEntry(entry) || entry.message.role !== "toolResult") continue;
    const text = extractUserText(entry.message.content);
    if (text)
      results.push(
        `---\n[${entry.message.toolName}${entry.message.isError ? " ERROR" : ""}] ${trunc(text)}\n---`,
      );
  }
  return results.reverse().join("\n");
}
function collectToolCalls(branch, limit = 20) {
  const calls = [];
  for (let i = branch.length - 1; i >= 0 && calls.length < limit; i--) {
    const entry = branch[i];
    if (!isMessageEntry(entry)) continue;
    const msg = entry.message;
    if (msg.role === "assistant") {
      for (const part of msg.content) {
        if (part.type === "toolCall") {
          calls.push(
            `[call ${part.name}] ${trunc(JSON.stringify(part.arguments ?? {}))}`,
          );
        }
      }
    }
    if (msg.role === "toolResult") {
      calls.push(
        `[result ${msg.toolName}${msg.isError ? " ERROR" : ""}] ${trunc(extractUserText(msg.content))}`,
      );
    }
  }
  return calls.reverse().join("\n");
}
function collectCustomMessages(branch) {
  const msgs = [];
  for (let i = branch.length - 1; i >= 0; i--) {
    const entry = branch[i];
    if (!isMessageEntry(entry)) continue;
    if (entry.message.role === "user") break;
    const msg = entry.message;
    if (msg.customType) {
      msgs.unshift(`[${msg.customType}] ${msg.content ?? ""}`);
    }
  }
  return msgs.join("\n");
}
function collectProjectVision(_branch) {
  try {
    const projectPath = path.join(process.cwd(), ".project", "project.json");
    const raw = JSON.parse(fs.readFileSync(projectPath, "utf-8"));
    const parts = [];
    if (raw.vision) parts.push(`Vision: ${raw.vision}`);
    if (raw.core_value) parts.push(`Core value: ${raw.core_value}`);
    if (raw.name) parts.push(`Project: ${raw.name}`);
    return parts.join("\n");
  } catch {
    return "";
  }
}
function collectProjectConventions(_branch) {
  try {
    const confPath = path.join(
      process.cwd(),
      ".project",
      "conformance-reference.json",
    );
    const raw = JSON.parse(fs.readFileSync(confPath, "utf-8"));
    if (Array.isArray(raw.items)) {
      return raw.items.map((item) => `- ${item.name ?? item.id}`).join("\n");
    }
    return "";
  } catch {
    return "";
  }
}
function collectGitStatus(_branch) {
  try {
    return execSync("git status --porcelain", {
      cwd: process.cwd(),
      encoding: "utf-8",
      timeout: 5000,
    }).trim();
  } catch {
    return "";
  }
}
const collectors = {
  user_text: collectUserText,
  assistant_text: collectAssistantText,
  tool_results: collectToolResults,
  tool_calls: collectToolCalls,
  custom_messages: collectCustomMessages,
  project_vision: collectProjectVision,
  project_conventions: collectProjectConventions,
  git_status: collectGitStatus,
};
/** Collector names derived from the runtime registry — used for consistency testing. */
export const COLLECTOR_NAMES = Object.keys(collectors);
function hasToolResults(branch) {
  for (let i = branch.length - 1; i >= 0; i--) {
    const entry = branch[i];
    if (!isMessageEntry(entry)) continue;
    if (entry.message.role === "user") break;
    if (entry.message.role === "toolResult") return true;
  }
  return false;
}
function hasToolNamed(branch, name) {
  for (let i = branch.length - 1; i >= 0; i--) {
    const entry = branch[i];
    if (!isMessageEntry(entry)) continue;
    if (entry.message.role === "user") break;
    if (entry.message.role === "assistant") {
      for (const part of entry.message.content) {
        if (part.type === "toolCall" && part.name === name) return true;
      }
    }
  }
  return false;
}
// =============================================================================
// When evaluation
// =============================================================================
function evaluateWhen(monitor, branch) {
  const w = monitor.when;
  if (w === "always") return true;
  if (w === "has_tool_results") return hasToolResults(branch);
  if (w === "has_file_writes")
    return hasToolNamed(branch, "write") || hasToolNamed(branch, "edit");
  if (w === "has_bash") return hasToolNamed(branch, "bash");
  const everyMatch = w.match(/^every\((\d+)\)$/);
  if (everyMatch) {
    const n = parseInt(everyMatch[1]);
    const userText = collectUserText(branch);
    if (userText !== monitor.lastUserText) {
      monitor.activationCount = 0;
      monitor.lastUserText = userText;
    }
    monitor.activationCount++;
    if (monitor.activationCount >= n) {
      monitor.activationCount = 0;
      return true;
    }
    return false;
  }
  const toolMatch = w.match(/^tool\((\w+)\)$/);
  if (toolMatch) return hasToolNamed(branch, toolMatch[1]);
  return true;
}
// =============================================================================
// Template rendering (JSON patterns → text for LLM prompt)
// =============================================================================
function loadPatterns(monitor) {
  try {
    const raw = fs.readFileSync(monitor.resolvedPatternsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function formatPatternsForPrompt(patterns) {
  return patterns
    .map((p, i) => `${i + 1}. [${p.severity ?? "warning"}] ${p.description}`)
    .join("\n");
}
function loadInstructions(monitor) {
  try {
    const raw = fs.readFileSync(monitor.resolvedInstructionsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function saveInstructions(monitor, instructions) {
  const tmpPath = `${monitor.resolvedInstructionsPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(instructions, null, 2) + "\n");
    fs.renameSync(tmpPath, monitor.resolvedInstructionsPath);
    return null;
  } catch (err) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* cleanup */
    }
    return err instanceof Error ? err.message : String(err);
  }
}
export function parseMonitorsArgs(args, knownNames) {
  const trimmed = args.trim();
  if (!trimmed) return { type: "list" };
  const tokens = trimmed.split(/\s+/);
  const first = tokens[0];
  // global commands (only if not a monitor name)
  if (!knownNames.has(first)) {
    if (first === "on") return { type: "on" };
    if (first === "off") return { type: "off" };
    return {
      type: "error",
      message: `Unknown monitor: ${first}\nAvailable: ${[...knownNames].join(", ")}`,
    };
  }
  const name = first;
  if (tokens.length === 1) return { type: "inspect", name };
  const verb = tokens[1];
  if (verb === "rules") {
    if (tokens.length === 2) return { type: "rules-list", name };
    const action = tokens[2];
    if (action === "add") {
      const text = tokens.slice(3).join(" ");
      if (!text)
        return {
          type: "error",
          message: "Usage: /monitors <name> rules add <text>",
        };
      return { type: "rules-add", name, text };
    }
    if (action === "remove") {
      const n = parseInt(tokens[3]);
      if (isNaN(n) || n < 1)
        return {
          type: "error",
          message: "Usage: /monitors <name> rules remove <number>",
        };
      return { type: "rules-remove", name, index: n };
    }
    if (action === "replace") {
      const n = parseInt(tokens[3]);
      const text = tokens.slice(4).join(" ");
      if (isNaN(n) || n < 1 || !text)
        return {
          type: "error",
          message: "Usage: /monitors <name> rules replace <number> <text>",
        };
      return { type: "rules-replace", name, index: n, text };
    }
    return {
      type: "error",
      message: `Unknown rules action: ${action}\nAvailable: add, remove, replace`,
    };
  }
  if (verb === "patterns") return { type: "patterns-list", name };
  if (verb === "dismiss") return { type: "dismiss", name };
  if (verb === "reset") return { type: "reset", name };
  return {
    type: "error",
    message: `Unknown subcommand: ${verb}\nAvailable: rules, patterns, dismiss, reset`,
  };
}
function handleList(monitors, ctx, enabled) {
  const header = enabled
    ? "monitors: ON"
    : "monitors: OFF (all monitoring paused)";
  const lines = monitors.map((m) => {
    const state = m.dismissed
      ? "dismissed"
      : m.whileCount > 0
        ? `engaged (${m.whileCount}/${m.ceiling})`
        : "idle";
    const scope = m.scope.target !== "main" ? ` [scope:${m.scope.target}]` : "";
    return `  ${m.name} [${m.event}${m.when !== "always" ? `, when: ${m.when}` : ""}]${scope} — ${state}`;
  });
  ctx.ui.notify(`${header}\n${lines.join("\n")}`, "info");
}
function handleInspect(monitor, ctx) {
  const rules = loadInstructions(monitor);
  const patterns = loadPatterns(monitor);
  const state = monitor.dismissed
    ? "dismissed"
    : monitor.whileCount > 0
      ? `engaged (${monitor.whileCount}/${monitor.ceiling})`
      : "idle";
  const lines = [
    `[${monitor.name}] ${monitor.description}`,
    `event: ${monitor.event}, when: ${monitor.when}, scope: ${monitor.scope.target}`,
    `state: ${state}, ceiling: ${monitor.ceiling}, escalate: ${monitor.escalate}`,
    `rules: ${rules.length}, patterns: ${patterns.length}`,
  ];
  ctx.ui.notify(lines.join("\n"), "info");
}
function handleRulesList(monitor, ctx) {
  const rules = loadInstructions(monitor);
  if (rules.length === 0) {
    ctx.ui.notify(`[${monitor.name}] (no rules)`, "info");
    return;
  }
  const lines = rules.map((r, i) => `${i + 1}. ${r.text}`);
  ctx.ui.notify(`[${monitor.name}] rules:\n${lines.join("\n")}`, "info");
}
function handleRulesAdd(monitor, ctx, text) {
  const rules = loadInstructions(monitor);
  rules.push({ text, added_at: new Date().toISOString() });
  const err = saveInstructions(monitor, rules);
  if (err) {
    ctx.ui.notify(`[${monitor.name}] Failed to save: ${err}`, "error");
  } else {
    ctx.ui.notify(`[${monitor.name}] Rule added: ${text}`, "info");
  }
}
function handleRulesRemove(monitor, ctx, index) {
  const rules = loadInstructions(monitor);
  if (index < 1 || index > rules.length) {
    ctx.ui.notify(
      `[${monitor.name}] Invalid index ${index}. Have ${rules.length} rules.`,
      "error",
    );
    return;
  }
  const removed = rules.splice(index - 1, 1)[0];
  const err = saveInstructions(monitor, rules);
  if (err) {
    ctx.ui.notify(`[${monitor.name}] Failed to save: ${err}`, "error");
  } else {
    ctx.ui.notify(
      `[${monitor.name}] Removed rule ${index}: ${removed.text}`,
      "info",
    );
  }
}
function handleRulesReplace(monitor, ctx, index, text) {
  const rules = loadInstructions(monitor);
  if (index < 1 || index > rules.length) {
    ctx.ui.notify(
      `[${monitor.name}] Invalid index ${index}. Have ${rules.length} rules.`,
      "error",
    );
    return;
  }
  const old = rules[index - 1].text;
  rules[index - 1] = { text, added_at: new Date().toISOString() };
  const err = saveInstructions(monitor, rules);
  if (err) {
    ctx.ui.notify(`[${monitor.name}] Failed to save: ${err}`, "error");
  } else {
    ctx.ui.notify(
      `[${monitor.name}] Replaced rule ${index}:\n  was: ${old}\n  now: ${text}`,
      "info",
    );
  }
}
function handlePatternsList(monitor, ctx) {
  const patterns = loadPatterns(monitor);
  if (patterns.length === 0) {
    ctx.ui.notify(
      `[${monitor.name}] (no patterns — monitor will not classify)`,
      "info",
    );
    return;
  }
  const lines = patterns.map((p, i) => {
    const source = p.source ? ` (${p.source})` : "";
    return `${i + 1}. [${p.severity ?? "warning"}] ${p.description}${source}`;
  });
  ctx.ui.notify(`[${monitor.name}] patterns:\n${lines.join("\n")}`, "info");
}
function formatInstructionsForPrompt(instructions) {
  if (instructions.length === 0) return "";
  const lines = instructions.map((i) => `- ${i.text}`).join("\n");
  return `\nOperating instructions from the user (follow these strictly):\n${lines}\n`;
}
/**
 * Create a Nunjucks environment for monitor prompt templates.
 * Three-tier search: project monitors dir > user monitors dir > package examples.
 */
function createMonitorTemplateEnv() {
  const projectDir = resolveProjectMonitorsDir();
  const userDir = path.join(os.homedir(), ".pi", "agent", "monitors");
  const searchPaths = [];
  if (isDir(projectDir)) searchPaths.push(projectDir);
  if (isDir(userDir)) searchPaths.push(userDir);
  if (isDir(EXAMPLES_DIR)) searchPaths.push(EXAMPLES_DIR);
  const loader =
    searchPaths.length > 0
      ? new nunjucks.FileSystemLoader(searchPaths)
      : undefined;
  return new nunjucks.Environment(loader, {
    autoescape: false,
    throwOnUndefined: false,
  });
}
/** Module-level template environment, initialized in extension entry point. */
let monitorTemplateEnv;
function renderClassifyPrompt(monitor, branch) {
  const patterns = loadPatterns(monitor);
  if (patterns.length === 0) return null;
  const instructions = loadInstructions(monitor);
  const collected = {};
  for (const key of monitor.classify.context) {
    const fn = collectors[key];
    if (fn) collected[key] = fn(branch);
    else collected[key] = ""; // unknown collectors produce empty string (graceful degradation)
  }
  const context = {
    patterns: formatPatternsForPrompt(patterns),
    instructions: formatInstructionsForPrompt(instructions),
    iteration: monitor.whileCount,
    ...collected,
  };
  if (monitor.classify.promptTemplate && monitorTemplateEnv) {
    // Nunjucks template file
    try {
      return monitorTemplateEnv.render(
        monitor.classify.promptTemplate,
        context,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[${monitor.name}] Template render failed (${monitor.classify.promptTemplate}): ${msg}`,
      );
      // Fall through to inline prompt if available
      if (!monitor.classify.prompt) return null;
    }
  }
  // Fallback: inline string with {placeholder} replacement
  if (!monitor.classify.prompt) return null;
  return monitor.classify.prompt.replace(/\{(\w+)\}/g, (match, key) => {
    return String(context[key] ?? match);
  });
}
// =============================================================================
// Classification
// =============================================================================
export function parseVerdict(raw) {
  const text = raw.trim();
  if (text.startsWith("CLEAN")) return { verdict: "clean" };
  if (text.startsWith("NEW:")) {
    const rest = text.slice(4);
    const pipe = rest.indexOf("|");
    if (pipe !== -1)
      return {
        verdict: "new",
        newPattern: rest.slice(0, pipe).trim(),
        description: rest.slice(pipe + 1).trim(),
      };
    return {
      verdict: "new",
      newPattern: rest.trim(),
      description: rest.trim(),
    };
  }
  if (text.startsWith("FLAG:"))
    return { verdict: "flag", description: text.slice(5).trim() };
  return { verdict: "clean" };
}
export function parseModelSpec(spec) {
  const slashIndex = spec.indexOf("/");
  if (slashIndex !== -1) {
    return {
      provider: spec.slice(0, slashIndex),
      modelId: spec.slice(slashIndex + 1),
    };
  }
  return { provider: "anthropic", modelId: spec };
}
async function classifyPrompt(ctx, monitor, prompt, signal) {
  const { provider, modelId } = parseModelSpec(monitor.classify.model);
  const model = ctx.modelRegistry.find(provider, modelId);
  if (!model) throw new Error(`Model ${monitor.classify.model} not found`);
  const apiKey = await ctx.modelRegistry.getApiKey(model);
  if (!apiKey) throw new Error(`No API key for ${monitor.classify.model}`);
  const response = await complete(
    model,
    {
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
          timestamp: Date.now(),
        },
      ],
    },
    { apiKey, maxTokens: 150, signal },
  );
  return parseVerdict(extractText(response.content));
}
// =============================================================================
// Pattern learning (JSON)
// =============================================================================
function learnPattern(monitor, description) {
  const patterns = loadPatterns(monitor);
  const id = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);
  // dedup by description
  if (patterns.some((p) => p.description === description)) return;
  patterns.push({
    id,
    description,
    severity: "warning",
    source: "learned",
    learned_at: new Date().toISOString(),
  });
  const tmpPath = `${monitor.resolvedPatternsPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(patterns, null, 2) + "\n");
    fs.renameSync(tmpPath, monitor.resolvedPatternsPath);
  } catch (err) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* cleanup */
    }
    console.error(
      `[${monitor.name}] Failed to write pattern: ${err instanceof Error ? err.message : err}`,
    );
  }
}
// =============================================================================
// Action execution — write findings to JSON files
// =============================================================================
export function generateFindingId(monitorName, _description) {
  return `${monitorName}-${Date.now().toString(36)}`;
}
function executeWriteAction(monitor, action, result) {
  if (!action.write) return;
  const writeCfg = action.write;
  const filePath = path.isAbsolute(writeCfg.path)
    ? writeCfg.path
    : path.resolve(process.cwd(), writeCfg.path);
  // Build the entry from template, substituting placeholders
  const findingId = generateFindingId(
    monitor.name,
    result.description ?? "unknown",
  );
  const entry = {};
  for (const [key, tmpl] of Object.entries(writeCfg.template)) {
    entry[key] = String(tmpl)
      .replace(/\{finding_id\}/g, findingId)
      .replace(/\{description\}/g, result.description ?? "Issue detected")
      .replace(/\{severity\}/g, "warning")
      .replace(/\{monitor_name\}/g, monitor.name)
      .replace(/\{timestamp\}/g, new Date().toISOString());
  }
  // Read existing file or create structure
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    // file doesn't exist or is invalid — create fresh
  }
  const arrayField = writeCfg.array_field;
  if (!Array.isArray(data[arrayField])) {
    data[arrayField] = [];
  }
  const arr = data[arrayField];
  if (writeCfg.merge === "upsert") {
    const idx = arr.findIndex((item) => item.id === entry.id);
    if (idx !== -1) {
      arr[idx] = entry;
    } else {
      arr.push(entry);
    }
  } else {
    arr.push(entry);
  }
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n");
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* cleanup */
    }
    console.error(
      `[${monitor.name}] Failed to write to ${filePath}: ${err instanceof Error ? err.message : err}`,
    );
  }
}
// =============================================================================
// Activation
// =============================================================================
let monitorsEnabled = true;
async function activate(
  monitor,
  pi,
  ctx,
  branch,
  steeredThisTurn,
  updateStatus,
  pendingAgentEndSteers,
) {
  if (!monitorsEnabled) return;
  if (monitor.dismissed) return;
  // check excludes
  for (const ex of monitor.classify.excludes) {
    if (steeredThisTurn.has(ex)) return;
  }
  if (!evaluateWhen(monitor, branch)) return;
  // dedup: skip if user text unchanged since last classification
  const currentUserText = collectUserText(branch);
  if (currentUserText && currentUserText === monitor.lastUserText) return;
  // ceiling check
  if (monitor.whileCount >= monitor.ceiling) {
    await escalate(monitor, pi, ctx);
    updateStatus();
    return;
  }
  const prompt = renderClassifyPrompt(monitor, branch);
  if (!prompt) return;
  // create an abort controller so classification can be cancelled if the user aborts
  const abortController = new AbortController();
  const onAbort = () => abortController.abort();
  const unsubAbort = pi.events.on("monitors:abort", onAbort);
  let result;
  try {
    result = await classifyPrompt(ctx, monitor, prompt, abortController.signal);
  } catch (e) {
    if (abortController.signal.aborted) return;
    const message = e instanceof Error ? e.message : String(e);
    if (ctx.hasUI) {
      ctx.ui.notify(
        `[${monitor.name}] Classification failed: ${message}`,
        "error",
      );
    } else {
      console.error(`[${monitor.name}] Classification failed: ${message}`);
    }
    return;
  } finally {
    unsubAbort();
  }
  // mark this user text as classified
  monitor.lastUserText = currentUserText;
  if (result.verdict === "clean") {
    const cleanAction = monitor.actions.on_clean;
    if (cleanAction) {
      executeWriteAction(monitor, cleanAction, result);
    }
    monitor.whileCount = 0;
    updateStatus();
    return;
  }
  // Determine which action to execute
  const action =
    result.verdict === "new" ? monitor.actions.on_new : monitor.actions.on_flag;
  if (!action) return;
  // Learn new pattern
  if (result.verdict === "new" && result.newPattern && action.learn_pattern) {
    learnPattern(monitor, result.newPattern);
  }
  // Execute write action (findings to JSON file)
  executeWriteAction(monitor, action, result);
  // Steer (inject message into conversation) — only for main scope
  if (action.steer && monitor.scope.target === "main") {
    const description = result.description ?? "Issue detected";
    const annotation = result.verdict === "new" ? " — new pattern learned" : "";
    const details = {
      monitorName: monitor.name,
      verdict: result.verdict,
      description,
      steer: action.steer,
      whileCount: monitor.whileCount + 1,
      ceiling: monitor.ceiling,
    };
    const content = `[${monitor.name}] ${description}${annotation}. ${action.steer}`;
    if (monitor.event === "agent_end" || monitor.event === "command") {
      // Already post-loop or command context: deliver immediately
      pi.sendMessage(
        { customType: "monitor-steer", content, display: true, details },
        { deliverAs: "steer", triggerTurn: true },
      );
    } else {
      // message_end / turn_end: buffer for drain at agent_end
      // (pi's async event queue means these handlers run after the agent loop
      // has already checked getSteeringMessages — direct sendMessage misses
      // the window and the steer arrives one response late)
      pendingAgentEndSteers.push({ monitor, details, content });
    }
  }
  monitor.whileCount++;
  steeredThisTurn.add(monitor.name);
  updateStatus();
}
async function escalate(monitor, pi, ctx) {
  if (monitor.escalate === "dismiss") {
    monitor.dismissed = true;
    monitor.whileCount = 0;
    return;
  }
  // In headless mode there is no way to prompt the user, so auto-dismiss
  // to avoid an infinite classify-reset cycle that can never be resolved.
  if (!ctx.hasUI) {
    monitor.dismissed = true;
    monitor.whileCount = 0;
    return;
  }
  if (ctx.hasUI) {
    const choice = await ctx.ui.confirm(
      `[${monitor.name}] Steered ${monitor.ceiling} times`,
      "Continue steering, or dismiss this monitor for the session?",
    );
    if (!choice) {
      monitor.dismissed = true;
      monitor.whileCount = 0;
      return;
    }
  }
  monitor.whileCount = 0;
}
// =============================================================================
// Extension entry point
// =============================================================================
export default function (pi) {
  const seeded = seedExamples();
  const monitors = discoverMonitors();
  if (monitors.length === 0) return;
  // Initialize Nunjucks template environment for monitor prompt templates
  monitorTemplateEnv = createMonitorTemplateEnv();
  let statusCtx;
  function updateStatus() {
    if (!statusCtx?.hasUI) return;
    const theme = statusCtx.ui.theme;
    if (!monitorsEnabled) {
      statusCtx.ui.setStatus(
        "monitors",
        `${theme.fg("dim", "monitors:")}${theme.fg("warning", "OFF")}`,
      );
      return;
    }
    const engaged = monitors.filter((m) => m.whileCount > 0 && !m.dismissed);
    const dismissed = monitors.filter((m) => m.dismissed);
    if (engaged.length === 0 && dismissed.length === 0) {
      const count = theme.fg("dim", `${monitors.length}`);
      statusCtx.ui.setStatus(
        "monitors",
        `${theme.fg("dim", "monitors:")}${count}`,
      );
      return;
    }
    const parts = [];
    for (const m of engaged) {
      parts.push(
        theme.fg("warning", `${m.name}(${m.whileCount}/${m.ceiling})`),
      );
    }
    if (dismissed.length > 0) {
      parts.push(theme.fg("dim", `${dismissed.length} dismissed`));
    }
    statusCtx.ui.setStatus(
      "monitors",
      `${theme.fg("dim", "monitors:")}${parts.join(" ")}`,
    );
  }
  pi.on("session_start", async (_event, ctx) => {
    try {
      statusCtx = ctx;
      if (seeded > 0 && ctx.hasUI) {
        const dir = resolveProjectMonitorsDir();
        ctx.ui.notify(
          `Seeded ${seeded} example monitor files into ${dir}\nEdit or delete them to customize.`,
          "info",
        );
      }
      updateStatus();
    } catch {
      /* startup errors should not block session */
    }
  });
  pi.on("session_switch", async (_event, ctx) => {
    statusCtx = ctx;
    for (const m of monitors) {
      m.whileCount = 0;
      m.dismissed = false;
      m.lastUserText = "";
      m.activationCount = 0;
    }
    monitorsEnabled = true;
    pendingAgentEndSteers = [];
    updateStatus();
  });
  // ── Tool: monitors-status ──────────────────────────────────────────────
  pi.registerTool({
    name: "monitors-status",
    label: "Monitors Status",
    description: "List all behavior monitors with their current state.",
    promptSnippet: "List all behavior monitors with their current state",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      const status = monitors.map((m) => ({
        name: m.name,
        description: m.description,
        event: m.event,
        when: m.when,
        enabled: monitorsEnabled,
        dismissed: m.dismissed,
        whileCount: m.whileCount,
        ceiling: m.ceiling,
      }));
      return {
        details: undefined,
        content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
      };
    },
  });
  // ── Tool: monitors-inspect ─────────────────────────────────────────────
  pi.registerTool({
    name: "monitors-inspect",
    label: "Monitors Inspect",
    description:
      "Inspect a monitor — config, state, pattern count, rule count.",
    promptSnippet:
      "Inspect a monitor — config, state, pattern count, rule count",
    parameters: Type.Object({
      monitor: Type.String({ description: "Monitor name" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const monitor = monitors.find((m) => m.name === params.monitor);
      if (!monitor) throw new Error(`Unknown monitor: ${params.monitor}`);
      const patterns = loadPatterns(monitor);
      const instructions = loadInstructions(monitor);
      const state = monitor.dismissed
        ? "dismissed"
        : monitor.whileCount > 0
          ? `engaged (${monitor.whileCount}/${monitor.ceiling})`
          : "idle";
      const info = {
        name: monitor.name,
        description: monitor.description,
        event: monitor.event,
        when: monitor.when,
        scope: monitor.scope,
        classify: {
          model: monitor.classify.model,
          context: monitor.classify.context,
          excludes: monitor.classify.excludes,
        },
        patterns: {
          path: monitor.patterns.path,
          learn: monitor.patterns.learn,
          count: patterns.length,
        },
        instructions: {
          path: monitor.instructions.path,
          count: instructions.length,
        },
        actions: monitor.actions,
        ceiling: monitor.ceiling,
        escalate: monitor.escalate,
        state,
        enabled: monitorsEnabled,
        dismissed: monitor.dismissed,
        whileCount: monitor.whileCount,
      };
      return {
        details: undefined,
        content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      };
    },
  });
  // ── Tool: monitors-control ─────────────────────────────────────────────
  pi.registerTool({
    name: "monitors-control",
    label: "Monitors Control",
    description: "Control monitors — enable, disable, dismiss, or reset.",
    promptSnippet: "Control monitors — enable, disable, dismiss, or reset",
    parameters: Type.Object({
      action: Type.Union([
        Type.Literal("on"),
        Type.Literal("off"),
        Type.Literal("dismiss"),
        Type.Literal("reset"),
      ]),
      monitor: Type.Optional(
        Type.String({
          description: "Monitor name (required for dismiss/reset)",
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      if (params.action === "on") {
        monitorsEnabled = true;
        updateStatus();
        return {
          details: undefined,
          content: [{ type: "text", text: "Monitors enabled" }],
        };
      }
      if (params.action === "off") {
        monitorsEnabled = false;
        updateStatus();
        return {
          details: undefined,
          content: [
            { type: "text", text: "All monitors paused for this session" },
          ],
        };
      }
      if (params.action === "dismiss") {
        if (!params.monitor)
          throw new Error("Monitor name required for dismiss");
        const monitor = monitors.find((m) => m.name === params.monitor);
        if (!monitor) throw new Error(`Unknown monitor: ${params.monitor}`);
        monitor.dismissed = true;
        updateStatus();
        return {
          details: undefined,
          content: [
            {
              type: "text",
              text: `[${monitor.name}] Dismissed for this session`,
            },
          ],
        };
      }
      // reset
      if (!params.monitor) throw new Error("Monitor name required for reset");
      const monitor = monitors.find((m) => m.name === params.monitor);
      if (!monitor) throw new Error(`Unknown monitor: ${params.monitor}`);
      monitor.dismissed = false;
      monitor.whileCount = 0;
      updateStatus();
      return {
        details: undefined,
        content: [
          {
            type: "text",
            text: `[${monitor.name}] Reset — dismissed=false, whileCount=0`,
          },
        ],
      };
    },
  });
  // ── Tool: monitors-rules ───────────────────────────────────────────────
  pi.registerTool({
    name: "monitors-rules",
    label: "Monitors Rules",
    description:
      "Manage monitor rules — list, add, remove, or replace calibration rules.",
    promptSnippet:
      "Manage monitor rules — list, add, remove, or replace calibration rules",
    parameters: Type.Object({
      monitor: Type.String({ description: "Monitor name" }),
      action: Type.Union([
        Type.Literal("list"),
        Type.Literal("add"),
        Type.Literal("remove"),
        Type.Literal("replace"),
      ]),
      text: Type.Optional(
        Type.String({ description: "Rule text (for add/replace)" }),
      ),
      index: Type.Optional(
        Type.Number({
          description: "Rule index, 1-based (for remove/replace)",
        }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const monitor = monitors.find((m) => m.name === params.monitor);
      if (!monitor) throw new Error(`Unknown monitor: ${params.monitor}`);
      if (params.action === "list") {
        const rules = loadInstructions(monitor);
        return {
          details: undefined,
          content: [{ type: "text", text: JSON.stringify(rules, null, 2) }],
        };
      }
      if (params.action === "add") {
        if (!params.text) throw new Error("text parameter required for add");
        const rules = loadInstructions(monitor);
        rules.push({ text: params.text, added_at: new Date().toISOString() });
        const err = saveInstructions(monitor, rules);
        if (err) throw new Error(`Failed to save rules: ${err}`);
        return {
          details: undefined,
          content: [
            {
              type: "text",
              text: `Rule added to [${monitor.name}]: ${params.text}`,
            },
          ],
        };
      }
      if (params.action === "remove") {
        if (params.index === undefined)
          throw new Error("index parameter required for remove");
        const rules = loadInstructions(monitor);
        if (params.index < 1 || params.index > rules.length) {
          throw new Error(
            `Invalid index ${params.index}. Have ${rules.length} rules.`,
          );
        }
        const removed = rules.splice(params.index - 1, 1)[0];
        const err = saveInstructions(monitor, rules);
        if (err) throw new Error(`Failed to save rules: ${err}`);
        return {
          details: undefined,
          content: [
            {
              type: "text",
              text: `Removed rule ${params.index} from [${monitor.name}]: ${removed.text}`,
            },
          ],
        };
      }
      // replace
      if (params.index === undefined)
        throw new Error("index parameter required for replace");
      if (!params.text) throw new Error("text parameter required for replace");
      const rules = loadInstructions(monitor);
      if (params.index < 1 || params.index > rules.length) {
        throw new Error(
          `Invalid index ${params.index}. Have ${rules.length} rules.`,
        );
      }
      const old = rules[params.index - 1].text;
      rules[params.index - 1] = {
        text: params.text,
        added_at: new Date().toISOString(),
      };
      const err = saveInstructions(monitor, rules);
      if (err) throw new Error(`Failed to save rules: ${err}`);
      return {
        details: undefined,
        content: [
          {
            type: "text",
            text: `Replaced rule ${params.index} in [${monitor.name}]:\n  was: ${old}\n  now: ${params.text}`,
          },
        ],
      };
    },
  });
  // ── Tool: monitors-patterns ────────────────────────────────────────────
  pi.registerTool({
    name: "monitors-patterns",
    label: "Monitors Patterns",
    description: "List patterns for a behavior monitor.",
    promptSnippet: "List patterns for a behavior monitor",
    parameters: Type.Object({
      monitor: Type.String({ description: "Monitor name" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const monitor = monitors.find((m) => m.name === params.monitor);
      if (!monitor) throw new Error(`Unknown monitor: ${params.monitor}`);
      const patterns = loadPatterns(monitor);
      return {
        details: undefined,
        content: [{ type: "text", text: JSON.stringify(patterns, null, 2) }],
      };
    },
  });
  // --- message renderer ---
  pi.registerMessageRenderer(
    "monitor-steer",
    (message, { expanded }, theme) => {
      const details = message.details;
      if (!details) {
        const box = new Box(1, 1, (t) => theme.bg("customMessageBg", t));
        box.addChild(new Text(String(message.content), 0, 0));
        return box;
      }
      const verdictColor = details.verdict === "new" ? "warning" : "error";
      const prefix = theme.fg(verdictColor, `[${details.monitorName}]`);
      const desc = ` ${details.description}`;
      const counter = theme.fg(
        "dim",
        ` (${details.whileCount}/${details.ceiling})`,
      );
      let text = `${prefix}${desc}${counter}`;
      if (details.verdict === "new") {
        text += theme.fg("dim", " — new pattern learned");
      }
      text += `\n${theme.fg("muted", details.steer)}`;
      if (expanded) {
        text += `\n${theme.fg("dim", `verdict: ${details.verdict}`)}`;
      }
      const box = new Box(1, 1, (t) => theme.bg("customMessageBg", t));
      box.addChild(new Text(text, 0, 0));
      return box;
    },
  );
  // --- abort support + buffered steer drain ---
  pi.on("agent_end", async () => {
    pi.events.emit("monitors:abort", undefined);
    // Drain buffered steers from message_end/turn_end monitors.
    // The _agentEventQueue guarantees this runs AFTER all turn_end/message_end
    // handlers complete (sequential promise chain), so the buffer is populated.
    // Deliver only the first — the corrected response will re-trigger monitors
    // if additional issues remain.
    if (pendingAgentEndSteers.length > 0) {
      const first = pendingAgentEndSteers[0];
      pendingAgentEndSteers = [];
      pi.sendMessage(
        {
          customType: "monitor-steer",
          content: first.content,
          display: true,
          details: first.details,
        },
        { deliverAs: "steer", triggerTurn: true },
      );
    }
  });
  // --- buffered steers for message_end/turn_end monitors ---
  // These monitors classify during the agent loop but can't inject steers in time
  // (pi's async event queue means extension handlers run after the agent loop checks
  // getSteeringMessages). Buffer steers here, drain at agent_end.
  let pendingAgentEndSteers = [];
  // --- per-turn exclusion tracking ---
  let steeredThisTurn = new Set();
  pi.on("turn_start", () => {
    steeredThisTurn = new Set();
  });
  // group monitors by validated event
  const byEvent = new Map();
  for (const m of monitors) {
    const list = byEvent.get(m.event) ?? [];
    list.push(m);
    byEvent.set(m.event, list);
  }
  // wire event handlers
  for (const [event, group] of byEvent) {
    if (event === "command") {
      for (const m of group) {
        pi.registerCommand(m.name, {
          description: m.description || `Run ${m.name} monitor`,
          handler: async (_args, ctx) => {
            const branch = ctx.sessionManager.getBranch();
            await activate(
              m,
              pi,
              ctx,
              branch,
              steeredThisTurn,
              updateStatus,
              pendingAgentEndSteers,
            );
          },
        });
      }
    } else if (event === "message_end") {
      pi.on("message_end", async (ev, ctx) => {
        if (ev.message.role !== "assistant") return;
        const branch = ctx.sessionManager.getBranch();
        for (const m of group) {
          await activate(
            m,
            pi,
            ctx,
            branch,
            steeredThisTurn,
            updateStatus,
            pendingAgentEndSteers,
          );
        }
      });
    } else if (event === "turn_end") {
      pi.on("turn_end", async (_ev, ctx) => {
        const branch = ctx.sessionManager.getBranch();
        for (const m of group) {
          await activate(
            m,
            pi,
            ctx,
            branch,
            steeredThisTurn,
            updateStatus,
            pendingAgentEndSteers,
          );
        }
      });
    } else if (event === "agent_end") {
      pi.on("agent_end", async (_ev, ctx) => {
        const branch = ctx.sessionManager.getBranch();
        for (const m of group) {
          await activate(
            m,
            pi,
            ctx,
            branch,
            steeredThisTurn,
            updateStatus,
            pendingAgentEndSteers,
          );
        }
      });
    }
  }
  // /monitors command — unified management interface
  const monitorNames = new Set(monitors.map((m) => m.name));
  const monitorsByName = new Map(monitors.map((m) => [m.name, m]));
  const monitorVerbs = ["rules", "patterns", "dismiss", "reset"];
  const rulesActions = ["add", "remove", "replace"];
  pi.registerCommand("monitors", {
    description: "Manage behavior monitors",
    getArgumentCompletions(argumentPrefix) {
      const tokens = argumentPrefix.split(/\s+/);
      const last = tokens[tokens.length - 1];
      // Level 0: no complete token yet — show global commands + monitor names
      if (tokens.length <= 1) {
        const items = [
          { value: "on", label: "on", description: "Enable all monitoring" },
          { value: "off", label: "off", description: "Pause all monitoring" },
          ...Array.from(monitorNames).map((n) => ({
            value: n,
            label: n,
            description: `${monitorsByName.get(n)?.description ?? ""} → rules|patterns|dismiss|reset`,
          })),
        ];
        return items.filter((i) => i.value.startsWith(last));
      }
      const name = tokens[0];
      // Level 1: monitor name entered — show verbs
      if (monitorNames.has(name) && tokens.length === 2) {
        return monitorVerbs
          .map((v) => ({ value: `${name} ${v}`, label: v, description: "" }))
          .filter((i) => i.label.startsWith(last));
      }
      // Level 2: monitor name + "rules" — show actions
      if (
        monitorNames.has(name) &&
        tokens[1] === "rules" &&
        tokens.length === 3
      ) {
        return rulesActions
          .map((a) => ({
            value: `${name} rules ${a}`,
            label: a,
            description: "",
          }))
          .filter((i) => i.label.startsWith(last));
      }
      return null;
    },
    handler: async (args, ctx) => {
      const cmd = parseMonitorsArgs(args, monitorNames);
      if (cmd.type === "error") {
        ctx.ui.notify(cmd.message, "warning");
        return;
      }
      if (cmd.type === "list") {
        if (!ctx.hasUI) {
          handleList(monitors, ctx, monitorsEnabled);
          return;
        }
        const options = [
          `on — Enable all monitoring`,
          `off — Pause all monitoring`,
          ...monitors.map((m) => {
            const state = m.dismissed
              ? "dismissed"
              : m.whileCount > 0
                ? `engaged (${m.whileCount}/${m.ceiling})`
                : "idle";
            return `${m.name} — ${m.description} [${state}]`;
          }),
        ];
        const selected = await ctx.ui.select("Monitors", options);
        if (!selected) return;
        const selectedName = selected.split(" ")[0];
        if (selectedName === "on") {
          monitorsEnabled = true;
          updateStatus();
          ctx.ui.notify("Monitors enabled", "info");
        } else if (selectedName === "off") {
          monitorsEnabled = false;
          updateStatus();
          ctx.ui.notify("All monitors paused for this session", "info");
        } else {
          const monitor = monitorsByName.get(selectedName);
          if (!monitor) return;
          const verbOptions = [
            `inspect — Show monitor state and config`,
            `rules — List and manage rules`,
            `patterns — List known patterns`,
            `dismiss — Silence for this session`,
            `reset — Reset state and un-dismiss`,
          ];
          const verb = await ctx.ui.select(`[${monitor.name}]`, verbOptions);
          if (!verb) return;
          const verbName = verb.split(" ")[0];
          if (verbName === "inspect") handleInspect(monitor, ctx);
          else if (verbName === "rules") handleRulesList(monitor, ctx);
          else if (verbName === "patterns") handlePatternsList(monitor, ctx);
          else if (verbName === "dismiss") {
            monitor.dismissed = true;
            monitor.whileCount = 0;
            updateStatus();
            ctx.ui.notify(
              `[${monitor.name}] Dismissed for this session`,
              "info",
            );
          } else if (verbName === "reset") {
            monitor.dismissed = false;
            monitor.whileCount = 0;
            updateStatus();
            ctx.ui.notify(`[${monitor.name}] Reset`, "info");
          }
        }
        return;
      }
      if (cmd.type === "on") {
        monitorsEnabled = true;
        updateStatus();
        ctx.ui.notify("Monitors enabled", "info");
        return;
      }
      if (cmd.type === "off") {
        monitorsEnabled = false;
        updateStatus();
        ctx.ui.notify("All monitors paused for this session", "info");
        return;
      }
      const monitor = monitorsByName.get(cmd.name);
      if (!monitor) {
        ctx.ui.notify(`Unknown monitor: ${cmd.name}`, "warning");
        return;
      }
      switch (cmd.type) {
        case "inspect":
          handleInspect(monitor, ctx);
          break;
        case "rules-list":
          handleRulesList(monitor, ctx);
          break;
        case "rules-add":
          handleRulesAdd(monitor, ctx, cmd.text);
          break;
        case "rules-remove":
          handleRulesRemove(monitor, ctx, cmd.index);
          break;
        case "rules-replace":
          handleRulesReplace(monitor, ctx, cmd.index, cmd.text);
          break;
        case "patterns-list":
          handlePatternsList(monitor, ctx);
          break;
        case "dismiss":
          monitor.dismissed = true;
          monitor.whileCount = 0;
          updateStatus();
          ctx.ui.notify(`[${monitor.name}] Dismissed for this session`, "info");
          break;
        case "reset":
          monitor.dismissed = false;
          monitor.whileCount = 0;
          updateStatus();
          ctx.ui.notify(`[${monitor.name}] Reset`, "info");
          break;
      }
    },
  });
}

