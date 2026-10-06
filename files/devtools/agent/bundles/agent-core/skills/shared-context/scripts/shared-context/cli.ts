#!/usr/bin/env -S mise x -- bun --install=fallback
import path from "node:path";
import { buildSharedContextReport, initializeContextForCwd } from "./api";
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import {
  buildContextIndex,
  listSharedContextFiles,
  listSharedContexts,
  migrateAlignmentContext,
  migrateContextRoute,
  migrateLegacyStorage,
  renderSharedContext,
  resolveContextPath,
  resolveContextRecord,
  resolveSharedContext,
  type ContextPathOptions,
  type Exec,
  type RecordKind,
  type SharedAgentContext,
  type Store,
} from "./lib";

const exec: Exec = async (command, args) => {
  const result = Bun.spawnSync([command, ...args], { stdout: "pipe", stderr: "pipe" });
  return { stdout: Buffer.from(result.stdout).toString("utf8"), code: result.exitCode };
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
  if (!context || !context.instructions) {
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

async function runInit(ctx: { flags: { preset?: string } }): Promise<void> {
  try {
    const { agents, created, hostedShared } = await initializeContextForCwd(exec, process.cwd(), ctx.flags.preset);
    console.log(`${created ? `Created ${agents}` : `${agents} already exists`}. Shared storage activates on the next session.`);
    if (hostedShared) console.log("Preset: Hosted tickets with shared engineering records");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function runMigrate(ctx: {
  args: { kind?: string };
  flags: { to?: string; legacyOnly?: boolean };
}): Promise<void> {
  const context = await requireContext();
  if (!context) return;
  try {
    if (ctx.flags.legacyOnly) {
      await migrateLegacyStorage(context);
      console.log(`Wrote ${path.join(context.candidateSharedRoot!, ".context-routes.toml")} and removed the legacy .storage marker`);
      return;
    }
    if (!ctx.args.kind && !ctx.flags.to) {
      const result = await migrateAlignmentContext(context);
      console.log(`Copied ${result.copied.length} alignment path(s) to ${result.store} storage:\n${result.copied.join("\n")}`);
      console.log(result.store === "shared" ? "Publication: push-if-remote" : "Publication: repository Git");
      return;
    }
    const validKinds = ["alignment", "tickets", "initiatives", "workflows", "evidence", "sources"];
    const kind = ctx.args.kind === "ticket" ? "tickets" : ctx.args.kind;
    if (!kind || !validKinds.includes(kind)) throw new Error(`Migration requires one of: ${validKinds.join(", ")}`);
    if (ctx.flags.to !== "shared" && ctx.flags.to !== "repository") throw new Error("Migration requires --to shared or --to repository");
    const result = await migrateContextRoute(context, kind as RecordKind, ctx.flags.to as Store);
    console.log(`Copied ${result.copied.length} ${result.kind} path(s) to ${result.store} storage:\n${result.copied.join("\n")}`);
    console.log(result.store === "shared" ? "Publication: push-if-remote" : "Publication: repository Git");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

type RecordFlags = {
  id?: string;
  workflow?: string;
  run?: string;
  ticket?: string;
  source?: string;
  library?: boolean;
};
type RecordOptions = Parameters<typeof resolveContextRecord>[1];

function recordOptions(kind: string, flags: RecordFlags, operation: string): RecordOptions {
  switch (kind) {
    case "alignment":
      return { kind: "alignment" };
    case "ticket":
      if (!flags.id) throw new Error(`${operation} ticket requires --id`);
      return { kind: "ticket", id: flags.id };
    case "initiative":
    case "workflow":
    case "adr":
      if (!flags.id) throw new Error(`${operation} ${kind} requires --id`);
      return { kind, id: flags.id };
    case "evidence":
      if (!flags.workflow || !flags.run) throw new Error(`${operation} evidence requires --workflow and --run`);
      return { kind: "evidence", workflow: flags.workflow, run: flags.run };
    case "source":
      if (!flags.source) throw new Error(`${operation} source requires --source`);
      return { kind: "source", source: flags.source, ticket: flags.ticket, library: flags.library };
    default:
      throw new Error(`Unknown record kind "${kind}"`);
  }
}

async function runResolve(ctx: {
  args: { kind: string };
  flags: { id?: string; workflow?: string; run?: string; ticket?: string; source?: string; library?: boolean; json?: boolean };
}): Promise<void> {
  const context = await requireContext();
  if (!context) return;
  try {
    const record = await resolveContextRecord(context, recordOptions(ctx.args.kind, ctx.flags, "resolve"));
    if (ctx.flags.json) console.log(JSON.stringify(record, null, 2));
    else console.log(record.path ?? record.ref);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

type PathFlags = { id?: string; ticket?: string; source?: string; library?: boolean };

async function runPath(ctx: { args: { kind: string }; flags: PathFlags }): Promise<void> {
  const context = await requireContext();
  if (!context) return;

  try {
    let options: ContextPathOptions;
    switch (ctx.args.kind) {
      case "tracker":
        options = { kind: "tracker" };
        break;
      case "ticket":
      case "initiative":
      case "workflow":
      case "adr":
        if (!ctx.flags.id) throw new Error(`${ctx.args.kind} paths require --id`);
        options = { kind: ctx.args.kind, id: ctx.flags.id };
        break;
      case "source":
        if (!ctx.flags.source) throw new Error("source paths require --source");
        options = {
          kind: "source",
          source: ctx.flags.source,
          ticket: ctx.flags.ticket,
          library: ctx.flags.library,
        };
        break;
      default:
        throw new Error(`Unknown path kind "${ctx.args.kind}"`);
    }
    console.log(await resolveContextPath(context, options));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function runIndex(ctx: {
  args: { directory: string };
  flags: {
    force?: boolean;
    kind?: string;
    id?: string;
    workflow?: string;
    run?: string;
    ticket?: string;
    source?: string;
    library?: boolean;
  };
}): Promise<void> {
  const context = await requireContext();
  if (!context) return;

  try {
    let root = context.alignmentRoot;
    if (ctx.flags.kind) {
      const record = await resolveContextRecord(
        context,
        recordOptions(ctx.flags.kind, ctx.flags, "index --kind"),
      );
      if (!record.root) throw new Error(`No file store is available for ${ctx.flags.kind}`);
      root = record.root;
    }
    const result = await buildContextIndex(path.resolve(ctx.args.directory), { force: ctx.flags.force, root });
    const count = `${result.entries.length} entr${result.entries.length === 1 ? "y" : "ies"}`;
    console.log(`${result.path}\n${count}${result.preserved ? " (managed block updated, surrounding text kept)" : ""}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function runRoot(): Promise<void> {
  const context = await requireContext();
  if (context) console.log(context.root);
}

function runDoctor(): void {
  const checks = [
    ["bun", Bun.version],
    ["mise", Bun.which("mise") ? "available" : "missing"],
    ["git", Bun.which("git") ? "available" : "missing"],
    ["fd", Bun.which("fd") ? "available" : "missing"],
  ];
  console.log(checks.map(([name, status]) => `${name}: ${status}`).join("\n"));
  if (checks.some(([name, status]) => name !== "bun" && status === "missing")) process.exitCode = 1;
}

async function runReport(ctx: { args: { command: string[] } }): Promise<void> {
  const rest = ctx.args.command[0] === "report" ? ctx.args.command.slice(1) : ctx.args.command;
  if (rest.length > 0) {
    console.error(`Unknown subcommand: ${rest.join(" ")}`);
    process.exitCode = 1;
    return;
  }

  const report = await buildSharedContextReport(exec, process.cwd());
  if (!report) {
    console.error("No git repository with an origin remote found");
    process.exitCode = 1;
    return;
  }
  console.log(report);
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
    .flags({ preset: { type: "string" } })
    .run(runInit))
  .command("resolve", (cmd) => cmd
    .meta({ description: "Resolve one record through its configured adapter and store" })
    .flags({
      id: { type: "string" },
      workflow: { type: "string" },
      run: { type: "string" },
      ticket: { type: "string" },
      source: { type: "string" },
      library: { type: "boolean" },
      json: { type: "boolean" },
    })
    .args([{ name: "kind", type: "string", required: true }] as const)
    .run(runResolve))
  .command("path", (cmd) => cmd
    .meta({ description: "Print a typed path under the resolved context root" })
    .flags({
      id: { type: "string" },
      ticket: { type: "string" },
      source: { type: "string" },
      library: { type: "boolean" },
    })
    .args([{ name: "kind", type: "string", required: true }] as const)
    .run(runPath))
  .command("index", (cmd) => cmd
    .meta({ description: "Rebuild index.md within a resolved record store" })
    .flags({
      force: { type: "boolean" },
      kind: { type: "string" },
      id: { type: "string" },
      workflow: { type: "string" },
      run: { type: "string" },
      ticket: { type: "string" },
      source: { type: "string" },
      library: { type: "boolean" },
    })
    .args([{ name: "directory", type: "string", required: true }] as const)
    .run(runIndex))
  .command("migrate", (cmd) => cmd
    .meta({ description: "Migrate one record kind between repository and shared storage" })
    .flags({
      to: { type: "string" },
      legacyOnly: { type: "boolean" },
    })
    .args([{ name: "kind", type: "string" }] as const)
    .run(runMigrate))
  .command("doctor", (cmd) => cmd
    .meta({ description: "Check Bun and external command prerequisites" })
    .run(runDoctor))
  .command("root", (cmd) => cmd
    .meta({ description: "Print the resolved context root" })
    .run(runRoot))
  .args([{ name: "command", type: "string", variadic: true }] as const)
  .run(runReport);

await cli.execute();
