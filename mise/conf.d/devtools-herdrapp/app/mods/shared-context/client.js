// Each request runs Bun directly; no listener or persistent connection state.
// A remote space's requests run on its machine, with that machine's app home and runtime.
import { appHome, exec, readTextFile } from "herdr";

// Herdr-app's own lookup: HERDR_APP_HOME, then XDG_CONFIG_HOME, then ~/.config.
const REMOTE_HOME = 'printf %s "${HERDR_APP_HOME:-${XDG_CONFIG_HOME:-$HOME/.config}/herdr-app}"';
const remoteHomes = new Map();

function homeOn(machine) {
  if (!machine) return Promise.resolve(appHome());
  if (!remoteHomes.has(machine)) {
    const lookup = exec("sh", ["-c", REMOTE_HOME], { on: machine }).then(output => {
      if (output.code !== 0 || !output.stdout.trim()) throw new Error(output.stderr || `Could not find the Herdr-app folder on ${machine}.`);
      return output.stdout.trim();
    });
    // Forget a failed lookup so the next request retries after the machine comes back.
    remoteHomes.set(machine, lookup.catch(error => { remoteHomes.delete(machine); throw error; }));
  }
  return remoteHomes.get(machine);
}

/** @param {{ cwd: string, machine?: string | null }} where */
export async function request(operation, where, fields = {}) {
  const on = where.machine ?? null, home = await homeOn(on);
  const runtime = JSON.parse(await readTextFile(`${home}/data/shared-context-runtime.json`, { on }) ?? "{}");
  if (typeof runtime.binary !== "string" || !runtime.binary) throw new Error(`Run mise run herdrapp.runtime${on ? ` on ${on}` : ""} to select the panel's Bun runtime.`);
  const output = await exec(runtime.binary, [
    `${home}/mods/shared-context/request.ts`,
    JSON.stringify({ ...fields, operation, cwd: where.cwd }),
    home,
  ], { cwd: where.cwd, on, timeout: 600000 });
  if (!output.stdout.trim()) throw new Error(output.stderr || `Context request exited with code ${output.code} without a response.`);
  const result = JSON.parse(output.stdout);
  if (output.code !== 0 || result.error) throw new Error(result.error || output.stderr || `Context request exited with code ${output.code}.`);
  return result.data;
}
