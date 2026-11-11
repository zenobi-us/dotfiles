// Node's VM modules isolate the native imports without changing the shipped panel code.
import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

test("native panel response ordering and retained directory behavior", () => {
  const result = Bun.spawnSync(["node", "--experimental-vm-modules", "--test", fileURLToPath(new URL("./panel-state.fixture.mjs", import.meta.url))]);
  const output = `${result.stdout.toString()}${result.stderr.toString()}`;
  expect(output).toContain("# fail 0");
  expect(result.exitCode).toBe(0);
});
