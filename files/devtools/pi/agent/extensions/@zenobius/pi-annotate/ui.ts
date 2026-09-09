import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { LastAssistantMessageData } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = join(__dirname, "web");

function escapeForInlineScript(value: string): string {
	return value.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function escapeInlineScriptSource(value: string): string {
	return value.replace(/<\/(script)/gi, "<\\/$1");
}

export function buildAnnotateLastMessageHtml(data: LastAssistantMessageData, config: { submitUrl: string }): string {
	const templateHtml = readFileSync(join(webDir, "index.html"), "utf8");
	const appJs = escapeInlineScriptSource(readFileSync(join(webDir, "app.js"), "utf8"));
	const payload = escapeForInlineScript(JSON.stringify(data));
	const runtimeConfig = escapeForInlineScript(JSON.stringify(config));
	return templateHtml
		.replace('"__INLINE_DATA__"', payload)
		.replace('"__RUNTIME_CONFIG__"', runtimeConfig)
		.replace("__INLINE_JS__", appJs);
}
