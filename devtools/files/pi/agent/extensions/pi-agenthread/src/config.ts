import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { CONFIG_DIR_NAME, getAgentDir } from "@earendil-works/pi-coding-agent";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Type, type Static } from "typebox";
import { Value } from "typebox/value";

/**
 * TypeBox schema is the shared contract between user-authored JSON files and the
 * extension runtime. Unknown keys are rejected so typoed config does not look
 * like it worked.
 */
export const ZellijAgentConfigSchema = Type.Partial(
  Type.Object(
    {
      statusBarTemplate: Type.String({
        minLength: 1, default: "zellij {status}",
        description: `Template for the Pi status bar. Use following tokens for interpolation: 
            - {tool} for the current tool call.
            - {status} to interpolate the current state. 
            - {title} for the current Zellij pane title.
        `
      }),
    },
    { additionalProperties: false },
  ),
);

export type ZellijAgentConfigInput = Static<typeof ZellijAgentConfigSchema>;

export type ZellijAgentConfig = Required<ZellijAgentConfigInput>;

/**
 * Builds defaults from TypeBox annotations so docs, validation, and runtime
 * fallback values cannot drift into three separate sources of truth.
 */
export function defaultConfig(): ZellijAgentConfig {
  const value = Value.Default(ZellijAgentConfigSchema, {});
  if (!Value.Check(ZellijAgentConfigSchema, value)) {
    throw new Error("invalid zellij-agent default config schema");
  }
  return value as ZellijAgentConfig;
}

/**
 * Converts untrusted JSON into the partial config shape. Invalid files collapse
 * to an empty override so callers can keep simple default/global/project merging.
 */
export function parseConfig(input: unknown): ZellijAgentConfigInput {
  if (!Value.Check(ZellijAgentConfigSchema, input)) return {};
  return input;
}

/**
 * Loads global config first, then trusted project config. Project config must be
 * trust-gated because `.pi` content is repo-controlled code-adjacent input.
 */
export async function loadConfig(ctx: ExtensionContext): Promise<ZellijAgentConfig> {
  return {
    ...defaultConfig(),
    ...(await readConfigFile(join(getAgentDir(), "zellij-agent.json"))),
    ...(ctx.isProjectTrusted()
      ? await readConfigFile(join(ctx.cwd, CONFIG_DIR_NAME, "zellij-agent.json"))
      : {}),
  };
}

/**
 * Missing or malformed config should leave Pi startup alone; the status footer
 * can still expose runtime problems after the extension is active.
 */
async function readConfigFile(path: string): Promise<ZellijAgentConfigInput> {
  try {
    return parseConfig(JSON.parse(await readFile(path, "utf8")));
  } catch {
    // ponytail: missing or bad config should not break Pi startup.
    return {};
  }
}
