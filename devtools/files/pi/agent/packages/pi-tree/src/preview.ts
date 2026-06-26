import { truncateToWidth } from "@earendil-works/pi-tui";

import { MIN_PREVIEW_TOTAL_WIDTH, MIN_PREVIEW_WIDTH, MIN_TREE_WIDTH } from "./constants.ts";
import type { TreeNode } from "./types.ts";

function normalizePreviewText(value: string): string {
    return value
        .replace(/[\t ]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function extractTextContent(content: unknown, maxLength: number): string {
    if (typeof content === "string") {
        return content.slice(0, maxLength);
    }

    if (!Array.isArray(content)) {
        return "";
    }

    let result = "";
    for (const block of content) {
        if (
            typeof block === "object" &&
            block !== null &&
            "type" in block &&
            block.type === "text" &&
            "text" in block &&
            typeof block.text === "string"
        ) {
            result += block.text;
            if (result.length >= maxLength) {
                return result.slice(0, maxLength);
            }
        }
    }

    return result;
}

export function getPreviewText(node: TreeNode | undefined): string {
    const entry = node?.entry;
    if (entry === undefined) {
        return "";
    }

    if (entry.type === undefined) {
        return "";
    }

    switch (entry.type) {
        case "message": {
            const message = entry.message;
            const textContent = normalizePreviewText(extractTextContent(message?.content, 4000));
            if (textContent.length > 0) {
                return textContent;
            }
            if (message?.role === "bashExecution") {
                return normalizePreviewText(message.command ?? "");
            }
            if (message?.errorMessage !== undefined && message.errorMessage.length > 0) {
                return normalizePreviewText(message.errorMessage);
            }
            if (message?.stopReason === "aborted") {
                return "(aborted)";
            }
            if (message?.role === "toolResult") {
                return `[${message.toolName ?? "tool"}]`;
            }
            return "(no content)";
        }
        case "custom_message":
            return normalizePreviewText(extractTextContent(entry.content, 4000));
        case "branch_summary":
            return normalizePreviewText(entry.summary ?? "");
        case "compaction":
            return `compaction: ${Math.round((entry.tokensBefore ?? 0) / 1000)}k tokens`;
        case "model_change":
            return `model: ${entry.modelId ?? ""}`;
        case "thinking_level_change":
            return `thinking: ${entry.thinkingLevel ?? ""}`;
        case "custom":
            return `custom: ${entry.customType ?? ""}`;
        case "label":
            return `label: ${entry.label ?? "(cleared)"}`;
        case "session_info":
            return `title: ${entry.name ?? "empty"}`;
        default:
            return "";
    }
}

export function calculatePreviewLayout(
    width: number,
): { leftWidth: number; rightWidth: number } | null {
    if (width < MIN_PREVIEW_TOTAL_WIDTH) {
        return null;
    }

    const separatorWidth = 3;
    const preferredLeftWidth = Math.max(MIN_TREE_WIDTH, Math.floor(width * 0.42));
    const maxLeftWidth = width - separatorWidth - MIN_PREVIEW_WIDTH;
    if (maxLeftWidth < MIN_TREE_WIDTH) {
        return null;
    }

    const leftWidth = Math.min(preferredLeftWidth, maxLeftWidth);
    return { leftWidth, rightWidth: width - separatorWidth - leftWidth };
}

export function padToWidth(text: string, width: number): string {
    return truncateToWidth(text, width, "...", true);
}
