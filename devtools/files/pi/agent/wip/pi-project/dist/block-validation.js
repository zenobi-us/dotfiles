/**
 * Post-step block validation — snapshot .project/*.json contents before step
 * execution, then validate any changed files against their schemas after.
 * Supports rollback of block files to pre-step state on validation failure.
 */
import fs from "node:fs";
import path from "node:path";
import { PROJECT_DIR, SCHEMAS_DIR } from "./project-dir.js";
import { validateFromFile } from "./schema-validator.js";
/**
 * Snapshot mtimes and contents of all .project/*.json files.
 * Returns a Map of absolute filepath → { mtime, content }.
 * If .project/ doesn't exist, returns an empty map.
 */
export function snapshotBlockFiles(cwd) {
    const result = new Map();
    const workflowDir = path.join(cwd, PROJECT_DIR);
    try {
        const entries = fs.readdirSync(workflowDir);
        for (const entry of entries) {
            if (!entry.endsWith(".json"))
                continue;
            const fullPath = path.join(workflowDir, entry);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isFile()) {
                    const content = fs.readFileSync(fullPath, "utf-8");
                    result.set(fullPath, { mtime: stat.mtimeMs, content });
                }
            }
            catch {
                // File disappeared between readdir and stat — skip
            }
        }
    }
    catch {
        // .project/ doesn't exist — no block files to track
    }
    return result;
}
/**
 * Compare current .project/*.json mtimes against a prior snapshot.
 * Validate any changed or newly created files against their schemas.
 *
 * Schema path convention: .project/foo.json → .project/schemas/foo.schema.json
 * Files with no corresponding schema are silently skipped.
 *
 * @throws Error if any changed block file fails schema validation
 */
export function validateChangedBlocks(cwd, before) {
    const workflowDir = path.join(cwd, PROJECT_DIR);
    const schemasDir = path.join(workflowDir, SCHEMAS_DIR);
    // Gather current state
    let currentEntries;
    try {
        currentEntries = fs.readdirSync(workflowDir).filter((e) => e.endsWith(".json"));
    }
    catch {
        return; // .project/ doesn't exist
    }
    const errors = [];
    for (const entry of currentEntries) {
        const fullPath = path.join(workflowDir, entry);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        }
        catch {
            continue;
        }
        if (!stat.isFile())
            continue;
        const prev = before.get(fullPath);
        const isChanged = prev === undefined || stat.mtimeMs !== prev.mtime;
        if (!isChanged)
            continue;
        // Changed or new file — look for a schema
        const baseName = entry.replace(/\.json$/, "");
        const schemaPath = path.join(schemasDir, `${baseName}.schema.json`);
        if (!fs.existsSync(schemaPath))
            continue; // no schema → skip silently
        // Validate
        try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const data = JSON.parse(content);
            validateFromFile(schemaPath, data, `block file '${entry}'`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`${entry}: ${msg}`);
        }
    }
    if (errors.length > 0) {
        throw new Error(`Block validation failed:\n${errors.join("\n")}`);
    }
}
/**
 * Rollback .project/*.json files to their pre-step state.
 * - Files that existed in the snapshot and changed: restore content via atomic write (tmp + rename)
 * - New files (not in snapshot): delete them
 * Returns list of rolled-back file paths.
 */
export function rollbackBlockFiles(cwd, before) {
    const workflowDir = path.join(cwd, PROJECT_DIR);
    const rolledBack = [];
    // Gather current files
    let currentEntries;
    try {
        currentEntries = fs.readdirSync(workflowDir).filter((e) => e.endsWith(".json"));
    }
    catch {
        return rolledBack;
    }
    for (const entry of currentEntries) {
        const fullPath = path.join(workflowDir, entry);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        }
        catch {
            continue;
        }
        if (!stat.isFile())
            continue;
        const prev = before.get(fullPath);
        if (prev === undefined) {
            // New file — delete it
            try {
                fs.unlinkSync(fullPath);
                rolledBack.push(fullPath);
            }
            catch {
                // best effort
            }
        }
        else if (stat.mtimeMs !== prev.mtime) {
            // Changed file — restore content via atomic write
            try {
                const tmpPath = fullPath + `.rollback-${process.pid}.tmp`;
                fs.writeFileSync(tmpPath, prev.content);
                fs.renameSync(tmpPath, fullPath);
                rolledBack.push(fullPath);
            }
            catch {
                // best effort
            }
        }
    }
    return rolledBack;
}
//# sourceMappingURL=block-validation.js.map