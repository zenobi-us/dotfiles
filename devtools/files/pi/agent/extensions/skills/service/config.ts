import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export type SearchStrategy = "lexical" | "bm25" | "vector" | "hybrid";

export type RuntimeSettings = {
  enableSkillCommands: boolean;
  lazySkills: boolean;
  searchStrategy: SearchStrategy;
};

function getAgentDir(): string {
  const envCandidates = ["PI_CODING_AGENT_DIR", "TAU_CODING_AGENT_DIR"];

  for (const key of envCandidates) {
    const value = process.env[key];
    if (value) return value;
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (key.endsWith("_CODING_AGENT_DIR") && value) {
      return value;
    }
  }

  return join(homedir(), ".pi", "agent");
}

function readJsonFile(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};

  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function readBooleanSetting(
  projectSettings: Record<string, unknown>,
  agentSettings: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  if (typeof projectSettings[key] === "boolean")
    return projectSettings[key] as boolean;
  if (typeof agentSettings[key] === "boolean")
    return agentSettings[key] as boolean;
  return fallback;
}

function readEnumSetting<T extends string>(
  projectSettings: Record<string, unknown>,
  agentSettings: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const projectValue = projectSettings[key];
  if (typeof projectValue === "string" && allowed.includes(projectValue as T)) {
    return projectValue as T;
  }

  const agentValue = agentSettings[key];
  if (typeof agentValue === "string" && allowed.includes(agentValue as T)) {
    return agentValue as T;
  }

  return fallback;
}

export function getRuntimeSettings(cwd: string): RuntimeSettings {
  const agentSettingsPath = join(getAgentDir(), "settings.json");
  const projectSettingsPath = resolve(cwd, ".pi", "settings.json");

  const agentSettings = readJsonFile(agentSettingsPath);
  const projectSettings = readJsonFile(projectSettingsPath);

  return {
    enableSkillCommands: readBooleanSetting(
      projectSettings,
      agentSettings,
      "enableSkillCommands",
      true,
    ),
    lazySkills: readBooleanSetting(
      projectSettings,
      agentSettings,
      "lazySkills",
      false,
    ),
    searchStrategy: readEnumSetting<SearchStrategy>(
      projectSettings,
      agentSettings,
      "searchStrategy",
      ["lexical", "bm25", "vector", "hybrid"] as const,
      "lexical",
    ),
  };
}
