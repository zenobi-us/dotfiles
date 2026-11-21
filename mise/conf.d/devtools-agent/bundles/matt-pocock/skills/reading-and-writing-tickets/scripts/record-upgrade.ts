// The shared writer owns locking and persistence; this adapter preserves record bytes.
import { execFileSync } from "node:child_process";
import { realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UpgradeOwner } from "../../../../agent-core/skills/skill-contracts/scripts/upgrades.ts";
import { INITIATIVE_LINKS_QUERY, INITIATIVE_SCHEMA, TICKET_SCHEMA, validateRecord, type RecordKind } from "./record-schema.ts";

const helper = fileURLToPath(new URL("./record-markdown.mq", import.meta.url));
const lockfile = fileURLToPath(new URL("../mq.lock", import.meta.url));
let mqBinary: string | undefined;
const sources: Record<string, RecordKind> = {
  "tracker-ticket/v1": "ticket", "tracker-ticket/v2": "ticket", "tracker-ticket-legacy/v1": "ticket",
  "tracker-initiative/v1": "initiative", "tracker-initiative/v2": "initiative", "tracker-initiative-legacy/v1": "initiative",
};
const procedure = "file:references/contracts/record-upgrade.md";

const owner: UpgradeOwner = {
  identify(content) {
    const fields = inspect(content);
    if (Object.hasOwn(fields, "schema") && Object.hasOwn(fields, "schemaVersion")) throw new Error("schema and schemaVersion cannot appear together.");
    const key = Object.hasOwn(fields, "schemaVersion") ? "schemaVersion" : Object.hasOwn(fields, "schema") ? "schema" : null;
    if (key === null) return null;
    if (typeof fields[key] !== "string" || !fields[key]) throw new Error("An explicit schema identifier must be a non-empty string.");
    return fields[key] as string;
  },
  detectLegacy(content) {
    const fields = inspect(content);
    if (Object.hasOwn(fields, "schema") || Object.hasOwn(fields, "schemaVersion")) return [];
    const candidates: string[] = [];
    if (validAs(fields, "ticket")) candidates.push("tracker-ticket-legacy/v1");
    if (fields.type === "Initiative" && validAs(fields, "initiative")) candidates.push("tracker-initiative-legacy/v1");
    return candidates;
  },
  validate(contract, content) {
    const kind = sources[contract];
    if (!kind) return false;
    const fields = inspect(content);
    const legacy = contract.endsWith("-legacy/v1");
    if (legacy) return !Object.hasOwn(fields, "schema") && !Object.hasOwn(fields, "schemaVersion") && validAs(fields, kind) && (kind === "ticket" || fields.type === "Initiative");
    const key = contract.endsWith("/v2") ? "schemaVersion" : "schema";
    return fields[key] === contract && validateRecord(fields, kind).length === 0;
  },
  preservation(contract, content) {
    // Raw bytes protect comments and numeric lexemes; membership also has versioned meaning.
    return { authored: withoutIdentifier(content), membership: sources[contract] === "initiative" ? membership(content, contract === "tracker-initiative-legacy/v1") : null };
  },
  async mutable(filename, content) {
    const canonical = await realpath(filename);
    if (path.extname(filename) !== ".md" || [filename, canonical].some(value => value.split(path.sep).some(segment => ["events", "reviews", "artifacts", ".git"].includes(segment)))) return false;
    const fields = inspect(content);
    if (fields.immutable === true) return false;
    const explicit = fields.schemaVersion ?? fields.schema;
    const kind = typeof explicit === "string" && sources[explicit] ? sources[explicit] : fields.type === "Initiative" ? "initiative" : "ticket";
    if (kind === "initiative" && path.basename(filename) !== "index.md") return false;
    const id = kind === "initiative" ? path.basename(path.dirname(filename)) : path.basename(filename, ".md");
    return fields.id === id;
  },
  destinations(operation) {
    if (operation !== "upgrade" && operation !== "update") throw new Error("Supported record operations are upgrade and update.");
    return [TICKET_SCHEMA, INITIATIVE_SCHEMA];
  },
  convert(reference, from, to, content) {
    const kind = sources[from];
    if (reference !== procedure || !kind || to !== (kind === "ticket" ? TICKET_SCHEMA : INITIATIVE_SCHEMA) || from === to) throw new Error("Undeclared tracker record conversion.");
    const clean = withoutIdentifier(content);
    const newline = clean.includes("\r\n") ? "\r\n" : "\n";
    return { content: clean.replace(/^---\r?\n/, `---${newline}schemaVersion: ${to}${newline}`), lossless: true, requiresDecision: false };
  },
  mutate(operation, contract, content, request) {
    if (operation !== "update" || !isObject(request) || Object.keys(request).length !== 1 || !isObject(request.fields)) throw new Error("update requires only a fields object.");
    const entries = Object.entries(request.fields);
    const allowed = contract === INITIATIVE_SCHEMA ? ["title"] : ["title", "work_status", "triage"];
    if (!entries.length || entries.some(([key, value]) => !allowed.includes(key) || typeof value !== "string" || !value.trim())) throw new Error("Initiatives accept title only. Tickets accept non-empty title, work_status or triage strings; structural changes need their owning operation.");
    let result = content;
    for (const [key, value] of entries) result = patchField(result, key, value as string);
    return result;
  },
};
export default owner;

function inspect(content: string): Record<string, unknown> {
  mqBinary ??= execFileSync("mise", ["which", "mq"], { encoding: "utf8" }).trim();
  const output = execFileSync(mqBinary, ["--allow-http-import", "--lockfile", lockfile, "-I", "raw", "-F", "json", "--argjson", "operation", '"inspect"', "--from-file", helper], { input: content, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(output).fields;
}
function membership(content: string, legacy: boolean): string[] {
  mqBinary ??= execFileSync("mise", ["which", "mq"], { encoding: "utf8" }).trim();
  const query = `import "github.com/harehare/okf.mq" | import "section" | let source = . | let parsed = okf::okf_parse(source) | let doc = {frontmatter: {schemaVersion: "tracker-initiative/v2"}, body: parsed["body"]} | ${legacy ? "okf::okf_extract_links(source)" : INITIATIVE_LINKS_QUERY}`;
  const output = execFileSync(mqBinary, ["--allow-http-import", "--lockfile", lockfile, "-I", "raw", "-F", "json", query], { input: content, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return (JSON.parse(output) as { url: string }[]).map(link => link.url);
}
function validAs(fields: Record<string, unknown>, kind: RecordKind): boolean {
  return validateRecord({ ...fields, schemaVersion: kind === "ticket" ? TICKET_SCHEMA : INITIATIVE_SCHEMA }, kind).length === 0;
}
function withoutIdentifier(content: string): string {
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(content);
  if (!match) throw new Error("A leading YAML frontmatter block is required.");
  const newline = match[1].includes("\r\n") ? "\r\n" : "\n";
  const lines = match[2].split(newline);
  const keys = lines.flatMap((line, index) => /^(?:schema|schemaVersion)\s*:/.test(line) ? [index] : []);
  const parsed = inspect(content);
  const explicit = Object.hasOwn(parsed, "schema") || Object.hasOwn(parsed, "schemaVersion");
  if (keys.length !== (explicit ? 1 : 0)) throw new Error("The identifier must use one plain, unique top-level YAML key.");
  if (!keys.length) return content;
  const index = keys[0];
  const line = lines[index];
  if (!/^(schema|schemaVersion):[ \t]+[a-z][a-z0-9-]*\/v[1-9][0-9]*(?:[ \t]+#.*)?[ \t]*$/.test(line)) throw new Error("The identifier must be a plain single-line contract string.");
  const comment = /[ \t]+(#.*)$/.exec(line)?.[1];
  lines.splice(index, 1, ...(comment ? [comment] : []));
  return match[1] + lines.join(newline) + match[3] + content.slice(match[0].length);
}
function patchField(content: string, key: string, value: string): string {
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(content)!;
  const newline = match[1].includes("\r\n") ? "\r\n" : "\n";
  const lines = match[2].split(newline);
  const indexes = lines.flatMap((line, index) => line.startsWith(`${key}:`) ? [index] : []);
  const fields = inspect(content);
  if (indexes.length !== (Object.hasOwn(fields, key) ? 1 : 0)) throw new Error("Changed fields must use unique plain YAML keys.");
  const replacement = `${key}: ${JSON.stringify(value)}`;
  if (!indexes.length) lines.push(replacement);
  else {
    const index = indexes[0];
    if (typeof fields[key] !== "string") throw new Error("The existing update field must contain a string.");
    const token = lines[index].slice(key.length + 1).trimStart();
    const pattern = token.startsWith('"') ? /^"(?:[^"\\]|\\.)*"(?:[ \t]+(#.*))?[ \t]*$/
      : token.startsWith("'") ? /^'(?:[^']|'')*'(?:[ \t]+(#.*))?[ \t]*$/ : /^(?![|>])[^\r\n]*?(?:[ \t]+(#.*))?[ \t]*$/;
    const scalar = pattern.exec(token);
    if (!scalar) throw new Error("This field needs a content-aware edit; automatic mutation is unsafe.");
    const comment = scalar[1];
    lines[index] = replacement + (comment ? ` ${comment}` : "");
  }
  const result = match[1] + lines.join(newline) + match[3] + content.slice(match[0].length);
  const after = inspect(result);
  const expected = { ...fields, [key]: value };
  if (JSON.stringify(after) !== JSON.stringify(expected)) throw new Error("The field edit changed unrelated record meaning.");
  return result;
}
function isObject(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === "object" && !Array.isArray(value); }
