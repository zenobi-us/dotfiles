import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// --- Types ---

export type BashOutput = "notify" | "editor" | "send";

export interface FzfActionLong {
  type: "editor" | "send" | "bash";
  template: string;
  /** For bash actions: where to send the output (default: "notify") */
  output?: BashOutput;
}

/** Short form (string) defaults to editor type */
export type FzfAction = string | FzfActionLong;

export interface FzfCommandConfig {
  /** Bash command that outputs candidates, one per line */
  list: string;
  /** Action to perform on the selected candidate */
  action: FzfAction;
  /** Optional keyboard shortcut (e.g. "ctrl+shift+f") */
  shortcut?: string;
}

export interface FzfConfig {
  commands: Record<string, FzfCommandConfig>;
}

// --- Normalized types (resolved after parsing) ---

export interface ResolvedAction {
  type: "editor" | "send" | "bash";
  template: string;
  /** For bash actions: where to send the output (default: "notify") */
  output: BashOutput;
}

export interface ResolvedCommand {
  name: string;
  list: string;
  action: ResolvedAction;
  /** Optional keyboard shortcut (e.g. "ctrl+shift+f") */
  shortcut?: string;
}

// --- Config loading ---

function loadConfigFile(path: string): FzfConfig | null {
  if (!existsSync(path)) return null;
  try {
    const content = readFileSync(path, "utf-8");
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.commands) {
      return parsed as FzfConfig;
    }
    return null;
  } catch (err) {
    console.error(`pi-fzf: Failed to load config from ${path}: ${err}`);
    return null;
  }
}

/**
 * Resolve the short/long action form into a consistent ResolvedAction.
 */
export function resolveAction(action: FzfAction): ResolvedAction {
  if (typeof action === "string") {
    return { type: "editor", template: action, output: "notify" };
  }
  return {
    type: action.type,
    template: action.template,
    output: action.output ?? "notify",
  };
}

/**
 * Load and merge fzf configs from global and project-local locations.
 * Project-local commands override global commands with the same name.
 */
export function loadFzfConfig(cwd: string): ResolvedCommand[] {
  const globalPath = join(homedir(), ".pi", "agent", "fzf.json");
  const projectPath = join(cwd, ".pi", "fzf.json");

  const globalConfig = loadConfigFile(globalPath);
  const projectConfig = loadConfigFile(projectPath);

  // Merge: project overrides global for same-named commands
  const merged: Record<string, FzfCommandConfig> = {
    ...(globalConfig?.commands ?? {}),
    ...(projectConfig?.commands ?? {}),
  };

  return Object.entries(merged).map(([name, cmd]) => ({
    name,
    list: cmd.list,
    action: resolveAction(cmd.action),
    shortcut: cmd.shortcut,
  }));
}

/**
 * Replace {{selected}} placeholder in a template with the selected value.
 */
export function renderTemplate(template: string, selected: string): string {
  return template.replaceAll("{{selected}}", selected.trim());
}
