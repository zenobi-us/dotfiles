import { afterEach, expect, mock, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { forEachSessionJsonlLine } from "../extensions/session-lines.ts";

mock.module("@earendil-works/pi-tui", () => ({
	truncateToWidth: (text: string, width: number) => text.slice(0, width),
	visibleWidth: (text: string) => text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1B\\))/g, "").length,
}));

const root = join(process.cwd(), "tmp", "session-manager-lines");

function resetRoot(): void {
	rmSync(root, { recursive: true, force: true });
	mkdirSync(root, { recursive: true });
}

afterEach(async () => {
	const { sessionUserMessagesCache } = await import("../extensions/session-data.ts");
	sessionUserMessagesCache.clear();
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

test("session user messages parse without loading the whole JSONL file", async () => {
	const { userMessagesForSession } = await import("../extensions/session-data.ts");
	resetRoot();
	const dir = mkdtempSync(join(root, "case-"));
	const path = join(dir, "session.jsonl");
	writeFileSync(path, [
		JSON.stringify({ type: "message", timestamp: "2026-06-04T00:00:00.000Z", message: { role: "user", content: [{ type: "text", text: "first prompt" }] } }),
		JSON.stringify({ type: "message", message: { role: "assistant", content: [{ type: "text", text: "answer" }] } }),
		JSON.stringify({ type: "message", message: { role: "user", content: [{ type: "image" }, { type: "text", text: "second prompt" }] } }),
	].join("\n"));

	const messages = userMessagesForSession({ path, firstMessage: "", name: "" } as never);
	expect(messages.map((message) => message.text)).toEqual(["first prompt", "[image] second prompt"]);
	expect(messages[0]?.timestamp).toBe(new Date("2026-06-04T00:00:00.000Z").getTime());
});
