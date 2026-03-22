/**
 * Workflow SDK — single queryable surface for the workflow extension's
 * vocabulary, discovery, and spec introspection. Derives dynamically
 * from source registries and filesystem — add a filter, agent, template,
 * or schema, and it appears here automatically.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AgentNotFoundError, createAgentLoader, parseAgentYaml } from "./agent-spec.js";
import { EXPRESSION_ROOTS, FILTER_NAMES } from "./expression.js";
import { availableMonitors } from "./step-monitor.js";
import { resolveSchemaPath } from "./step-shared.js";
import { discoverWorkflows } from "./workflow-discovery.js";
import { STEP_TYPES } from "./workflow-spec.js";
// Re-export for single-import convenience
export { EXPRESSION_ROOTS, FILTER_NAMES, STEP_TYPES };
const EXPR_PATTERN = /\$\{\{\s*(.*?)\s*\}\}/g;
// ── Vocabulary (derived from code registries) ────────────────────────────────
export function filterNames() {
    return FILTER_NAMES;
}
export function stepTypes() {
    return STEP_TYPES;
}
export function expressionRoots() {
    return EXPRESSION_ROOTS;
}
// ── Discovery (derived from filesystem) ──────────────────────────────────────
export function availableAgents(cwd, builtinDir) {
    const defaultBuiltinDir = builtinDir ?? path.resolve(import.meta.dirname, "..", "agents");
    const searchDirs = [
        path.join(cwd, ".pi", "agents"),
        path.join(os.homedir(), ".pi", "agent", "agents"),
        defaultBuiltinDir,
    ];
    const seen = new Set();
    const agents = [];
    for (const dir of searchDirs) {
        if (!fs.existsSync(dir))
            continue;
        for (const file of fs.readdirSync(dir)) {
            if (!file.endsWith(".agent.yaml"))
                continue;
            const name = file.replace(".agent.yaml", "");
            if (seen.has(name))
                continue; // higher-priority dir already found this agent
            seen.add(name);
            try {
                agents.push(parseAgentYaml(path.join(dir, file)));
            }
            catch {
                // skip malformed specs
            }
        }
    }
    return agents.sort((a, b) => a.name.localeCompare(b.name));
}
export function availableTemplates(cwd, builtinDir) {
    const defaultBuiltinDir = builtinDir ?? path.resolve(import.meta.dirname, "..", "templates");
    const searchDirs = [
        path.join(cwd, ".pi", "templates"),
        path.join(os.homedir(), ".pi", "agent", "templates"),
        defaultBuiltinDir,
    ];
    const seen = new Set();
    for (const dir of searchDirs) {
        if (!fs.existsSync(dir))
            continue;
        walkFiles(dir, (filePath) => {
            if (filePath.endsWith(".md") || filePath.endsWith(".txt")) {
                const rel = path.relative(dir, filePath);
                if (!seen.has(rel))
                    seen.add(rel);
            }
        });
    }
    return Array.from(seen).sort();
}
export function availableSchemas(cwd, builtinDir) {
    const defaultBuiltinSchemas = builtinDir ?? path.resolve(import.meta.dirname, "..", "schemas");
    const dirs = [defaultBuiltinSchemas];
    const schemas = [];
    for (const dir of dirs) {
        if (!fs.existsSync(dir))
            continue;
        for (const file of fs.readdirSync(dir)) {
            if (file.endsWith(".schema.json")) {
                schemas.push(path.join(dir, file));
            }
        }
    }
    return schemas.sort();
}
export function availableWorkflows(cwd) {
    return discoverWorkflows(cwd);
}
/**
 * Extract all ${{ }} expressions from a workflow spec with their source locations.
 * Walks the entire spec tree including nested steps in loops and parallel blocks.
 */
export function extractExpressions(spec) {
    const refs = [];
    // Walk top-level steps
    for (const [stepName, step] of Object.entries(spec.steps)) {
        extractFromStep(step, `steps.${stepName}`, refs);
    }
    // Walk completion
    if (spec.completion) {
        if (spec.completion.template) {
            extractFromString(spec.completion.template, "completion.template", refs);
        }
        if (spec.completion.message) {
            extractFromString(spec.completion.message, "completion.message", refs);
        }
        if (spec.completion.include) {
            for (const inc of spec.completion.include) {
                extractFromString(inc, "completion.include", refs);
            }
        }
    }
    // Walk artifacts
    if (spec.artifacts) {
        for (const [name, art] of Object.entries(spec.artifacts)) {
            extractFromString(art.path, `artifacts.${name}.path`, refs);
            extractFromString(art.from, `artifacts.${name}.from`, refs);
        }
    }
    return refs;
}
function extractFromStep(step, prefix, refs) {
    if (step.when)
        extractFromString(step.when, `${prefix}.when`, refs);
    if (step.forEach)
        extractFromString(step.forEach, `${prefix}.forEach`, refs);
    if (step.input)
        extractFromValue(step.input, `${prefix}.input`, refs);
    if (step.command)
        extractFromString(step.command, `${prefix}.command`, refs);
    // Gate check
    if (step.gate?.check)
        extractFromString(step.gate.check, `${prefix}.gate.check`, refs);
    // Transform mapping
    if (step.transform?.mapping) {
        extractFromValue(step.transform.mapping, `${prefix}.transform.mapping`, refs);
    }
    // Nested loop steps
    if (step.loop?.steps) {
        for (const [subName, subStep] of Object.entries(step.loop.steps)) {
            extractFromStep(subStep, `${prefix}.loop.steps.${subName}`, refs);
        }
    }
    // Nested parallel steps
    if (step.parallel) {
        for (const [subName, subStep] of Object.entries(step.parallel)) {
            extractFromStep(subStep, `${prefix}.parallel.${subName}`, refs);
        }
    }
}
function extractFromValue(value, field, refs) {
    if (typeof value === "string") {
        extractFromString(value, field, refs);
    }
    else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            extractFromValue(value[i], `${field}[${i}]`, refs);
        }
    }
    else if (value && typeof value === "object") {
        for (const [key, val] of Object.entries(value)) {
            extractFromValue(val, `${field}.${key}`, refs);
        }
    }
}
function extractFromString(str, field, refs) {
    EXPR_PATTERN.lastIndex = 0;
    let match;
    while ((match = EXPR_PATTERN.exec(str)) !== null) {
        const raw = match[1].trim();
        const pipeIdx = raw.indexOf("|");
        const exprPart = pipeIdx >= 0 ? raw.slice(0, pipeIdx).trim() : raw;
        const filterName = pipeIdx >= 0 ? raw.slice(pipeIdx + 1).trim() : undefined;
        // Extract step references: steps.X.anything → step name is X
        // Step names may contain hyphens (e.g., analyze-structure)
        const stepRefs = [];
        const stepRefPattern = /\bsteps\.([\w-]+)/g;
        let stepMatch;
        while ((stepMatch = stepRefPattern.exec(exprPart)) !== null) {
            if (!stepRefs.includes(stepMatch[1])) {
                stepRefs.push(stepMatch[1]);
            }
        }
        refs.push({ expression: raw, field, stepRefs, filterName });
    }
}
export function declaredSteps(spec) {
    return Object.keys(spec.steps);
}
export function declaredAgentRefs(spec) {
    const agents = [];
    collectAgentRefs(spec.steps, agents);
    return [...new Set(agents)];
}
function collectAgentRefs(steps, agents) {
    for (const step of Object.values(steps)) {
        if (step.agent)
            agents.push(step.agent);
        if (step.loop?.steps)
            collectAgentRefs(step.loop.steps, agents);
        if (step.parallel)
            collectAgentRefs(step.parallel, agents);
    }
}
export function declaredMonitorRefs(spec) {
    const monitors = [];
    collectMonitorRefs(spec.steps, monitors);
    return [...new Set(monitors)];
}
function collectMonitorRefs(steps, monitors) {
    for (const step of Object.values(steps)) {
        if (step.monitor)
            monitors.push(step.monitor);
        if (step.loop?.steps)
            collectMonitorRefs(step.loop.steps, monitors);
        if (step.parallel)
            collectMonitorRefs(step.parallel, monitors);
    }
}
export function declaredSchemaRefs(spec) {
    const schemas = [];
    collectSchemaRefs(spec.steps, schemas);
    if (spec.artifacts) {
        for (const art of Object.values(spec.artifacts)) {
            if (art.schema)
                schemas.push(art.schema);
        }
    }
    return [...new Set(schemas)];
}
function collectSchemaRefs(steps, schemas) {
    for (const step of Object.values(steps)) {
        if (step.output?.schema)
            schemas.push(step.output.schema);
        if (step.loop?.steps)
            collectSchemaRefs(step.loop.steps, schemas);
        if (step.parallel)
            collectSchemaRefs(step.parallel, schemas);
    }
}
/**
 * Validate a workflow spec against the filesystem: resolve agents, schemas,
 * step references, and filter names. Returns structured issues rather than
 * throwing — intended for authoring-time validation, not execution-time.
 */
export function validateWorkflow(spec, cwd) {
    const issues = [];
    const steps = declaredSteps(spec);
    // 1. Agent resolution — do all referenced agents exist?
    const agentRefs = declaredAgentRefs(spec);
    if (agentRefs.length > 0) {
        const loadAgent = createAgentLoader(cwd);
        for (const agentName of agentRefs) {
            try {
                loadAgent(agentName);
            }
            catch (err) {
                if (err instanceof AgentNotFoundError) {
                    // Find which step(s) reference this agent for the field path
                    const fields = findAgentFields(spec.steps, agentName, "steps");
                    for (const field of fields) {
                        issues.push({
                            severity: "error",
                            message: `Agent '${agentName}' not found. Searched: ${err.searchPaths.join(", ")}`,
                            field,
                        });
                    }
                }
                else {
                    issues.push({
                        severity: "error",
                        message: `Agent '${agentName}' failed to load: ${err instanceof Error ? err.message : String(err)}`,
                        field: "agents",
                    });
                }
            }
        }
    }
    // 1b. Monitor resolution — do all referenced monitors exist?
    const monitorRefs = declaredMonitorRefs(spec);
    if (monitorRefs.length > 0) {
        const known = new Set(availableMonitors(cwd));
        for (const monitorName of monitorRefs) {
            if (!known.has(monitorName)) {
                const fields = findMonitorFields(spec.steps, monitorName, "steps");
                for (const field of fields) {
                    issues.push({
                        severity: "warning",
                        message: `Monitor '${monitorName}' not found in .pi/monitors/ or built-in examples`,
                        field,
                    });
                }
            }
        }
    }
    // 2. Schema resolution — do all referenced schema files exist?
    const schemaRefs = declaredSchemaRefs(spec);
    for (const schemaPath of schemaRefs) {
        const resolved = resolveSchemaPath(schemaPath, spec.filePath);
        if (!fs.existsSync(resolved)) {
            issues.push({
                severity: "error",
                message: `Schema file not found: ${schemaPath} (resolved to ${resolved})`,
                field: findSchemaField(spec, schemaPath),
            });
        }
    }
    // 3. Step reference validity — do ${{ steps.X }} references point to declared steps?
    const expressions = extractExpressions(spec);
    const stepSet = new Set(steps);
    for (const expr of expressions) {
        for (const stepRef of expr.stepRefs) {
            if (!stepSet.has(stepRef)) {
                issues.push({
                    severity: "error",
                    message: `Expression references undeclared step '${stepRef}'`,
                    field: expr.field,
                });
            }
        }
    }
    // 4. Step ordering — does step B reference steps.A where A comes after B?
    //    Skip this check for expressions inside loop and parallel contexts
    //    (they have different execution semantics).
    const stepOrder = new Map(steps.map((s, i) => [s, i]));
    for (const expr of expressions) {
        // Only check top-level step expressions (not inside .loop. or .parallel.)
        if (expr.field.includes(".loop.") || expr.field.includes(".parallel."))
            continue;
        // Extract the step this expression belongs to
        const fieldStepMatch = expr.field.match(/^steps\.(\w+)/);
        if (!fieldStepMatch)
            continue;
        const ownerStep = fieldStepMatch[1];
        const ownerIdx = stepOrder.get(ownerStep);
        if (ownerIdx === undefined)
            continue;
        for (const stepRef of expr.stepRefs) {
            const refIdx = stepOrder.get(stepRef);
            if (refIdx !== undefined && refIdx >= ownerIdx) {
                issues.push({
                    severity: "error",
                    message: `Step '${ownerStep}' references '${stepRef}' which is declared at or after it (index ${refIdx} >= ${ownerIdx})`,
                    field: expr.field,
                });
            }
        }
    }
    // 5. Filter name validity — are all filter names known?
    const validFilters = new Set(FILTER_NAMES);
    for (const expr of expressions) {
        if (expr.filterName && !validFilters.has(expr.filterName)) {
            issues.push({
                severity: "warning",
                message: `Unknown filter '${expr.filterName}'. Available: ${FILTER_NAMES.join(", ")}`,
                field: expr.field,
            });
        }
    }
    return {
        valid: issues.filter((i) => i.severity === "error").length === 0,
        issues,
    };
}
/** Find field paths where a specific monitor name is referenced. */
function findMonitorFields(steps, monitorName, prefix) {
    const fields = [];
    for (const [name, step] of Object.entries(steps)) {
        if (step.monitor === monitorName)
            fields.push(`${prefix}.${name}.monitor`);
        if (step.loop?.steps)
            fields.push(...findMonitorFields(step.loop.steps, monitorName, `${prefix}.${name}.loop`));
        if (step.parallel)
            fields.push(...findMonitorFields(step.parallel, monitorName, `${prefix}.${name}.parallel`));
    }
    return fields;
}
/** Find field paths where a specific agent name is referenced. */
function findAgentFields(steps, agentName, prefix) {
    const fields = [];
    for (const [name, step] of Object.entries(steps)) {
        if (step.agent === agentName)
            fields.push(`${prefix}.${name}.agent`);
        if (step.loop?.steps)
            fields.push(...findAgentFields(step.loop.steps, agentName, `${prefix}.${name}.loop`));
        if (step.parallel)
            fields.push(...findAgentFields(step.parallel, agentName, `${prefix}.${name}.parallel`));
    }
    return fields;
}
/** Find the field path where a schema is referenced. */
function findSchemaField(spec, schemaPath) {
    for (const [name, step] of Object.entries(spec.steps)) {
        if (step.output?.schema === schemaPath)
            return `steps.${name}.output.schema`;
        if (step.loop?.steps) {
            for (const [sub, subStep] of Object.entries(step.loop.steps)) {
                if (subStep.output?.schema === schemaPath)
                    return `steps.${name}.loop.${sub}.output.schema`;
            }
        }
        if (step.parallel) {
            for (const [sub, subStep] of Object.entries(step.parallel)) {
                if (subStep.output?.schema === schemaPath)
                    return `steps.${name}.parallel.${sub}.output.schema`;
            }
        }
    }
    if (spec.artifacts) {
        for (const [name, art] of Object.entries(spec.artifacts)) {
            if (art.schema === schemaPath)
                return `artifacts.${name}.schema`;
        }
    }
    return "unknown";
}
// ── Utility ──────────────────────────────────────────────────────────────────
function walkFiles(dir, callback) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(full, callback);
        }
        else if (entry.isFile()) {
            callback(full);
        }
    }
}
//# sourceMappingURL=workflow-sdk.js.map