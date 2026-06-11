import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import fs from "node:fs";

const LOG_FILE = "/tmp/llama-cpp-tps.log";
const DEBUG = process.env.LLAMA_CPP_EXTENSION_DEBUG === "1";
function log(...args: any[]) {
  if (!DEBUG) return;
  fs.appendFileSync(
    LOG_FILE,
    `[${new Date().toISOString()}] [llama-cpp-tps] ${args.join(" ")}\n`,
  );
}

const downArrow = "↓";
const upArrow = "↑";

interface LlamaCppTimings {
  predicted_n?: number;
  predicted_ms?: number;
  predicted_per_second?: number;
  prompt_n?: number;
  prompt_ms?: number;
  prompt_per_second?: number;
}

// Progress tracking
interface ProgressData {
  total?: number;
  cache?: number;
  processed?: number;
  time_ms?: number;
  pct?: number;
}

// Store latest timing data per model
const latestTimings = new Map<string, LlamaCppTimings>();
let lastTpsDisplay: string | null = null;
let activeModelKey: string | null = null;

// Store ctx from turn_start for use in SSE parsing loop (must be before captureTimings)
let turnCtx: ExtensionContext | null = null;

function calcProgressPct(prog: ProgressData): number {
  const cached = prog.cache ?? 0;
  const total = prog.total ?? 0;
  if (total > 0) {
    return Math.max(
      0,
      Math.round((((prog.processed ?? 0) - cached) / Math.max(1, total - cached)) * 100),
    );
  }
  return 0;
}

function formatTps(data: LlamaCppTimings): string | null {
  const predicted = data.predicted_per_second;
  const prompt = data.prompt_per_second;
  const predictedMs = data.predicted_ms;
  const promptMs = data.prompt_ms;

  if (!predicted || predicted <= 0) return null;

  if (prompt && prompt > 0) {
    return `Out: ${downArrow}${Number(predicted).toFixed(1)} tok/s${fmtTime(predictedMs) ? ` (${fmtTime(predictedMs)})` : ""} | In: ${upArrow}${Number(prompt).toFixed(1)} tok/s${fmtTime(promptMs) ? ` (${fmtTime(promptMs)})` : ""}`;
  }
  return `${downArrow}${Number(predicted).toFixed(1)} tok/s${fmtTime(predictedMs) ? ` (${fmtTime(predictedMs)})` : ""}`;
}

function fmtTime(ms: number | undefined): string {
  if (!ms || ms <= 0) return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1).replace(/\.0$/, "")}s`;
}

// ─── Intercept fetch to capture llama.cpp timing data from SSE chunks ───
function captureTimings(
  modelKey: string,
  body: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  log("captureTimings called for model:", modelKey);
  const reader = body.getReader();
  let buffer = "";
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      log("captureTimings start() called");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        log("captureTimings read chunk, len:", value ? value.length : 0);

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          if (jsonStr === "[DONE]") {
            controller.enqueue(value);
            decoder.decode();
            controller.close();
            return;
          }

          try {
            const chunk = JSON.parse(jsonStr);
            if (chunk.timings) {
              latestTimings.set(modelKey, chunk.timings);
              log("TIMINGS captured:", JSON.stringify(chunk.timings));
            }
            if (chunk.prompt_progress) {
              const prog = chunk.prompt_progress;

              prog.pct = calcProgressPct(prog);

              if (!turnCtx) {
                fs.appendFileSync(
                  LOG_FILE,
                  "[PROGRESS] t=" + Date.now() + " turnCtx is NULL\n",
                );
              } else if (!turnCtx.hasUI) {
                fs.appendFileSync(
                  LOG_FILE,
                  "[PROGRESS] t=" + Date.now() + " turnCtx.hasUI is false\n",
                );
              } else {
                try {
                  const msg = `Working... | Prompt Processing ${prog.pct}%`;
                  turnCtx.ui.setWorkingMessage(msg);
                  fs.appendFileSync(
                    LOG_FILE,
                    "[PROGRESS] t=" +
                      Date.now() +
                      " setWorkingMessage: [" +
                      msg +
                      "]\n",
                  );
                } catch (err) {
                  fs.appendFileSync(
                    LOG_FILE,
                    "[PROGRESS] setWorkingMessage ERROR: " + String(err) + "\n",
                  );
                }
              }

              log(
                "PROGRESS:",
                prog.processed,
                "/",
                prog.total,
                "cache:",
                prog.cache ?? 0,
                "pct:",
                prog.pct + "%",
              );
              fs.appendFileSync(
                "/tmp/llama-cpp-tps-progress.log",
                JSON.stringify({ ...prog, pct: prog.pct }) + "\n",
              );
            }
          } catch {
            // ignore parse errors for non-JSON SSE lines
          }
        }

        controller.enqueue(value);
      }

      decoder.decode(); // flush any remaining multi-byte sequences

      controller.close();
    },
    cancel(reason?: any) {
      reader.cancel(reason);
    },
  });
}

// ─── Extension Entry Point ─────────────────────
export default function (pi: ExtensionAPI) {
  log("globalThis.fetch exists:", typeof globalThis.fetch);
  const originalFetch = globalThis.fetch;
  log("saved originalFetch:", typeof originalFetch);

  globalThis.fetch = async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input.url;
    log("fetch intercepted, url:", url);
    if (typeof url !== "string" || !url.includes("/chat/completions")) {
      return originalFetch(input, init);
    }

    const response = await originalFetch(input, init);
    log(
      "fetch: response status:",
      response.status,
      "ok:",
      response.ok,
      "body:",
      response.body ? "present" : "NULL",
    );

    const modelKey = activeModelKey;
    activeModelKey = null;

    if (response.ok && response.body && modelKey) {
      return new Response(captureTimings(modelKey, response.body), {
        status: response.status,
        headers: Object.fromEntries(response.headers),
      });
    }
    return response;
  };

  // This is more reliable than message_end because by the time it fires,
  // all SSE chunks have been fully consumed and timings are captured.
  pi.on("turn_end", (_event, ctx) => {
    log("turn_end fired - hasUI:", ctx.hasUI);

    const model = ctx.model;
    const modelKey = model ? `${model.provider}/${model.id}` : null;
    const timings = modelKey ? latestTimings.get(modelKey) : undefined;

    if (ctx.hasUI) {
      ctx.ui.setWorkingMessage();
    }

    if (!timings || !timings.predicted_per_second) {
      log("turn_end - no valid timings for", modelKey ?? "unknown");
      return;
    }

    const display = formatTps(timings);

    if (display && ctx.hasUI) {
      if (display !== lastTpsDisplay) {
        lastTpsDisplay = display;
        ctx.ui.setStatus("llama-cpp-tps", display);
        ctx.ui.notify(`TPS: ${display}`);
        log("turn_end - Set status:", display);
      }
    }
  });

  pi.on("turn_start", (_event, ctx) => {
    turnCtx = ctx;
    log("turn_start fired, hasUI:", ctx.hasUI);
  });

  pi.on("before_provider_request", (event, ctx) => {
    activeModelKey = null;

    const payload = event.payload as Record<string, unknown> | undefined;
    if (!payload || typeof payload !== "object") return;
    if (ctx.model?.provider !== "llama-cpp") return;

    activeModelKey = `${ctx.model.provider}/${ctx.model.id}`;
    log(
      "before_provider_request: adding timings_per_token + return_progress to payload for",
      activeModelKey,
    );

    const newPayload: any = {
      ...payload,
      timings_per_token: true,
      return_progress: true,
    };
    return newPayload;
  });

  pi.on("session_shutdown", () => {
    log("session_shutdown: clearing state");
    latestTimings.clear();
    lastTpsDisplay = null;
    activeModelKey = null;
    if (turnCtx?.hasUI) turnCtx.ui.setWorkingMessage();
    turnCtx = null;

    globalThis.fetch = originalFetch;
  });

  log("extension loaded successfully");
}
