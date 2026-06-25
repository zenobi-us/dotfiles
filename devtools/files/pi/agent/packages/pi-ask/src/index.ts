import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerAnswerCommands } from "./answer-commands.ts";
import { registerAskSettingsCommand } from "./ask-settings-command.ts";
import { registerAskTool } from "./ask-tool.ts";
import { resetAskConfigStore } from "./config/store.ts";
import { createRemoteAskRuntime } from "./remote-ask.ts";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIGURATION_DOC_PATH = resolve(
	PACKAGE_ROOT,
	"docs",
	"configuration.md"
);
const PI_ASK_CONFIG_PROMPT = `When the user asks to configure, customize, debug, or explain @eko24ive/pi-ask settings or keymaps, first read ${CONFIGURATION_DOC_PATH} and follow it as the source of truth before editing config files.`;

export default function askExtension(pi: ExtensionAPI) {
	resetAskConfigStore();
	pi.on("before_agent_start", async (event) => ({
		systemPrompt: `${event.systemPrompt}\n\n${PI_ASK_CONFIG_PROMPT}`,
	}));
	const remoteAsk = createRemoteAskRuntime(pi.events);
	pi.on("session_shutdown", () => {
		remoteAsk.disposeAll();
	});
	registerAskTool(pi, remoteAsk);
	registerAskSettingsCommand(pi);
	registerAnswerCommands(pi, remoteAsk);
}
