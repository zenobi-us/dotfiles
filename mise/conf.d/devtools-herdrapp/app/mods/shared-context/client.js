// Only bootstrap uses exec. Domain data comes from authenticated structured requests.
import { appHome, exec, readTextFile } from "herdr";
let starting;
async function connection() {
  async function read() {
    const text = await readTextFile(`${appHome()}/data/shared-context-bridge/connection.json`);
    if (!text) return null;
    const value = JSON.parse(text);
    if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(value.url) || !/^[a-f0-9]{64}$/.test(value.token)) throw new Error("The context service descriptor is invalid.");
    return value;
  }
  let value = await read();
  if (value) {
    try { if ((await fetch(`${value.url}/health`, { headers: { authorization: `Bearer ${value.token}` } })).ok) return value; }
    catch { /* The idle service stops after five minutes. Start it before the next operation. */ }
  }
  const runtime = JSON.parse(await readTextFile(`${appHome()}/mods/shared-context/.runtime.json`) ?? "{}");
  if (typeof runtime.binary !== "string" || !runtime.binary) throw new Error("Install the panel again to select its Bun runtime.");
  if (!starting) starting = exec(runtime.binary, [`${appHome()}/mods/shared-context/bridge.ts`, "--start", "--home", appHome()]).then(result => {
    if (result.code !== 0) throw new Error(result.stderr || "The context service did not start.");
  }).finally(() => { starting = null; });
  await starting;
  value = await read();
  if (!value) throw new Error("The context service has no connection descriptor.");
  return value;
}
export async function request(operation, cwd, fields = {}) {
  const { url, token } = await connection();
  const response = await fetch(`${url}/request`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ operation, cwd, ...fields }) });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error || `Context service returned HTTP ${response.status}.`);
  return result.data;
}
