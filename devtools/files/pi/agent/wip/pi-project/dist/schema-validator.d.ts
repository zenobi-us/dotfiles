import type { ErrorObject } from "ajv";
/**
 * Error class for validation failures.
 * Contains the original AJV errors and a formatted message.
 */
export declare class ValidationError extends Error {
    readonly label: string;
    readonly errors: ErrorObject[];
    constructor(label: string, errors: ErrorObject[]);
}
/**
 * Validate data against a JSON Schema object.
 * Throws ValidationError with formatted error messages on failure.
 * Returns the validated data on success (pass-through).
 */
export declare function validate(schema: Record<string, unknown>, data: unknown, label: string): unknown;
/**
 * Load a JSON Schema from a file path and validate data against it.
 * Throws if the schema file doesn't exist or is invalid JSON.
 * Throws ValidationError on validation failure.
 */
export declare function validateFromFile(schemaPath: string, data: unknown, label: string): unknown;
//# sourceMappingURL=schema-validator.d.ts.map