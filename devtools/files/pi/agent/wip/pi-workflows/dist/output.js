/**
 * Step output persistence.
 *
 * Every step that produces output writes it as JSON to disk.
 * The workflow author controls the output path via the step spec's
 * output.path field. When no path is declared, defaults to
 * outputs/<stepName>.json in the run directory.
 *
 * JSON is the intermediate representation between steps — structured,
 * validated, consumable by templates, filterable by transforms, mergeable
 * across parallel runs. Text is rendered FROM JSON via templates. It's
 * never the data format.
 */
import fs from "node:fs";
import path from "node:path";
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
export function persistStepOutput(runDir, stepName, output, textOutput, outputPath) {
    // Author-declared path takes priority; default to run dir
    const filePath = outputPath ?? path.join(runDir, "outputs", `${stepName}.json`);
    const dir = path.dirname(filePath);
    // Structured output — the primary case
    if (output !== undefined && output !== null && typeof output === "object") {
        try {
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
            return filePath;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            process.stderr.write(`[pi-workflows] Warning: failed to persist output for step '${stepName}' to ${filePath}: ${msg}\n`);
            return undefined;
        }
    }
    // String output — wrap in JSON to maintain uniform contract
    const text = typeof output === "string" ? output : textOutput;
    if (text) {
        try {
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify({ text }, null, 2), "utf-8");
            return filePath;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            process.stderr.write(`[pi-workflows] Warning: failed to persist output for step '${stepName}' to ${filePath}: ${msg}\n`);
            return undefined;
        }
    }
    return undefined;
}
//# sourceMappingURL=output.js.map