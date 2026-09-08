export const MUXERS = ["herdr", "hrdx", "zellij", "tmux", "unknown-muxer"];
export const AGENTS = ["claude", "pi", "zot", "unknown-agent"];

export function detectMuxer() {
  if (process.env.HERDR_ENV === "1") return "herdr";
  if (process.env.ZELLIJ) return "zellij";
  if (process.env.TMUX) return "tmux";
  if (process.env.HRDX === "1") return "hrdx";
  return "unknown-muxer";
}

export function detectAgent() {
  if (process.env.CLAUDECODE === "1") return "claude";
  if (process.env.PI_CODING_AGENT === "true") return "pi";
  return "unknown-agent";
}
