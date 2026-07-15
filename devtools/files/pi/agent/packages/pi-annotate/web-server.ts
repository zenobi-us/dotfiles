import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { randomBytes } from "node:crypto";
import { release } from "node:os";

import type { AnnotateLastMessageWindowMessage, LastAssistantMessageData } from "./types.js";
import { buildAnnotateLastMessageHtml } from "./ui.js";

export interface AnnotationWebServer {
	result: Promise<AnnotateLastMessageWindowMessage | null>;
	close(): void;
}

export function browserCommand(
	url: string,
	platform = process.platform,
	osRelease = release(),
	env = process.env,
): { file: string; args: string[] } {
	if (platform === "darwin") return { file: "open", args: [url] };
	if (platform === "win32" || env.WSL_INTEROP != null || /microsoft/i.test(osRelease)) {
		return { file: "cmd.exe", args: ["/c", "start", "", url] };
	}
	return { file: "xdg-open", args: [url] };
}

function openBrowser(url: string): Promise<void> {
	const command = browserCommand(url);
	const child = spawn(command.file, command.args, { detached: true, stdio: "ignore" });
	return new Promise((resolve, reject) => {
		child.once("spawn", () => {
			child.unref();
			resolve();
		});
		child.once("error", reject);
	});
}

function readJson(request: import("node:http").IncomingMessage): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		request.on("data", (chunk: Buffer) => chunks.push(chunk));
		request.on("end", () => {
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
			} catch (error) {
				reject(error);
			}
		});
		request.on("error", reject);
	});
}

export async function openAnnotationWebServer(data: LastAssistantMessageData): Promise<AnnotationWebServer> {
	const token = randomBytes(24).toString("hex");
	const pagePath = `/${token}`;
	let server!: Server;
	let settleResult!: (value: AnnotateLastMessageWindowMessage | null) => void;
	let settled = false;
	let timeout: ReturnType<typeof setTimeout>;
	const result = new Promise<AnnotateLastMessageWindowMessage | null>((resolve) => {
		settleResult = resolve;
	});

	const settle = (value: AnnotateLastMessageWindowMessage | null): void => {
		if (settled) return;
		settled = true;
		clearTimeout(timeout);
		settleResult(value);
		server.close();
	};

	server = createServer(async (request, response) => {
		const url = new URL(request.url ?? "/", "http://localhost");
		if (request.method === "GET" && url.pathname === pagePath) {
			response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
			response.end(buildAnnotateLastMessageHtml(data, { submitUrl: `${pagePath}/result` }));
			return;
		}
		if (request.method === "POST" && url.pathname === `${pagePath}/result`) {
			try {
				const payload = await readJson(request) as AnnotateLastMessageWindowMessage;
				if (payload?.type !== "submit" && payload?.type !== "cancel") throw new Error("Invalid payload");
				response.writeHead(204).end();
				settle(payload);
			} catch {
				response.writeHead(400).end("Invalid annotation payload");
			}
			return;
		}
		response.writeHead(404).end("Not found");
	});

	await new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => resolve());
	});
	const address = server.address();
	if (address == null || typeof address === "string") throw new Error("Failed to allocate annotation server port");
	timeout = setTimeout(() => settle(null), 30 * 60 * 1000);
	timeout.unref();
	try {
		await openBrowser(`http://127.0.0.1:${address.port}${pagePath}`);
	} catch (error) {
		settle(null);
		throw error;
	}

	return { result, close: () => settle(null) };
}