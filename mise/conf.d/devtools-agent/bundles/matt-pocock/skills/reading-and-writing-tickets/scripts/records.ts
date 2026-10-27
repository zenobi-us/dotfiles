#!/usr/bin/env -S mise x -- bun
// Explicit record checks and reviewed, repository-scoped Local Markdown migrations.
import { promises as fs } from "node:fs";
import path from "node:path";
import { applyMigration, checkMigration, checkRecord, describePlanRecords, planMigration, writePlanOutput, type MigrationPlan, type Selector } from "./record-migration.ts";
import { RESULT_SCHEMA } from "./record-schema.ts";

const help = `Usage:
  records.ts check --repository <absolute-path> (--ticket <id> | --initiative <id>)
  records.ts migrate plan --repository <absolute-path> (--ticket <id> | --spec-ticket <id> | --initiative-spec <id>) [--output <plan.json>]
  records.ts migrate apply --repository <absolute-path> --plan <plan.json> --acknowledge-writer-safety
  records.ts migrate check --repository <absolute-path> --migration <id>

Selectors name the operation, never infer record kind from filenames:
  --ticket          Stamp one unversioned ticket as tracker-ticket/v1.
  --spec-ticket     Move one explicitly selected legacy spec ticket to an initiative index;
                    keep its id (including -spec), children, status and dependencies.
  --initiative-spec Consolidate one initiative's spec.md into index.md. Refuse any existing index.
                    Both initiative conversions require frontmatter id/title; id must match the selector.
                    No filename or heading metadata is inferred. All legacy children gain tracker-ticket/v1;
                    existing child IDs, parents, status, blockers and custom content are preserved.

Plan is read-only unless --output is supplied. Output must be outside all resolved tracker
and workflow collections and must not already exist. Without --output the JSON result includes the plan;
apply requires a saved plan object, not the result envelope. With --output the file is that object.
All operation results use tracker-result/v1. IDs and roots come from shared-context resolution.
Optional --shared-context-base <absolute-path> selects the shared-context base explicitly.

Apply requires an explicit saved plan and --acknowledge-writer-safety. This flag asserts that
the caller coordinated all writers. There is NO automated muxer/agent liveness check. The local
CLI lock cannot prevent edits by other tools. Stale snapshots, changed roots, unknown schemas,
existing destinations, executable spec history and unsafe paths block mutation. Failures trigger
guarded rollback where possible; inspect append-only recovery events before further work.

Only apply creates workflow migration-<id>/artifacts/snapshots/migration-plan.json and
append-only events/<sequence>-migration.json. Events/reviews/history are never rewritten.
References are repaired within resolved live tracker collections only. Review ordinary repository
docs and external references manually; coverage is not a repository-wide link audit.
No automatic commit or push. Commit and publish every affected Git store and the workflow,
then repeat migrate check. Incomplete recovery/publication blocks further migration work.
`;

export async function main(argv = process.argv.slice(2)): Promise<void> {
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) { console.log(help); return; }
  let operation = argv.shift()!;
  if (operation === "migrate") operation += ` ${argv.shift() ?? ""}`;
  const values: Record<string, string> = {};
  let acknowledged = false;
  const allowed: Record<string, true> = { repository: true, ticket: true, initiative: true, "spec-ticket": true, "initiative-spec": true, output: true, plan: true, migration: true, "shared-context-base": true };
  while (argv.length) {
    const argument = argv.shift()!;
    if (argument === "--acknowledge-writer-safety") {
      if (acknowledged) throw new Error("Writer-safety acknowledgement was supplied more than once");
      acknowledged = true;
      continue;
    }
    const key = argument.slice(2);
    if (!argument.startsWith("--") || !allowed[key] || values[key] !== undefined) throw new Error("Unknown or repeated argument; use --help");
    const value = argv.shift();
    if (!value || value.startsWith("--")) throw new Error(`--${key} requires a value`);
    values[key] = value;
  }
  if (!values.repository || !path.isAbsolute(values.repository)) throw new Error("Pass an explicit absolute --repository path");
  if (values["shared-context-base"] && !path.isAbsolute(values["shared-context-base"])) throw new Error("--shared-context-base must be absolute");
  const options = { repository: values.repository, sharedContextBase: values["shared-context-base"] };
  const permitted: Record<string, string[]> = {
    check: ["ticket", "initiative"], "migrate plan": ["ticket", "spec-ticket", "initiative-spec", "output"],
    "migrate apply": ["plan"], "migrate check": ["migration"],
  };
  if (!permitted[operation]) throw new Error("Unknown command; use --help");
  for (const key of Object.keys(values)) if (!["repository", "shared-context-base", ...permitted[operation]!].includes(key)) throw new Error(`--${key} is not valid for this command`);
  if (acknowledged && operation !== "migrate apply") throw new Error("Writer-safety acknowledgement is only valid for migrate apply");
  let result: Record<string, unknown>;
  if (operation === "check") {
    const selection = ["ticket", "initiative"].filter((kind) => values[kind]);
    if (selection.length !== 1) throw new Error("Check requires exactly one --ticket or --initiative selector");
    const kind = selection[0] as "ticket" | "initiative";
    result = await checkRecord(options, kind, values[kind]!);
  } else if (operation === "migrate plan") {
    const selection = ["ticket", "spec-ticket", "initiative-spec"].filter((kind) => values[kind]);
    if (selection.length !== 1) throw new Error("Migration plan requires exactly one explicit record selector");
    const kind = selection[0] as Selector["kind"];
    const plan = await planMigration(options, { kind, id: values[kind]! });
    if (values.output) await writePlanOutput(options, plan, values.output);
    result = { schema: RESULT_SCHEMA, operation, ok: plan.conflicts.length === 0, migration: plan.id, ...describePlanRecords(plan), changes: null, validation: { status: plan.conflicts.length ? "conflict" : "planned", details: [...plan.validation, ...plan.conflicts] }, publication: null, plan, ...(values.output ? { planFile: path.resolve(values.output) } : {}) };
  } else if (operation === "migrate apply") {
    if (!values.plan) throw new Error("Migration apply requires --plan <saved-plan.json>");
    const plan = JSON.parse(await fs.readFile(values.plan, "utf8")) as MigrationPlan;
    const applied = await applyMigration(options, plan, acknowledged);
    result = { ...applied, operation, changes: applied.idempotent ? null : { fields: Object.fromEntries(plan.changes.map((entry) => [entry.newRef, { old_ref: entry.oldRef, new_ref: entry.newRef, before_hash: entry.beforeHash, after_hash: entry.afterHash }])), dependency_edges_added: [], dependency_edges_removed: [] } };
  } else {
    if (!values.migration) throw new Error("Migration check requires --migration <id>");
    result = await checkMigration(options, values.migration);
  }
  console.log(JSON.stringify({ schema: RESULT_SCHEMA, operation, backend: "local-markdown", initiatives: [], tickets: [], changes: null, validation: { status: "passed", details: [] }, publication: null, rendered: null, ...result }, null, 2));
  if (result.ok === false) process.exitCode = 1;
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    const argv = process.argv.slice(2);
    const operation = argv[0] === "migrate" ? `migrate ${argv[1] ?? ""}`.trim() : argv[0] ?? "check";
    const message = error instanceof Error ? error.message : String(error);
    console.log(JSON.stringify({ schema: RESULT_SCHEMA, operation, backend: null, ok: false, initiatives: [], tickets: [], changes: null, validation: { status: "failed", details: [message] }, publication: null, rendered: null, error: message }, null, 2));
    process.exitCode = 1;
  });
}
