/**
 * Qualified Skills Extension
 *
 * Replaces built-in skill loading with path-qualified kebab-case names.
 *
 * Example:
 *   skills/experts/data-ai/data-analyst/SKILL.md
 *   -> qualifiedName: "experts-data-ai-data-analyst"
 *   -> shortname: "data-analyst"
 *
 * Usage:
 *   pi --no-skills   # Disable built-in skills, this extension takes over
 */

import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { Type } from "@mariozechner/pi-ai";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import {
  loadSkills,
  formatSkillsForPrompt,
  readSkillContent,
  type Skill,
} from "./skill-loader.js";

type RuntimeSettings = {
  enableSkillCommands: boolean;
  lazySkills: boolean;
};

type ResolvedSkill =
  | { kind: "found"; skill: Skill; usedShortnameFallback: boolean }
  | { kind: "ambiguous"; requestedName: string; options: string[] }
  | { kind: "not_found"; requestedName: string };

function getAgentDir(): string {
  const envCandidates = ["PI_CODING_AGENT_DIR", "TAU_CODING_AGENT_DIR"];

  for (const key of envCandidates) {
    const value = process.env[key];
    if (value) return value;
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith("_CODING_AGENT_DIR") && value) {
      return value;
    }
  }

  return join(homedir(), ".pi", "agent");
}

function readJsonFile(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};

  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function readBooleanSetting(
  projectSettings: Record<string, unknown>,
  agentSettings: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  if (typeof projectSettings[key] === "boolean")
    return projectSettings[key] as boolean;
  if (typeof agentSettings[key] === "boolean")
    return agentSettings[key] as boolean;
  return fallback;
}

function getRuntimeSettings(cwd: string): RuntimeSettings {
  const agentSettingsPath = join(getAgentDir(), "settings.json");
  const projectSettingsPath = resolve(cwd, ".pi", "settings.json");

  const agentSettings = readJsonFile(agentSettingsPath);
  const projectSettings = readJsonFile(projectSettingsPath);

  return {
    enableSkillCommands: readBooleanSetting(
      projectSettings,
      agentSettings,
      "enableSkillCommands",
      true,
    ),
    lazySkills: readBooleanSetting(
      projectSettings,
      agentSettings,
      "lazySkills",
      false,
    ),
  };
}

function parseSkillQuery(query: string | string[]): {
  include: string[];
  exclude: string[];
  listAll: boolean;
} {
  const raw = (Array.isArray(query) ? query : [query]).join(" ").trim();

  if (!raw || raw === "*") {
    return { include: [], exclude: [], listAll: true };
  }

  const parts = raw
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const include: string[] = [];
  const exclude: string[] = [];

  for (const part of parts) {
    if (part.startsWith("-") && part.length > 1) {
      exclude.push(part.slice(1).toLowerCase());
      continue;
    }
    include.push(part.toLowerCase());
  }

  return { include, exclude, listAll: include.length === 0 };
}

function searchSkills(skills: Skill[], query: string | string[]) {
  const parsed = parseSkillQuery(query);
  const visibleSkills = skills.filter((s) => !s.disableModelInvocation);

  let matches = visibleSkills;

  if (!parsed.listAll) {
    matches = matches.filter((skill) => {
      const haystack =
        `${skill.qualifiedName} ${skill.name} ${skill.description}`.toLowerCase();
      return parsed.include.every((term) => haystack.includes(term));
    });
  }

  if (parsed.exclude.length > 0) {
    matches = matches.filter((skill) => {
      const haystack =
        `${skill.qualifiedName} ${skill.name} ${skill.description}`.toLowerCase();
      return !parsed.exclude.some((term) => haystack.includes(term));
    });
  }

  return {
    query,
    skills: matches.map((skill) => ({
      name: skill.qualifiedName,
      shortname: skill.name,
      description: skill.description,
      location: skill.filePath,
    })),
    summary: {
      total: visibleSkills.length,
      matches: matches.length,
      feedback:
        matches.length === 0
          ? "No skills matched. Try broader terms or query '*' to list all skills."
          : parsed.listAll
            ? `Listing all ${matches.length} skills`
            : `Found ${matches.length} matching skill(s)`,
    },
  };
}

export function formatReadSkillOutput(skill: Skill, body: string): string {
  return `---
qualified_name: ${skill.qualifiedName}
shortname: ${skill.name}
location: ${skill.filePath}
references: relative to ${skill.baseDir}
---

${body}`;
}

export function buildSkillUserMessage(
  skill: Skill,
  body: string,
  args?: string,
): string {
  const text = formatReadSkillOutput(skill, body);
  return args ? `${text}\n\nUser: ${args}` : text;
}

export default function qualifiedSkillsExtension(pi: ExtensionAPI) {
  let skills: Skill[] = [];
  let skillsByQualifiedName: Map<string, Skill> = new Map();
  let skillPromptBlock = "";

  function readSkillResult(requestedName: string) {
    const resolved = resolveSkill(requestedName);

    if (resolved.kind === "ambiguous") {
      return {
        ok: false as const,
        error: {
          content: [
            {
              type: "text" as const,
              text:
                `Ambiguous shortname \"${resolved.requestedName}\". ` +
                `Use one of: ${resolved.options.join(", ")}`,
            },
          ],
          details: resolved,
          isError: true,
        },
      };
    }

    if (resolved.kind === "not_found") {
      return {
        ok: false as const,
        error: {
          content: [
            {
              type: "text" as const,
              text: `Skill not found: ${resolved.requestedName}`,
            },
          ],
          details: resolved,
          isError: true,
        },
      };
    }

    const body = readSkillContent(resolved.skill);
    const text = formatReadSkillOutput(resolved.skill, body);

    return {
      ok: true as const,
      value: {
        text,
        body,
        skill: resolved.skill,
        usedShortnameFallback: resolved.usedShortnameFallback,
      },
    };
  }

  function sendSkillMessage(
    requestedName: string,
    args: string | undefined,
  ): void {
    const result = readSkillResult(requestedName);
    if (!result.ok) return;

    const message = buildSkillUserMessage(
      result.value.skill,
      result.value.body,
      args,
    );
    pi.sendUserMessage(message);
  }

  function resolveSkill(requestedName: string): ResolvedSkill {
    // Try qualified name first
    const byQualified = skillsByQualifiedName.get(requestedName);
    if (byQualified) {
      return {
        kind: "found",
        skill: byQualified,
        usedShortnameFallback: false,
      };
    }

    // Fallback to shortname
    const matchingSkills = skills.filter((s) => s.name === requestedName);
    if (matchingSkills.length === 1) {
      return {
        kind: "found",
        skill: matchingSkills[0],
        usedShortnameFallback: true,
      };
    }

    if (matchingSkills.length > 1) {
      return {
        kind: "ambiguous",
        requestedName,
        options: matchingSkills.map((s) => s.qualifiedName).sort(),
      };
    }

    return { kind: "not_found", requestedName };
  }

  // Load skills on session start
  pi.on("session_start", async (_event, ctx) => {
    const runtimeSettings = getRuntimeSettings(ctx.cwd);

    const result = loadSkills({
      cwd: ctx.cwd,
      includeDefaults: true,
    });

    skills = result.skills;
    skillsByQualifiedName = new Map(skills.map((s) => [s.qualifiedName, s]));
    skillPromptBlock = formatSkillsForPrompt(skills, {
      lazySkills: runtimeSettings.lazySkills,
    });

    // Log diagnostics
    for (const diag of result.diagnostics) {
      if (diag.type === "collision") {
        console.warn(
          `[qualified-skills] Collision: ${diag.message} (${diag.path})`,
        );
      }
    }

    if (skills.length > 0) {
      const mode = runtimeSettings.lazySkills
        ? "lazy mode"
        : "full catalog mode";
      ctx.ui.notify(`Loaded ${skills.length} skill(s) (${mode})`, "info");
    }

    // Register lazy skill discovery/load tools
    pi.registerTool({
      name: "find_skills",
      label: "Find Skills",
      description: "Search for available skills by natural language query.",
      parameters: Type.Object({
        query: Type.Union([
          Type.String({
            description:
              "Search query, e.g. 'debugging typescript' or '*' to list all",
          }),
          Type.Array(Type.String(), { description: "List of query terms" }),
        ]),
      }),
      async execute(_toolCallId, params) {
        const output = searchSkills(skills, params.query);
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          details: output,
        };
      },
    });

    pi.registerTool({
      name: "read_skill",
      label: "Read Skill",
      description:
        "Load a skill by qualified name (or shortname when unambiguous) and return its SKILL.md content.",
      parameters: Type.Object({
        name: Type.String({ description: "Skill qualified name or shortname" }),
      }),
      async execute(_toolCallId, params) {
        const result = readSkillResult(params.name);

        if (!result.ok) {
          return result.error;
        }

        return {
          content: [{ type: "text", text: result.value.text }],
          details: {
            requestedName: params.name,
            resolvedQualifiedName: result.value.skill.qualifiedName,
            usedShortnameFallback: result.value.usedShortnameFallback,
            filePath: result.value.skill.filePath,
          },
        };
      },
    });

    if (!runtimeSettings.enableSkillCommands) {
      return;
    }

    // Register fully-qualified per-skill commands: /skill:<qualified-name>
    for (const skill of skills) {
      const commandName = `skill:${skill.qualifiedName}`;

      pi.registerCommand(commandName, {
        description: skill.description,
        handler: async (args, _cmdCtx) => {
          sendSkillMessage(skill.qualifiedName, args || undefined);
        },
      });
    }

    // Register generic /skill command for qualified name + shortname fallback
    pi.registerCommand("skill", {
      description: "Load a skill by qualified name or shortname",
      handler: async (args, cmdCtx: ExtensionContext) => {
        const trimmed = args.trim();
        if (!trimmed) {
          cmdCtx.ui.notify(
            "Usage: /skill <qualified-name|shortname> [extra instructions]",
            "warning",
          );
          return;
        }

        const [requestedName, ...rest] = trimmed.split(/\s+/);
        const extraArgs = rest.length > 0 ? rest.join(" ") : undefined;

        const resolved = resolveSkill(requestedName);
        if (resolved.kind === "ambiguous") {
          cmdCtx.ui.notify(
            `Ambiguous shortname "${resolved.requestedName}". Use qualified name:\n${resolved.options.map((o) => `  /skill:${o}`).join("\n")}`,
            "warning",
          );
          return;
        }

        if (resolved.kind === "not_found") {
          cmdCtx.ui.notify(`Skill not found: ${requestedName}`, "error");
          return;
        }

        if (resolved.usedShortnameFallback) {
          cmdCtx.ui.notify(
            `Using "${resolved.skill.qualifiedName}" for shortname "${requestedName}"`,
            "info",
          );
        }

        sendSkillMessage(requestedName, extraArgs);
      },
    });
  });

  // Inject skills into system prompt, replacing any existing <available_skills> block
  pi.on("before_agent_start", async (event) => {
    if (!skillPromptBlock) {
      return;
    }

    const cleanedPrompt = event.systemPrompt
      .replace(/\n?<available_skills>[\s\S]*?<\/available_skills>\n?/g, "\n")
      .replace(/\n{3,}/g, "\n\n");
    const promptWithSkillsBeforeDate = cleanedPrompt.replace(
      /(\nCurrent date:\s*\d{4}-\d{2}-\d{2})/,
      `${skillPromptBlock}$1`,
    );
    return {
      systemPrompt:
        promptWithSkillsBeforeDate === cleanedPrompt
          ? cleanedPrompt + skillPromptBlock
          : promptWithSkillsBeforeDate,
    };
  });
}
