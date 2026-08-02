import { beforeEach, describe, expect, test } from "bun:test";

import {
	buildBackgroundTaskActivity,
	publishBackgroundTaskActivity,
	publishBackgroundTaskStarted,
	type PiActivityEvent,
} from "../activity.js";
import type { ManagedTask } from "../types.js";

const BROKER_SYMBOL = Symbol.for("vstack.pi.activity");

function task(overrides: Partial<ManagedTask> = {}): ManagedTask {
	return {
		child: null,
		closed: false,
		command: "printf ready",
		cwd: "/repo",
		exitCode: null,
		exitNotified: false,
		expiresAt: null,
		forceKillTimer: null,
		id: "bg-7",
		lastAnnouncedLength: 0,
		lastOutputAt: 1_700_000_001_000,
		logFile: "/tmp/bg-7.log",
		matcher: null,
		notifyMode: "always",
		notifyOnExit: true,
		notifyOnOutput: true,
		output: "ready\n",
		outputBytes: 6,
		outputPatternMatched: false,
		outputTimer: null,
		pendingWakes: [],
		pid: 4242,
		startedAt: 1_700_000_000_000,
		status: "running",
		stopReason: null,
		timeoutTimer: null,
		title: "printf ready",
		updatedAt: 1_700_000_001_000,
		voidedWakeSequences: [],
		voidedWakes: new Set(),
		wakeEvents: [],
		wakeSequence: 0,
		...overrides,
	} as ManagedTask;
}

function installBroker(): PiActivityEvent[] {
	const events: PiActivityEvent[] = [];
	(globalThis as unknown as Record<PropertyKey, unknown>)[BROKER_SYMBOL] = {
		publish(event: PiActivityEvent) { events.push(event); },
	};
	return events;
}

beforeEach(() => {
	delete (globalThis as unknown as Record<PropertyKey, unknown>)[BROKER_SYMBOL];
});

describe("background task activity", () => {
	test("start/output/exit publish broker events", () => {
		const events = installBroker();
		const running = task();
		publishBackgroundTaskStarted(running);
		publishBackgroundTaskActivity("output", running, { matchedPattern: "ready", newOutputTail: "ready\n", sequence: 2 });
		publishBackgroundTaskActivity("exit", task({ exitCode: 0, status: "completed", updatedAt: 1_700_000_002_000 }), { sequence: 3 });

		expect(events.map((event) => event.type)).toEqual(["bg_task.started", "bg_task.output_matched", "bg_task.completed"]);
		expect(events[0]).toMatchObject({ importance: "noisy", refs: { bg_task_id: "bg-7" }, severity: "info", source: "pi-bg-task" });
		expect(events[1]?.details).toMatchObject({ matched_pattern: "ready", new_output_tail: "ready\n", sequence: 2 });
		expect(events[2]).toMatchObject({ importance: "normal", severity: "success" });
	});

	test.each([
		["completed", "bg_task.completed", "success", "normal"],
		["failed", "bg_task.failed", "error", "important"],
		["timed_out", "bg_task.timed_out", "error", "important"],
		["stopped", "bg_task.stopped", "warning", "important"],
	] as const)("exit status %s maps to %s", (status, type, severity, importance) => {
		const event = buildBackgroundTaskActivity("exit", task({ status, exitCode: status === "completed" ? 0 : 1 }), { sequence: 4 });
		expect(event).toMatchObject({ importance, severity, type });
		expect(event.details).toMatchObject({ exit_code: status === "completed" ? 0 : 1, sequence: 4, status });
	});

	test("details.command is truncated to 200 chars", () => {
		const longCommand = "x".repeat(260);
		const event = buildBackgroundTaskActivity("start", task({ command: longCommand }), { sequence: 0 });
		expect((event.details?.command as string).length).toBe(200);
		expect(event.details?.command).toBe("x".repeat(200));
	});
});
