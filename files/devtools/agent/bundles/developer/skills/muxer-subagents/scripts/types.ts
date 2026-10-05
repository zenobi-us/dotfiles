export const MUXERS = [
  "herdr",
  "hrdx",
  "zellij",
  "tmux",
  "unknown-muxer",
] as const;

export const AGENTS = ["claude", "omp", "pi", "zot", "unknown-agent"] as const;

export type Muxer = (typeof MUXERS)[number];
export type Agent = (typeof AGENTS)[number];

export function isMuxer(value: string): value is Muxer {
  return (MUXERS as readonly string[]).includes(value);
}

export function isAgent(value: string): value is Agent {
  return (AGENTS as readonly string[]).includes(value);
}
