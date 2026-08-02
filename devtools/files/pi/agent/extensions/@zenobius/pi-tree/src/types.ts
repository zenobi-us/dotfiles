export type TreeSelectorModule = {
    TreeSelectorComponent: new (
        entries: unknown[],
        selectedId: string | null,
        height: number,
        onSelect: () => undefined,
        onCancel: () => undefined,
        onLabel: () => undefined,
        onDelete: undefined,
        onFork: undefined,
    ) => { getTreeList?: () => unknown };
};

export type ThemeModule = {
    initTheme: (name: string | undefined, force: boolean) => void;
    theme: {
        fg: (role: string, text: string) => string;
        bg: (role: string, text: string) => string;
        bold: (text: string) => string;
    };
};

export type TreeTimestampMode = "off" | "relative" | "absolute";

export type TreeEntry = {
    id: string;
    parentId?: string | null;
    timestamp?: string;
    type?: string;
    message?: {
        role?: string;
        content?: unknown;
        command?: string;
        toolName?: string;
        stopReason?: string;
        errorMessage?: string;
    };
    content?: unknown;
    customType?: string;
    summary?: string;
    tokensBefore?: number;
    modelId?: string;
    thinkingLevel?: string;
    label?: string;
    name?: string;
};

export type TreeNode = {
    entry: TreeEntry;
    label?: string;
    labelTimestamp?: string;
};

export type FlatTreeNode = {
    node: TreeNode;
    indent: number;
    showConnector: boolean;
    isLast: boolean;
    gutters: Array<{ position: number; show: boolean }>;
    isVirtualRootChild: boolean;
};

export type TreeListInstance = {
    activePathIds?: Set<string>;
    filteredNodes?: FlatTreeNode[];
    foldedNodes?: Set<string>;
    maxVisibleLines?: number;
    multipleRoots?: boolean;
    selectedIndex?: number;
    showLabelTimestamps?: boolean;
    formatLabelTimestamp?: (timestamp: string) => string;
    getStatusLabels?: () => string;
    handleInput?: (keyData: string) => void;
    isFoldable?: (entryId: string) => boolean;
    getEntryDisplayText?: (node: TreeNode, isSelected: boolean) => string;
};
