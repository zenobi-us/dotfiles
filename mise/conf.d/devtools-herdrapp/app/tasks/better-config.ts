#!/usr/bin/env -S mise exec -- bun run --install=fallback
// Keep existing Better Config installs; publish a new pinned copy only when complete.
import { promises as fs } from "node:fs";
import path from "node:path";
import { appHome } from "./files";

const target = path.join(appHome, "mods/better-config");
try {
  await fs.lstat(target);
  console.log("Keep the installed Better Config mod.");
  process.exit(0);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}
const revision = "2bd4870634b8b0b86984651c98c30cf5be170e60";
const base = `https://raw.githubusercontent.com/munza/herdr-mods/${revision}`;
const files = ["main.js", "model.js", "mod.json", "mod.schema.json", "icons/check.svg", "icons/chevron-down.svg"];
const contents = await Promise.all([...files.map(file => `better-config/mods/better-config/${file}`), "LICENSE", "NOTICE"].map(async file => {
  const response = await fetch(`${base}/${file}`);
  if (!response.ok) throw new Error(`Cannot read Better Config ${file}: HTTP ${response.status}.`);
  return response.text();
}));
await fs.mkdir(path.dirname(target), { recursive: true });
const temporary = await fs.mkdtemp(`${target}.next-`);
try {
  for (const [index, file] of [...files, "LICENSE", "NOTICE"].entries()) {
    const destination = path.join(temporary, file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, contents[index]!);
  }
  await fs.rename(temporary, target);
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
console.log("Installed the pinned Better Config mod.");
