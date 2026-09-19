#!/usr/bin/env -S mise exec -- bun run --install=fallback

/*!
 * artifact-shares — private artifact sites on GitHub Pages.
 *
 *   create <name>          make a new private share repository
 *   share <kind> <path>    publish one artifact into a share repository
 *   redact <hash>          take one published share down
 *   recreate <name>        delete the repository and build it again, cleaned
 *   list                   list the share repositories this machine knows
 *   sync <name>            bring a clone up to date with its remote
 *
 * Read-only extras: doctor, check, self-test, --help.
 * `share --dry-run` is read-only too: it stages to a temporary directory.
 *
 * `create`, `share`, `redact`, `recreate`, and `sync` change remote state. Run
 * them only when the user names the operation. `recreate` also deletes a
 * GitHub repository, and asks for the name twice before it does.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, cpSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";

import {
  CliError,
  appendType,
  assertShareClone,
  assertShareName,
  commitAndPush,
  copyTemplate,
  fail,
  hashPath,
  readKinds,
  readTypes,
  removeShareFiles,
  repoParts,
  requireCommand,
  run,
  slugify,
  timestamp,
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

export type CheckOptions = {
  /** Check a directory other than the clone. `share --dry-run` stages there. */
  root?: string;
  /** Publish images that carry metadata, having read the findings. */
  allowMetadata?: boolean;
  /** Publish a file over 50 MiB. */
  allowLarge?: boolean;
};

/** Run one of the repository's own check tasks, in the repository. The CLI
 *  holds no copy of a check: a repository that adds one gets it here with no
 *  change to this file. */
function runCheck(clone: string, task: string, args: string[] = []): void {
  run("mise", ["run", task, ...(args.length > 0 ? ["--", ...args] : [])], {
    cwd: clone,
    inherit: true,
  });
}

/** Every check that guards a push, in the order that fails cheapest first.
 *
 *  `checks:types` is skipped when a root is given, because that task resolves
 *  the repository from its own path and cannot look elsewhere. Nothing is lost:
 *  the two things it would catch here, an unknown kind and a repeated hash,
 *  are checked against the clone before any file is written. */
function runShareChecks(clone: string, options: CheckOptions = {}): void {
  const root = options.root ? ["--root", options.root] : [];

  if (!options.root) runCheck(clone, "checks:types");
  runCheck(clone, "checks:size", [...root, ...(options.allowLarge ? ["--allow-large"] : [])]);
  runCheck(clone, "checks:metadata", [...root, ...(options.allowMetadata ? ["--allow"] : [])]);
  // Last, because it is the slowest and the one most likely to stop a push.
  runCheck(clone, "checks:secrets", root);
}

/** Whether GitHub serves this repository to everyone. Read before a recreate,
 *  because rebuilding a public repository as a private one turns its site off
 *  on a free plan, and rebuilding a private one as public would publish every
 *  share in it. Neither may happen by accident. */
function isPublic(repo: string): boolean {
  const result = run("gh", ["repo", "view", repo, "--json", "visibility", "--jq", ".visibility"], {
    allowFailure: true,
  });
  return result.ok && result.stdout.toUpperCase() === "PUBLIC";
}

/** The warning a public share repository earns, every time. */
function warnPublic(repo: string): void {
  console.log("");
  console.log(`${repo} is PUBLIC.`);
  console.log("  Anyone can read every share in it, and every file under public/s/.");
  console.log("  Anyone can clone it, and a clone keeps what a later redact removes.");
  console.log("  Search engines index it.");
  console.log("Publish nothing here that you would not put on a billboard.");
}

/** Point GitHub Pages at the workflow, and say so when it will not go.
 *
 *  GitHub serves Pages from a private repository only on a paid plan. On a free
 *  account or a free organisation the call fails, the deploy workflow fails at
 *  `configure-pages`, and the site never exists. That has to be said out loud:
 *  a printed URL that can never resolve is worse than an error. */
function enablePages(repo: string): boolean {
  const body = JSON.stringify({ build_type: "workflow" });

  const created = run("gh", ["api", `repos/${repo}/pages`, "--method", "POST", "--input", "-"], {
    input: body,
    allowFailure: true,
  });
  if (created.ok) return true;

  // Already configured: POST refuses, PUT updates.
  const updated = run("gh", ["api", `repos/${repo}/pages`, "--method", "PUT", "--input", "-"], {
    input: body,
    allowFailure: true,
  });
  if (updated.ok) return true;

  console.error("");
  console.error(`GitHub Pages could not be turned on for ${repo}.`);
  console.error(`  ${(created.stderr || created.stdout).split("\n")[0] ?? ""}`);
  console.error("");
  console.error("The usual cause is the plan. GitHub serves Pages from a private repository");
  console.error("only on a paid plan. Check with:");
  console.error(`  gh api repos/${repo} --jq .visibility`);
  console.error(`  gh api orgs/<owner> --jq .plan.name`);
  console.error("");
  console.error("Until this is fixed the deploy workflow fails and no page resolves.");
  console.error("Either upgrade the account, or make the repository public and accept that");
  console.error("anyone can read every share in it.");
  return false;
}

/** Install the git hooks hk.pkl describes. A failure is reported, not fatal:
 *  every check also runs in `share`, in `hk check`, and in both workflows, so
 *  a repository without hooks is slower to catch a mistake, not unprotected. */
function installHooks(clone: string): void {
  const installed = run("mise", ["exec", "--", "hk", "install"], {
    cwd: clone,
    allowFailure: true,
  });
  if (!installed.ok) {
    console.error(`warning: hk install failed in ${clone}. Pre-commit checks will not run there.`);
    console.error(`  Run it yourself: cd ${clone} && mise exec -- hk install`);
  }
}

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

async function create(name: string, options: { owner?: string; public?: boolean }): Promise<void> {
  assertShareName(name);
  requireGithub();

  // A free account and a free organisation cannot serve Pages from a private
  // repository, so public is the only thing that works there. It is still a
  // decision the user makes, never one this CLI makes for them.
  const wantPublic = options.public === true;

  const config = await loadConfig();
  if (config.shares[name]) fail(`${name} is already configured in ${CONFIG_FILE}`);

  const owner = options.owner ?? run("gh", ["api", "user", "--jq", ".login"]).stdout;
  if (!owner) fail("Could not read the GitHub login. Pass --owner.");
  const repo = `${owner}/${name}`;

  const exists = run("gh", ["repo", "view", repo, "--json", "name"], { allowFailure: true }).ok;
  if (exists) fail(`${repo} already exists. Use sync to adopt it, or pick another name.`);

  const clone = clonePathFor(config, name);
  if (existsSync(clone)) fail(`${clone} already exists. Move it aside first.`);

  run("gh", ["repo", "create", repo, wantPublic ? "--public" : "--private"]);

  copyTemplate(templateDir, clone);
  // package.json ships under the template name. The repository name is the
  // better one, and nothing reads it but a person.
  const packageFile = path.join(clone, "package.json");
  const manifest = JSON.parse(readFileSync(packageFile, "utf8")) as { name: string };
  manifest.name = name;
  writeFileSync(packageFile, `${JSON.stringify(manifest, null, 2)}\n`);

  run("git", ["init", "-b", "main"], { cwd: clone });
  run("git", ["remote", "add", "origin", sshUrlFor(repo)], { cwd: clone });

  // hk.pkl is only a file until the hooks are installed. Without this, the
  // pre-commit checks never run in this clone and the file reads as a promise
  // the repository does not keep.
  installHooks(clone);

  run("git", ["add", "."], { cwd: clone });
  run("git", ["commit", "-m", "create artifact share site"], { cwd: clone });
  run("git", ["push", "-u", "origin", "main"], { cwd: clone });

  // GitHub Pages builds from the workflow, not from a branch, so nothing is
  // served until `deploy.yml` finishes its first run.
  const pagesReady = enablePages(repo);

  const pagesUrl = pagesUrlFor(repo);
  config.shares[name] = { repo, branch: "main", pages_url: pagesUrl };
  await saveConfig(config);

  console.log(
    JSON.stringify(
      { name, repo, clone, pagesUrl, branch: "main", visibility: wantPublic ? "public" : "private", pagesReady },
      null,
      2,
    ),
  );
  console.log("");

  if (!pagesReady) {
    console.log("The repository and the clone are ready. The site is NOT.");
    console.log(`Fix Pages, then: gh workflow run deploy --repo ${repo}`);
    process.exitCode = 1;
    return;
  }

  console.log("The site is empty until the deploy workflow finishes its first run:");
  console.log(`  gh run list --repo ${repo} --limit 1`);
  console.log(`  gh run watch <id> --repo ${repo}`);

  if (wantPublic) {
    warnPublic(repo);
    return;
  }

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
  dryRun?: boolean;
  allowMetadata?: boolean;
  allowLarge?: boolean;
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
  const dryRun = options.dryRun === true;

  // A dry run reads the clone and writes to a temporary directory. It makes no
  // network call, so it needs neither gh nor a fetch.
  if (!dryRun) requireGithub();

  const config = await loadConfig();
  const chosen = resolveShare(config, options.into);

  if (dryRun) {
    assertShareClone(chosen.clone);
  } else {
    ensureClone(chosen.clone, chosen.repo, chosen.branch);
  }

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

  // A dry run stages the same layout somewhere disposable, so the clone stays
  // exactly as it was whatever the checks say.
  const stage = dryRun
    ? mkdtempSync(path.join(os.tmpdir(), `artifact-share-${hash}-`))
    : chosen.clone;
  mkdirSync(path.join(stage, "content", "shares"), { recursive: true });

  const assetDir = path.join(stage, "public", "s", hash);
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
  const page = path.join(stage, "content", "shares", `${hash}.mdx`);
  writeFileSync(
    page,
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

  if (dryRun) {
    runShareChecks(chosen.clone, {
      root: stage,
      allowMetadata: options.allowMetadata,
      allowLarge: options.allowLarge,
    });
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          name: chosen.name,
          repo: chosen.repo,
          kind,
          hash,
          title,
          url: `${chosen.pagesUrl}shares/${hash}/`,
          page,
          stage,
          files,
        },
        null,
        2,
      ),
    );
    console.log("");
    console.log("Nothing was written to the clone and nothing was pushed.");
    console.log("Read the page before you publish it:");
    console.log(`  cat ${page}`);
    return;
  }

  appendType(chosen.clone, hash, kind);

  // The repository validates itself. Run its own checks before the push, so a
  // broken or leaking share never reaches the deploy workflow. A failure takes
  // back the three files this command just wrote: a half-written share left in
  // the clone would fail the next unrelated commit.
  try {
    runShareChecks(chosen.clone, {
      allowMetadata: options.allowMetadata,
      allowLarge: options.allowLarge,
    });
  } catch (error) {
    removeShareFiles(chosen.clone, hash);
    console.error("");
    console.error(`A check failed. ${hash} was removed from the clone; nothing was pushed.`);
    throw error;
  }

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
// redact, recreate
// ---------------------------------------------------------------------------

/** Take one share down. The page stops resolving as soon as the next deploy
 *  finishes. The bytes stay in git history, so this is containment, not
 *  erasure, and the command says so every time. */
async function redact(hash: string, options: { into?: string }): Promise<void> {
  requireGithub();

  const config = await loadConfig();
  const chosen = resolveShare(config, options.into);
  ensureClone(chosen.clone, chosen.repo, chosen.branch);

  const types = readTypes(chosen.clone);
  if (!types.has(hash)) {
    fail(`${hash} is not a share in ${chosen.name}. Run: artifact-shares list`);
  }

  const assetDir = path.join(chosen.clone, "public", "s", hash);
  const removed = existsSync(assetDir)
    ? walkFiles(assetDir).map((file) => path.relative(assetDir, file).split(path.sep).join("/")).sort()
    : [];

  removeShareFiles(chosen.clone, hash);
  runShareChecks(chosen.clone, { allowMetadata: true, allowLarge: true });

  const commit = commitAndPush(chosen.clone, chosen.branch, `redact share ${hash}`);

  console.log(
    JSON.stringify(
      { name: chosen.name, repo: chosen.repo, hash, kind: types.get(hash), removed, commit },
      null,
      2,
    ),
  );
  console.log("");
  console.log("The page stops resolving when the next deploy finishes:");
  console.log(`  gh run list --repo ${chosen.repo} --limit 1`);
  console.log(`  gh run watch <id> --repo ${chosen.repo}`);
  console.log("");
  console.log("This does NOT unpublish what was already read.");
  console.log("  - The bytes stay in this repository's git history and on GitHub.");
  console.log("  - Anyone who cloned, forked, or opened the page already has them.");
  console.log("");
  console.log("If the share carried a credential, rotate it now. Nothing else fixes that.");
  console.log("To drop the history as well, and keep every other share's URL working:");
  console.log(`  artifact-shares recreate ${chosen.name} --confirm ${chosen.name}`);
}

/** Delete the repository and build it again from the cleaned working tree.
 *
 *  This is the only way to get published bytes off GitHub. `git filter-repo`
 *  does not: it rewrites history, breaks every clone, and leaves unreachable
 *  objects GitHub still serves.
 *
 *  The cost is smaller than it looks. The new repository takes the same
 *  owner and name, so the Pages URL does not change and every share except the
 *  redacted one resolves exactly as before. What is lost is the commit history,
 *  the issues, and the stars, none of which a share repository uses. */
async function recreate(name: string, options: { confirm?: string; owner?: string }): Promise<void> {
  requireGithub();

  const config = await loadConfig();
  const chosen = resolveShare(config, name);

  if (options.confirm !== chosen.name) {
    fail(
      `recreate deletes ${chosen.repo} on GitHub and builds it again.\n` +
        `Every published URL under it stops working until the new deploy finishes.\n` +
        `To go ahead, repeat the name: artifact-shares recreate ${chosen.name} --confirm ${chosen.name}`,
    );
  }

  assertShareClone(chosen.clone);
  const { owner } = repoParts(chosen.repo);

  // Read it now. After step 4 the repository is gone and nothing can be asked
  // about it, and rebuilding with the wrong visibility either turns the site
  // off or publishes every share in it.
  const wasPublic = isPublic(chosen.repo);
  console.log(`${chosen.repo} is ${wasPublic ? "public" : "private"}. It will be rebuilt the same way.`);

  // 1. The tree that is about to become the whole repository must be clean.
  //    Rebuilding around a secret would spend the one move that removes it.
  console.log("Checking the working tree before anything is deleted.");
  runShareChecks(chosen.clone);

  // 2. Keep the old history locally. After step 4 it exists nowhere else.
  const bundle = path.join(path.dirname(chosen.clone), `${chosen.name}-${timestamp()}.bundle`);
  run("git", ["bundle", "create", bundle, "--all"], { cwd: chosen.clone });
  console.log(`Old history saved to ${bundle}`);

  // 3. Take the site down first. It is the fastest step and the only one that
  //    stops a reader, so it runs before the slow ones.
  run("gh", ["api", `repos/${chosen.repo}/pages`, "--method", "DELETE"], { allowFailure: true });
  console.log("GitHub Pages turned off.");

  // 4. The point of the exercise.
  run("gh", ["repo", "delete", chosen.repo, "--yes"]);
  console.log(`Deleted ${chosen.repo}.`);

  run("gh", ["repo", "create", chosen.repo, wasPublic ? "--public" : "--private"]);

  // 5. One commit, no ancestors. Nothing of the old history reaches the remote.
  rmSync(path.join(chosen.clone, ".git"), { recursive: true, force: true });
  run("git", ["init", "-b", chosen.branch], { cwd: chosen.clone });
  run("git", ["remote", "add", "origin", sshUrlFor(chosen.repo)], { cwd: chosen.clone });
  installHooks(chosen.clone);
  run("git", ["add", "."], { cwd: chosen.clone });
  run("git", ["commit", "-m", "recreate artifact share site"], { cwd: chosen.clone });
  run("git", ["push", "-u", "origin", chosen.branch], { cwd: chosen.clone });

  const pagesReady = enablePages(chosen.repo);
  const pagesUrl = pagesUrlFor(chosen.repo);
  config.shares[chosen.name] = { repo: chosen.repo, branch: chosen.branch, pages_url: pagesUrl };
  await saveConfig(config);

  console.log(
    JSON.stringify(
      {
        name: chosen.name,
        repo: chosen.repo,
        owner,
        pagesUrl,
        visibility: wasPublic ? "public" : "private",
        pagesReady,
        bundle,
        shares: countShares(chosen.clone),
        head: run("git", ["rev-parse", "HEAD"], { cwd: chosen.clone }).stdout,
      },
      null,
      2,
    ),
  );
  console.log("");
  if (!pagesReady) {
    console.log("The repository was rebuilt. Pages is NOT on, so no page resolves.");
    console.log(`Fix Pages, then: gh workflow run deploy --repo ${chosen.repo}`);
    process.exitCode = 1;
    return;
  }
  console.log("Every share still in the repository keeps the URL it had.");
  console.log("The site 404s until the first deploy finishes:");
  console.log(`  gh run list --repo ${chosen.repo} --limit 1`);
  console.log(`  gh run watch <id> --repo ${chosen.repo}`);
  console.log("");
  console.log("A deleted repository does not recall what was already read.");
  console.log("Rotate any credential that was published. That is the fix; this is the cleanup.");
  if (wasPublic) warnPublic(chosen.repo);
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
    // Not on PATH here is fine: mise.toml pins both inside a share repository,
    // so `mise run checks:secrets` finds them in the clone. Reported because a
    // missing one there is the difference between a scan and a false pass.
    trufflehog: run("sh", ["-c", "command -v trufflehog"], { allowFailure: true }).ok,
    gitleaks: run("sh", ["-c", "command -v gitleaks"], { allowFailure: true }).ok,
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
async function check(name?: string, options: CheckOptions = {}): Promise<void> {
  const config = await loadConfig();
  const chosen = resolveShare(config, name);
  if (!existsSync(chosen.clone)) fail(`Not cloned: ${chosen.clone}. Run: artifact-shares sync ${chosen.name}`);
  runShareChecks(chosen.clone, options);
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
  .flags({
    owner: { type: "string", description: "GitHub owner, defaults to the authenticated user" },
    public: {
      type: "boolean",
      description: "Make the repository public. Everyone can read every share in it",
    },
  })
  .run(({ args, flags }: any) => create(args.name, { owner: flags.owner, public: flags.public === true }));

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
    "dry-run": {
      type: "boolean",
      description: "Build and check the page in a temporary directory. Writes nothing, pushes nothing",
    },
    "allow-metadata": { type: "boolean", description: "Publish images that carry embedded metadata" },
    "allow-large": { type: "boolean", description: "Publish a file over 50 MiB" },
  })
  .run(({ args, flags }: any) =>
    share(args.kind, args.path, {
      into: flags.into,
      title: flags.title,
      date: flags.date,
      description: flags.description,
      dryRun: flags["dry-run"] === true || flags.dryRun === true,
      allowMetadata: flags["allow-metadata"] === true || flags.allowMetadata === true,
      allowLarge: flags["allow-large"] === true || flags.allowLarge === true,
    }),
  );

const redactCmd = app
  .sub("redact")
  .meta({ description: "Take one published share down" })
  .args([{ name: "hash", type: "string", description: "The share's 12-character hash", required: true }])
  .flags({ into: { type: "string", description: "Share name, required when several are configured" } })
  .run(({ args, flags }: any) => redact(args.hash, { into: flags.into }));

const recreateCmd = app
  .sub("recreate")
  .meta({ description: "Delete the repository and build it again from the cleaned tree" })
  .args([{ name: "name", type: "string", description: "Share name", required: true }])
  .flags({
    confirm: { type: "string", description: "Repeat the share name to confirm the deletion" },
    owner: { type: "string", description: "GitHub owner, defaults to the one in the config" },
  })
  .run(({ args, flags }: any) => recreate(args.name, { confirm: flags.confirm, owner: flags.owner }));

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
  .meta({ description: "Run a share repository's own checks" })
  .flags({
    into: { type: "string", description: "Share name, required when several are configured" },
    "allow-metadata": { type: "boolean", description: "Pass images that carry embedded metadata" },
    "allow-large": { type: "boolean", description: "Pass a file over 50 MiB" },
  })
  .run(({ flags }: any) =>
    check(flags.into, {
      allowMetadata: flags["allow-metadata"] === true || flags.allowMetadata === true,
      allowLarge: flags["allow-large"] === true || flags.allowLarge === true,
    }),
  );

const selfTestCmd = app
  .sub("self-test")
  .meta({ description: "Run the helper checks" })
  .run(() => selfTest());

const COMMANDS = [
  "create",
  "share",
  "redact",
  "recreate",
  "list",
  "sync",
  "doctor",
  "check",
  "self-test",
];

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
    .command(redactCmd)
    .command(recreateCmd)
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
