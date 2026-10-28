// Wraps only this process's Codex transport. Admission reserves the full possible
// response and a cache miss before network dispatch; no global settings persist.
import { appendFileSync, readFileSync } from "node:fs";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { lookup } from "@oh-my-pi/pi-coding-agent/config/registry";
import { streamSimple, type Usage } from "@oh-my-pi/pi-ai";

const API = "worktree-work-token-guard";
const CEILING = 250_000;
const FRAMING_RESERVE = 4_096;

export default function workTokenGuard(pi: ExtensionAPI): void {
  const configPath = process.env.OMP_WORK_TOKEN_GUARD_CONFIG;
  if (!configPath) throw new Error("Token guard requires its session configuration.");
  const config = pi.zod.object({ auditPath: pi.zod.string().min(1) }).parse(JSON.parse(readFileSync(configPath, "utf8")));
  let spent = 0;
  let active = false;
  let stopped = false;
  let initialized = false;
  const audit = (entry: Record<string, unknown>): void => {
    appendFileSync(config.auditPath, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
  };
  const stop = (reason: string): never => {
    stopped = true;
    audit({ event: "denied", reason, spent, ceiling: CEILING });
    throw new Error(`Work-token guard stopped this request: ${reason}. Preserve the session and report the blocker.`);
  };

  pi.registerProvider("worktree-budget-transport", {
    api: API,
    streamSimple(model, context, options) {
      if (!initialized || stopped || active) stop("guard unavailable, stopped, or another inference is pending");
      if (model.provider !== "openai-codex" || model.id !== "gpt-6.1-sol" || model.maxTokens !== 128_000) {
        stop("model has no verified output bound");
      }
      active = true;
      let networkRequests = 0;
      let reservation = 0;
      let payloadChecked = false;
      const originalFetch = options?.fetch ?? globalThis.fetch;
      const originalPayload = options?.onPayload;
      const originalModel = { ...model, api: "openai-codex-responses" as const, preferWebsockets: false };
      const stream = streamSimple(originalModel, context, {
        ...options,
        codexSseMaxAttempts: 1,
        onPayload: async (payload, requestModel) => {
          const replacement = await originalPayload?.(payload, requestModel);
          const wire = replacement ?? payload;
          if (wire === null || typeof wire !== "object" || !("input" in wire) || !Array.isArray(wire.input)
            || ("previous_response_id" in wire && wire.previous_response_id) || ("type" in wire && wire.type)) {
            stop("request is not a complete stateless SSE payload");
          }
          if (containsImage(wire)) stop("image input has no verified text-token bound");
          payloadChecked = true;
          return wire;
        },
        fetch: async (input, init) => {
          if (!payloadChecked || networkRequests !== 0 || typeof init?.body !== "string") {
            stop("unverified, repeated, or compressed network request");
          }
          const inputBytes = Buffer.byteLength(init.body, "utf8");
          reservation = inputBytes + FRAMING_RESERVE + model.maxTokens;
          if (spent + reservation > CEILING) stop("full uncached input and maximum output exceed the remaining ceiling");
          networkRequests++;
          audit({ event: "admitted", spent, inputBytes, framingReserve: FRAMING_RESERVE, outputMaximum: model.maxTokens, reservation, ceiling: CEILING });
          return originalFetch(input, init);
        },
      });
      void stream.result().then(message => {
        const work = workTokens(message.usage);
        if (message.stopReason === "error" || message.stopReason === "aborted") {
          stopped = true;
          audit({ event: "uncertain-response", spent, reservation, observedWork: work });
          return;
        }
        if (networkRequests !== 1 || work > reservation) {
          stopped = true;
          audit({ event: "bound-violation", spent, reservation, observedWork: work });
          return;
        }
        spent += work;
        active = false;
        audit({ event: "settled", work, spent, reservation, ceiling: CEILING });
      }).catch(() => {
        stopped = true;
        audit({ event: "unsettled-response", spent, reservation });
      });
      return stream;
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    for (const [id, value] of [
      ["providers.openaiWebsockets", "off"],
      ["providers.openaiLiveSteering", false],
      ["providers.cacheWarming", "off"],
      ["advisor.enabled", false],
      ["retry.enabled", false],
      ["retry.maxRetries", 0],
      ["retry.modelFallback", false],
    ] as const) {
      const setting = lookup(id);
      if (!setting) stop("required runtime setting is unavailable");
      setting.override(pi.pi.settings, value);
      if (setting.get(pi.pi.settings) !== value) stop("runtime setting override did not apply");
    }
    if (process.env.PI_CODEX_ZSTD !== "0" || process.env.PI_CODEX_WEBSOCKET !== "0") {
      stop("stateless uncompressed transport environment is missing");
    }
    for (const entry of ctx.sessionManager.getEntries()) {
      if (entry.type === "message" && entry.message.role === "assistant") spent += workTokens(entry.message.usage);
      if (entry.type === "model_usage") spent += workTokens(entry.usage);
    }
    const current = ctx.model;
    if (!current || current.provider !== "openai-codex" || current.id !== "gpt-6.1-sol" || current.maxTokens !== 128_000) {
      stop("unsupported initial model");
    }
    initialized = true;
    if (!await pi.setModel({ ...current, api: API, preferWebsockets: false })) stop("guarded model selection failed");
    audit({ event: "ready", spent, ceiling: CEILING, model: current.id, outputMaximum: current.maxTokens, transport: "stateless SSE" });
  });
  pi.on("before_provider_request", () => {
    if (!initialized || !active || stopped) stop("inference bypassed the guarded transport");
  });
  pi.on("before_subagent_spawn", () => ({ block: true, reason: "This counted session cannot start another model session." }));
  pi.on("session_before_switch", () => ({ cancel: true }));
  pi.on("session_before_branch", () => ({ cancel: true }));
  pi.on("session_before_tree", () => ({ cancel: true }));
}

function workTokens(usage: Usage): number {
  if (!usage || typeof usage !== "object") throw new Error("Provider usage is unavailable; do not continue.");
  let total = 0;
  for (const key of ["input", "output", "cacheWrite"] as const) {
    const value = usage[key];
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("Provider work-token usage is invalid; do not continue.");
    total += value;
  }
  return total;
}


function containsImage(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsImage);
  if (value === null || typeof value !== "object") return false;
  if ("type" in value && (value.type === "input_image" || value.type === "image_url" || value.type === "image")) return true;
  return Object.values(value).some(containsImage);
}
