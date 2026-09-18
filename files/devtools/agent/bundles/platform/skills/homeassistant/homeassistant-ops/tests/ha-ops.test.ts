import { test, expect } from "bun:test";
const script = new URL("../scripts/ha_ops.ts", import.meta.url).pathname;
test("help is directly executable", async () => {
  const p = Bun.spawn([script, "--help"], { stdout: "pipe" });
  expect(await new Response(p.stdout).text()).toContain("COMMANDS:");
  expect(await p.exited).toBe(0);
});
test("doctor does not expose token values", async () => {
  const p = Bun.spawn([script, "doctor"], { stdout: "pipe" },);
  const output = await new Response(p.stdout).text();
  expect(output).toContain('"HA_TOKEN": false');
  expect(await p.exited).toBe(0);
});
