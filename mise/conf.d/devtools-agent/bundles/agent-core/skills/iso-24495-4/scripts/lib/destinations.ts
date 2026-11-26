// Check all requested destinations before any output is written. Selected
// source files must never become findings or report destinations through aliases.
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

export function checkDestinations(outputs: string[], inputs: string[]): void {
  const sources = new Set(inputs.map((path) => {
    const absolute = resolve(path);
    return existsSync(absolute) ? realpathSync(absolute) : absolute;
  }));
  const targets = new Set<string>();
  for (const output of outputs) {
    const absolute = resolve(output);
    const target = resolve(realpathSync(dirname(absolute)), basename(absolute));
    if (sources.has(target) || targets.has(target)) throw new Error("Output destinations must be distinct from consumed inputs and each other.");
    targets.add(target);
    if (target.split(/[\\/]/).some((part) => ["events", "snapshots", "receipts"].includes(part))) {
      throw new Error("Immutable history cannot be an output destination.");
    }
    try {
      const stat = lstatSync(target);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) {
        throw new Error("Output must be a regular, non-symlink, singly linked file.");
      }
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
}
