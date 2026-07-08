import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";
import { saveBase64Image } from "../src/utils/images.js";

function tempDir(): string {
	return mkdtempSync(join(tmpdir(), "pi-images-util-"));
}

test("saveBase64Image uses unique filenames and writes format-specific latest path", async () => {
	const cwd = tempDir();
	const settings = { imageOutputDir: "images" };
	const base64 = Buffer.from("image").toString("base64");
	const first = await saveBase64Image({ base64, callId: "call", cwd, format: "jpeg", responseId: "resp", settings });
	const second = await saveBase64Image({ base64, callId: "call", cwd, format: "jpeg", responseId: "resp", settings });
	assert.notEqual(first.path, second.path);
	assert.equal(first.latestPath?.endsWith("latest.jpeg"), true);
	assert.equal(existsSync(first.latestPath!), true);
	assert.match(basename(first.path), /^[\dTZ-]+-[a-f0-9]{8}\.jpeg$/);
});
