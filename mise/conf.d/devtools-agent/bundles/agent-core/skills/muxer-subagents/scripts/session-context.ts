import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { parseDeliveryContext, type DeliveryContext } from "../../result-delivery/scripts/delivery.ts";
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

  if (environment.OMPCODE === "1") return "omp";
  if (
    environment.PI_CODING_AGENT === "true" ||
    environment.AI_AGENT === "pi"
  ) return "pi";
  if (environment.AGENT === "zot") return "zot";
  if (environment.AGENT === "codex") return "codex";
  if (environment.CLAUDECODE === "1") return "claude";
  return "unknown-agent";
}
export function sessionMetadata(): {
  role: "child" | "unspecified";
  runId?: string;
  parentRunId?: string;
  operationId?: string;
  contextFile?: string;
  deliveryContext?: DeliveryContext;
} {
  const contextFile = process.env.RESULT_DELIVERY_CONTEXT;
  if (contextFile !== undefined && !isAbsolute(contextFile)) {
    throw new Error("RESULT_DELIVERY_CONTEXT must be an absolute file path.");
  }
  const context = contextFile === undefined
    ? undefined
    : parseDeliveryContext(JSON.parse(readFileSync(contextFile, "utf8")));
  return {
    role: process.env.MUXER_SUBAGENT_ROLE === "child" ? "child" : "unspecified",
    runId: process.env.MUXER_SUBAGENT_RUN_ID ?? context?.runId,
    parentRunId: process.env.MUXER_SUBAGENT_PARENT_RUN_ID,
    operationId: context?.operationId,
    contextFile,
    deliveryContext: context,
  };
}


export function renderSessionContext(muxer: Muxer, agent: Agent): string {
  const depth = currentSubagentDepth();
  const session = sessionMetadata();

  return `
  Muxer Subagents Session Context

  - muxer: ${muxer}
  - agent: ${agent}
  - maxSubagents: ${MAX_SUBAGENTS_PER_SESSION}
  - maxDepth: ${MAX_SUBAGENT_DEPTH}
  - depth: ${depth}
  - session: ${JSON.stringify(session)}
  - delivery: explicit result-delivery context; no native structured-result transport

  Detected once at session start by the \`muxer-subagents\` skill's Rule 1/Rule 2 logic.

  Use these values directly instead of running \`scripts/router.ts detect-muxer\`/\`detect-agent\` again.

  Agent detection checks \`OMPCODE=1\`, Pi's \`PI_CODING_AGENT=true\` or \`AI_AGENT=pi\`, \`AGENT=zot\`, \`AGENT=codex\`, then \`CLAUDECODE=1\`, in that priority order. An explicit caller identity takes precedence.

  If the muxer or agent changes mid-session (for example the operator attaches a new terminal), re-run the detect commands instead of trusting this stale value.
  `;
}


