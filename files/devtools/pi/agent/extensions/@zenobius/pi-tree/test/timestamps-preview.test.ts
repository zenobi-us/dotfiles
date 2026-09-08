import assert from "node:assert/strict";
import test from "node:test";

import { calculatePreviewLayout, getPreviewText, padToWidth } from "../src/preview.ts";
import { cycleMode, formatEntryTimestamp } from "../src/timestamps.ts";
import type { TreeNode } from "../src/types.ts";

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

function stripAnsi(value: string): string {
    return value.replace(ANSI_PATTERN, "");
}

function node(entry: TreeNode["entry"]): TreeNode {
    return { entry };
}

void test("cycleMode follows the configured timestamp mode order", () => {
    assert.equal(cycleMode("off"), "relative");
    assert.equal(cycleMode("relative"), "absolute");
    assert.equal(cycleMode("absolute"), "off");
});

void test("formatEntryTimestamp handles relative time boundaries", (t) => {
    const now = new Date("2024-06-01T12:00:00.000Z").getTime();
    t.mock.method(Date, "now", () => now);

    assert.equal(formatEntryTimestamp(new Date(now - 500).toISOString(), "relative"), "1s ago");
    assert.equal(formatEntryTimestamp(new Date(now - 59_000).toISOString(), "relative"), "59s ago");
    assert.equal(formatEntryTimestamp(new Date(now - 60_000).toISOString(), "relative"), "1m ago");
    assert.equal(
        formatEntryTimestamp(new Date(now - 60 * 60_000).toISOString(), "relative"),
        "1h ago",
    );
    assert.equal(
        formatEntryTimestamp(new Date(now - 24 * 60 * 60_000).toISOString(), "relative"),
        "1d ago",
    );
    assert.equal(
        formatEntryTimestamp(new Date(now - 7 * 24 * 60 * 60_000).toISOString(), "relative"),
        "1w ago",
    );
    assert.equal(
        formatEntryTimestamp(new Date(now - 40 * 24 * 60 * 60_000).toISOString(), "relative"),
        "1mo ago",
    );
    assert.equal(
        formatEntryTimestamp(new Date(now - 400 * 24 * 60 * 60_000).toISOString(), "relative"),
        "1y ago",
    );
});

void test("formatEntryTimestamp returns an empty string for missing or invalid timestamps", () => {
    assert.equal(formatEntryTimestamp(undefined, "relative"), "");
    assert.equal(formatEntryTimestamp("not a date", "absolute"), "");
});

void test("getPreviewText extracts and normalizes message content", () => {
    assert.equal(
        getPreviewText(
            node({
                id: "1",
                type: "message",
                message: { content: "  hello\tworld\n\n\nagain  " },
            }),
        ),
        "hello world\n\nagain",
    );

    assert.equal(
        getPreviewText(
            node({
                id: "2",
                type: "message",
                message: {
                    content: [
                        { type: "text", text: "first " },
                        { type: "image", image: "ignored" },
                        { type: "text", text: "second" },
                    ],
                },
            }),
        ),
        "first second",
    );
});

void test("getPreviewText uses meaningful fallbacks for non-text entries", () => {
    assert.equal(
        getPreviewText(
            node({
                id: "bash",
                type: "message",
                message: { role: "bashExecution", command: "npm test" },
            }),
        ),
        "npm test",
    );
    assert.equal(
        getPreviewText(
            node({
                id: "tool",
                type: "message",
                message: { role: "toolResult", toolName: "read" },
            }),
        ),
        "[read]",
    );
    assert.equal(
        getPreviewText(
            node({
                id: "abort",
                type: "message",
                message: { stopReason: "aborted" },
            }),
        ),
        "(aborted)",
    );
    assert.equal(
        getPreviewText(node({ id: "summary", type: "branch_summary", summary: "Done" })),
        "Done",
    );
    assert.equal(
        getPreviewText(node({ id: "compact", type: "compaction", tokensBefore: 12_345 })),
        "compaction: 12k tokens",
    );
});

void test("calculatePreviewLayout only enables preview when both panes fit", () => {
    assert.equal(calculatePreviewLayout(79), null);
    assert.deepEqual(calculatePreviewLayout(80), { leftWidth: 33, rightWidth: 44 });
    assert.deepEqual(calculatePreviewLayout(120), { leftWidth: 50, rightWidth: 67 });
});

void test("padToWidth truncates long text to the requested display width", () => {
    assert.equal(stripAnsi(padToWidth("abcdefghijklmnopqrstuvwxyz", 8)), "abcde...");
});
