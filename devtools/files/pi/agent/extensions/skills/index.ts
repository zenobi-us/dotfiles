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
import { Text } from "@mariozechner/pi-tui";

import { FindSkillsCmd, lexicalScoreSearch, SearchResults } from "./cmds/find.js";
import {
  createRuntimeSettingsService,
  DEFAULT_RUNTIME_SETTINGS,
  type RuntimeSettings,
  type RuntimeSettingsService,
} from "./service/config.js";
import { injectSkillsIntoSystemPrompt } from "./service/systemprompt.js";
import { createSkillRegistry } from "./service/skill-registry.js";
import { CreateSkillSlashCommands, LoadSkillCommand } from "./cmds/skill.js";
import { renderFoldedToolText } from "./core/tool-render.js";
import { buildSkillUserMessage, ReadSkillCommand } from "./cmds/read.js";

export {
  formatReadSkillOutput,
  buildSkillUserMessage,
  buildReadSkillCollapsedSummary,
} from "./cmds/read.js";

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

    const findSKillsParamsSchema = Type.Object({
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
      })

    type SearchErrorStack = {
      errorName: string;
      errorMessage: string;
      errorStack?: string;
      query: string | string[];
      strategy: RuntimeSettings["searchStrategy"];
      lexicalThreshold: number;
    }

    // Register lazy skill discovery/load tools
    pi.registerTool<typeof findSKillsParamsSchema, SearchErrorStack | SearchResults>({
      name: "find_skills",
      label: "Find Skills",
      description: "Search for available skills by natural language query.",
      parameters: findSKillsParamsSchema,
      async execute(_toolCallId, params) {
        const query = Array.isArray(params.query) ? params.query : [params.query];
        
        try {
          ctx.ui.notify(`find_skills: ${runtimeSettings.searchStrategy} search for "${query.join(", ")}"`, "info");
          
          const output = FindSkillsCmd(
            registry.skills,
            query,
            runtimeSettings.searchStrategy,
            { lexicalThreshold: runtimeSettings.lexicalThreshold },
          );
          return {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
            details: output
          };  
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          return {
            content: [{
              type: "text",
              text:
                `Error executing cmds/find/FindSkillsCmd: ${error.message}` +
                (error.stack ? `\n\nStack:\n${error.stack}` : ""),
            }],
            details: {
              errorName: error.name,
              errorMessage: error.message,
              errorStack: error.stack,
              query,
              strategy: runtimeSettings.searchStrategy,
              lexicalThreshold: runtimeSettings.lexicalThreshold,
            },
            isError: true,
          };
        }

      },
      renderResult(result, options, theme) {
        return renderFoldedToolText(result, options, theme, {
          loadingLabel: "Searching skills...",
          previewLines: 16,
          collapsedPrefix: (data) => {
            const details = data.result.details as
              | { meta?: { matches?: number; total?: number } }
              | undefined;
            const matches = details?.meta?.matches;
            const total = details?.meta?.total;
            return typeof matches === "number" && typeof total === "number"
              ? `Found ${matches} of ${total} Skills`
              : undefined;
          },
        });
      },
    });

    const ReadSkillToolParams = Type.Object({
      name: Type.String({ description: "Skill qualified name or shortname" }),
    });
    pi.registerTool<typeof ReadSkillToolParams, ReturnType<typeof ReadSkillCommand>['error'] | ReturnType<typeof ReadSkillCommand>['value']>({
      name: "read_skill",
      label: "Read Skill",
      description:
        "Load a skill by qualified name (or shortname when unambiguous) and return its SKILL.md content.",
      parameters: ReadSkillToolParams,
      async execute(_toolCallId, params) {
        const result = ReadSkillCommand(params.name, registry.skillMap);

        if (!result.ok) {
          return {
            content: [{
              type: "text",
              text: "Unknown error",
            }],
            details: result.error,
          }
        }

        return {
          content: [{ type: "text", text: result.value.text }],
          details: result.value
        };
      },

      renderResult(result, options, theme) {
        if (options.isPartial) {
          return new Text(theme.fg("toolOutput", "Reading skill..."), 0, 0);
        }

        if (options.expanded) {
          return renderFoldedToolText(result, options, theme, {
            loadingLabel: "Reading skill...",
            previewLines: 20,
          });
        }

        return renderFoldedToolText(result, options, theme, {
          loadingLabel: "Reading skill...",
          previewLines: 0, // Don't show any preview lines in collapsed state since the prefix contains identifying info about the skill 
          collapsedPrefix: (data) => {
            if (!data.result.details || "isError" in data.result.details) {
              return "unknown skill";
            }
            const name = data.result?.details?.skill.name

            return `Loaded skill "${name ?? "unknown"}".` 
          },
        })

      }
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
