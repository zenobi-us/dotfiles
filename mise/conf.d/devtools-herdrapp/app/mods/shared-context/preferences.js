// Better Config writes only user changes under mod.json.settings.
import { appHome, readTextFile } from "herdr";
export const DEFAULTS = { layout: "C", motion: true, harness: "omp" };
// Keep in step with the muxer-subagents agent modules and mod.schema.json.
const HARNESSES = ["omp", "pi", "zot", "codex", "claude"];
export async function loadPreferences() {
  const raw = await readTextFile(`${appHome()}/mods/shared-context/mod.json`);
  const value = JSON.parse(raw ?? "{}").settings ?? {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Shared Context settings must be an object.");
  for (const key of Object.keys(value)) if (!(key in DEFAULTS)) throw new Error(`Unknown Shared Context setting: ${key}.`);
  if (value.layout !== undefined && !["C", "C2"].includes(value.layout)) throw new Error("Tracker layout must be C or C2.");
  if (value.motion !== undefined && typeof value.motion !== "boolean") throw new Error("Drawer motion must be true or false.");
  if (value.harness !== undefined && !HARNESSES.includes(value.harness)) throw new Error(`Agent harness must be one of ${HARNESSES.join(", ")}.`);
  return { ...DEFAULTS, ...value };
}
