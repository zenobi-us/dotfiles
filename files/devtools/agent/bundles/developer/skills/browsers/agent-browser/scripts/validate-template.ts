#!/usr/bin/env -S mise x -- bun --install=fallback
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../templates", import.meta.url).pathname;
const required = ["#!/bin/bash", "agent-browser"];
const files = (await readdir(root)).filter((name) => name.endsWith(".sh"));
const failures: string[] = [];
for (const name of files) {
  const text = await Bun.file(join(root, name)).text();
  for (const marker of required) if (!text.includes(marker)) failures.push(`${name}: missing ${marker}`);
}
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`template validation: ok (${files.length} files)`);
