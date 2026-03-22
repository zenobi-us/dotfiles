/**
 * Persist a step's output as JSON to disk.
 *
 * @param runDir - workflow run directory (default location for outputs)
 * @param stepName - step name (used for default filename)
 * @param output - structured output (object/array) or string
 * @param textOutput - fallback text output if output is undefined
 * @param outputPath - author-declared output path (from step spec output.path, already resolved)
 * @returns absolute path to the written JSON file, or undefined if nothing to write
 */
export declare function persistStepOutput(runDir: string, stepName: string, output: unknown, textOutput?: string, outputPath?: string): string | undefined;
//# sourceMappingURL=output.d.ts.map