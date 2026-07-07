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
} from "@earendil-works/pi-coding-agent";
import { Type } from "@earendil-works/pi-ai";
import { Text } from "@earendil-works/pi-tui";

import { existsSync } from "node:fs";
import {
  FindSkillsCmd,
  lexicalScoreSearch,
  SearchResults,
} from "./cmds/find.js";
import {
  createRuntimeSettingsService,
  DEFAULT_RUNTIME_SETTINGS,
  type RuntimeSettings,
  type RuntimeSettingsService,
} from "./service/config.js";
import { injectSkillsIntoSystemPrompt } from "./service/systemprompt.js";
import {
  createSkillRegistry,
  resolveSkillRoots,
} from "./service/skill-registry.js";
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

  pi.registerFlag("skills-debug", {
    description: "Show skills extension startup diagnostics",
    type: "boolean",
    default: false,
  });
  // defer SettingsManager access until session_start to avoid load-time failures

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

    const skillsDebug = pi.getFlag("skills-debug") === true;
    const resolvedRoots = resolveSkillRoots({
      cwd: ctx.cwd,
      includeDefaults: true,
    });

    const debugLog = (message: string) => {
      // info notifications can be hidden when quietStartup is enabled
      if (ctx.hasUI) ctx.ui.notify(message, "warning");
    };

    if (skillsDebug) {
      let packageSources: string[] = [];
      try {
        const configured = SettingsManager.create(ctx.cwd).getPackages();
        packageSources = configured
          .map((pkg) => (typeof pkg === "string" ? pkg : pkg?.source))
          .filter(
            (value): value is string =>
              typeof value === "string" && value.length > 0,
          );
      } catch {
        packageSources = [];
      }

      const rootDetails = resolvedRoots.map((root) => ({
        root,
        exists: existsSync(root),
      }));

      debugLog(
        `[skills-debug] package sources:\n${packageSources.map((s) => `- ${s}`).join("\n") || "- (none)"}`,
      );
      debugLog(
        `[skills-debug] roots:\n${
          rootDetails
            .map((r) => `- ${r.root} [${r.exists ? "exists" : "missing"}]`)
            .join("\n") || "- (none)"
        }`,
      );
      debugLog(
        `[skills-debug] resolved roots:\n${resolvedRoots.map((root) => `- ${root}`).join("\n") || "- (none)"}`,
      );
    }

    await registry.load({
      cwd: ctx.cwd,
      includeDefaults: true,
      lazySkills: runtimeSettings.lazySkills, // Don't read skill files until needed to save startup time
    });

    if (skillsDebug) {
      debugLog(`[skills-debug] loaded ${registry.skills.length} skill(s)`);
    }

    if (skillsDebug) {
      const perRootCounts = resolvedRoots.map((root) => {
        const normalizedRoot = root.endsWith("/") ? root : `${root}/`;
        const count = registry.skills.filter(
          (s) => s.filePath.startsWith(normalizedRoot) || s.filePath === root,
        ).length;
        return { root, count };
      });

      debugLog(
        `[skills-debug] per-root skill counts:\n${
          perRootCounts.map((r) => `- ${r.root}: ${r.count}`).join("\n") ||
          "- (none)"
        }`,
      );
    }

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

    if (runtimeSettings.enableSkillCommands) {
      CreateSkillSlashCommands(
        pi,
        registry.skills,
        runtimeSettings.skillCommandTemplates,
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

    pi.registerCommand("skills:registry:stats", {
      description: "Print skill registry stats",
      handler: async (_args, cmdCtx: ExtensionContext) => {
        const skills = registry.skills;
        const diagnostics = registry.diagnostics;
        const roots = resolveSkillRoots({
          cwd: cmdCtx.cwd,
          includeDefaults: true,
        });

        const disabledCount = skills.filter(
          (s) => s.disableModelInvocation,
        ).length;
        const qualifiedNames = new Set(skills.map((s) => s.qualifiedName));
        const shortnameCounts = new Map<string, number>();
        for (const skill of skills) {
          shortnameCounts.set(
            skill.name,
            (shortnameCounts.get(skill.name) ?? 0) + 1,
          );
        }
        const ambiguousShortnames = Array.from(shortnameCounts.entries())
          .filter(([, count]) => count > 1)
          .map(([name]) => name)
          .sort();

        const warningCount = diagnostics.filter(
          (d) => d.type === "warning",
        ).length;
        const collisionCount = diagnostics.filter(
          (d) => d.type === "collision",
        ).length;

        const stats = {
          totals: {
            skills: skills.length,
            uniqueQualifiedNames: qualifiedNames.size,
            disabledModelInvocation: disabledCount,
            ambiguousShortnames: ambiguousShortnames.length,
          },
          diagnostics: {
            warnings: warningCount,
            collisions: collisionCount,
          },
          roots,
          examples: {
            ambiguousShortnames: ambiguousShortnames.slice(0, 20),
          },
        };

        cmdCtx.ui.notify(
          `Skill registry stats:\n${JSON.stringify(stats, null, 2)}`,
          "info",
        );
      },
    });

    const findSKillsParamsSchema = Type.Object({
      query: Type.Union([
        Type.String({
          description: "Search query string, e.g. 'debugging typescript'",
        }),
        Type.Array(Type.String(), {
          description:
            "List of search queries, e.g. ['debugging typescript'] or [] to list all",
        }),
      ]),
    });

    type SearchErrorStack = {
      errorName: string;
      errorMessage: string;
      errorStack?: string;
      query: string | string[];
      strategy: RuntimeSettings["searchStrategy"];
      lexicalThreshold: number;
    };

    // Register lazy skill discovery/load tools
    pi.registerTool<
      typeof findSKillsParamsSchema,
      SearchErrorStack | SearchResults
    >({
      name: "find_skills",
      label: "Find Skills",
      description: "Search for available skills by natural language query.",
      parameters: findSKillsParamsSchema,
      async execute(_toolCallId, params, _signal, _onUpdate, toolCtx) {
        const query = Array.isArray(params.query)
          ? params.query
          : [params.query];

        try {
          toolCtx.ui.notify(
            `find_skills: ${runtimeSettings.searchStrategy} search for "${query.join(", ")}"`,
            "info",
          );

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
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          return {
            content: [
              {
                type: "text",
                text:
                  `Error executing cmds/find/FindSkillsCmd: ${error.message}` +
                  (error.stack ? `\n\nStack:\n${error.stack}` : ""),
              },
            ],
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
        if (options.isPartial) {
          return new Text(theme.fg("toolOutput", "Searching skills..."), 0, 0);
        }

        if (options.expanded) {
          return renderFoldedToolText(result, options, theme, {
            loadingLabel: "Searching skills...",
            previewLines: 16,
          });
        }

        const details = result.details as
          | {
              skills?: Array<{ shortname?: string; name?: string }>;
              meta?: { matches?: number };
            }
          | undefined;

        const sample = (details?.skills ?? [])
          .slice(0, 3)
          .map((s) => s.shortname ?? s.name)
          .filter((v): v is string => Boolean(v));

        const namesText =
          sample.length > 0 ? sample.join(", ") : "(no matches)";
        const count = details?.meta?.matches ?? details?.skills?.length ?? 0;

        const line1 = theme.fg("toolOutput", namesText);
        const line2 = theme.fg("success", `Found: ${count} skills`);

        return new Text(`${line1}\n${line2}`, 0, 0);
      },
    });

    const ReadSkillToolParams = Type.Object({
      name: Type.String({ description: "Skill qualified name or shortname" }),
    });
    pi.registerTool<
      typeof ReadSkillToolParams,
      | ReturnType<typeof ReadSkillCommand>["error"]
      | ReturnType<typeof ReadSkillCommand>["value"]
    >({
      name: "read_skill",
      label: "Read Skill",
      description:
        "Load a skill by qualified name (or shortname when unambiguous) and return its SKILL.md content.",
      parameters: ReadSkillToolParams,
      async execute(_toolCallId, params) {
        const result = ReadSkillCommand(params.name, registry.skillMap);

        if (!result.ok) {
          return {
            content: [
              {
                type: "text",
                text: "Unknown error",
              },
            ],
            details: result.error,
          };
        }

        return {
          content: [{ type: "text", text: result.value.text }],
          details: result.value,
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
            const name = data.result?.details?.skill.name;

            return `Loaded skill "${name ?? "unknown"}".`;
          },
        });
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
        ).skills.map((skill) => ({
          label: `${skill.shortname} (${skill.description})`,
          value: skill.name,
        }));
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
    pi.on("before_agent_start", async (event, eventCtx) => {
      if (systemPromptInjected) {
        return;
      }

      if (!registry.systemPromptBlock) {
        eventCtx.ui.notify(
          "No system prompt block defined for skills; skipping injection",
          "warning",
        );
        return;
      }

      if (!runtimeSettings.lazySkills) {
        eventCtx.ui.notify(
          `Injecting ${registry.skills.length} skill(s) into system prompt`,
          "info",
        );
      }

      systemPromptInjected = true;
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
