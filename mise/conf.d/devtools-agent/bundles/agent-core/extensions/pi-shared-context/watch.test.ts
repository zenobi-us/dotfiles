import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DirectoryMonitor } from "./watch";

const cleanup: (() => Promise<void> | void)[] = [];
afterEach(async () => { for (const run of cleanup.splice(0).reverse()) await run(); });

// Native fs.watch events run outside fake timers; these integration cases use
// bounded platform-clock waits to exercise watcher delivery and reconciliation.
async function until(condition: () => boolean) {
  const deadline = Date.now() + 3_000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error("Timed out waiting for a filesystem update");
    await Bun.sleep(10);
  }
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "context-watch-"));
  cleanup.push(() => rm(root, { recursive: true, force: true }));
  return root;
}

test("directory watches discover missing paths, survive replacement, and drop old subscriptions", async () => {
  const root = await fixture();
  const events = join(root, "A/events");
  const changes: string[][] = [];
  const failures: unknown[] = [];
  const monitor = new DirectoryMonitor(keys => { changes.push([...keys]); }, error => failures.push(error), 80, 15);
  cleanup.push(() => monitor.dispose());
  monitor.setTargets([{ key: "A", path: events, recursive: true, suffixes: [".json"] }]);
  await until(() => changes.length > 0);
  changes.length = 0;
  await mkdir(events, { recursive: true });
  await writeFile(join(events, "receipt.json"), "{}");
  await until(() => changes.some(keys => keys.includes("A")));
  changes.length = 0;
  await writeFile(join(events, ".replacement"), "{\"status\":\"completed\"}");
  await rename(join(events, ".replacement"), join(events, "receipt.json"));
  await until(() => changes.some(keys => keys.includes("A")));
  changes.length = 0;
  await rm(events, { recursive: true });
  await mkdir(events);
  await writeFile(join(events, "new.json"), "{}");
  await until(() => changes.some(keys => keys.includes("A")));
  monitor.setTargets([{ key: "B", path: join(root, "B"), recursive: true }]);
  await until(() => changes.some(keys => keys.includes("B")));
  changes.length = 0;
  await writeFile(join(events, "unsubscribed.json"), "{}");
  await Bun.sleep(160);
  expect(changes).toEqual([]);
  monitor.dispose();
  await mkdir(join(root, "B"));
  await Bun.sleep(100);
  expect(changes).toEqual([]);
  expect(failures).toEqual([]);
});

test("changes arriving during refresh receive another serialized pass", async () => {
  const root = await fixture();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let calls = 0;
  let active = 0;
  let maxActive = 0;
  const failures: unknown[] = [];
  const monitor = new DirectoryMonitor(async () => {
    active++;
    maxActive = Math.max(maxActive, active);
    calls++;
    if (calls === 1) await gate;
    active--;
  }, error => failures.push(error), 50, 10);
  cleanup.push(() => { release(); monitor.dispose(); });
  monitor.setTargets([{ key: "events", path: root, recursive: true }]);
  await until(() => calls === 1);
  await writeFile(join(root, "during-refresh.json"), "{}");
  await Bun.sleep(40);
  release();
  await until(() => calls >= 2);
  expect(maxActive).toBe(1);
  expect(failures).toEqual([]);
});
