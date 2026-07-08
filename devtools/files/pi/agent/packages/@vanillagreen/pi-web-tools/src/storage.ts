import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

export interface StoredWebContent {
	id: string;
	title?: string;
	url?: string;
	content: string;
	metadata?: Record<string, unknown>;
	createdAt: string;
}

const CUSTOM_TYPE = "pi-web-tools.content";
const memory = new Map<string, StoredWebContent>();

export function makeContentId(prefix = "web"): string {
	return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function restoreStoredContent(ctx: ExtensionContext): void {
	for (const entry of ctx.sessionManager?.getEntries?.() ?? []) {
		if ((entry as any).type === "custom" && (entry as any).customType === CUSTOM_TYPE) {
			const data = (entry as any).data as StoredWebContent | undefined;
			if (data?.id && typeof data.content === "string") memory.set(data.id, data);
		}
	}
}

export function storeWebContent(pi: ExtensionAPI, item: Omit<StoredWebContent, "id" | "createdAt"> & { id?: string }): StoredWebContent {
	const stored: StoredWebContent = { ...item, id: item.id ?? makeContentId(), createdAt: new Date().toISOString() };
	memory.set(stored.id, stored);
	pi.appendEntry?.(CUSTOM_TYPE, stored);
	return stored;
}

export function getWebContent(id: string): StoredWebContent | undefined {
	return memory.get(id);
}

export function clearMemoryForTests(): void {
	memory.clear();
}
