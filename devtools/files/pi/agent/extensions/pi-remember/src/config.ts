import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { RememberConfig, Scope } from "./types.js";

const DEFAULT_CONFIG: RememberConfig = {
  enabled: true,
  scope: "project",
  inject: {
    count: 5,
    lowThreshold: 0.3,
    highThreshold: 0.8,
  },
};

function parseScope(value: unknown): Scope | null {
  if (value === "global" || value === "project" || value === "both") return value;
  return null;
}

export function loadConfig(cwd: string): RememberConfig {
  const globalPath = path.join(os.homedir(), ".pi", "agent", "remember.json");
  const projectPath = path.join(cwd, ".agents", "remember.json");
  const base: RememberConfig = structuredClone(DEFAULT_CONFIG);
  for (const p of [globalPath, projectPath]) {
    if (!fs.existsSync(p)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(p, "utf-8")) as Partial<RememberConfig>;
      if (typeof parsed.enabled === "boolean") base.enabled = parsed.enabled;
      const scope = parseScope(parsed.scope);
      if (scope) base.scope = scope;
      if (parsed.inject && typeof parsed.inject === "object") {
        if (typeof parsed.inject.count === "number") base.inject.count = parsed.inject.count;
        if (typeof parsed.inject.lowThreshold === "number") base.inject.lowThreshold = parsed.inject.lowThreshold;
        if (typeof parsed.inject.highThreshold === "number") base.inject.highThreshold = parsed.inject.highThreshold;
      }
    } catch (err) {
      throw new Error(`Malformed config at ${p}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return base;
}
