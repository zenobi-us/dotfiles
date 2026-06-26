import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { ThemeModule, TreeSelectorModule } from "./types.ts";

async function resolvePiDistDir(): Promise<string> {
    const codingAgentEntry = fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"));
    return dirname(codingAgentEntry);
}

export function warnInternalPatchUnavailable(feature: string, error?: unknown): void {
    let suffix = "";
    if (error instanceof Error && error.message.length > 0) {
        suffix = `: ${error.message}`;
    }
    console.warn(`[pi-tree] ${feature} unavailable; Pi internals may have changed${suffix}`);
}

export async function loadTreeInternals(): Promise<[TreeSelectorModule, ThemeModule] | undefined> {
    try {
        const distDir = await resolvePiDistDir();
        const treeSelectorPath = pathToFileURL(
            join(distDir, "modes/interactive/components/tree-selector.js"),
        ).href;
        const themePath = pathToFileURL(join(distDir, "modes/interactive/theme/theme.js")).href;

        return (await Promise.all([import(treeSelectorPath), import(themePath)])) as [
            TreeSelectorModule,
            ThemeModule,
        ];
    } catch (error: unknown) {
        warnInternalPatchUnavailable("tree selector patch", error);
        return undefined;
    }
}
