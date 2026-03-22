/**
 * Extension entry point for pi-project — registers block tools and the
 * /project command for project state management.
 */
import fs from "node:fs";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { appendToBlock, readBlock, updateItemInBlock, writeBlock } from "./block-api.js";
import { PROJECT_DIR, SCHEMAS_DIR } from "./project-dir.js";
import { findAppendableBlocks, projectState, validateProject } from "./project-sdk.js";
import { checkForUpdates } from "./update-check.js";
// ── Command handlers ────────────────────────────────────────────────────────
/**
 * /project status — derives project state from authoritative sources and
 * sends it as a structured message. Available to human, LLM, and system.
 */
function handleStatus(ctx, pi) {
    const state = projectState(ctx.cwd);
    const lines = [];
    lines.push(`## Project Status`);
    lines.push("");
    lines.push(`**Source:** ${state.sourceFiles} files, ${state.sourceLines} lines | **Tests:** ${state.testCount}`);
    lines.push(`**Schemas:** ${state.schemas} | **Blocks:** ${state.blocks}`);
    lines.push(`**Phases:** ${state.phases.total} (current: ${state.phases.current})`);
    lines.push(`**Commit:** ${state.lastCommit} (${state.lastCommitMessage})`);
    // Block summaries
    const summaryEntries = Object.entries(state.blockSummaries);
    if (summaryEntries.length > 0) {
        lines.push("");
        lines.push("**Blocks:**");
        for (const [name, summary] of summaryEntries) {
            const arrayEntries = Object.entries(summary.arrays);
            if (arrayEntries.length === 1) {
                // Single-array block — compact display
                const [, arr] = arrayEntries[0];
                let detail = `${arr.total} items`;
                if (arr.byStatus) {
                    detail += ` (${Object.entries(arr.byStatus)
                        .map(([s, n]) => `${s}: ${n}`)
                        .join(", ")})`;
                }
                lines.push(`- **${name}:** ${detail}`);
            }
            else {
                // Multi-array block — show each array
                lines.push(`- **${name}:**`);
                for (const [key, arr] of arrayEntries) {
                    lines.push(`    ${key}: ${arr.total}`);
                }
            }
        }
    }
    // Planning lifecycle
    if (state.requirements) {
        const r = state.requirements;
        const statusParts = Object.entries(r.byStatus)
            .map(([s, n]) => `${s}: ${n}`)
            .join(", ");
        lines.push(`- **Requirements:** ${r.total} (${statusParts})`);
    }
    if (state.tasks) {
        const t = state.tasks;
        const statusParts = Object.entries(t.byStatus)
            .map(([s, n]) => `${s}: ${n}`)
            .join(", ");
        lines.push(`- **Tasks:** ${t.total} (${statusParts})`);
    }
    if (state.domain) {
        lines.push(`- **Domain:** ${state.domain.total} entries`);
    }
    if (state.verifications) {
        const v = state.verifications;
        lines.push(`- **Verifications:** ${v.total} (${v.passed} passed, ${v.failed} failed)`);
    }
    if (state.hasHandoff) {
        lines.push(`- **Handoff:** active (.project/handoff.json)`);
    }
    if (state.recentCommits.length > 0) {
        lines.push("");
        lines.push("**Recent:**");
        for (const c of state.recentCommits)
            lines.push(`  ${c}`);
    }
    pi.sendMessage({
        customType: "project-status",
        content: lines.join("\n"),
        display: true,
    });
}
/**
 * /project add-work — discovers appendable blocks from schemas,
 * returns a structured instruction for main context to extract
 * items from the conversation into typed JSON blocks.
 */
async function handleAddWork(args, ctx, pi) {
    const workflowDir = path.join(ctx.cwd, PROJECT_DIR);
    const schemasDir = path.join(workflowDir, SCHEMAS_DIR);
    if (!fs.existsSync(schemasDir)) {
        ctx.ui.notify(`No ${PROJECT_DIR}/${SCHEMAS_DIR}/ directory found.`, "warning");
        return;
    }
    const appendableBlocks = findAppendableBlocks(ctx.cwd);
    const blockInfo = [];
    for (const { block, arrayKey, schemaPath } of appendableBlocks) {
        const dataPath = path.join(workflowDir, `${block}.json`);
        const schema = fs.readFileSync(schemaPath, "utf8");
        let currentCount = "";
        try {
            const data = readBlock(ctx.cwd, block);
            const arr = data[arrayKey];
            if (Array.isArray(arr))
                currentCount = ` (${arr.length} existing)`;
        }
        catch {
            /* block file doesn't exist or invalid — skip count */
        }
        blockInfo.push(`### ${block} (array: ${arrayKey})${currentCount}\nSchema: ${schemaPath}\nData: ${dataPath}\n\`\`\`json\n${schema}\n\`\`\``);
    }
    const inputSection = args.trim() ? `**Input:**\n${args.trim()}\n\n` : "";
    const blockNames = appendableBlocks.map((b) => b.block).join(", ");
    const instruction = `## Add Work to Project Blocks

${inputSection}Read the recent conversation and extract relevant items into the project's typed JSON blocks. Each block has a schema — conform to it exactly.

**Appendable blocks:** ${blockNames}

**Blocks to update:**

${blockInfo.join("\n\n")}

**Process:**
1. Read the conversation for items that belong in the appendable blocks
2. Read the current block files to check for duplicates
3. Append new entries — do NOT replace existing content
4. Schema validation happens automatically when you use append-block-item

**Rules:**
- IDs must be kebab-case and unique within their block
- Use \`source: "human"\` for content from this conversation
- Architecture changes and phase creation are separate processes — do not attempt them here`;
    pi.sendMessage({
        customType: "project-add-work",
        content: instruction,
        display: false,
    }, {
        triggerTurn: true,
        deliverAs: "followUp",
    });
}
/**
 * Initialize .project/ directory with default schemas and empty block files.
 * Idempotent: skips files that already exist. Shared by the /project init
 * command handler and the project-init tool.
 */
function initProject(cwd) {
    const projectDir = path.join(cwd, PROJECT_DIR);
    const schemasDir = path.join(projectDir, SCHEMAS_DIR);
    const phasesDir = path.join(projectDir, "phases");
    const defaultsDir = path.resolve(import.meta.dirname, "..", "defaults");
    const defaultSchemasDir = path.join(defaultsDir, "schemas");
    const defaultBlocksDir = path.join(defaultsDir, "blocks");
    const created = [];
    const skipped = [];
    // Create directories
    for (const dir of [projectDir, schemasDir, phasesDir]) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            created.push(path.relative(cwd, dir) + "/");
        }
    }
    // Copy default schemas
    if (fs.existsSync(defaultSchemasDir)) {
        for (const file of fs.readdirSync(defaultSchemasDir)) {
            const dest = path.join(schemasDir, file);
            if (fs.existsSync(dest)) {
                skipped.push(`${SCHEMAS_DIR}/${file}`);
            }
            else {
                fs.copyFileSync(path.join(defaultSchemasDir, file), dest);
                created.push(`${SCHEMAS_DIR}/${file}`);
            }
        }
    }
    // Create default block files
    if (fs.existsSync(defaultBlocksDir)) {
        for (const file of fs.readdirSync(defaultBlocksDir)) {
            const dest = path.join(projectDir, file);
            if (fs.existsSync(dest)) {
                skipped.push(file);
            }
            else {
                fs.copyFileSync(path.join(defaultBlocksDir, file), dest);
                created.push(file);
            }
        }
    }
    return { created, skipped };
}
/**
 * /project init — scaffold .project/ directory with default schemas and
 * empty block files. Idempotent: skips files that already exist.
 */
function handleInit(ctx) {
    const { created, skipped } = initProject(ctx.cwd);
    const lines = [];
    lines.push(`Project initialized`);
    lines.push("");
    if (created.length > 0) {
        lines.push(`Created (${created.length}): ${created.join(", ")}`);
    }
    if (skipped.length > 0) {
        lines.push(`Skipped (${skipped.length}, already exist): ${skipped.join(", ")}`);
    }
    if (created.length === 0 && skipped.length > 0) {
        lines.push("Project already initialized — nothing to do.");
    }
    ctx.ui.notify(lines.join("\n"), "info");
}
// ── Extension factory ───────────────────────────────────────────────────────
const extension = (pi) => {
    // ── Update check on session start (non-blocking) ───────────────────
    pi.on("session_start", async (_event, ctx) => {
        checkForUpdates((msg, level) => ctx.ui.notify(msg, level)).catch(() => { });
    });
    // ── Tool: append-block-item ─────────────────────────────────────────
    pi.registerTool({
        name: "append-block-item",
        label: "Append Block Item",
        description: "Append an item to an array in a project block file. Schema validation is automatic.",
        promptSnippet: "Append items to project blocks (gaps, decisions, or any user-defined block)",
        parameters: Type.Object({
            block: Type.String({ description: "Block name (e.g., 'gaps', 'decisions')" }),
            arrayKey: Type.String({ description: "Array key in the block (e.g., 'gaps', 'decisions')" }),
            item: Type.Unknown({ description: "Item object to append — must conform to block schema" }),
        }),
        async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
            // Duplicate check if item has an id field
            if (params.item && typeof params.item === "object" && "id" in params.item) {
                try {
                    const data = readBlock(ctx.cwd, params.block);
                    const arr = data[params.arrayKey];
                    if (Array.isArray(arr) && arr.some((i) => i.id === params.item.id)) {
                        throw new Error(`Item '${params.item.id}' already exists in ${params.block}.${params.arrayKey}`);
                    }
                }
                catch (e) {
                    /* Re-throw duplicate errors; swallow block-not-found */
                    if (e instanceof Error && e.message.includes("already exists"))
                        throw e;
                }
            }
            appendToBlock(ctx.cwd, params.block, params.arrayKey, params.item);
            const id = params.item?.id ? ` '${params.item.id}'` : "";
            return {
                details: undefined,
                content: [{ type: "text", text: `Appended item${id} to ${params.block}.${params.arrayKey}` }],
            };
        },
    });
    // ── Tool: update-block-item ───────────────────────────────────────────
    pi.registerTool({
        name: "update-block-item",
        label: "Update Block Item",
        description: "Update fields on an item in a project block array. Finds by predicate field match.",
        promptSnippet: "Update items in project blocks — change status, add details, mark resolved",
        parameters: Type.Object({
            block: Type.String({ description: "Block name (e.g., 'gaps', 'decisions')" }),
            arrayKey: Type.String({ description: "Array key in the block" }),
            match: Type.Record(Type.String(), Type.Unknown(), { description: "Fields to match (e.g., { id: 'gap-123' })" }),
            updates: Type.Record(Type.String(), Type.Unknown(), {
                description: "Fields to update (e.g., { status: 'resolved' })",
            }),
        }),
        async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
            if (Object.keys(params.updates).length === 0) {
                throw new Error("No fields to update — updates parameter is empty");
            }
            const matchEntries = Object.entries(params.match);
            updateItemInBlock(ctx.cwd, params.block, params.arrayKey, (item) => matchEntries.every(([k, v]) => item[k] === v), params.updates);
            const matchDesc = matchEntries.map(([k, v]) => `${k}=${v}`).join(", ");
            return {
                details: undefined,
                content: [
                    {
                        type: "text",
                        text: `Updated item (${matchDesc}) in ${params.block}.${params.arrayKey}: ${Object.keys(params.updates).join(", ")}`,
                    },
                ],
            };
        },
    });
    // ── Tool: read-block ────────────────────────────────────────────────────
    pi.registerTool({
        name: "read-block",
        label: "Read Block",
        description: "Read a project block file as structured JSON.",
        promptSnippet: "Read a project block as structured JSON",
        parameters: Type.Object({
            block: Type.String({ description: "Block name (e.g., 'gaps', 'tasks', 'requirements')" }),
        }),
        async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
            const result = readBlock(ctx.cwd, params.block);
            return {
                details: undefined,
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        },
    });
    // ── Tool: write-block ───────────────────────────────────────────────────
    pi.registerTool({
        name: "write-block",
        label: "Write Block",
        description: "Write or replace an entire project block with schema validation.",
        promptSnippet: "Write or replace a project block with schema validation",
        parameters: Type.Object({
            block: Type.String({ description: "Block name (e.g., 'project', 'architecture')" }),
            data: Type.Unknown({ description: "Complete block data — must conform to block schema" }),
        }),
        async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
            const data = typeof params.data === "string" ? JSON.parse(params.data) : params.data;
            writeBlock(ctx.cwd, params.block, data);
            return {
                details: undefined,
                content: [{ type: "text", text: `Wrote block '${params.block}' successfully` }],
            };
        },
    });
    // ── Tool: project-status ────────────────────────────────────────────────
    pi.registerTool({
        name: "project-status",
        label: "Project Status",
        description: "Get derived project state — source metrics, block summaries, planning lifecycle status.",
        promptSnippet: "Get project state — source metrics, block summaries, planning lifecycle status",
        parameters: Type.Object({}),
        async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
            const result = projectState(ctx.cwd);
            return {
                details: undefined,
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        },
    });
    // ── Tool: project-validate ──────────────────────────────────────────────
    pi.registerTool({
        name: "project-validate",
        label: "Project Validate",
        description: "Validate cross-block referential integrity — check that IDs referenced across blocks exist.",
        promptSnippet: "Validate cross-block referential integrity",
        parameters: Type.Object({}),
        async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
            const result = validateProject(ctx.cwd);
            return {
                details: undefined,
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        },
    });
    // ── Tool: project-init ──────────────────────────────────────────────────
    pi.registerTool({
        name: "project-init",
        label: "Project Init",
        description: "Initialize .project/ directory with default schemas and empty block files.",
        promptSnippet: "Initialize .project/ directory with default schemas and blocks",
        parameters: Type.Object({}),
        async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
            const result = initProject(ctx.cwd);
            return {
                details: undefined,
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        },
    });
    // ── Command: /project ──────────────────────────────────────────────────
    pi.registerCommand("project", {
        description: "Project state management",
        getArgumentCompletions: (prefix) => {
            const subcommands = ["init", "status", "add-work", "validate"];
            return subcommands.filter((s) => s.startsWith(prefix)).map((s) => ({ value: s, label: s }));
        },
        async handler(args, ctx) {
            const trimmed = args.trim();
            const spaceIdx = trimmed.indexOf(" ");
            const subcommand = spaceIdx === -1 ? trimmed || "status" : trimmed.slice(0, spaceIdx);
            const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1);
            if (subcommand === "init") {
                handleInit(ctx);
            }
            else if (subcommand === "status") {
                handleStatus(ctx, pi);
            }
            else if (subcommand === "add-work") {
                await handleAddWork(rest, ctx, pi);
            }
            else if (subcommand === "validate") {
                const result = validateProject(ctx.cwd);
                const errors = result.issues.filter((i) => i.severity === "error").length;
                const warnings = result.issues.filter((i) => i.severity === "warning").length;
                const lines = [];
                if (result.issues.length === 0) {
                    lines.push("Project validation passed — no cross-block reference issues.");
                }
                else {
                    for (const issue of result.issues) {
                        const icon = issue.severity === "error" ? "\u2717" : "\u26a0";
                        lines.push(`${icon} [${issue.block}] ${issue.field}: ${issue.message}`);
                    }
                    lines.push("");
                    lines.push(`${errors} error(s), ${warnings} warning(s)`);
                }
                ctx.ui.notify(lines.join("\n"), errors > 0 ? "error" : "info");
            }
            else {
                ctx.ui.notify(`Unknown subcommand: ${subcommand}. Use: init, status, add-work, validate`, "warning");
            }
        },
    });
};
export default extension;
// Re-export for consumers
export { blockStructure, findAppendableBlocks, PROJECT_BLOCK_TYPES, schemaInfo, schemaVocabulary, } from "./project-sdk.js";
//# sourceMappingURL=index.js.map