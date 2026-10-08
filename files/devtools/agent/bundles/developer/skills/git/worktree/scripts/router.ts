#!/usr/bin/env -S mise x -- bun --install=fallback

import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const referencesDir = join(skillDir, "references");

const SUBCOMMANDS = ["start", "submit", "fix", "finish", "review", "continue", "tasks"];

function playbookPath(name: string): string | null {
  const path = join(referencesDir, "playbooks", `${name}.md`);
  return existsSync(path) ? path : null;
}

const app = new Crust("worktree").meta({
  description: "Resolve a worktree subcommand to its playbook.",
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
  .run(({ args }) => {
    const trimmed = args.request.trim();
    const [first, ...rest] = trimmed.split(/\s+/);
    const subcommand = (first ?? "").toLowerCase();

    if (!SUBCOMMANDS.includes(subcommand)) {
      console.log(JSON.stringify({ match: false, request: trimmed }));
      process.exitCode = 1;
      return;
    }

    const playbook = playbookPath(subcommand);
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
          playbook,
        },
        null,
        2,
      ),
    );
  });

const doctorCmd = app
  .sub("doctor")
  .meta({ description: "Report Bun, mise, and worktree runtime prerequisites." })
  .run(() => {
    console.log(JSON.stringify({
      bun: typeof Bun !== "undefined",
      mise: Boolean(process.env.MISE_VERSION),
      referencesDir,
      playbooks: SUBCOMMANDS.filter((name) => playbookPath(name) !== null),
    }, null, 2));
  });

app.use(helpPlugin()).command(routeCmd).command(doctorCmd).execute();
