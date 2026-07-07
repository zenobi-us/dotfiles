import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import test from "node:test"
import assert from "node:assert/strict"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const tscBin = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc")

test("public root and ./types exports compile for a consumer-style type import", () => {
  const sandbox = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-types-smoke-"))
  try {
    mkdirSync(path.join(sandbox, "node_modules"))
    symlinkSync(repoRoot, path.join(sandbox, "node_modules", "pi-hooks"), "dir")
    writeFileSync(
      path.join(sandbox, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
            skipLibCheck: true,
            noEmit: true,
          },
          files: ["index.ts"],
        },
        null,
        2,
      ),
    )
    writeFileSync(
      path.join(sandbox, "index.ts"),
      `import PiHooks, { type HookConfig, type HookEvent } from "pi-hooks";\nimport type { BashHookContext, SessionDeletedReason } from "pi-hooks/types";\n\nconst event: HookEvent = "session.deleted";\nconst reason: SessionDeletedReason = "quit";\nconst hook: HookConfig = {\n  event,\n  actions: [{ bash: "printf '%s\\n' \\\"$PI_SESSION_ID\\\"" }],\n  scope: "all",
  runIn: "current",
  source: { filePath: "consumer/hooks.yaml", index: 0 },\n};\nconst context = {} as BashHookContext;\nvoid PiHooks;\nvoid hook;\nvoid reason;\nvoid context;\n`,
      "utf8",
    )

    const result = spawnSync(process.execPath, [tscBin, "--project", path.join(sandbox, "tsconfig.json")], {
      cwd: sandbox,
      encoding: "utf8",
      timeout: 60_000,
    })

    assert.equal(result.status, 0, result.stdout + result.stderr)
  } finally {
    rmSync(sandbox, { recursive: true, force: true })
  }
})
