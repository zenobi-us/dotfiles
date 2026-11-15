// Only transport is replaced. Tests run the production read-cell implementation.
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

export function cancelled() { return Object.assign(new Error("Query cancelled"), { code: "CANCELLED" }); }

export async function client(runQuery, storage = new Map()) {
  const context = createContext({ console, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } });
  const transport = new SyntheticModule(["runQuery", "forgetTarget", "targetKey", "cancelled"], function() {
    this.setExport("runQuery", async (operation, where, fields, ...rest) => {
      const value = await runQuery(operation, where, fields, ...rest);
      if (["setup", "prepare", "validate", "discard-session"].includes(operation)) return value;
      const args = Object.fromEntries(Object.entries(fields).filter(([key]) => key !== "$cache").sort(([a], [b]) => a.localeCompare(b)));
      const identity = createHash("sha256").update(JSON.stringify([operation, where, args])).digest("hex");
      const version = createHash("sha256").update(JSON.stringify(value)).digest("hex");
      return { cache: { identity, version }, value };
    });
    this.setExport("forgetTarget", () => { });
    this.setExport("targetKey", where => JSON.stringify([where.machine ?? null, where.cwd]));
    this.setExport("cancelled", cancelled);
  }, { context });
  const data = new SourceTextModule(await readFile(new URL("../app/mods/shared-context/data.js", import.meta.url), "utf8"), { context });
  await data.link(() => transport); await data.evaluate();
  return data.namespace.createQueryClient();
}
