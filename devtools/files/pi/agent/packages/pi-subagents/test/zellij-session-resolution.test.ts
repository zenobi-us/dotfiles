import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveZellijRuntimeContextFromSnapshots } from "../src/mux/core.ts";

describe("Zellij session discovery", () => {
	it("ignores a stale inherited session name and resolves by pane cwd", () => {
		// Reproduces a renamed session where the process still names Bar while its
		// pane and working directory belong to Foo.
		const runtime = resolveZellijRuntimeContextFromSnapshots(
			1,
			"/workspace/Foo",
			[
				{
					name: "Bar",
					panes: [{ id: 1, pane_cwd: "/workspace/other" }],
					clientPaneIds: [],
				},
				{
					name: "Foo",
					panes: [{ id: 1, pane_cwd: "/workspace/Foo" }],
					clientPaneIds: [1],
				},
			],
		);

		assert.deepEqual(runtime, {
			sessionName: "Foo",
			parentPaneId: 1,
		});
	});

	it("resolves a non-focused child pane from the session pane list", () => {
		// Child agents are commonly not focused, so discovery must not require the
		// attached client's pane ID to equal the child pane ID.
		const runtime = resolveZellijRuntimeContextFromSnapshots(
			10,
			"/workspace/project",
			[
				{
					name: "Foo",
					panes: [
						{ id: 12, pane_cwd: "/workspace/project" },
						{ id: 10, pane_cwd: "/workspace/project" },
					],
					clientPaneIds: [12],
				},
			],
		);

		assert.equal(runtime.sessionName, "Foo");
	});

	it("rejects unresolved pane collisions", () => {
		// Guessing here could send keystrokes to an unrelated session. Ambiguous
		// identity must remain an explicit launch error.
		assert.throws(
			() =>
				resolveZellijRuntimeContextFromSnapshots(1, "/workspace/project", [
					{
						name: "Foo",
						panes: [{ id: 1, pane_cwd: "/other/one" }],
						clientPaneIds: [],
					},
					{
						name: "Bar",
						panes: [{ id: 1, pane_cwd: "/other/two" }],
						clientPaneIds: [],
					},
				]),
			/matches multiple sessions: Foo, Bar/,
		);
	});
});
