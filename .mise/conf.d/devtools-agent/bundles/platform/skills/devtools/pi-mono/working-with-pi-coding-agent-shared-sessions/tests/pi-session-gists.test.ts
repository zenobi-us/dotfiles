import { test, expect } from "bun:test";
const script = new URL("../scripts/pi-session-gists.ts", import.meta.url).pathname;
test("help is directly executable", async () => {
  const p = Bun.spawn([script, "--help"], { stdout: "pipe", stderr: "pipe" });
  expect(await new Response(p.stdout).text()).toContain("COMMANDS:");
  expect(await p.exited).toBe(0);
});
test("doctor reports prerequisites without credentials", async () => {
  const p = Bun.spawn([script, "doctor"], { stdout: "pipe" });
  expect(JSON.parse(await new Response(p.stdout).text())).toHaveProperty("bun");
  expect(await p.exited).toBe(0);
});
