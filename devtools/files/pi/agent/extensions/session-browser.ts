import { mkdir, readFile, readdir, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type SessionInfo = {
	path: string;
	name: string;
	group: string;
	mtimeMs: number;
};

type ViteDevServer = {
	middlewares: (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => void;
	close: () => Promise<void>;
};

const HOST = "127.0.0.1";
const DEFAULT_PORT = 38741;
const SESSIONS_DIR = resolve(homedir(), ".pi", "agent", "sessions");
const EXPORT_DIR = join(tmpdir(), "pi-session-browser", "public");
const SELECTED_HTML = join(EXPORT_DIR, "selected.html");
const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "session-browser-web");

let server: ReturnType<typeof createServer> | undefined;
let vite: ViteDevServer | undefined;
let port = DEFAULT_PORT;
let exportQueue = Promise.resolve();

async function listJsonlSessions(dir = SESSIONS_DIR): Promise<SessionInfo[]> {
	const out: SessionInfo[] = [];

	async function walk(current: string): Promise<void> {
		let entries;
		try {
			entries = await readdir(current, { withFileTypes: true });
		} catch (error: any) {
			if (error?.code === "ENOENT") return;
			throw error;
		}

		for (const entry of entries) {
			const path = join(current, entry.name);
			if (entry.isDirectory()) {
				await walk(path);
				continue;
			}
			if (!entry.isFile() || extname(entry.name) !== ".jsonl") continue;
			const stats = await stat(path);
			const group = dirname(relative(SESSIONS_DIR, path));
			out.push({
				path,
				name: basename(path, ".jsonl"),
				group: group === "." ? "root" : group.split(sep).join(" / "),
				mtimeMs: stats.mtimeMs,
			});
		}
	}

	await walk(dir);
	return out.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function isSessionPath(path: string): boolean {
	const resolved = resolve(path);
	return resolved.startsWith(SESSIONS_DIR + sep) && extname(resolved) === ".jsonl";
}

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolvePromise, reject) => {
		const chunks: Buffer[] = [];
		req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
		req.on("error", reject);
		req.on("end", () => resolvePromise(Buffer.concat(chunks).toString("utf8")));
	});
}

function json(res: ServerResponse, status: number, data: unknown): void {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(data));
}

function html(res: ServerResponse, status: number, content: string): void {
	res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
	res.end(content);
}

async function handleApi(pi: ExtensionAPI, req: IncomingMessage, res: ServerResponse): Promise<boolean> {
	const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `${HOST}:${port}`}`);

	if (req.method === "GET" && url.pathname === "/api/sessions") {
		json(res, 200, await listJsonlSessions());
		return true;
	}

	if (req.method === "POST" && url.pathname === "/api/export") {
		let path: unknown;
		try {
			path = JSON.parse(await readBody(req)).path;
		} catch {
			json(res, 400, { error: "Invalid JSON" });
			return true;
		}

		if (typeof path !== "string" || !isSessionPath(path)) {
			json(res, 400, { error: "Invalid session path" });
			return true;
		}

		await mkdir(EXPORT_DIR, { recursive: true });
		// ponytail: single export target, queue exports; per-session files if concurrent users matter.
		const job = exportQueue.then(async () => {
			const result = await pi.exec("pi", ["--export", path, SELECTED_HTML], { timeout: 120_000 });
			if (result.code !== 0) throw new Error(result.stderr || result.stdout || `pi export failed: ${result.code}`);
		});
		exportQueue = job.catch(() => undefined);

		try {
			await job;
		} catch (error) {
			json(res, 500, { error: error instanceof Error ? error.message : String(error) });
			return true;
		}

		json(res, 200, { url: `/exports/selected.html?t=${Date.now()}` });
		return true;
	}

	if (req.method === "GET" && url.pathname === "/exports/selected.html") {
		try {
			await stat(SELECTED_HTML);
		} catch {
			html(res, 404, "No session exported yet.");
			return true;
		}
		html(res, 200, await readFile(SELECTED_HTML, "utf8"));
		return true;
	}

	return false;
}

async function createVite(httpServer: ReturnType<typeof createServer>): Promise<ViteDevServer> {
	const { createServer: createViteServer } = await import("vite");
	let plugins: any[] = [];
	try {
		const { default: react } = await import("@vitejs/plugin-react");
		plugins = [react()];
	} catch {
		// ponytail: Vite still serves React; install @vitejs/plugin-react for Fast Refresh instead of full reloads.
	}
	return await createViteServer({
		root: WEB_ROOT,
		appType: "spa",
		plugins,
		server: {
			middlewareMode: true,
			hmr: { server: httpServer },
		},
		clearScreen: false,
		logLevel: "warn",
	}) as ViteDevServer;
}

async function startServer(pi: ExtensionAPI): Promise<string> {
	if (server?.listening) return `http://${HOST}:${port}`;

	for (const candidate of [DEFAULT_PORT, 0]) {
		try {
			const httpServer = createServer();
			vite = await createVite(httpServer);
			httpServer.on("request", async (req, res) => {
				try {
					if (await handleApi(pi, req, res)) return;
					vite!.middlewares(req, res, (error?: unknown) => {
						if (error) {
							res.statusCode = 500;
							res.end(error instanceof Error ? error.stack : String(error));
						}
					});
				} catch (error) {
					res.statusCode = 500;
					res.end(error instanceof Error ? error.stack : String(error));
				}
			});

			await new Promise<void>((resolvePromise, reject) => {
				httpServer.once("error", reject);
				httpServer.listen(candidate, HOST, resolvePromise);
			});
			server = httpServer;
			const address = server.address();
			port = typeof address === "object" && address ? address.port : candidate;
			return `http://${HOST}:${port}`;
		} catch (error: any) {
			await stopServer();
			if (candidate !== DEFAULT_PORT || error?.code !== "EADDRINUSE") throw error;
		}
	}
	throw new Error("unreachable");
}

async function stopServer(): Promise<void> {
	await vite?.close();
	vite = undefined;
	await new Promise<void>((resolvePromise) => server?.close(() => resolvePromise()) ?? resolvePromise());
	server = undefined;
}

async function openUrl(pi: ExtensionAPI, url: string): Promise<string | undefined> {
	const commands = process.platform === "darwin"
		? [["open", [url]]]
		: [["xdg-open", [url]], ["gio", ["open", url]], ["gvfs-open", [url]]];
	for (const [command, args] of commands) {
		const result = await pi.exec(command, args, { timeout: 10_000 });
		if (result.code === 0) return undefined;
		if (!/not found|ENOENT|No such file/i.test(`${result.stderr}\n${result.stdout}`)) return `${command} failed: ${result.stderr || result.stdout}`;
	}
	return `No URL opener found. Open manually: ${url}`;
}

export default function sessionBrowser(pi: ExtensionAPI): void {
	pi.registerCommand("session-browser", {
		description: "Browse ~/.pi/agent/sessions JSONL files as Pi HTML exports.",
		handler: async (_args, ctx) => {
			const url = await startServer(pi);
			ctx.ui.notify(`Session browser: ${url}`, "info");
			const error = await openUrl(pi, url);
			if (error) ctx.ui.notify(error, "error");
		},
	});

	pi.registerCommand("session-browser-stop", {
		description: "Stop the session browser server.",
		handler: async (_args, ctx) => {
			await stopServer();
			ctx.ui.notify("Session browser stopped", "info");
		},
	});

	pi.on("session_shutdown", async () => {
		await stopServer();
	});
}
