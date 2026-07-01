#!/usr/bin/env node

import { mkdir, appendFile } from "node:fs/promises"
import path from "node:path"

const payload = JSON.parse(await readStdin())
const cwd = typeof payload.cwd === "string" ? payload.cwd : process.cwd()
const logDir = path.join(cwd, ".pi-hook-logs")
const logPath = path.join(logDir, "tool-events.ndjson")

const entry = {
  timestamp: new Date().toISOString(),
  event: payload.event,
  tool: payload.tool_name,
  files: Array.isArray(payload.files) ? payload.files : [],
  changes: Array.isArray(payload.changes) ? payload.changes : [],
}

await mkdir(logDir, { recursive: true })
await appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8")

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString("utf8")
}
