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
  getMarkdownTheme,
  SettingsManager,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "@earendil-works/pi-ai";
import { Container, Markdown, Spacer } from "@earendil-works/pi-tui";

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
import {
  buildCollapsedSkillSearchMarkdown,
  buildSkillSearchMarkdown,
  renderMarkdownSafely,
  renderToolStatusLine,
} from "./core/tool-render.js";
import { buildSkillUserMessage, ReadSkillCommand } from "./cmds/read.js";
import {
  resolveRepositoryContext,
  skillMatchesPatterns,
} from "./service/repository.js";

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
    const repository = await resolveRepositoryContext(
      (args, cwd) => pi.exec("git", args, { cwd, timeout: 5000 }),
      ctx.cwd,
    );
    const projectTrusted = ctx.isProjectTrusted();
    const resolvedRoots = resolveSkillRoots({
      cwd: ctx.cwd,
      projectRoot: repository?.root,
      includeProjectAgentSkills: projectTrusted,
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
      debugLog(
        `[skills-debug] repository slug: ${repository?.slug ?? "(none)"}`,
      );
    }

    const enabledPatterns = repository?.slug
      ? (runtimeSettings.enabled[repository.slug] ?? [])
      : [];
    await registry.load({
      cwd: ctx.cwd,
      projectRoot: repository?.root,
      includeProjectAgentSkills: projectTrusted,
      includeDefaults: true,
      lazySkills: runtimeSettings.lazySkills, // Don't read skill files until needed to save startup time
      indexSkill:
        projectTrusted && repository && enabledPatterns.length > 0
          ? (skill) =>
              skillMatchesPatterns(skill, repository.root, enabledPatterns)
          : undefined,
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
          const reloadedPatterns = repository?.slug
            ? (runtimeSettings.enabled[repository.slug] ?? [])
            : [];
          await registry.load({
            cwd: cmdCtx.cwd,
            projectRoot: repository?.root,
            includeProjectAgentSkills: cmdCtx.isProjectTrusted(),
            includeDefaults: true,
            lazySkills: runtimeSettings.lazySkills,
            indexSkill:
              cmdCtx.isProjectTrusted() &&
              repository &&
              reloadedPatterns.length > 0
                ? (skill) =>
                    skillMatchesPatterns(
                      skill,
                      repository.root,
                      reloadedPatterns,
                    )
                : undefined,
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
          projectRoot: repository?.root,
          includeProjectAgentSkills: cmdCtx.isProjectTrusted(),
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
      renderCall(args, theme, context) {
        if (!context.isPartial) return new Container();

        const query = Array.isArray(args.query)
          ? args.query.join(", ") || "all"
          : args.query || "all";

        return renderToolStatusLine(theme, {
          tool: "Find Skill",
          item: query,
          status: "Searching ⠋",
          tone: "warning",
        });
      },
      renderResult(result, options, theme, context) {
        if (options.isPartial) return new Container();

        const query = Array.isArray(context.args.query)
          ? context.args.query.join(", ") || "all"
          : context.args.query || "all";
        const details = result.details;

        if (!details || !("skills" in details)) {
          return renderToolStatusLine(theme, {
            tool: "Find Skill",
            item: query,
            status: "Registry Unavailable",
            tone: "error",
          });
        }

        if (details.skills.length === 0) {
          return renderToolStatusLine(theme, {
            tool: "Find Skill",
            item: query,
            status: "No Matches",
          });
        }

        const expanded = options.expanded === true;
        const container = new Container();
        container.addChild(
          renderToolStatusLine(theme, {
            tool: "Find Skill",
            item: query,
            status: `Found ${details.meta.matches}`,
            expandable: !expanded,
            tone: "success",
          }),
        );
        container.addChild(new Spacer(1));
        container.addChild(
          renderMarkdownSafely(
            expanded
              ? buildSkillSearchMarkdown(details.skills, details.meta.matches)
              : buildCollapsedSkillSearchMarkdown(details.skills, details.meta.matches),
            getMarkdownTheme(),
          ),
        );

        return container;
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

      renderCall(args, theme, context) {
        if (!context.isPartial) return new Container();

        return renderToolStatusLine(theme, {
          tool: "Skill",
          item: args.name,
          status: "Reading ⠋",
          tone: "warning",
        });
      },
      renderResult(result, options, theme, context) {
        if (options.isPartial) return new Container();

        const details = result.details;
        if (!details || "isError" in details) {
          const status =
            details?.details.kind === "ambiguous"
              ? "Ambiguous Skill"
              : "Unknown Skill";

          return renderToolStatusLine(theme, {
            tool: "Skill",
            item: context.args.name,
            status,
            tone: "error",
          });
        }

        const expanded = options.expanded === true;
        const lineCount = details.body.trimEnd()
          ? details.body.trimEnd().split(/\r?\n/).length
          : 0;
        const container = new Container();
        container.addChild(
          renderToolStatusLine(theme, {
            tool: "Skill",
            item: details.skill.name,
            status: "Loaded",
            context: `${lineCount} lines`,
            expandable: !expanded,
            tone: "success",
          }),
        );

        if (expanded && details.body.trim()) {
          container.addChild(new Spacer(1));
          container.addChild(
            new Markdown(details.body, 0, 0, getMarkdownTheme()),
          );
        }

        return container;
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
