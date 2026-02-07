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

export function createDefaultFooterProviders(): Array<{
  name: string;
  provider: FooterContextProvider;
}> {
  return [
    ...createPlatformContextProviders("copilot"),
    ...createPlatformContextProviders("anthropic"),
    ...createPlatformContextProviders("codex"),
    ...createPlatformContextProviders("kiro"),
    ...createPlatformContextProviders("antigravity"),
    ...createPlatformContextProviders("gemini"),
    ...createPlatformContextProviders("zai"),
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
