import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, extname, isAbsolute, join, resolve } from "node:path";
import type { CodexMinimalToolsSettings } from "../settings.js";

export interface SavedImageInfo {
	path: string;
	latestPath?: string;
	mimeType: string;
	format: string;
	bytes: number;
}

export function projectRoot(cwd: string): string {
	let current = resolve(cwd);
	while (true) {
		if (existsSync(join(current, ".git")) || existsSync(join(current, ".pi")) || existsSync(join(current, ".vstack-lock.json"))) return current;
		const parent = dirname(current);
		if (parent === current) return resolve(cwd);
		current = parent;
	}
}

export function imageOutputDir(cwd: string, settings: Pick<CodexMinimalToolsSettings, "imageOutputDir">): string {
	const configured = settings.imageOutputDir || ".pi/openai-codex-images";
	return isAbsolute(configured) ? resolve(configured) : resolve(projectRoot(cwd), configured);
}

export function imageFormatToMime(format: string | undefined): string {
	const normalized = (format || "png").toLowerCase().replace(/^\./, "");
	if (normalized === "jpg" || normalized === "jpeg") return "image/jpeg";
	if (normalized === "webp") return "image/webp";
	return "image/png";
}

export function extensionForMime(mimeType: string): string {
	if (mimeType === "image/jpeg") return "jpeg";
	if (mimeType === "image/webp") return "webp";
	return "png";
}

export function inferImageFormat(value: unknown, fallback = "png"): string {
	if (typeof value !== "string") return fallback;
	const lower = value.toLowerCase();
	if (lower.includes("jpeg") || lower.includes("jpg")) return "jpeg";
	if (lower.includes("webp")) return "webp";
	if (lower.includes("png")) return "png";
	const ext = extname(lower).replace(/^\./, "");
	return ext || fallback;
}

export async function saveBase64Image(options: {
	base64: string;
	callId?: string;
	cwd: string;
	format?: string;
	responseId?: string;
	settings: Pick<CodexMinimalToolsSettings, "imageOutputDir">;
}): Promise<SavedImageInfo> {
	const format = inferImageFormat(options.format, "png");
	const mimeType = imageFormatToMime(format);
	const ext = extensionForMime(mimeType);
	const dir = imageOutputDir(options.cwd, options.settings);
	await mkdir(dir, { recursive: true });
	const unique = randomUUID().slice(0, 8);
	const filePath = join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${unique}.${ext}`);
	const data = Buffer.from(options.base64, "base64");
	await writeFile(filePath, data, { mode: 0o600 });
	const latestPath = join(dir, `latest.${ext}`);
	await copyFile(filePath, latestPath);
	return { bytes: data.byteLength, format: ext, latestPath, mimeType, path: filePath };
}
