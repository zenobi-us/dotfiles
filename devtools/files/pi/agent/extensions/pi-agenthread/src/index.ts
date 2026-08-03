import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { defaultConfig, loadConfig, type ZellijAgentConfig } from "./config.js";
import { StatusWidget } from "./status.js";
import { LogService } from "./log.js";
import { ZellijPublisher, type SettledReason, type ToolKind } from "./zellij.js";

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
 *   │        └─► ZellijPublisher.publish ──► agent-threads store ──► WASM plugin UI
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
  const activeTools = new Map<string, { name: string; kind: ToolKind }>();
  let settled: { reason: SettledReason; message?: string } = { reason: "finished" };

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
    publisher.scheduleRefresh(ctx);
    void publisher.publish(ctx, "idle");
  });

  /**
   * Publishes a running state before the model starts so Zellij reflects work
   * immediately without waiting for a tool call.
   */
  pi.on("before_agent_start", (_event, ctx) => {
    activeTools.clear();
    settled = { reason: "finished" };
    publisher.update({
      activity: "thinking",
      currentTool: undefined,
      currentToolKind: undefined,
      lastTool: undefined,
      lastToolAt: undefined,
      settledReason: undefined,
      settledMessage: undefined,
    });
    void publisher.publish(ctx, "running");
  });

  /**
   * Covers Pi turns that start without prompt preprocessing. Duplicate running
   * publishes are harmless; stale status is worse than one extra pipe write.
   */
  pi.on("agent_start", (_event, ctx) => {
    activeTools.clear();
    settled = { reason: "finished" };
    publisher.update({
      activity: "thinking",
      lastTool: undefined,
      lastToolAt: undefined,
      settledReason: undefined,
      settledMessage: undefined,
    });
    void publisher.publish(ctx, "running");
  });

  /**
   * Records the last turn result. `agent_end` is not final because retries,
   * compaction, and queued follow-ups can still run after it.
   */
  pi.on("agent_end", (_event, ctx) => {
    settled = settledFromMessages(_event.messages);
    void publisher.publish(ctx);
  });

  /**
   * Pi emits `agent_settled` only after retries, compaction, and follow-ups are
   * done. This is the lifecycle edge that can safely clear the running state.
   */
  (pi.on as unknown as (event: "agent_settled", handler: (event: unknown, ctx: ExtensionContext) => void) => void)("agent_settled", (_event, ctx) => {
    activeTools.clear();
    publisher.update({
      activity: "settled",
      currentTool: undefined,
      currentToolKind: undefined,
      settledReason: settled.reason,
      settledMessage: settled.message,
    });
    void publisher.publish(ctx, "idle");
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
    const kind = toolKind(event.toolName);
    activeTools.set(event.toolCallId, { name: event.toolName, kind });
    publisher.update({
      activity: kind === "user_question" ? "waiting_for_user" : "tool_running",
      currentTool: event.toolName,
      currentToolKind: kind,
      lastTool: event.toolName,
      lastToolAt: Date.now(),
    });
    void publisher.publish(ctx, "running");
  });

  pi.on("tool_execution_end", (event, ctx) => {
    activeTools.delete(event.toolCallId);
    const active = Array.from(activeTools.values()).at(-1);
    publisher.update({
      activity: active ? (active.kind === "user_question" ? "waiting_for_user" : "tool_running") : "thinking",
      currentTool: active?.name,
      currentToolKind: active?.kind,
      lastTool: event.toolName,
      lastToolAt: Date.now(),
    });
    void publisher.publish(ctx);
  });

  /**
   * Pi emits this for quit and session replacement. Awaiting the shutdown publish
   * gives the Zellij plugin a chance to delete the old pane entry before exit.
   */
  pi.on("session_shutdown", async (_event, ctx) => {
    publisher.stopRefresh();
    publisher.update({ currentTool: undefined, currentToolKind: undefined });
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

function toolKind(toolName: string): ToolKind {
  const name = toolName.toLowerCase();
  return /(^|[^a-z])(ask|question|questions)([^a-z]|$)/.test(name) ? "user_question" : "tool";
}

function settledFromMessages(messages: unknown[]): { reason: SettledReason; message?: string } {
  const assistant = [...messages].reverse().find((message) => {
    return Boolean(message && typeof message === "object" && (message as { role?: unknown }).role === "assistant");
  }) as { stopReason?: unknown; errorMessage?: unknown } | undefined;
  const stopReason = typeof assistant?.stopReason === "string" ? assistant.stopReason : "stop";
  const message = typeof assistant?.errorMessage === "string" ? assistant.errorMessage : undefined;
  if (stopReason === "error") return { reason: "failed", message };
  if (stopReason === "aborted") return { reason: "aborted", message };
  return { reason: "finished", message };
}
