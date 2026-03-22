/**
 * Read and parse a .project/{blockName}.json file.
 * Throws if the file does not exist or contains invalid JSON.
 */
export declare function readBlock(cwd: string, blockName: string): unknown;
/**
 * Validate data against its schema (if one exists) and write atomically
 * to .project/{blockName}.json. Throws ValidationError on schema failure.
 * Files without a corresponding schema are written without validation.
 */
export declare function writeBlock(cwd: string, blockName: string, data: unknown): void;
/**
 * Read current file, push item onto data[arrayKey], validate whole file
 * against schema, write atomically. Throws if file doesn't exist, if
 * arrayKey is missing or not an array, or if validation fails.
 */
export declare function appendToBlock(cwd: string, blockName: string, arrayKey: string, item: unknown): void;
/**
 * Find an item in data[arrayKey] by predicate, shallow-merge updates onto it,
 * validate whole file against schema, write atomically. Throws if no item
 * matches, if arrayKey is missing or not an array, or if validation fails.
 */
export declare function updateItemInBlock(cwd: string, blockName: string, arrayKey: string, predicate: (item: Record<string, unknown>) => boolean, updates: Record<string, unknown>): void;
//# sourceMappingURL=block-api.d.ts.map