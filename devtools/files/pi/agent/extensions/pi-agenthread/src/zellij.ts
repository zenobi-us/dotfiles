import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";
import type { StatusWidget, StatusValues } from "./status.js";
import type { LogService } from "./log.js";

export const PIPE_NAME = "agenthreads:refresh";
export const STORE_COMMAND = "agent-threads";
export const DEFAULT_PLUGIN_ALIAS = "agent-threads";
export const REFRESH_MS = 2_000;
export const COMMAND_TIMEOUT_MS = 3_000;

export function pipeArgs(payload = "refresh"): string[] {
  // Do not pass --plugin here. Zellij treats a targeted pipe as "load if not matched".
  // Layout plugin configuration differs from a plain alias, so --plugin creates a hidden float.
  return ["pipe", "--name", PIPE_NAME, "--", payload];
}

export type AgentState = "idle" | "running" | "shutdown";

type PaneTabInfo = {
  id?: number;
  is_plugin?: boolean;
  tab_id?: number;
  tab_name?: string;
  title?: string;
  name?: string;
};

type PublisherState = {
  state: AgentState;
  title?: string;
  currentTool?: string;
};

/**
 * Owns every Zellij-facing side effect: pipe payloads, pane metadata lookup,
 * heartbeat refreshes, and debug logging.
 *
 * Keeping this isolated makes Pi event hooks pure orchestration: they update
 * lifecycle/tool state, then ask this class to publish the current snapshot.
 */
export class ZellijPublisher {
  lastError: string | undefined;
  publishCount = 0;
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private publishTail: Promise<void> = Promise.resolve();

  constructor(
    private statusWidget: StatusWidget,
    private log: LogService,
    private pluginAlias = DEFAULT_PLUGIN_ALIAS,
    private state: PublisherState = { state: "idle" },
  ) {}

  /**
   * Session config can change on reload/resume, so the publisher keeps the same
   * transport state while swapping only the footer renderer.
   */
  updateStatusWidget(statusWidget: StatusWidget): void {
    this.statusWidget = statusWidget;
  }

  updatePluginAlias(pluginAlias: string): void {
    this.pluginAlias = pluginAlias;
  }


  /**
   * Gives lifecycle hooks one place to mutate publishable state before any pipe
   * write. This avoids passing tool/lifecycle data through every method call.
   */
  update(values: Partial<PublisherState>): void {
    this.state = { ...this.state, ...values };
  }


  /**
   * Writes the current Pi Agent Report to the singleton store. The Zellij pipe is
   * only a best-effort wake signal; SQLite is the source of truth.
   */
  async publish(ctx: ExtensionContext, nextState = this.state.state, updateStatus = true): Promise<void> {
    this.state.state = nextState;
    const state = { ...this.state };
    this.publishTail = this.publishTail.then(
      () => this.publishNow(ctx, state, updateStatus),
      () => this.publishNow(ctx, state, updateStatus),
    );
    return this.publishTail;
  }

  private async publishNow(ctx: ExtensionContext, state: PublisherState, updateStatus: boolean): Promise<void> {
    try {
      this.publishCount += 1;
      if (updateStatus) this.statusWidget.update(ctx, "");
      const zellijSession = process.env.ZELLIJ_SESSION_NAME;
      const paneId = process.env.ZELLIJ_PANE_ID;
      if (!zellijSession || !paneId) {
        this.lastError = undefined;
        if (updateStatus) this.statusWidget.update(ctx, "󰄬");
        await this.log.trace("store skipped outside zellij");
        return;
      }
      const tab = await this.paneTabInfo();
      const paneTitle = tab?.title ?? tab?.name ?? tab?.tab_name;
      state.title = paneTitle;
      const agentId = this.agentId(ctx);
      const sessionName = ctx.sessionManager.getSessionFile();
      const payload = JSON.stringify({
        version: 2,
        harness: "pi",
        agent_id: agentId,
        session_name: sessionName,
        cwd: ctx.cwd,
        zellij_session: zellijSession,
        pane_id: paneId,
        tab_id: tab?.tab_id,
        tab_name: tab?.tab_name,
        state: state.state,
        model: ctx.model?.id,
        title: paneTitle,
        current_tool: state.currentTool,
        updated_at: Date.now(),
      });

      await this.log.trace(`publish agent=${agentId} session_name=${sessionName ?? "?"} zellij=${zellijSession} pane=${paneId} state=${state.state} plugin=${this.pluginAlias} bytes=${payload.length}`);
      await this.writeToStore(payload, agentId, state.state);
      await this.wakePlugin();
      this.lastError = undefined;
      if (updateStatus) this.statusWidget.update(ctx, "󰄬");
      await this.log.trace(`store ok state=${state.state}`);
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      if (updateStatus) this.statusWidget.update(ctx, "");
      await this.log.trace(`pipe error state=${state.state} error=${this.lastError}`);
    }
  }

  /**
   * Stops heartbeat refreshes before shutdown/session replacement so the old Pi
   * context cannot keep publishing after its runtime is torn down.
   */
  stopRefresh(): void {
    if (!this.refreshTimer) return;
    clearTimeout(this.refreshTimer);
    this.refreshTimer = undefined;
  }

  /**
   * Keeps the Zellij plugin fresh even when no Pi events fire for a while. This
   * is intentionally a refresh loop, not a permanent interval, so each publish
   * finishes before the next one is scheduled.
   */
  scheduleRefresh(ctx: ExtensionContext): void {
    this.stopRefresh();
    this.refreshTimer = setTimeout(() => {
      void this.publish(ctx, this.state.state, false).finally(() => {
        if (this.state.state !== "shutdown") this.scheduleRefresh(ctx);
      });
    }, REFRESH_MS);
  }

  /**
   * Uses the Zellij pane as the stable identity when available because resumed Pi
   * agents in the same pane must replace, not duplicate, the displayed row.
   */
  agentId(ctx: ExtensionContext): string {
    const paneId = process.env.ZELLIJ_PANE_ID;
    if (paneId) return `${process.env.ZELLIJ_SESSION_NAME ?? "zellij"}:${paneId}`;
    return ctx.sessionManager.getSessionFile() ?? `${ctx.cwd}:${process.pid}`;
  }

  /**
   * Reads pane metadata from Zellij so the plugin receives the terminal pane
   * title instead of inventing a conversation summary locally.
   */
  paneTabInfo(paneId = process.env.ZELLIJ_PANE_ID): Promise<PaneTabInfo | undefined> {
    return new Promise<PaneTabInfo | undefined>((resolve) => {
      const child = spawn("zellij", ["action", "list-panes", "--json"], {
        stdio: ["ignore", "pipe", "ignore"],
      });
      let stdout = "";
      let settled = false;
      const done = (value: PaneTabInfo | undefined) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      };
      const timer = setTimeout(() => {
        child.kill();
        done(undefined);
      }, COMMAND_TIMEOUT_MS);
      child.stdout.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.on("error", () => done(undefined));
      child.on("exit", (code) => {
        if (code !== 0) return done(undefined);
        done(parsePaneTabInfo(stdout, paneId));
      });
    });
  }

  /**
   * Writes presence to the shared CLI/SQLite store. Shutdown deletes the row
   * because closed agents should disappear immediately.
   */
  writeToStore(payload: string, agentId: string, state: AgentState): Promise<void> {
    const args = state === "shutdown"
      ? ["delete", "--agent-id", agentId]
      : ["upsert", "--json", payload];
    return runCommand(STORE_COMMAND, args);
  }

  /**
   * Uses `zellij pipe` only to wake already-running plugin instances.
   */
  async wakePlugin(): Promise<void> {
    try {
      await this.pipeToPlugin("refresh");
    } catch (error) {
      await this.log.trace(`wake pipe error=${error instanceof Error ? error.message : String(error)}`);
    }
  }

  pipeToPlugin(payload: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const child = spawn("zellij", pipeArgs(payload), {
        stdio: "ignore",
      });
      let settled = false;
      const done = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve();
      };
      const timer = setTimeout(() => {
        child.kill();
        done(new Error(`zellij pipe timed out after ${COMMAND_TIMEOUT_MS}ms`));
      }, COMMAND_TIMEOUT_MS);

      child.on("error", done);
      child.on("exit", (code, signal) => {
        if (code === 0) done();
        else done(new Error(`zellij pipe failed code=${code} signal=${signal}`));
      });
    });
  }
}


export function parsePaneTabInfo(stdout: string, paneId: string | undefined): PaneTabInfo | undefined {
  if (!paneId || !stdout.trim()) return undefined;
  try {
    const panes = JSON.parse(stdout) as PaneTabInfo[];
    return panes.find((pane) => !pane.is_plugin && String(pane.id) === paneId);
  } catch {
    return undefined;
  }
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    let settled = false;
    const done = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => {
      child.kill();
      done(new Error(`${command} timed out after ${COMMAND_TIMEOUT_MS}ms`));
    }, COMMAND_TIMEOUT_MS);

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", done);
    child.on("exit", (code, signal) => {
      if (code === 0) done();
      else done(new Error(`${command} failed code=${code} signal=${signal} ${stderr.trim()}`.trim()));
    });
  });
}
