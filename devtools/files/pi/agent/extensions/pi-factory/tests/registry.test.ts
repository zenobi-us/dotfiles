import { test } from "node:test";
import assert from "node:assert/strict";
import { RunRegistry } from "../registry.js";
import type { RunSummary } from "../types.js";

function makeSummary(runId: string, status: RunSummary["status"] = "running"): RunSummary {
	return { runId, status, results: [] };
}

test("register and get", () => {
	const reg = new RunRegistry();
	const summary = makeSummary("r1");
	const abort = new AbortController();
	const promise = new Promise<RunSummary>(() => {});
	reg.register("r1", summary, promise, abort, { task: "test task" });

	const record = reg.get("r1");
	assert.ok(record);
	assert.equal(record.runId, "r1");
	assert.equal(record.status, "running");
	assert.equal(record.task, "test task");
});

test("register without meta", () => {
	const reg = new RunRegistry();
	reg.register("r1", makeSummary("r1"), new Promise(() => {}), new AbortController());

	const record = reg.get("r1");
	assert.ok(record);
	assert.equal(record.runId, "r1");
	assert.equal(record.task, undefined);
});

test("getVisible excludes acknowledged completed runs", () => {
	const reg = new RunRegistry();
	reg.register("r1", makeSummary("r1"), new Promise(() => {}), new AbortController());
	reg.register("r2", makeSummary("r2"), new Promise(() => {}), new AbortController());
	reg.complete("r2", { ...makeSummary("r2"), status: "done" });
	reg.acknowledge("r2");

	const visible = reg.getVisible();
	assert.equal(visible.length, 1);
	assert.equal(visible[0].runId, "r1");

	// getAll still returns everything
	assert.equal(reg.getAll().length, 2);
});

test("getActive filters running only", () => {
	const reg = new RunRegistry();
	reg.register("r1", makeSummary("r1"), new Promise(() => {}), new AbortController());
	reg.register("r2", makeSummary("r2"), new Promise(() => {}), new AbortController());
	reg.complete("r2", { ...makeSummary("r2"), status: "done" });

	assert.equal(reg.getActive().length, 1);
	assert.equal(reg.getActive()[0].runId, "r1");
});

test("complete sets status and completedAt", () => {
	const reg = new RunRegistry();
	reg.register("r1", makeSummary("r1"), new Promise(() => {}), new AbortController());
	reg.complete("r1", { ...makeSummary("r1"), status: "done" });

	const record = reg.get("r1");
	assert.ok(record);
	assert.equal(record.status, "done");
	assert.ok(record.completedAt);
});

test("complete preserves failed status from summary", () => {
	const reg = new RunRegistry();
	reg.register("r1", makeSummary("r1"), new Promise(() => {}), new AbortController());
	reg.complete("r1", { ...makeSummary("r1"), status: "failed", error: { code: "RUNTIME", message: "boom", recoverable: false } });

	const record = reg.get("r1");
	assert.ok(record);
	assert.equal(record.status, "failed");
	assert.equal(record.summary.status, "failed");
	assert.equal(record.summary.error?.message, "boom");
});

test("cancel aborts controller", () => {
	const reg = new RunRegistry();
	const abort = new AbortController();
	reg.register("r1", makeSummary("r1"), new Promise(() => {}), abort);
	reg.cancel("r1");

	assert.equal(abort.signal.aborted, true);
	assert.equal(reg.get("r1")?.status, "cancelled");
});

test("clear removes all runs", () => {
	const reg = new RunRegistry();
	reg.register("r1", makeSummary("r1"), new Promise(() => {}), new AbortController());
	reg.register("r2", makeSummary("r2"), new Promise(() => {}), new AbortController());
	reg.clear();

	assert.equal(reg.getAll().length, 0);
});

// Lifecycle (complete/fail) is managed by the caller, not by promise auto-update.
// See registry.complete() and registry.fail() tests above.
