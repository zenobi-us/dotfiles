import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  canonicalizeGitRemote,
  initializeSharedContext,
  listSharedContexts,
  migrateAlignmentContext,
  renderSharedContext,
  resolveSharedContext,
  slugifyGitRemote,
  type Exec,
  type SharedAgentContext,
} from "../lib";

export {
  canonicalizeGitRemote,
  initializeSharedContext,
  listSharedContexts,
  migrateAlignmentContext,
  renderSharedContext,
  resolveSharedContext,
  slugifyGitRemote,
  type SharedAgentContext,
};

export default function sharedAgentContextExtension(pi: ExtensionAPI): void {
  const warned = new Set<string>();
  const exec: Exec = async (command, args) => {
    const result = await pi.exec(command, args);
    return { stdout: result.stdout, code: result.code };
  };

  pi.on("before_agent_start", async (event, ctx) => {
    const context = await resolveSharedContext(exec, ctx.cwd);
    if (!context) return;
    if (context.error && !warned.has(context.error)) {
      warned.add(context.error);
      ctx.ui.notify(`Shared agent context: ${context.error}`, "warning");
    }
    return { systemPrompt: event.systemPrompt + renderSharedContext(context) };
  });

  pi.registerCommand("eng-context", {
    description: "Report, initialize, list, or migrate engineering context storage",
    getArgumentCompletions: (prefix) => {
      const commands = ["report", "init", "list", "migrate"];
      const items = commands
        .filter((command) => command.startsWith(prefix))
        .map((command) => ({ value: command, label: command }));
      return items.length > 0 ? items : null;
    },
    handler: async (args, ctx) => {
      const command = args.trim().split(/\s+/, 1)[0] || "report";

      if (command === "list") {
        const contexts = await listSharedContexts();
        ctx.ui.notify(
          contexts.length > 0
            ? contexts.map((item) => `${item.slug}${item.storage ? ` [${item.storage}]` : ""}\n  ${item.root}`).join("\n")
            : "No shared engineering contexts found",
          "info",
        );
        return;
      }

      const context = await resolveSharedContext(exec, ctx.cwd);
      if (!context) {
        ctx.ui.notify("No git repository with an origin remote found", "warning");
        return;
      }

      if (command === "init") {
        const { agents, created } = await initializeSharedContext(context);
        ctx.ui.notify(
          created ? `Created ${agents}. Shared storage activates on the next agent turn.` : `${agents} already exists`,
          "info",
        );
        return;
      }

      if (command === "migrate") {
        try {
          const result = await migrateAlignmentContext(context);
          ctx.ui.notify(
            `Copied ${result.copied.length} alignment path(s) to ${result.storage} storage:\n${result.copied.join("\n")}`,
            "info",
          );
        } catch (error) {
          ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
        }
        return;
      }

      if (command !== "report") {
        ctx.ui.notify(`Unknown subcommand: ${command}`, "warning");
        return;
      }

      ctx.ui.notify([
        `storage: ${context.storage}`,
        `root: ${context.root}`,
        `shared root: ${context.sharedRoot}`,
        ...(context.candidateSharedRoot && context.candidateSharedRoot !== context.sharedRoot
          ? [`shared candidate: ${context.candidateSharedRoot}`]
          : []),
        `origin: ${context.origin}`,
        `slug: ${context.slug}`,
      ].join("\n"), context.error ? "warning" : "info");
    },
  });
}
