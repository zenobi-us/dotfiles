import { cloneOrUpdateRepo, defaultCacheDir, isGitInstalled, readBlobFromCache, readReadmeFromCache, readTreeFromCache, summarizeTreeEntries } from "./github-clone.js";

export type GitHubUrlKind = "repo" | "blob" | "tree" | "commit";

export interface ParsedGitHubUrl {
	kind: GitHubUrlKind;
	owner: string;
	repo: string;
	ref?: string;
	path?: string;
	apiUrl: string;
	rawUrl?: string;
}

export interface GitHubExtractOptions {
	fetchImpl?: typeof fetch;
	signal?: AbortSignal;
	maxTreeEntries?: number;
	cloneEnabled?: boolean;
	maxRepoSizeMB?: number;
	cloneTimeoutSeconds?: number;
	cacheDir?: string;
	maxAgeHours?: number;
}

function splitRefAndPath(parts: string[]): { ref?: string; path?: string } {
	if (parts.length === 0) return {};
	return { ref: parts[0], path: parts.slice(1).join("/") || undefined };
}

export function parseGitHubUrl(input: string): ParsedGitHubUrl | undefined {
	const url = new URL(input);
	if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return undefined;
	const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
	if (parts.length < 2) return undefined;
	const [owner, repo, marker, ...rest] = parts;
	const base = `https://api.github.com/repos/${owner}/${repo}`;
	if (!marker) return { kind: "repo", owner, repo, apiUrl: base };
	if (marker === "blob") {
		const { ref, path } = splitRefAndPath(rest);
		return { kind: "blob", owner, repo, ref, path, apiUrl: `${base}/contents/${path ?? ""}?ref=${encodeURIComponent(ref ?? "HEAD")}`, rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}` };
	}
	if (marker === "tree") {
		const { ref, path } = splitRefAndPath(rest);
		return { kind: "tree", owner, repo, ref, path, apiUrl: `${base}/contents/${path ?? ""}?ref=${encodeURIComponent(ref ?? "HEAD")}` };
	}
	if (marker === "commit") return { kind: "commit", owner, repo, ref: rest[0], apiUrl: `${base}/commits/${rest[0] ?? ""}` };
	return { kind: "repo", owner, repo, apiUrl: base };
}

async function jsonFetch(fetchImpl: typeof fetch, url: string, signal?: AbortSignal): Promise<any> {
	const response = await fetchImpl(url, { headers: { accept: "application/vnd.github+json" }, signal });
	if (!response.ok) throw new Error(`GitHub fetch failed (${response.status}) for ${url}`);
	return response.json();
}

async function shouldUseClone(parsed: ParsedGitHubUrl, options: GitHubExtractOptions, fetchImpl: typeof fetch): Promise<{ useClone: boolean; sizeKB?: number; defaultBranch?: string }> {
	if (options.cloneEnabled === false) return { useClone: false };
	if (parsed.kind === "commit") return { useClone: false };
	if (!isGitInstalled()) return { useClone: false };
	try {
		const meta = await jsonFetch(fetchImpl, `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, options.signal);
		const maxKB = (options.maxRepoSizeMB ?? 350) * 1024;
		const size = typeof meta?.size === "number" ? meta.size : 0;
		if (size > maxKB) return { useClone: false, sizeKB: size, defaultBranch: meta?.default_branch };
		return { useClone: true, sizeKB: size, defaultBranch: meta?.default_branch };
	} catch {
		return { useClone: false };
	}
}

async function extractFromClone(parsed: ParsedGitHubUrl, options: GitHubExtractOptions, defaultBranch: string | undefined) {
	const clone = await cloneOrUpdateRepo(parsed.owner, parsed.repo, parsed.ref ?? defaultBranch, {
		cacheDir: options.cacheDir ?? defaultCacheDir(),
		timeoutSeconds: options.cloneTimeoutSeconds,
		maxAgeHours: options.maxAgeHours,
	});
	const meta = { provider: "github", ...parsed, extraction: "clone", cachePath: clone.cachePath, headRef: clone.headRef, cloned: clone.cloned, updated: clone.updated, defaultBranch };
	if (parsed.kind === "blob" && parsed.path) {
		const blob = readBlobFromCache(clone.cachePath, parsed.path);
		if (!blob) throw new Error(`File not found in cloned repo: ${parsed.path}`);
		return { title: `${parsed.owner}/${parsed.repo}/${parsed.path}`, content: blob.content, metadata: { ...meta, bytes: blob.bytes } };
	}
	if (parsed.kind === "tree") {
		const tree = readTreeFromCache(clone.cachePath, parsed.path ?? "", options.maxTreeEntries ?? 200);
		if (!tree) throw new Error(`Directory not found in cloned repo: ${parsed.path ?? "/"}`);
		return { title: `${parsed.owner}/${parsed.repo}/${parsed.path ?? ""}`, content: summarizeTreeEntries(tree.entries, tree.truncated), metadata: { ...meta, entries: tree.entries.length, truncated: tree.truncated } };
	}
	const readme = readReadmeFromCache(clone.cachePath) ?? "";
	const tree = readTreeFromCache(clone.cachePath, "", options.maxTreeEntries ?? 80);
	const treeText = tree ? summarizeTreeEntries(tree.entries, tree.truncated) : "";
	const body = [`# ${parsed.owner}/${parsed.repo}`, `Cached at: ${clone.cachePath}`, treeText ? `\n## Tree (top entries)\n${treeText}` : undefined, readme ? `\n## README\n\n${readme}` : undefined].filter(Boolean).join("\n");
	return { title: `${parsed.owner}/${parsed.repo}`, content: body, metadata: { ...meta, hasReadme: Boolean(readme), entries: tree?.entries.length ?? 0 } };
}

export async function extractGitHubUrl(input: string, options: GitHubExtractOptions = {}) {
	const parsed = parseGitHubUrl(input);
	if (!parsed) return undefined;
	const fetchImpl = options.fetchImpl ?? fetch;
	const decision = await shouldUseClone(parsed, options, fetchImpl);
	if (decision.useClone) {
		try {
			return await extractFromClone(parsed, options, decision.defaultBranch);
		} catch (error) {
			// fall through to API path on clone failure
		}
	}
	if (parsed.kind === "blob" && parsed.rawUrl) {
		const response = await fetchImpl(parsed.rawUrl, { signal: options.signal });
		if (!response.ok) throw new Error(`GitHub raw fetch failed (${response.status}) for ${parsed.rawUrl}`);
		const content = await response.text();
		return { title: `${parsed.owner}/${parsed.repo}/${parsed.path ?? ""}`, content, metadata: { provider: "github", ...parsed, extraction: "raw" } };
	}
	const data = await jsonFetch(fetchImpl, parsed.apiUrl, options.signal);
	if (parsed.kind === "repo") {
		const readme = await fetchImpl(`https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/HEAD/README.md`, { signal: options.signal }).then((r) => r.ok ? r.text() : "").catch(() => "");
		const content = `# ${data.full_name ?? `${parsed.owner}/${parsed.repo}`}\n\n${data.description ?? ""}\n\n${readme}`.trim();
		return { title: data.full_name ?? `${parsed.owner}/${parsed.repo}`, content, metadata: { provider: "github", ...parsed, extraction: "repo", stars: data.stargazers_count, defaultBranch: data.default_branch } };
	}
	if (Array.isArray(data)) {
		const entries = data.slice(0, options.maxTreeEntries ?? 200).map((entry: any) => `- ${entry.type === "dir" ? "dir" : "file"}: ${entry.path ?? entry.name}`).join("\n");
		return { title: `${parsed.owner}/${parsed.repo}/${parsed.path ?? ""}`, content: entries, metadata: { provider: "github", ...parsed, extraction: "tree", entries: data.length } };
	}
	const content = JSON.stringify(data, null, 2);
	return { title: `${parsed.owner}/${parsed.repo}`, content, metadata: { provider: "github", ...parsed, extraction: parsed.kind } };
}
