import { saveBase64Image } from "../utils/images.js";
import type { CodexMinimalToolsSettings } from "../settings.js";

export interface ImageGenerationInput {
	prompt?: string;
	size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
	quality?: "low" | "medium" | "high" | "auto";
	background?: "transparent" | "opaque" | "auto";
	output_format?: "png" | "webp" | "jpeg";
}

export const imageGenerationToolSchema = {
	type: "object",
	additionalProperties: false,
	properties: {
		prompt: { type: "string", description: "Optional image prompt. Native OpenAI tools may infer from conversation if omitted." },
		size: { type: "string", enum: ["1024x1024", "1024x1536", "1536x1024", "auto"], description: "Requested image size." },
		quality: { type: "string", enum: ["low", "medium", "high", "auto"], description: "Requested image quality." },
		background: { type: "string", enum: ["transparent", "opaque", "auto"], description: "Requested background." },
		output_format: { type: "string", enum: ["png", "webp", "jpeg"], description: "Requested output format." },
	},
};

async function urlToBase64(url: string, signal?: AbortSignal): Promise<string> {
	const response = await fetch(url, { signal });
	if (!response.ok) throw new Error(`Failed to download generated image: ${response.status} ${await response.text()}`);
	const buffer = Buffer.from(await response.arrayBuffer());
	return buffer.toString("base64");
}

export async function directImageGeneration(input: ImageGenerationInput, cwd: string, settings: CodexMinimalToolsSettings, signal?: AbortSignal) {
	if (!settings.directImageApiFallback) throw new Error("Direct Images API fallback is disabled. Use native openai-codex handling or enable directImageApiFallback.");
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) throw new Error("OPENAI_API_KEY is required for direct image_generation fallback.");
	if (!input.prompt?.trim()) throw new Error("A prompt is required for direct image_generation fallback.");
	const body: Record<string, unknown> = {
		model: settings.imageModel,
		prompt: input.prompt,
	};
	if (input.size && input.size !== "auto") body.size = input.size;
	if (input.quality && input.quality !== "auto") body.quality = input.quality;
	if (input.background && input.background !== "auto") body.background = input.background;
	if (input.output_format) body.output_format = input.output_format;
	const response = await fetch("https://api.openai.com/v1/images/generations", {
		method: "POST",
		headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
		body: JSON.stringify(body),
		signal,
	});
	if (!response.ok) throw new Error(`OpenAI Images API failed: ${response.status} ${await response.text()}`);
	const json = await response.json() as { data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }> };
	const first = json.data?.[0];
	const base64 = first?.b64_json ?? (first?.url ? await urlToBase64(first.url, signal) : undefined);
	if (!base64) throw new Error("OpenAI Images API returned no image data.");
	const saved = await saveBase64Image({ base64, callId: "direct", cwd, format: input.output_format, responseId: settings.imageModel, settings });
	return {
		content: [{ type: "text", text: `Generated image with ${settings.imageModel}; saved to ${saved.path}${saved.latestPath ? ` (latest: ${saved.latestPath})` : ""}.` }],
		details: { saved, revisedPrompt: first?.revised_prompt, mode: "direct-images-api" },
	};
}

export function createImageGenerationToolDefinition(options: { loadSettings?: (cwd: string) => CodexMinimalToolsSettings } = {}) {
	return {
		name: "image_generation",
		label: "Image Generation",
		description: "Generate images with OpenAI native image_generation on supported openai-codex models. Native results are saved under the configured imageOutputDir and mirrored to latest.<ext>. If native handling is unavailable, direct fallback can be enabled with directImageApiFallback and OPENAI_API_KEY.",
		promptSnippet: "Generate images with OpenAI native image_generation when available; native results are saved under imageOutputDir and mirrored as latest.<ext>.",
		parameters: imageGenerationToolSchema,
		async execute(_toolCallId: string, params: ImageGenerationInput, signal: AbortSignal | undefined, _onUpdate: unknown, ctx: { cwd: string }) {
			const cwd = ctx?.cwd ?? process.cwd();
			const settings = options.loadSettings?.(cwd);
			if (settings?.directImageApiFallback) return directImageGeneration(params, cwd, settings, signal);
			return {
				content: [{ type: "text", text: "image_generation is native-provider-first. If this function tool executes directly, enable directImageApiFallback with OPENAI_API_KEY or use an openai-codex model with native provider handling." }],
				details: { phase: "native-provider", nativeTool: "image_generation" },
			};
		},
	};
}
