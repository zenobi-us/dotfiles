/**
 * Project SDK — queryable surface for project block state, discovery,
 * and derived metrics. Computes everything dynamically from filesystem
 * and git — no cache, no stale data.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { readBlock } from "./block-api.js";
import { PROJECT_DIR, SCHEMAS_DIR } from "./project-dir.js";
export function availableBlocks(cwd) {
    const workflowDir = path.join(cwd, PROJECT_DIR);
    const schemasDir = path.join(workflowDir, SCHEMAS_DIR);
    if (!fs.existsSync(workflowDir))
        return [];
    const blocks = [];
    for (const file of fs.readdirSync(workflowDir)) {
        if (!file.endsWith(".json"))
            continue;
        const name = file.replace(".json", "");
        const hasSchema = fs.existsSync(path.join(schemasDir, `${name}.schema.json`));
        blocks.push({ name, hasSchema });
    }
    return blocks.sort((a, b) => a.name.localeCompare(b.name));
}
/**
 * Discover schemas in PROJECT_DIR/SCHEMAS_DIR.
 * Returns sorted list of absolute paths to .schema.json files.
 */
export function availableSchemas(cwd) {
    const dir = path.join(cwd, PROJECT_DIR, SCHEMAS_DIR);
    if (!fs.existsSync(dir))
        return [];
    const schemas = [];
    for (const file of fs.readdirSync(dir)) {
        if (file.endsWith(".schema.json")) {
            schemas.push(path.join(dir, file));
        }
    }
    return schemas.sort();
}
/**
 * Discover blocks with array properties by scanning PROJECT_DIR/SCHEMAS_DIR
 * for schemas whose root type has at least one array property.
 * Returns block name, first array key, and schema path for each.
 */
export function findAppendableBlocks(cwd) {
    const schemasDir = path.join(cwd, PROJECT_DIR, SCHEMAS_DIR);
    if (!fs.existsSync(schemasDir))
        return [];
    const results = [];
    for (const file of fs.readdirSync(schemasDir)) {
        if (!file.endsWith(".schema.json"))
            continue;
        const blockName = file.replace(".schema.json", "");
        try {
            const schema = JSON.parse(fs.readFileSync(path.join(schemasDir, file), "utf-8"));
            if (schema.properties) {
                for (const [key, prop] of Object.entries(schema.properties)) {
                    if (prop.type === "array") {
                        results.push({ block: blockName, arrayKey: key, schemaPath: path.join(schemasDir, file) });
                        break; // first array property
                    }
                }
            }
        }
        catch {
            /* skip malformed schemas */
        }
    }
    return results;
}
// ── Vocabulary (derived from schemas) ─────────────────────────────────────────
/** Default planning lifecycle block types shipped with /project init. */
export const PROJECT_BLOCK_TYPES = [
    "project",
    "domain",
    "requirements",
    "architecture",
    "tasks",
    "decisions",
    "gaps",
    "rationale",
    "verification",
    "handoff",
    "conformance-reference",
    "audit",
];
/**
 * Read and parse a schema, extracting property metadata.
 * Returns null if the schema file doesn't exist or is unparseable.
 */
export function schemaInfo(cwd, schemaName) {
    const schemaPath = path.join(cwd, PROJECT_DIR, SCHEMAS_DIR, `${schemaName}.schema.json`);
    try {
        const raw = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
        const title = String(raw.title ?? schemaName);
        const requiredSet = new Set(Array.isArray(raw.required) ? raw.required : []);
        const properties = [];
        const arrayKeys = [];
        const itemProperties = {};
        if (raw.properties && typeof raw.properties === "object") {
            for (const [name, propRaw] of Object.entries(raw.properties)) {
                const propType = extractType(propRaw);
                const prop = {
                    name,
                    type: propType,
                    required: requiredSet.has(name),
                    description: propRaw.description ? String(propRaw.description) : undefined,
                    enum: Array.isArray(propRaw.enum) ? propRaw.enum : undefined,
                };
                properties.push(prop);
                if (propType === "array") {
                    arrayKeys.push(name);
                    // Extract item properties (one level deep)
                    const items = propRaw.items;
                    if (items?.properties && typeof items.properties === "object") {
                        const itemRequiredSet = new Set(Array.isArray(items.required) ? items.required : []);
                        const itemProps = [];
                        for (const [iName, iPropRaw] of Object.entries(items.properties)) {
                            itemProps.push({
                                name: iName,
                                type: extractType(iPropRaw),
                                required: itemRequiredSet.has(iName),
                                description: iPropRaw.description ? String(iPropRaw.description) : undefined,
                                enum: Array.isArray(iPropRaw.enum) ? iPropRaw.enum : undefined,
                            });
                        }
                        itemProperties[name] = itemProps;
                    }
                }
            }
        }
        return {
            name: schemaName,
            title,
            properties,
            arrayKeys,
            itemProperties: Object.keys(itemProperties).length > 0 ? itemProperties : undefined,
        };
    }
    catch {
        return null;
    }
}
/** Extract type string from a JSON Schema property. */
function extractType(prop) {
    if (Array.isArray(prop.type))
        return prop.type.join("|");
    if (typeof prop.type === "string")
        return prop.type;
    return "unknown";
}
/**
 * All schemas with their property metadata.
 * Scans .project/schemas/ and parses each schema.
 */
export function schemaVocabulary(cwd) {
    const schemasDir = path.join(cwd, PROJECT_DIR, SCHEMAS_DIR);
    if (!fs.existsSync(schemasDir))
        return [];
    const results = [];
    for (const file of fs.readdirSync(schemasDir).sort()) {
        if (!file.endsWith(".schema.json"))
            continue;
        const name = file.replace(".schema.json", "");
        const info = schemaInfo(cwd, name);
        if (info)
            results.push(info);
    }
    return results;
}
/**
 * What blocks exist and their structure — combines availableBlocks
 * and block summaries into a single queryable function.
 */
export function blockStructure(cwd) {
    const blockDir = path.join(cwd, PROJECT_DIR);
    const blocks = availableBlocks(cwd);
    return blocks.map((b) => {
        const arrays = [];
        try {
            const data = readBlock(cwd, b.name);
            for (const [key, val] of Object.entries(data)) {
                if (Array.isArray(val)) {
                    arrays.push({ key, itemCount: val.length });
                }
            }
        }
        catch {
            /* block unreadable */
        }
        return {
            name: b.name,
            exists: fs.existsSync(path.join(blockDir, `${b.name}.json`)),
            hasSchema: b.hasSchema,
            arrays,
        };
    });
}
/**
 * Derive project state from authoritative sources at query time.
 * No cache, no stale data — computed fresh on every call.
 */
export function projectState(cwd) {
    // Git state
    let lastCommit = "unknown";
    let lastCommitMessage = "";
    try {
        lastCommit = execSync("git log -1 --format=%h", { cwd, encoding: "utf-8" }).trim();
        lastCommitMessage = execSync("git log -1 --format=%s", { cwd, encoding: "utf-8" }).trim();
    }
    catch {
        /* not a git repo or no commits */
    }
    // Recent commits
    let recentCommits = [];
    try {
        const log = execSync("git log --oneline -5", { cwd, encoding: "utf-8" }).trim();
        if (log)
            recentCommits = log.split("\n");
    }
    catch {
        /* not a git repo */
    }
    // Resolve src dirs — workspace-aware: if cwd has a package.json with
    // "workspaces" globs, collect src/ from each matched package directory;
    // otherwise fall back to the single cwd/src/ directory.
    const srcDirs = [];
    try {
        const rootPkg = path.join(cwd, "package.json");
        if (fs.existsSync(rootPkg)) {
            const pkg = JSON.parse(fs.readFileSync(rootPkg, "utf-8"));
            if (Array.isArray(pkg.workspaces) && pkg.workspaces.length > 0) {
                for (const pattern of pkg.workspaces) {
                    // Support trailing /* glob (e.g. "packages/*")
                    const base = pattern.replace(/\/?\*$/, "");
                    const baseDir = path.join(cwd, base);
                    if (fs.existsSync(baseDir) && fs.statSync(baseDir).isDirectory()) {
                        for (const entry of fs.readdirSync(baseDir)) {
                            const pkgSrc = path.join(baseDir, entry, "src");
                            if (fs.existsSync(pkgSrc) && fs.statSync(pkgSrc).isDirectory()) {
                                srcDirs.push(pkgSrc);
                            }
                        }
                    }
                }
            }
        }
    }
    catch {
        /* failed to read/parse package.json — fall through */
    }
    // Fallback: if no workspace dirs found, use cwd/src as before
    if (srcDirs.length === 0) {
        const single = path.join(cwd, "src");
        if (fs.existsSync(single))
            srcDirs.push(single);
    }
    // Source file count and line count (non-test .ts files)
    let sourceFiles = 0;
    let sourceLines = 0;
    for (const srcDir of srcDirs) {
        try {
            for (const file of fs.readdirSync(srcDir)) {
                if (!file.endsWith(".ts") || file.endsWith(".test.ts"))
                    continue;
                sourceFiles++;
                const content = fs.readFileSync(path.join(srcDir, file), "utf-8");
                sourceLines += content.split("\n").length;
            }
        }
        catch {
            /* unreadable src dir */
        }
    }
    // Test count derived from static scan of it() declarations in test files
    let testCount = 0;
    for (const srcDir of srcDirs) {
        try {
            for (const file of fs.readdirSync(srcDir)) {
                if (!file.endsWith(".test.ts"))
                    continue;
                const content = fs.readFileSync(path.join(srcDir, file), "utf-8");
                const matches = content.match(/^\s*it\s*\(/gm);
                if (matches)
                    testCount += matches.length;
            }
        }
        catch {
            /* unreadable src dir */
        }
    }
    // Block summaries — scan all blocks, report item counts and status distribution
    const blockSummaries = {};
    const blockDir = path.join(cwd, PROJECT_DIR);
    try {
        if (fs.existsSync(blockDir)) {
            for (const file of fs.readdirSync(blockDir)) {
                if (!file.endsWith(".json"))
                    continue;
                const blockName = file.replace(".json", "");
                try {
                    const data = readBlock(cwd, blockName);
                    const arrays = {};
                    for (const [key, val] of Object.entries(data)) {
                        if (!Array.isArray(val))
                            continue;
                        const items = val;
                        const arrSummary = { total: items.length };
                        // Aggregate by status if items have a status field
                        if (items.length > 0 && typeof items[0] === "object" && items[0] !== null && "status" in items[0]) {
                            const byStatus = {};
                            for (const item of items) {
                                const s = String(item.status ?? "unknown");
                                byStatus[s] = (byStatus[s] ?? 0) + 1;
                            }
                            arrSummary.byStatus = byStatus;
                        }
                        arrays[key] = arrSummary;
                    }
                    if (Object.keys(arrays).length > 0) {
                        blockSummaries[blockName] = { arrays };
                    }
                }
                catch {
                    /* skip unreadable blocks */
                }
            }
        }
    }
    catch {
        /* no block dir */
    }
    // Phases from PROJECT_DIR/phases/*.json
    let phaseTotal = 0;
    let phaseCurrent = 0;
    try {
        const phasesDir = path.join(cwd, PROJECT_DIR, "phases");
        if (fs.existsSync(phasesDir)) {
            const files = fs
                .readdirSync(phasesDir)
                .filter((f) => f.endsWith(".json"))
                .sort();
            phaseTotal = files.length;
            if (files.length > 0) {
                const last = files[files.length - 1];
                phaseCurrent = parseInt(last.split("-")[0], 10) || 0;
            }
        }
    }
    catch {
        /* no phases dir */
    }
    // Planning lifecycle derived state
    const state = {
        testCount,
        sourceFiles,
        sourceLines,
        lastCommit,
        lastCommitMessage,
        recentCommits,
        blockSummaries,
        phases: { total: phaseTotal, current: phaseCurrent },
        blocks: availableBlocks(cwd).length,
        schemas: availableSchemas(cwd).length,
    };
    // Requirements summary
    try {
        const reqData = readBlock(cwd, "requirements");
        if (Array.isArray(reqData.requirements)) {
            const items = reqData.requirements;
            const byStatus = {};
            const byPriority = {};
            for (const item of items) {
                const s = String(item.status ?? "unknown");
                byStatus[s] = (byStatus[s] ?? 0) + 1;
                const p = String(item.priority ?? "unknown");
                byPriority[p] = (byPriority[p] ?? 0) + 1;
            }
            state.requirements = { total: items.length, byStatus, byPriority };
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Tasks summary
    try {
        const taskData = readBlock(cwd, "tasks");
        if (Array.isArray(taskData.tasks)) {
            const items = taskData.tasks;
            const byStatus = {};
            for (const item of items) {
                const s = String(item.status ?? "unknown");
                byStatus[s] = (byStatus[s] ?? 0) + 1;
            }
            state.tasks = { total: items.length, byStatus };
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Domain summary
    try {
        const domainData = readBlock(cwd, "domain");
        if (Array.isArray(domainData.entries)) {
            state.domain = { total: domainData.entries.length };
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Verification summary
    try {
        const verData = readBlock(cwd, "verification");
        if (Array.isArray(verData.verifications)) {
            const items = verData.verifications;
            let passed = 0;
            let failed = 0;
            for (const item of items) {
                if (item.status === "passed")
                    passed++;
                else if (item.status === "failed")
                    failed++;
            }
            state.verifications = { total: items.length, passed, failed };
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Handoff presence
    try {
        const handoffPath = path.join(cwd, PROJECT_DIR, "handoff.json");
        state.hasHandoff = fs.existsSync(handoffPath);
    }
    catch {
        /* ignore */
    }
    return state;
}
/**
 * Validate cross-block referential integrity: do IDs referenced across blocks
 * actually exist? Returns structured issues rather than throwing.
 */
export function validateProject(cwd) {
    const issues = [];
    // Collect known IDs from each block
    const phaseIds = new Set();
    const taskIds = new Set();
    const decisionIds = new Set();
    const requirementIds = new Set();
    // Load phases
    try {
        const phasesDir = path.join(cwd, PROJECT_DIR, "phases");
        if (fs.existsSync(phasesDir)) {
            for (const file of fs.readdirSync(phasesDir).filter((f) => f.endsWith(".json"))) {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(phasesDir, file), "utf-8"));
                    if (data.number !== undefined)
                        phaseIds.add(String(data.number));
                    if (data.name)
                        phaseIds.add(data.name);
                }
                catch {
                    /* skip malformed */
                }
            }
        }
    }
    catch {
        /* no phases dir */
    }
    // Load tasks
    try {
        const taskData = readBlock(cwd, "tasks");
        if (Array.isArray(taskData.tasks)) {
            for (const t of taskData.tasks) {
                if (t.id)
                    taskIds.add(String(t.id));
            }
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Load decisions
    try {
        const decData = readBlock(cwd, "decisions");
        if (Array.isArray(decData.decisions)) {
            for (const d of decData.decisions) {
                if (d.id)
                    decisionIds.add(String(d.id));
            }
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Load requirements
    try {
        const reqData = readBlock(cwd, "requirements");
        if (Array.isArray(reqData.requirements)) {
            for (const r of reqData.requirements) {
                if (r.id)
                    requirementIds.add(String(r.id));
            }
        }
    }
    catch {
        /* block doesn't exist */
    }
    // All known IDs for generic resolution
    const allIds = new Set([...phaseIds, ...taskIds, ...decisionIds, ...requirementIds]);
    // Validate task references
    try {
        const taskData = readBlock(cwd, "tasks");
        if (Array.isArray(taskData.tasks)) {
            for (const task of taskData.tasks) {
                // task.phase → valid phase
                if (task.phase !== undefined && !phaseIds.has(String(task.phase))) {
                    issues.push({
                        severity: "warning",
                        message: `Task '${task.id}' references phase '${task.phase}' which does not exist`,
                        block: "tasks",
                        field: `tasks[${task.id}].phase`,
                    });
                }
                // task.depends_on → valid task IDs
                if (Array.isArray(task.depends_on)) {
                    for (const dep of task.depends_on) {
                        if (!taskIds.has(dep)) {
                            issues.push({
                                severity: "error",
                                message: `Task '${task.id}' depends on task '${dep}' which does not exist`,
                                block: "tasks",
                                field: `tasks[${task.id}].depends_on`,
                            });
                        }
                    }
                }
            }
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Validate decision references
    try {
        const decData = readBlock(cwd, "decisions");
        if (Array.isArray(decData.decisions)) {
            for (const dec of decData.decisions) {
                if (dec.phase !== undefined && !phaseIds.has(String(dec.phase))) {
                    issues.push({
                        severity: "warning",
                        message: `Decision '${dec.id}' references phase '${dec.phase}' which does not exist`,
                        block: "decisions",
                        field: `decisions[${dec.id}].phase`,
                    });
                }
            }
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Validate gap references
    try {
        const gapData = readBlock(cwd, "gaps");
        if (Array.isArray(gapData.gaps)) {
            for (const gap of gapData.gaps) {
                if (gap.resolved_by && !allIds.has(String(gap.resolved_by))) {
                    issues.push({
                        severity: "warning",
                        message: `Gap '${gap.id}' references resolved_by '${gap.resolved_by}' which does not exist`,
                        block: "gaps",
                        field: `gaps[${gap.id}].resolved_by`,
                    });
                }
            }
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Validate requirement references
    try {
        const reqData = readBlock(cwd, "requirements");
        if (Array.isArray(reqData.requirements)) {
            for (const req of reqData.requirements) {
                if (Array.isArray(req.traces_to)) {
                    for (const ref of req.traces_to) {
                        if (!allIds.has(ref)) {
                            issues.push({
                                severity: "warning",
                                message: `Requirement '${req.id}' traces to '${ref}' which does not exist`,
                                block: "requirements",
                                field: `requirements[${req.id}].traces_to`,
                            });
                        }
                    }
                }
                if (Array.isArray(req.depends_on)) {
                    for (const dep of req.depends_on) {
                        if (!requirementIds.has(dep)) {
                            issues.push({
                                severity: "error",
                                message: `Requirement '${req.id}' depends on requirement '${dep}' which does not exist`,
                                block: "requirements",
                                field: `requirements[${req.id}].depends_on`,
                            });
                        }
                    }
                }
            }
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Validate verification references
    try {
        const verData = readBlock(cwd, "verification");
        if (Array.isArray(verData.verifications)) {
            for (const ver of verData.verifications) {
                if (ver.target && !allIds.has(String(ver.target))) {
                    issues.push({
                        severity: "warning",
                        message: `Verification '${ver.id}' targets '${ver.target}' which does not exist`,
                        block: "verification",
                        field: `verifications[${ver.id}].target`,
                    });
                }
            }
        }
    }
    catch {
        /* block doesn't exist */
    }
    // Validate rationale references
    try {
        const ratData = readBlock(cwd, "rationale");
        if (Array.isArray(ratData.rationales)) {
            for (const rat of ratData.rationales) {
                if (Array.isArray(rat.related_decisions)) {
                    for (const decId of rat.related_decisions) {
                        if (!decisionIds.has(decId)) {
                            issues.push({
                                severity: "warning",
                                message: `Rationale '${rat.id}' references decision '${decId}' which does not exist`,
                                block: "rationale",
                                field: `rationales[${rat.id}].related_decisions`,
                            });
                        }
                    }
                }
            }
        }
    }
    catch {
        /* block doesn't exist */
    }
    return {
        valid: issues.filter((i) => i.severity === "error").length === 0,
        issues,
    };
}
//# sourceMappingURL=project-sdk.js.map