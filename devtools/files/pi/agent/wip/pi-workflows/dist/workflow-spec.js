import { parse as parseYaml } from "yaml";
/** Step type registry — add a step type here, parsing and SDK both see it automatically. */
export const STEP_TYPES = [
    { name: "agent", field: "agent", retryable: true, supportsInput: true, supportsOutput: true },
    { name: "gate", field: "gate", retryable: false, supportsInput: false, supportsOutput: false },
    { name: "transform", field: "transform", retryable: false, supportsInput: false, supportsOutput: false },
    { name: "loop", field: "loop", retryable: true, supportsInput: false, supportsOutput: false },
    { name: "parallel", field: "parallel", retryable: true, supportsInput: false, supportsOutput: false },
    { name: "pause", field: "pause", retryable: false, supportsInput: false, supportsOutput: false },
    { name: "command", field: "command", retryable: false, supportsInput: true, supportsOutput: true },
    { name: "monitor", field: "monitor", retryable: false, supportsInput: true, supportsOutput: true },
];
/** Set of valid step type field names — derived from STEP_TYPES. */
export const STEP_TYPE_FIELDS = new Set(STEP_TYPES.map((t) => t.field));
/**
 * Error class for spec parsing failures.
 */
export class WorkflowSpecError extends Error {
    filePath;
    reason;
    constructor(filePath, reason) {
        super(`Invalid workflow spec (${filePath}): ${reason}`);
        this.name = "WorkflowSpecError";
        this.filePath = filePath;
        this.reason = reason;
    }
}
/**
 * Parse a YAML string into a WorkflowSpec.
 * Validates structure (required fields, types).
 * Does NOT validate JSON Schemas or resolve agent references — that happens at execution time.
 *
 * @param content - raw YAML string
 * @param filePath - absolute path to the file (stored on the spec, used in error messages)
 * @param source - "user" or "project"
 * @throws WorkflowSpecError on invalid structure
 */
export function parseWorkflowSpec(content, filePath, source) {
    let doc;
    try {
        doc = parseYaml(content);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new WorkflowSpecError(filePath, `invalid YAML: ${msg}`);
    }
    if (typeof doc !== "object" || doc === null || Array.isArray(doc)) {
        throw new WorkflowSpecError(filePath, "'name' is required");
    }
    const raw = doc;
    // Validate name
    if (!("name" in raw) || raw.name === undefined || raw.name === null) {
        throw new WorkflowSpecError(filePath, "'name' is required");
    }
    if (typeof raw.name !== "string") {
        throw new WorkflowSpecError(filePath, "'name' is required");
    }
    // Validate steps
    if (!("steps" in raw) || raw.steps === undefined || raw.steps === null) {
        throw new WorkflowSpecError(filePath, "'steps' must be a non-empty object");
    }
    if (typeof raw.steps !== "object" || Array.isArray(raw.steps)) {
        throw new WorkflowSpecError(filePath, "'steps' must be a non-empty object");
    }
    const rawSteps = raw.steps;
    if (Object.keys(rawSteps).length === 0) {
        throw new WorkflowSpecError(filePath, "'steps' must be a non-empty object");
    }
    // Validate each step
    const steps = {};
    for (const [stepName, stepValue] of Object.entries(rawSteps)) {
        steps[stepName] = validateStep(stepValue, stepName, filePath);
    }
    // Build the spec with defaults
    const spec = {
        name: raw.name,
        description: typeof raw.description === "string" ? raw.description : "",
        steps,
        source,
        filePath,
    };
    if (raw.version !== undefined)
        spec.version = raw.version;
    if (raw.input !== undefined)
        spec.input = raw.input;
    if (raw.output !== undefined)
        spec.output = raw.output;
    // triggerTurn defaults to true
    if (typeof raw.triggerTurn === "boolean") {
        spec.triggerTurn = raw.triggerTurn;
    }
    else {
        spec.triggerTurn = true;
    }
    // completion (optional)
    if ("completion" in raw && raw.completion !== undefined) {
        if (typeof raw.completion !== "object" || raw.completion === null || Array.isArray(raw.completion)) {
            throw new WorkflowSpecError(filePath, "'completion' must be an object");
        }
        const rawComp = raw.completion;
        // Mutual exclusivity: template and message cannot coexist
        if ("template" in rawComp && "message" in rawComp) {
            throw new WorkflowSpecError(filePath, "'completion' cannot have both 'template' and 'message'");
        }
        // Must have at least one
        if (!("template" in rawComp) && !("message" in rawComp)) {
            throw new WorkflowSpecError(filePath, "'completion' must have either 'template' or 'message'");
        }
        const completion = {};
        if (typeof rawComp.template === "string") {
            completion.template = rawComp.template;
        }
        else if ("template" in rawComp) {
            throw new WorkflowSpecError(filePath, "'completion.template' must be a string");
        }
        if (typeof rawComp.message === "string") {
            completion.message = rawComp.message;
        }
        else if ("message" in rawComp) {
            throw new WorkflowSpecError(filePath, "'completion.message' must be a string");
        }
        if ("include" in rawComp) {
            if (!Array.isArray(rawComp.include)) {
                throw new WorkflowSpecError(filePath, "'completion.include' must be an array of strings");
            }
            for (const item of rawComp.include) {
                if (typeof item !== "string") {
                    throw new WorkflowSpecError(filePath, "'completion.include' must be an array of strings");
                }
            }
            completion.include = rawComp.include;
        }
        spec.completion = completion;
    }
    // artifacts (optional)
    if ("artifacts" in raw && raw.artifacts !== undefined) {
        if (typeof raw.artifacts !== "object" || raw.artifacts === null || Array.isArray(raw.artifacts)) {
            throw new WorkflowSpecError(filePath, "'artifacts' must be an object");
        }
        const rawArtifacts = raw.artifacts;
        const artifacts = {};
        for (const [artName, artValue] of Object.entries(rawArtifacts)) {
            if (typeof artValue !== "object" || artValue === null || Array.isArray(artValue)) {
                throw new WorkflowSpecError(filePath, `artifact '${artName}' must be an object`);
            }
            const rawArt = artValue;
            if (typeof rawArt.path !== "string") {
                throw new WorkflowSpecError(filePath, `artifact '${artName}' must have a 'path' string`);
            }
            if (typeof rawArt.from !== "string") {
                throw new WorkflowSpecError(filePath, `artifact '${artName}' must have a 'from' string`);
            }
            const artifact = {
                path: rawArt.path,
                from: rawArt.from,
            };
            if (rawArt.schema !== undefined) {
                if (typeof rawArt.schema !== "string") {
                    throw new WorkflowSpecError(filePath, `artifact '${artName}' schema must be a string`);
                }
                artifact.schema = rawArt.schema;
            }
            artifacts[artName] = artifact;
        }
        spec.artifacts = artifacts;
    }
    return spec;
}
/**
 * Validate and parse a single step from raw YAML data.
 * Enforces that exactly one of agent, gate, transform, or loop is set.
 * Rejects steps with `workflow` (not yet supported).
 * Recursively validates sub-steps within loops.
 */
function validateStep(stepValue, stepName, filePath) {
    if (typeof stepValue !== "object" || stepValue === null || Array.isArray(stepValue)) {
        throw new WorkflowSpecError(filePath, `step '${stepName}' must be an object`);
    }
    const rawStep = stepValue;
    // Reject workflow (not yet supported)
    if ("workflow" in rawStep && rawStep.workflow !== undefined) {
        throw new WorkflowSpecError(filePath, `step '${stepName}': nested workflows ('workflow') are not yet supported`);
    }
    // Count step types (derived from STEP_TYPES registry)
    const presentTypes = STEP_TYPES.filter((t) => t.field in rawStep && rawStep[t.field] !== undefined);
    const stepTypeList = STEP_TYPES.map((t) => t.field).join(", ");
    if (presentTypes.length === 0) {
        throw new WorkflowSpecError(filePath, `step '${stepName}' must have exactly one of: ${stepTypeList}`);
    }
    if (presentTypes.length > 1) {
        throw new WorkflowSpecError(filePath, `step '${stepName}' must have exactly one of: ${stepTypeList}`);
    }
    // Individual flags for downstream parsing (derived from presentTypes check above)
    const hasAgent = presentTypes[0].field === "agent";
    const hasGate = presentTypes[0].field === "gate";
    const hasTransform = presentTypes[0].field === "transform";
    const hasLoop = presentTypes[0].field === "loop";
    const hasParallel = presentTypes[0].field === "parallel";
    const hasPause = presentTypes[0].field === "pause";
    const hasCommand = presentTypes[0].field === "command";
    const hasMonitor = presentTypes[0].field === "monitor";
    const step = {};
    // Common optional fields
    if (rawStep.when !== undefined)
        step.when = rawStep.when;
    if (rawStep.timeout !== undefined)
        step.timeout = rawStep.timeout;
    // Retry config (optional)
    if ("retry" in rawStep && rawStep.retry !== undefined) {
        if (typeof rawStep.retry !== "object" || rawStep.retry === null || Array.isArray(rawStep.retry)) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' retry must be an object`);
        }
        const rawRetry = rawStep.retry;
        const retry = {};
        if ("maxAttempts" in rawRetry) {
            if (typeof rawRetry.maxAttempts !== "number" ||
                !Number.isInteger(rawRetry.maxAttempts) ||
                rawRetry.maxAttempts < 1) {
                throw new WorkflowSpecError(filePath, `step '${stepName}' retry.maxAttempts must be a positive integer`);
            }
            retry.maxAttempts = rawRetry.maxAttempts;
        }
        if ("onExhausted" in rawRetry) {
            if (rawRetry.onExhausted !== "fail" && rawRetry.onExhausted !== "skip") {
                throw new WorkflowSpecError(filePath, `step '${stepName}' retry.onExhausted must be 'fail' or 'skip'`);
            }
            retry.onExhausted = rawRetry.onExhausted;
        }
        if ("steeringMessage" in rawRetry) {
            if (typeof rawRetry.steeringMessage !== "string") {
                throw new WorkflowSpecError(filePath, `step '${stepName}' retry.steeringMessage must be a string`);
            }
            retry.steeringMessage = rawRetry.steeringMessage;
        }
        step.retry = retry;
    }
    // forEach and as (can combine with any step type)
    if ("forEach" in rawStep && rawStep.forEach !== undefined) {
        if (typeof rawStep.forEach !== "string") {
            throw new WorkflowSpecError(filePath, `step '${stepName}' forEach must be a string`);
        }
        step.forEach = rawStep.forEach;
    }
    if ("as" in rawStep && rawStep.as !== undefined) {
        if (typeof rawStep.as !== "string") {
            throw new WorkflowSpecError(filePath, `step '${stepName}' as must be a string`);
        }
        step.as = rawStep.as;
    }
    // Pause step
    if (hasPause) {
        if (typeof rawStep.pause !== "string" && rawStep.pause !== true) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' pause must be a string or true`);
        }
        step.pause = rawStep.pause;
        return step;
    }
    // Command step
    if (hasCommand) {
        if (typeof rawStep.command !== "string") {
            throw new WorkflowSpecError(filePath, `step '${stepName}' command must be a string`);
        }
        step.command = rawStep.command;
        // output spec (optional, same as agent)
        if ("output" in rawStep && rawStep.output !== undefined) {
            if (typeof rawStep.output !== "object" || rawStep.output === null || Array.isArray(rawStep.output)) {
                throw new WorkflowSpecError(filePath, `step '${stepName}' output must be an object`);
            }
            const rawOutput = rawStep.output;
            const output = {};
            if ("format" in rawOutput) {
                output.format = rawOutput.format;
            }
            if ("path" in rawOutput) {
                if (typeof rawOutput.path !== "string") {
                    throw new WorkflowSpecError(filePath, `step '${stepName}' output.path must be a string`);
                }
                output.path = rawOutput.path;
            }
            step.output = output;
        }
        // input (optional, for expression resolution context)
        if ("input" in rawStep && rawStep.input !== undefined) {
            if (typeof rawStep.input !== "object" || rawStep.input === null || Array.isArray(rawStep.input)) {
                throw new WorkflowSpecError(filePath, `step '${stepName}' input must be an object`);
            }
            step.input = rawStep.input;
        }
        return step;
    }
    // Monitor step
    if (hasMonitor) {
        if (typeof rawStep.monitor !== "string") {
            throw new WorkflowSpecError(filePath, `step '${stepName}' monitor must be a string`);
        }
        step.monitor = rawStep.monitor;
        // input (optional — maps to context collector keys)
        if ("input" in rawStep && rawStep.input !== undefined) {
            if (typeof rawStep.input !== "object" || rawStep.input === null || Array.isArray(rawStep.input)) {
                throw new WorkflowSpecError(filePath, `step '${stepName}' input must be an object`);
            }
            step.input = rawStep.input;
        }
        // output spec (optional)
        if ("output" in rawStep && rawStep.output !== undefined) {
            if (typeof rawStep.output !== "object" || rawStep.output === null || Array.isArray(rawStep.output)) {
                throw new WorkflowSpecError(filePath, `step '${stepName}' output must be an object`);
            }
            const rawOutput = rawStep.output;
            const output = {};
            if ("format" in rawOutput) {
                output.format = rawOutput.format;
            }
            if ("path" in rawOutput) {
                if (typeof rawOutput.path !== "string") {
                    throw new WorkflowSpecError(filePath, `step '${stepName}' output.path must be a string`);
                }
                output.path = rawOutput.path;
            }
            step.output = output;
        }
        return step;
    }
    // Agent step
    if (hasAgent) {
        if (typeof rawStep.agent !== "string") {
            throw new WorkflowSpecError(filePath, `step '${stepName}' agent must be a string`);
        }
        step.agent = rawStep.agent;
        // model must be a string if present
        if ("model" in rawStep && rawStep.model !== undefined) {
            if (typeof rawStep.model !== "string") {
                throw new WorkflowSpecError(filePath, `step '${stepName}' model must be a string`);
            }
            step.model = rawStep.model;
        }
        // input must be an object if present
        if ("input" in rawStep && rawStep.input !== undefined) {
            if (typeof rawStep.input !== "object" || rawStep.input === null || Array.isArray(rawStep.input)) {
                throw new WorkflowSpecError(filePath, `step '${stepName}' input must be an object`);
            }
            step.input = rawStep.input;
        }
        // output must be an object if present
        if ("output" in rawStep && rawStep.output !== undefined) {
            if (typeof rawStep.output !== "object" || rawStep.output === null || Array.isArray(rawStep.output)) {
                throw new WorkflowSpecError(filePath, `step '${stepName}' output must be an object`);
            }
            const rawOutput = rawStep.output;
            const output = {};
            if ("format" in rawOutput) {
                output.format = rawOutput.format;
            }
            if ("schema" in rawOutput) {
                if (typeof rawOutput.schema !== "string") {
                    throw new WorkflowSpecError(filePath, `step '${stepName}' output.schema must be a string`);
                }
                output.schema = rawOutput.schema;
            }
            if ("path" in rawOutput) {
                if (typeof rawOutput.path !== "string") {
                    throw new WorkflowSpecError(filePath, `step '${stepName}' output.path must be a string`);
                }
                output.path = rawOutput.path;
            }
            step.output = output;
        }
    }
    // Gate step
    if (hasGate) {
        if (typeof rawStep.gate !== "object" || rawStep.gate === null || Array.isArray(rawStep.gate)) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' gate must be an object`);
        }
        const rawGate = rawStep.gate;
        if (typeof rawGate.check !== "string") {
            throw new WorkflowSpecError(filePath, `step '${stepName}' gate must have a 'check' string`);
        }
        const gate = { check: rawGate.check };
        if (rawGate.onPass !== undefined)
            gate.onPass = rawGate.onPass;
        if (rawGate.onFail !== undefined)
            gate.onFail = rawGate.onFail;
        step.gate = gate;
    }
    // Transform step
    if (hasTransform) {
        if (typeof rawStep.transform !== "object" || rawStep.transform === null || Array.isArray(rawStep.transform)) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' transform must be an object`);
        }
        const rawTransform = rawStep.transform;
        if (typeof rawTransform.mapping !== "object" ||
            rawTransform.mapping === null ||
            Array.isArray(rawTransform.mapping)) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' transform must have a 'mapping' object`);
        }
        step.transform = { mapping: rawTransform.mapping };
    }
    // Loop step
    if (hasLoop) {
        if (typeof rawStep.loop !== "object" || rawStep.loop === null || Array.isArray(rawStep.loop)) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' loop must be an object`);
        }
        const rawLoop = rawStep.loop;
        // Must have maxAttempts (number or expression string) or attempts (string expression)
        const maxAttemptsRaw = rawLoop.maxAttempts;
        const hasMaxAttemptsNum = typeof maxAttemptsRaw === "number";
        const hasMaxAttemptsExpr = typeof maxAttemptsRaw === "string";
        const hasAttempts = "attempts" in rawLoop && typeof rawLoop.attempts === "string";
        if (!hasMaxAttemptsNum && !hasMaxAttemptsExpr && !hasAttempts) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' loop must have 'maxAttempts' (number or expression) or 'attempts' (expression)`);
        }
        // Must have non-empty steps
        if (!("steps" in rawLoop) ||
            typeof rawLoop.steps !== "object" ||
            rawLoop.steps === null ||
            Array.isArray(rawLoop.steps)) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' loop must have a non-empty 'steps' object`);
        }
        const rawLoopSteps = rawLoop.steps;
        if (Object.keys(rawLoopSteps).length === 0) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' loop must have a non-empty 'steps' object`);
        }
        // Recursively validate sub-steps
        const loopSteps = {};
        for (const [subName, subValue] of Object.entries(rawLoopSteps)) {
            loopSteps[subName] = validateStep(subValue, `${stepName}.loop.${subName}`, filePath);
        }
        const loop = {
            maxAttempts: hasMaxAttemptsNum ? maxAttemptsRaw : 0,
            steps: loopSteps,
        };
        // If maxAttempts is an expression string, treat it as the `attempts` field
        if (hasMaxAttemptsExpr) {
            loop.attempts = maxAttemptsRaw;
        }
        if (hasAttempts)
            loop.attempts = rawLoop.attempts;
        if (hasMaxAttemptsNum)
            loop.maxAttempts = maxAttemptsRaw;
        // onExhausted is an optional step
        if ("onExhausted" in rawLoop && rawLoop.onExhausted !== undefined) {
            loop.onExhausted = validateStep(rawLoop.onExhausted, `${stepName}.loop.onExhausted`, filePath);
        }
        step.loop = loop;
    }
    // Parallel step
    if (hasParallel) {
        if (typeof rawStep.parallel !== "object" || rawStep.parallel === null || Array.isArray(rawStep.parallel)) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' parallel must be a non-empty object`);
        }
        const rawParallel = rawStep.parallel;
        if (Object.keys(rawParallel).length === 0) {
            throw new WorkflowSpecError(filePath, `step '${stepName}' parallel must be a non-empty object`);
        }
        // Recursively validate sub-steps
        const parallelSteps = {};
        for (const [subName, subValue] of Object.entries(rawParallel)) {
            parallelSteps[subName] = validateStep(subValue, `${stepName}.parallel.${subName}`, filePath);
        }
        step.parallel = parallelSteps;
    }
    return step;
}
//# sourceMappingURL=workflow-spec.js.map