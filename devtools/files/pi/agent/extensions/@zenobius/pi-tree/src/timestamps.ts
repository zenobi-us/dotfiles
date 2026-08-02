import { DEFAULT_MODE, MODE_SEQUENCE } from "./constants.ts";
import type { TreeTimestampMode } from "./types.ts";

export function cycleMode(mode: TreeTimestampMode): TreeTimestampMode {
    const index = MODE_SEQUENCE.indexOf(mode);
    return MODE_SEQUENCE[(index + 1) % MODE_SEQUENCE.length] ?? DEFAULT_MODE;
}

function formatAbsoluteTimestamp(timestamp: string | undefined): string {
    if (timestamp === undefined || timestamp.length === 0) return "";

    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) return "";

    const now = new Date();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const time = `${hours}:${minutes}`;

    if (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    ) {
        return time;
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (date.getFullYear() === now.getFullYear()) {
        return `${month}/${day} ${time}`;
    }

    const year = date.getFullYear().toString().slice(-2);
    return `${year}/${month}/${day} ${time}`;
}

function formatRelativeTimestamp(timestamp: string | undefined): string {
    if (timestamp === undefined || timestamp.length === 0) return "";

    const date = new Date(timestamp);
    const then = date.getTime();
    if (!Number.isFinite(then)) return "";

    const diffMs = Math.max(0, Date.now() - then);
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) {
        return `${Math.max(1, diffSeconds)}s ago`;
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }

    if (diffDays < 30) {
        return `${Math.floor(diffDays / 7)}w ago`;
    }

    if (diffDays < 365) {
        return `${Math.max(1, Math.floor(diffDays / 30.4375))}mo ago`;
    }

    return `${Math.max(1, Math.floor(diffDays / 365.25))}y ago`;
}

export function formatEntryTimestamp(
    timestamp: string | undefined,
    mode: Exclude<TreeTimestampMode, "off">,
): string {
    if (mode === "absolute") {
        return formatAbsoluteTimestamp(timestamp);
    }
    return formatRelativeTimestamp(timestamp);
}
