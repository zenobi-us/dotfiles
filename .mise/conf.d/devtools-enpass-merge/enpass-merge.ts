#!/usr/bin/env bun

/**
 * Merge two Enpass JSON exports without overwriting newer item data.
 *
 * The merger keeps the shape of export A, uses UUIDs when available, and
 * falls back to a normalized title/category key for exports without UUIDs.
 */

type JsonObject = Record<string, unknown>;

export type MergeDecision = {
  key: string;
  title: string;
  action: "added" | "kept-a" | "kept-b" | "identical";
  reason: "only-in-a" | "only-in-b" | "a-newer" | "b-newer" | "same" | "undated-a-wins";
  aDate?: string;
  bDate?: string;
};

export type MergeResult = {
  output: JsonObject | unknown[];
  decisions: MergeDecision[];
  itemCount: number;
};

const ITEM_KEYS = ["items", "entries", "passwords", "records"] as const;
const ID_KEYS = ["uuid", "id", "uid", "itemUuid"] as const;
const DATE_KEYS = [
  "updatedAt",
  "updated_at",
  "modifiedAt",
  "modified_at",
  "lastModified",
  "last_modified",
  "dateModified",
  "date_modified",
  "updated",
  "modified",
] as const;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function itemList(document: unknown): { items: JsonObject[]; key?: string } {
  if (Array.isArray(document)) {
    if (!document.every(isObject)) throw new Error("The JSON array must contain objects.");
    return { items: document };
  }
  if (!isObject(document)) throw new Error("The export must be a JSON object or an array.");

  for (const key of ITEM_KEYS) {
    if (Array.isArray(document[key])) {
      if (!document[key].every(isObject)) throw new Error(`The ${key} array must contain objects.`);
      return { items: document[key] as JsonObject[], key };
    }
  }
  throw new Error(`Could not find an item array. Expected one of: ${ITEM_KEYS.join(", ")}.`);
}

function scalar(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function identity(item: JsonObject, index: number): string {
  for (const key of ID_KEYS) {
    const value = scalar(item[key]);
    if (value?.trim()) return `${key}:${value.trim()}`;
  }

  const title = scalar(item.title)?.trim().toLocaleLowerCase() ?? "";
  const category = scalar(item.category)?.trim().toLocaleLowerCase() ?? "";
  const template = scalar(item.templateUuid)?.trim().toLocaleLowerCase() ?? "";
  if (title || category || template) return `fallback:${title}\u0000${category}\u0000${template}`;
  return `anonymous:${index}`;
}

function title(item: JsonObject): string {
  return scalar(item.title) ?? scalar(item.name) ?? "(untitled)";
}

function dateValue(item: JsonObject): { raw?: string; time?: number } {
  const timestamps = isObject(item.timestamps) ? item.timestamps : undefined;
  const values = [
    ...DATE_KEYS.map((key) => item[key]),
    ...(timestamps ? DATE_KEYS.map((key) => timestamps[key]) : []),
  ];
  for (const value of values) {
    const raw = scalar(value);
    if (!raw) continue;
    const time = typeof value === "number" ? value : Date.parse(raw);
    if (!Number.isNaN(time)) return { raw, time };
  }
  return {};
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function mergeExports(aDocument: unknown, bDocument: unknown): MergeResult {
  const aList = itemList(aDocument);
  const bList = itemList(bDocument);
  const bByKey = new Map(bList.items.map((item, index) => [identity(item, index), item]));
  const used = new Set<string>();
  const decisions: MergeDecision[] = [];
  const merged: JsonObject[] = [];

  for (const [index, aItem] of aList.items.entries()) {
    const key = identity(aItem, index);
    const bItem = bByKey.get(key);
    if (!bItem) {
      merged.push(aItem);
      decisions.push({ key, title: title(aItem), action: "kept-a", reason: "only-in-a" });
      continue;
    }

    used.add(key);
    if (sameJson(aItem, bItem)) {
      merged.push(aItem);
      decisions.push({ key, title: title(aItem), action: "identical", reason: "same" });
      continue;
    }

    const aDate = dateValue(aItem);
    const bDate = dateValue(bItem);
    const bWins = aDate.time !== undefined && bDate.time !== undefined && bDate.time > aDate.time;
    const winner = bWins ? bItem : aItem;
    merged.push(winner);
    decisions.push({
      key,
      title: title(winner),
      action: bWins ? "kept-b" : "kept-a",
      reason: bWins ? "b-newer" : aDate.time === undefined || bDate.time === undefined ? "undated-a-wins" : "a-newer",
      aDate: aDate.raw,
      bDate: bDate.raw,
    });
  }

  for (const [index, bItem] of bList.items.entries()) {
    const key = identity(bItem, index);
    if (used.has(key) || aList.items.some((item, aIndex) => identity(item, aIndex) === key)) continue;
    merged.push(bItem);
    decisions.push({ key, title: title(bItem), action: "added", reason: "only-in-b" });
  }

  if (Array.isArray(aDocument)) return { output: merged, decisions, itemCount: merged.length };
  const output = { ...(aDocument as JsonObject) };
  output[aList.key ?? "items"] = merged;
  return { output, decisions, itemCount: merged.length };
}

function usage(): string {
  return `Usage: enpass-merge A.json B.json [-o C.json] [--report report.json]\n\nMerge Enpass exports. For matching items, the item with the latest update date wins.\nItems found only in either input are kept. A is used when dates are missing or equal.\n`;
}

function argumentValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

export async function main(args = process.argv.slice(2)): Promise<number> {
  if (args.includes("-h") || args.includes("--help")) {
    console.log(usage());
    return 0;
  }
  const positional = args.filter((arg, index) => !arg.startsWith("-") && args[index - 1] !== "-o" && args[index - 1] !== "--report");
  if (positional.length !== 2 || (args.includes("-o") && !argumentValue(args, "-o")) || (args.includes("--report") && !argumentValue(args, "--report"))) {
    console.error(usage());
    return 2;
  }

  try {
    const [aPath, bPath] = positional;
    const [aText, bText] = await Promise.all([Bun.file(aPath).text(), Bun.file(bPath).text()]);
    const result = mergeExports(JSON.parse(aText), JSON.parse(bText));
    const output = JSON.stringify(result.output, null, 2) + "\n";
    const outputPath = argumentValue(args, "-o");
    if (outputPath) await Bun.write(outputPath, output);
    else process.stdout.write(output);

    const reportPath = argumentValue(args, "--report");
    if (reportPath) await Bun.write(reportPath, JSON.stringify({ itemCount: result.itemCount, decisions: result.decisions }, null, 2) + "\n");
    const counts = result.decisions.reduce<Record<string, number>>((all, decision) => {
      all[decision.action] = (all[decision.action] ?? 0) + 1;
      return all;
    }, {});
    console.error(`Merged ${result.itemCount} items (${Object.entries(counts).map(([key, count]) => `${count} ${key}`).join(", ")}).`);
    return 0;
  } catch (error) {
    console.error(`enpass-merge: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (import.meta.main) process.exit(await main());
