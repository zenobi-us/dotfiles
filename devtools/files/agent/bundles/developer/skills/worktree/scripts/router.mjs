#!/usr/bin/env -S mise x -- bun --install=auto

import { Crust } from "@crustjs/core";
import { helpPlugin } from "@crustjs/plugins";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const referencesDir = join(skillDir, "references");

const SUBCOMMANDS = ["start", "submit", "fix", "finish", "review", "continue"];
const MUXERS = ["herdr", "hrdx", "zellij", "tmux", "unknown-muxer"];

function detectMuxer() {
  if (process.env.HERDR_ENV === "1") return "herdr";
  if (process.env.ZELLIJ) return "zellij";
  if (process.env.TMUX) return "tmux";
  if (process.env.HRDX === "1") return "hrdx";
  return "unknown-muxer";
}

function detectAgent() {
  if (process.env.CLAUDECODE === "1") return "claude";
  if (process.env.PI_CODING_AGENT === "true") return "pi";
  return "unknown-agent";
}

function contractPath(kind, name) {
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
    const muxer = detectMuxer();
    const agent = detectAgent();
    console.log(
      JSON.stringify(
        `\n\n<worktree-session muxer="${muxer}" agent="${agent}">\nDetected once at session start by the \`worktree\` skill's rule 0/rule 1 logic (\`detectMuxer\`/\`detectAgent\` in scripts/router.mjs). Use these values directly instead of running \`scripts/router.mjs detect-muxer\`/\`detect-agent\` again. zot has no self-identifying signal and always reports as \`unknown-agent\` — pass an explicit \`--agent zot\` override to \`route\` when you know better. If the muxer or agent changes mid-session (for example the operator attaches a new terminal), re-run the detect commands instead of trusting this stale value.\n</worktree-session>`,
      ),
    );
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

    if (flags.muxer && !MUXERS.includes(flags.muxer)) {
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
  .execute();
