import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectAgent, sessionMetadata } from "./session-context.ts";

describe("agent detection", () => {
  test("detects each agent from its marker", () => {
    expect(detectAgent(undefined, { OMPCODE: "1" })).toBe("omp");
    expect(detectAgent(undefined, { PI_CODING_AGENT: "true" })).toBe("pi");
    expect(detectAgent(undefined, { AI_AGENT: "pi" })).toBe("pi");
    expect(detectAgent(undefined, { AGENT: "zot" })).toBe("zot");
    expect(detectAgent(undefined, { AGENT: "codex" })).toBe("codex");
    expect(detectAgent(undefined, { CLAUDECODE: "1" })).toBe("claude");
  });

  test("uses the requested priority when agent markers overlap", () => {
    expect(detectAgent(undefined, {
      OMPCODE: "1",
      PI_CODING_AGENT: "true",
      AGENT: "zot",
      CLAUDECODE: "1",
    })).toBe("omp");
    expect(detectAgent(undefined, {
      PI_CODING_AGENT: "true",
      AGENT: "zot",
      CLAUDECODE: "1",
    })).toBe("pi");
    expect(detectAgent(undefined, {
      AGENT: "zot",
      CLAUDECODE: "1",
    })).toBe("zot");
    expect(detectAgent(undefined, {
      AGENT: "codex",
      CLAUDECODE: "1",
    })).toBe("codex");
  });

  test("uses explicit caller identity over conflicting environment markers", () => {
    expect(detectAgent("omp", {
      CLAUDECODE: "1",
      PI_CODING_AGENT: "true",
    })).toBe("omp");
  });

  test("returns unknown when no marker identifies an agent", () => {
    expect(detectAgent(undefined, {})).toBe("unknown-agent");
  });
});

describe("explicit session delivery metadata", () => {
  const saved = { ...process.env };
  let directory: string | undefined;

  afterEach(() => {
    for (const key of ["RESULT_DELIVERY_CONTEXT", "MUXER_SUBAGENT_RUN_ID", "MUXER_SUBAGENT_PARENT_RUN_ID", "MUXER_SUBAGENT_ROLE", "MUXER_SUBAGENT_DEPTH"]) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    if (directory) rmSync(directory, { recursive: true, force: true });
    directory = undefined;
  });

  test("reads assigned context identities without inferring role from depth", () => {
    directory = mkdtempSync(join(tmpdir(), "muxer-session-test-"));
    const contextFile = join(directory, "context.json");
    writeFileSync(contextFile, JSON.stringify({
      schema: "result-delivery/v1", kind: "context", audience: "agent", mode: "artifact-reference",
      runId: "assigned-run", operationId: "assigned-operation",
      target: { path: join(directory, "result.json"), ref: "artifact://assigned", schema: "test-result/v1" },
    }));
    process.env.RESULT_DELIVERY_CONTEXT = contextFile;
    process.env.MUXER_SUBAGENT_DEPTH = "2";
    delete process.env.MUXER_SUBAGENT_RUN_ID;
    delete process.env.MUXER_SUBAGENT_ROLE;
    process.env.MUXER_SUBAGENT_PARENT_RUN_ID = "parent";
    expect(sessionMetadata()).toMatchObject({
      role: "unspecified", runId: "assigned-run", operationId: "assigned-operation", parentRunId: "parent", contextFile,
    });
    process.env.MUXER_SUBAGENT_ROLE = "child";
    process.env.MUXER_SUBAGENT_RUN_ID = "muxer-run";
    expect(sessionMetadata()).toMatchObject({ role: "child", runId: "muxer-run" });
  });

  test("rejects relative and invalid explicit context instead of silently downgrading", () => {
    process.env.RESULT_DELIVERY_CONTEXT = "context.json";
    expect(() => sessionMetadata()).toThrow("absolute");
    directory = mkdtempSync(join(tmpdir(), "muxer-session-test-"));
    const contextFile = join(directory, "context.json");
    writeFileSync(contextFile, '{"schema":"not-delivery"}');
    process.env.RESULT_DELIVERY_CONTEXT = contextFile;
    expect(() => sessionMetadata()).toThrow();
  });
});
