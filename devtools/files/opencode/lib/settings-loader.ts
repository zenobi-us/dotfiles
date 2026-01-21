/**
 * Settings loader using bunfig for configuration management
 * 
 * Bunfig allows us to use onCreate callbacks and other advanced features
 * that aren't possible with plain JSON.
 * 
 * Settings file: ~/.pi/settings.bunfig
 * 
 * Example:
 * ```
 * export default {
 *   worktree: {
 *     parentDir: "~/.local/share/worktrees/{{project}}",
 *     onCreate: async (ctx) => {
 *       console.log(`Created worktree at ${ctx.path}`);
 *       // Run setup commands
 *     }
 *   }
 * }
 * ```
 */

import { homedir } from "os";
import { join, resolve } from "path";
import { existsSync, readFileSync } from "fs";
import type { WorktreeCreatedContext, WorktreeSettings } from "./types";

/**
 * Get the settings file path
 */
export function getSettingsPath(): string {
  return join(homedir(), ".pi", "settings.bunfig.ts");
}

/**
 * Load settings from ~/.pi/settings.bunfig
 * 
 * This uses dynamic imports to support onCreate callbacks and other
 * advanced TypeScript/JavaScript features.
 */
export async function loadSettings(): Promise<WorktreeSettings> {
  const settingsPath = getSettingsPath();

  if (!existsSync(settingsPath)) {
    return {};
  }

  try {
    // Use dynamic import to load the settings file
    // This allows for top-level await and onCreate functions
    const { default: settings } = await import(
      `file://${resolve(settingsPath)}`
    );

    if (!settings) {
      return {};
    }

    return settings.worktree || {};
  } catch (error) {
    console.error(`Failed to load settings from ${settingsPath}:`, error);
    return {};
  }
}

/**
 * Get the expanded parentDir with template variables substituted
 */
export function getExpandedParentDir(
  settings: WorktreeSettings,
  context: WorktreeCreatedContext
): string {
  if (!settings.parentDir) {
    // Default: ~/.local/share/worktrees/{{project}}
    return expandTemplate("~/.local/share/worktrees/{{project}}", context);
  }

  return expandTemplate(settings.parentDir, context);
}

/**
 * Load settings synchronously (for CLI commands that can't be async)
 * 
 * Note: This won't work with onCreate callbacks if they're async.
 * Use loadSettings() when possible.
 */
export function loadSettingsSync(): WorktreeSettings {
  const settingsPath = getSettingsPath();

  if (!existsSync(settingsPath)) {
    return {};
  }

  try {
    // For sync loading, we'd need to use require or evaluate the file
    // This is more limited, so we recommend using the async version
    console.warn(
      "Using sync settings loader - onCreate callbacks may not work properly. Use loadSettings() instead."
    );

    const content = readFileSync(settingsPath, "utf-8");

    // Try to parse as JSON-like format (limited)
    // This is a fallback for when async import isn't possible
    try {
      // Remove export statements and evaluate
      const cleaned = content
        .replace(/export\s+default\s+/, "")
        .replace(/as\s+const/, "");
      const settings = eval(`(${cleaned})`);
      return settings.worktree || {};
    } catch {
      return {};
    }
  } catch (error) {
    console.error(`Failed to load settings from ${settingsPath}:`, error);
    return {};
  }
}

/**
 * Expand template variables in a string
 * 
 * Template variables: {{project}}, {{name}}, {{branch}}, {{path}}, {{mainWorktree}}
 * 
 * Example:
 *   expandTemplate("~/.worktrees/{{project}}/{{name}}", context)
 *   → "~/.worktrees/my-project/feature-branch"
 */
export function expandTemplate(
  template: string,
  context: WorktreeCreatedContext
): string {
  return Object.entries(context).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`{{${key}}}`, "g"), String(value)),
    template
  );
}

/**
 * Call onCreate callback if it exists
 */
export async function callOnCreate(
  settings: WorktreeSettings,
  context: WorktreeCreatedContext
): Promise<void> {
  if (!settings.onCreate) {
    return;
  }

  if (typeof settings.onCreate === "function") {
    // It's a function, call it directly
    await settings.onCreate(context);
  } else if (typeof settings.onCreate === "string") {
    // It's a command string, execute it
    const { execSync } = await import("child_process");

    try {
      execSync(settings.onCreate, {
        stdio: "inherit",
        cwd: context.path,
      });
    } catch (error) {
      console.error(
        `Failed to execute onCreate command "${settings.onCreate}":`,
        error
      );
      throw error;
    }
  }
}
