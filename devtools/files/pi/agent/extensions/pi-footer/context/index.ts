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

const one_hour_in_seconds = 60 * 60;
const five_hours_in_seconds = 5 * one_hour_in_seconds;
const one_day_in_seconds = 24 * one_hour_in_seconds;
const five_days_in_seconds = 5 * one_day_in_seconds;
const thirty_days_in_seconds = 30 * one_day_in_seconds;

export const defaultFooterProviders: Array<{
  name: string;
  provider: FooterContextProvider;
}> = [
  ...createPlatformContextProviders("copilot", [
    {
      id: "30_day",
      duration: thirty_days_in_seconds,
      remaining: thirty_days_in_seconds,
    },
  ]),
  ...createPlatformContextProviders("anthropic", [
    {
      id: "5_day",
      duration: five_days_in_seconds,
      remaining: five_days_in_seconds,
    },
    {
      id: "5_hour",
      duration: five_hours_in_seconds,
      remaining: five_hours_in_seconds,
    },
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
