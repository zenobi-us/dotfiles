import type { FooterContextProvider } from "../types.ts";
import { cwdProvider } from "./cwd.ts";
import {
  modelContextUsedProvider,
  modelContextWindowProvider,
  modelNameProvider,
  modelPlatformNameProvider,
  modelThinkingLevelProvider,
} from "./model.ts";
import {
  gitBranchNameProvider,
  gitWorktreeNameProvider,
  gitStatusProvider,
  recentCommitsProvider,
} from "./git.ts";
import { timeProvider } from "./time.ts";
import {
  usageEmojiProvider,
  usagePlatformProvider,
  usageQuotaRemainingProvider,
  usageQuotaUsedProvider,
  usageQuotaTotalProvider,
  usageQuotaPercentRemainingProvider,
  usageQuotaPercentUsedProvider,
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
    {
      name: "usage_quota_percent_remaining",
      provider: usageQuotaPercentRemainingProvider,
    },
    {
      name: "usage_quota_percent_used",
      provider: usageQuotaPercentUsedProvider,
    },

    // Core providers
    { name: "cwd", provider: cwdProvider },
    { name: "time", provider: timeProvider },
    // GIT
    { name: "git_branch_name", provider: gitBranchNameProvider },
    { name: "git_worktree_name", provider: gitWorktreeNameProvider },
    { name: "git-status", provider: gitStatusProvider },
    { name: "recent-commits", provider: recentCommitsProvider },

    // Model context providers
    { name: "model_context_used", provider: modelContextUsedProvider },
    { name: "model_context_window", provider: modelContextWindowProvider },
    { name: "model_thinking_level", provider: modelThinkingLevelProvider },
    { name: "model_name", provider: modelNameProvider },
    { name: "model_provider", provider: modelPlatformNameProvider },
  ];
}
