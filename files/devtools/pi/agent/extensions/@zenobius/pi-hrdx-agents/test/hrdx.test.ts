import { describe, expect, test } from "bun:test";
import { __hrdxTest__ } from "../pi-extension/subagents/hrdx.ts";

describe("hrdx transport helpers", () => {
	test("normalizes numeric pane IDs", () => {
		expect(__hrdxTest__.paneId(7)).toBe("7");
		expect(__hrdxTest__.paneId("8")).toBe("8");
	});

	test("finds panes in nested hrdx status", () => {
		const pane = __hrdxTest__.findPane({
			workspaces: [{ name: "repo", path: "/repo", tabs: [{ panes: [{ pane_id: 3, running: true, busy: true }] }] }],
		}, "3");
		expect(pane?.busy).toBe(true);
	});
});
