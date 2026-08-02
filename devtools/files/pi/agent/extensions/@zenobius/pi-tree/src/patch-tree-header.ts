import { keyText } from "@earendil-works/pi-coding-agent";
import { Text, TruncatedText } from "@earendil-works/pi-tui";

import { PREVIEW_TOGGLE_HINT, TREE_HELP_PATCH_KEY, TREE_TITLE_PATCH_KEY } from "./constants.ts";
import { warnInternalPatchUnavailable } from "./internal-imports.ts";

function formatTreeHelpKey(key: string): string {
    return key
        .replaceAll("ctrl+left/alt+left", "ctrl/alt+←")
        .replaceAll("ctrl+right/alt+right", "ctrl/alt+→")
        .replaceAll("left", "←")
        .replaceAll("right", "→")
        .replaceAll("up", "↑")
        .replaceAll("down", "↓");
}

function treeHelpKey(keybinding: Parameters<typeof keyText>[0]): string {
    return formatTreeHelpKey(keyText(keybinding));
}

function getTreeHelpText(): string {
    return [
        "↑/↓: move",
        "←/→: page",
        `${treeHelpKey("app.tree.foldOrUp")}: fold/up`,
        `${treeHelpKey("app.tree.unfoldOrDown")}: unfold/down`,
        `${treeHelpKey("app.tree.editLabel")}: label`,
        `${treeHelpKey("app.tree.filter.cycleForward")}: filter`,
        `${treeHelpKey("app.tree.toggleLabelTimestamp")}: time`,
        `${PREVIEW_TOGGLE_HINT}: preview`,
    ].join("  •  ");
}

export function patchTreeHeaderText(): void {
    const globalState = globalThis as typeof globalThis & {
        [TREE_HELP_PATCH_KEY]?: boolean;
        [TREE_TITLE_PATCH_KEY]?: boolean;
    };

    if (globalState[TREE_TITLE_PATCH_KEY] !== true) {
        const textPrototype = Text.prototype as unknown as {
            render?: (width: number) => string[];
            text?: string;
        };
        const originalTextRender = textPrototype.render;
        if (typeof originalTextRender === "function") {
            textPrototype.render = function patchedTextRender(
                this: { text?: string },
                width: number,
            ) {
                if (this.text?.includes("  Session Tree") === true) {
                    return [];
                }
                return originalTextRender.call(this, width);
            };
            globalState[TREE_TITLE_PATCH_KEY] = true;
        } else {
            warnInternalPatchUnavailable("tree title patch");
        }
    }

    if (globalState[TREE_HELP_PATCH_KEY] === true) return;

    const truncatedTextPrototype = TruncatedText.prototype as unknown as {
        render?: (width: number) => string[];
        text?: string;
    };
    const originalRender = truncatedTextPrototype.render;
    if (typeof originalRender !== "function") {
        warnInternalPatchUnavailable("tree help patch");
        return;
    }

    truncatedTextPrototype.render = function patchedRender(this: { text?: string }, width: number) {
        if (this.text?.includes("↑/↓: move.") === true) {
            this.text = `  ${getTreeHelpText()}`;
        }
        return originalRender.call(this, width);
    };

    globalState[TREE_HELP_PATCH_KEY] = true;
}
