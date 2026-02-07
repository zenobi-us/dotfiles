import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "node:path";

export function readPiAuthJson(): Record<string, unknown> {
  const path = join(homedir(), ".pi", "agent", "auth.json");
  if (!existsSync(path)) return {};

  try {
    const raw = readFileSync(path, "utf8");
    const data = JSON.parse(raw);
    return typeof data === "object" && data ? data : {};
  } catch {
    return {};
  }
}

export function hasAuthKey(key: string): boolean {
  const auth = readPiAuthJson();
  const value = auth[key] as { access?: string; refresh?: string } | undefined;
  return Boolean(value?.access || value?.refresh);
}
