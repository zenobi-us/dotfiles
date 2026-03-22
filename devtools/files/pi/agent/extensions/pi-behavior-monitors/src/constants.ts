import type { CollectorDescriptor, WhenConditionDescriptor } from "./types";

export const COLLECTOR_DESCRIPTORS = [
  { name: "user_text", description: "Most recent user message text" },
  { name: "assistant_text", description: "Most recent assistant message text" },
  {
    name: "tool_results",
    description: "Tool results with tool name and error status",
    limits: "Last 5, truncated 2000 chars",
  },
  {
    name: "tool_calls",
    description: "Tool calls and results interleaved",
    limits: "Last 20, truncated 2000 chars",
  },
  {
    name: "custom_messages",
    description: "Custom extension messages since last user message",
  },
  {
    name: "project_vision",
    description: ".project/project.json vision, core_value, name",
  },
  {
    name: "project_conventions",
    description: ".project/conformance-reference.json principle names",
  },
  {
    name: "git_status",
    description: "Output of git status --porcelain",
    limits: "5s timeout",
  },
];
export const WHEN_CONDITIONS = [
  {
    name: "always",
    description: "Fire every time the event occurs",
    parameterized: false,
  },
  {
    name: "has_tool_results",
    description: "Fire only if tool results present since last user message",
    parameterized: false,
  },
  {
    name: "has_file_writes",
    description:
      "Fire only if write or edit tool called since last user message",
    parameterized: false,
  },
  {
    name: "has_bash",
    description: "Fire only if bash tool called since last user message",
    parameterized: false,
  },
  {
    name: "every(N)",
    description:
      "Fire every Nth activation (counter resets when user text changes)",
    parameterized: true,
  },
  {
    name: "tool(name)",
    description:
      "Fire only if specific named tool called since last user message",
    parameterized: true,
  },
];
export const VERDICT_TYPES = ["clean", "flag", "new"] as const;
export const SCOPE_TARGETS = ["main", "subagent", "all", "workflow"] as const;
export const VALID_EVENTS = new Set([
  "message_end",
  "turn_end",
  "agent_end",
  "command",
]);
