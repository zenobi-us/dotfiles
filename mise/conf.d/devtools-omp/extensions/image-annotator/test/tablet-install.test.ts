// Protects existing tablet installations from initial provisioning.
import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const tabletDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../tablet-client");
let sandbox = "";

beforeAll(async () => {
  sandbox = await mkdtemp(join(tmpdir(), "pi-ink-install-test-"));
});

afterAll(async () => {
  if (sandbox) await rm(sandbox, { recursive: true, force: true });
});

test("refuses an occupied installation without changing its existing data", async () => {
  const prefix = join(sandbox, "occupied");
  await mkdir(prefix);
  const existingData = Buffer.from([0, 255, 10, 13, 42]);
  await writeFile(join(prefix, "annotations.bin"), existingData);
  const install = await runCommand(["sh", join(tabletDirectory, "install.sh"), "--prefix", prefix]);

  expect(install.code).not.toBe(0);
  expect(await readdir(prefix)).toEqual(["annotations.bin"]);
  expect(await readFile(join(prefix, "annotations.bin"))).toEqual(existingData);
});

async function runCommand(args: string[]) {
  const child = Bun.spawn(args, { cwd: tabletDirectory, stdout: "pipe", stderr: "pipe", timeout: 120_000 });
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ]);
  return { code, stdout, stderr };
}
