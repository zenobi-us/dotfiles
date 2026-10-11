import { describe, expect, test } from "bun:test";
import { detectAgent } from "./session-context.ts";

describe("agent detection", () => {
  test("detects Claude from its marker", () => {
    expect(detectAgent(undefined, { CLAUDECODE: "1" })).toBe("claude");
  });

  test("detects Pi from either documented marker", () => {
    expect(detectAgent(undefined, { PI_CODING_AGENT: "true" })).toBe("pi");
    expect(detectAgent(undefined, { AI_AGENT: "pi" })).toBe("pi");
    expect(detectAgent(undefined, {
      PI_CODING_AGENT: "true",
      AI_AGENT: "pi",
    })).toBe("pi");
  });

  test("detects OMP from its marker", () => {
    expect(detectAgent(undefined, { OMPCODE: "1" })).toBe("omp");
  });

  test("returns unknown when environment markers conflict", () => {
    expect(detectAgent(undefined, {
      CLAUDECODE: "1",
      PI_CODING_AGENT: "true",
    })).toBe("unknown-agent");
    expect(detectAgent(undefined, {
      AI_AGENT: "pi",
      OMPCODE: "1",
    })).toBe("unknown-agent");
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
