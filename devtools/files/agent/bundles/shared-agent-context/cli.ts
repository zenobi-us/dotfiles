#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import {
  initializeSharedContext,
  listSharedContexts,
  migrateAlignmentContext,
  renderSharedContext,
  resolveSharedContext,
  type Exec,
} from "./lib";

const exec: Exec = async (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return { stdout: result.stdout ?? "", code: result.status ?? 1 };
};

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function runInject(): Promise<void> {
  let cwd = process.cwd();
  try {
    const raw = await readStdin();
    if (raw.trim()) {
      const payload = JSON.parse(raw) as { cwd?: string };
      if (payload.cwd) cwd = payload.cwd;
    }
  } catch {
    // No/invalid stdin JSON: fall back to the hook process's own cwd.
  }

  const context = await resolveSharedContext(exec, cwd);
  if (!context || context.storage !== "shared" || !context.instructions) {
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  process.stdout.write(JSON.stringify({
    continue: true,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: renderSharedContext(context),
    },
  }));
}

async function main(): Promise<void> {
  const [command = "report", ...rest] = process.argv.slice(2);
  const cwd = process.cwd();

  if (command === "inject") return runInject();

  if (command === "list") {
    const contexts = await listSharedContexts();
    console.log(contexts.length > 0
      ? contexts.map((item) => `${item.slug}${item.storage ? ` [${item.storage}]` : ""}\n  ${item.root}`).join("\n")
      : "No shared engineering contexts found");
    return;
  }

  const context = await resolveSharedContext(exec, cwd);
  if (!context) {
    console.error("No git repository with an origin remote found");
    process.exitCode = 1;
    return;
  }

  if (command === "init") {
    const { agents, created } = await initializeSharedContext(context);
    console.log(created ? `Created ${agents}. Shared storage activates on the next session.` : `${agents} already exists`);
    return;
  }

  if (command === "migrate") {
    try {
      const result = await migrateAlignmentContext(context);
      console.log(`Copied ${result.copied.length} alignment path(s) to ${result.storage} storage:\n${result.copied.join("\n")}`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
    return;
  }

  if (command !== "report") {
    console.error(`Unknown subcommand: ${command} ${rest.join(" ")}`.trim());
    process.exitCode = 1;
    return;
  }

  console.log([
    `storage: ${context.storage}`,
    `root: ${context.root}`,
    `shared root: ${context.sharedRoot}`,
    ...(context.candidateSharedRoot && context.candidateSharedRoot !== context.sharedRoot
      ? [`shared candidate: ${context.candidateSharedRoot}`]
      : []),
    `origin: ${context.origin}`,
    `slug: ${context.slug}`,
  ].join("\n"));
  if (context.error) console.error(context.error);
}

main();
