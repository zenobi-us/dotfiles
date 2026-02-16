import { test } from "node:test";
import assert from "node:assert/strict";
import { createProgramRuntime } from "../runtime.js";
import { ObservabilityStore } from "../observability.js";
import { FactoryError } from "../errors.js";

test("rt.join rejects non-handle input with clear hint", () => {
	const rt = createProgramRuntime({} as any, "r1", new ObservabilityStore());

	assert.throws(
		() => (rt as any).join({ taskId: "task-1", text: "ok" }),
		(err: unknown) => {
			assert.ok(err instanceof FactoryError);
			assert.equal(err.details.code, "INVALID_INPUT");
			assert.match(err.details.message, /rt\.join\(\) expects a SpawnHandle/);
			assert.match(err.details.message, /awaited rt\.spawn\(\)/);
			return true;
		},
	);
});

test("rt.join rejects invalid handle arrays", () => {
	const rt = createProgramRuntime({} as any, "r1", new ObservabilityStore());

	assert.throws(
		() => (rt as any).join([{ taskId: "task-1" }]),
		(err: unknown) => {
			assert.ok(err instanceof FactoryError);
			assert.equal(err.details.code, "INVALID_INPUT");
			assert.match(err.details.message, /SpawnHandle\[]/);
			return true;
		},
	);
});
