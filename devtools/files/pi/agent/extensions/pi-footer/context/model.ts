import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Footer } from "../footer.ts";
import type { FilterFunction, FooterContextProvider } from "../types.ts";

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

const modelNameProvider: FooterContextProvider = (props) => {
  return props.ctx.model?.id ?? "no-model";
};

const modelContextWindowProvider: FooterContextProvider = (props) => {
  const limit = getContextWindow(props.ctx);
  if (!limit) return " - ";
  return `${Math.round(limit / 1_000)}k`;
};

const modelContextUsedProvider: FooterContextProvider = (props) => {
  const limit = getContextWindow(props.ctx);
  if (!limit) return " - ";

  const used = getUsedTokens(props.ctx);
  const percentage = Math.max(
    0,
    Math.min(100, Math.round((used / limit) * 100)),
  );
  return `${percentage}%`;
};

const modelThinkingLevelProvider: FooterContextProvider = (props) => {
  const level = props.pi.getThinkingLevel?.();

  if (typeof level === "string" && level.length > 0) {
    return level;
  }

  return "-";
};

const modelPlatformNameProvider: FooterContextProvider = (props) => {
  const name = props.ctx.model?.provider;

  if (name) return name;
  return "-";
};

const thinkingLevelIconsFilter: FilterFunction = (
  value: unknown,
  style: "unicode" | "ascii" = "unicode",
): string => {
  if (typeof value !== "string" || value.length === 0 || value === "-") {
    return "-";
  }

  const icons =
    style === "ascii"
      ? {
          minimal: "-",
          low: "+",
          medium: "++",
          high: "+++",
          max: "++++",
        }
      : {
          minimal: "◌",
          low: "◔",
          medium: "◑",
          high: "◕",
          max: "●",
        };

  return icons[value as keyof typeof icons] ?? value;
};

Footer.registerContextProvider("model_context_used", modelContextUsedProvider);
Footer.registerContextProvider(
  "model_context_window",
  modelContextWindowProvider,
);
Footer.registerContextProvider(
  "model_thinking_level",
  modelThinkingLevelProvider,
);
Footer.registerContextProvider("model_name", modelNameProvider);
Footer.registerContextProvider("model_provider", modelPlatformNameProvider);

Footer.registerContextFilter("thinking_level_icons", thinkingLevelIconsFilter);
