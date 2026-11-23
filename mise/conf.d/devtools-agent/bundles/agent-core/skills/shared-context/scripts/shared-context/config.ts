import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".config", "shared-agent-context");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const DEFAULT_STORAGE_PATH = "~/Notes/SharedAgentContext";

export type SharedAgentContextConfig = {
  storagePath: string;
};

function expandHome(value: string): string {
  return value === "~" || value.startsWith("~/") ? path.join(os.homedir(), value.slice(1)) : value;
}

export async function loadConfig(): Promise<SharedAgentContextConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw) as { schemaVersion?: unknown; storage_path?: unknown };
    if (Object.hasOwn(parsed, "schemaVersion") && parsed.schemaVersion !== "shared-context-config/v1") throw new Error("Unsupported machine configuration contract");
    if (typeof parsed.storage_path !== "string" || !parsed.storage_path.trim()) throw new Error("storage_path must be a nonempty string");
    return { storagePath: expandHome(parsed.storage_path) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  return { storagePath: expandHome(DEFAULT_STORAGE_PATH) };
}
