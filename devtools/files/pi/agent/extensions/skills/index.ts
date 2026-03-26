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
import { FindSkillsCmd } from "./cmds/find.js";
import { buildSkillUserMessage, ReadSkillCommand } from "./cmds/read.js";
export { formatReadSkillOutput, buildSkillUserMessage } from "./cmds/read.js";
import { getRuntimeSettings } from "./service/config.js";
import {
  formatSkillsForPrompt,
  injectSkillsIntoSystemPrompt,
} from "./service/systemprompt.js";
import { loadSkills, type Skill } from "./service/skill-registry.js";
import { CreateSkillSlashCommands, LoadSkillCommand } from "./cmds/skill.js";

export default function qualifiedSkillsExtension(pi: ExtensionAPI) {
  let skills: Skill[] = [];
  let skillsByQualifiedName: Map<string, Skill> = new Map();
  let skillPromptBlock = "";

  // Load skills on session start
  pi.on("session_start", async (_event, ctx) => {
    /**
     * TODO: Wrap this settings call in `@zenobius/pi-extension-config`
     * so we can make use of the lifecycle eventemitter it provides
     */
    const runtimeSettings = getRuntimeSettings(ctx.cwd);

    /**
     * TODO: load and process skills with eventemitter is ready
     */
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

    CreateSkillSlashCommands(
      pi,
      skills,
      runtimeSettings,
      function (name, args) {
        const result = ReadSkillCommand(name, skills, skillsByQualifiedName);
        if (!result.ok) return;

        const message = buildSkillUserMessage(
          result.value.skill,
          result.value.body,
          args,
        );
        pi.sendUserMessage(message);
      },
    );

    /**
     * TODO: end block for @zenobius/pi-extension-config
     * this means below register* no longer need to live inside this session_start callback
     */

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
        const output = FindSkillsCmd(skills, params.query, runtimeSettings.searchStrategy);
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
        const result = ReadSkillCommand(
          params.name,
          skills,
          skillsByQualifiedName,
        );

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

    // Register generic /skill command for qualified name + shortname fallback
    pi.registerCommand("skill", {
      description: "Load a skill by qualified name or shortname",
      handler: async (args, cmdCtx: ExtensionContext) => {
        LoadSkillCommand(args, {
          skills,
          skillsByQualifiedName,
          sendSkillMessage(name, args) {
            const result = ReadSkillCommand(
              name,
              skills,
              skillsByQualifiedName,
            );
            if (!result.ok) return;

            const message = buildSkillUserMessage(
              result.value.skill,
              result.value.body,
              args,
            );
            pi.sendUserMessage(message);
          },
          onInfoNotify(message) {
            cmdCtx.ui.notify(message, "info");
          },
          onWarningNotify(message) {
            cmdCtx.ui.notify(message, "warning");
          },
        });
      },
    });

    // Inject skills into system prompt, replacing any existing <available_skills> block
    pi.on("before_agent_start", async (event) => {
      if (!skillPromptBlock) {
        return;
      }

      return {
        systemPrompt: injectSkillsIntoSystemPrompt(
          event.systemPrompt,
          skillPromptBlock,
        ),
      };
    });
  });
}
