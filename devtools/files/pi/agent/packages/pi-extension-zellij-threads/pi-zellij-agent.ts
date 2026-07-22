import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";
import { appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";

const PIPE_NAME = "pi-agent-session";
const STATUS_KEY = "zellij-agent";
const LOG_FILE = `${tmpdir()}/pi-zellij-agent-${process.getuid?.() ?? "user"}.log`;
const PLUGIN_URL = process.env.ZELLIJ_AGENT_PLUGIN_URL ?? "file:pkgs/plugins/zellij-plugin-agent-threads/target/wasm32-wasip1/release/zellij-plugin-agent-threads.wasm";

type AgentState = "idle" | "running" | "shutdown";

export default function (pi: ExtensionAPI) {
  let state: AgentState = "idle";
  let lastStatus = "init";
  let lastError: string | undefined;
  let publishCount = 0;

  async function trace(message: string) {
    const line = `${new Date().toISOString()} ${message}\n`;
    try {
      await appendFile(LOG_FILE, line);
    } catch {
      // ponytail: debug log is best-effort; footer status still carries state.
    }
  }

  function updateUi(ctx: ExtensionContext, status: string) {
    lastStatus = status;
    if (!ctx.hasUI) return;
    try {
      ctx.ui.setStatus(STATUS_KEY, `zellij ${status}`);
      ctx.ui.setWidget(STATUS_KEY, undefined);
    } catch {
      // UI should never break pi startup.
    }
  }

  function pipeToPlugin(payload: string) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn("zellij", ["pipe", "--plugin", PLUGIN_URL, "--name", PIPE_NAME, "--", payload], {
        stdio: "ignore",
      });

      child.on("error", reject);
      child.on("exit", (code, signal) => {
        if (code === 0) resolve();
        else reject(new Error(`zellij pipe failed code=${code} signal=${signal}`));
      });
    });
  }

  async function publish(ctx: ExtensionContext, nextState = state) {
    try {
      state = nextState;
      publishCount += 1;
      updateUi(ctx, "publishing");

      const payload = JSON.stringify({
        version: 1,
        session: ctx.sessionManager.getSessionFile() ?? `${ctx.cwd}:${process.pid}`,
        cwd: ctx.cwd,
        pane_id: process.env.ZELLIJ_PANE_ID,
        state,
        model: ctx.model?.id,
        updated_at: Date.now(),
      });

      await trace(`publish state=${state} bytes=${payload.length}`);
      await pipeToPlugin(payload);
      lastError = undefined;
      updateUi(ctx, "ok");
      await trace(`pipe ok state=${state}`);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      updateUi(ctx, "error");
      await trace(`pipe error state=${state} error=${lastError}`);
    }
  }

  pi.on("session_start", (_event, ctx) => { void publish(ctx, "idle"); });
  pi.on("agent_start", (_event, ctx) => { void publish(ctx, "running"); });
  pi.on("agent_end", (_event, ctx) => { void publish(ctx, "idle"); });
  pi.on("model_select", (_event, ctx) => { void publish(ctx); });
  pi.on("session_shutdown", (_event, ctx) => { void publish(ctx, "shutdown"); });

  pi.registerCommand("zellij-agent-publish", {
    description: "Publish this pi session to the Zellij agent plugin",
    handler: async (_args, ctx) => {
      await publish(ctx);
      try {
        if (ctx.hasUI) ctx.ui.notify(`zellij-agent ${lastStatus}; log ${LOG_FILE}`, lastError ? "warning" : "info");
      } catch {
        // UI should never break command execution.
      }
    },
  });
}
