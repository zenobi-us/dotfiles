#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import path from "node:path";
import { Crust } from "@crustjs/core";
import { helpPlugin } from "@crustjs/plugins";
import {
  anchorPath,
  buildContextIndex,
  ensureAnchorPath,
  initializeSharedContext,
  listSharedContextFiles,
  listSharedContexts,
  migrateAlignmentContext,
  renderSharedContext,
  resolveSharedContext,
  type Exec,
  type SharedAgentContext,
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
    process.stdout.write("null\n");
    return;
  }

  process.stdout.write(`${JSON.stringify(renderSharedContext(context))}\n`);
}

async function runFiles(): Promise<void> {
  const result = await listSharedContextFiles(exec, process.cwd());
  process.stdout.write(result.stdout);
  process.exitCode = result.code;
}

async function runList(): Promise<void> {
  const contexts = await listSharedContexts();
  console.log(contexts.length > 0
    ? contexts.map((item) => `${item.slug}${item.storage ? ` [${item.storage}]` : ""}\n  ${item.root}`).join("\n")
    : "No shared engineering contexts found");
}

async function requireContext(): Promise<SharedAgentContext | undefined> {
  const context = await resolveSharedContext(exec, process.cwd());
  if (!context) {
    console.error("No git repository with an origin remote found");
    process.exitCode = 1;
    return undefined;
  }
  return context;
}

async function runInit(): Promise<void> {
  const context = await requireContext();
  if (!context) return;

  const { agents, created } = await initializeSharedContext(context);
  console.log(created ? `Created ${agents}. Shared storage activates on the next session.` : `${agents} already exists`);
}

async function runMigrate(): Promise<void> {
  const context = await requireContext();
  if (!context) return;

  try {
    const result = await migrateAlignmentContext(context);
    console.log(`Copied ${result.copied.length} alignment path(s) to ${result.storage} storage:\n${result.copied.join("\n")}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function runAnchor(ctx: { flags: { source: string; key?: string; "dry-run"?: boolean } }): Promise<void> {
  const context = await requireContext();
  if (!context) return;

  const options = { source: ctx.flags.source, key: ctx.flags.key };
  try {
    console.log(ctx.flags["dry-run"] ? anchorPath(context, options) : await ensureAnchorPath(context, options));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function runIndex(ctx: { args: { directory: string }; flags: { force?: boolean } }): Promise<void> {
  try {
    const result = await buildContextIndex(path.resolve(ctx.args.directory), { force: ctx.flags.force });
    const count = `${result.entries.length} entr${result.entries.length === 1 ? "y" : "ies"}`;
    console.log(`${result.path}\n${count}${result.preserved ? " (managed block updated, surrounding text kept)" : ""}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function runReport(ctx: { args: { command: string[] } }): Promise<void> {
  const rest = ctx.args.command[0] === "report" ? ctx.args.command.slice(1) : ctx.args.command;
  if (rest.length > 0) {
    console.error(`Unknown subcommand: ${rest.join(" ")}`);
    process.exitCode = 1;
    return;
  }

  const context = await requireContext();
  if (!context) return;

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

const cli = new Crust("shared-context")
  .meta({ description: "Origin-keyed shared engineering context" })
  .use(helpPlugin())
  .command("inject", (cmd) => cmd
    .meta({ description: "Emit hook JSON injecting shared context for the current session" })
    .run(runInject))
  .command("files", (cmd) => cmd
    .meta({ description: "List files under the resolved context root" })
    .run(runFiles))
  .command("list", (cmd) => cmd
    .meta({ description: "List every known shared context" })
    .run(runList))
  .command("init", (cmd) => cmd
    .meta({ description: "Create shared context storage for this repository" })
    .run(runInit))
  .command("anchor", (cmd) => cmd
    .meta({ description: "Create and print the directory an ingested source belongs in" })
    .flags({
      source: { type: "string", required: true },
      key: { type: "string" },
      "dry-run": { type: "boolean" },
    })
    .run(runAnchor))
  .command("index", (cmd) => cmd
    .meta({ description: "Rebuild index.md from the frontmatter of a source directory" })
    .flags({ force: { type: "boolean" } })
    .args([{ name: "directory", type: "string", required: true }] as const)
    .run(runIndex))
  .command("migrate", (cmd) => cmd
    .meta({ description: "Copy alignment files between repository and shared storage" })
    .run(runMigrate))
  .args([{ name: "command", type: "string", variadic: true }] as const)
  .run(runReport);

await cli.execute();
