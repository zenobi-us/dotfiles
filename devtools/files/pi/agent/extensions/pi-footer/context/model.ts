import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { FooterContextProvider } from "../types.ts";

function getContextWindow(ctx: ExtensionContext): number | null {
  const model = ctx.model as { contextWindow?: unknown } | undefined;
  const raw = model?.contextWindow;

  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw;
  }

  if (typeof raw === "string") {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return null;
}

function getUsedTokens(ctx: ExtensionContext): number {
  let input = 0;
  let output = 0;

  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type !== "message" || entry.message.role !== "assistant") {
      continue;
    }

    const assistant = entry.message as AssistantMessage;
    input += assistant.usage.input;
    output += assistant.usage.output;
  }

  return input + output;
}

export const modelNameProvider: FooterContextProvider = (ctx) => {
  return ctx.model?.id ?? "no-model";
};

export const modelContextWindowProvider: FooterContextProvider = (ctx) => {
  const limit = getContextWindow(ctx);
  if (!limit) return "?";
  return `${Math.round(limit / 1_000)}k`;
};

export const modelContextUsedProvider: FooterContextProvider = (ctx) => {
  const limit = getContextWindow(ctx);
  if (!limit) return "--";

  const used = getUsedTokens(ctx);
  const percentage = Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
  return `${percentage}%`;
};

export const modelProvider: FooterContextProvider = (ctx) => ({
  text: ctx.ui.theme.fg("dim", ctx.model?.id ?? "no-model"),
  align: "right",
  order: 10,
});
