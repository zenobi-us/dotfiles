#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { stderr, stdin, stdout } from "node:process";
import {
  initializeSharedContext,
  listSharedContexts,
  migrateAlignmentContext,
  renderSharedContext,
  resolveSharedContext,
  type Exec,
  type SharedAgentContext,
} from "../lib";

type Frame = {
  type?: string;
  id?: string;
  name?: string;
  args?: string;
  cwd?: string;
  event?: string;
  system_prompt?: string;
};

function send(frame: object): void {
  stdout.write(`${JSON.stringify(frame)}\n`);
}

function log(message: string): void {
  stderr.write(`[zot-shared-context] ${message}\n`);
}

const exec: Exec = async (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8" });
  return { stdout: result.stdout ?? "", code: result.status ?? 1 };
};

function report(context: SharedAgentContext): string {
  return [
    `storage: ${context.storage}`,
    `root: ${context.root}`,
    `shared root: ${context.sharedRoot}`,
    ...(context.candidateSharedRoot && context.candidateSharedRoot !== context.sharedRoot
      ? [`shared candidate: ${context.candidateSharedRoot}`]
      : []),
    `origin: ${context.origin}`,
    `slug: ${context.slug}`,
  ].join("\n");
}

function commandResponse(id: string | undefined, display: string, error?: string): void {
  send({ type: "command_response", ...(id ? { id } : {}), action: "display", display, ...(error ? { error } : {}) });
}

async function handleCommand(frame: Frame, cwd: string): Promise<void> {
  const command = (frame.args ?? "").trim().split(/\s+/, 1)[0] || "report";

  if (command === "list") {
    const contexts = await listSharedContexts();
    commandResponse(
      frame.id,
      contexts.length > 0
        ? contexts.map((item) => `${item.slug}${item.storage ? ` [${item.storage}]` : ""}\n  ${item.root}`).join("\n")
        : "No shared engineering contexts found",
    );
    return;
  }

  const context = await resolveSharedContext(exec, cwd);
  if (!context) {
    commandResponse(frame.id, "No git repository with an origin remote found");
    return;
  }

  if (command === "init") {
    const { agents, created } = await initializeSharedContext(context);
    commandResponse(frame.id, created
      ? `Created ${agents}. Shared storage activates on the next agent turn.`
      : `${agents} already exists`);
    return;
  }

  if (command === "migrate") {
    try {
      const result = await migrateAlignmentContext(context);
      commandResponse(frame.id, `Copied ${result.copied.length} alignment path(s) to ${result.storage} storage:\n${result.copied.join("\n")}`);
    } catch (error) {
      commandResponse(frame.id, error instanceof Error ? error.message : String(error));
    }
    return;
  }

  if (command !== "report") {
    commandResponse(frame.id, `Unknown subcommand: ${command}`);
    return;
  }

  commandResponse(frame.id, report(context), context.error);
}

send({
  type: "hello",
  name: "shared-agent-context",
  version: "0.1.1",
  capabilities: ["commands", "events"],
});

let hostCwd = process.cwd();
const rl = createInterface({ input: stdin, crlfDelay: Infinity });

async function handleFrame(frame: Frame): Promise<void> {
  if (frame.type === "hello_ack") {
    hostCwd = frame.cwd || hostCwd;
    send({ type: "register_command", name: "eng-context", description: "Report, initialize, list, or migrate engineering context storage" });
    send({ type: "subscribe", intercept: ["before_agent_start"] });
    send({ type: "ready" });
    return;
  }

  if (frame.type === "event_intercept" && frame.event === "before_agent_start" && typeof frame.system_prompt === "string") {
    const context = await resolveSharedContext(exec, frame.cwd || hostCwd);
    send({
      type: "event_intercept_response",
      ...(frame.id ? { id: frame.id } : {}),
      ...(context ? { system_prompt: frame.system_prompt + renderSharedContext(context) } : {}),
    });
    return;
  }

  if (frame.type === "command_invoked" && frame.name?.toLowerCase() === "eng-context") {
    try {
      await handleCommand(frame, frame.cwd || hostCwd);
    } catch (error) {
      commandResponse(frame.id, error instanceof Error ? error.message : String(error));
    }
    return;
  }

  if (frame.type === "shutdown") {
    send({ type: "shutdown_ack" });
    rl.close();
  }
}

let pending = Promise.resolve();
rl.on("line", (line) => {
  pending = pending.then(async () => {
    let frame: Frame;
    try {
      frame = JSON.parse(line) as Frame;
    } catch (error) {
      log(`ignored invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    await handleFrame(frame);
  });
});
