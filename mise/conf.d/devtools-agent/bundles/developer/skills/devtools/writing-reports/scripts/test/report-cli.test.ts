// Exercise parser failures through the installed command boundary, outside the repository.
import { expect, test } from "bun:test";
import { resolve } from "node:path";

const cli = resolve(import.meta.dir, "../report-cli.ts");
async function invoke(args: string[]) {
  const child = Bun.spawn([cli, ...args], { cwd: "/tmp", stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { out, err, code };
}

for (const args of [
  ["evidence", "--json"],
  ["evidence", "/tmp/missing", "--unknown", "--json"],
  ["evidence", "/tmp/missing", "--historical=invalid", "--json"],
]) {
  test(`invalid evidence arguments emit one versioned error: ${args.join(" ")}`, async () => {
    const { out, err, code } = await invoke(args);
    expect(code).toBe(2);
    const record = JSON.parse(out);
    expect(record).toMatchObject({ schema: "collect-evidence/v1", kind: "error", success: false, code: 2 });
    expect(record.message).toBeTypeOf("string");
    expect(err.trim()).toBe(record.message);
  });
}

test("plain parser errors keep JSON off stdout", async () => {
  const result = await invoke(["evidence"]);
  expect(result.code).toBe(2);
  expect(result.out).toBe("");
  expect(result.err).toContain("directory");
});

test("help bypasses required arguments without an error envelope", async () => {
  const result = await invoke(["evidence", "--help", "--json"]);
  expect(result.code).toBe(0);
  expect(result.out).toContain("--historical");
  expect(result.err).toBe("");
});

test("other report commands retain their output and parser status", async () => {
  const doctor = await invoke(["doctor"]);
  expect(doctor.code).toBe(0);
  expect(JSON.parse(doctor.out).bun).toBe(Bun.version);
  expect(doctor.err).toBe("");
  const invalid = await invoke(["validate"]);
  expect(invalid.code).toBe(1);
  expect(invalid.out).toBe("");
  expect(invalid.err).toContain("page");
});
