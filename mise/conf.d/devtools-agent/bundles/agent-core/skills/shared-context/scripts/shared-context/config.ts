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
    const parsed = JSON.parse(raw) as { storage_path?: string };
    if (parsed.storage_path) return { storagePath: expandHome(parsed.storage_path) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  await fs.mkdir(CONFIG_DIR, { recursive: true });
  try {
    await fs.writeFile(
      CONFIG_FILE,
      `${JSON.stringify({ storage_path: DEFAULT_STORAGE_PATH }, null, 2)}\n`,
      { flag: "wx" },
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  return { storagePath: expandHome(DEFAULT_STORAGE_PATH) };
}
