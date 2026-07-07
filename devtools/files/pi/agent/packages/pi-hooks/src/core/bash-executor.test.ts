import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  buildBashEnvironment,
  executeBashHook,
  redactSensitiveContent,
  resetExecutionContextCacheForTests,
  resolveExecutionContext,
  serializeContextForStdin,
  setExecutionContextNowForTests,
  trimToUtf8Boundary,
} from "./bash-executor.js"
import { TIMEOUT_EXIT_CODE } from "./bash-types.js"
import {
  flushPiHooksLoggerForTests,
  getPiHooksLoggerDrainCountForTests,
  getPiHooksLogger,
  resetPiHooksLoggerForTests,
} from "./logger.js"

interface Case {
  readonly name: string
  readonly run: () => Promise<{ ok: boolean; detail?: string }>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isProcessAlive(pid: number): boolean {
  // process.kill(pid, 0) returns true for zombies (the kernel keeps the entry
  // around until the parent waits on it). For our tests "the process is no
  // longer running" is the relevant predicate, so we explicitly classify
  // state Z as dead by inspecting /proc on Linux and `ps -o stat` on macOS.
  try {
    process.kill(pid, 0)
  } catch {
    return false
  }

  const state = readProcessState(pid)
  if (state === undefined) {
    // We couldn't read the state — fall back to the kill(0) result, which
    // means the kernel still has an entry for this pid.
    return true
  }
  // Z = zombie, X = dead. Anything else (R, S, D, T, ...) is "still around".
  return state !== "Z" && state !== "X"
}

function readProcessState(pid: number): string | undefined {
  if (process.platform === "linux") {
    try {
      const raw = readFileSync(`/proc/${pid}/stat`, "utf8")
      // Format: "<pid> (comm) <state> ..." — comm can contain spaces and
      // close-paren so look for the LAST close-paren and read the next field.
      const lastParen = raw.lastIndexOf(")")
      if (lastParen < 0) return undefined
      const after = raw.slice(lastParen + 1).trim()
      const stateChar = after.split(/\s+/)[0]
      return stateChar?.charAt(0)
    } catch {
      return undefined
    }
  }
  if (process.platform === "darwin") {
    try {
      const raw = execFileSync("ps", ["-o", "stat=", "-p", String(pid)], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      })
      const trimmed = raw.trim()
      if (!trimmed) return undefined
      // macOS ps state codes start with one of R, S, I, T, U, Z. Take the
      // first character so we ignore modifiers like '+' and 'N'.
      return trimmed.charAt(0)
    } catch {
      return undefined
    }
  }
  return undefined
}

async function waitForNonEmptyFile(filePath: string, timeoutMs: number): Promise<string | undefined> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if (existsSync(filePath)) {
        const contents = readFileSync(filePath, "utf8").trim()
        if (contents.length > 0) return contents
      }
    } catch {
      // ignore — keep polling
    }
    await sleep(50)
  }
  return undefined
}

function expectRedacted(input: string, mustNotContain: string[]): { ok: boolean; detail?: string } {
  const out = redactSensitiveContent(input)
  for (const needle of mustNotContain) {
    if (out.includes(needle)) {
      return { ok: false, detail: `expected no '${needle}' in ${JSON.stringify(out)}` }
    }
  }
  if (!out.includes("[REDACTED]")) {
    return { ok: false, detail: `expected '[REDACTED]' marker in ${JSON.stringify(out)}` }
  }
  return { ok: true }
}

const cases: Case[] = [
  {
    name: "redacts GitHub personal access tokens (ghp_)",
    run: async () => expectRedacted("token=ghp_abcdefghijklmnopqrstuvwxyz0123456789", ["ghp_abcdefghijklmnopqrstuvwxyz0123456789"]),
  },
  {
    name: "redacts GitHub fine-grained PATs (github_pat_)",
    run: async () => expectRedacted("github_pat_11ABCDEFG0_abcdefghijklmnopqrstuvwxyz0123456789", ["abcdefghijklmnopqrstuvwxyz0123456789"]),
  },
  {
    name: "redacts GitLab personal access tokens (glpat-)",
    run: async () => expectRedacted("export FOO=glpat-abcdefghijklmnop1234", ["glpat-abcdefghijklmnop1234"]),
  },
  {
    name: "redacts Slack bot tokens (xoxb-)",
    run: async () => expectRedacted("slack=xoxb-1234567890-1234567890-AbCdEfGhIjKlMnOp", ["xoxb-1234567890-1234567890-AbCdEfGhIjKlMnOp"]),
  },
  {
    name: "redacts Slack user tokens (xoxp-)",
    run: async () => expectRedacted("xoxp-9876543210-fakeslackuserstring", ["xoxp-9876543210-fakeslackuserstring"]),
  },
  {
    name: "redacts Slack admin/legacy app tokens (xoxa-)",
    run: async () => expectRedacted("xoxa-2-foobarbazsecret123", ["foobarbazsecret123"]),
  },
  {
    name: "redacts basic-auth URLs (https://user:pass@host)",
    run: async () => expectRedacted("connecting to https://alice:hunter2@example.com/path", ["hunter2"]),
  },
  {
    name: "redacts basic-auth in postgres://user:pass@host",
    run: async () => expectRedacted("DB=postgres://user:supersecretpw@db.example.com:5432/x", ["supersecretpw"]),
  },
  {
    name: "redacts JWT (three base64url segments separated by dots)",
    run: async () => expectRedacted(
      "auth=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      ["SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"],
    ),
  },
  {
    name: "redacts uppercase env-style names ending in TOKEN/SECRET/KEY/PASSWORD",
    run: async () => {
      const cases = [
        "GITHUB_TOKEN=abcdef12345",
        "AWS_SECRET_ACCESS_KEY=verysecretvalue",
        "MY_API_KEY=zxc987",
        "DATABASE_PASSWORD=p@ssw0rd",
      ]
      for (const input of cases) {
        const out = redactSensitiveContent(input)
        if (out.includes("abcdef12345") || out.includes("verysecretvalue") || out.includes("zxc987") || out.includes("p@ssw0rd")) {
          return { ok: false, detail: `leak in ${input} -> ${out}` }
        }
        if (!out.includes("[REDACTED]")) {
          return { ok: false, detail: `no marker in ${out}` }
        }
      }
      return { ok: true }
    },
  },
  {
    name: "redacts PEM private key blocks",
    run: async () => {
      const pem = [
        "-----BEGIN PRIVATE KEY-----",
        "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj",
        "MZeBESxhfakekeymaterialfortest==",
        "-----END PRIVATE KEY-----",
      ].join("\n")
      const out = redactSensitiveContent(`prefix\n${pem}\nsuffix`)
      if (out.includes("fakekeymaterialfortest")) {
        return { ok: false, detail: `leaked PEM body: ${out}` }
      }
      if (!out.includes("[REDACTED]")) {
        return { ok: false, detail: `no marker: ${out}` }
      }
      return { ok: true }
    },
  },
  {
    name: "env allowlist preserves only named inherited variables plus PI context",
    run: async () => {
      const env = buildBashEnvironment(
        {
          PI_YAML_HOOKS_ENV_ALLOWLIST: "PATH,HOME,SAFE_VAR,PI_SESSION_ID",
          PATH: "/bin",
          HOME: "/home/tester",
          SAFE_VAR: "ok",
          GITHUB_TOKEN: "secret",
        },
        {
          PI_PROJECT_DIR: "/repo",
          OPENCODE_PROJECT_DIR: "/repo",
          PI_WORKTREE_DIR: "/repo",
          OPENCODE_WORKTREE_DIR: "/repo",
          PI_SESSION_ID: "s1",
          OPENCODE_SESSION_ID: "s1",
        },
      )
      return env.PATH === "/bin" && env.HOME === "/home/tester" && env.SAFE_VAR === "ok" && env.GITHUB_TOKEN === undefined && env.PI_SESSION_ID === "s1"
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(env) }
    },
  },
  {
    name: "env allowlist excludes PATH and HOME unless explicitly listed",
    run: async () => {
      const env = buildBashEnvironment(
        { PI_YAML_HOOKS_ENV_ALLOWLIST: "SAFE_VAR", PATH: "/bin", HOME: "/home/tester", SAFE_VAR: "ok" },
        {
          PI_PROJECT_DIR: "/repo",
          OPENCODE_PROJECT_DIR: "/repo",
          PI_WORKTREE_DIR: "/repo",
          OPENCODE_WORKTREE_DIR: "/repo",
          PI_SESSION_ID: "s1",
          OPENCODE_SESSION_ID: "s1",
        },
      )
      return env.PATH === undefined && env.HOME === undefined && env.SAFE_VAR === "ok" && env.PI_PROJECT_DIR === "/repo"
        ? { ok: true }
        : { ok: false, detail: JSON.stringify(env) }
    },
  },
  {
    name: "stdin context serializer truncates oversized payloads with marker",
    run: async () => {
      const huge = "x".repeat(2_000_000) // ~2 MiB string field
      const out = serializeContextForStdin({
        session_id: "s1",
        event: "tool.after.write",
        cwd: "/repo",
        // @ts-expect-error — extra fields are allowed by the actual context shape
        toolArgs: { path: "/repo/file.txt", content: huge },
      })
      const parsed = JSON.parse(out) as Record<string, unknown>
      const ok =
        Buffer.byteLength(out, "utf8") <= 262_144 &&
        parsed._pi_hooks_truncated === true &&
        typeof parsed._pi_hooks_original_byte_length === "number" &&
        (parsed._pi_hooks_original_byte_length as number) > 1_000_000 &&
        parsed.session_id === "s1" &&
        parsed.event === "tool.after.write" &&
        parsed.cwd === "/repo"
      return ok ? { ok: true } : { ok: false, detail: `out.byteLength=${Buffer.byteLength(out, "utf8")} parsed=${JSON.stringify(parsed).slice(0, 300)}` }
    },
  },
  {
    name: "stdin context serializer passes small payloads through unchanged",
    run: async () => {
      const ctx = { session_id: "s1", event: "tool.after.write", cwd: "/repo" } as const
      const out = serializeContextForStdin(ctx)
      const parsed = JSON.parse(out) as Record<string, unknown>
      return parsed.session_id === "s1" && parsed._pi_hooks_truncated === undefined
        ? { ok: true }
        : { ok: false, detail: out }
    },
  },
  {
    name: "redacts RSA-typed PEM private key blocks",
    run: async () => {
      const pem = [
        "-----BEGIN RSA PRIVATE KEY-----",
        "fakekeymaterialfortest1234567890",
        "-----END RSA PRIVATE KEY-----",
      ].join("\n")
      const out = redactSensitiveContent(pem)
      return out.includes("[REDACTED]") && !out.includes("fakekeymaterialfortest1234567890")
        ? { ok: true }
        : { ok: false, detail: out }
    },
  },
  {
    name: "execution context cache reuses git probe results across the same worktree",
    run: async () => {
      resetExecutionContextCacheForTests()
      let calls = 0
      const resolver = {
        execFileSync: (_command: string, _args: string[], options: { cwd: string }) => {
          calls += 1
          return `/repo\n${options.cwd === "/repo" ? ".git" : "../../.git"}`
        },
      }

      const first = resolveExecutionContext("/repo/packages/a", resolver as never)
      const second = resolveExecutionContext("/repo/packages/a", resolver as never)

      return calls === 1 && first.worktreeDir === "/repo" && second.worktreeDir === "/repo"
        ? { ok: true }
        : { ok: false, detail: JSON.stringify({ calls, first, second }) }
    },
  },
  {
    name: "execution context does not reuse a parent repo cache for nested repos",
    run: async () => {
      resetExecutionContextCacheForTests()
      let calls = 0
      const resolver = {
        execFileSync: (_command: string, _args: string[], options: { cwd: string }) => {
          calls += 1
          return options.cwd.startsWith("/repo/submodule") ? "/repo/submodule\n.git" : "/repo\n.git"
        },
      }

      const parent = resolveExecutionContext("/repo", resolver as never)
      const nested = resolveExecutionContext("/repo/submodule", resolver as never)

      return calls === 2 && parent.worktreeDir === "/repo" && nested.worktreeDir === "/repo/submodule"
        ? { ok: true }
        : { ok: false, detail: JSON.stringify({ calls, parent, nested }) }
    },
  },
  {
    name: "execution context retries git resolution after a transient failure",
    run: async () => {
      resetExecutionContextCacheForTests()
      let calls = 0
      const resolver = {
        execFileSync: () => {
          calls += 1
          if (calls === 1) {
            throw new Error("temporary failure")
          }
          return "/repo\n.git"
        },
      }

      const first = resolveExecutionContext("/repo", resolver as never)
      const second = resolveExecutionContext("/repo", resolver as never)

      return calls === 2 && !first.resolvedFromGit && second.resolvedFromGit && second.worktreeDir === "/repo"
        ? { ok: true }
        : { ok: false, detail: JSON.stringify({ calls, first, second }) }
    },
  },
  {
    name: "timed out bash hooks kill descendant background processes on POSIX",
    run: async () => {
      if (process.platform === "win32") {
        return { ok: true }
      }

      const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-bash-timeout-"))
      const pidFile = path.join(tempDir, "child.pid")

      try {
        // Race condition lesson: the previous 150 ms timeout sometimes fired
        // before bash even managed to start the node child and write the
        // pid file, leaving us with no pid to verify. 1500 ms gives bash +
        // node time to spawn comfortably across CI machines while still
        // bounding the test wall time.
        const result = await executeBashHook({
          command:
            `node -e 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)' ` +
            `& child=$!; printf "%s" "$child" > ${JSON.stringify(pidFile)}; wait $child`,
          timeout: 1500,
          projectDir: tempDir,
          context: {
            session_id: "s1",
            event: "tool.after.bash",
            cwd: tempDir,
          },
        })

        const pidContents = await waitForNonEmptyFile(pidFile, 5_000)
        const childPid = pidContents ? Number.parseInt(pidContents, 10) : NaN

        // After the executor's SIGKILL escalation, give the kernel a beat
        // to reap the child. Then verify it really stopped — treating
        // zombies as dead via /proc on Linux and `ps -o stat` on macOS.
        let childAlive = true
        if (Number.isFinite(childPid)) {
          for (let i = 0; i < 20; i += 1) {
            if (!isProcessAlive(childPid)) {
              childAlive = false
              break
            }
            await sleep(50)
          }
        }

        const sawCleanupDetails =
          /process group/i.test(result.stderr) &&
          /SIGTERM/i.test(result.stderr) &&
          /SIGKILL/i.test(result.stderr) &&
          /final result/i.test(result.stderr)

        return result.status === "timed_out" && result.timedOut && !childAlive && sawCleanupDetails
          ? { ok: true }
          : {
              ok: false,
              detail: JSON.stringify({
                status: result.status,
                timedOut: result.timedOut,
                childPid,
                childAlive,
                stderr: result.stderr,
              }),
            }
      } finally {
        rmSync(tempDir, { recursive: true, force: true })
      }
    },
  },
  {
    name: "timed out bash hooks report exit code 124 (POSIX timeout convention)",
    run: async () => {
      if (process.platform === "win32") {
        return { ok: true }
      }
      const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-exit124-"))
      try {
        const result = await executeBashHook({
          command: "sleep 5",
          timeout: 250,
          projectDir: tempDir,
          context: { session_id: "s1", event: "tool.after.bash", cwd: tempDir },
        })
        return result.status === "timed_out" && result.timedOut && result.exitCode === TIMEOUT_EXIT_CODE
          ? { ok: true }
          : {
              ok: false,
              detail: JSON.stringify({
                status: result.status,
                timedOut: result.timedOut,
                exitCode: result.exitCode,
                expectedTimeoutCode: TIMEOUT_EXIT_CODE,
              }),
            }
      } finally {
        rmSync(tempDir, { recursive: true, force: true })
      }
    },
  },
  {
    name: "trimToUtf8Boundary never splits multi-byte codepoints (emoji + CJK)",
    run: async () => {
      // Emoji 😀 is 0xF0 0x9F 0x98 0x80 (4 bytes). CJK 漢 is 0xE6 0xBC 0xA2 (3 bytes).
      // Mix them so byte boundaries fall in the middle of sequences.
      const buf = Buffer.from("😀漢😀漢😀", "utf8")
      for (let limit = 0; limit <= buf.length + 2; limit += 1) {
        const safeEnd = trimToUtf8Boundary(buf, limit)
        if (safeEnd < 0 || safeEnd > Math.min(limit, buf.length)) {
          return { ok: false, detail: `safeEnd=${safeEnd} out of range for limit=${limit}` }
        }
        const decoded = buf.subarray(0, safeEnd).toString("utf8")
        if (decoded.includes("�")) {
          return { ok: false, detail: `replacement char at limit=${limit} safeEnd=${safeEnd} decoded=${JSON.stringify(decoded)}` }
        }
      }
      return { ok: true }
    },
  },
  {
    name: "captured stdout caps in BYTES and never splits emoji at the seam",
    run: async () => {
      if (process.platform === "win32") {
        return { ok: true }
      }
      const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-utf8cap-"))
      const previousMax = process.env.PI_YAML_HOOKS_MAX_OUTPUT_BYTES
      try {
        // Stream a quarter-million emoji at a 64 KiB byte cap. That's many
        // thousands of multi-byte codepoints; only one can straddle the cap.
        process.env.PI_YAML_HOOKS_MAX_OUTPUT_BYTES = String(64 * 1024)
        // Re-import is not available in this single-process test runner, so
        // we rely on the executor reading the env at module-load time. That's
        // fine: this test runs in the same process where the cap was already
        // initialised. To still meaningfully exercise byte-boundary trimming
        // at the *current* cap (1 MiB), emit 2 MiB of emoji and require the
        // captured output to be valid UTF-8 + truncated.
        const result = await executeBashHook({
          // 2 MiB worth of 4-byte emoji (524288 emojis) printed without a
          // trailing newline, so a UTF-8 boundary is the only thing keeping
          // the seam safe.
          command: `node -e 'const e=Buffer.from("\\u{1F600}","utf8"); const total=2*1024*1024; let written=0; const chunk=Buffer.concat(Array(1024).fill(e)); while(written<total){process.stdout.write(chunk); written+=chunk.length;}'`,
          timeout: 10_000,
          projectDir: tempDir,
          context: { session_id: "s1", event: "tool.after.bash", cwd: tempDir },
        })
        if (result.stdout.includes("�")) {
          return { ok: false, detail: "stdout contains U+FFFD replacement character" }
        }
        if (!result.outputTruncated) {
          return { ok: false, detail: `expected outputTruncated=true, got false (stdout bytes=${Buffer.byteLength(result.stdout, "utf8")})` }
        }
        if (!result.stdout.includes("output truncated")) {
          return { ok: false, detail: "stdout missing truncation marker" }
        }
        return { ok: true }
      } finally {
        if (previousMax === undefined) {
          delete process.env.PI_YAML_HOOKS_MAX_OUTPUT_BYTES
        } else {
          process.env.PI_YAML_HOOKS_MAX_OUTPUT_BYTES = previousMax
        }
        rmSync(tempDir, { recursive: true, force: true })
      }
    },
  },
  {
    name: "outputTruncated=false and stdinTruncated=false on a normal small run",
    run: async () => {
      if (process.platform === "win32") {
        return { ok: true }
      }
      const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-noflags-"))
      try {
        const result = await executeBashHook({
          command: "echo hi",
          projectDir: tempDir,
          context: { session_id: "s1", event: "tool.after.bash", cwd: tempDir },
        })
        return result.outputTruncated === false && result.stdinTruncated === false && result.exitCode === 0
          ? { ok: true }
          : {
              ok: false,
              detail: JSON.stringify({
                outputTruncated: result.outputTruncated,
                stdinTruncated: result.stdinTruncated,
                exitCode: result.exitCode,
              }),
            }
      } finally {
        rmSync(tempDir, { recursive: true, force: true })
      }
    },
  },
  {
    name: "stdinTruncated=true when the context payload exceeds MAX_STDIN_BYTES",
    run: async () => {
      if (process.platform === "win32") {
        return { ok: true }
      }
      const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-stdincap-"))
      try {
        const huge = "x".repeat(2_000_000)
        const result = await executeBashHook({
          command: "cat > /dev/null",
          projectDir: tempDir,
          context: {
            session_id: "s1",
            event: "tool.after.write",
            cwd: tempDir,
            tool_args: { content: huge },
          },
        })
        return result.stdinTruncated === true
          ? { ok: true }
          : { ok: false, detail: JSON.stringify({ stdinTruncated: result.stdinTruncated, exitCode: result.exitCode }) }
      } finally {
        rmSync(tempDir, { recursive: true, force: true })
      }
    },
  },
  {
    name: "execution context cache expires after TTL and re-probes git",
    run: async () => {
      resetExecutionContextCacheForTests()
      let calls = 0
      const resolver = {
        execFileSync: () => {
          calls += 1
          return "/repo\n.git"
        },
      }

      let virtualNow = 1_000_000
      setExecutionContextNowForTests(() => virtualNow)
      try {
        resolveExecutionContext("/repo", resolver as never)
        // Within TTL: cache hit, no extra git call.
        virtualNow += 60_000
        resolveExecutionContext("/repo", resolver as never)
        const callsAfterHit = calls
        if (callsAfterHit !== 1) {
          return { ok: false, detail: `cache miss within TTL (calls=${callsAfterHit})` }
        }

        // Past TTL: cache evicted, re-probe.
        virtualNow += 6 * 60_000
        resolveExecutionContext("/repo", resolver as never)
        const callsAfterExpiry = calls
        if (callsAfterExpiry !== 2) {
          return { ok: false, detail: `cache not evicted past TTL (calls=${callsAfterExpiry})` }
        }
        return { ok: true }
      } finally {
        resetExecutionContextCacheForTests()
      }
    },
  },
  {
    name: "logger writes drain through the documented test helper",
    run: async () => {
      const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-logger-drain-"))
      const logFile = path.join(tempDir, "log.ndjson")
      const previousFile = process.env.PI_YAML_HOOKS_LOG_FILE
      const previousLevel = process.env.PI_YAML_HOOKS_LOG_LEVEL
      try {
        process.env.PI_YAML_HOOKS_LOG_FILE = logFile
        process.env.PI_YAML_HOOKS_LOG_LEVEL = "debug"
        resetPiHooksLoggerForTests()

        const logger = getPiHooksLogger()
        const drainBefore = getPiHooksLoggerDrainCountForTests()
        logger.info("test", "first")
        logger.info("test", "second")
        logger.info("test", "third")
        flushPiHooksLoggerForTests()

        // Each call advances the drain counter — useful for asserting the
        // logger executed at all even when inspecting on-disk state would
        // be racy (which it currently isn't, but the harness is stable).
        const drainAfter = getPiHooksLoggerDrainCountForTests()
        if (drainAfter <= drainBefore) {
          return { ok: false, detail: `drain counter did not advance (before=${drainBefore} after=${drainAfter})` }
        }

        if (!existsSync(logFile)) return { ok: false, detail: "log file not created" }
        const lines = readFileSync(logFile, "utf8").split("\n").filter(Boolean)
        if (lines.length !== 3) return { ok: false, detail: `expected 3 lines, got ${lines.length}` }
        for (const expected of ["first", "second", "third"]) {
          if (!lines.some((line) => line.includes(expected))) {
            return { ok: false, detail: `missing message ${expected} in ${lines.join("|")}` }
          }
        }
        return { ok: true }
      } finally {
        resetPiHooksLoggerForTests()
        if (previousFile === undefined) {
          delete process.env.PI_YAML_HOOKS_LOG_FILE
        } else {
          process.env.PI_YAML_HOOKS_LOG_FILE = previousFile
        }
        if (previousLevel === undefined) {
          delete process.env.PI_YAML_HOOKS_LOG_LEVEL
        } else {
          process.env.PI_YAML_HOOKS_LOG_LEVEL = previousLevel
        }
        rmSync(tempDir, { recursive: true, force: true })
      }
    },
  },
  {
    name: "logger rotates the file when it exceeds PI_YAML_HOOKS_LOG_MAX_BYTES",
    run: async () => {
      const tempDir = mkdtempSync(path.join(os.tmpdir(), "pi-hooks-logger-rotate-"))
      const logFile = path.join(tempDir, "log.ndjson")
      const rotatedFile = `${logFile}.1`
      const prev = {
        file: process.env.PI_YAML_HOOKS_LOG_FILE,
        level: process.env.PI_YAML_HOOKS_LOG_LEVEL,
        max: process.env.PI_YAML_HOOKS_LOG_MAX_BYTES,
      }
      try {
        process.env.PI_YAML_HOOKS_LOG_FILE = logFile
        process.env.PI_YAML_HOOKS_LOG_LEVEL = "debug"
        // Tiny threshold so a handful of entries trip rotation.
        process.env.PI_YAML_HOOKS_LOG_MAX_BYTES = "512"
        resetPiHooksLoggerForTests()

        const logger = getPiHooksLogger()
        // Write entries large enough that 3-4 of them cross the 512 byte cap.
        const filler = "y".repeat(200)
        for (let i = 0; i < 12; i += 1) {
          logger.info("rotate-test", `entry-${i} ${filler}`)
          flushPiHooksLoggerForTests()
        }

        if (!existsSync(rotatedFile)) {
          return { ok: false, detail: `expected ${rotatedFile} to exist after rotation` }
        }
        const activeSize = existsSync(logFile) ? statSync(logFile).size : 0
        const rotatedSize = statSync(rotatedFile).size
        if (rotatedSize === 0) {
          return { ok: false, detail: "rotated file is empty" }
        }
        // Active file should never be larger than the cap by more than one
        // entry — otherwise rotation isn't running.
        if (activeSize > 512 + 1024) {
          return { ok: false, detail: `active file too large: ${activeSize} bytes` }
        }
        return { ok: true }
      } finally {
        resetPiHooksLoggerForTests()
        if (prev.file === undefined) {
          delete process.env.PI_YAML_HOOKS_LOG_FILE
        } else {
          process.env.PI_YAML_HOOKS_LOG_FILE = prev.file
        }
        if (prev.level === undefined) {
          delete process.env.PI_YAML_HOOKS_LOG_LEVEL
        } else {
          process.env.PI_YAML_HOOKS_LOG_LEVEL = prev.level
        }
        if (prev.max === undefined) {
          delete process.env.PI_YAML_HOOKS_LOG_MAX_BYTES
        } else {
          process.env.PI_YAML_HOOKS_LOG_MAX_BYTES = prev.max
        }
        rmSync(tempDir, { recursive: true, force: true })
      }
    },
  },
]

export async function main(): Promise<number> {
  let failures = 0
  resetExecutionContextCacheForTests()
  for (const c of cases) {
    try {
      const outcome = await c.run()
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
  /bash-executor\.test\.(ts|js)$/.test(process.argv[1])

if (invokedDirectly) {
  main().then((code) => process.exit(code))
}
