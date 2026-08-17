#!/usr/bin/env -S mise x -- bun --install=auto

import { Crust } from "@crustjs/core";
import { helpPlugin } from "@crustjs/plugins";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillDir = resolve(scriptDir, "..");
const webAssetsDir = join(skillDir, "assets", "web");
const configPath = join(homedir(), ".config", "private-share.json");

const app = new Crust("private-share").meta({
  description: "Publish private GitHub Pages shares under /s/<hash>",
});

function fail(message) {
  throw new Error(message);
}

function run(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    input: options.input,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : ["pipe", "pipe", "pipe"],
  });

  if (result.error) fail(`${command}: ${result.error.message}`);
  if (result.status !== 0 && !options.allowFailure) {
    const details = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    fail(`${command} ${args.join(" ")} failed${details ? `:\n${details}` : ""}`);
  }

  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
    status: result.status,
  };
}

function commandExists(command) {
  return run("sh", ["-c", `command -v ${command}`], { allowFailure: true }).ok;
}

function requireCommand(command) {
  if (!commandExists(command)) fail(`${command} is not installed`);
}

function repoParts(repo) {
  const match = repo.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (!match) fail(`Repository must be owner/repo: ${repo}`);
  return { owner: match[1], name: match[2] };
}

function gitRemoteUrl(repo) {
  const result = run("gh", ["repo", "view", repo, "--json", "sshUrl", "--jq", ".sshUrl"]);
  return result.stdout || `git@github.com:${repo}.git`;
}

function pagesUrlFor(repo) {
  const result = run("gh", ["api", `repos/${repo}/pages`, "--jq", ".html_url"], {
    allowFailure: true,
  });

  if (result.ok && result.stdout) return result.stdout.replace(/\/$/, "");

  const { owner, name } = repoParts(repo);
  return `https://${owner}.github.io/${name}`;
}

function writeConfig(config) {
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(`${configPath}.tmp`, `${JSON.stringify(config, null, 2)}\n`);
  renameSync(`${configPath}.tmp`, configPath);
}

function readConfig() {
  if (!existsSync(configPath)) fail(`Run setup first: ${configPath} does not exist`);
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function copyDirContents(from, to, options = {}) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (options.skipExisting && existsSync(join(to, entry.name))) continue;
    cpSync(join(from, entry.name), join(to, entry.name), {
      recursive: true,
      force: true,
    });
  }
}

function copyWebAssetsToBranch(worktree) {
  mkdirSync(worktree, { recursive: true });
  for (const entry of readdirSync(webAssetsDir, { withFileTypes: true })) {
    if (entry.name === "sessions.jsonl" && existsSync(join(worktree, entry.name))) continue;
    cpSync(join(webAssetsDir, entry.name), join(worktree, entry.name), {
      recursive: true,
      force: true,
    });
  }
}

function slugify(value) {
  return (value || "artifact")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "artifact";
}

function isoDate() {
  return new Date().toISOString().replace(/:/g, "-").replace(/\.\d{3}Z$/, "Z");
}

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 12);
}

function walkFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return walkFiles(path);
    return entry.isFile() ? [path] : [];
  });
}

function hashDir(path) {
  const hash = createHash("sha256");
  for (const file of walkFiles(path).sort()) {
    const rel = relative(path, file).split(sep).join("/");
    hash.update(rel).update("\0").update(readFileSync(file)).update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeDownloadPage({ outFile, title, fileName, zipName }) {
  const links = [];
  if (fileName) links.push(`<li><a href="${encodeURI(fileName)}">Download ${htmlEscape(fileName)}</a></li>`);
  if (zipName) links.push(`<li><a href="../${encodeURI(zipName)}">Download zip</a></li>`);

  writeFileSync(
    outFile,
    `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${htmlEscape(title)}</title></head>
<body><main><h1>${htmlEscape(title)}</h1><ul>${links.join("")}</ul></main></body>
</html>
`,
  );
}

function loadRecords(repoDir) {
  const indexPath = join(repoDir, "sessions.jsonl");
  if (!existsSync(indexPath)) return [];
  return readFileSync(indexPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => JSON.parse(line));
}

function clonePages(repo) {
  const tmp = mkdtempSync(join(tmpdir(), "private-share-"));
  const worktree = join(tmp, "repo");
  const cloned = run(
    "gh",
    ["repo", "clone", repo, worktree, "--", "--branch", "gh-pages", "--single-branch"],
    { allowFailure: true },
  );

  if (cloned.ok) return { tmp, worktree, existed: true };

  mkdirSync(worktree, { recursive: true });
  run("git", ["init"], { cwd: worktree });
  run("git", ["checkout", "-b", "gh-pages"], { cwd: worktree });
  run("git", ["remote", "add", "origin", gitRemoteUrl(repo)], { cwd: worktree });
  return { tmp, worktree, existed: false };
}

function gitHasChanges(worktree) {
  return run("git", ["status", "--porcelain"], { cwd: worktree }).stdout.length > 0;
}

function commitAndPush(worktree, message) {
  if (!gitHasChanges(worktree)) return null;
  run("git", ["add", "."], { cwd: worktree });
  run("git", ["commit", "-m", message], { cwd: worktree });
  run("git", ["push", "-u", "origin", "gh-pages"], { cwd: worktree });
  return run("git", ["rev-parse", "HEAD"], { cwd: worktree }).stdout;
}

function ensurePages(repo) {
  const body = JSON.stringify({ source: { branch: "gh-pages", path: "/" } });
  const endpoint = `repos/${repo}/pages`;
  const create = run("gh", ["api", endpoint, "--method", "POST", "--input", "-"], {
    input: body,
    allowFailure: true,
  });

  if (!create.ok) {
    run("gh", ["api", endpoint, "--method", "PUT", "--input", "-"], {
      input: body,
      allowFailure: true,
    });
  }

  return pagesUrlFor(repo);
}

async function setup(repo) {
  repoParts(repo);
  requireCommand("gh");
  requireCommand("git");
  run("gh", ["auth", "status"]);

  const view = run("gh", ["repo", "view", repo, "--json", "visibility", "--jq", ".visibility"], {
    allowFailure: true,
  });

  if (!view.ok) run("gh", ["repo", "create", repo, "--private"]);
  const visibility = run("gh", ["repo", "view", repo, "--json", "visibility", "--jq", ".visibility"])
    .stdout;
  if (visibility !== "PRIVATE") fail(`${repo} is ${visibility}, not PRIVATE`);

  const { tmp, worktree } = clonePages(repo);
  try {
    copyWebAssetsToBranch(worktree);
    run("node", ["scripts/validate-sessions-index.mjs"], { cwd: worktree, inherit: true });
    const commit = commitAndPush(worktree, "setup private share pages");
    const pagesUrl = ensurePages(repo);

    writeConfig({ repo, branch: "gh-pages", pagesUrl });
    console.log(JSON.stringify({ repo, branch: "gh-pages", pagesUrl, commit }, null, 2));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function share(sourcePath, options = {}) {
  const config = readConfig();
  const repo = config.repo;
  const pagesUrl = (config.pagesUrl || pagesUrlFor(repo)).replace(/\/$/, "");
  requireCommand("gh");
  requireCommand("git");
  run("gh", ["auth", "status"]);

  if (!existsSync(sourcePath)) fail(`Path does not exist: ${sourcePath}`);

  const stat = statSync(sourcePath);
  const kind = stat.isDirectory()
    ? "directory"
    : extname(sourcePath).toLowerCase() === ".html"
      ? "html"
      : "file";
  const hash = kind === "directory" ? hashDir(sourcePath) : hashFile(sourcePath);
  const title = options.title || basename(sourcePath, extname(sourcePath));
  const record = {
    hash,
    date: isoDate(),
    path: `s/${hash}/`,
    title,
    kind,
  };

  if (kind === "directory") record.zipPath = `s/${hash}.zip`;

  const { tmp, worktree } = clonePages(repo);
  try {
    const records = loadRecords(worktree);
    const existing = records.find((entry) => entry.hash === hash);
    if (existing) {
      console.log(`${pagesUrl}/${existing.path}`);
      if (existing.zipPath) console.log(`${pagesUrl}/${existing.zipPath}`);
      return;
    }

    const shareDir = join(worktree, "s", hash);
    if (existsSync(shareDir)) fail(`Share path exists without index record: s/${hash}/`);
    mkdirSync(shareDir, { recursive: true });

    if (kind === "html") {
      cpSync(sourcePath, join(shareDir, "index.html"));
    } else if (kind === "file") {
      const fileName = basename(sourcePath);
      cpSync(sourcePath, join(shareDir, fileName));
      writeDownloadPage({ outFile: join(shareDir, "index.html"), title, fileName });
    } else {
      copyDirContents(sourcePath, shareDir);
      if (!existsSync(join(shareDir, "index.html"))) {
        writeDownloadPage({ outFile: join(shareDir, "index.html"), title, zipName: `${hash}.zip` });
      }
      requireCommand("zip");
      run("zip", ["-qr", join("..", `${hash}.zip`), "."], { cwd: shareDir });
    }

    writeFileSync(
      join(worktree, "sessions.jsonl"),
      `${existsSync(join(worktree, "sessions.jsonl")) ? readFileSync(join(worktree, "sessions.jsonl"), "utf8").replace(/\s*$/, "\n") : ""}${JSON.stringify(record)}\n`,
    );

    run("node", ["scripts/validate-sessions-index.mjs"], { cwd: worktree, inherit: true });
    const shortName = slugify(title);
    const commit = commitAndPush(worktree, `add share: ${shortName}`);
    const result = { url: `${pagesUrl}/${record.path}`, zipUrl: record.zipPath ? `${pagesUrl}/${record.zipPath}` : undefined, repo, branch: "gh-pages", commit, hash };
    console.log(JSON.stringify(result, null, 2));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function selfTest() {
  const slug = slugify("My Great Share!");
  if (slug !== "my_great_share") fail(`slug failed: ${slug}`);

  const hash = createHash("sha256").update("x").digest("hex").slice(0, 12);
  if (!/^[a-f0-9]{12}$/.test(hash)) fail(`hash failed: ${hash}`);

  const record = { hash, date: isoDate(), path: `s/${hash}/`, title: "X", kind: "html" };
  if (record.path !== `s/${hash}/`) fail("record path failed");

  console.log("private-share self-test: ok");
}

const setupCmd = app
  .sub("setup")
  .meta({ description: "Set up the private share GitHub Pages repo" })
  .args([
    {
      name: "repo",
      type: "string",
      description: "The repository to share into: owner/repo",
      required: true,
    },
  ])
  .run(({ args }) => setup(args.repo));

const shareCmd = app
  .sub("share")
  .meta({
    description: "Upload an artifact to the private share repo and print the URL",
  })
  .args([
    {
      name: "path",
      type: "path",
      description: "The path to the agent session or artifact to share",
      required: true,
    },
  ])
  .flags({
    title: {
      type: "string",
      description: "Human-readable share title",
    },
  })
  .run(({ args, flags }) => share(args.path, { title: flags.title }));

const selfTestCmd = app
  .sub("self-test")
  .meta({ description: "Run private-share helper checks" })
  .run(() => selfTest());

app
  .use(helpPlugin())
  .command(setupCmd)
  .command(shareCmd)
  .command(selfTestCmd)
  .execute();
