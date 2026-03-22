import * as fs from "node:fs";
import * as path from "node:path";

export function generateFindingId(monitorName: string, _description: string): string {
  return `${monitorName}-${Date.now().toString(36)}`;
}
export function executeWriteAction(monitor, action, result) {
  if (!action.write) return;
  const writeCfg = action.write;
  const filePath = path.isAbsolute(writeCfg.path)
    ? writeCfg.path
    : path.resolve(process.cwd(), writeCfg.path);
  // Build the entry from template, substituting placeholders
  const findingId = generateFindingId(
    monitor.name,
    result.description ?? "unknown",
  );
  const entry = {};
  for (const [key, tmpl] of Object.entries(writeCfg.template)) {
    entry[key] = String(tmpl)
      .replace(/\{finding_id\}/g, findingId)
      .replace(/\{description\}/g, result.description ?? "Issue detected")
      .replace(/\{severity\}/g, "warning")
      .replace(/\{monitor_name\}/g, monitor.name)
      .replace(/\{timestamp\}/g, new Date().toISOString());
  }
  // Read existing file or create structure
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    // file doesn't exist or is invalid — create fresh
  }
  const arrayField = writeCfg.array_field;
  if (!Array.isArray(data[arrayField])) {
    data[arrayField] = [];
  }
  const arr = data[arrayField];
  if (writeCfg.merge === "upsert") {
    const idx = arr.findIndex((item) => item.id === entry.id);
    if (idx !== -1) {
      arr[idx] = entry;
    } else {
      arr.push(entry);
    }
  } else {
    arr.push(entry);
  }
  const tmpPath = `${filePath}.${process.pid}.tmp`;
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n");
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* cleanup */
    }
    console.error(
      `[${monitor.name}] Failed to write to ${filePath}: ${err instanceof Error ? err.message : err}`,
    );
  }
}
