// Benchmark-lite portable export source. Downstream copies are generated; edit
// this file only in the benchmark repository.
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import contract from "./contract.json" with { type: "json" };
import { renderBenchmarkLiteReport } from "./report-renderer.mjs";

export const DEFAULT_RUN_ROOT = ".twg/bench-lite/runs";
export const DEFAULT_JUDGE_MODEL = "gpt-5.5";
export const DEFAULT_JUDGE_EFFORT = "xhigh";
export const DEFAULT_JUDGE_TIMEOUT_SECONDS = 900;
export const DEFAULT_ARM_TIMEOUT_SECONDS = 900;
export const ARM_PROGRESS_INTERVAL_MS = 30_000;

const MAX_TOOL_CALL_LOG_ENTRIES = 100;
const SUPPORTED_AGENTS = new Set(["codex", "rovo"]);
const SUPPORTED_JUDGE_AGENTS = new Set(["codex", "rovo"]);
const QUALITY_CLASSIFICATIONS = new Set(contract.qualityClassifications);
const QUALITY_WINNERS = new Set(["control", "test", "tie", "not-comparable"]);
const ATLASSIAN_MCP_URL = "https://mcp.atlassian.com/v1/mcp";
const CONTROL_SAFE_PATH = "/usr/bin:/bin:/usr/sbin:/sbin";
const CONTROL_ATLASSIAN_MCP_DISABLED_TOOLS = [
  "search",
  "searchTeamworkGraph",
  "teamworkGraphSearch",
  "queryTeamworkGraph",
  "getTeamworkGraph",
  "getTeamworkGraphObjects",
  "getTeamworkGraphRelationships",
];
const READ_ONLY_TWG_BASH_COMMANDS = [
  "(?:\\S+/)?twg\\s+work\\s+(?:query|search)\\b.*",
  "(?:\\S+/)?twg\\s+docs\\s+(?:query|search)\\b.*",
  "(?:\\S+/)?twg\\s+pull-requests\\s+(?:query|get)\\b.*",
  "(?:\\S+/)?twg\\s+(?:bitbucket|bb)\\s+pull-requests\\s+(?:query|get)\\b.*",
  "(?:\\S+/)?twg\\s+jira\\s+workitem\\s+(?:get|query|search|bulk-get)\\b.*",
  "(?:\\S+/)?twg\\s+confluence\\s+(?:content\\s+get|search\\s+query|spaces\\s+(?:get|list|query)|tree\\s+get)\\b.*",
  "(?:\\S+/)?twg\\s+(?:projects|goals)\\s+(?:query|get)\\b.*",
  "(?:\\S+/)?twg\\s+(?:context|resolve|search|search-code|user|org-tree|responsibility|teams|recently-viewed|notifications|assets|meetings)\\b.*",
  "(?:\\S+/)?twg\\s+rovo\\s+(?:search|list-apps|list-connectors)\\b.*",
];
let resolvedCodexExecutable;
let resolvedRovoExecutable;

function nowRunId() {
  return new Date().toISOString().replace(/[:.]/gu, "-");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function optionalString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function optionalNumber(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function optionalBoolean(value) {
  return typeof value === "boolean" ? value : undefined;
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
}

function traceTitle(label) {
  return label === "control" ? "Control" : "Test";
}

function lifecycle(hooks, message) {
  if (typeof hooks?.lifecycle === "function") {
    hooks.lifecycle(message);
  }
}

async function readPromptInput(options) {
  if (options.prompt && options.promptFile) {
    throw new Error("Use either --prompt or --prompt-file, not both.");
  }
  if (options.promptFile) {
    return readFile(resolve(options.promptFile), "utf8");
  }
  return options.prompt;
}

function outputMetrics(output) {
  return {
    outputBytes: Buffer.byteLength(output, "utf8"),
    outputChars: output.length,
    outputLines: output.length === 0 ? 0 : output.split(/\r\n|\r|\n/u).length,
  };
}

function hasArmArtifacts(options) {
  return Boolean(
    options.controlOutputFile ||
    options.testOutputFile ||
    options.controlResultFile ||
    options.testResultFile
  );
}

async function readJsonObject(path) {
  const parsed = JSON.parse(await readFile(path, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${path} must contain a JSON object.`);
  }
  return parsed;
}

async function readOptionalJsonObject(path) {
  try {
    return await readJsonObject(path);
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

function textFromUnknown(value, depth = 0) {
  if (depth > 3 || value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => textFromUnknown(item, depth + 1))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") {
    const record = value;
    const preferredKeys = [
      "cmd",
      "command",
      "args",
      "arguments",
      "input",
      "input_text",
      "tool_input",
      "tool_name",
      "name",
      "query",
    ];
    const parts = [];
    for (const key of preferredKeys) {
      if (Object.hasOwn(record, key)) {
        const text = textFromUnknown(record[key], depth + 1);
        if (text) parts.push(text);
      }
    }
    if (parts.length > 0) return parts.join("\n");
  }
  return "";
}

function commandTextFromCall(call) {
  if (!call) return "";
  return [call.input_text, call.arguments, call.input, call.command, call.cmd, call.tool_input]
    .map((value) => textFromUnknown(value))
    .filter(Boolean)
    .join("\n");
}

function summarizeTwgCommand(text) {
  const match = text.match(/\btwg(?:-bin)?(?:\.exe)?\s+([^"'`\n\r;&|]+)/u);
  if (!match) return undefined;
  const parts = [];
  for (const part of match[1].trim().split(/\s+/u)) {
    if (!part || part.startsWith("-") || part.includes("=")) break;
    if (/[:/@.]/u.test(part)) break;
    parts.push(part);
    if (parts.length >= 3) break;
  }
  return parts.length > 0 ? ["twg", ...parts].join(" ") : "twg";
}

function tokenUsageFromMetadata(metadata) {
  const inputTokens = optionalNumber(metadata?.input_tokens ?? metadata?.inputTokens);
  const cachedInputTokens = optionalNumber(
    metadata?.cached_input_tokens ?? metadata?.cachedInputTokens
  );
  const cacheCreationInputTokens = optionalNumber(
    metadata?.cache_creation_input_tokens ?? metadata?.cacheCreationInputTokens
  );
  const outputTokens = optionalNumber(metadata?.output_tokens ?? metadata?.outputTokens);
  const totalTokens = optionalNumber(metadata?.total_tokens ?? metadata?.totalTokens);
  const uncachedInputTokens =
    inputTokens !== null || cachedInputTokens !== null || outputTokens !== null
      ? cacheCreationInputTokens !== null && cacheCreationInputTokens > 0
        ? (inputTokens ?? 0)
        : Math.max((inputTokens ?? 0) - (cachedInputTokens ?? 0), 0)
      : null;
  const displayTokens =
    uncachedInputTokens !== null || cacheCreationInputTokens !== null || outputTokens !== null
      ? (uncachedInputTokens ?? 0) + (cacheCreationInputTokens ?? 0) + (outputTokens ?? 0)
      : null;
  return {
    inputTokens,
    cachedInputTokens,
    cacheCreationInputTokens,
    outputTokens,
    totalTokens:
      totalTokens ??
      (inputTokens !== null || outputTokens !== null || cachedInputTokens !== null
        ? (inputTokens ?? 0) +
          (cachedInputTokens ?? 0) +
          (cacheCreationInputTokens ?? 0) +
          (outputTokens ?? 0)
        : null),
    nonCachedTokens: displayTokens,
    displayTokens,
  };
}

function summarizeToolName(name, inputText) {
  const rawName = (name || "").trim();
  const rawInput = (inputText || "").trim();
  const combined = [rawInput, rawName].filter(Boolean).join("\n");
  const twgSummary = summarizeTwgCommand(combined);
  if (twgSummary) return twgSummary;

  const source = (rawName || rawInput || "tool call").trim();
  if (!source) return "tool call";
  if (source.startsWith("mcp__")) return source;

  const commandMatch = combined.match(
    /(?:^|[\s"'/\\])(?<command>jq|sed|rg|cat|node|npx|tsx|npm|pnpm|git|open|python3?|bash|zsh)(?=\s|$)/iu
  );
  if (commandMatch?.groups?.command) return commandMatch.groups.command.toLowerCase();

  return source.length > 120 ? `${source.slice(0, 117)}...` : source;
}

function toolSurfaceFromName(name) {
  const lower = name.toLowerCase();
  if (lower.startsWith("mcp__atlassian__")) return "atlassian-mcp";
  if (lower === "twg" || lower.startsWith("twg ")) return "twg-cli";
  if (/^(jq|sed|rg|cat)\b/u.test(lower)) return "local-processing";
  if (/^(node|npx|tsx|npm|pnpm|git|open|python|python3|bash|zsh)\b/u.test(lower)) {
    return "shell";
  }
  return "agent-tool";
}

function toolAreaFromName(name) {
  const lower = name.toLowerCase();
  if (lower.includes("confluence") || /\btwg\s+(?:docs|confluence)\b/u.test(lower)) {
    return "confluence/docs";
  }
  if (/\btwg\s+work\b/u.test(lower)) return "work graph";
  if (lower.includes("jira") || /\btwg\s+jira\b/u.test(lower)) return "jira";
  if (
    lower.includes("pull-requests") ||
    lower.includes("bitbucket") ||
    /\btwg\s+(?:pull-requests|bb)\b/u.test(lower)
  ) {
    return "pull-requests";
  }
  if (/^(jq|sed|rg|cat)\b/u.test(lower)) return "local-processing";
  if (lower.includes("atlassian")) return "atlassian";
  if (lower === "twg" || lower.startsWith("twg ")) return "twg-cli";
  return "other";
}

function isForbiddenControlAtlassianMcpToolName(name) {
  const lower = String(name ?? "").toLowerCase();
  return (
    lower === "mcp__atlassian__search" ||
    lower.includes("teamworkgraph") ||
    lower.includes("teamwork_graph") ||
    lower.includes("teamwork-graph")
  );
}

function forbiddenControlAtlassianMcpTools(control) {
  if (!Array.isArray(control?.toolCallLog)) return [];
  return control.toolCallLog.filter((tool) => isForbiddenControlAtlassianMcpToolName(tool?.name));
}

function extractToolCallLog(trace) {
  const rawCalls = Array.isArray(trace?.tool_calls) ? trace.tool_calls : [];
  return rawCalls.slice(0, MAX_TOOL_CALL_LOG_ENTRIES).flatMap((rawCall, offset) => {
    const call = asRecord(rawCall);
    if (!call) return [];
    const rawName =
      optionalString(call.tool_name) ??
      optionalString(call.name) ??
      optionalString(call.tool) ??
      optionalString(call.tool_id) ??
      "tool call";
    const name = summarizeToolName(rawName, commandTextFromCall(call));
    const surface = toolSurfaceFromName(name);
    const explicitDurationMs = optionalNumber(call.duration_ms);
    const startTime = optionalNumber(call.start_time);
    const endTime = optionalNumber(call.end_time);
    const durationMs =
      explicitDurationMs !== null
        ? explicitDurationMs
        : startTime !== null && endTime !== null
          ? endTime - startTime
          : null;
    return [
      {
        index: offset + 1,
        name,
        surface,
        area: toolAreaFromName(name),
        durationMs: durationMs === null ? null : Math.round(durationMs),
        twg: surface === "twg-cli",
        error: optionalBoolean(call.is_error) ?? false,
      },
    ];
  });
}

function mergeTokenUsage(metadata, usage) {
  const record = asRecord(usage);
  if (!record) return false;
  const inputTokens = optionalNumber(record.input_tokens ?? record.inputTokens);
  const cachedInputTokens = optionalNumber(record.cached_input_tokens ?? record.cachedInputTokens);
  const outputTokens = optionalNumber(record.output_tokens ?? record.outputTokens);
  const totalTokens = optionalNumber(record.total_tokens ?? record.totalTokens);
  let observed = false;
  if (inputTokens !== null) {
    metadata.input_tokens = inputTokens;
    observed = true;
  }
  if (cachedInputTokens !== null) {
    metadata.cached_input_tokens = cachedInputTokens;
    observed = true;
  }
  if (outputTokens !== null) {
    metadata.output_tokens = outputTokens;
    observed = true;
  }
  if (totalTokens !== null) {
    metadata.total_tokens = totalTokens;
    observed = true;
  } else if (inputTokens !== null || outputTokens !== null) {
    metadata.total_tokens = (inputTokens ?? 0) + (outputTokens ?? 0);
    observed = true;
  }
  return observed;
}

function looksLikeError(value) {
  const text = String(value ?? "").toLowerCase();
  return /\b(error|exception|traceback|unauthorized|forbidden|permission denied|command failed)\b/u.test(
    text
  );
}

function mcpToolName(item) {
  const server = optionalString(item?.server) ?? "mcp";
  const tool = optionalString(item?.tool) ?? optionalString(item?.name) ?? "tool";
  return `mcp__${server.replaceAll(/[^a-z0-9_-]/giu, "_")}__${tool.replaceAll(
    /[^a-z0-9_-]/giu,
    "_"
  )}`;
}

function routePlanInstructions(routePlan) {
  if (!routePlan) return [];
  return [
    "",
    "TWG benchmark-lite route plan from `twg benchmark lite plan`.",
    "This is tool-selection policy only, not answer evidence:",
    JSON.stringify(routePlan, null, 2),
    "",
    "Follow this route before generic command discovery.",
    "Use at most the route plan's maxHelpCalls for exact flag lookup.",
    "Prefer compact, answer-ready TWG output; hydrate only the top evidence items needed for the final answer.",
    "Stop when the route plan's stop rule is satisfied.",
  ];
}

function armInstructions(label, prompt, routePlan) {
  const shared = [
    "You are running one arm of a TWG benchmark-lite A/B comparison.",
    "Answer the user's prompt directly. Use only live tool output gathered in this arm.",
    "Do not use prior benchmark artifacts, cached answers, or files outside this arm workspace as evidence.",
    "",
    "Original prompt:",
    prompt,
  ];
  if (label === "control") {
    return [
      ...shared,
      "",
      "Arm: Control - Free Atlassian with Local MCPs Context.",
      "Use the free Atlassian MCP/tools and any user-local MCP/connectors available to this agent runtime.",
      "Do not use the `twg` CLI, TWG skills, or paid Teamwork Graph context.",
      "Do not run auth, setup, login, logout, or credential-management commands.",
      "If a TWG command would help, do not run it; use free tools instead or state the access limitation.",
      "Do not use shell or filesystem discovery as evidence unless it is only local formatting/post-processing of this arm's tool output.",
      "If the required free tools are unavailable or lack access, state that limitation clearly in the answer.",
    ].join("\n");
  }
  return [
    ...shared,
    "",
    "Arm: Test - Paid Atlassian Teamwork Graph Context.",
    ...routePlanInstructions(routePlan),
    "Use `twg` CLI commands as the evidence path for Atlassian work data.",
    "When the prompt involves Jira, Confluence, docs, pages, issues, comments, or a status rollup with those artifacts, call the relevant TWG product surfaces such as `twg jira ...`, `twg confluence ...`, or `twg docs ...` when they materially improve evidence.",
    "`twg work query` is useful for broad status discovery, but it should not be the only evidence path when product-native Jira or Confluence detail is needed.",
    "Do not use free Atlassian MCP tools as the primary evidence path for this arm.",
  ].join("\n");
}

function parseArmTimeoutMs(value) {
  if (!value) return DEFAULT_ARM_TIMEOUT_SECONDS * 1000;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 7200) {
    throw new Error("--arm-timeout-seconds must be greater than 0 and no more than 7200.");
  }
  return Math.round(seconds * 1000);
}

function codexRunArgs(options, armDir, label) {
  const args = [
    "exec",
    "--json",
    "--skip-git-repo-check",
    "--ephemeral",
    "--disable",
    "browser_use",
    "-s",
    "workspace-write",
    "-c",
    "sandbox_workspace_write.network_access=true",
  ];
  if (label === "control") {
    args.push(
      "-c",
      `mcp_servers.atlassian.url=${JSON.stringify(ATLASSIAN_MCP_URL)}`,
      "-c",
      "mcp_servers.atlassian.enabled=true",
      "-c",
      `mcp_servers.atlassian.disabled_tools=${JSON.stringify(CONTROL_ATLASSIAN_MCP_DISABLED_TOOLS)}`,
      "-c",
      'shell_environment_policy.inherit="core"',
      "-c",
      `shell_environment_policy.set={ PATH = ${JSON.stringify(CONTROL_SAFE_PATH)}, ZDOTDIR = ${JSON.stringify(armDir)}, BASH_ENV = ${JSON.stringify(join(armDir, ".bench-lite-shell-env"))}, ENV = ${JSON.stringify(join(armDir, ".bench-lite-shell-env"))} }`
    );
  }
  if (options.model) args.push("-m", String(options.model));
  args.push("-C", armDir, "-");
  return args;
}

function codexChildEnv(label, armDir) {
  const env = { ...process.env, NO_COLOR: "1" };
  if (label === "control") {
    env.ZDOTDIR = armDir;
    env.BASH_ENV = join(armDir, ".bench-lite-shell-env");
    env.ENV = join(armDir, ".bench-lite-shell-env");
    delete env.TWG_BIN;
    delete env.TWG_AGENT_DEFAULTS;
  }
  return env;
}

function codexExecutable() {
  if (process.env.CODEX_BIN?.trim()) return process.env.CODEX_BIN.trim();
  if (resolvedCodexExecutable) return resolvedCodexExecutable;
  try {
    resolvedCodexExecutable = execFileSync("sh", ["-lc", "command -v codex"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5_000,
    }).trim();
  } catch {
    resolvedCodexExecutable = "codex";
  }
  return resolvedCodexExecutable || "codex";
}

function rovoExecutable() {
  if (process.env.ROVO_BIN?.trim()) return process.env.ROVO_BIN.trim();
  if (resolvedRovoExecutable) return resolvedRovoExecutable;
  try {
    resolvedRovoExecutable = execFileSync("sh", ["-lc", "command -v rovo"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5_000,
    }).trim();
  } catch {
    resolvedRovoExecutable = "rovo";
  }
  return resolvedRovoExecutable || "rovo";
}

function parseSiteUrlFromRovoConfig(path) {
  try {
    const text = readFileSync(path, "utf8");
    return text.match(/["']?siteUrl["']?\s*:\s*["']?(https:\/\/[^\s"']+)/u)?.[1];
  } catch {
    return undefined;
  }
}

function readAuthConfSite(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r\n|\r|\n/u)) {
      const match = line.match(/^\s*site\s*=\s*(.+?)\s*$/u);
      if (match) return match[1].replace(/^["']|["']$/gu, "").trim();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function siteUrlFromSiteName(site) {
  const value = optionalString(site);
  if (!value) return undefined;
  if (/^https:\/\//iu.test(value)) return value.replace(/\/+$/u, "");
  if (/^[0-9a-f-]{16,}$/iu.test(value)) return undefined;
  const hostname = value
    .replace(/^https?:\/\//iu, "")
    .replace(/\/.*$/u, "")
    .replace(/\.atlassian\.net$/iu, "")
    .trim();
  return hostname ? `https://${hostname}.atlassian.net` : undefined;
}

export function resolveRovoBillingSiteUrl(env = process.env, homeDir = homedir()) {
  return (
    siteUrlFromSiteName(env.ROVO_BILLING_SITE_URL || env.ROVO_SITE_URL) ??
    parseSiteUrlFromRovoConfig(join(homeDir, ".rovo", "config.yml")) ??
    parseSiteUrlFromRovoConfig(join(homeDir, ".rovodev", "config.yml")) ??
    siteUrlFromSiteName(env.TWG_SITE || env.TWG_DOMAIN) ??
    siteUrlFromSiteName(readAuthConfSite(join(homeDir, ".config", "twg", "auth.conf"))) ??
    siteUrlFromSiteName(readAuthConfSite(join(homeDir, ".twg", "auth.conf")))
  );
}

function requireRovoBillingSiteUrl(env = process.env, homeDir = homedir()) {
  const siteUrl = resolveRovoBillingSiteUrl(env, homeDir);
  if (!siteUrl) {
    throw new Error(
      "Rovo billing site is not configured. Set ROVO_BILLING_SITE_URL, ROVO_SITE_URL, TWG_SITE, or TWG_DOMAIN, or configure a TWG/Rovo site before running benchmark-lite with --agent rovo."
    );
  }
  return siteUrl;
}

function runRovoProbe(args, timeoutMs = 10_000) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(rovoExecutable(), args, {
      env: { ...process.env, NO_COLOR: "1", ROVO_AUTO_UPGRADE_TWG: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(
        error?.code === "ENOENT"
          ? new Error(
              "Rovo runtime is not ready: the `rovo` executable was not found. Install Rovo CLI or expose it on PATH before running benchmark-lite."
            )
          : error
      );
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(
          new Error(
            `Rovo runtime is not ready: \`rovo ${args.join(" ")}\` timed out after ${Math.round(
              timeoutMs / 1000
            )} seconds.`
          )
        );
        return;
      }
      if (code !== 0) {
        reject(
          new Error(
            `Rovo runtime is not ready: \`rovo ${args.join(
              " "
            )}\` exited with code ${code}${signal ? ` (${signal})` : ""}: ${summarizeProcessFailure(
              undefined,
              stderr,
              stdout
            )}`
          )
        );
        return;
      }
      resolvePromise({ stdout, stderr });
    });
  });
}

async function runRovoDoctor() {
  await runRovoProbe(["--version"], 5_000);
  requireRovoBillingSiteUrl();
  try {
    await runRovoProbe(["oauth", "status"], 10_000);
  } catch (error) {
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}. Run \`rovo oauth login\` and retry benchmark-lite.`
    );
  }
}

function rovoConfigForArm(label, options, armDir) {
  const deniedTeamworkGraphTools = Object.fromEntries(
    CONTROL_ATLASSIAN_MCP_DISABLED_TOOLS.flatMap((tool) => [
      [tool, "deny"],
      [`mcp__atlassian__${tool}`, "deny"],
    ])
  );
  const controlAllowedTools = {
    mcp__gmail__invoke_tool: "allow",
    mcp__github__invoke_tool: "allow",
    mcp__google_calendar__invoke_tool: "allow",
    mcp__google_drive__invoke_tool: "allow",
    mcp__slack__invoke_tool: "allow",
    mcp__datadog__invoke_tool: "allow",
  };
  const testAllowedTools = {
    bash: "allow",
    file_read: "allow",
    read_file: "allow",
  };
  const bashConfig =
    label === "control"
      ? {
          default: "deny",
          commands: [],
          env: {
            PATH: CONTROL_SAFE_PATH,
            TWG_BIN: "",
            TWG_AGENT_DEFAULTS: "",
          },
        }
      : {
          default: "deny",
          commands: [
            ...READ_ONLY_TWG_BASH_COMMANDS.map((command) => ({
              command,
              permission: "allow",
            })),
            { command: "jq(\\s.*)?", permission: "allow" },
            { command: "cat\\s+\\.\\/benchmark-arm-prompt\\.md", permission: "allow" },
            { command: "cat\\s+benchmark-arm-prompt\\.md", permission: "allow" },
          ],
          env: {
            TWG_AGENT_DEFAULTS: "1",
          },
        };
  return {
    version: 1,
    agent: {
      streaming: false,
      temperature: 0.3,
      ...(options.model ? { modelId: String(options.model) } : {}),
      enableDeepPlanTool: false,
      experimental: {
        enableShadowMode: false,
        disableBuiltinAtlassianMcp: false,
      },
    },
    sessions: {
      persistenceDir: join(armDir, ".rovodev", "sessions"),
      enableWorkspaceStateSync: false,
    },
    console: {
      outputFormat: "markdown",
      showToolResults: true,
      enableStartupAnimations: false,
      terminalTitle: { isEnabled: false },
    },
    logging: {
      path: join(armDir, ".rovodev", "rovodev.log"),
      enablePromptCollection: false,
    },
    toolPermissions: {
      default: "deny",
      tools:
        label === "control"
          ? { ...controlAllowedTools, ...deniedTeamworkGraphTools }
          : testAllowedTools,
      bash: bashConfig,
      allowedExternalPaths: [],
    },
    sessionFeedback: {
      permanentlyDisabled: true,
    },
    atlassianBillingSite: {
      siteUrl: requireRovoBillingSiteUrl(),
    },
  };
}

async function writeRovoConfig(armDir, label, options) {
  const configDir = join(armDir, ".rovodev");
  await mkdir(configDir, { recursive: true });
  const configPath = join(configDir, "config.yml");
  await writeFile(
    configPath,
    `${JSON.stringify(rovoConfigForArm(label, options, armDir), null, 2)}\n`,
    "utf8"
  );
  return configPath;
}

async function rovoSessionContextFiles(configPath) {
  const sessionsDir = join(dirname(configPath), "sessions");
  let entries;
  try {
    entries = await readdir(sessionsDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const paths = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const path = join(sessionsDir, entry.name, "session_context.json");
    try {
      await stat(path);
      paths.push(path);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return paths;
}

async function latestRovoSessionContext(configPath) {
  const paths = await rovoSessionContextFiles(configPath);
  if (paths.length === 0) return undefined;
  const withStats = await Promise.all(
    paths.map(async (path) => ({ path, stats: await stat(path) }))
  );
  withStats.sort((a, b) =>
    a.stats.mtimeMs === b.stats.mtimeMs
      ? a.path.localeCompare(b.path)
      : a.stats.mtimeMs - b.stats.mtimeMs
  );
  return withStats.at(-1)?.path;
}

function stringifyRovoPartValue(value) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseRovoSessionToolCalls(session, observedAt = Date.now()) {
  const pending = new Map();
  const messages = Array.isArray(session?.message_history) ? session.message_history : [];
  for (const message of messages) {
    const parts = Array.isArray(message?.parts) ? message.parts : [];
    for (const part of parts) {
      if (!part || typeof part !== "object") continue;
      const partKind = part.part_kind;
      const rawId = optionalString(part.tool_call_id) ?? "";
      if (!rawId) continue;
      if (partKind === "tool-call") {
        pending.set(rawId, {
          tool_name: optionalString(part.tool_name) ?? "tool call",
          tool_id: rawId,
          input_text: stringifyRovoPartValue(part.args),
          output_text: "",
          is_error: false,
          start_time: observedAt,
        });
      } else if (partKind === "tool-return") {
        const tool = pending.get(rawId);
        if (!tool) continue;
        tool.output_text = stringifyRovoPartValue(part.content);
        tool.is_error = Boolean(part.is_error) || looksLikeError(tool.output_text);
        tool.end_time = observedAt;
      }
    }
  }
  return [...pending.values()];
}

function rovoFinalTextFromSession(session) {
  const latestResult = optionalString(session?.latest_result);
  if (latestResult) return latestResult;
  let finalText = "";
  const messages = Array.isArray(session?.message_history) ? session.message_history : [];
  for (const message of messages) {
    const parts = Array.isArray(message?.parts) ? message.parts : [];
    for (const part of parts) {
      if (part?.part_kind === "text") {
        const content = optionalString(part.content);
        if (content) finalText = content;
      }
    }
  }
  return finalText;
}

function rovoModelFromSession(session) {
  const messages = Array.isArray(session?.message_history) ? session.message_history : [];
  for (const message of messages.toReversed()) {
    const model = optionalString(message?.model_name);
    if (model) return model;
  }
  return undefined;
}

function rovoUsageFromSession(metadata, session) {
  if (mergeTokenUsage(metadata, session?.usage)) return;
  const messages = Array.isArray(session?.message_history) ? session.message_history : [];
  for (const message of messages.toReversed()) {
    if (mergeTokenUsage(metadata, message?.usage)) return;
  }
}

async function readRovoSession(configPath) {
  const sessionPath = await latestRovoSessionContext(configPath);
  if (!sessionPath) return {};
  try {
    return {
      path: sessionPath,
      payload: await readJsonObject(sessionPath),
    };
  } catch {
    return { path: sessionPath };
  }
}

function extractRovoFinalText(stdout) {
  const cleaned = String(stdout ?? "").trim();
  if (!cleaned) return "";
  const marker = cleaned.match(/Run rovo --restore [^\n]+\n/u);
  if (marker?.index !== undefined) {
    return cleaned.slice(marker.index + marker[0].length).trim();
  }
  return cleaned
    .split(/\r\n|\r|\n/u)
    .filter((line) => line.trim() && !/^\d{4}-\d{2}-\d{2} .* \| /u.test(line.trim()))
    .slice(-20)
    .join("\n")
    .trim();
}

function rovoChildEnv() {
  return {
    ...process.env,
    NO_COLOR: "1",
    ROVO_AUTO_UPGRADE_TWG: "0",
  };
}

function terminateChildProcess(child) {
  try {
    if (child.pid) {
      process.kill(-child.pid, "SIGTERM");
      return;
    }
  } catch {
    // Fall through to direct child termination.
  }
  child.kill("SIGTERM");
}

function recentProcessOutput(metadata) {
  const lines = Array.isArray(metadata.non_json_output_lines) ? metadata.non_json_output_lines : [];
  return lines
    .slice(-3)
    .map((line) => String(line).trim())
    .filter(Boolean)
    .join(" ");
}

function summarizeProcessFailure(error, stderr, stdout) {
  const detail = [stderr, stdout, error?.message]
    .filter(Boolean)
    .join("\n")
    .replace(/\s+/gu, " ")
    .trim();
  return detail.length > 700 ? `${detail.slice(0, 697)}...` : detail;
}

function runCodexDoctor(timeoutMs = 120_000) {
  return new Promise((resolvePromise, reject) => {
    const executable = codexExecutable();
    const command = `${executable} doctor --summary --ascii`;
    const child = spawn(executable, ["doctor", "--summary", "--ascii"], {
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(
        error?.code === "ENOENT"
          ? new Error(
              `Codex runtime is not ready: the Codex executable was not found at ${executable}. Install Codex or expose it on PATH before running benchmark-lite.`
            )
          : error
      );
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(
          new Error(
            `Codex found at ${executable}, but runtime check timed out after ${Math.round(timeoutMs / 1000)} seconds while running \`${command}\`. Run \`time codex doctor --summary --ascii\` to inspect local runtime latency before running benchmark-lite.`
          )
        );
        return;
      }
      if (code !== 0) {
        reject(
          new Error(
            `Codex runtime is not ready: ${summarizeProcessFailure(
              undefined,
              stderr,
              stdout
            )}${signal ? ` (${signal})` : ""}. Command: \`${command}\`. Run \`time codex doctor --summary --ascii\` and fix the reported config, auth, or network issue before running benchmark-lite.`
          )
        );
        return;
      }
      resolvePromise();
    });
  });
}

async function writeArmGuidance(armDir, label) {
  const guidance =
    label === "control"
      ? [
          "# Benchmark Lite Control Arm",
          "",
          "Use free product-specific Atlassian MCP tools plus user-local MCP/connectors only.",
          "Do not call broad Atlassian MCP `search` or Teamwork Graph MCP tools.",
          "Do not call `twg`, read TWG skill files, or use paid Teamwork Graph context.",
          "Do not run auth, setup, login, logout, or credential-management commands.",
        ]
      : [
          "# Benchmark Lite Test Arm",
          "",
          "Use `twg` CLI commands for Atlassian work-data evidence.",
          "Prefer product-native TWG surfaces such as `twg jira`, `twg confluence`, and `twg docs` when the prompt needs those artifacts.",
        ];
  await writeFile(join(armDir, "AGENTS.md"), `${guidance.join("\n")}\n`, "utf8");
  if (label === "control") {
    const shellEnv = [
      `PATH="${CONTROL_SAFE_PATH}"`,
      "export PATH",
      "unset TWG_BIN TWG_AGENT_DEFAULTS",
      "unalias twg 2>/dev/null || true",
      "unfunction twg 2>/dev/null || true",
      "unset -f twg 2>/dev/null || true",
    ].join("\n");
    await writeFile(join(armDir, ".zshenv"), `${shellEnv}\n`, "utf8");
    await writeFile(join(armDir, ".bench-lite-shell-env"), `${shellEnv}\n`, "utf8");
  }
}

async function runCodexLiveArm({ label, prompt, options, outputDir, routePlan }, hooks) {
  const title = traceTitle(label);
  const armDir = resolve(outputDir, "arms", label);
  await mkdir(armDir, { recursive: true });
  await writeArmGuidance(armDir, label);
  const startedAt = Date.now();
  const timeoutMs = parseArmTimeoutMs(options.armTimeoutSeconds);
  const metadata = {
    agent_name: "codex",
    agent_transport: "codex exec --json",
  };
  const rawEvents = [];
  const pendingTools = new Map();
  const completedTools = [];
  const finalParts = [];
  let finalResponse = "";
  let model = optionalString(options.model);
  let timedOut = false;
  let exitCode = null;
  let signalCode = null;
  let errorMessage = "";
  let progressTimer;

  lifecycle(hooks, `${title} sub-agent started.`);

  await new Promise((resolvePromise, reject) => {
    const child = spawn(codexExecutable(), codexRunArgs(options, armDir, label), {
      cwd: armDir,
      env: codexChildEnv(label, armDir),
      stdio: ["pipe", "pipe", "pipe"],
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    let stdoutBuffer = "";
    let stderrBuffer = "";

    const completeTool = (toolId, output, observedAt, isError = false) => {
      const tool = pendingTools.get(toolId);
      if (!tool) return;
      tool.output_text = output;
      tool.is_error = Boolean(isError) || looksLikeError(output);
      tool.end_time = observedAt;
      pendingTools.delete(toolId);
      completedTools.push(tool);
      lifecycle(
        hooks,
        `${title} tool call completed: ${summarizeToolName(tool.tool_name, tool.input_text)}${tool.is_error ? " (error)" : ""}`
      );
    };

    const addTool = ({ toolId, rawName, inputText, outputText, isError, observedAt }) => {
      const name = summarizeToolName(rawName, inputText);
      const tool = {
        tool_name: rawName || name,
        tool_id: toolId || `tool-${completedTools.length + pendingTools.size + 1}`,
        input_text: inputText || "",
        output_text: outputText || "",
        is_error: Boolean(isError),
        start_time: observedAt,
        ...(outputText !== undefined ? { end_time: observedAt } : {}),
      };
      lifecycle(
        hooks,
        `${title} tool call #${completedTools.length + pendingTools.size + 1}: ${name}`
      );
      if (outputText !== undefined) {
        completedTools.push(tool);
      } else {
        pendingTools.set(tool.tool_id, tool);
      }
    };

    const handleEvent = (event, observedAt) => {
      event._benchmark_observed_at = observedAt / 1000;
      rawEvents.push(event);
      metadata.agent_last_event_at = observedAt / 1000;
      metadata.agent_first_event_at ??= observedAt / 1000;
      const eventType = event.type;
      const payload = asRecord(event.payload) ?? {};
      if (eventType === "turn_context") {
        model = optionalString(payload.model) ?? model;
      } else if (eventType === "response_item") {
        if (payload.type === "function_call") {
          addTool({
            toolId: optionalString(payload.call_id) ?? optionalString(payload.id),
            rawName: optionalString(payload.name) ?? "tool call",
            inputText: textFromUnknown(payload.arguments),
            observedAt,
          });
        } else if (payload.type === "function_call_output") {
          completeTool(
            optionalString(payload.call_id) ?? optionalString(payload.id),
            textFromUnknown(payload.output),
            observedAt
          );
        } else if (payload.type === "message" && payload.role === "assistant") {
          const content = Array.isArray(payload.content) ? payload.content : [];
          const text = content
            .map((item) => {
              const record = asRecord(item);
              return record?.type === "output_text" ? optionalString(record.text) : "";
            })
            .filter(Boolean)
            .join("");
          if (text && (!payload.phase || payload.phase === "final_answer")) {
            finalResponse = text;
          }
        }
      } else if (eventType === "item.started") {
        const item = asRecord(event.item) ?? {};
        if (item.type === "command_execution") {
          addTool({
            toolId: optionalString(item.id),
            rawName: optionalString(item.command) ?? "shell",
            inputText: optionalString(item.command),
            observedAt,
          });
        } else if (item.type === "mcp_tool_call") {
          addTool({
            toolId: optionalString(item.id),
            rawName: mcpToolName(item),
            inputText: textFromUnknown(item.arguments),
            observedAt,
          });
        }
      } else if (eventType === "item.completed") {
        const item = asRecord(event.item) ?? {};
        if (item.type === "command_execution") {
          const toolId = optionalString(item.id);
          const output = textFromUnknown(item.aggregated_output);
          if (toolId && pendingTools.has(toolId)) {
            completeTool(toolId, output, observedAt, Boolean(item.exit_code));
          } else {
            addTool({
              toolId,
              rawName: optionalString(item.command) ?? "shell",
              inputText: optionalString(item.command),
              outputText: output,
              isError: Boolean(item.exit_code),
              observedAt,
            });
          }
        } else if (item.type === "agent_message") {
          const text = optionalString(item.text);
          if (text) {
            finalParts.push(text);
            finalResponse = finalParts.join("\n");
          }
        } else if (item.type === "mcp_tool_call") {
          const toolId = optionalString(item.id);
          const output = textFromUnknown(item.result ?? item.error ?? "");
          const isError = Boolean(item.error) || item.status === "failed";
          if (toolId && pendingTools.has(toolId)) {
            completeTool(toolId, output, observedAt, isError);
          } else {
            addTool({
              toolId,
              rawName: mcpToolName(item),
              inputText: textFromUnknown(item.arguments),
              outputText: output,
              isError,
              observedAt,
            });
          }
        }
      } else if (eventType === "turn.completed") {
        mergeTokenUsage(metadata, event.usage ?? payload.usage);
      }
    };

    const handleLine = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const observedAt = Date.now();
      try {
        handleEvent(JSON.parse(trimmed), observedAt);
      } catch {
        const lines = metadata.non_json_output_lines ?? [];
        lines.push(line.length > 200 ? `${line.slice(0, 197)}...` : line);
        metadata.non_json_output_lines = lines.slice(-20);
      }
    };

    const consumeChunk = (chunk, source) => {
      const text = chunk.toString("utf8");
      let buffer = source === "stderr" ? stderrBuffer + text : stdoutBuffer + text;
      const lines = buffer.split(/\r\n|\n|\r/u);
      buffer = lines.pop() ?? "";
      for (const line of lines) handleLine(line);
      if (source === "stderr") stderrBuffer = buffer;
      else stdoutBuffer = buffer;
    };

    child.stdout.on("data", (chunk) => consumeChunk(chunk, "stdout"));
    child.stderr.on("data", (chunk) => consumeChunk(chunk, "stderr"));
    progressTimer = setInterval(() => {
      const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
      lifecycle(
        hooks,
        `${title} running: ${elapsedSeconds}s elapsed, ${completedTools.length} completed tool call(s), ${pendingTools.size} pending.`
      );
    }, ARM_PROGRESS_INTERVAL_MS);
    child.on("error", (error) => {
      clearTimeout(timer);
      if (progressTimer) clearInterval(progressTimer);
      reject(
        error?.code === "ENOENT"
          ? new Error("Could not run live Codex arms because the `codex` executable was not found.")
          : error
      );
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (progressTimer) clearInterval(progressTimer);
      if (stdoutBuffer) handleLine(stdoutBuffer);
      if (stderrBuffer) handleLine(stderrBuffer);
      exitCode = code;
      signalCode = signal;
      if (timedOut) {
        errorMessage = `Codex ${label} arm timed out after ${Math.round(timeoutMs / 1000)} seconds.`;
      } else if (code !== 0) {
        const recentOutput = recentProcessOutput(metadata);
        errorMessage = `Codex ${label} arm exited with code ${code}${signal ? ` (${signal})` : ""}${recentOutput ? `: ${recentOutput}` : ""}.`;
      }
      resolvePromise();
    });
    child.stdin.end(armInstructions(label, prompt, routePlan));
  });

  const endedAt = Date.now();
  for (const tool of pendingTools.values()) {
    tool.end_time = endedAt;
    tool.is_error = true;
    completedTools.push(tool);
  }
  const durationMs = endedAt - startedAt;
  metadata.total_duration_ms = durationMs;
  metadata.agent_process_exit_code = exitCode;
  if (signalCode) metadata.agent_process_signal = signalCode;
  if (errorMessage) metadata.error = errorMessage;
  const trace = {
    prompt,
    final_response: finalResponse,
    metadata,
    raw_events: rawEvents,
    tool_calls: completedTools,
    num_calls: completedTools.length,
    num_errors: completedTools.filter((tool) => Boolean(tool.is_error)).length,
    total_duration_ms: durationMs,
    ...(errorMessage ? { error: errorMessage } : {}),
  };
  const answerPath = resolve(armDir, "answer.txt");
  const tracePath = resolve(armDir, "trace.json");
  await writeFile(answerPath, finalResponse, "utf8");
  await writeJsonFile(tracePath, trace);
  if (!finalResponse) {
    throw new Error(
      `${title} arm did not produce a final answer${errorMessage ? `: ${errorMessage}` : "."}`
    );
  }
  const toolCallLog = extractToolCallLog(trace);
  const tokenUsage = tokenUsageFromMetadata(metadata);
  const tokens = tokenUsage.displayTokens;
  const twgCalls = toolCallLog.filter((tool) => tool.twg).length;
  if (label === "control" && twgCalls > 0 && !errorMessage) {
    errorMessage = `Control arm used ${twgCalls} TWG call(s), so this run is not a valid free-context control.`;
    metadata.error = errorMessage;
    trace.error = errorMessage;
    await writeJsonFile(tracePath, trace);
  }
  lifecycle(
    hooks,
    `${title} finished: ${completedTools.length} tool call(s), ${twgCalls} TWG call(s).`
  );
  return {
    output: finalResponse,
    prompt,
    tokens,
    tokenUsage,
    toolCalls: completedTools.length,
    twgCalls,
    durationMs,
    toolErrors: trace.num_errors,
    toolCallLog,
    source: "live-agent",
    model,
    answerQualityStatus: errorMessage ? "partial" : "full",
    dataReturned: finalResponse.trim().length > 0,
    traceFile: tracePath,
    toolSurface: label === "control" ? ["atlassian-mcp", "local-mcp"] : ["twg-cli"],
    status: errorMessage ? "failed" : "completed",
  };
}

async function runRovoLiveArm({ label, prompt, options, outputDir, routePlan }, hooks) {
  const title = traceTitle(label);
  const armDir = resolve(outputDir, "arms", label);
  await mkdir(armDir, { recursive: true });
  await writeArmGuidance(armDir, label);
  const configPath = await writeRovoConfig(armDir, label, options);
  const startedAt = Date.now();
  const timeoutMs = parseArmTimeoutMs(options.armTimeoutSeconds);
  const metadata = {
    agent_name: "rovo",
    agent_transport: "rovo run",
    agent_timing_precision: "posthoc_coarse",
    agent_process_started_at: startedAt / 1000,
  };
  const observedToolIds = new Set();
  const completedToolIds = new Set();
  let latestToolCalls = [];
  let latestSessionPayload;
  let stdout = "";
  let stderr = "";
  let finalResponse = "";
  let model = optionalString(options.model);
  let timedOut = false;
  let exitCode = null;
  let signalCode = null;
  let errorMessage = "";
  let progressTimer;

  lifecycle(hooks, `${title} sub-agent started.`);
  const armPrompt = armInstructions(label, prompt, routePlan);
  const promptPath = join(armDir, "benchmark-arm-prompt.md");
  await writeFile(promptPath, armPrompt, "utf8");

  const pollSessionProgress = async () => {
    const session = await readRovoSession(configPath);
    if (!session.payload) return;
    latestSessionPayload = session.payload;
    metadata.rovo_session_context_path = session.path;
    metadata.rovo_session_id = optionalString(session.payload.id);
    metadata.agent_last_event_at = Date.now() / 1000;
    metadata.agent_first_event_at ??= metadata.agent_last_event_at;
    rovoUsageFromSession(metadata, session.payload);
    model = rovoModelFromSession(session.payload) ?? model;
    const toolCalls = parseRovoSessionToolCalls(session.payload, Date.now());
    latestToolCalls = toolCalls;
    for (const tool of toolCalls) {
      if (!observedToolIds.has(tool.tool_id)) {
        observedToolIds.add(tool.tool_id);
        lifecycle(
          hooks,
          `${title} tool call #${observedToolIds.size}: ${summarizeToolName(
            tool.tool_name,
            tool.input_text
          )}`
        );
      }
      if (tool.end_time && !completedToolIds.has(tool.tool_id)) {
        completedToolIds.add(tool.tool_id);
        lifecycle(
          hooks,
          `${title} tool call completed: ${summarizeToolName(
            tool.tool_name,
            tool.input_text
          )}${tool.is_error ? " (error)" : ""}`
        );
      }
    }
  };

  await new Promise((resolvePromise, reject) => {
    const child = spawn(
      rovoExecutable(),
      [
        "run",
        "--config-file",
        configPath,
        "--verbose",
        "Read and follow the benchmark arm instructions in ./benchmark-arm-prompt.md. Return the final answer for the user's original prompt.",
      ],
      {
        cwd: armDir,
        env: rovoChildEnv(),
        stdio: ["pipe", "pipe", "pipe"],
      }
    );
    const timer = setTimeout(() => {
      timedOut = true;
      terminateChildProcess(child);
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.stdin.end(armPrompt);
    progressTimer = setInterval(() => {
      void pollSessionProgress().finally(() => {
        const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
        const pending = latestToolCalls.filter((tool) => !tool.end_time).length;
        lifecycle(
          hooks,
          `${title} running: ${elapsedSeconds}s elapsed, ${completedToolIds.size} completed tool call(s), ${pending} pending.`
        );
      });
    }, ARM_PROGRESS_INTERVAL_MS);
    child.on("error", (error) => {
      clearTimeout(timer);
      if (progressTimer) clearInterval(progressTimer);
      reject(
        error?.code === "ENOENT"
          ? new Error("Could not run live Rovo arms because the `rovo` executable was not found.")
          : error
      );
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (progressTimer) clearInterval(progressTimer);
      exitCode = code;
      signalCode = signal;
      resolvePromise();
    });
  });

  await pollSessionProgress();
  const endedAt = Date.now();
  metadata.agent_process_ended_at = endedAt / 1000;
  metadata.total_duration_ms = endedAt - startedAt;
  metadata.agent_process_exit_code = exitCode;
  if (signalCode) metadata.agent_process_signal = signalCode;
  if (timedOut) {
    errorMessage = `Rovo ${label} arm timed out after ${Math.round(timeoutMs / 1000)} seconds.`;
  } else if (exitCode !== 0) {
    errorMessage = `Rovo ${label} arm exited with code ${exitCode}${
      signalCode ? ` (${signalCode})` : ""
    }: ${summarizeProcessFailure(undefined, stderr, stdout)}`;
  }
  finalResponse = rovoFinalTextFromSession(latestSessionPayload) || extractRovoFinalText(stdout);
  if (errorMessage) metadata.error = errorMessage;

  const completedTools = latestToolCalls.map((tool) => ({
    ...tool,
    end_time: tool.end_time ?? endedAt,
    is_error: Boolean(tool.is_error),
  }));
  const trace = {
    prompt,
    final_response: finalResponse,
    metadata,
    raw_events: [],
    tool_calls: completedTools,
    num_calls: completedTools.length,
    num_errors: completedTools.filter((tool) => Boolean(tool.is_error)).length,
    total_duration_ms: endedAt - startedAt,
    ...(errorMessage ? { error: errorMessage } : {}),
  };
  const answerPath = resolve(armDir, "answer.txt");
  const tracePath = resolve(armDir, "trace.json");
  await writeFile(answerPath, finalResponse, "utf8");
  await writeJsonFile(tracePath, trace);
  if (!finalResponse) {
    throw new Error(
      `${title} arm did not produce a final answer${errorMessage ? `: ${errorMessage}` : "."}`
    );
  }
  const toolCallLog = extractToolCallLog(trace);
  const tokenUsage = tokenUsageFromMetadata(metadata);
  const tokens = tokenUsage.displayTokens;
  const twgCalls = toolCallLog.filter((tool) => tool.twg).length;
  if (label === "control" && twgCalls > 0 && !errorMessage) {
    errorMessage = `Control arm used ${twgCalls} TWG call(s), so this run is not a valid free-context control.`;
    metadata.error = errorMessage;
    trace.error = errorMessage;
    await writeJsonFile(tracePath, trace);
  }
  lifecycle(
    hooks,
    `${title} finished: ${completedTools.length} tool call(s), ${twgCalls} TWG call(s).`
  );
  return {
    output: finalResponse,
    prompt,
    tokens,
    tokenUsage,
    toolCalls: completedTools.length,
    twgCalls,
    durationMs: endedAt - startedAt,
    toolErrors: trace.num_errors,
    toolCallLog,
    source: "live-agent",
    model,
    answerQualityStatus: errorMessage ? "partial" : "full",
    dataReturned: finalResponse.trim().length > 0,
    traceFile: tracePath,
    toolSurface: label === "control" ? ["atlassian-mcp", "local-mcp"] : ["twg-cli"],
    status: errorMessage ? "failed" : "completed",
  };
}

function summarizePlannerError(error, stderr, stdout) {
  const detail = [error?.message, stderr?.trim(), stdout?.trim()].filter(Boolean).join("\n");
  return detail.length > 500 ? `${detail.slice(0, 497)}...` : detail;
}

async function runTwgRoutePlan({ prompt, outputDir }, hooks) {
  const plannerDir = resolve(outputDir, "planner");
  await mkdir(plannerDir, { recursive: true });
  const promptPath = join(plannerDir, "prompt.txt");
  await writeFile(promptPath, prompt, "utf8");
  const command = process.env.TWG_BIN?.trim() || "twg";
  lifecycle(hooks, "Requesting TWG route plan.");

  let stdout = "";
  let stderr = "";
  let errorMessage = "";
  const startedAt = Date.now();
  await new Promise((resolvePromise) => {
    const child = spawn(command, [
      "benchmark",
      "lite",
      "plan",
      "--prompt-file",
      promptPath,
      "--json",
    ]);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      errorMessage = summarizePlannerError(error, stderr, stdout);
      resolvePromise();
    });
    child.on("close", (code, signal) => {
      if (code !== 0) {
        errorMessage = summarizePlannerError(
          new Error(`TWG route planner exited with code ${code}${signal ? ` (${signal})` : ""}.`),
          stderr,
          stdout
        );
      }
      resolvePromise();
    });
  });

  if (errorMessage) {
    lifecycle(hooks, `TWG route plan unavailable: ${errorMessage}`);
    return {
      status: "unavailable",
      planner: "twg-cli",
      durationMs: Date.now() - startedAt,
      error: errorMessage,
    };
  }

  try {
    const plan = JSON.parse(stdout);
    lifecycle(hooks, `TWG route plan ready: ${plan.intent ?? "unknown"}.`);
    return {
      status: "ready",
      durationMs: Date.now() - startedAt,
      ...plan,
    };
  } catch (error) {
    const detail = summarizePlannerError(error, stderr, stdout);
    lifecycle(hooks, `TWG route plan unreadable: ${detail}`);
    return {
      status: "unavailable",
      planner: "twg-cli",
      durationMs: Date.now() - startedAt,
      error: detail,
    };
  }
}

async function runLiveArms(options, hooks, prompt, outputDir, agent) {
  if (agent === "codex") {
    lifecycle(hooks, "Checking Codex runtime readiness.");
    await runCodexDoctor();
    lifecycle(hooks, "Codex runtime ready.");
  } else if (agent === "rovo") {
    lifecycle(hooks, "Checking Rovo runtime readiness.");
    await runRovoDoctor();
    lifecycle(hooks, "Rovo runtime ready.");
  } else {
    throw new Error(`Live benchmark-lite runs do not support --agent ${agent}.`);
  }
  const twgRoutePlan =
    options.twgRoutePlan && typeof options.twgRoutePlan === "object"
      ? options.twgRoutePlan
      : await runTwgRoutePlan({ prompt, outputDir }, hooks);
  if (options.twgRoutePlan && typeof options.twgRoutePlan === "object") {
    lifecycle(hooks, `TWG route plan ready: ${twgRoutePlan.intent ?? "unknown"}.`);
  }
  lifecycle(hooks, "Sub agents started: control and test.");
  const runLiveArm = agent === "rovo" ? runRovoLiveArm : runCodexLiveArm;
  const [control, test] = await Promise.all([
    runLiveArm({ label: "control", prompt, options, outputDir }, hooks),
    runLiveArm(
      {
        label: "test",
        prompt,
        options,
        outputDir,
        routePlan: twgRoutePlan?.status === "ready" ? twgRoutePlan : undefined,
      },
      hooks
    ),
  ]);
  lifecycle(hooks, "Reading live arm results.");
  return { control, test, twgRoutePlan };
}

async function readBenchmarkArmResult(path, label) {
  const absolutePath = resolve(path);
  const result = await readJsonObject(absolutePath);
  const resultDir = dirname(absolutePath);
  const traceRef = optionalString(result.trace_file);
  const tracePath = traceRef ? resolve(resultDir, traceRef) : undefined;
  const trace = tracePath ? await readOptionalJsonObject(tracePath) : undefined;
  const answerRef = optionalString(result.answer_file);
  const answerPath = answerRef ? resolve(resultDir, answerRef) : undefined;
  const answer = answerPath ? await readOptionalJsonObject(answerPath) : undefined;
  const traceMetadata =
    trace?.metadata && typeof trace.metadata === "object" && !Array.isArray(trace.metadata)
      ? trace.metadata
      : undefined;
  const output =
    optionalString(trace?.final_response) ??
    optionalString(answer?.final_response) ??
    optionalString(answer?.final_output) ??
    optionalString(result.final_response) ??
    "";
  if (!output) {
    throw new Error(
      `Could not find a final response in --${label}-result-file, its trace, or its answer artifact.`
    );
  }
  const durationSeconds = optionalNumber(result.wall_clock_seconds);
  const traceDurationMs = optionalNumber(trace?.total_duration_ms);
  const tokenUsage = tokenUsageFromMetadata(traceMetadata);
  const tokens =
    optionalNumber(result.tokens) ??
    tokenUsage.displayTokens ??
    optionalNumber(result.platform_total_tokens) ??
    tokenUsage.totalTokens;
  const toolCalls =
    optionalNumber(result.tool_calls) ??
    optionalNumber(trace?.num_calls) ??
    (Array.isArray(trace?.tool_calls) ? trace.tool_calls.length : null);
  const toolCallLog = extractToolCallLog(trace);
  const twgCalls =
    optionalNumber(result.twg_call_count) ??
    (Array.isArray(trace?.tool_calls) ? toolCallLog.filter((tool) => tool.twg).length : null);
  const toolErrors =
    optionalNumber(result.tool_errors) ??
    optionalNumber(trace?.num_errors) ??
    (Array.isArray(trace?.tool_calls)
      ? trace.tool_calls.filter((call) => Boolean(call?.is_error)).length
      : null);

  return {
    output,
    prompt:
      optionalString(result.prompt) ??
      optionalString(trace?.prompt) ??
      optionalString(answer?.prompt),
    tokens,
    tokenUsage,
    toolCalls,
    twgCalls,
    durationMs:
      durationSeconds !== null
        ? Math.round(durationSeconds * 1000)
        : traceDurationMs !== null
          ? Math.round(traceDurationMs)
          : null,
    toolErrors,
    toolCallLog,
    source: "benchmark-result",
    model:
      optionalString(result.resolved_model) ??
      optionalString(result.model) ??
      optionalString(trace?.agent_model),
    answerQualityStatus: optionalString(result.answer_quality_status),
    dataReturned: optionalBoolean(result.data_returned),
    traceFile: traceRef ?? tracePath,
  };
}

async function readArm(options, label) {
  const outputFile = label === "control" ? options.controlOutputFile : options.testOutputFile;
  const resultFile = label === "control" ? options.controlResultFile : options.testResultFile;
  if (outputFile && resultFile) {
    throw new Error(`Use either --${label}-output-file or --${label}-result-file, not both.`);
  }
  if (resultFile) {
    return readBenchmarkArmResult(resultFile, label);
  }
  if (!outputFile) {
    throw new Error(
      `Pass --${label}-output-file with a completed answer or --${label}-result-file with a benchmark result artifact.`
    );
  }
  return {
    output: await readFile(resolve(outputFile), "utf8"),
    tokens: null,
    tokenUsage: undefined,
    toolCalls: null,
    twgCalls: null,
    durationMs: null,
    toolErrors: null,
    toolCallLog: [],
    source: "output-file",
  };
}

async function readArmWithLifecycle(options, hooks, label) {
  const arm = await readArm(options, label);
  lifecycle(
    hooks,
    `${label === "control" ? "Control" : "Test"} arm finished: loaded ${arm.source.replaceAll(
      "-",
      " "
    )}.`
  );
  return arm;
}

function resolvePrompt({ explicitPrompt, controlPrompt, testPrompt }) {
  const warnings = [];
  const prompt = explicitPrompt ?? controlPrompt ?? testPrompt;
  if (!prompt) {
    throw new Error(
      "Pass --prompt/--prompt-file, or provide benchmark result artifacts that include a prompt."
    );
  }
  if (explicitPrompt) {
    for (const [label, value] of [
      ["control", controlPrompt],
      ["test", testPrompt],
    ]) {
      if (value && value !== explicitPrompt) {
        warnings.push(`${label} result prompt differs from --prompt/--prompt-file.`);
      }
    }
  } else if (controlPrompt && testPrompt && controlPrompt !== testPrompt) {
    warnings.push("Control and test result prompts differ.");
  }
  return { prompt, warnings };
}

function parseAgent(value) {
  const agent = (value ?? "codex").trim().toLowerCase();
  if (!SUPPORTED_AGENTS.has(agent)) {
    throw new Error(`--agent must be one of: ${[...SUPPORTED_AGENTS].join(", ")}.`);
  }
  return agent;
}

function parseJudgeAgent(value, defaultAgent) {
  const judgeAgent = (value ?? defaultAgent ?? "codex").trim().toLowerCase();
  if (!SUPPORTED_JUDGE_AGENTS.has(judgeAgent)) {
    throw new Error(`--judge-agent must be one of: ${[...SUPPORTED_JUDGE_AGENTS].join(", ")}.`);
  }
  return judgeAgent;
}

function parseStatus(value, optionName) {
  const status = value ?? "completed";
  if (status === "completed" || status === "blocked" || status === "failed") return status;
  throw new Error(`${optionName} must be completed, blocked, or failed.`);
}

function parseTools(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseClassification(value, optionName = "--classification") {
  const classification = typeof value === "string" ? value.trim() : "";
  if (QUALITY_CLASSIFICATIONS.has(classification)) return classification;
  throw new Error(`${optionName} must be one of: ${[...QUALITY_CLASSIFICATIONS].join(", ")}.`);
}

function parseQualityWinner(value, optionName) {
  const winner = typeof value === "string" ? value.trim() : "";
  if (QUALITY_WINNERS.has(winner)) return winner;
  throw new Error(`${optionName} winner must be control, test, tie, or not-comparable.`);
}

function normalizeQualityEvaluation(raw, source, judge) {
  const classification = parseClassification(
    optionalString(raw.classification) ?? "",
    source === "manual" ? "--classification" : "quality.classification"
  );
  const summary = optionalString(raw.summary);
  if (!summary) {
    throw new Error(
      source === "manual"
        ? "--summary is required when --classification is supplied."
        : "quality.summary must be a non-empty string."
    );
  }
  const dimensions = Array.isArray(raw.dimensions)
    ? raw.dimensions.map((item, index) => {
        const record = asRecord(item);
        if (!record) throw new Error(`quality.dimensions[${index}] must be an object.`);
        const name = optionalString(record.name);
        const explanation = optionalString(record.explanation);
        if (!name || !explanation) {
          throw new Error(
            `quality.dimensions[${index}] must include non-empty name and explanation fields.`
          );
        }
        return {
          name,
          winner: parseQualityWinner(record.winner, `quality.dimensions[${index}]`),
          explanation,
        };
      })
    : [];

  return {
    classification,
    summary,
    dimensions,
    source,
    ...(judge ? { judge } : {}),
  };
}

async function readQualityEvaluationFile(path) {
  return normalizeQualityEvaluation(await readJsonObject(resolve(path)), "file");
}

function validateQualityOptions(options) {
  const hasManual = Boolean(options.classification || options.summary);
  const sources = [hasManual, Boolean(options.qualityFile)].filter(Boolean);
  if (sources.length > 1) {
    throw new Error(
      "Use only one quality source: --quality-file or --classification with --summary."
    );
  }
  if (hasManual && (!options.classification || !options.summary)) {
    throw new Error("Manual quality review requires both --classification and --summary.");
  }
}

function manualQualityEvaluation(options) {
  if (!options.classification && !options.summary) return undefined;
  return normalizeQualityEvaluation(
    {
      classification: options.classification,
      summary: options.summary,
      dimensions: [],
    },
    "manual"
  );
}

function parseJudgeTimeoutMs(value) {
  if (!value) return DEFAULT_JUDGE_TIMEOUT_SECONDS * 1000;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 3600) {
    throw new Error("--judge-timeout-seconds must be greater than 0 and no more than 3600.");
  }
  return Math.round(seconds * 1000);
}

function buildIntegrity(options, promptWarnings, control, test) {
  const sameModelWhenObservable = control.model && test.model ? control.model === test.model : null;
  const controlDidNotUseTwg =
    control.twgCalls !== null ? control.twgCalls === 0 : options.controlUsedTwg !== true;
  const forbiddenControlMcpTools = forbiddenControlAtlassianMcpTools(control);
  const controlDidNotUseForbiddenAtlassianMcp = forbiddenControlMcpTools.length === 0;
  const testUsedTwg = test.twgCalls !== null ? test.twgCalls > 0 : options.testUsedTwg === true;
  const checks = {
    samePrompt: promptWarnings.length === 0,
    sameParentSession: null,
    sameAgentRuntime: true,
    sameModelWhenObservable,
    sameReasoningWhenObservable: null,
    controlDidNotUseTwg,
    controlDidNotUseForbiddenAtlassianMcp,
    controlDidNotUsePaidGraphTools: controlDidNotUseTwg && controlDidNotUseForbiddenAtlassianMcp,
    testUsedTwg,
    noParentTaskSolving: null,
    noCrossArmContext: null,
  };
  const warnings = [...promptWarnings];
  for (const [name, value] of Object.entries(checks)) {
    if (value === null) {
      warnings.push(`${name} was not observable in this benchmark-lite run.`);
    }
  }
  if (checks.sameModelWhenObservable === false) {
    warnings.push(
      `Control and test models differ: control=${control.model ?? "unknown"}, test=${test.model ?? "unknown"}.`
    );
  }
  if (!checks.testUsedTwg) {
    warnings.push(
      test.twgCalls !== null
        ? "Test arm benchmark artifact recorded zero TWG calls."
        : "Test arm TWG usage was not observed. Pass --test-used-twg after verifying it."
    );
  }
  if (!checks.controlDidNotUseTwg) {
    warnings.push(
      control.twgCalls !== null
        ? `Control arm benchmark artifact recorded ${control.twgCalls} TWG call(s).`
        : "Control arm used TWG, so the comparison is invalid."
    );
  }
  if (!checks.controlDidNotUseForbiddenAtlassianMcp) {
    warnings.push(
      `Control arm used forbidden broad Atlassian MCP tool(s): ${forbiddenControlMcpTools
        .map((tool) => tool.name)
        .join(", ")}.`
    );
  }
  return {
    valid: Object.values(checks).every((value) => value === true),
    checks,
    warnings,
  };
}

function judgeOutputSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["classification", "summary", "dimensions"],
    properties: {
      classification: {
        type: "string",
        enum: contract.qualityClassifications,
      },
      summary: {
        type: "string",
        minLength: 1,
      },
      dimensions: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "winner", "explanation"],
          properties: {
            name: { type: "string", minLength: 1 },
            winner: { type: "string", enum: [...QUALITY_WINNERS] },
            explanation: { type: "string", minLength: 1 },
          },
        },
      },
    },
  };
}

function buildJudgePrompt(result) {
  const payload = {
    prompt: result.prompt.text,
    control: {
      label: result.control.label,
      status: result.control.status,
      output: result.control.output,
      tokens: result.control.tokens,
      toolCalls: result.control.toolCalls,
      twgCalls: result.control.twgCalls,
      toolErrors: result.control.toolErrors,
      toolSurface: result.control.toolSurface,
      toolCallLog: result.control.toolCallLog.map((call) => ({
        name: call.name,
        surface: call.surface,
        area: call.area,
        error: call.error,
      })),
    },
    test: {
      label: result.test.label,
      status: result.test.status,
      output: result.test.output,
      tokens: result.test.tokens,
      toolCalls: result.test.toolCalls,
      twgCalls: result.test.twgCalls,
      toolErrors: result.test.toolErrors,
      toolSurface: result.test.toolSurface,
      toolCallLog: result.test.toolCallLog.map((call) => ({
        name: call.name,
        surface: call.surface,
        area: call.area,
        error: call.error,
      })),
    },
    integrity: result.integrity,
  };

  return [
    "You are judging one TWG benchmark-lite A/B comparison.",
    "",
    "Compare the final answers for the original prompt. Use tool metadata only as supporting evidence about source coverage and integrity; final answer usefulness is primary.",
    "",
    "Classification rules:",
    "- equivalent: both arms answer the core prompt equally well.",
    "- twg-better: the TWG CLI graph-context test answer is materially better.",
    "- control-better: the control answer is materially better.",
    "- capability-gain: the test answer provides a meaningful capability or evidence path the control answer could not provide, even if the answers are not directly quality-comparable.",
    "- not-comparable: use only when one or both answers are missing, unusable, or integrity problems make a fair comparison impossible.",
    "",
    "Evaluate coverage, correctness, evidence quality, directness, and stated limitations. Do not assign numeric scores. Keep the summary concise and concrete.",
    "",
    "Return only JSON matching the provided schema.",
    "",
    JSON.stringify(payload, null, 2),
  ].join("\n");
}

function runCodexExec(args, input, timeoutMs) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(codexExecutable(), args, {
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(
        error?.code === "ENOENT"
          ? new Error("Could not run Codex judge because the `codex` executable was not found.")
          : error
      );
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`Codex judge timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
        return;
      }
      if (code !== 0) {
        const detail = [stderr.trim(), stdout.trim()].filter(Boolean).join("\n");
        reject(
          new Error(
            `Codex judge failed${signal ? ` with signal ${signal}` : ""}${
              detail ? `:\n${detail}` : "."
            }`
          )
        );
        return;
      }
      resolvePromise();
    });
    child.stdin.end(input);
  });
}

function rovoJudgeConfig(options, judgeDir) {
  return {
    version: 1,
    agent: {
      streaming: false,
      temperature: 0,
      ...(options.judgeModel ? { modelId: String(options.judgeModel) } : {}),
      ...(options.judgeEffort ? { effortLevel: String(options.judgeEffort) } : {}),
      enableDeepPlanTool: false,
      experimental: {
        enableShadowMode: false,
        disableBuiltinAtlassianMcp: true,
      },
    },
    sessions: {
      persistenceDir: join(judgeDir, ".rovodev", "sessions"),
      enableWorkspaceStateSync: false,
    },
    console: {
      outputFormat: "markdown",
      showToolResults: false,
      enableStartupAnimations: false,
      terminalTitle: { isEnabled: false },
    },
    logging: {
      path: join(judgeDir, ".rovodev", "rovodev.log"),
      enablePromptCollection: false,
    },
    mcp: {
      mcpConfigPath: join(judgeDir, ".rovodev", "mcp.json"),
      allowedMcpServers: [],
      disabledMcpServers: [],
    },
    toolPermissions: {
      default: "deny",
      tools: {},
      bash: { default: "deny", commands: [], env: {} },
      allowedExternalPaths: [],
    },
    sessionFeedback: {
      permanentlyDisabled: true,
    },
  };
}

async function writeRovoJudgeConfig(judgeDir, options) {
  const configDir = join(judgeDir, ".rovodev");
  await mkdir(configDir, { recursive: true });
  await writeFile(join(configDir, "mcp.json"), "{}\n", "utf8");
  const configPath = join(configDir, "config.yml");
  await writeFile(
    configPath,
    `${JSON.stringify(rovoJudgeConfig(options, judgeDir), null, 2)}\n`,
    "utf8"
  );
  return configPath;
}

function jsonObjectFromText(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) {
    throw new Error("Rovo judge returned an empty response.");
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (asRecord(parsed)) return parsed;
  } catch {
    // Continue with fenced/block extraction.
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/iu);
  if (fenced?.[1]) {
    try {
      const parsed = JSON.parse(fenced[1].trim());
      if (asRecord(parsed)) return parsed;
    } catch {
      // Continue with brace extraction.
    }
  }
  const start = trimmed.indexOf("{");
  if (start < 0) {
    throw new Error("Rovo judge response did not contain a JSON object.");
  }
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        const parsed = JSON.parse(trimmed.slice(start, index + 1));
        if (asRecord(parsed)) return parsed;
        break;
      }
    }
  }
  throw new Error("Rovo judge response did not contain a valid JSON object.");
}

function runRovoJudgeExec(configPath, input, timeoutMs) {
  return new Promise((resolvePromise, reject) => {
    const judgeDir = dirname(dirname(configPath));
    const child = spawn(
      rovoExecutable(),
      [
        "run",
        "--config-file",
        configPath,
        "--verbose",
        "Read and follow the benchmark quality judge prompt in ./judge-prompt.md. Return only the requested JSON object.",
      ],
      {
        cwd: judgeDir,
        env: rovoChildEnv(),
        stdio: ["pipe", "pipe", "pipe"],
      }
    );
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      terminateChildProcess(child);
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.stdin.end(input);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(
        error?.code === "ENOENT"
          ? new Error("Could not run Rovo judge because the `rovo` executable was not found.")
          : error
      );
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`Rovo judge timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
        return;
      }
      if (code !== 0) {
        const detail = [stderr.trim(), stdout.trim()].filter(Boolean).join("\n");
        reject(
          new Error(
            `Rovo judge failed${signal ? ` with signal ${signal}` : ""}${
              detail ? `:\n${detail}` : "."
            }`
          )
        );
        return;
      }
      resolvePromise({ stdout, stderr });
    });
  });
}

async function runRovoQualityJudge(result, options, timeoutMs) {
  const judgeDir = await mkdtemp(join(tmpdir(), "twg-bench-lite-rovo-judge-"));
  try {
    const configPath = await writeRovoJudgeConfig(judgeDir, options);
    const prompt = [
      buildJudgePrompt(result),
      "",
      "JSON schema:",
      JSON.stringify(judgeOutputSchema(), null, 2),
    ].join("\n");
    await writeFile(join(judgeDir, "judge-prompt.md"), prompt, "utf8");
    const { stdout } = await runRovoJudgeExec(configPath, prompt, timeoutMs);
    const session = await readRovoSession(configPath);
    const response = rovoFinalTextFromSession(session.payload) || extractRovoFinalText(stdout);
    return normalizeQualityEvaluation(jsonObjectFromText(response), "judge", {
      agent: "rovo",
      ...(options.judgeModel ? { model: String(options.judgeModel) } : {}),
      ...(options.judgeEffort ? { effort: String(options.judgeEffort) } : {}),
    });
  } finally {
    await rm(judgeDir, { force: true, recursive: true });
  }
}

async function runCodexQualityJudge(result, options, timeoutMs) {
  const model = optionalString(options.judgeModel) ?? DEFAULT_JUDGE_MODEL;
  const effort = optionalString(options.judgeEffort) ?? DEFAULT_JUDGE_EFFORT;
  const judgeDir = await mkdtemp(join(tmpdir(), "twg-bench-lite-judge-"));
  try {
    const schemaPath = join(judgeDir, "judge-schema.json");
    const outputPath = join(judgeDir, "judge-output.json");
    await writeJsonFile(schemaPath, judgeOutputSchema());
    await runCodexExec(
      [
        "exec",
        "-m",
        model,
        "-c",
        `model_reasoning_effort=${JSON.stringify(effort)}`,
        "-s",
        "read-only",
        "--skip-git-repo-check",
        "--ephemeral",
        "--color",
        "never",
        "--output-schema",
        schemaPath,
        "-o",
        outputPath,
        "-C",
        judgeDir,
        "-",
      ],
      buildJudgePrompt(result),
      timeoutMs
    );
    return normalizeQualityEvaluation(await readJsonObject(outputPath), "judge", {
      agent: "codex",
      model,
      effort,
    });
  } finally {
    await rm(judgeDir, { force: true, recursive: true });
  }
}

async function runQualityJudge(result, options) {
  const timeoutMs = parseJudgeTimeoutMs(options.judgeTimeoutSeconds);
  const judgeAgent = parseJudgeAgent(options.judgeAgent, result.manifest.agent);
  if (judgeAgent === "rovo") {
    return runRovoQualityJudge(result, options, timeoutMs);
  }
  return runCodexQualityJudge(result, options, timeoutMs);
}

async function resolveQuality(options, result) {
  validateQualityOptions(options);
  if (options.qualityFile) return readQualityEvaluationFile(options.qualityFile);
  const manualQuality = manualQualityEvaluation(options);
  if (manualQuality) return manualQuality;
  if (options.judge === false) return undefined;
  return runQualityJudge(result, options);
}

function buildResult({ prompt, promptWarnings, agent, options, control, test, twgRoutePlan }) {
  const controlTools = parseTools(options.controlTools);
  const testTools = parseTools(options.testTools);
  return {
    schemaVersion: contract.schemaVersion,
    contractVersion: contract.contractVersion,
    prompt: {
      text: prompt,
      hash: sha256(prompt),
    },
    ...(twgRoutePlan ? { twgRoutePlan } : {}),
    manifest: {
      schemaVersion: contract.schemaVersion,
      contractVersion: contract.contractVersion,
      agent,
      model: options.model ?? test.model ?? control.model ?? "unspecified",
      promptHash: sha256(prompt),
      arms: {
        control: { label: contract.defaultArms.control.label },
        test: { label: contract.defaultArms.test.label },
      },
    },
    control: {
      label: contract.defaultArms.control.label,
      status: control.status ?? parseStatus(options.controlStatus, "--control-status"),
      output: control.output,
      tokens: control.tokens,
      tokenUsage: control.tokenUsage,
      toolCalls: control.toolCalls,
      twgCalls: control.twgCalls,
      durationMs: control.durationMs,
      toolErrors: control.toolErrors,
      ...outputMetrics(control.output),
      toolSurface: controlTools.length > 0 ? controlTools : (control.toolSurface ?? []),
      toolCallLog: control.toolCallLog,
      source: control.source,
      ...(control.model ? { model: control.model } : {}),
      ...(control.answerQualityStatus ? { answerQualityStatus: control.answerQualityStatus } : {}),
      ...(control.dataReturned !== undefined ? { dataReturned: control.dataReturned } : {}),
      ...(control.traceFile ? { traceFile: control.traceFile } : {}),
    },
    test: {
      label: contract.defaultArms.test.label,
      status: test.status ?? parseStatus(options.testStatus, "--test-status"),
      output: test.output,
      tokens: test.tokens,
      tokenUsage: test.tokenUsage,
      toolCalls: test.toolCalls,
      twgCalls: test.twgCalls,
      durationMs: test.durationMs,
      toolErrors: test.toolErrors,
      ...outputMetrics(test.output),
      toolSurface: testTools.length > 0 ? testTools : (test.toolSurface ?? []),
      toolCallLog: test.toolCallLog,
      source: test.source,
      ...(test.model ? { model: test.model } : {}),
      ...(test.answerQualityStatus ? { answerQualityStatus: test.answerQualityStatus } : {}),
      ...(test.dataReturned !== undefined ? { dataReturned: test.dataReturned } : {}),
      ...(test.traceFile ? { traceFile: test.traceFile } : {}),
    },
    integrity: buildIntegrity(options, promptWarnings, control, test),
  };
}

async function writeJsonFile(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sumMeasured(...values) {
  const measured = values.filter((value) => value !== null);
  if (measured.length === 0) return null;
  return measured.reduce((total, value) => total + value, 0);
}

function maxMeasured(...values) {
  const measured = values.filter((value) => value !== null);
  if (measured.length === 0) return null;
  return Math.max(...measured);
}

async function writeRunArtifacts(outputDir, result) {
  const absoluteDir = resolve(outputDir);
  await mkdir(absoluteDir, { recursive: true });
  const manifestPath = resolve(absoluteDir, "manifest.json");
  const resultPath = resolve(absoluteDir, "result.json");
  const reportPath = resolve(absoluteDir, "report.html");
  const progressPath = resolve(absoluteDir, "progress.jsonl");
  await writeJsonFile(manifestPath, result.manifest);
  await writeJsonFile(resultPath, result);
  await writeFile(reportPath, renderBenchmarkLiteReport(result), "utf8");
  const progress = [
    {
      status: "initialized",
      elapsedMs: null,
      toolCalls: null,
      tokens: null,
      lastActivity: "created",
    },
    {
      status: result.integrity.valid ? "completed" : "completed-with-warnings",
      elapsedMs: maxMeasured(result.control.durationMs, result.test.durationMs),
      toolCalls: sumMeasured(result.control.toolCalls, result.test.toolCalls),
      tokens: sumMeasured(result.control.tokens, result.test.tokens),
      lastActivity: "artifacts-written",
    },
  ];
  await writeFile(progressPath, `${progress.map((entry) => JSON.stringify(entry)).join("\n")}\n`);
  return { manifestPath, resultPath, reportPath, progressPath };
}

export async function runBenchmarkLite(options, hooks = {}) {
  validateQualityOptions(options);
  const agent = parseAgent(options.agent);
  const outputDir = options.outputDir ?? resolve(DEFAULT_RUN_ROOT, nowRunId());
  const liveRun = !hasArmArtifacts(options);
  lifecycle(hooks, `Starting comparison for ${agent}.`);
  lifecycle(hooks, `Control arm: ${contract.defaultArms.control.label}.`);
  lifecycle(hooks, `Treatment arm: ${contract.defaultArms.test.label}.`);
  lifecycle(hooks, liveRun ? "Reading prompt." : "Reading prompt and arm results.");
  const explicitPrompt = await readPromptInput(options);
  if (liveRun && !explicitPrompt) {
    throw new Error("Pass --prompt or --prompt-file for a live benchmark-lite run.");
  }
  const { control, test, twgRoutePlan } = liveRun
    ? await runLiveArms(options, hooks, explicitPrompt, outputDir, agent)
    : await Promise.all([
        readArmWithLifecycle(options, hooks, "control"),
        readArmWithLifecycle(options, hooks, "test"),
      ]).then(([control, test]) => ({ control, test }));
  lifecycle(hooks, "Checking prompt and run integrity.");
  const { prompt, warnings } = resolvePrompt({
    explicitPrompt,
    controlPrompt: control.prompt,
    testPrompt: test.prompt,
  });
  const baseResult = buildResult({
    prompt,
    promptWarnings: warnings,
    agent,
    options,
    control,
    test,
    twgRoutePlan,
  });
  if (options.qualityFile) {
    lifecycle(hooks, "Reading quality review file.");
  } else if (options.classification || options.summary) {
    lifecycle(hooks, "Using manual quality review.");
  } else if (options.judge === false) {
    lifecycle(hooks, "Skipping quality judge.");
  } else {
    const judgeAgent = parseJudgeAgent(options.judgeAgent, agent);
    lifecycle(
      hooks,
      `Evaluating responses with ${judgeAgent === "rovo" ? "Rovo" : "Codex"} quality judge.`
    );
  }
  const quality = await resolveQuality(options, baseResult);
  const result = quality ? { ...baseResult, quality } : baseResult;
  lifecycle(hooks, "Compiling report artifacts.");
  const artifacts = await writeRunArtifacts(outputDir, result);
  lifecycle(hooks, `Done: ${artifacts.reportPath}`);

  return {
    result,
    artifacts,
    payload: {
      contract: {
        name: contract.contractName,
        version: contract.contractVersion,
      },
      agent,
      promptHash: result.manifest.promptHash,
      integrity: result.integrity,
      ...(result.quality ? { quality: result.quality } : {}),
      artifacts,
    },
  };
}

export async function reportBenchmarkLite(resultPath, options = {}) {
  const absoluteResultPath = resolve(resultPath);
  const result = await readJsonObject(absoluteResultPath);
  const reportPath = resolve(
    options.reportFile ?? resolve(dirname(absoluteResultPath), "report.html")
  );
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, renderBenchmarkLiteReport(result), "utf8");
  return { reportPath };
}

export function doctorPayload() {
  return {
    contractName: contract.contractName,
    contractVersion: contract.contractVersion,
    displayName: contract.displayName,
    defaultArms: contract.defaultArms,
    runtimeSupport: contract.runtimeSupport,
    integrityChecks: contract.integrityChecks,
    qualityJudge: contract.qualityJudge,
    publicSafety: contract.publicSafety,
    commands: ["twg benchmark lite doctor", "twg benchmark lite run", "twg benchmark lite report"],
  };
}
