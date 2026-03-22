import * as fs from "node:fs";
import type { Monitor } from "./types";

export function loadPatterns(monitor) {
  try {
    const raw = fs.readFileSync(monitor.resolvedPatternsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function formatPatternsForPrompt(patterns) {
  return patterns
    .map((p, i) => `${i + 1}. [${p.severity ?? "warning"}] ${p.description}`)
    .join("\n");
}

export function learnPattern(monitor, description) {
  const patterns = loadPatterns(monitor);
  const id = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);
  // dedup by description
  if (patterns.some((p) => p.description === description)) return;
  patterns.push({
    id,
    description,
    severity: "warning",
    source: "learned",
    learned_at: new Date().toISOString(),
  });
  const tmpPath = `${monitor.resolvedPatternsPath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(patterns, null, 2) + "\n");
    fs.renameSync(tmpPath, monitor.resolvedPatternsPath);
  } catch (err) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* cleanup */
    }
    console.error(
      `[${monitor.name}] Failed to write pattern: ${err instanceof Error ? err.message : err}`,
    );
  }
}
