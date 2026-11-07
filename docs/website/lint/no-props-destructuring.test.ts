// Runs the real oxlint CLI on a fixture, because oxlint's RuleTester does not run under Bun.
import { expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const fixture = "lint/fixtures/props.tsx";

test("reports exactly the fixture lines marked `// error`", async () => {
  const source = await Bun.file(join(root, fixture)).text();
  const expected = source
    .split("\n")
    .flatMap((line, index) => (line.trimEnd().endsWith("// error") ? [index + 1] : []));

  const run = Bun.spawnSync(["node_modules/.bin/oxlint", "-c", "lint/fixtures/oxlintrc.json", "-f", "json", fixture], {
    cwd: root,
  });
  const report = JSON.parse(run.stdout.toString()) as {
    diagnostics: Array<{ code: string; labels: Array<{ span: { line: number } }> }>;
  };
  const reported = report.diagnostics
    .filter((diagnostic) => diagnostic.code === "local(no-props-destructuring)")
    .map((diagnostic) => diagnostic.labels[0]!.span.line)
    .toSorted((a, b) => a - b);

  expect(expected.length).toBeGreaterThan(0);
  expect(reported).toEqual(expected);
});
