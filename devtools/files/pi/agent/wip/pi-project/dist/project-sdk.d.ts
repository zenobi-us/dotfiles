/**
 * Project SDK — queryable surface for project block state, discovery,
 * and derived metrics. Computes everything dynamically from filesystem
 * and git — no cache, no stale data.
 */
export interface BlockInfo {
    name: string;
    hasSchema: boolean;
}
export declare function availableBlocks(cwd: string): BlockInfo[];
/**
 * Discover schemas in PROJECT_DIR/SCHEMAS_DIR.
 * Returns sorted list of absolute paths to .schema.json files.
 */
export declare function availableSchemas(cwd: string): string[];
/**
 * Discover blocks with array properties by scanning PROJECT_DIR/SCHEMAS_DIR
 * for schemas whose root type has at least one array property.
 * Returns block name, first array key, and schema path for each.
 */
export declare function findAppendableBlocks(cwd: string): Array<{
    block: string;
    arrayKey: string;
    schemaPath: string;
}>;
/** Default planning lifecycle block types shipped with /project init. */
export declare const PROJECT_BLOCK_TYPES: readonly ["project", "domain", "requirements", "architecture", "tasks", "decisions", "gaps", "rationale", "verification", "handoff", "conformance-reference", "audit"];
export interface SchemaProperty {
    name: string;
    type: string;
    required: boolean;
    description?: string;
    enum?: string[];
}
export interface SchemaInfo {
    name: string;
    title: string;
    properties: SchemaProperty[];
    arrayKeys: string[];
    itemProperties?: Record<string, SchemaProperty[]>;
}
/**
 * Read and parse a schema, extracting property metadata.
 * Returns null if the schema file doesn't exist or is unparseable.
 */
export declare function schemaInfo(cwd: string, schemaName: string): SchemaInfo | null;
/**
 * All schemas with their property metadata.
 * Scans .project/schemas/ and parses each schema.
 */
export declare function schemaVocabulary(cwd: string): SchemaInfo[];
export interface BlockStructure {
    name: string;
    exists: boolean;
    hasSchema: boolean;
    arrays: {
        key: string;
        itemCount: number;
    }[];
}
/**
 * What blocks exist and their structure — combines availableBlocks
 * and block summaries into a single queryable function.
 */
export declare function blockStructure(cwd: string): BlockStructure[];
export interface ArraySummary {
    total: number;
    byStatus?: Record<string, number>;
}
export interface BlockSummary {
    arrays: Record<string, ArraySummary>;
}
export interface ProjectState {
    testCount: number;
    sourceFiles: number;
    sourceLines: number;
    lastCommit: string;
    lastCommitMessage: string;
    recentCommits: string[];
    blockSummaries: Record<string, BlockSummary>;
    phases: {
        total: number;
        current: number;
    };
    blocks: number;
    schemas: number;
    requirements?: {
        total: number;
        byStatus: Record<string, number>;
        byPriority: Record<string, number>;
    };
    tasks?: {
        total: number;
        byStatus: Record<string, number>;
    };
    domain?: {
        total: number;
    };
    verifications?: {
        total: number;
        passed: number;
        failed: number;
    };
    hasHandoff?: boolean;
}
/**
 * Derive project state from authoritative sources at query time.
 * No cache, no stale data — computed fresh on every call.
 */
export declare function projectState(cwd: string): ProjectState;
export interface ProjectValidationIssue {
    severity: "error" | "warning";
    message: string;
    block: string;
    field: string;
}
export interface ProjectValidationResult {
    valid: boolean;
    issues: ProjectValidationIssue[];
}
/**
 * Validate cross-block referential integrity: do IDs referenced across blocks
 * actually exist? Returns structured issues rather than throwing.
 */
export declare function validateProject(cwd: string): ProjectValidationResult;
//# sourceMappingURL=project-sdk.d.ts.map