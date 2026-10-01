#!/usr/bin/env -S mise x -- bun --install=fallback

import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  detectAgent,
  detectMuxer,
  isMuxer,
  MUXERS,
  renderSessionContext,
} from "./session-context.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const referencesDir = join(skillDir, "references");

const SUBCOMMANDS = ["start", "submit", "fix", "finish", "review", "continue"];

function contractPath(kind: string, name: string): string | null {
  const path = join(referencesDir, kind, `${name}.md`);
  return existsSync(path) ? path : null;
}

const app = new Crust("worktree").meta({
  description:
    "Detect the active muxer and agent, then resolve a worktree subcommand to its playbook and contracts.",
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
      "Print the active agent CLI: claude, pi, or unknown-agent. zot has no self-identifying signal yet.",
  })
  .run(() => {
    console.log(detectAgent());
  });

const sessionContextCmd = app
  .sub("session-context")
  .meta({
    description:
      "Print the SessionStart hook payload: a JSON string wrapping a <worktree-session> tag for additionalContext.",
  })
  .run(() => {
    console.log(
      JSON.stringify(renderSessionContext(detectMuxer(), detectAgent())),
    );
  });

const doctorCmd = app
  .sub("doctor")
  .meta({ description: "Report Bun, mise, and worktree runtime prerequisites." })
  .run(() => {
    console.log(JSON.stringify({
      bun: typeof Bun !== "undefined",
      mise: Boolean(process.env.MISE_VERSION),
      muxer: detectMuxer(),
      agent: detectAgent(),
      referencesDir,
    }, null, 2));
  });

const routeCmd = app
  .sub("route")
  .meta({
    description:
      "Resolve UserRequest's first token to a playbook, or print NO_MATCH for NLP fallthrough.",
  })
  .args([
    {
      name: "request",
      type: "string",
      description: "The raw UserRequest text.",
      required: true,
    },
  ])
  .flags({
    muxer: {
      type: "string",
      description: `Override auto-detected muxer (${MUXERS.join(", ")}).`,
    },
    agent: {
      type: "string",
      description: "Override auto-detected agent (claude, pi, zot). Required for zot today — it has no self-identifying signal.",
    },
  })
  .run(({ args, flags }) => {
    const trimmed = args.request.trim();
    const [first, ...rest] = trimmed.split(/\s+/);
    const subcommand = (first ?? "").toLowerCase();

    if (!SUBCOMMANDS.includes(subcommand)) {
      console.log(JSON.stringify({ match: false, request: trimmed }));
      process.exitCode = 1;
      return;
    }

    const muxer = flags.muxer ?? detectMuxer();
    const agent = flags.agent ?? detectAgent();

    if (flags.muxer && !isMuxer(flags.muxer)) {
      console.error(`Unknown --muxer ${flags.muxer}. Expected one of: ${MUXERS.join(", ")}`);
      process.exitCode = 1;
      return;
    }

    const playbook = contractPath("playbooks", subcommand);
    if (!playbook) {
      console.error(`Missing playbook for subcommand: ${subcommand}`);
      process.exitCode = 1;
      return;
    }

    console.log(
      JSON.stringify(
        {
          match: true,
          subcommand,
          remainder: rest.join(" "),
          muxer,
          agent,
          playbook,
          muxerContract: contractPath("muxers", muxer),
          agentContract: contractPath("agents", agent),
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
  .command(routeCmd)
  .command(doctorCmd)
  .execute();
