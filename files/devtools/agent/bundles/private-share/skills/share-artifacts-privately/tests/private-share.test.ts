import { test, expect } from "bun:test";
const script = new URL("../scripts/private-share.ts", import.meta.url).pathname;
test("help is directly executable", async () => {
  const p = Bun.spawn([script, "--help"], { stdout: "pipe" });
  expect(await new Response(p.stdout).text()).toContain("COMMANDS:");
  expect(await p.exited).toBe(0);
});
test("self-test preserves its output contract", async () => {
  const p = Bun.spawn([script, "self-test"], { stdout: "pipe" });
  expect(await new Response(p.stdout).text()).toContain("private-share self-test: ok");
  expect(await p.exited).toBe(0);
});
