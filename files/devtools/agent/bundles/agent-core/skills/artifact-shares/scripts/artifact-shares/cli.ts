#!/usr/bin/env -S mise exec -- bun run --install=fallback

/*!
 * artifact-shares — private artifact sites on GitHub Pages.
 *
 *   create <name>          make a new private share repository
 *   share <kind> <path>    publish one artifact into a share repository
 *   list                   list the share repositories this machine knows
 *   sync <name>            bring a clone up to date with its remote
 *
 * Read-only extras: doctor, check, self-test, --help.
 *
 * `create`, `share`, and `sync` change remote state. Run them only when the
 * user names the operation.
 */

import { existsSync, mkdirSync, readFileSync, cpSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";

import {
  CliError,
  appendType,
  assertShareName,
  commitAndPush,
  copyTemplate,
  fail,
  hashPath,
  readKinds,
  readTypes,
  repoParts,
  requireCommand,
  run,
  slugify,
  today,
  walkFiles,
  yamlString,
} from "./lib";
import { convertHtmlToMdx, frontmatterValue, isRemote, splitFrontmatter } from "./html";
import {
  CONFIG_FILE,
  clonePathFor,
  loadConfig,
  saveConfig,
  type ArtifactSharesConfig,
} from "./config";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, "..", "..");
const templateDir = path.join(skillRoot, "assets", "repo-template");

const app = new Crust("artifact-shares").meta({
  description: "Publish artifacts to private GitHub Pages sites built with Fumapress",
});

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------

function requireGithub(): void {
  requireCommand("gh");
  requireCommand("git");
  run("gh", ["auth", "status"]);
}

function sshUrlFor(repo: string): string {
  const result = run("gh", ["repo", "view", repo, "--json", "sshUrl", "--jq", ".sshUrl"], {
    allowFailure: true,
  });
  return result.ok && result.stdout ? result.stdout : `git@github.com:${repo}.git`;
}

function pagesUrlFor(repo: string): string {
  const result = run("gh", ["api", `repos/${repo}/pages`, "--jq", ".html_url"], {
    allowFailure: true,
  });
  if (result.ok && result.stdout) return `${result.stdout.replace(/\/$/, "")}/`;

  const { owner, name } = repoParts(repo);
  return `https://${owner}.github.io/${name}/`;
}

/** Resolve the share the command acts on. One configured share is the default;
 *  two or more make `--into` compulsory, because guessing would publish to the
 *  wrong site. */
function resolveShare(
  config: ArtifactSharesConfig,
  name: string | undefined,
): { name: string; clone: string; repo: string; branch: string; pagesUrl: string } {
  const names = Object.keys(config.shares);
  if (names.length === 0) fail(`No shares configured. Run: artifact-shares create <name>`);

  const chosen = name ?? (names.length === 1 ? names[0]! : undefined);
  if (!chosen) {
    fail(`Several shares are configured. Name one with --into: ${names.join(", ")}`);
  }

  const entry = config.shares[chosen];
  if (!entry) fail(`Unknown share: ${chosen}. Configured: ${names.join(", ")}`);

  return {
    name: chosen,
    clone: clonePathFor(config, chosen),
    repo: entry.repo,
    branch: entry.branch,
    pagesUrl: entry.pages_url,
  };
}

/** Make sure the clone exists and matches its remote. Every mutating command
 *  starts here, so a share never lands on a stale tree. */
function ensureClone(clone: string, repo: string, branch: string): void {
  if (!existsSync(clone)) {
    mkdirSync(path.dirname(clone), { recursive: true });
    run("gh", ["repo", "clone", repo, clone, "--", "--branch", branch]);
    return;
  }
  run("git", ["fetch", "origin", branch], { cwd: clone });
  run("git", ["pull", "--ff-only"], { cwd: clone });
}

function countShares(clone: string): number {
  return existsSync(clone) ? readTypes(clone).size : 0;
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

async function create(name: string, options: { owner?: string }): Promise<void> {
  assertShareName(name);
  requireGithub();

  const config = await loadConfig();
  if (config.shares[name]) fail(`${name} is already configured in ${CONFIG_FILE}`);

  const owner = options.owner ?? run("gh", ["api", "user", "--jq", ".login"]).stdout;
  if (!owner) fail("Could not read the GitHub login. Pass --owner.");
  const repo = `${owner}/${name}`;

  const exists = run("gh", ["repo", "view", repo, "--json", "name"], { allowFailure: true }).ok;
  if (exists) fail(`${repo} already exists. Use sync to adopt it, or pick another name.`);

  const clone = clonePathFor(config, name);
  if (existsSync(clone)) fail(`${clone} already exists. Move it aside first.`);

  run("gh", ["repo", "create", repo, "--private"]);

  copyTemplate(templateDir, clone);
  // package.json ships under the template name. The repository name is the
  // better one, and nothing reads it but a person.
  const packageFile = path.join(clone, "package.json");
  const manifest = JSON.parse(readFileSync(packageFile, "utf8")) as { name: string };
  manifest.name = name;
  writeFileSync(packageFile, `${JSON.stringify(manifest, null, 2)}\n`);

  run("git", ["init", "-b", "main"], { cwd: clone });
  run("git", ["remote", "add", "origin", sshUrlFor(repo)], { cwd: clone });
  run("git", ["add", "."], { cwd: clone });
  run("git", ["commit", "-m", "create artifact share site"], { cwd: clone });
  run("git", ["push", "-u", "origin", "main"], { cwd: clone });

  // GitHub Pages builds from the workflow, not from a branch, so nothing is
  // served until `deploy.yml` finishes its first run.
  const body = JSON.stringify({ build_type: "workflow" });
  const created = run("gh", ["api", `repos/${repo}/pages`, "--method", "POST", "--input", "-"], {
    input: body,
    allowFailure: true,
  });
  if (!created.ok) {
    run("gh", ["api", `repos/${repo}/pages`, "--method", "PUT", "--input", "-"], {
      input: body,
      allowFailure: true,
    });
  }

  const pagesUrl = pagesUrlFor(repo);
  config.shares[name] = { repo, branch: "main", pages_url: pagesUrl };
  await saveConfig(config);

  console.log(JSON.stringify({ name, repo, clone, pagesUrl, branch: "main" }, null, 2));
  console.log("");
  console.log("The site is empty until the deploy workflow finishes its first run:");
  console.log(`  gh run watch --repo ${repo}`);
  console.log("");
  console.log("A private repository serves Pages publicly unless the account has");
  console.log("Pages access control. Check who can read the site before you share.");
}

// ---------------------------------------------------------------------------
// share
// ---------------------------------------------------------------------------

type ShareOptions = {
  into?: string;
  title?: string;
  date?: string;
  description?: string;
};

function copyArtifact(source: string, isDirectory: boolean, assetDir: string): string[] {
  mkdirSync(assetDir, { recursive: true });

  if (isDirectory) {
    cpSync(source, assetDir, { recursive: true, force: true });
    return walkFiles(assetDir)
      .map((file) => path.relative(assetDir, file).split(path.sep).join("/"))
      .sort();
  }

  cpSync(source, path.join(assetDir, path.basename(source)), { force: true });
  return [path.basename(source)];
}

/** Copy the local files an HTML document references, resolved against the
 *  document's own directory. A screenshot beside the report comes with it. */
function copyReferenced(
  sourceFile: string,
  figures: { src: string }[],
  assetDir: string,
  copied: Set<string>,
): string[] {
  const sourceDir = path.dirname(sourceFile);
  const added: string[] = [];

  for (const figure of figures) {
    if (isRemote(figure.src)) continue;
    const relative = figure.src.replace(/^\.\//, "").replace(/^\/+/, "");
    if (copied.has(relative)) continue;

    const from = path.resolve(sourceDir, relative);
    if (!from.startsWith(`${path.resolve(sourceDir)}${path.sep}`) && from !== path.resolve(sourceDir)) {
      // A src that climbs out of the artifact's own directory is skipped
      // rather than followed. Following it would publish an unrelated file.
      continue;
    }
    if (!existsSync(from) || !statSync(from).isFile()) continue;

    const to = path.join(assetDir, relative);
    mkdirSync(path.dirname(to), { recursive: true });
    cpSync(from, to, { force: true });
    copied.add(relative);
    added.push(relative);
  }

  return added;
}

function entryHtml(files: string[]): string | undefined {
  if (files.includes("index.html")) return "index.html";
  const pages = files.filter((file) => /\.html?$/i.test(file));
  return pages.length === 1 ? pages[0] : undefined;
}

function buildMdx(input: {
  title: string;
  description?: string;
  kind: string;
  hash: string;
  date: string;
  source: string;
  body: string;
  files: string[];
}): string {
  const front = [
    "---",
    `title: ${yamlString(input.title)}`,
    input.description ? `description: ${yamlString(input.description)}` : undefined,
    `kind: ${input.kind}`,
    `hash: ${input.hash}`,
    `date: ${input.date}`,
    `source: ${yamlString(input.source)}`,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  const assetRoot = `s/${input.hash}/`;
  const meta = `<ShareMeta kind="${input.kind}" hash="${input.hash}" date="${input.date}" source=${JSON.stringify(input.source)} raw="${assetRoot}" />`;

  // The tree lists the untouched bytes. A reader who needs the original opens
  // it from here, whatever the conversion did to the prose.
  const entries = input.files.map((file) => `{ path: ${JSON.stringify(`${assetRoot}${file}`)} }`);
  const tree =
    entries.length > 0
      ? `## Files\n\n<FileTree root=${JSON.stringify(assetRoot.replace(/\/$/, ""))} files={[\n  ${entries.join(",\n  ")}\n]} />`
      : "";

  return [front, "", meta, "", input.body.trim(), "", tree, ""].join("\n").replace(/\n{3,}/g, "\n\n");
}

async function share(kind: string, target: string, options: ShareOptions): Promise<void> {
  requireGithub();

  const config = await loadConfig();
  const chosen = resolveShare(config, options.into);
  ensureClone(chosen.clone, chosen.repo, chosen.branch);

  const kinds = readKinds(chosen.clone);
  if (!kinds.includes(kind)) {
    fail(`Unknown kind: ${kind}. This site knows: ${kinds.join(", ")}. See references/types.md.`);
  }

  const source = path.resolve(target);
  if (!existsSync(source)) fail(`Path does not exist: ${source}`);
  const isDirectory = statSync(source).isDirectory();

  const hash = hashPath(source, isDirectory);
  const types = readTypes(chosen.clone);
  if (types.has(hash)) {
    console.log(JSON.stringify({ hash, kind: types.get(hash), url: `${chosen.pagesUrl}shares/${hash}/`, unchanged: true }, null, 2));
    return;
  }

  const assetDir = path.join(chosen.clone, "public", "s", hash);
  const files = copyArtifact(source, isDirectory, assetDir);
  const copied = new Set(files);

  const extension = path.extname(source).toLowerCase();
  const entry = isDirectory ? entryHtml(files) : path.basename(source);
  const entryPath = entry ? path.join(assetDir, entry) : undefined;

  let title = options.title ?? "";
  let description = options.description;
  let body = "";

  if (entryPath && /\.html?$/i.test(entryPath)) {
    const html = readFileSync(entryPath, "utf8");
    const converted = await convertHtmlToMdx(html, `s/${hash}/`);
    body = converted.markdown;
    if (!title) title = converted.title;
    if (!isDirectory) {
      files.push(...copyReferenced(source, converted.figures, assetDir, copied));
      files.sort();
    }
  } else if (!isDirectory && (extension === ".md" || extension === ".mdx")) {
    const text = readFileSync(source, "utf8");
    const split = splitFrontmatter(text);
    // A hand-written document keeps its own markup. The author chose it.
    body = split.body;
    if (!title) title = frontmatterValue(split.front, "title") ?? "";
    description ??= frontmatterValue(split.front, "description");
    if (!title) title = /^#\s+(.+)$/m.exec(body)?.[1]?.trim() ?? "";
  }

  if (!title) title = slugify(path.basename(source, extension)).replace(/_/g, " ");

  const date = options.date ?? today();
  writeFileSync(
    path.join(chosen.clone, "content", "shares", `${hash}.mdx`),
    // Only the artifact's own name is recorded. The full local path names the
    // machine and the person, and the published page has no use for either.
    buildMdx({
      title,
      description,
      kind,
      hash,
      date,
      source: path.basename(source),
      body,
      files,
    }),
  );
  appendType(chosen.clone, hash, kind);

  // The repository validates itself. Run its own check before the push, so a
  // broken share never reaches the deploy workflow.
  run("mise", ["run", "checks:types"], { cwd: chosen.clone, inherit: true });

  const commit = commitAndPush(chosen.clone, chosen.branch, `share ${kind}: ${slugify(title)}`);

  console.log(
    JSON.stringify(
      {
        name: chosen.name,
        repo: chosen.repo,
        kind,
        hash,
        title,
        url: `${chosen.pagesUrl}shares/${hash}/`,
        files: `${chosen.pagesUrl}s/${hash}/`,
        commit,
      },
      null,
      2,
    ),
  );
}

// ---------------------------------------------------------------------------
// list, sync
// ---------------------------------------------------------------------------

async function list(): Promise<void> {
  const config = await loadConfig();
  const names = Object.keys(config.shares).sort();

  if (names.length === 0) {
    console.log(`No shares configured in ${CONFIG_FILE}`);
    console.log("Create one: artifact-shares create <name>");
    return;
  }

  for (const name of names) {
    const entry = config.shares[name]!;
    const clone = clonePathFor(config, name);
    const state = existsSync(clone) ? `${countShares(clone)} shares` : "not cloned";
    console.log(`${name}  [${state}]`);
    console.log(`  repo:  ${entry.repo}`);
    console.log(`  pages: ${entry.pages_url}`);
    console.log(`  clone: ${clone}`);
  }
}

async function sync(name: string): Promise<void> {
  requireCommand("git");
  const config = await loadConfig();
  const chosen = resolveShare(config, name);
  ensureClone(chosen.clone, chosen.repo, chosen.branch);

  const head = run("git", ["rev-parse", "HEAD"], { cwd: chosen.clone }).stdout;
  console.log(
    JSON.stringify(
      { name: chosen.name, repo: chosen.repo, clone: chosen.clone, head, shares: countShares(chosen.clone) },
      null,
      2,
    ),
  );
}

// ---------------------------------------------------------------------------
// read-only commands
// ---------------------------------------------------------------------------

async function doctor(): Promise<void> {
  const report = {
    bun: Bun.version,
    gh: run("sh", ["-c", "command -v gh"], { allowFailure: true }).ok,
    git: run("sh", ["-c", "command -v git"], { allowFailure: true }).ok,
    // A share repository has no package.json scripts. Every command in it is a
    // mise task, so `share` cannot run its validator without mise.
    mise: run("sh", ["-c", "command -v mise"], { allowFailure: true }).ok,
    configFile: CONFIG_FILE,
    configExists: existsSync(CONFIG_FILE),
    template: templateDir,
    templateExists: existsSync(templateDir),
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.gh || !report.git || !report.mise || !report.templateExists) {
    process.exitCode = 1;
  }
}

/** Run the share repository's own check, in the repository. The CLI holds no
 *  copy of that logic: the task lives in the clone, so a repository that adds a
 *  check gets it here with no change to this file. */
async function check(name?: string): Promise<void> {
  const config = await loadConfig();
  const chosen = resolveShare(config, name);
  if (!existsSync(chosen.clone)) fail(`Not cloned: ${chosen.clone}. Run: artifact-shares sync ${chosen.name}`);
  run("mise", ["run", "checks:types"], { cwd: chosen.clone, inherit: true });
}

async function selfTest(): Promise<void> {
  const slug = slugify("My Great Share!");
  if (slug !== "my_great_share") fail(`slug failed: ${slug}`);

  const converted = await convertHtmlToMdx(
    '<title>T</title><h1>T</h1><p>a {b} &lt;c&gt;</p><figure><img src="shots/x.png"><figcaption>cap</figcaption></figure>',
    "s/abc123def456/",
  );
  if (converted.title !== "T") fail(`title failed: ${converted.title}`);
  if (converted.markdown.includes("{b}")) fail("brace escape failed");
  if (!converted.markdown.includes('<Figure src="s/abc123def456/shots/x.png" caption="cap" />')) {
    fail(`figure failed:\n${converted.markdown}`);
  }
  if (converted.figures.length !== 1) fail("figure collection failed");

  const split = splitFrontmatter('---\ntitle: X\n---\n\nbody\n');
  if (frontmatterValue(split.front, "title") !== "X") fail("frontmatter read failed");
  if (split.body.trim() !== "body") fail(`frontmatter split failed: ${split.body}`);

  const kinds = readKinds(templateDir);
  for (const expected of ["session", "doc", "artifact"]) {
    if (!kinds.includes(expected)) fail(`template kind missing: ${expected} (got ${kinds.join(", ")})`);
  }

  console.log("artifact-shares self-test: ok");
}

// ---------------------------------------------------------------------------
// wiring
// ---------------------------------------------------------------------------

const createCmd = app
  .sub("create")
  .meta({ description: "Create a new private share repository and its site" })
  .args([{ name: "name", type: "string", description: "Share name, used as the repository name", required: true }])
  .flags({ owner: { type: "string", description: "GitHub owner, defaults to the authenticated user" } })
  .run(({ args, flags }: any) => create(args.name, { owner: flags.owner }));

const shareCmd = app
  .sub("share")
  .meta({ description: "Publish one artifact into a share repository" })
  .args([
    { name: "kind", type: "string", description: "Share kind, for example session or doc", required: true },
    { name: "path", type: "path", description: "File or directory to publish", required: true },
  ])
  .flags({
    into: { type: "string", description: "Share name to publish into" },
    title: { type: "string", description: "Page title, defaults to the artifact's own" },
    date: { type: "string", description: "Share date as YYYY-MM-DD, defaults to today" },
    description: { type: "string", description: "One-line summary for the sidebar" },
  })
  .run(({ args, flags }: any) =>
    share(args.kind, args.path, {
      into: flags.into,
      title: flags.title,
      date: flags.date,
      description: flags.description,
    }),
  );

const listCmd = app
  .sub("list")
  .meta({ description: "List the share repositories this machine knows" })
  .run(() => list());

const syncCmd = app
  .sub("sync")
  .meta({ description: "Bring a clone up to date with its remote" })
  .args([{ name: "name", type: "string", description: "Share name", required: true }])
  .run(({ args }: any) => sync(args.name));

const doctorCmd = app
  .sub("doctor")
  .meta({ description: "Check prerequisites" })
  .run(() => doctor());

const checkCmd = app
  .sub("check")
  .meta({ description: "Run a share repository's own checks:types task" })
  .flags({ into: { type: "string", description: "Share name, required when several are configured" } })
  .run(({ flags }: any) => check(flags.into));

const selfTestCmd = app
  .sub("self-test")
  .meta({ description: "Run the helper checks" })
  .run(() => selfTest());

const COMMANDS = ["create", "share", "list", "sync", "doctor", "check", "self-test"];

// Crust prints "Unknown command" and returns normally, which exits 0. A caller
// that reads the exit status would treat a typo as success, so the name is
// checked here first.
const first = process.argv[2];
if (first !== undefined && !first.startsWith("-") && !COMMANDS.includes(first)) {
  console.error(`Unknown command: ${first}. Commands: ${COMMANDS.join(", ")}`);
  process.exit(1);
}

try {
  await app
    .use(helpPlugin())
    .command(createCmd)
    .command(shareCmd)
    .command(listCmd)
    .command(syncCmd)
    .command(doctorCmd)
    .command(checkCmd)
    .command(selfTestCmd)
    .execute();
} catch (error) {
  if (error instanceof CliError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
