#!/usr/bin/env -S mise x -- bun --install=fallback

import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  currentSubagentDepth,
  detectAgent,
  detectMuxer,
  MAX_SUBAGENT_DEPTH,
  MAX_SUBAGENTS_PER_SESSION,
  renderSessionContext,
  sessionMetadata,
} from "./session-context.ts";
import { AGENTS, isAgent, isMuxer, MUXERS } from "./types.ts";
import { spawnAgent } from "./spawn.ts";
import { readRun, removeRun } from "./signals.ts";
import { waitForAgent } from "./wait.ts";
import { agents, muxers } from "./modules/index.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const referencesDir = join(skillDir, "references");

function contractPath(relativePath: string | null): string | null {
  if (relativePath === null) return null;
  const path = join(skillDir, relativePath);
  return existsSync(path) ? path : null;
}
const app = new Crust("muxer-subagents").meta({
  description:
    "Detect the active multiplexer and agent, resolve contracts, and launch or monitor child runs.",
});

const detectMuxerCmd = app
  .sub("detect-muxer")
  .meta({
    description:
      "Print the active terminal multiplexer: herdr, herdr-app, zellij, tmux, hrdx, or unknown-muxer.",
  })
  .run(() => {
    console.log(detectMuxer());
  });

const detectAgentCmd = app
  .sub("detect-agent")
  .meta({
    description:
      "Print the active agent CLI: omp, pi, zot, codex, claude, or unknown-agent.",
  })
  .run(() => {
    console.log(detectAgent());
  });

const sessionContextCmd = app
  .sub("session-context")
  .meta({
    description:
      "Print the SessionStart hook payload: a JSON string wrapping a <muxer-session> tag for additionalContext.",
  })
  .run(() => {
    console.log(
      JSON.stringify(renderSessionContext(detectMuxer(), detectAgent())),
    );
  });

const doctorCmd = app
  .sub("doctor")
  .meta({ description: "Report Bun, mise, and spawn runtime prerequisites." })
  .run(() => {
    console.log(JSON.stringify({
      bun: typeof Bun !== "undefined",
      mise: Boolean(process.env.MISE_VERSION),
      muxer: detectMuxer(),
      agent: detectAgent(),
      referencesDir,
    }, null, 2));
  });

const contractsCmd = app

  .sub("contracts")
  .meta({
    description:
      "Resolve the muxer and agent contract files for the current session, or for the given overrides.",
  })
  .flags({
    muxer: {
      type: "string",
      description: `Override auto-detected muxer (${MUXERS.join(", ")}).`,
    },
    agent: {
      type: "string",
      description: `Override auto-detected agent (${AGENTS.join(", ")}). Required for zot or when detection returns unknown-agent.`,
    },
  })
  .run(({ flags }) => {
    const muxer = flags.muxer ?? detectMuxer();
    const agent = flags.agent ?? detectAgent();
    if (!isMuxer(muxer)) {
      console.error(`Unknown --muxer ${flags.muxer}. Expected one of: ${MUXERS.join(", ")}`);
      process.exitCode = 1;
      return;
    }

    if (!isAgent(agent)) {
      console.error(`Unknown --agent ${flags.agent}. Expected one of: ${AGENTS.join(", ")}`);
      process.exitCode = 1;
      return;
    }

    const muxerContract = contractPath(muxer === "unknown-muxer"
      ? "references/muxers/unknown-muxer.md"
      : muxers[muxer].contract);
    const agentContract = contractPath(agent === "unknown-agent" ? null : agents[agent].contract);

    if (!muxerContract) {
      console.error(`Missing muxer contract for: ${muxer}`);
      process.exitCode = 1;
      return;
    }

    const { deliveryContext, ...session } = sessionMetadata();
    console.log(
      JSON.stringify(
        {
          schema: "muxer-subagents/contracts",
          version: 1,
          session,
          delivery: {
            context: deliveryContext ?? null,
            contextEnvironment: "RESULT_DELIVERY_CONTEXT",
            artifactReference: process.platform === "linux" && existsSync("/proc/self/fd"),
            nativeStructuredResult: false,
            completionImpliesResultSuccess: false,
          },
          muxer,
          agent,
          muxerContract,
          agentContract,
          limits: {
            maxSubagentsPerSession: MAX_SUBAGENTS_PER_SESSION,
            maxDepth: MAX_SUBAGENT_DEPTH,
            currentDepth: currentSubagentDepth(),
          },
          needsOperatorInput:
            (muxer === "unknown-muxer" && !flags.muxer) ||
            (agent === "unknown-agent" && !flags.agent),
        },
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        2,
      ),
    );
  });

const spawnCmd = app
  .sub("spawn")
  .meta({
    description:
      "Start a child agent in a new muxer tab or pane. Reads the prompt from stdin when no prompt flag is set.",
  })
  .flags({
    prompt: {
      type: "string",
      description: "Prompt text.",
    },
    "prompt-file": {
      type: "string",
      description: "Read the prompt from a UTF-8 file.",
    },
    muxer: {
      type: "string",
      description: `Override the detected muxer (${MUXERS.join(", ")}).`,
    },
    agent: {
      type: "string",
      description: `Override the detected agent (${AGENTS.join(", ")}).`,
    },
    cwd: {
      type: "string",
      description: "Working directory for the child. Defaults to the current directory.",
    },
    "result-schema": {
      type: "string",
      description: "Required domain result schema for the child handoff.",
      required: true,
    },
    "result-target": {
      type: "string",
      description: "Absolute transport artifact path. Requires --result-ref.",
    },
    "result-ref": {
      type: "string",
      description: "Caller-approved artifact reference. Requires --result-target.",
    },
    "operation-id": {
      type: "string",
      description: "Operation identity for delivery. Defaults to the child run id.",
    },
  })
  .run(async ({ flags }) => {
    if (flags.prompt !== undefined && flags["prompt-file"] !== undefined) {
      console.error("Use only one of --prompt or --prompt-file.");
      process.exitCode = 2;
      return;
    }

    const muxer = flags.muxer ?? detectMuxer();
    const agent = flags.agent ?? detectAgent();
    if (!isMuxer(muxer) || muxer === "unknown-muxer") {
      console.error(`Unsupported or unknown muxer: ${muxer}`);
      process.exitCode = 2;
      return;
    }
    if (!isAgent(agent) || agent === "unknown-agent") {
      console.error(`Unknown agent: ${agent}. Set --agent explicitly.`);
      process.exitCode = 2;
      return;
    }

    let prompt = flags.prompt;
    try {
      if (flags["prompt-file"] !== undefined) {
        prompt = await Bun.file(flags["prompt-file"]).text();
      } else if (prompt === undefined) {
        prompt = process.stdin.isTTY ? "" : await Bun.stdin.text();
      }
    } catch (error) {
      console.error(`Could not read prompt: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
      return;
    }
    if (!prompt || prompt.trim().length === 0) {
      console.error("Prompt is empty. Provide --prompt, --prompt-file, or non-empty stdin.");
      process.exitCode = 2;
      return;
    }

    const depth = currentSubagentDepth();
    if (depth < 0 || depth >= MAX_SUBAGENT_DEPTH) {
      console.error(`Cannot spawn at invalid or maximum depth: ${depth}.`);
      process.exitCode = 2;
      return;
    }

    try {
      const result = await spawnAgent({
        muxer,
        agent,
        prompt,
        cwd: resolve(flags.cwd ?? process.cwd()),
        depth: depth + 1,
        resultSchema: flags["result-schema"],
        resultTarget: flags["result-target"],
        resultRef: flags["result-ref"],
        operationId: flags["operation-id"],
      });
      console.log(JSON.stringify({ ...result, muxer, agent, depth: depth + 1 }));
    } catch (error) {
      console.error(`Could not spawn child agent: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });
const waitCmd = app
  .sub("wait")
  .meta({
    description: "Wait for a child run to become blocked or complete.",
  })
  .args([
    {
      name: "runId",
      type: "string",
      description: "Run id returned by spawn.",
      required: true,
    },
  ])
  .flags({
    "after-sequence": {
      type: "string",
      description: "Ignore signals at or below this sequence. Use the sequence returned by a blocked wait before waiting again.",
    },
    timeout: {
      type: "string",
      description: "Maximum wait time in milliseconds.",
    },
  })
  .run(async ({ args, flags }) => {
    const afterSequence = flags["after-sequence"] === undefined ? 0 : Number(flags["after-sequence"]);
    if (!Number.isSafeInteger(afterSequence) || afterSequence < 0) {
      console.error("--after-sequence must be a non-negative integer.");
      process.exitCode = 2;
      return;
    }
    const timeoutMs = flags.timeout === undefined ? undefined : Number(flags.timeout);
    if (timeoutMs !== undefined && (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1)) {
      console.error("--timeout must be a positive integer in milliseconds.");
      process.exitCode = 2;
      return;
    }

    try {
      const signal = await waitForAgent({ runId: args.runId, afterSequence, timeoutMs });
      if (signal === null) {
        const { signal: current } = await readRun(args.runId);
        console.log(JSON.stringify({ ...current, timedOut: true }));
        process.exitCode = 124;
        return;
      }
      console.log(JSON.stringify(signal));
      if (signal.state === "failed") process.exitCode = 1;
      if (signal.state === "cancelled") process.exitCode = 130;
      if (signal.state === "completed" || signal.state === "failed" || signal.state === "cancelled") {
        await removeRun(args.runId);
      }
    } catch (error) {
      console.error(`Could not wait for child run: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
  });

app
  .use(helpPlugin())
  .command(detectMuxerCmd)
  .command(detectAgentCmd)
  .command(sessionContextCmd)
  .command(contractsCmd)
  .command(doctorCmd)
  .command(spawnCmd)
  .command(waitCmd)
  .execute();
