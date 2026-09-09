import { TREE_PREVIEW_ENABLED_KEY, TREE_TIMESTAMP_MODE_KEY } from "./constants.ts";
import {
    getPersistedMaxVisibleLines,
    getPersistedMode,
    getPersistedPreviewEnabled,
    isTreeTimestampMode,
} from "./settings.ts";
import type { TreeListInstance, TreeTimestampMode } from "./types.ts";

export function setTreeTimestampMode(treeList: TreeListInstance, mode: TreeTimestampMode): void {
    (treeList as TreeListInstance & { [TREE_TIMESTAMP_MODE_KEY]?: TreeTimestampMode })[
        TREE_TIMESTAMP_MODE_KEY
    ] = mode;
    treeList.showLabelTimestamps = false;
}

export function getTreeTimestampMode(treeList: TreeListInstance): TreeTimestampMode {
    const current = (treeList as TreeListInstance & { [TREE_TIMESTAMP_MODE_KEY]?: unknown })[
        TREE_TIMESTAMP_MODE_KEY
    ];

    if (isTreeTimestampMode(current)) {
        treeList.showLabelTimestamps = false;
        return current;
    }

    const initialMode = getPersistedMode();
    setTreeTimestampMode(treeList, initialMode);
    return initialMode;
}

export function setTreePreviewEnabled(treeList: TreeListInstance, enabled: boolean): void {
    (treeList as TreeListInstance & { [TREE_PREVIEW_ENABLED_KEY]?: boolean })[
        TREE_PREVIEW_ENABLED_KEY
    ] = enabled;
}

export function applyConfiguredMaxVisibleLines(treeList: TreeListInstance): void {
    const configured = getPersistedMaxVisibleLines();
    if (configured === null) {
        return;
    }
    treeList.maxVisibleLines = configured;
}

export function getTreePreviewEnabled(treeList: TreeListInstance): boolean {
    const current = (treeList as TreeListInstance & { [TREE_PREVIEW_ENABLED_KEY]?: unknown })[
        TREE_PREVIEW_ENABLED_KEY
    ];

    if (typeof current === "boolean") {
        return current;
    }

    const initialEnabled = getPersistedPreviewEnabled();
    setTreePreviewEnabled(treeList, initialEnabled);
    return initialEnabled;
}
