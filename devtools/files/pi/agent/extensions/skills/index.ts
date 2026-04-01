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
import {
  createRuntimeSettingsService,
  DEFAULT_RUNTIME_SETTINGS,
  type RuntimeSettings,
  type RuntimeSettingsService,
} from "./service/config.js";
import { injectSkillsIntoSystemPrompt } from "./service/systemprompt.js";
import { createSkillRegistry } from "./service/skill-registry.js";
import { CreateSkillSlashCommands, LoadSkillCommand } from "./cmds/skill.js";

export default function qualifiedSkillsExtension(pi: ExtensionAPI) {
  const registry = createSkillRegistry();

  // Load skills on session start
  pi.on("session_start", async (_event, ctx) => {
    let runtimeSettings: RuntimeSettings;
    let runtimeSettingsService: RuntimeSettingsService | null = null;
    try {
      runtimeSettingsService = await createRuntimeSettingsService();
      runtimeSettings = runtimeSettingsService.config;
    } catch {
      runtimeSettings = DEFAULT_RUNTIME_SETTINGS;
      ctx.ui.notify(
        "Failed to initialize skills config service; using built-in defaults",
        "warning",
      );
    }

    await registry.load({
      cwd: ctx.cwd,
      includeDefaults: true,
      lazySkills: runtimeSettings.lazySkills,
    });

    // Log diagnostics
    for (const diag of registry.diagnostics) {
      if (diag.type === "collision") {
        console.warn(
          `[qualified-skills] Collision: ${diag.message} (${diag.path})`,
        );
      }
    }

    if (registry.skills.length > 0) {
      const mode = runtimeSettings.lazySkills
        ? "lazy mode"
        : "full catalog mode";
      ctx.ui.notify(
        `Loaded ${registry.skills.length} skill(s) (${mode})`,
        "info",
      );
    }

    CreateSkillSlashCommands(
      pi,
      registry.skills,
      runtimeSettings,
      function (name, args) {
        const result = ReadSkillCommand(name, registry.skillMap);
        if (!result.ok) return;

        const message = buildSkillUserMessage(
          result.value.skill,
          result.value.body,
          args,
        );
        pi.sendUserMessage(message);
      },
    );

    pi.registerCommand("skills:config:reload", {
      description: "Reload runtime settings for the skills extension",
      handler: async (_args, cmdCtx: ExtensionContext) => {
        if (!runtimeSettingsService) {
          cmdCtx.ui.notify(
            "Config service is unavailable in this session; restart to retry initialization",
            "warning",
          );
          return;
        }

        try {
          await runtimeSettingsService.reload();
          runtimeSettings = runtimeSettingsService.config;
          await registry.load({
            cwd: cmdCtx.cwd,
            includeDefaults: true,
            lazySkills: runtimeSettings.lazySkills,
          });

          const mode = runtimeSettings.lazySkills
            ? "lazy mode"
            : "full catalog mode";

          cmdCtx.ui.notify(
            `Skills config reloaded (search=${runtimeSettings.searchStrategy}, mode=${mode}, commands=${runtimeSettings.enableSkillCommands ? "enabled" : "disabled"}, known=${registry.skillMap.size})`,
            "info",
          );

          if (!runtimeSettings.enableSkillCommands) {
            cmdCtx.ui.notify(
              "Skill slash commands were already registered for this session and cannot be unregistered until restart",
              "warning",
            );
          }
        } catch {
          cmdCtx.ui.notify("Failed to reload skills config", "error");
        }
      },
    });

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
        const output = FindSkillsCmd(
          registry.skills,
          params.query,
          runtimeSettings.searchStrategy,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          details: output,
        };
      },
    });

    const ReadSkillToolParams = Type.Object({
      name: Type.String({ description: "Skill qualified name or shortname" }),
    });
    pi.registerTool<typeof ReadSkillToolParams, unknown>({
      name: "read_skill",
      label: "Read Skill",
      description:
        "Load a skill by qualified name (or shortname when unambiguous) and return its SKILL.md content.",
      parameters: ReadSkillToolParams,
      async execute(_toolCallId, params) {
        const result = ReadSkillCommand(params.name, registry.skillMap);

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
          skills: registry.skillMap,
          sendSkillMessage(name, args) {
            const result = ReadSkillCommand(name, registry.skillMap);
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
      if (!registry.systemPromptBlock) {
        return;
      }

      return {
        systemPrompt: injectSkillsIntoSystemPrompt(
          event.systemPrompt,
          registry.systemPromptBlock,
        ),
      };
    });
  });

  pi.on("session_shutdown", async () => {
    await registry.dispose();
  });
}
