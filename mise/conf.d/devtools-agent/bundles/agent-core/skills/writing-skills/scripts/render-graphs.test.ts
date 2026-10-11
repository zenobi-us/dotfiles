import { expect, test } from "bun:test";
import path from "node:path";
import { combineGraphs, extractDotBlocks } from "./render-graphs";

const script = path.join(import.meta.dir, "render-graphs.js");

test("direct script help exits successfully", () => {
  const result = Bun.spawnSync([script, "--help"], { stdout: "pipe", stderr: "pipe" });
  expect(result.exitCode).toBe(0);
  expect(Buffer.from(result.stdout).toString()).toContain("combine");
});

test("extracts and combines named dot blocks", () => {
  const blocks = extractDotBlocks("```dot\ndigraph first { A -> B; }\n```\n```dot\ndigraph second { B -> C; }\n```");
  expect(blocks.map((block) => block.name)).toEqual(["first", "second"]);
  expect(combineGraphs(blocks, "example")).toContain("subgraph cluster_1");
});
