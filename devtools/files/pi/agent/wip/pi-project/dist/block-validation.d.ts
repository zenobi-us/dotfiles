export interface BlockFileSnapshot {
    mtime: number;
    content: string;
}
export type BlockSnapshot = Map<string, BlockFileSnapshot>;
/**
 * Snapshot mtimes and contents of all .project/*.json files.
 * Returns a Map of absolute filepath → { mtime, content }.
 * If .project/ doesn't exist, returns an empty map.
 */
export declare function snapshotBlockFiles(cwd: string): BlockSnapshot;
/**
 * Compare current .project/*.json mtimes against a prior snapshot.
 * Validate any changed or newly created files against their schemas.
 *
 * Schema path convention: .project/foo.json → .project/schemas/foo.schema.json
 * Files with no corresponding schema are silently skipped.
 *
 * @throws Error if any changed block file fails schema validation
 */
export declare function validateChangedBlocks(cwd: string, before: BlockSnapshot): void;
/**
 * Rollback .project/*.json files to their pre-step state.
 * - Files that existed in the snapshot and changed: restore content via atomic write (tmp + rename)
 * - New files (not in snapshot): delete them
 * Returns list of rolled-back file paths.
 */
export declare function rollbackBlockFiles(cwd: string, before: BlockSnapshot): string[];
//# sourceMappingURL=block-validation.d.ts.map