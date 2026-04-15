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

import {
  SettingsManager,
  type ExtensionAPI,
  type ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { Type } from "@mariozechner/pi-ai";
import { FindSkillsCmd, lexicalScoreSearch } from "./cmds/find.js";
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
  const piSettings = SettingsManager.create();

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
      lazySkills: runtimeSettings.lazySkills, // Don't read skill files until needed to save startup time
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
      ctx.ui.notify(`Found ${registry.skills.length} skill(s)`, "info");
    }

    if (piSettings.getEnableSkillCommands()) {
      CreateSkillSlashCommands(pi, registry.skills, function (name, args) {
        const result = ReadSkillCommand(name, registry.skillMap);
        if (!result.ok) return;

        const message = buildSkillUserMessage(
          result.value.skill,
          result.value.body,
          args,
        );
        pi.sendUserMessage(message);
      });
      ctx.ui.notify(
        `Registered slash commands for ${registry.skills.length} skill(s)`,
        "info",
      );
    }


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
          });

          cmdCtx.ui.notify(
            `Skills config reloaded: \n ${JSON.stringify(runtimeSettings, null, 2)}`,
            "info",
          );
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
              "Search query string, e.g. 'debugging typescript'",
          }),
          Type.Array(Type.String(), {
            description:
              "List of search queries, e.g. ['debugging typescript'] or [] to list all",
          }),
        ]),
      }),
      async execute(_toolCallId, params) {
        const query = Array.isArray(params.query) ? params.query : [params.query];
        const output = FindSkillsCmd(
          registry.skills,
          query,
          runtimeSettings.searchStrategy,
          { lexicalThreshold: runtimeSettings.lexicalThreshold },
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
      getArgumentCompletions(argumentPrefix) {
        return lexicalScoreSearch(
          argumentPrefix,
          registry.skills,
          runtimeSettings.lexicalThreshold,
        ).skills.map(
          (skill) => ({
            label: `${skill.shortname} (${skill.description})`,
            value: skill.name,
          }),
        );
      },
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

  let systemPromptInjected = false;
    // Inject skills into system prompt, replacing any existing <available_skills> block
    pi.on("before_agent_start", async (event) => {
      if (systemPromptInjected) { return }


      if (!registry.systemPromptBlock) {
        ctx.ui.notify(
          "No system prompt block defined for skills; skipping injection",
          "warning",
        );
        return;
      }

      if (!runtimeSettings.lazySkills) {
        ctx.ui.notify(`Injecting ${registry.skills.length} skill(s) into system prompt`, "info");
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
