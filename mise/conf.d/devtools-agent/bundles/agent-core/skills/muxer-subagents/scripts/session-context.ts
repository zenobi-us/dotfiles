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

export function detectAgent(
  identity?: Agent,
  environment: Record<string, string | undefined> = process.env,
): Agent {
  if (identity !== undefined) return identity;

  const isClaude = environment.CLAUDECODE === "1";
  const isPi = environment.PI_CODING_AGENT === "true" ||
    environment.AI_AGENT === "pi";
  const isOmp = environment.OMPCODE === "1";
  const detectedCount = Number(isClaude) + Number(isPi) + Number(isOmp);

  if (detectedCount > 1) return "unknown-agent";
  if (isClaude) return "claude";
  if (isPi) return "pi";
  if (isOmp) return "omp";
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

  Agent detection uses \`CLAUDECODE=1\` for Claude, \`PI_CODING_AGENT=true\` or \`AI_AGENT=pi\` for Pi, and \`OMPCODE=1\` for OMP. Conflicting environment markers return \`unknown-agent\`. An explicit caller identity takes precedence.

  Zot has no confirmed self-identifying signal. Pass an explicit \`--agent zot\` override when you know the target.

  If the muxer or agent changes mid-session (for example the operator attaches a new terminal), re-run the detect commands instead of trusting this stale value.
  `;
}

