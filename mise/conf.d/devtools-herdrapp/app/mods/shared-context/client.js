// Each request runs Bun directly; no listener or persistent connection state.
import { appHome, exec, readTextFile } from "herdr";

export async function request(operation, cwd, fields = {}) {
  const home = appHome();
  const runtime = JSON.parse(await readTextFile(`${home}/data/shared-context-runtime.json`) ?? "{}");
  if (typeof runtime.binary !== "string" || !runtime.binary) throw new Error("Run mise run herdrapp.runtime to select the panel's Bun runtime.");
  const output = await exec(runtime.binary, [
    `${home}/mods/shared-context/request.ts`,
    JSON.stringify({ ...fields, operation, cwd }),
    home,
  ], { cwd, timeout: 600000 });
  if (!output.stdout.trim()) throw new Error(output.stderr || `Context request exited with code ${output.code} without a response.`);
  const result = JSON.parse(output.stdout);
  if (output.code !== 0 || result.error) throw new Error(result.error || output.stderr || `Context request exited with code ${output.code}.`);
  return result.data;
}
