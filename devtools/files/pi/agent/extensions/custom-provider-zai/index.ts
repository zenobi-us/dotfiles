import {
	type Api,
	type AssistantMessageEventStream,
	type Context,
	type Model,
	type SimpleStreamOptions,
	streamSimpleOpenAICompletions,
} from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { buildZaiProviderConfig, createZaiStreamSimple } from "./config.js";

type PiStreamSimple = (
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
) => AssistantMessageEventStream;

function streamSimpleViaOpenAICompletions(
	model: unknown,
	context: unknown,
	options?: Record<string, unknown>,
): unknown {
	return streamSimpleOpenAICompletions(
		model as Model<"openai-completions">,
		context as Context,
		options as SimpleStreamOptions,
	);
}

export default function zaiCustomExtension(pi: ExtensionAPI): void {
	const streamSimple = createZaiStreamSimple(
		streamSimpleViaOpenAICompletions,
	) as unknown as PiStreamSimple;

	pi.registerProvider("zai-custom", buildZaiProviderConfig({ streamSimple }));
}
