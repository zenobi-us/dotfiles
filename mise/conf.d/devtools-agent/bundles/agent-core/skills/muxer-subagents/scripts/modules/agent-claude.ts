// Owns claude detection and invocation arguments.
import type { AgentModule } from "./types.ts";

export const agent = {
  id: "claude",
  contract: "references/agents/claude.md",
  detect: (environment) => environment.CLAUDECODE === "1",
  command: ({ promptFile }) => ["claude", "--", `@${promptFile}`],
} satisfies AgentModule;
