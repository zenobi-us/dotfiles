import type { FooterContextProvider } from "../types.ts";
import { cwdProvider } from "./cwd.ts";
import {
  modelContextUsedProvider,
  modelContextWindowProvider,
  modelNameProvider,
} from "./model.ts";
import {
  gitBranchNameProvider,
  gitWorktreeNameProvider,
  gitStatusProvider,
  recentCommitsProvider,
} from "./git.ts";
import { timeProvider } from "./time.ts";
import { createPlatformContextProviders } from "./platforms.ts";
import {
  usageEmojiProvider,
  usagePlatformProvider,
  usageQuotaRemainingProvider,
  usageQuotaUsedProvider,
  usageQuotaTotalProvider,
  usageQuotaPercentRemainingProvider,
  usageQuotaPercentUsedProvider,
  createPlatformQuotaProvider,
  createPlatformEmojiProvider,
  createPlatformNameProvider,
} from "./usage.ts";

export function createDefaultFooterProviders(): Array<{
  name: string;
  provider: FooterContextProvider;
}> {
  return [
    // Auto-detected usage providers
    { name: "usage_emoji", provider: usageEmojiProvider },
    { name: "usage_platform", provider: usagePlatformProvider },
    { name: "usage_quota_remaining", provider: usageQuotaRemainingProvider },
    { name: "usage_quota_used", provider: usageQuotaUsedProvider },
    { name: "usage_quota_total", provider: usageQuotaTotalProvider },
    { name: "usage_quota_percent_remaining", provider: usageQuotaPercentRemainingProvider },
    { name: "usage_quota_percent_used", provider: usageQuotaPercentUsedProvider },

    // Per-platform explicit providers (primary quota only for now)
    { name: "anthropic_emoji", provider: createPlatformEmojiProvider("anthropic") },
    { name: "anthropic_platform", provider: createPlatformNameProvider("anthropic") },
    { name: "anthropic_quota_remaining", provider: createPlatformQuotaProvider("anthropic", "remaining") },
    { name: "anthropic_quota_used", provider: createPlatformQuotaProvider("anthropic", "used") },
    { name: "anthropic_quota_total", provider: createPlatformQuotaProvider("anthropic", "total") },
    { name: "anthropic_quota_percent_remaining", provider: createPlatformQuotaProvider("anthropic", "percent_remaining") },
    { name: "anthropic_quota_percent_used", provider: createPlatformQuotaProvider("anthropic", "percent_used") },

    { name: "copilot_emoji", provider: createPlatformEmojiProvider("copilot") },
    { name: "copilot_platform", provider: createPlatformNameProvider("copilot") },
    { name: "copilot_quota_remaining", provider: createPlatformQuotaProvider("copilot", "remaining") },
    { name: "copilot_quota_used", provider: createPlatformQuotaProvider("copilot", "used") },
    { name: "copilot_quota_total", provider: createPlatformQuotaProvider("copilot", "total") },
    { name: "copilot_quota_percent_remaining", provider: createPlatformQuotaProvider("copilot", "percent_remaining") },
    { name: "copilot_quota_percent_used", provider: createPlatformQuotaProvider("copilot", "percent_used") },

    { name: "codex_emoji", provider: createPlatformEmojiProvider("codex") },
    { name: "codex_platform", provider: createPlatformNameProvider("codex") },
    { name: "codex_quota_remaining", provider: createPlatformQuotaProvider("codex", "remaining") },
    { name: "codex_quota_used", provider: createPlatformQuotaProvider("codex", "used") },
    { name: "codex_quota_total", provider: createPlatformQuotaProvider("codex", "total") },
    { name: "codex_quota_percent_remaining", provider: createPlatformQuotaProvider("codex", "percent_remaining") },
    { name: "codex_quota_percent_used", provider: createPlatformQuotaProvider("codex", "percent_used") },

    // Legacy detailed platform providers
    ...createPlatformContextProviders("copilot"),
    ...createPlatformContextProviders("anthropic"),
    ...createPlatformContextProviders("codex"),
    ...createPlatformContextProviders("kiro"),
    ...createPlatformContextProviders("antigravity"),
    ...createPlatformContextProviders("gemini"),
    ...createPlatformContextProviders("zai"),

    // Core providers
    { name: "time", provider: timeProvider },
    { name: "git_branch_name", provider: gitBranchNameProvider },
    { name: "git_worktree_name", provider: gitWorktreeNameProvider },
    { name: "model_context_used", provider: modelContextUsedProvider },
    { name: "model_context_window", provider: modelContextWindowProvider },
    { name: "git-status", provider: gitStatusProvider },
    { name: "recent-commits", provider: recentCommitsProvider },
    { name: "model_name", provider: modelNameProvider },
    { name: "cwd", provider: cwdProvider },
  ];
}
