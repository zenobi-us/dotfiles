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

export const defaultFooterProviders: Array<{
  name: string;
  provider: FooterContextProvider;
}> = [
  ...createPlatformContextProviders("copilot", [
    { id: "window1", duration: 15 * 60, remaining: 10 * 60 },
    { id: "window2", duration: 60 * 60, remaining: 45 * 60 },
  ]),
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
