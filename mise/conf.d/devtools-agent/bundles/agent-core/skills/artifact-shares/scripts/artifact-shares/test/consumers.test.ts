// The owning CLI must upgrade frozen repositories without replacing authored code or weakening checks.
import { expect, test } from "bun:test";
import { cpSync, existsSync, lstatSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const cli = new URL("../cli.ts", import.meta.url).pathname;
const owner = new URL("../../../", import.meta.url).pathname;
const history = JSON.parse(readFileSync(path.join(owner, "assets/consumer-history.json"), "utf8"));
const repository = new URL("../../../../../../../../../../", import.meta.url).pathname;
const frozenTemplate = "mise/conf.d/devtools-agent/bundles/agent-core/skills/artifact-shares/assets/repo-template";

function snapshot(root: string): Record<string, string> {
  const files: Record<string, string> = {};
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else files[path.relative(root, file)] = lstatSync(file).isSymbolicLink() ? "SYMLINK" : readFileSync(file).toString("base64");
    }
  }
  walk(root);
  return files;
}

async function command(root: string, args: string[], cwd = root) {
  const child = Bun.spawn(args, { cwd, env: { ...process.env, ARTIFACT_SHARES_CONFIG: path.join(root, "config.json") }, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { stdout, stderr, exit };
}

function frozen(root: string): string {
  const clone = path.join(root, "private");
  const archive = Bun.spawnSync(["git", "archive", `${history.commit}:${frozenTemplate}`], { cwd: repository });
  expect(archive.exitCode, archive.stderr.toString()).toBe(0);
  // cpSync creates the destination without changing archived file modes.
  cpSync(path.join(owner, "assets/repo-template/content/shares"), clone, { recursive: true });
  const unpacked = Bun.spawnSync(["tar", "-xf", "-", "-C", clone], { stdin: archive.stdout });
  expect(unpacked.exitCode, unpacked.stderr.toString()).toBe(0);
  expect(Bun.spawnSync(["git", "init", "-q", clone]).exitCode).toBe(0);
  writeFileSync(path.join(root, "config.json"), JSON.stringify({ clone_root: root, shares: { private: { repo: "private/example", branch: "main", pages_url: null } } }));
  return clone;
}

test("explicit frozen-base upgrade preserves authored settings, registry, content and checks, then generated v2 passes publication checks", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "artifact-consumers-"));
  let stage: string | undefined;
  try {
    const clone = frozen(root);
    const kinds = path.join(clone, "src/components/kinds.ts");
    writeFileSync(kinds, readFileSync(kinds, "utf8").replace("  session: {", '  custom: { label: "Custom", description: "Authored kind", tone: "bg-info-bg text-info" },\n  session: {'));
    const press = path.join(clone, "press.config.tsx");
    writeFileSync(press, readFileSync(press, "utf8").replace('"Artifact shares"', '"Authored site"'));
    writeFileSync(path.join(clone, "content/index.mdx"), "---\ntitle: Authored home\n---\n\nKeep this page.\n");
    const original = snapshot(clone);
    const configBefore = readFileSync(path.join(root, "config.json"));
    const report = path.join(root, "report.html");
    writeFileSync(report, "<h1>Review 376</h1>\n");
    const blocked = await command(root, [cli, "share", "custom", report, "--dry-run"]);
    expect(blocked.exit).not.toBe(0);
    expect(blocked.stderr).toContain("explicit upgrade");
    const preview = await command(root, [cli, "upgrade", "private", "--dry-run"]);
    expect(preview.exit, preview.stderr).toBe(0);
    expect(JSON.parse(preview.stdout).changedFiles.sort()).toEqual([".mise/tasks/checks/types.ts", "press.config.tsx", "src/share-metadata.ts"]);
    expect(snapshot(clone)).toEqual(original);
    const upgraded = await command(root, [cli, "upgrade", "private", "--confirm", "private"]);
    expect(upgraded.exit, upgraded.stdout + upgraded.stderr).toBe(0);
    const after = snapshot(clone);
    for (const [file, bytes] of Object.entries(original)) {
      if ([".mise/tasks/checks/types.ts", "press.config.tsx"].includes(file)) continue;
      expect(after[file], file).toBe(bytes);
    }
    expect(readFileSync(press, "utf8")).toContain('"Authored site"');
    expect(readFileSync(path.join(root, "config.json"))).toEqual(configBefore);
    expect((await command(root, [cli, "upgrade", "private", "--confirm", "private"])).exit).toBe(0);
    expect(snapshot(clone)).toEqual(after);
    const generated = await command(root, [cli, "share", "custom", report, "--dry-run"]);
    expect(generated.exit, generated.stdout + generated.stderr).toBe(0);
    const start = generated.stdout.indexOf('{\n  "dryRun"');
    const result = JSON.parse(generated.stdout.slice(start, generated.stdout.indexOf("\n\nNothing was written", start)));
    stage = result.stage;
    const page = readFileSync(result.page, "utf8");
    expect(page).toContain('hash: "860951705127"');
    cpSync(path.join(stage!, "content"), path.join(clone, "content"), { recursive: true });
    cpSync(path.join(stage!, "public"), path.join(clone, "public"), { recursive: true });
    writeFileSync(path.join(clone, ".types"), "# Authored index\n860951705127=custom\n");
    const checked = await command(root, [cli, "check", "--into", "private"]);
    expect(checked.exit, checked.stdout + checked.stderr).toBe(0);
    const retrieved = await command(root, [cli, "share", "custom", report, "--dry-run"]);
    expect(retrieved.exit, retrieved.stderr).toBe(0);
    expect(JSON.parse(retrieved.stdout)).toMatchObject({ unchanged: true, dryRun: true, hash: "860951705127" });
    expect(readFileSync(path.join(clone, "content/shares/860951705127.mdx"), "utf8")).toBe(page);
  } finally {
    if (stage) rmSync(stage, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  }
}, 60_000);

test("ambiguous customized consumers and symlink targets refuse upgrades with exact byte stability", async () => {
  for (const customized of ["checker", "schema", "symlink"]) {
    const root = mkdtempSync(path.join(tmpdir(), "artifact-consumer-refusal-"));
    try {
      const clone = frozen(root);
      const check = path.join(clone, ".mise/tasks/checks/types.ts");
      if (customized === "checker") writeFileSync(check, readFileSync(check, "utf8") + '\nconsole.log("Authored check");\n');
      if (customized === "schema") {
        const press = path.join(clone, "press.config.tsx");
        writeFileSync(press, readFileSync(press, "utf8").replace("hash: z.string().optional()", "hash: z.string().min(12).optional()"));
      }
      const external = path.join(root, "external.ts");
      writeFileSync(external, "Authored external file\n");
      if (customized === "symlink") {
        rmSync(check);
        symlinkSync(external, check);
      }
      const before = snapshot(clone);
      const result = await command(root, [cli, "upgrade", "private", "--confirm", "private"]);
      expect(result.exit).not.toBe(0);
      expect(snapshot(clone)).toEqual(before);
      expect(readFileSync(external, "utf8")).toBe("Authored external file\n");
      expect(existsSync(path.join(clone, "src/share-metadata.ts"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
}, 60_000);

test("a required repository check failure restores every consumer and leaves authored invalid content unchanged", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "artifact-consumer-rollback-"));
  try {
    const clone = frozen(root);
    writeFileSync(path.join(clone, ".types"), "# Authored invalid entry\n860951705127=custom\n");
    const before = snapshot(clone);
    const result = await command(root, [cli, "upgrade", "private", "--confirm", "private"]);
    expect(result.exit).not.toBe(0);
    expect(result.stderr).toContain("types validation");
    expect(snapshot(clone)).toEqual(before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 60_000);

test("isolated installed history accepts only complete supported assets before preview or confirmed replacement", async () => {
  const legacy = structuredClone(history);
  delete legacy.schemaVersion;
  delete legacy.reviewed;
  const cases: [string, string, boolean][] = [
    ["current", JSON.stringify(history), true],
    ["unversioned", JSON.stringify(legacy), true],
    ["explicit historical", JSON.stringify({ ...legacy, schemaVersion: history.schemaVersion }), true],
    ["unknown identity", JSON.stringify({ ...history, schemaVersion: "artifact-share-consumer-history/v999" }), false],
    ["null identity", JSON.stringify({ ...history, schemaVersion: null }), false],
    ["malformed unversioned", JSON.stringify({ ...legacy, previous: { commit: legacy.previous.commit, files: {} } }), false],
    ["ambiguous identity fields", JSON.stringify({ ...history, schema: history.schemaVersion }), false],
    ["duplicate identity", JSON.stringify(history).replace("{", '{"schemaVersion":"artifact-share-consumer-history/v999",'), false],
    ["duplicate evidence", JSON.stringify(history).replace('".mise/tasks/checks/types.ts":', '".mise/tasks/checks/types.ts":"ambiguous",".mise/tasks/checks/types.ts":'), false],
    ["invalid JSON", "{", false],
    ["array", "[]", false],
    ["unknown field", JSON.stringify({ ...history, extra: true }), false],
  ];
  for (const field of ["sourceRepository", "commit", "files", "previous", "initial", "latest"]) {
    const missing = structuredClone(history);
    delete missing[field];
    cases.push([`missing ${field}`, JSON.stringify(missing), false]);
  }
  for (const field of ["previous", "initial", "latest", "reviewed"]) {
    for (const invalid of [{ commit: "abc", files: history[field].files }, { commit: history[field].commit, files: {} }, { ...history[field], files: { ...history[field].files, unexpected: "code" } }]) {
      cases.push([`malformed ${field}`, JSON.stringify({ ...history, [field]: invalid }), false]);
    }
  }
  cases.push(["non-string evidence", JSON.stringify({ ...history, files: { ...history.files, "press.config.tsx": 42 } }), false]);
  for (const [name, content, accepted] of cases) {
    const root = mkdtempSync(path.join(tmpdir(), "artifact-history-install-"));
    try {
      const installed = path.join(root, "skills/artifact-shares");
      cpSync(owner, installed, { recursive: true });
      cpSync(path.join(owner, "../skill-contracts"), path.join(root, "skills/skill-contracts"), { recursive: true });
      const installedCli = path.join(installed, "scripts/artifact-shares/cli.ts");
      const asset = path.join(installed, "assets/consumer-history.json");
      writeFileSync(asset, content);
      const clone = frozen(root);
      if (name === "current") {
        for (const [file, bytes] of Object.entries(history.reviewed.files)) writeFileSync(path.join(clone, file), bytes as string);
      }
      const before = snapshot(clone);
      const configBefore = readFileSync(path.join(root, "config.json"));
      for (const flags of [["--dry-run"], ["--confirm", "private"]]) {
        const result = await command(root, [installedCli, "upgrade", "private", ...flags]);
        if (accepted) {
          expect(result.exit, name + result.stdout + result.stderr).toBe(0);
          if (flags[0] === "--dry-run") expect(snapshot(clone)).toEqual(before);
          else {
            const after = snapshot(clone);
            for (const file of [".mise/tasks/checks/types.ts", "src/share-metadata.ts", "press.config.tsx"]) {
              expect(readFileSync(path.join(clone, file), "utf8"), name).toBe(readFileSync(path.join(installed, "assets/repo-template", file), "utf8"));
            }
            for (const [file, bytes] of Object.entries(before)) {
              if (![".mise/tasks/checks/types.ts", "src/share-metadata.ts", "press.config.tsx"].includes(file)) expect(after[file], name + file).toBe(bytes);
            }
          }
        } else {
          expect(result.exit, name + result.stdout + result.stderr).not.toBe(0);
          expect(snapshot(clone), name).toEqual(before);
        }
        expect(readFileSync(asset, "utf8")).toBe(content);
        expect(readFileSync(path.join(root, "config.json"))).toEqual(configBefore);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
}, 240_000);
