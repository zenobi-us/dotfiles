import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { applyPatch } from "../src/patch/apply.js";
import { parseApplyPatch } from "../src/patch/parser.js";

function tempDir(): string {
	return mkdtempSync(join(tmpdir(), "pi-apply-patch-"));
}

test("parseApplyPatch parses add/update/delete actions", () => {
	const parsed = parseApplyPatch(`*** Begin Patch
*** Add File: a.txt
+hello
*** Update File: b.txt
@@
-old
+new
*** Delete File: c.txt
*** End Patch`);
	assert.equal(parsed.actions.length, 3);
	assert.equal(parsed.actions[0]?.kind, "add");
	assert.equal(parsed.actions[1]?.kind, "update");
	assert.equal(parsed.actions[2]?.kind, "delete");
});

test("applyPatch adds, updates, deletes, and moves files", async () => {
	const cwd = tempDir();
	writeFileSync(join(cwd, "update.txt"), "alpha\nold\nomega");
	writeFileSync(join(cwd, "delete.txt"), "remove me");
	const result = await applyPatch(`*** Begin Patch
*** Add File: added.txt
+hello
+world
*** Update File: update.txt
@@
 alpha
-old
+new
 omega
*** Delete File: delete.txt
*** Update File: update.txt
*** Move to: moved.txt
@@
 alpha
-new
+newer
 omega
*** End Patch`, { cwd });
	assert.equal(readFileSync(join(cwd, "added.txt"), "utf8"), "hello\nworld");
	assert.equal(readFileSync(join(cwd, "moved.txt"), "utf8"), "alpha\nnewer\nomega");
	assert.equal(existsSync(join(cwd, "update.txt")), false);
	assert.equal(existsSync(join(cwd, "delete.txt")), false);
	assert.equal(result.files.length, 4);
});

test("applyPatch rejects path traversal by default", async () => {
	const cwd = tempDir();
	await assert.rejects(
		() => applyPatch(`*** Begin Patch
*** Add File: ../escape.txt
+nope
*** End Patch`, { cwd }),
		/escapes cwd/,
	);
});

test("applyPatch reports partial failure and rolls back touched files", async () => {
	const cwd = tempDir();
	await assert.rejects(
		() => applyPatch(`*** Begin Patch
*** Add File: ok.txt
+ok
*** Update File: missing.txt
@@
-old
+new
*** End Patch`, { cwd }),
		/Rolled back touched files/,
	);
	assert.equal(existsSync(join(cwd, "ok.txt")), false);
});

test("applyPatch rejects ambiguous update context", async () => {
	const cwd = tempDir();
	writeFileSync(join(cwd, "ambiguous.txt"), "same\nsame\n");
	await assert.rejects(
		() => applyPatch(`*** Begin Patch
*** Update File: ambiguous.txt
@@
-same
+different
*** End Patch`, { cwd }),
		/ambiguous/,
	);
	assert.equal(readFileSync(join(cwd, "ambiguous.txt"), "utf8"), "same\nsame\n");
});

test("applyPatch preserves CRLF files when patch context uses LF", async () => {
	const cwd = tempDir();
	writeFileSync(join(cwd, "crlf.txt"), "alpha\r\nold\r\nomega\r\n");
	await applyPatch(`*** Begin Patch
*** Update File: crlf.txt
@@
 alpha
-old
+new
 omega
*** End Patch`, { cwd });
	assert.equal(readFileSync(join(cwd, "crlf.txt"), "utf8"), "alpha\r\nnew\r\nomega\r\n");
});
