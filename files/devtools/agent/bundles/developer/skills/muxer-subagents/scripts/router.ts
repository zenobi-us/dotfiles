#!/usr/bin/env -S mise x -- bun --install=fallback

import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AGENTS,
  detectAgent,
  detectMuxer,
  isAgent,
  isMuxer,
  MUXERS,
  renderSessionContext,
} from "./session-context.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const referencesDir = join(skillDir, "references");

function contractPath(kind: string, name: string): string | null {
  const path = join(referencesDir, kind, `${name}.md`);
  return existsSync(path) ? path : null;
}

const app = new Crust("muxer-subagents").meta({
  description:
    "Detect the active terminal multiplexer and agent CLI, then resolve their spawn contracts.",
});

const detectMuxerCmd = app
  .sub("detect-muxer")
  .meta({
    description:
      "Print the active terminal multiplexer: herdr, zellij, tmux, hrdx, or unknown-muxer.",
  })
  .run(() => {
    console.log(detectMuxer());
  });

const detectAgentCmd = app
  .sub("detect-agent")
  .meta({
    description:
      "Print the active agent CLI: claude, pi, or unknown-agent. OMP and zot need explicit identification.",
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
      description: `Override auto-detected agent (${AGENTS.join(", ")}). Required for OMP and zot when no session hook identifies them.`,
    },
  })
  .run(({ flags }) => {
    if (flags.muxer && !isMuxer(flags.muxer)) {
      console.error(`Unknown --muxer ${flags.muxer}. Expected one of: ${MUXERS.join(", ")}`);
      process.exitCode = 1;
      return;
    }

    if (flags.agent && !isAgent(flags.agent)) {
      console.error(`Unknown --agent ${flags.agent}. Expected one of: ${AGENTS.join(", ")}`);
      process.exitCode = 1;
      return;
    }

    const muxer = flags.muxer ?? detectMuxer();
    const agent = flags.agent ?? detectAgent();
    const muxerContract = contractPath("muxers", muxer);
    const agentContract = contractPath("agents", agent);

    if (!muxerContract) {
      console.error(`Missing muxer contract for: ${muxer}`);
      process.exitCode = 1;
      return;
    }

    console.log(
      JSON.stringify(
        {
          muxer,
          agent,
          muxerContract,
          agentContract,
          needsOperatorInput:
            (muxer === "unknown-muxer" && !flags.muxer) ||
            (agent === "unknown-agent" && !flags.agent),
        },
        null,
        2,
      ),
    );
  });

app
  .use(helpPlugin())
  .command(detectMuxerCmd)
  .command(detectAgentCmd)
  .command(sessionContextCmd)
  .command(contractsCmd)
  .command(doctorCmd)
  .execute();
