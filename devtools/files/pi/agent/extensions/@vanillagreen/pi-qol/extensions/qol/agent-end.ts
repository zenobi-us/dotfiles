import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

export function textFromContent(content: unknown): string {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content
		.map((part) => {
			if (typeof part === "string") return part;
			if (part && typeof part === "object" && (part as any).type === "text" && typeof (part as any).text === "string") return (part as any).text;
			return "";
		})
		.filter(Boolean)
		.join("\n");
}

export function lastAssistantTextFromAgentEnd(event: any, ctx: ExtensionContext): string {
	const eventMessages = Array.isArray(event?.messages) ? event.messages : [];
	for (let index = eventMessages.length - 1; index >= 0; index -= 1) {
		const message = eventMessages[index];
		if (message?.role === "assistant") return textFromContent(message.content);
	}
	const branch = ctx.sessionManager.getBranch?.() ?? [];
	for (let index = branch.length - 1; index >= 0; index -= 1) {
		const entry = branch[index] as any;
		if (entry?.type === "message" && entry.message?.role === "assistant") return textFromContent(entry.message.content);
	}
	return "";
}

export function needsDirection(text: string): boolean {
	return /\?\s*$|\b(let me know|tell me|which (one|option)|choose|confirm|approve|should i|would you like|do you want|need your input|awaiting|next step)\b/i.test(text);
}

export function criticalInfo(text: string): string | undefined {
	const match = text.match(/\b(critical|urgent|warning|blocked|cannot proceed|security|vulnerab|secret|credential|rate limit|context (overflow|full)|manual action required)\b/i);
	if (!match) return undefined;
	const line = text.split(/\r?\n/).find((candidate) => candidate.toLowerCase().includes(match[0].toLowerCase())) ?? text;
	return line.trim();
}

export function taskStats(state: any): { completed: number; remaining: number; total: number } | undefined {
	const tasks = Array.isArray(state?.tasks) ? state.tasks : undefined;
	if (!tasks) return undefined;
	const total = tasks.length;
	const completed = tasks.filter((task: any) => task?.status === "completed").length;
	const remaining = tasks.filter((task: any) => task?.status === "pending" || task?.status === "in_progress").length;
	return { completed, remaining, total };
}
