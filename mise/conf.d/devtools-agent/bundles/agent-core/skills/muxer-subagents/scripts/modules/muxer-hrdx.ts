// Uses the hrdx socket to open a tab and dispatch a shell launch.
import * as net from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { shellLaunch, shellQuote } from "../shell-launch.ts";
import { waitForRunSignal } from "../signals.ts";
import type { MuxerModule } from "./types.ts";

export const muxer = {
  id: "hrdx",
  contract: "references/muxers/hrdx.md",
  promptLifetime: "process",
  detect: (environment) => environment.HRDX === "1",
  supports: () => true,
  async launch(request) {
    const pane = await hrdxRequest("pane.create", { workspace: request.cwd, kind: "shell", split: "tab" });
    const paneId = pane.pane_id;
    if (typeof paneId !== "number") throw new Error("hrdx did not report the new pane id");
    await hrdxRequest("pane.wait", { pane_id: paneId, until: "idle", timeout_ms: 30000 });
    const text = `sh -lc ${shellQuote(shellLaunch(request))}`;
    await hrdxRequest("pane.send_text", { pane_id: paneId, text, enter: true });
    return { target: String(paneId) };
  },
  wait: ({ manifest, afterSequence, timeoutMs }) => waitForRunSignal(manifest.runId, afterSequence, timeoutMs),
} satisfies MuxerModule;

function hrdxSocketPath(): string {
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "hrdx", "hrdx.sock");
}

async function hrdxRequest(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const socket = net.createConnection(hrdxSocketPath());
  const { promise, resolve, reject } = Promise.withResolvers<Record<string, unknown>>();
  let buffer = "";
  socket.setTimeout(5000, () => {
    socket.destroy();
    reject(new Error("Timed out waiting for hrdx"));
  });
  socket.on("error", reject);
  socket.on("connect", () => socket.write(`${JSON.stringify({ id: "muxer-subagents-spawn", method, params })}\n`));
  socket.on("data", (chunk) => {
    buffer += chunk.toString();
    const newline = buffer.indexOf("\n");
    if (newline < 0) return;
    let response: unknown;
    try {
      response = JSON.parse(buffer.slice(0, newline));
    } catch (error) {
      socket.destroy();
      reject(error);
      return;
    }
    socket.end();
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      reject(new Error("hrdx returned an invalid response"));
      return;
    }
    const result = response as Record<string, unknown>;
    const error = result.error;
    if (error) {
      const message = typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : String(error);
      reject(new Error(message));
    } else {
      const payload = result.result;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        reject(new Error("hrdx returned an invalid result"));
      } else resolve(payload as Record<string, unknown>);
    }
  });
  return promise;
}
