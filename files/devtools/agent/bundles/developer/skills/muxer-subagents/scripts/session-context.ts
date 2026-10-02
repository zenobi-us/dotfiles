export const MUXERS = [
  "herdr",
  "hrdx",
  "zellij",
  "tmux",
  "unknown-muxer",
] as const;

export const AGENTS = [
  "claude",
  "omp",
  "pi",
  "zot",
  "unknown-agent",
] as const;

export type Muxer = (typeof MUXERS)[number];
export type Agent = (typeof AGENTS)[number];

export function isMuxer(value: string): value is Muxer {
  return (MUXERS as readonly string[]).includes(value);
}

export function isAgent(value: string): value is Agent {
  return (AGENTS as readonly string[]).includes(value);
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
  return `\n\n<muxer-session muxer="${muxer}" agent="${agent}">\nDetected once at session start by the \`muxer-subagents\` skill's Rule 1/Rule 2 logic. Use these values directly instead of running \`scripts/router.ts detect-muxer\`/\`detect-agent\` again. OMP and zot have no distinct self-identifying signal for \`detect-agent\`. The OMP extension supplies \`omp\` directly. Otherwise, pass an explicit \`--agent omp\` or \`--agent zot\` override to \`contracts\` when you know better. If the muxer or agent changes mid-session (for example the operator attaches a new terminal), re-run the detect commands instead of trusting this stale value.\n</muxer-session>`;
}
