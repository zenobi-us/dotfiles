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
  // Get last assistant message (skip aborted messages)
  // Context window shows current prompt context, not cumulative usage
  const branch = ctx.sessionManager.getBranch();
  
  // Find last assistant message (reverse iteration)
  let lastAssistantMessage: AssistantMessage | undefined;
  
  for (let i = branch.length - 1; i >= 0; i--) {
    const entry = branch[i];
    if (entry.type === "message" && entry.message.role === "assistant") {
      const assistant = entry.message as AssistantMessage;
      // Skip aborted messages
      if (assistant.stopReason !== "aborted") {
        lastAssistantMessage = assistant;
        break;
      }
    }
  }

  if (!lastAssistantMessage) return 0;

  // Include all token types that count toward context window
  return (
    lastAssistantMessage.usage.input +
    lastAssistantMessage.usage.output +
    lastAssistantMessage.usage.cacheRead +
    lastAssistantMessage.usage.cacheWrite
  );
}

export const modelNameProvider: FooterContextProvider = (ctx) => {
  return ctx.model?.id ?? "no-model";
};

export const modelContextWindowProvider: FooterContextProvider = (ctx) => {
  const limit = getContextWindow(ctx);
  if (!limit) return " - ";
  return `${Math.round(limit / 1_000)}k`;
};

export const modelContextUsedProvider: FooterContextProvider = (ctx) => {
  const limit = getContextWindow(ctx);
  if (!limit) return " - ";

  const used = getUsedTokens(ctx);
  const percentage = Math.max(
    0,
    Math.min(100, Math.round((used / limit) * 100)),
  );
  return `${percentage}%`;
};

export const modelProvider: FooterContextProvider = (ctx) => {
  const name = ctx.model?.provider;

  if (name) return name;
  return "-";
};
