import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import { getPiHooksLogFilePath, getPiHooksLogger, resetPiHooksLoggerForTests } from "../core/logger.js"

interface Case {
  readonly name: string
  readonly run: () => { ok: boolean; detail?: string }
}

function withLoggerEnv<T>(
  options: { debug?: boolean; level?: string; logFile?: string },
  run: (logFile: string) => T,
): T {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-logger-"))
  const logFile = options.logFile ?? path.join(tempDir, "pi-hooks.ndjson")

  const previousDebug = process.env.PI_YAML_HOOKS_DEBUG
  const previousLogLevel = process.env.PI_YAML_HOOKS_LOG_LEVEL
  const previousLogFile = process.env.PI_YAML_HOOKS_LOG_FILE

  if (options.debug) process.env.PI_YAML_HOOKS_DEBUG = "1"
  else delete process.env.PI_YAML_HOOKS_DEBUG

  if (options.level !== undefined) process.env.PI_YAML_HOOKS_LOG_LEVEL = options.level
  else delete process.env.PI_YAML_HOOKS_LOG_LEVEL

  process.env.PI_YAML_HOOKS_LOG_FILE = logFile
  resetPiHooksLoggerForTests()

  try {
    return run(logFile)
  } finally {
    if (previousDebug === undefined) delete process.env.PI_YAML_HOOKS_DEBUG
    else process.env.PI_YAML_HOOKS_DEBUG = previousDebug

    if (previousLogLevel === undefined) delete process.env.PI_YAML_HOOKS_LOG_LEVEL
    else process.env.PI_YAML_HOOKS_LOG_LEVEL = previousLogLevel

    if (previousLogFile === undefined) delete process.env.PI_YAML_HOOKS_LOG_FILE
    else process.env.PI_YAML_HOOKS_LOG_FILE = previousLogFile

    resetPiHooksLoggerForTests()
    rmSync(tempDir, { recursive: true, force: true })
  }
}

function readLogLines(logFile: string): string[] {
  const content = readFileSync(logFile, "utf8")
  return content.trim().split("\n").filter(Boolean)
}

const cases: Case[] = [
  {
    name: "resolves log file path from environment override",
    run: () => withLoggerEnv({ debug: true }, (logFile) => {
      const resolved = getPiHooksLogFilePath()
      return resolved === logFile ? { ok: true } : { ok: false, detail: `resolved=${resolved} expected=${logFile}` }
    }),
  },
  {
    name: "filters out entries below configured log level",
    run: () => withLoggerEnv({ level: "warn" }, (logFile) => {
      const logger = getPiHooksLogger()
      logger.info("info_event", "should not be written")
      logger.warn("warn_event", "should be written")
      const lines = readLogLines(logFile)
      if (lines.length !== 1) return { ok: false, detail: `lines=${JSON.stringify(lines)}` }
      return lines[0]?.includes("warn_event") && !lines[0]?.includes("info_event")
        ? { ok: true }
        : { ok: false, detail: `line=${lines[0]}` }
    }),
  },
  {
    name: "refuses to write log when target path is a symlink",
    run: () => {
      const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-logger-symlink-"))
      const realTarget = path.join(tempDir, "real-elsewhere.log")
      const linkPath = path.join(tempDir, "pi-hooks.ndjson")

      writeFileSync(realTarget, "")
      try {
        symlinkSync(realTarget, linkPath)
      } catch (error) {
        // Some environments (e.g. restricted CI) cannot create symlinks; treat as skipped.
        rmSync(tempDir, { recursive: true, force: true })
        const message = error instanceof Error ? error.message : String(error)
        console.info(`SKIP  refuses symlink target — symlink unsupported: ${message}`)
        return { ok: true }
      }

      return withLoggerEnv({ debug: true, logFile: linkPath }, () => {
        const sizeBefore = readFileSync(realTarget, "utf8").length
        const previousWarn = console.warn
        let warnings = 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.warn = (..._args: any[]) => {
          warnings += 1
        }
        try {
          const logger = getPiHooksLogger()
          logger.info("symlink_test", "should not be written through symlink")
        } finally {
          console.warn = previousWarn
        }

        const sizeAfter = readFileSync(realTarget, "utf8").length
        rmSync(tempDir, { recursive: true, force: true })

        if (sizeBefore !== sizeAfter) {
          return { ok: false, detail: `wrote through symlink: before=${sizeBefore} after=${sizeAfter}` }
        }
        if (warnings === 0) {
          return { ok: false, detail: "expected a warning to be emitted on symlink refusal" }
        }
        return { ok: true }
      })
    },
  },
  {
    name: "creates log file with restrictive 0o600 permissions on first write",
    run: () => {
      if (process.platform === "win32") return { ok: true }
      return withLoggerEnv({ debug: true }, (logFile) => {
        const logger = getPiHooksLogger()
        logger.info("perm_test", "create file")
        if (!existsSync(logFile)) return { ok: false, detail: "log file not created" }
        const mode = statSync(logFile).mode & 0o777
        // Honor process umask: at minimum group/other must not be writable; we created with 0o600.
        if ((mode & 0o077) !== 0) {
          return { ok: false, detail: `expected 0o600-ish, got 0o${mode.toString(8)}` }
        }
        return { ok: true }
      })
    },
  },
  {
    name: "redacts sensitive strings and truncates large payloads",
    run: () => withLoggerEnv({ debug: true }, (logFile) => {
      const logger = getPiHooksLogger()
      const largeValue = "x".repeat(2500)
      logger.info("secret_event", "testing redaction", {
        details: {
          token: 'token="super-secret-value"',
          authorization: 'Authorization: Bearer top-secret-token',
          largeValue,
        },
      })
      const line = readLogLines(logFile)[0]
      if (!line) return { ok: false, detail: "no log line written" }
      const redactedToken = line.includes("[REDACTED]") && !line.includes("super-secret-value") && !line.includes("top-secret-token")
      const truncated = line.includes("[truncated")
      return redactedToken && truncated ? { ok: true } : { ok: false, detail: line }
    }),
  },
]

export function main(): number {
  let failures = 0
  for (const c of cases) {
    try {
      const outcome = c.run()
      if (outcome.ok) {
        console.info(`PASS  ${c.name}`)
      } else {
        failures += 1
        console.info(`FAIL  ${c.name} -- ${outcome.detail ?? "no detail"}`)
      }
    } catch (error) {
      failures += 1
      console.info(`FAIL  ${c.name} -- threw ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.info(`\n${cases.length - failures}/${cases.length} passed`)
  return failures === 0 ? 0 : 1
}

const invokedDirectly =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  /logger\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  const code = main()
  process.exit(code)
}
