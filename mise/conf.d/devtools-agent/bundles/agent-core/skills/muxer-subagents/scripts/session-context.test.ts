import { describe, expect, test } from "bun:test";
import { detectAgent } from "./session-context.ts";

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
