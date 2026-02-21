#!/usr/bin/env bun

export {};

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
}

interface NameMeta {
  type: string;
  hashId: string;
  title: string;
}

type FrontmatterValue = string | string[];
type FrontmatterMap = Record<string, FrontmatterValue>;

const SPECIAL_FILES = ["summary.md", "todo.md", "team.md", "constitution.md"];
const FLEXIBLE_PREFIX_FILES = ["knowledge-"];
const VALID_STATUSES = [
  "proposed",
  "planning",
  "todo",
  "in-progress",
  "completed",
  "archived",
];
const FILE_TYPES: Record<string, string[]> = {
  task: [
    "id",
    "type",
    "title",
    "created_at",
    "updated_at",
    "status",
    "epic_id",
    "phase_id",
    "assigned_to",
  ],
  phase: [
    "id",
    "type",
    "title",
    "created_at",
    "updated_at",
    "status",
    "epic_id",
    "start_criteria",
    "end_criteria",
  ],
  epic: ["id", "type", "title", "created_at", "updated_at", "status"],
  story: [
    "id",
    "type",
    "title",
    "created_at",
    "updated_at",
    "status",
    "epic_id",
    "priority",
  ],
  research: [
    "id",
    "type",
    "title",
    "created_at",
    "updated_at",
    "status",
    "epic_id",
  ],
  learning: [
    "id",
    "type",
    "title",
    "created_at",
    "updated_at",
    "status",
    "tags",
  ],
};

const FILE_NAME_PATTERN =
  /^(?<type>\w+)-(?<hashId>[a-z0-9]{8})-(?<title>.+)\.md$/;
const FRONTMATTER_BLOCK_PATTERN =
  /^(?<open>---\s*\n)(?<yaml>[\s\S]*?)(?<close>\n---)(?<rest>[\s\S]*)$/;

function getBaseName(filePath: string): string {
  const normalized = filePath.replaceAll("\\", "/");
  const pieces = normalized.split("/");
  return pieces[pieces.length - 1] || "";
}

function isSpecialFile(filename: string): boolean {
  return SPECIAL_FILES.includes(filename);
}

function isFlexiblePrefixFile(filename: string): boolean {
  let index = 0;
  while (index < FLEXIBLE_PREFIX_FILES.length) {
    const prefix = FLEXIBLE_PREFIX_FILES[index];
    if (filename.startsWith(prefix) && filename.endsWith(".md")) {
      return true;
    }
    index += 1;
  }
  return false;
}

function parseNameMeta(filename: string): NameMeta | null {
  const match = filename.match(FILE_NAME_PATTERN);
  if (!match || !match.groups) {
    return null;
  }

  const groups = match.groups;
  const meta: NameMeta = {
    type: groups.type,
    hashId: groups.hashId,
    title: groups.title,
  };

  return meta;
}

function parseSimpleYaml(yamlText: string): FrontmatterMap {
  const map: FrontmatterMap = {};
  const lines = yamlText.split("\n");
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      index += 1;
      continue;
    }

    const keyMatch = line.match(/^(?<key>[a-zA-Z0-9_\-]+):\s*(?<value>.*)$/);
    if (!keyMatch || !keyMatch.groups) {
      index += 1;
      continue;
    }

    const key = keyMatch.groups.key;
    const valueText = keyMatch.groups.value;

    if (valueText === "") {
      const listValues: string[] = [];
      let lookAhead = index + 1;

      while (lookAhead < lines.length) {
        const nextRaw = lines[lookAhead];
        const listMatch = nextRaw.match(/^\s*-\s*(?<item>.*)$/);
        if (!listMatch || !listMatch.groups) {
          break;
        }
        listValues.push(stripYamlQuotes(listMatch.groups.item.trim()));
        lookAhead += 1;
      }

      if (listValues.length > 0) {
        map[key] = listValues;
        index = lookAhead;
        continue;
      }

      map[key] = "";
      index += 1;
      continue;
    }

    map[key] = stripYamlQuotes(valueText.trim());
    index += 1;
  }

  return map;
}

function stripYamlQuotes(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, value.length - 1);
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, value.length - 1);
  }
  return value;
}

function extractFrontmatter(content: string): {
  map: FrontmatterMap | null;
  body: string;
  hadFrontmatter: boolean;
} {
  const match = content.match(FRONTMATTER_BLOCK_PATTERN);
  if (!match || !match.groups) {
    return { map: null, body: content, hadFrontmatter: false };
  }

  const yaml = match.groups.yaml;
  const rest = match.groups.rest;
  const parsed = parseSimpleYaml(yaml);
  return { map: parsed, body: rest, hadFrontmatter: true };
}

function toKebabWords(text: string): string {
  return text
    .replaceAll("_", "-")
    .replaceAll(" ", "-")
    .replaceAll(/[^a-zA-Z0-9\-]/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "")
    .toLowerCase();
}

function filenameValidation(filename: string): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isSpecialFile(filename) || isFlexiblePrefixFile(filename)) {
    return { errors, warnings };
  }

  const meta = parseNameMeta(filename);
  if (!meta) {
    errors.push(
      "Invalid filename format. Expected: <type>-<8_char_hashid>-<title>.md",
    );
    return { errors, warnings };
  }

  if (meta.hashId.length !== 8) {
    errors.push(
      `Hash ID must be exactly 8 characters, got: ${meta.hashId.length}`,
    );
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.title)) {
    warnings.push(`Title should be kebab-case: ${meta.title}`);
  }

  if (!FILE_TYPES[meta.type]) {
    errors.push(`Unsupported type: ${meta.type}`);
  }

  return { errors, warnings };
}

function frontmatterValidation(
  filename: string,
  frontmatter: FrontmatterMap | null,
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isSpecialFile(filename) || isFlexiblePrefixFile(filename)) {
    return { errors, warnings };
  }

  const meta = parseNameMeta(filename);
  if (!meta) {
    return { errors, warnings };
  }

  if (!frontmatter) {
    errors.push("Missing frontmatter");
    return { errors, warnings };
  }

  const required = FILE_TYPES[meta.type] || [];
  let requiredIndex = 0;
  while (requiredIndex < required.length) {
    const field = required[requiredIndex];
    if (frontmatter[field] === undefined) {
      errors.push(`Missing required frontmatter field: ${field}`);
    }
    requiredIndex += 1;
  }

  const statusValue = frontmatter.status;
  if (
    typeof statusValue === "string" &&
    statusValue.length > 0 &&
    !VALID_STATUSES.includes(statusValue)
  ) {
    warnings.push(
      `Invalid status value: ${statusValue}. Expected one of: ${VALID_STATUSES.join(", ")}`,
    );
  }

  const idValue = frontmatter.id;
  if (typeof idValue === "string" && idValue !== meta.hashId) {
    errors.push(
      `Frontmatter ID (${idValue}) doesn't match filename hash (${meta.hashId})`,
    );
  }

  const typeValue = frontmatter.type;
  if (typeof typeValue === "string" && typeValue !== meta.type) {
    errors.push(
      `Frontmatter type (${typeValue}) doesn't match filename type (${meta.type})`,
    );
  }

  return { errors, warnings };
}

function defaultValueForField(field: string, meta: NameMeta): FrontmatterValue {
  if (field === "id") {
    return meta.hashId;
  }
  if (field === "type") {
    return meta.type;
  }
  if (field === "title") {
    return toKebabWords(meta.title);
  }
  if (field === "created_at" || field === "updated_at") {
    return new Date().toISOString();
  }
  if (field === "status") {
    return "todo";
  }
  if (field === "priority") {
    return "medium";
  }
  if (field === "tags") {
    return [];
  }
  return "";
}

function repairFrontmatter(
  filename: string,
  frontmatter: FrontmatterMap | null,
): { repaired: FrontmatterMap | null; changed: boolean } {
  if (isSpecialFile(filename) || isFlexiblePrefixFile(filename)) {
    return { repaired: frontmatter, changed: false };
  }

  const meta = parseNameMeta(filename);
  if (!meta) {
    return { repaired: frontmatter, changed: false };
  }

  const next: FrontmatterMap = frontmatter ? { ...frontmatter } : {};
  let changed = false;

  if (next.type !== meta.type) {
    next.type = meta.type;
    changed = true;
  }

  if (next.id !== meta.hashId) {
    next.id = meta.hashId;
    changed = true;
  }

  const required = FILE_TYPES[meta.type] || [];
  let index = 0;
  while (index < required.length) {
    const field = required[index];
    if (next[field] === undefined) {
      next[field] = defaultValueForField(field, meta);
      changed = true;
    }
    index += 1;
  }

  if (
    typeof next.status === "string" &&
    !VALID_STATUSES.includes(next.status)
  ) {
    next.status = "todo";
    changed = true;
  }

  return { repaired: next, changed };
}

function serializeFrontmatter(map: FrontmatterMap): string {
  const lines: string[] = [];
  const knownOrder = [
    "id",
    "type",
    "title",
    "created_at",
    "updated_at",
    "status",
    "epic_id",
    "phase_id",
    "story_id",
    "assigned_to",
    "start_criteria",
    "end_criteria",
    "priority",
    "tags",
    "related_task_id",
    "area",
    "learned_from",
  ];

  let orderIndex = 0;
  while (orderIndex < knownOrder.length) {
    const key = knownOrder[orderIndex];
    if (map[key] !== undefined) {
      pushYamlLine(lines, key, map[key]);
    }
    orderIndex += 1;
  }

  const extraKeys = Object.keys(map).filter(function (key) {
    return !knownOrder.includes(key);
  });
  extraKeys.sort();

  let extraIndex = 0;
  while (extraIndex < extraKeys.length) {
    const extraKey = extraKeys[extraIndex];
    pushYamlLine(lines, extraKey, map[extraKey]);
    extraIndex += 1;
  }

  return `---\n${lines.join("\n")}\n---`;
}

function pushYamlLine(
  lines: string[],
  key: string,
  value: FrontmatterValue,
): void {
  if (Array.isArray(value)) {
    lines.push(`${key}:`);
    let idx = 0;
    while (idx < value.length) {
      lines.push(`  - ${value[idx]}`);
      idx += 1;
    }
    return;
  }

  const needsQuote =
    value.includes(":") ||
    value.includes("#") ||
    value.includes('"') ||
    value.trim() !== value;
  if (needsQuote) {
    const escaped = value.replaceAll('"', '\\"');
    lines.push(`${key}: "${escaped}"`);
    return;
  }

  lines.push(`${key}: ${value}`);
}

async function validateOneFile(filePath: string): Promise<ValidationResult> {
  const result: ValidationResult = { file: filePath, errors: [], warnings: [] };
  const filename = getBaseName(filePath);

  const fileChecks = filenameValidation(filename);
  result.errors.push(...fileChecks.errors);
  result.warnings.push(...fileChecks.warnings);

  try {
    const content = await Bun.file(filePath).text();
    const extraction = extractFrontmatter(content);
    const frontmatterChecks = frontmatterValidation(filename, extraction.map);
    result.errors.push(...frontmatterChecks.errors);
    result.warnings.push(...frontmatterChecks.warnings);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.errors.push(`Failed to read file: ${message}`);
  }

  return result;
}

async function repairOneFile(filePath: string): Promise<{
  file: string;
  changed: boolean;
  skipped: boolean;
  reason?: string;
}> {
  const filename = getBaseName(filePath);

  if (isSpecialFile(filename) || isFlexiblePrefixFile(filename)) {
    return {
      file: filePath,
      changed: false,
      skipped: true,
      reason: "special-or-flexible-file",
    };
  }

  const meta = parseNameMeta(filename);
  if (!meta || !FILE_TYPES[meta.type]) {
    return {
      file: filePath,
      changed: false,
      skipped: true,
      reason: "unrecognized-filename-pattern",
    };
  }

  const content = await Bun.file(filePath).text();
  const extraction = extractFrontmatter(content);
  const repairedResult = repairFrontmatter(filename, extraction.map);

  if (!repairedResult.repaired) {
    return {
      file: filePath,
      changed: false,
      skipped: true,
      reason: "unable-to-repair",
    };
  }

  const newFrontmatter = serializeFrontmatter(repairedResult.repaired);
  const body = extraction.hadFrontmatter ? extraction.body : `\n${content}`;
  const nextContent = `${newFrontmatter}${body}`;

  if (!repairedResult.changed && content === nextContent) {
    return { file: filePath, changed: false, skipped: false };
  }

  await Bun.write(filePath, nextContent);
  return { file: filePath, changed: true, skipped: false };
}

function printValidation(results: ValidationResult[]): number {
  let hasErrors = false;
  let hasWarnings = false;

  let index = 0;
  while (index < results.length) {
    const result = results[index];

    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log(`✅ ${result.file}`);
      index += 1;
      continue;
    }

    if (result.errors.length > 0) {
      hasErrors = true;
      console.log(`❌ ${result.file}`);
      let errorIndex = 0;
      while (errorIndex < result.errors.length) {
        console.log(`   ERROR: ${result.errors[errorIndex]}`);
        errorIndex += 1;
      }
    }

    if (result.warnings.length > 0) {
      hasWarnings = true;
      if (result.errors.length === 0) {
        console.log(`⚠️  ${result.file}`);
      }
      let warningIndex = 0;
      while (warningIndex < result.warnings.length) {
        console.log(`   WARNING: ${result.warnings[warningIndex]}`);
        warningIndex += 1;
      }
    }

    index += 1;
  }

  if (hasErrors) {
    console.log("\n❌ Validation failed with errors");
    return 1;
  }

  if (hasWarnings) {
    console.log("\n⚠️  Validation completed with warnings only");
    return 0;
  }

  console.log("\n✅ Validation passed");
  return 0;
}

function printRepair(
  reports: {
    file: string;
    changed: boolean;
    skipped: boolean;
    reason?: string;
  }[],
): number {
  let index = 0;
  let changedCount = 0;

  while (index < reports.length) {
    const report = reports[index];
    if (report.skipped) {
      console.log(`⏭️  ${report.file} (${report.reason})`);
      index += 1;
      continue;
    }

    if (report.changed) {
      changedCount += 1;
      console.log(`🛠️  repaired ${report.file}`);
    } else {
      console.log(`✅ no changes ${report.file}`);
    }

    index += 1;
  }

  console.log(`\nDone. Repaired ${changedCount} file(s).`);
  return 0;
}

function usage(): void {
  console.log("Usage:");
  console.log("  schema validate file <file> [...files]");
  console.log("  schema repair file <file> [...files]");
  console.log("");
  console.log("Examples:");
  console.log(
    "  bun run scripts/schema.ts validate file .memory/task-1234abcd-ship-it.md",
  );
  console.log(
    "  bun run scripts/schema.ts repair file .memory/task-1234abcd-ship-it.md .memory/phase-deadbeef-plan.md",
  );
}

async function runValidate(...files: string[]): Promise<number> {
  const results: ValidationResult[] = [];
  let index = 0;
  while (index < files.length) {
    const filePath = files[index];
    const result = await validateOneFile(filePath);
    results.push(result);
    index += 1;
  }
  return printValidation(results);
}

async function runRepair(...files: string[]): Promise<number> {
  const reports: {
    file: string;
    changed: boolean;
    skipped: boolean;
    reason?: string;
  }[] = [];
  let index = 0;
  while (index < files.length) {
    const filePath = files[index];
    try {
      const report = await repairOneFile(filePath);
      reports.push(report);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reports.push({
        file: filePath,
        changed: false,
        skipped: true,
        reason: `error: ${message}`,
      });
    }
    index += 1;
  }
  return printRepair(reports);
}

async function routeCli(args: string[]): Promise<number> {
  if (args.length === 0) {
    usage();
    return 1;
  }
  const [cmd, ...rest] = args;

  switch (cmd) {
    case "validate": {
      return runValidate(...rest);
    }
    case "repair": {
      return runRepair(...rest);
    }
    default: {
      console.log(`Unknown command: ${cmd}`);
      usage();
      return 1;
    }
  }
}

const exitCode = await routeCli(Bun.argv.slice(2));
process.exit(exitCode);
