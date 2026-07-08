import { Theme, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { ansiGreen, stripAnsi } from "./ansi.js";
import { PENDING_QUEUE_THEME_PATCH_SYMBOL, STATUS_TEXT_ALIGNMENT_PATCH_SYMBOL } from "./constants.js";
import { settingBoolean } from "./settings.js";

interface PendingQueueThemePatch {
	originalFg: unknown;
	cwd?: string;
}

function isPendingQueuePreviewText(text: string): boolean {
	const plain = stripAnsi(text);
	return plain.startsWith("Steering: ") || plain.startsWith("Follow-up: ");
}

function isPendingQueueHintText(text: string): boolean {
	const plain = stripAnsi(text);
	return plain.startsWith("↳ ") && plain.includes("queued messages");
}

function pendingQueuePreviewLine(text: string): string {
	return ansiGreen(`┃ ${text}`);
}

function isQueuedMessageStatusText(text: string): boolean {
	const plain = stripAnsi(text);
	return /^Restored \d+ queued messages? to editor$/.test(plain) || plain === "No queued messages to restore";
}

export function installStatusTextAlignmentPatch(): void {
	const proto = Text.prototype as unknown as Record<PropertyKey, any>;
	if (proto[STATUS_TEXT_ALIGNMENT_PATCH_SYMBOL]) return;
	const originalRender = proto.render;
	if (typeof originalRender !== "function") return;
	proto[STATUS_TEXT_ALIGNMENT_PATCH_SYMBOL] = true;
	proto.render = function patchedQolStatusTextRender(this: any, width: number): string[] {
		const text = typeof this?.text === "string" ? this.text : "";
		if (!isQueuedMessageStatusText(text)) return originalRender.call(this, width);
		const originalPaddingX = this.paddingX;
		try {
			this.paddingX = 0;
			this.invalidate?.();
			return originalRender.call(this, width);
		} finally {
			this.paddingX = originalPaddingX;
			this.invalidate?.();
		}
	};
}

export function installPendingQueueThemePatch(ctx: ExtensionContext): void {
	if (!ctx.hasUI) return;
	const proto = Theme.prototype as unknown as Record<PropertyKey, unknown>;
	const existing = proto[PENDING_QUEUE_THEME_PATCH_SYMBOL] as PendingQueueThemePatch | undefined;
	if (existing) {
		existing.cwd = ctx.cwd;
		return;
	}
	const originalFg = proto.fg;
	if (typeof originalFg !== "function") return;
	const patch: PendingQueueThemePatch = { originalFg, cwd: ctx.cwd };
	proto[PENDING_QUEUE_THEME_PATCH_SYMBOL] = patch;
	proto.fg = function patchedQolFg(this: Theme, token: string, text: string): string {
		if (token === "dim" && typeof text === "string" && settingBoolean("pendingQueue.asciiGreen", true, patch.cwd)) {
			if (isPendingQueuePreviewText(text)) return pendingQueuePreviewLine(text);
			if (isPendingQueueHintText(text)) return (patch.originalFg as (this: Theme, token: string, text: string) => string).call(this, token, `  ${text}`);
		}
		return (patch.originalFg as (this: Theme, token: string, text: string) => string).call(this, token, text);
	};
}

export function restorePendingQueueThemePatch(_ctx: ExtensionContext): void {
	const proto = Theme.prototype as unknown as Record<PropertyKey, unknown>;
	const patch = proto[PENDING_QUEUE_THEME_PATCH_SYMBOL] as PendingQueueThemePatch | undefined;
	if (!patch) return;
	proto.fg = patch.originalFg;
	delete proto[PENDING_QUEUE_THEME_PATCH_SYMBOL];
}
