export function nativeOpenAiNotice(): string {
	return "web_search was registered as a function tool but should be rewritten to OpenAI native web_search immediately before the provider request. If you see this during execution, switch provider to exa/perplexity/gemini or enable nativeOpenAiWebSearch.";
}
