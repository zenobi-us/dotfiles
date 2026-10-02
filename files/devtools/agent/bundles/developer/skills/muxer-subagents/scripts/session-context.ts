export const MUXERS = [
  "herdr",
  "hrdx",
  "zellij",
  "tmux",
  "unknown-muxer",
] as const;

export type Muxer = (typeof MUXERS)[number];
export type Agent = "claude" | "pi" | "zot" | "unknown-agent";

export function isMuxer(value: string): value is Muxer {
  return (MUXERS as readonly string[]).includes(value);
}

export function detectMuxer(): Muxer {
  if (process.env.HERDR_ENV === "1") return "herdr";
  if (process.env.ZELLIJ) return "zellij";
  if (process.env.TMUX) return "tmux";
  if (process.env.HRDX === "1") return "hrdx";
  return "unknown-muxer";
}

export function detectAgent(): Exclude<Agent, "zot"> {
  if (process.env.CLAUDECODE === "1") return "claude";
  if (process.env.PI_CODING_AGENT === "true") return "pi";
  return "unknown-agent";
}

export function renderSessionContext(muxer: Muxer, agent: Agent): string {
  return `\n\n<muxer-session muxer="${muxer}" agent="${agent}">\nDetected once at session start by the \`muxer-subagents\` skill's Rule 1/Rule 2 logic. Use these values directly instead of running \`scripts/router.ts detect-muxer\`/\`detect-agent\` again. zot has no self-identifying signal and always reports as \`unknown-agent\` — pass an explicit \`--agent zot\` override to \`contracts\` when you know better. If the muxer or agent changes mid-session (for example the operator attaches a new terminal), re-run the detect commands instead of trusting this stale value.\n</muxer-session>`;
}
