#!/usr/bin/env node

// Command-start prefix: beginning of string, whitespace, or a shell separator
// (semicolon, ampersand, pipe, backtick, opening paren). This is intentionally
// coarse — it catches obvious chained commands like `cd /tmp; rm -rf /` but is
// not a security boundary. Determined attackers can defeat it with quoting,
// env vars, eval, or aliasing. Use OS-level controls for real isolation.
const CMD_START = String.raw`(?:^|[\s;&|\x60(])`

const payload = JSON.parse(await readStdin())
const packageInstallOnly = process.argv.includes("--package-install-only")
const toolName = String(payload.tool_name ?? "")
const toolArgs = isRecord(payload.tool_args) ? payload.tool_args : {}

if (toolName === "bash") {
  const command = String(toolArgs.command ?? "")
  const reason = packageInstallOnly ? getPackageInstallReason(command) : getRiskyCommandReason(command)
  if (reason) {
    block(reason)
  }
}

if (toolName === "write" || toolName === "edit") {
  const filePath = String(toolArgs.path ?? toolArgs.filePath ?? toolArgs.file_path ?? toolArgs.file ?? "")
  if (isProtectedPath(filePath)) {
    block(`Blocked ${toolName} to protected path: ${filePath}`)
  }
}

function getRiskyCommandReason(command) {
  const compact = command.replace(/\s+/g, " ").trim()
  const rules = [
    [new RegExp(`${CMD_START}git\\s+reset\\s+--hard(\\s|$)`), "Blocked git reset --hard"],
    [new RegExp(`${CMD_START}git\\s+clean\\s+-[^\\n;]*f[^\\n;]*d`), "Blocked destructive git clean"],
    [new RegExp(`${CMD_START}rm\\s+-[^\\n;]*r[^\\n;]*f\\s+(\\/|\\$HOME|~)(\\s|$)`), "Blocked broad rm -rf target"],
    [new RegExp(`${CMD_START}chmod\\s+-R\\s+777(\\s|$)`), "Blocked recursive chmod 777"],
    [/(curl|wget)[^|;&]*\|\s*(sh|bash)(\s|$)/, "Blocked pipe-to-shell install command"],
  ]

  return rules.find(([pattern]) => pattern.test(compact))?.[1]
}

function getPackageInstallReason(command) {
  const compact = command.replace(/\s+/g, " ").trim()
  const rules = [
    [new RegExp(`${CMD_START}(npm|pnpm|yarn)\\s+(install|add|update|upgrade)(\\s|$)`), "Blocked package install/update command"],
    [new RegExp(`${CMD_START}bun\\s+(install|add|update)(\\s|$)`), "Blocked package install/update command"],
    [new RegExp(`${CMD_START}pipx?\\s+install(\\s|$)`), "Blocked Python package install command"],
    [new RegExp(`${CMD_START}uv\\s+(add|sync|pip\\s+install)(\\s|$)`), "Blocked Python dependency update command"],
    [new RegExp(`${CMD_START}cargo\\s+(add|install|update)(\\s|$)`), "Blocked Rust dependency update command"],
    [new RegExp(`${CMD_START}go\\s+get(\\s|$)`), "Blocked Go dependency update command"],
  ]

  return rules.find(([pattern]) => pattern.test(compact))?.[1]
}

function isProtectedPath(filePath) {
  if (!filePath) return false
  const normalized = filePath.replaceAll("\\", "/").replace(/^\.\//, "")
  // Path-segment match: split on "/" and inspect every segment so that
  // `config/.env`, `subdir/.env.local`, `app/secrets/db.yml`,
  // and `home/.ssh/id_rsa` all match.
  const segments = normalized.split("/").filter((s) => s.length > 0)
  if (segments.length === 0) return false
  const basename = segments[segments.length - 1]
  const parents = segments.slice(0, -1)

  const protectedBasenames = new Set([".env", "credentials.json", ".npmrc", "secrets.yaml", "secrets.yml"])
  if (protectedBasenames.has(basename)) return true
  if (basename.startsWith(".env.")) return true
  if (basename.endsWith(".pem") || basename.endsWith(".key") || basename.endsWith(".p12")) return true

  // Parent-segment match: any ancestor named `.ssh` or `secrets` makes the
  // file protected. This catches both `/home/.ssh/id_rsa` and `app/secrets/db.yml`.
  if (parents.includes(".ssh") || parents.includes("secrets")) return true

  return false
}

function block(message) {
  console.error(message)
  process.exit(2)
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString("utf8")
}
