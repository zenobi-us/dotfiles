import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const TRUNCATE = 2000;
export function extractText(parts) {
  return parts
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export function extractUserText(parts) {
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

export function collectUserText(branch) {
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

export const collectors = {
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

export function evaluateWhen(monitor, branch) {
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
