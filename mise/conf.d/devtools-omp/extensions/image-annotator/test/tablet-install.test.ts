import { afterAll, beforeAll, expect, test } from "bun:test";
import { copyFile, lstat, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCoordinatorServer, type CoordinatorServer } from "../coordinator";

const tabletDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../tablet-client");
let sandbox = "";
let bundleDirectory = "";
let coordinator: CoordinatorServer | undefined;

beforeAll(async () => {
  sandbox = await mkdtemp(join(tmpdir(), "pi-ink-install-test-"));
  bundleDirectory = join(sandbox, "bundle");
  await mkdir(bundleDirectory);
  await copyFile(join(tabletDirectory, "install.sh"), join(bundleDirectory, "install.sh"));
  await writeFile(join(bundleDirectory, "VERSION"), "development\n");
  const build = await runCommand(["go", "build", "-o", join(bundleDirectory, "pi-ink-client"), "."]);
  if (build.code !== 0) throw new Error(`Cannot build native test client: ${build.stderr}`);
  coordinator = await createCoordinatorServer({ bundleDirectory, port: 0 });
}, 120_000);

afterAll(async () => {
  await coordinator?.close();
  if (sandbox) await rm(sandbox, { recursive: true, force: true });
});

test("installs a usable coordinator URL and rejects an incompatible URL before creating its prefix", async () => {
  if (!coordinator) throw new Error("Test coordinator did not start.");
  const usablePrefix = join(sandbox, "usable");
  const install = await runCommand([
    "sh", join(bundleDirectory, "install.sh"), "--prefix", usablePrefix,
    "--coordinator-url", coordinator.url,
  ]);
  expect(install.code).toBe(0);
  const status = await runCommand([join(usablePrefix, "pi-ink-client"), "status"]);
  expect(status.code).toBe(0);
  expect(JSON.parse(status.stdout)).toEqual({ service: "image-annotator", status: "ok", protocol: 1 });

  const rejectedPrefix = join(sandbox, "rejected");
  const incompatible = await runCommand([
    "sh", join(bundleDirectory, "install.sh"), "--prefix", rejectedPrefix,
    "--coordinator-url", `${coordinator.url}/?x=1`,
  ]);
  expect(incompatible.code).not.toBe(0);
  await expect(lstat(rejectedPrefix)).rejects.toMatchObject({ code: "ENOENT" });
}, 30_000);

async function runCommand(args: string[]) {
  const child = Bun.spawn(args, { cwd: tabletDirectory, stdout: "pipe", stderr: "pipe", timeout: 120_000 });
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ]);
  return { code, stdout, stderr };
}
