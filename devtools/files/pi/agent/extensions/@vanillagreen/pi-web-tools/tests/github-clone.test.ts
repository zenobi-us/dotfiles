import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { cloneOrUpdateRepo, readBlobFromCache, readReadmeFromCache, readTreeFromCache, summarizeTreeEntries } from "../src/extract/github-clone.js";

function makeFakeRepo(): string {
	const cacheDir = mkdtempSync(join(tmpdir(), "pi-gh-cache-"));
	const repoDir = join(cacheDir, "owner__repo");
	mkdirSync(repoDir);
	mkdirSync(join(repoDir, "src"));
	writeFileSync(join(repoDir, "README.md"), "# Hello\n\nbody");
	writeFileSync(join(repoDir, "src", "index.ts"), "export const x = 1;\n");
	mkdirSync(join(repoDir, ".git"));
	writeFileSync(join(repoDir, ".git", "HEAD"), "ref: refs/heads/main\n");
	return cacheDir;
}

test("readBlobFromCache returns file content and rejects path traversal", () => {
	const cacheDir = makeFakeRepo();
	const repo = join(cacheDir, "owner__repo");
	const blob = readBlobFromCache(repo, "src/index.ts");
	assert.ok(blob);
	assert.match(blob!.content, /export const x = 1/);
	const escaped = readBlobFromCache(repo, "../../../etc/passwd");
	assert.equal(escaped, null);
});

test("readTreeFromCache lists entries and skips .git", () => {
	const cacheDir = makeFakeRepo();
	const repo = join(cacheDir, "owner__repo");
	const tree = readTreeFromCache(repo, "");
	assert.ok(tree);
	const names = tree!.entries.map((e) => e.name);
	assert.ok(names.includes("src"));
	assert.ok(names.includes("README.md"));
	assert.ok(!names.includes(".git"));
});

test("readReadmeFromCache picks README.md", () => {
	const cacheDir = makeFakeRepo();
	const repo = join(cacheDir, "owner__repo");
	const readme = readReadmeFromCache(repo);
	assert.match(readme ?? "", /# Hello/);
});

test("summarizeTreeEntries marks directories with trailing slash and notes truncation", () => {
	const out = summarizeTreeEntries([
		{ name: "src", path: "src", type: "dir" },
		{ name: "README.md", path: "README.md", type: "file", size: 17 },
	], true);
	assert.match(out, /- src\//);
	assert.match(out, /- README\.md \(17 bytes\)/);
	assert.match(out, /truncated/);
});

test("cloneOrUpdateRepo clones a tiny git repo into the cache", async () => {
	let gitOk = true;
	try { execFileSync("git", ["--version"], { stdio: ["ignore", "pipe", "ignore"] }); } catch { gitOk = false; }
	if (!gitOk) return;
	const sourceDir = mkdtempSync(join(tmpdir(), "pi-gh-source-"));
	execFileSync("git", ["init", "-q", "--initial-branch=main", sourceDir]);
	writeFileSync(join(sourceDir, "README.md"), "# Source repo\n");
	execFileSync("git", ["-C", sourceDir, "add", "."]);
	execFileSync("git", ["-C", sourceDir, "-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "-q", "-m", "init"]);
	const cacheDir = mkdtempSync(join(tmpdir(), "pi-gh-cache-"));
	const target = join(cacheDir, "fixture__repo");
	execFileSync("git", ["clone", "--quiet", sourceDir, target]);
	assert.ok(readBlobFromCache(target, "README.md"));
});
