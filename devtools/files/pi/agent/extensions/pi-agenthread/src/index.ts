import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { defaultConfig, loadConfig, type ZellijAgentConfig } from "./config.js";
import { StatusWidget } from "./status.js";
import { LogService } from "./log.js";
import { ZellijPublisher } from "./zellij.js";

const STATUS_KEY = "zellij-agent";

/**
 * Wires Pi lifecycle events to config, footer status, and Zellij transport.
 *
 * Data flow:
 *
 * ```text
 * Pi lifecycle event
 *   ├─ session_start ──► loadConfig ──► StatusWidget
 *   │                    │
 *   │                    └─► ZellijPublisher.scheduleRefresh
 *   │
 *   ├─ before_agent_start / agent_start / agent_end
 *   │        │
 *   │        └─► ZellijPublisher.publish(state)
 *   │
 *   ├─ tool_execution_start/end ──► ZellijPublisher.update(tool)
 *   │        │
 *   │        └─► ZellijPublisher.publish ──► zellij pipe ──► WASM plugin UI
 *   │
 *   └─ zellij-agent-publish command ──► manual publish + diagnostic toast
 * ```
 *
 * Title ownership is deliberately not here. This extension reports the Zellij
 * pane title only; another Pi extension can own conversation summarisation.
 */
export default function (pi: ExtensionAPI) {
  const defaults = defaultConfig();
  let config: ZellijAgentConfig = defaults;
  let statusWidget = new StatusWidget(STATUS_KEY, defaults.statusBarTemplate);
  const log = new LogService();
  const publisher = new ZellijPublisher(statusWidget, log);

  /**
   * Rebuilds config-backed services on every session runtime start.
   * Pi creates a fresh runtime on resume/new/fork/reload, so this is the reliable
   * point to restart Zellij heartbeat publishing.
   */
  pi.on("session_start", async (_event, ctx) => {
    config = await loadConfig(ctx);
    log.updateSession(ctx);
    void log.debug(`session_start cwd=${ctx.cwd}`);
    statusWidget = new StatusWidget(STATUS_KEY, config.statusBarTemplate);
    publisher.updateStatusWidget(statusWidget);
    publisher.updatePluginAlias(config.pluginAlias);
    publisher.scheduleRefresh(ctx);
    void publisher.publish(ctx, "idle");
  });

  /**
   * Publishes a running state before the model starts so Zellij reflects work
   * immediately without waiting for a tool call.
   */
  pi.on("before_agent_start", (_event, ctx) => {
    void publisher.publish(ctx, "running");
  });

  /**
   * Covers Pi turns that start without prompt preprocessing. Duplicate running
   * publishes are harmless; stale status is worse than one extra pipe write.
   */
  pi.on("agent_start", (_event, ctx) => { void publisher.publish(ctx, "running"); });

  /**
   * Delays idle publish so retries, compaction, and follow-ups can start first.
   * Conversation title/task naming belongs to a separate extension.
   */
  pi.on("agent_end", (_event, ctx) => {
    setTimeout(() => {
      if (ctx.isIdle()) void publisher.publish(ctx, "idle");
    }, 100);
  });

  /**
   * Model changes alter the rendered payload but not lifecycle state, so
   * republish the current snapshot.
   */
  pi.on("model_select", (_event, ctx) => { void publisher.publish(ctx); });

  /**
   * Tool lifecycle events feed the `{tool}` status template token. We track the
   * latest active tool name only; parallel tool mode can interleave, and one
   * concise value fits the footer better than a growing set.
   */
  pi.on("tool_execution_start", (event, ctx) => {
    publisher.update({ currentTool: event.toolName });
    void publisher.publish(ctx, "running");
  });

  pi.on("tool_execution_end", (_event, ctx) => {
    publisher.update({ currentTool: undefined });
    void publisher.publish(ctx);
  });

  /**
   * Pi emits this for quit and session replacement. Awaiting the shutdown publish
   * gives the Zellij plugin a chance to delete the old pane entry before exit.
   */
  pi.on("session_shutdown", async (_event, ctx) => {
    publisher.stopRefresh();
    await publisher.publish(ctx, "shutdown");
  });

  pi.registerCommand("zellij-agent-publish", {
    description: "Publish this pi session to the Zellij agent plugin",
    /**
     * Manual publish exists as a cheap health check when debugging pipe delivery;
     * it reuses the same publisher path so command behavior cannot drift.
     */
    handler: async (_args, ctx) => {
      await publisher.publish(ctx);
      try {
        if (ctx.hasUI) ctx.ui.notify(`zellij-agent ${statusWidget.lastStatus}; log ${log.file}`, publisher.lastError ? "warning" : "info");
      } catch {
        // UI should never break command execution.
      }
    },
  });
}
