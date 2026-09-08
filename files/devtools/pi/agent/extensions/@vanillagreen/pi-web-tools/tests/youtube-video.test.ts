import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { isLocalVideoPath, videoMimeForPath } from "../src/extract/video.js";
import { parseYouTubeUrl } from "../src/extract/youtube.js";

test("parseYouTubeUrl handles watch/youtu.be/shorts/live/embed/v", () => {
	assert.equal(parseYouTubeUrl("https://www.youtube.com/watch?v=abc123XYZ_-")?.videoId, "abc123XYZ_-");
	assert.equal(parseYouTubeUrl("https://youtu.be/abc123XYZ_-")?.videoId, "abc123XYZ_-");
	assert.equal(parseYouTubeUrl("https://youtube.com/shorts/abcDEF")?.kind, "short");
	assert.equal(parseYouTubeUrl("https://www.youtube.com/live/streamId1")?.kind, "live");
	assert.equal(parseYouTubeUrl("https://www.youtube.com/embed/clipId")?.kind, "embed");
	assert.equal(parseYouTubeUrl("https://www.youtube.com/v/legacyId")?.kind, "v");
});

test("parseYouTubeUrl returns undefined for unrelated hosts", () => {
	assert.equal(parseYouTubeUrl("https://vimeo.com/123"), undefined);
	assert.equal(parseYouTubeUrl("https://example.com/?v=fake"), undefined);
	assert.equal(parseYouTubeUrl("not a url"), undefined);
});

test("isLocalVideoPath detects common video extensions", () => {
	const dir = mkdtempSync(join(tmpdir(), "pi-vid-test-"));
	const mp4 = join(dir, "sample.mp4");
	writeFileSync(mp4, "fake");
	assert.equal(isLocalVideoPath(mp4), true);
	assert.equal(isLocalVideoPath("/x/foo.mov"), true);
	assert.equal(isLocalVideoPath("/x/foo.webm"), true);
	assert.equal(isLocalVideoPath("/x/foo.txt"), false);
	assert.equal(videoMimeForPath("/x/foo.mp4"), "video/mp4");
	assert.equal(videoMimeForPath("/x/foo.mov"), "video/quicktime");
});
