import type { Agent, Muxer } from "./types.ts";

export const MAX_SUBAGENTS_PER_SESSION = 5;
export const MAX_SUBAGENT_DEPTH = 2;

export function currentSubagentDepth(): number {
  const rawDepth = process.env.MUXER_SUBAGENT_DEPTH;
  if (rawDepth === undefined) return 0;
  const depth = Number(rawDepth);
  return Number.isInteger(depth) && depth >= 0 ? depth : -1;
}

export function detectMuxer(): Muxer {
  if (process.env.HERDR_ENV === "1") return "herdr";
  if (process.env.ZELLIJ) return "zellij";
  if (process.env.TMUX) return "tmux";
  if (process.env.HRDX === "1") return "hrdx";
  return "unknown-muxer";
}

export function detectAgent(): Exclude<Agent, "omp" | "zot"> {
  if (process.env.CLAUDECODE === "1") return "claude";
  if (process.env.PI_CODING_AGENT === "true") return "pi";
  return "unknown-agent";
}

export function renderSessionContext(muxer: Muxer, agent: Agent): string {
  const depth = currentSubagentDepth();

  return `
  Muxer Subagents Session Context

  - muxer: ${muxer}
  - agent: ${agent}
  - maxSubagents: ${MAX_SUBAGENTS_PER_SESSION}
  - maxDepth: ${MAX_SUBAGENT_DEPTH}
  - depth: ${depth}

  Detected once at session start by the \`muxer-subagents\` skill's Rule 1/Rule 2 logic.

  Use these values directly instead of running \`scripts/router.ts detect-muxer\`/\`detect-agent\` again.

  OMP and Zot have no distinct self-identifying signal for \`detect-agent\`.

  The OMP extension supplies \`omp\` directly. Otherwise, pass an explicit \`--agent omp\` or \`--agent zot\` override to \`contracts\` when you know better.

  If the muxer or agent changes mid-session (for example the operator attaches a new terminal), re-run the detect commands instead of trusting this stale value.
  `;
}
