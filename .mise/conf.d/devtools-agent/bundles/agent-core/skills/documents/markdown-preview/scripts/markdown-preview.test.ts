import { expect, test } from "bun:test";
import path from "node:path";

const script = path.join(import.meta.dir, "markdown-preview.js");

test("direct script help exits successfully", () => {
  const result = Bun.spawnSync([script, "--help"], { stdout: "pipe", stderr: "pipe" });
  expect(result.exitCode).toBe(0);
  expect(Buffer.from(result.stdout).toString()).toContain("preview");
});

test("rendered HTML preserves escaped Markdown", async () => {
  const { htmlDocument } = await import("./markdown-preview.js");
  expect(htmlDocument("# Hello\n\nUse <safe> & rules")).toContain("<h1>Hello</h1>");
  expect(htmlDocument("# Hello\n\nUse <safe> & rules")).toContain("&lt;safe&gt; &amp; rules");
});
