import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

import { composeAnnotateLastMessagePrompt, hasAnnotateLastMessageFeedback } from "./prompt.js";
import { findLastAssistantMessage } from "./session.js";
import { openAnnotationWebServer, type AnnotationWebServer } from "./web-server.js";

export function registerAnnotateLastMessageCommand(pi: ExtensionAPI): void {
	let activeServer: AnnotationWebServer | null = null;
	const suppressedServers = new WeakSet<AnnotationWebServer>();

	function closeActiveServer(options: { suppressResults?: boolean } = {}): void {
		if (activeServer == null) return;
		const serverToClose = activeServer;
		activeServer = null;
		if (options.suppressResults) {
			suppressedServers.add(serverToClose);
		}
		serverToClose.close();
	}

	async function openAnnotationWindow(ctx: ExtensionCommandContext): Promise<void> {
		if (ctx.mode !== "tui") {
			ctx.ui.notify("annotate-last-message requires interactive mode.", "error");
			return;
		}
		if (activeServer != null) {
			ctx.ui.notify("A last-message annotation page is already open.", "warning");
			return;
		}

		const messageResult = findLastAssistantMessage(ctx.sessionManager.getBranch());
		if (!messageResult.ok) {
			ctx.ui.notify(messageResult.message, "error");
			return;
		}

		const messageData = messageResult.data;

		try {
			const server = await openAnnotationWebServer(messageData);
			activeServer = server;

			void (async (messageSource: AnnotationWebServer) => {
				try {
					const result = await messageSource.result;
					if (activeServer === messageSource) activeServer = null;
					if (suppressedServers.has(messageSource)) return;
					if (result == null) return;
					if (result.type === "cancel") {
						ctx.ui.notify("Annotation cancelled.", "info");
						return;
					}
					if (!hasAnnotateLastMessageFeedback(result)) {
						ctx.ui.notify("No annotation feedback submitted.", "info");
						return;
					}

					const prompt = composeAnnotateLastMessagePrompt(result);
					pi.sendUserMessage(prompt, { deliverAs: "followUp" });
					ctx.ui.notify("Sent annotation feedback as a user message.", "info");
				} catch (error) {
					if (suppressedServers.has(messageSource)) return;
					const message = error instanceof Error ? error.message : String(error);
					ctx.ui.notify(`Annotation failed: ${message}`, "error");
				}
			})(server);

			ctx.ui.notify("Opened annotation page in your browser.", "info");
		} catch (error) {
			closeActiveServer({ suppressResults: true });
			const message = error instanceof Error ? error.message : String(error);
			ctx.ui.notify(`Annotation failed: ${message}`, "error");
		}
	}

	pi.registerCommand("annotate-last-message", {
		description: "Open a browser annotation page for the latest assistant message",
		handler: async (_args, ctx) => {
			await openAnnotationWindow(ctx);
		},
	});

	pi.on("session_shutdown", async () => {
		closeActiveServer({ suppressResults: true });
	});
}

export default function (pi: ExtensionAPI): void {
	registerAnnotateLastMessageCommand(pi);
}
