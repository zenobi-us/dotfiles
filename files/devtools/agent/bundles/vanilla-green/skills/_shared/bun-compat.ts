#!/usr/bin/env -S mise x -- bun --install=fallback

import { fileURLToPath } from "node:url";

/** Run an existing skill command while the Bun entry point is rolled out. */
export function runLegacy(script: string, argv: string[], cwd?: string): never {
  const result = Bun.spawnSync({
    cmd: ["bash", script, ...argv],
    cwd,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  process.exit(result.exitCode ?? 1);
}

export function legacyPath(scriptUrl: string, name: string): string {
  return fileURLToPath(new URL(`./${name}`, scriptUrl));
}

export function doctor(required: string[], env: string[] = []): void {
  const commands = Object.fromEntries(required.map((name) => [name, Boolean(Bun.which(name))]));
  const environment = Object.fromEntries(env.map((name) => [name, Boolean(process.env[name])]));
  console.log(JSON.stringify({ ok: Object.values(commands).every(Boolean), bun: true, commands, environment }, null, 2));
}
