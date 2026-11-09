// A saved discovery choice must not point to a different coordinator after restart or damaged state.
import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCoordinatorIdentity } from "../server-identity";

let directory = "";
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "omp-coordinator-id-")); });
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

test("retains the coordinator identity across subsequent starts", async () => {
  const original = await loadCoordinatorIdentity(directory);
  expect(original).toMatch(/^[a-f0-9]{32}$/);
  expect(await loadCoordinatorIdentity(directory)).toBe(original);
});

test("refuses damaged identity state without replacing it", async () => {
  const path = join(directory, "coordinator-id");
  await writeFile(path, "damaged identity\n");
  await expect(loadCoordinatorIdentity(directory)).rejects.toBeInstanceOf(Error);
  expect(await readFile(path, "utf8")).toBe("damaged identity\n");
});
