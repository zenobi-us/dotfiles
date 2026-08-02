import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { LogService, logIdForContext, safeLogId } from "./log.js";

test("safeLogId strips path-hostile characters", () => {
  expect(safeLogId("/tmp/pi/session 1.json")).toBe("tmp_pi_session_1.json");
});

test("log service namespaces file by pi session", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pi-zellij-log-test-"));
  try {
    const log = new LogService(dir);
    log.updateSession(ctx("/tmp/pi/abc.json"));
    await log.trace("first");
    expect(log.file).toBe(join(dir, "abc.json.log"));
    expect(await readFile(log.file, "utf8")).toContain("trace first");

    log.updateSession(ctx("/tmp/pi/def.json"));
    await log.debug("second");
    expect(log.file).toBe(join(dir, "def.json.log"));
    expect(await readFile(log.file, "utf8")).toContain("debug second");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("logIdForContext uses session file basename", () => {
  expect(logIdForContext(ctx("/tmp/pi/sessions/id.json"))).toBe("id.json");
});

function ctx(sessionFile: string) {
  return {
    cwd: "/tmp/project",
    sessionManager: { getSessionFile: () => sessionFile },
  } as never;
}
