// Owns pi detection and invocation arguments.
import type { AgentModule } from "./types.ts";

export const agent = {
  id: "pi",
  contract: "references/agents/pi.md",
  detect: (environment) => environment.PI_CODING_AGENT === "true" || environment.AI_AGENT === "pi",
  command: ({ promptFile }) => ["pi", "--", `@${promptFile}`],
} satisfies AgentModule;
