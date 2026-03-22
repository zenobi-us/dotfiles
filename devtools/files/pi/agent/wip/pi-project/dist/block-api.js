/**
 * Centralized read/write API for .project/*.json project block files.
 * Validates data against schemas before writing; uses atomic writes (tmp + rename).
 * Future extraction seam for pi-project extension.
 */
import fs from "node:fs";
import path from "node:path";
import { PROJECT_DIR, SCHEMAS_DIR } from "./project-dir.js";
import { validateFromFile } from "./schema-validator.js";
function blockFilePath(cwd, blockName) {
    return path.join(cwd, PROJECT_DIR, `${blockName}.json`);
}
function blockSchemaPath(cwd, blockName) {
    return path.join(cwd, PROJECT_DIR, SCHEMAS_DIR, `${blockName}.schema.json`);
}
/**
 * Read and parse a .project/{blockName}.json file.
 * Throws if the file does not exist or contains invalid JSON.
 */
export function readBlock(cwd, blockName) {
    const filePath = blockFilePath(cwd, blockName);
    let content;
    try {
        content = fs.readFileSync(filePath, "utf-8");
    }
    catch {
        throw new Error(`Block file not found: .project/${blockName}.json`);
    }
    try {
        return JSON.parse(content);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Invalid JSON in block file: .project/${blockName}.json: ${msg}`);
    }
}
/**
 * Validate data against its schema (if one exists) and write atomically
 * to .project/{blockName}.json. Throws ValidationError on schema failure.
 * Files without a corresponding schema are written without validation.
 */
export function writeBlock(cwd, blockName, data) {
    const filePath = blockFilePath(cwd, blockName);
    const schemaFile = blockSchemaPath(cwd, blockName);
    // Validate before write (if schema exists)
    if (fs.existsSync(schemaFile)) {
        validateFromFile(schemaFile, data, `block file '${blockName}.json'`);
    }
    // Ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    // Atomic write: tmp + rename
    const tmpPath = filePath + `.block-api-${process.pid}.tmp`;
    try {
        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
        fs.renameSync(tmpPath, filePath);
    }
    catch (err) {
        // Best-effort cleanup of partial tmp file
        try {
            fs.unlinkSync(tmpPath);
        }
        catch {
            /* ignore cleanup failure */
        }
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to write block file .project/${blockName}.json: ${msg}`);
    }
}
/**
 * Read current file, push item onto data[arrayKey], validate whole file
 * against schema, write atomically. Throws if file doesn't exist, if
 * arrayKey is missing or not an array, or if validation fails.
 */
export function appendToBlock(cwd, blockName, arrayKey, item) {
    const data = readBlock(cwd, blockName);
    if (!data || typeof data !== "object") {
        throw new Error(`Block '${blockName}' is not an object`);
    }
    const record = data;
    if (!(arrayKey in record)) {
        throw new Error(`Block '${blockName}' has no key '${arrayKey}'`);
    }
    if (!Array.isArray(record[arrayKey])) {
        throw new Error(`Block '${blockName}' key '${arrayKey}' is not an array`);
    }
    record[arrayKey] = [...record[arrayKey], item];
    writeBlock(cwd, blockName, record);
}
/**
 * Find an item in data[arrayKey] by predicate, shallow-merge updates onto it,
 * validate whole file against schema, write atomically. Throws if no item
 * matches, if arrayKey is missing or not an array, or if validation fails.
 */
export function updateItemInBlock(cwd, blockName, arrayKey, predicate, updates) {
    const data = readBlock(cwd, blockName);
    if (!data || typeof data !== "object") {
        throw new Error(`Block '${blockName}' is not an object`);
    }
    const record = data;
    if (!(arrayKey in record)) {
        throw new Error(`Block '${blockName}' has no key '${arrayKey}'`);
    }
    if (!Array.isArray(record[arrayKey])) {
        throw new Error(`Block '${blockName}' key '${arrayKey}' is not an array`);
    }
    const arr = record[arrayKey];
    const item = arr.find(predicate);
    if (!item) {
        throw new Error(`No matching item in block '${blockName}' key '${arrayKey}'`);
    }
    Object.assign(item, updates);
    writeBlock(cwd, blockName, record);
}
//# sourceMappingURL=block-api.js.map