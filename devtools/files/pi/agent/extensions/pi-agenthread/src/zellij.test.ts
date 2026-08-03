import { expect, test } from "bun:test";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { LogService } from "./log.js";
import type { StatusWidget } from "./status.js";
import { parsePaneTabInfo, pipeArgs, ZellijPublisher } from "./zellij.js";

test("publisher wakes without launching a plugin", () => {
  expect(pipeArgs("payload")).toEqual([
    "pipe",
    "--name",
    "agenthreads:refresh",
    "--",
    "payload",
  ]);
});

test("parsePaneTabInfo ignores empty zellij output", () => {
  expect(parsePaneTabInfo("", "1")).toBeUndefined();
});

test("parsePaneTabInfo ignores invalid zellij output", () => {
  expect(parsePaneTabInfo("{", "1")).toBeUndefined();
});

test("parsePaneTabInfo returns matching terminal pane", () => {
  expect(parsePaneTabInfo(JSON.stringify([
    { id: 1, is_plugin: true },
    { id: 1, is_plugin: false, tab_name: "tab", title: "pi" },
  ]), "1")).toEqual({ id: 1, is_plugin: false, tab_name: "tab", title: "pi" });
});

test("publisher serializes publish snapshots", async () => {
  const previousPaneId = process.env.ZELLIJ_PANE_ID;
  const previousSession = process.env.ZELLIJ_SESSION_NAME;
  try {
    process.env.ZELLIJ_PANE_ID = "42";
    process.env.ZELLIJ_SESSION_NAME = "work";
    const payloads: string[] = [];
    const gates: Array<() => void> = [];
    const publisher = new ZellijPublisher(
      { update() {} } as unknown as StatusWidget,
      { trace: async () => {} } as unknown as LogService,
    );
    publisher.paneTabInfo = async () => new Promise((resolve) => {
      gates.push(() => resolve(undefined));
    });
    publisher.writeToStore = async (value) => { payloads.push(value); };
    publisher.wakePlugin = async () => {};
    const ctx = {
      cwd: "/tmp/project",
      sessionManager: { getSessionFile: () => "/tmp/session.jsonl" },
    } as ExtensionContext;

    const first = publisher.publish(ctx, "running");
    const second = publisher.publish(ctx, "idle");

    await Promise.resolve();
    expect(gates).toHaveLength(1);
    gates[0]!();
    await first;
    await Promise.resolve();
    expect(gates).toHaveLength(2);
    gates[1]!();
    await second;

    expect(payloads.map((payload) => JSON.parse(payload).state)).toEqual(["running", "idle"]);
  } finally {
    if (previousPaneId === undefined) delete process.env.ZELLIJ_PANE_ID;
    else process.env.ZELLIJ_PANE_ID = previousPaneId;
    if (previousSession === undefined) delete process.env.ZELLIJ_SESSION_NAME;
    else process.env.ZELLIJ_SESSION_NAME = previousSession;
  }
});

test("publisher skips store writes outside zellij", async () => {
  let wrote = false;
  let woke = false;
  const previousPaneId = process.env.ZELLIJ_PANE_ID;
  const previousSession = process.env.ZELLIJ_SESSION_NAME;
  try {
    delete process.env.ZELLIJ_PANE_ID;
    delete process.env.ZELLIJ_SESSION_NAME;
    const publisher = new ZellijPublisher(
      { update() {} } as unknown as StatusWidget,
      { trace: async () => {} } as unknown as LogService,
    );
    publisher.writeToStore = async () => { wrote = true; };
    publisher.wakePlugin = async () => { woke = true; };

    await publisher.publish({
      cwd: "/tmp/project",
      sessionManager: { getSessionFile: () => "/tmp/session.jsonl" },
    } as ExtensionContext, "running");

    expect(wrote).toBe(false);
    expect(woke).toBe(false);
  } finally {
    if (previousPaneId === undefined) delete process.env.ZELLIJ_PANE_ID;
    else process.env.ZELLIJ_PANE_ID = previousPaneId;
    if (previousSession === undefined) delete process.env.ZELLIJ_SESSION_NAME;
    else process.env.ZELLIJ_SESSION_NAME = previousSession;
  }
});

test("publisher deletes store row on shutdown", async () => {
  let command: { payload: string; agentId: string; state: string } | undefined;
  const previousPaneId = process.env.ZELLIJ_PANE_ID;
  const previousSession = process.env.ZELLIJ_SESSION_NAME;
  try {
    process.env.ZELLIJ_PANE_ID = "42";
    process.env.ZELLIJ_SESSION_NAME = "work";
    const publisher = new ZellijPublisher(
      { update() {} } as unknown as StatusWidget,
      { trace: async () => {} } as unknown as LogService,
    );
    publisher.paneTabInfo = async () => undefined;
    publisher.writeToStore = async (payload, agentId, state) => { command = { payload, agentId, state }; };
    publisher.wakePlugin = async () => {};

    await publisher.publish({
      cwd: "/tmp/project",
      sessionManager: { getSessionFile: () => "/tmp/session.jsonl" },
    } as ExtensionContext, "shutdown");

    expect(command).toMatchObject({ agentId: "work:42", state: "shutdown" });
  } finally {
    if (previousPaneId === undefined) delete process.env.ZELLIJ_PANE_ID;
    else process.env.ZELLIJ_PANE_ID = previousPaneId;
    if (previousSession === undefined) delete process.env.ZELLIJ_SESSION_NAME;
    else process.env.ZELLIJ_SESSION_NAME = previousSession;
  }
});

test("publisher sends active tools using the current_tool protocol field", async () => {
  let payload = "";
  const previousPaneId = process.env.ZELLIJ_PANE_ID;
  const previousSession = process.env.ZELLIJ_SESSION_NAME;
  try {
    process.env.ZELLIJ_PANE_ID = "42";
    process.env.ZELLIJ_SESSION_NAME = "work";
    const publisher = new ZellijPublisher(
      { update() {} } as unknown as StatusWidget,
      { trace: async () => {} } as unknown as LogService,
    );
    publisher.paneTabInfo = async () => undefined;
    publisher.writeToStore = async (value) => { payload = value; };
    publisher.wakePlugin = async () => {};
    publisher.update({ currentTool: "bash" });

    await publisher.publish({
      cwd: "/tmp/project",
      model: { id: "test-model" },
      sessionManager: { getSessionFile: () => "/tmp/session.jsonl" },
    } as ExtensionContext);

    expect(JSON.parse(payload)).toMatchObject({
      version: 2,
      agent_id: "work:42",
      session_name: "/tmp/session.jsonl",
      current_tool: "bash",
    });
    expect(JSON.parse(payload)).not.toHaveProperty("session");
    expect(JSON.parse(payload)).not.toHaveProperty("current_task");

    publisher.update({ currentTool: undefined });
    await publisher.publish({
      cwd: "/tmp/project",
      model: { id: "test-model" },
      sessionManager: { getSessionFile: () => "/tmp/session.jsonl" },
    } as ExtensionContext);

    expect(JSON.parse(payload)).not.toHaveProperty("current_tool");
  } finally {
    if (previousPaneId === undefined) delete process.env.ZELLIJ_PANE_ID;
    else process.env.ZELLIJ_PANE_ID = previousPaneId;
    if (previousSession === undefined) delete process.env.ZELLIJ_SESSION_NAME;
    else process.env.ZELLIJ_SESSION_NAME = previousSession;
  }
});
