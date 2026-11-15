// Cache observations resolve their own paths. Stored or panel-supplied paths
// never select files to read during validation.
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { project } from "./data";
import { resolveContextRecord } from "../../devtools-agent/bundles/agent-core/skills/shared-context/scripts/shared-context/lib";
import { readSnapshot } from "./read-session";
import { executor } from "./native";
import type { Request } from "./protocol";

export type Observation = { path: string; actual?: string; identity?: string; digest?: string; missing?: true };
export async function observeRead(request: Request): Promise<Observation[]> {
  const context = await project(request.cwd), files = new Set<string>();
  if (context.routeSource) files.add(context.routeSource);
  const { operation, fields } = request;
  if (operation === "file" || operation === "directory") {
    const collection = await resolveContextRecord(context, { kind: fields.collection as "alignment" | "tickets" | "initiatives" | "sources" });
    if (!collection.path) throw new Error("This collection belongs to an external tracker.");
    const root = await fs.realpath(collection.path).catch(error => {
      if (error.code === "ENOENT" && fields.path === "") return collection.path!;
      throw error;
    }), file = path.resolve(root, fields.path as string);
    const actual = await fs.realpath(file).catch(error => {
      if (error.code === "ENOENT" && fields.path === "") return file;
      throw error;
    }), offset = path.relative(root, actual);
    if (offset === ".." || offset.startsWith(`..${path.sep}`) || path.isAbsolute(offset)) throw new Error("The path leaves the resolved collection.");
    files.add(file);
  } else if (operation === "tracker" || operation === "detail") {
    const snapshot = await readSnapshot(context, executor(request.cwd));
    const ticketCollection = await resolveContextRecord(context, { kind: "tickets" });
    const tickets = new Map(snapshot.tickets.map(record => [record.id, record]));
    const selected = new Set<string>();
    const initiatives = new Set<string>();
    if (operation === "tracker") {
      for (const ticket of snapshot.tickets) selected.add(ticket.id);
      for (const initiative of snapshot.initiatives) if (!initiative.group) initiatives.add(initiative.id);
    } else if (fields.kind === "initiative") initiatives.add(fields.id as string);
    else selected.add(fields.id as string);
    // A blocked ticket depends on its blockers, including transitive blockers.
    for (const id of selected) {
      const record = tickets.get(id);
      for (const blocker of record?.blockedBy ?? []) selected.add(blocker);
      const parent = record?.fields?.parent;
      if (typeof parent === "string") initiatives.add(parent);
    }
    for (const id of selected) {
      const ticket = tickets.get(id), prefix = `${ticketCollection.ref}/`;
      if (ticketCollection.path && ticket?.ref.startsWith(prefix)) files.add(path.join(ticketCollection.path, ticket.ref.slice(prefix.length)));
      if (operation === "detail" || fields.tree !== true) {
        const workflow = await resolveContextRecord(context, { kind: "workflow", id });
        if (workflow.path) await collectFiles(path.join(workflow.path, "events"), files);
      }
    }
    for (const id of initiatives) {
      const record = await resolveContextRecord(context, { kind: "initiative", id });
      if (record.path) files.add(path.join(record.path, "index.md"));
    }
  }
  const observations: Observation[] = [];
  for (const file of [...files].sort()) {
    try {
      const info = await fs.lstat(file, { bigint: true }), actual = await fs.realpath(file);
      const target = info.isSymbolicLink() ? await fs.stat(file, { bigint: true }) : info;
      const identity = `${info.dev}:${info.ino}:${info.mode}:${target.dev}:${target.ino}:${target.mode}`;
      // Directories are observations of membership, not their timestamps.
      const bytes = target.isFile()
        ? await fs.readFile(file)
        : Buffer.from(JSON.stringify((await fs.readdir(file, { withFileTypes: true })).filter(entry => entry.name !== ".git" && !entry.isSymbolicLink()).map(entry => [entry.name, entry.isDirectory()]).sort()));
      observations.push({ path: file, actual, identity, digest: createHash("sha256").update(bytes).digest("hex") });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      observations.push({ path: file, missing: true });
    }
  }
  return observations;
}

async function collectFiles(root: string, files: Set<string>): Promise<void> {
  files.add(root);
  let entries;
  try { entries = await fs.readdir(root, { withFileTypes: true }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return; throw error; }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new Error("Workflow observations cannot follow symbolic links.");
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) await collectFiles(file, files);
    else files.add(file);
  }
}
