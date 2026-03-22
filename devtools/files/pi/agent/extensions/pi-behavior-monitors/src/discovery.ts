import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { getAgentDir } from "@mariozechner/pi-coding-agent";
import { VALID_EVENTS } from "./constants";

const EXTENSION_DIR = path.dirname(fileURLToPath(import.meta.url));
export const EXAMPLES_DIR = path.join(EXTENSION_DIR, "examples");

function isValidEvent(event) {
  return VALID_EVENTS.has(event);
}

export function discoverMonitors() {
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

export function resolveProjectMonitorsDir() {
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

export function seedExamples() {
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
