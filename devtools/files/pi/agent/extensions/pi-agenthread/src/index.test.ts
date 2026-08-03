import { expect, test } from "bun:test";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import extension from "./index.js";
import { ZellijPublisher } from "./zellij.js";

function withExtension() {
  const handlers = new Map<string, Function>();
  const payloads: any[] = [];
  const previousPaneId = process.env.ZELLIJ_PANE_ID;
  const previousSession = process.env.ZELLIJ_SESSION_NAME;
  process.env.ZELLIJ_PANE_ID = "42";
  process.env.ZELLIJ_SESSION_NAME = "work";

  const proto = ZellijPublisher.prototype as unknown as {
    paneTabInfo: ZellijPublisher["paneTabInfo"];
    writeToStore: ZellijPublisher["writeToStore"];
    wakePlugin: ZellijPublisher["wakePlugin"];
    scheduleRefresh: ZellijPublisher["scheduleRefresh"];
  };
  const oldPaneTabInfo = proto.paneTabInfo;
  const oldWriteToStore = proto.writeToStore;
  const oldWakePlugin = proto.wakePlugin;
  const oldScheduleRefresh = proto.scheduleRefresh;
  proto.paneTabInfo = async () => undefined;
  proto.writeToStore = async (payload: string) => { payloads.push(JSON.parse(payload)); };
  proto.wakePlugin = async () => {};
  proto.scheduleRefresh = () => {};

  const pi = {
    on: (name: string, handler: Function) => { handlers.set(name, handler); },
    registerCommand: () => {},
  };
  extension(pi as any);

  const ctx = {
    cwd: "/tmp/project",
    model: { id: "test-model" },
    sessionManager: { getSessionFile: () => "/tmp/session.jsonl" },
    isIdle: () => false,
  } as ExtensionContext;

  return {
    handlers,
    payloads,
    ctx,
    cleanup() {
      proto.paneTabInfo = oldPaneTabInfo;
      proto.writeToStore = oldWriteToStore;
      proto.wakePlugin = oldWakePlugin;
      proto.scheduleRefresh = oldScheduleRefresh;
      if (previousPaneId === undefined) delete process.env.ZELLIJ_PANE_ID;
      else process.env.ZELLIJ_PANE_ID = previousPaneId;
      if (previousSession === undefined) delete process.env.ZELLIJ_SESSION_NAME;
      else process.env.ZELLIJ_SESSION_NAME = previousSession;
    },
  };
}

async function waitForPayload(payloads: any[], count = 1): Promise<void> {
  for (let i = 0; i < 50 && payloads.length < count; i += 1) await Bun.sleep(1);
}

test("agent_settled publishes idle with settlement metadata", async () => {
  const testbed = withExtension();
  try {
    testbed.handlers.get("agent_start")!({}, testbed.ctx);
    testbed.handlers.get("agent_end")!({ messages: [{ role: "assistant", stopReason: "stop" }] }, testbed.ctx);
    testbed.handlers.get("agent_settled")!({}, testbed.ctx);
    await waitForPayload(testbed.payloads, 3);

    expect(testbed.payloads.at(-1)).toMatchObject({
      state: "idle",
      activity: "settled",
      settled_reason: "finished",
    });
  } finally {
    testbed.cleanup();
  }
});

test("last tool remains visible while running after the active tool ends", async () => {
  const testbed = withExtension();
  try {
    testbed.handlers.get("agent_start")!({}, testbed.ctx);
    testbed.handlers.get("tool_execution_start")!({ toolCallId: "1", toolName: "bash" }, testbed.ctx);
    testbed.handlers.get("tool_execution_end")!({ toolCallId: "1", toolName: "bash", isError: false }, testbed.ctx);
    await waitForPayload(testbed.payloads, 3);

    expect(testbed.payloads.at(-1)).toMatchObject({
      state: "running",
      activity: "thinking",
      last_tool: "bash",
    });
  } finally {
    testbed.cleanup();
  }
});

test("question tools publish user-waiting activity", async () => {
  const testbed = withExtension();
  try {
    testbed.handlers.get("tool_execution_start")!({ toolCallId: "q", toolName: "question" }, testbed.ctx);
    await waitForPayload(testbed.payloads);

    expect(testbed.payloads.at(-1)).toMatchObject({
      state: "running",
      activity: "waiting_for_user",
      current_tool: "question",
      current_tool_kind: "user_question",
    });
  } finally {
    testbed.cleanup();
  }
});
