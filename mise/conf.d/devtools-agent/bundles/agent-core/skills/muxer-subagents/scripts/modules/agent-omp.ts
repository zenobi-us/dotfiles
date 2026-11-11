// Owns omp detection and invocation arguments.
import type { AgentModule } from "./types.ts";

export const agent = {
  id: "omp",
  contract: "references/agents/omp.md",
  detect: (environment) => environment.OMPCODE === "1",
  command: ({ promptFile }) => ["omp", "--", `@${promptFile}`],
} satisfies AgentModule;
