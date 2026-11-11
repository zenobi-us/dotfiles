#!/usr/bin/env -S mise exec -- bun run --install=fallback
// Download all missing fonts before changing the installed set.
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { appHome, atomicWrite } from "./files";

const fonts: { file: string; url: string; sha256: string }[] = await Bun.file(path.join(import.meta.dir, "../fonts.json")).json();
const pending = await Promise.all(fonts.map(async font => {
  const destination = path.join(appHome, "fonts", font.file);
  try {
    if (createHash("sha256").update(await fs.readFile(destination)).digest("hex") === font.sha256) return null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const response = await fetch(font.url);
  if (!response.ok) throw new Error(`Cannot download ${font.file}: HTTP ${response.status}.`);
  const content = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(content).digest("hex") !== font.sha256) throw new Error(`The checksum for ${font.file} does not match fonts.json.`);
  return { destination, content };
}));
for (const font of pending) if (font) await atomicWrite(font.destination, font.content);
console.log("Managed fonts are installed and verified.");
