import { execFile } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface PdfPageImage {
	type: "image";
	mimeType: "image/png";
	data: string;
	pageNumber: number;
}

export interface RasterizeOptions {
	maxPages?: number;
	dpi?: number;
	pdftoppmCommand?: string;
	pdfinfoCommand?: string;
}

export interface RasterizeResult {
	pageCount: number;
	images: PdfPageImage[];
	truncated: boolean;
}

async function readPageCount(pdfPath: string, command = "pdfinfo"): Promise<number | undefined> {
	try {
		const { stdout } = await execFileAsync(command, [pdfPath], { maxBuffer: 1024 * 1024 });
		const match = String(stdout ?? "").match(/^Pages:\s*(\d+)/m);
		return match?.[1] ? Number(match[1]) : undefined;
	} catch {
		return undefined;
	}
}

export async function rasterizePdfPages(buffer: ArrayBuffer | Uint8Array, options: RasterizeOptions = {}): Promise<RasterizeResult> {
	const maxPages = Math.max(1, Math.min(20, options.maxPages ?? 5));
	const dpi = Math.max(72, Math.min(300, options.dpi ?? 150));
	const command = options.pdftoppmCommand ?? "pdftoppm";
	const dir = await mkdtemp(join(tmpdir(), "pi-web-tools-pdf-pages-"));
	const inputPath = join(dir, "input.pdf");
	try {
		await writeFile(inputPath, Buffer.from(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)));
		const pageCount = await readPageCount(inputPath, options.pdfinfoCommand) ?? maxPages;
		const lastPage = Math.min(pageCount, maxPages);
		await execFileAsync(command, [
			"-png",
			"-r", String(dpi),
			"-f", "1",
			"-l", String(lastPage),
			inputPath,
			join(dir, "page"),
		], { maxBuffer: 200 * 1024 * 1024 });
		const files = (await readdir(dir)).filter((name) => name.startsWith("page-") && name.endsWith(".png")).sort();
		const images: PdfPageImage[] = [];
		for (const file of files) {
			const match = file.match(/^page-(\d+)\.png$/);
			if (!match) continue;
			const data = await readFile(join(dir, file));
			images.push({ type: "image", mimeType: "image/png", data: data.toString("base64"), pageNumber: Number(match[1]) });
		}
		return { pageCount, images, truncated: pageCount > lastPage };
	} finally {
		await rm(dir, { recursive: true, force: true }).catch(() => undefined);
	}
}

export function looksLikeScannedPdf(text: string, byteLength: number): boolean {
	const trimmed = text.replace(/\s+/g, " ").trim();
	if (!trimmed) return true;
	if (byteLength > 5000 && trimmed.length < 200) return true;
	return false;
}
