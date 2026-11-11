// Owns zot detection and invocation arguments.
import type { AgentModule } from "./types.ts";

export const agent = {
  id: "zot",
  contract: "references/agents/zot.md",
  detect: (environment) => environment.AGENT === "zot",
  command: ({ promptFile }) => ["zot", "--", `@${promptFile}`],
} satisfies AgentModule;
