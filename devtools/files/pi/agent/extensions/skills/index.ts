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
 *
 * System Prompt Format:
 *   <available_skills>
 *     <skill>
 *       <name>experts-data-ai-data-analyst</name>
 *       <shortname>data-analyst</shortname>
 *       <description>...</description>
 *       <location>/path/to/SKILL.md</location>
 *     </skill>
 *   </available_skills>
 *
 * Commands:
 *   /skill:experts-data-ai-data-analyst   # Load skill by qualified name
 *   /skill experts-data-ai-data-analyst   # Load by qualified name or shortname fallback
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { loadSkills, formatSkillsForPrompt, readSkillContent, type Skill } from "./skill-loader.js";

type RuntimeSettings = {
  enableSkillCommands: boolean;
};

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
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function getRuntimeSettings(cwd: string): RuntimeSettings {
  const agentSettingsPath = join(getAgentDir(), "settings.json");
  const projectSettingsPath = resolve(cwd, ".pi", "settings.json");

  const agentSettings = readJsonFile(agentSettingsPath);
  const projectSettings = readJsonFile(projectSettingsPath);

  const enableSkillCommands =
    typeof projectSettings.enableSkillCommands === "boolean"
      ? projectSettings.enableSkillCommands
      : typeof agentSettings.enableSkillCommands === "boolean"
        ? agentSettings.enableSkillCommands
        : true;

  return {
    enableSkillCommands,
  };
}

export default function qualifiedSkillsExtension(pi: ExtensionAPI) {
  let skills: Skill[] = [];
  let skillsByQualifiedName: Map<string, Skill> = new Map();
  let skillPromptBlock: string = "";

  function sendSkillMessage(skill: Skill, args: string | undefined): void {
    const body = readSkillContent(skill);
    const skillBlock = `<skill name="${skill.qualifiedName}" shortname="${skill.name}" location="${skill.filePath}">
References are relative to ${skill.baseDir}.

${body}
</skill>`;

    const message = args ? `${skillBlock}\n\nUser: ${args}` : skillBlock;
    pi.sendUserMessage(message);
  }

  function resolveSkill(requestedName: string, ctx: ExtensionContext): Skill | undefined {
    // Try qualified name first
    let skill = skillsByQualifiedName.get(requestedName);

    // If not found, try matching by shortname (with warning if ambiguous)
    if (!skill) {
      const matchingSkills = skills.filter((s) => s.name === requestedName);

      if (matchingSkills.length === 1) {
        skill = matchingSkills[0];
        ctx.ui.notify(`Using "${skill.qualifiedName}" for shortname "${requestedName}"`, "info");
      } else if (matchingSkills.length > 1) {
        const options = matchingSkills.map((s) => s.qualifiedName);
        ctx.ui.notify(
          `Ambiguous shortname "${requestedName}". Use qualified name:\n${options.map((o) => `  /skill:${o}`).join("\n")}`,
          "warning"
        );
        return undefined;
      }
    }

    return skill;
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
    skillPromptBlock = formatSkillsForPrompt(skills);

    // Log diagnostics
    for (const diag of result.diagnostics) {
      if (diag.type === "collision") {
        console.warn(`[qualified-skills] Collision: ${diag.message} (${diag.path})`);
      }
    }

    // Notify user
    if (skills.length > 0) {
      ctx.ui.notify(`Loaded ${skills.length} skill(s) with qualified names`, "info");
    }

    if (!runtimeSettings.enableSkillCommands) {
      return;
    }

    // Register fully-qualified per-skill commands: /skill:<qualified-name>
    for (const skill of skills) {
      const commandName = `skill:${skill.qualifiedName}`;

      pi.registerCommand(commandName, {
        description: skill.description,
        handler: async (args, _cmdCtx) => {
          sendSkillMessage(skill, args || undefined);
        },
      });
    }

    // Register generic /skill command for qualified name + shortname fallback
    pi.registerCommand("skill", {
      description: "Load a skill by qualified name or shortname",
      handler: async (args, cmdCtx) => {
        const trimmed = args.trim();
        if (!trimmed) {
          cmdCtx.ui.notify("Usage: /skill <qualified-name|shortname> [extra instructions]", "warning");
          return;
        }

        const [requestedName, ...rest] = trimmed.split(/\s+/);
        const extraArgs = rest.length > 0 ? rest.join(" ") : undefined;
        const skill = resolveSkill(requestedName, cmdCtx);

        if (!skill) {
          cmdCtx.ui.notify(`Skill not found: ${requestedName}`, "error");
          return;
        }

        sendSkillMessage(skill, extraArgs);
      },
    });
  });

  // Inject skills into system prompt (only if no skills block already exists)
  pi.on("before_agent_start", async (event) => {
    if (!skillPromptBlock) {
      return;
    }

    if (event.systemPrompt.includes("<available_skills>")) {
      return;
    }

    return {
      systemPrompt: event.systemPrompt + skillPromptBlock,
    };
  });
}
