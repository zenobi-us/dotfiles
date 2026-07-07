import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sessionUserMessages } from "../extensions/qol/session-search/cache.ts";
import { forEachSessionJsonlLine } from "../extensions/qol/session-search/jsonl.ts";

const root = join(process.cwd(), "tmp", "qol-session-jsonl");

function resetRoot(): void {
	rmSync(root, { recursive: true, force: true });
	mkdirSync(root, { recursive: true });
}

afterEach(() => {
	rmSync(root, { recursive: true, force: true });
});

test("session JSONL line reader streams across small chunks", () => {
	resetRoot();
	const dir = mkdtempSync(join(root, "case-"));
	const path = join(dir, "chunks.jsonl");
	writeFileSync(path, "one\r\ntwo\nthree");
	const lines: string[] = [];
	forEachSessionJsonlLine(path, (line) => lines.push(line), 3);
	expect(lines).toEqual(["one", "two", "three"]);
});

test("session search user prompts parse without loading the whole JSONL file", () => {
	resetRoot();
	const dir = mkdtempSync(join(root, "case-"));
	const path = join(dir, "session.jsonl");
	writeFileSync(path, [
		JSON.stringify({ type: "message", timestamp: "2026-06-04T00:00:00.000Z", message: { role: "user", content: [{ type: "text", text: "first prompt" }] } }),
		JSON.stringify({ type: "message", message: { role: "assistant", content: [{ type: "text", text: "answer" }] } }),
		JSON.stringify({ type: "message", message: { role: "user", content: [{ type: "image" }, { type: "text", text: "second prompt" }] } }),
	].join("\n"));

	const messages = sessionUserMessages(path);
	expect(messages.map((message) => message.text)).toEqual(["first prompt", "[image] second prompt"]);
	expect(messages[0]?.timestamp).toBe(new Date("2026-06-04T00:00:00.000Z").getTime());
});
