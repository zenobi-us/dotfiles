#!/usr/bin/env -S mise exec -- bun run --install=fallback
// One JSON request per Bun process reuses the canonical Context and Tracker APIs.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { contextData, setup, directory, file, tracker, detail, prepare, message, type CollectionKind } from "./data";
import type { ExplorerAction } from "../../../../devtools-agent/bundles/agent-core/extensions/pi-shared-context/model";

export async function request(input: Record<string, unknown>) {
  if (typeof input.cwd !== "string" || !path.isAbsolute(input.cwd)) throw new Error("Select an absolute repository folder.");
  const cwd = input.cwd;
  switch (input.operation) {
    case "context": return contextData(cwd);
    case "setup": {
      if (input.store !== "repository" && input.store !== "shared") throw new Error("Select repository or shared storage.");
      return setup(cwd, input.store, typeof input.preset === "string" ? input.preset : undefined);
    }
    case "directory": case "file": {
      if (!["alignment", "tickets", "initiatives", "sources"].includes(String(input.collection))) throw new Error("Select a resolved context collection.");
      if (typeof input.path !== "string") throw new Error("Select a collection-relative path.");
      return input.operation === "directory" ? directory(cwd, input.collection as CollectionKind, input.path) : file(cwd, input.collection as CollectionKind, input.path);
    }
    case "tracker": return tracker(cwd);
    case "detail": case "prepare": {
      if (typeof input.id !== "string" || !input.id) throw new Error("Select a tracker record.");
      if (input.kind !== "ticket" && input.kind !== "initiative") throw new Error("Select a ticket or initiative.");
      return input.operation === "detail" ? detail(cwd, input.id, input.kind) : prepare(cwd, input.id, input.kind, String(input.action) as ExplorerAction, typeof input.prompt === "string" ? input.prompt : "");
    }
    default: throw new Error("Unknown shared-context operation.");
  }
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  try {
    const [encoded, home = process.env.HERDR_APP_HOME ?? path.join(os.homedir(), ".config/herdr-app")] = argv;
    if (!encoded) throw new Error("Pass a JSON request and, optionally, the app home.");
    const runtime = JSON.parse(await fs.readFile(path.join(home, "data/shared-context-runtime.json"), "utf8"));
    if (typeof runtime.path === "string" && runtime.path) process.env.PATH = runtime.path;
    console.log(JSON.stringify({ data: await request(JSON.parse(encoded)) }));
  } catch (error) {
    console.log(JSON.stringify({ error: message(error) }));
    process.exitCode = 1;
  }
}

if (import.meta.main) await main();
