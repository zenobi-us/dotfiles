import fs from "node:fs";
import _Ajv from "ajv";
// Node16 module resolution + CJS interop: default import is the module namespace
const Ajv = _Ajv.default ?? _Ajv;
const ajv = new Ajv({ allErrors: true, strict: false });
/**
 * Error class for validation failures.
 * Contains the original AJV errors and a formatted message.
 */
export class ValidationError extends Error {
    label;
    errors;
    constructor(label, errors) {
        const details = errors.map((e) => `${e.instancePath || ""}: ${e.message}`).join("; ");
        super(`Validation failed for ${label}: ${details}`);
        this.name = "ValidationError";
        this.label = label;
        this.errors = errors;
    }
}
/**
 * Validate data against a JSON Schema object.
 * Throws ValidationError with formatted error messages on failure.
 * Returns the validated data on success (pass-through).
 */
export function validate(schema, data, label) {
    const valid = ajv.validate(schema, data);
    if (!valid) {
        throw new ValidationError(label, ajv.errors ?? []);
    }
    return data;
}
/**
 * Load a JSON Schema from a file path and validate data against it.
 * Throws if the schema file doesn't exist or is invalid JSON.
 * Throws ValidationError on validation failure.
 */
export function validateFromFile(schemaPath, data, label) {
    let content;
    try {
        content = fs.readFileSync(schemaPath, "utf-8");
    }
    catch {
        throw new Error(`Schema file not found: ${schemaPath}`);
    }
    let schema;
    try {
        schema = JSON.parse(content);
    }
    catch (err) {
        throw new Error(`Invalid JSON in schema file: ${schemaPath}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return validate(schema, data, label);
}
//# sourceMappingURL=schema-validator.js.map