// Owns codex detection and invocation arguments.
import type { AgentModule } from "./types.ts";

export const agent = {
  id: "codex",
  contract: "references/agents/codex.md",
  detect: (environment) => environment.AGENT === "codex",
  command: ({ muxer, promptFile }) => ["codex", ...(muxer === "herdr-app" ? ["--no-daemon"] : []), "--", `@${promptFile}`],
} satisfies AgentModule;
