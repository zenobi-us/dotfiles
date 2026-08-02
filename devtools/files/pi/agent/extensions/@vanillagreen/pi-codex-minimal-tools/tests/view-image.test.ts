import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateImagePath, viewImage } from "../src/tools/view-image.js";

function tempDir(): string {
	return mkdtempSync(join(tmpdir(), "pi-view-image-"));
}

test("view_image validates local image files and strips @ prefix", async () => {
	const cwd = tempDir();
	writeFileSync(join(cwd, "image.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
	const validated = await validateImagePath({ path: "@image.png", detail: "high" }, cwd);
	assert.equal(validated.displayPath, "image.png");
	assert.equal(validated.mimeType, "image/png");
	assert.equal(validated.detail, "high");
	const result = await viewImage({ path: "image.png" }, cwd);
	assert.equal(result.content[0]?.type, "image");
	assert.equal(result.content[0]?.mimeType, "image/png");
	assert.equal(typeof result.content[0]?.data, "string");
});

test("view_image rejects directories and non-images", async () => {
	const cwd = tempDir();
	mkdirSync(join(cwd, "dir"));
	writeFileSync(join(cwd, "notes.txt"), "hello");
	await assert.rejects(() => validateImagePath({ path: "dir" }, cwd), /directory/);
	await assert.rejects(() => validateImagePath({ path: "notes.txt" }, cwd), /Unsupported image file type/);
});

test("view_image rejects paths outside cwd when workspaceOnly", async () => {
	const cwd = tempDir();
	const outside = tempDir();
	writeFileSync(join(outside, "secret.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
	await assert.rejects(() => validateImagePath({ path: "../secret.png" }, cwd, { workspaceOnly: true }), /escapes the workspace/);
	await assert.rejects(() => validateImagePath({ path: join(outside, "secret.png") }, cwd, { workspaceOnly: true }), /escapes the workspace/);
});

test("view_image rejects symlinks that resolve outside cwd when workspaceOnly", async () => {
	const cwd = tempDir();
	const outside = tempDir();
	writeFileSync(join(outside, "secret.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
	symlinkSync(join(outside, "secret.png"), join(cwd, "linked.png"));
	await assert.rejects(() => validateImagePath({ path: "linked.png" }, cwd, { workspaceOnly: true }), /escapes the workspace/);
});

test("view_image allows paths outside cwd by default", async () => {
	const cwd = tempDir();
	const outside = tempDir();
	const outsidePath = join(outside, "clip.png");
	writeFileSync(outsidePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
	const validated = await validateImagePath({ path: outsidePath }, cwd);
	assert.equal(validated.absolutePath, outsidePath);
	assert.equal(validated.mimeType, "image/png");
});
