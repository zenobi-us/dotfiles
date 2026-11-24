// Explicit source upgrades for repository-owned metadata consumers. Never changes publications or settings.
import { existsSync, lstatSync, readFileSync } from "node:fs";
import path from "node:path";
import { fail } from "./lib";
import Ajv from "ajv@^8.17.1";
import historySchema from "../../references/contracts/consumer-history-v1.json";
import { parseConfig } from "./config-owner";

type Snapshot = { commit: string; files: Record<string, string> };
type ConsumerHistory = Snapshot & {
  schemaVersion: "artifact-share-consumer-history/v1";
  sourceRepository: string;
  previous: Snapshot;
  initial: Snapshot;
  latest: Snapshot;
  reviewed?: Snapshot;
};
const validateHistory = new Ajv({ strict: false }).compile<ConsumerHistory>(historySchema);

function readHistory(file: string): ConsumerHistory {
  const value = parseConfig(readFileSync(file, "utf8"));
  if (Object.hasOwn(value, "schemaVersion") && value.schemaVersion !== historySchema.title) {
    throw new Error("Unsupported explicit consumer history contract.");
  }
  // Exactly one complete historical shape is accepted; interpretation never rewrites the asset.
  const interpreted = Object.hasOwn(value, "schemaVersion") ? value : { ...value, schemaVersion: historySchema.title };
  if (!validateHistory(interpreted)) throw new Error(`Invalid consumer history: ${JSON.stringify(validateHistory.errors)}`);
  return interpreted;
}

export type ConsumerChange = { file: string; before: string | null; after: string };

/** Plan all replacements before writing. Unknown owned code and symlinks require manual review. */
export function planConsumerUpgrade(clone: string, skillRoot: string): ConsumerChange[] {
  const template = path.join(skillRoot, "assets/repo-template");
  const history = readHistory(path.join(skillRoot, "assets/consumer-history.json"));
  const changes: ConsumerChange[] = [];
  for (const file of [".mise/tasks/checks/types.ts", "src/share-metadata.ts", "press.config.tsx"]) {
    assertRegularPath(clone, file);
    const target = path.join(clone, file);
    const before = existsSync(target) ? readFileSync(target, "utf8") : null;
    const current = readFileSync(path.join(template, file), "utf8");
    let after = current;
    if (file === "press.config.tsx") {
      if (before === null) fail("Missing press.config.tsx; consumer upgrade requires manual review.");
      after = upgradePress(before, current, [history.files[file]!, history.previous.files[file]!, ...(history.reviewed ? [history.reviewed.files[file]!] : [])]);
    } else if (before !== current) {
      const known = [history.files[file], history.previous.files[file], history.initial.files[file], history.latest.files[file], history.reviewed?.files[file]].filter((value) => value !== undefined);
      if (!(before === null && file === "src/share-metadata.ts") && !known.includes(before!)) {
        fail(`Customized or missing ${file}; consumer upgrade requires manual review. No files were changed.`);
      }
    }
    if (before !== after) changes.push({ file, before, after });
  }
  return changes;
}

function assertRegularPath(clone: string, file: string): void {
  let current = clone;
  for (const part of ["", ...file.split("/")]) {
    if (part) current = path.join(current, part);
    try {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink() || (!stat.isDirectory() && current !== path.join(clone, file)) || (current === path.join(clone, file) && !stat.isFile())) {
        fail(`Unsafe consumer path ${file}; no files were changed.`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

function consumerBlock(source: string): string {
  const start = source.indexOf("const shareSchema = pageSchema.extend({");
  const end = source.indexOf("\n\nexport default defineConfig(", start);
  if (start < 0 || end < 0 || source.indexOf("const shareSchema", start + 1) !== -1 || source.indexOf("const docs =", source.indexOf("const docs =") + 1) !== -1) {
    fail("Ambiguous press.config.tsx metadata consumers; no files were changed.");
  }
  return source.slice(start, end);
}

function upgradePress(before: string, current: string, historical: string[]): string {
  const block = consumerBlock(before);
  const destination = consumerBlock(current);
  const importLine = 'import { interpretShareMetadata } from "./src/share-metadata";';
  const oldImport = 'import { interpretShareHash } from "./src/share-metadata";';
  if (block === destination && before.split(importLine).length === 2) return before;
  if (!historical.some((source) => consumerBlock(source) === block && before.includes(oldImport) === source.includes(oldImport))) {
    fail("Customized press.config.tsx metadata consumer; consumer upgrade requires manual review. No files were changed.");
  }
  if (before.includes(oldImport)) {
    if (before.split(oldImport).length !== 2) fail("Ambiguous share metadata import; no files were changed.");
    return before.replace(block, destination).replace(oldImport, importLine);
  }
  if (before.includes('"./src/share-metadata"')) fail("Customized share metadata import; no files were changed.");
  const anchor = 'import { mdxComponents } from "./src/components/registry";';
  if (before.split(anchor).length !== 2) fail("Customized press.config.tsx component import; no files were changed.");
  // Only the owned schema/docs block and its import change. Site settings and registries stay byte-identical.
  return before.replace(block, destination).replace(anchor, `${anchor}\n${importLine}`);
}
