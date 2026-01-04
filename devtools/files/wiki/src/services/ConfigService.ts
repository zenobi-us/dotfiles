/**
 * Plugin Configuration - Skill Discovery and Prompt Rendering
 *
 * WHY: Skills can be stored in two places:
 * 1. User-global: ~/.opencode/skills/ (or platform equivalent)
 * 2. Project-local: ./project/.opencode/skills/
 *
 * This module resolves both paths with proper priority so:
 * - Users can install global skills once, reuse across projects
 * - Projects can override/add skills locally without affecting other projects
 *
 * PATH PRIORITY (Reverse order - last wins):
 * 1. Global config path (lowest priority): ~/.opencode/skills/
 * 2. Project-local path (highest priority): ./.opencode/skills/
 *
 * WHY THIS ORDER: A developer can check in skills via ./.opencode/skills/
 * and those will be discovered first. If a skill with the same name exists
 * in ~/.opencode/skills/, the project-local version wins (last one registered).
 *
 * WHY envPaths: Handles platform-specific paths correctly:
 * - Linux: ~/.config/opencode/skills/
 * - macOS: ~/Library/Preferences/opencode/skills/
 * - Windows: %APPDATA%/opencode/skills/
 * Without this, hard-coding ~/.opencode/ fails on non-Unix systems.
 *
 * PROMPT RENDERER CONFIGURATION:
 * - promptRenderer: Default format for prompt injection ('xml' | 'json' | 'md')
 * - modelRenderers: Per-model format overrides (optional)
 * - Loaded via bunfig from .opencode-skillful.json or ~/.config/opencode-skillful/config.json
 *
 * @param ctx PluginInput from OpenCode runtime (provides working directory)
 * @returns Promise<PluginConfig> with resolved paths, debug flag, and renderer config
 */
import type { Config as ConfigShape } from 'bunfig';
import { loadConfig } from 'bunfig';
import { type } from 'arktype';

import { join } from 'node:path';
import envPaths from 'env-paths';


const Paths = envPaths('wiki', { suffix: '' });

export const ConfigSchema = type({
  notebooks: 'string[]',
  notebookPath: 'string?',
  configFilePath: 'string',
});

export type Config = typeof ConfigSchema.infer;

const options: ConfigShape<Config> = {
  name: 'opentask',
  cwd: './',
  defaultConfig: {
    notebooks: [
      join(Paths.config, 'notebooks'), // Lowest priority: Standard User Config (windows)
    ],
    configFilePath: 'wiki/config.json',
  },
};

export async function createConfigService(args: {
  directory: string;
}): Promise<Config> {
  const resolvedConfig = await loadConfig(options);

  return resolvedConfig;
}

export const ConfigService = await createConfigService({ directory: process.cwd() });
