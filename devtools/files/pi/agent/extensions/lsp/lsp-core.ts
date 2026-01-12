/**
 * LSP Core - Language Server Protocol client management
 */
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  type MessageConnection,
  InitializeRequest,
  InitializedNotification,
  DidOpenTextDocumentNotification,
  DidChangeTextDocumentNotification,
  DidCloseTextDocumentNotification,
  DidSaveTextDocumentNotification,
  PublishDiagnosticsNotification,
  DefinitionRequest,
  ReferencesRequest,
  HoverRequest,
  SignatureHelpRequest,
  DocumentSymbolRequest,
  RenameRequest,
  CodeActionRequest,
} from "vscode-languageserver-protocol/node.js";
import {
  type Diagnostic,
  type Location,
  type LocationLink,
  type DocumentSymbol,
  type SymbolInformation,
  type Hover,
  type SignatureHelp,
  type WorkspaceEdit,
  type CodeAction,
  type Command,
  DiagnosticSeverity,
  CodeActionKind,
} from "vscode-languageserver-protocol";

// Config
const INIT_TIMEOUT_MS = 30000;
const MAX_OPEN_FILES = 30;
const IDLE_TIMEOUT_MS = 60_000;
const CLEANUP_INTERVAL_MS = 30_000;

export const LANGUAGE_IDS: Record<string, string> = {
  ".dart": "dart", ".ts": "typescript", ".tsx": "typescriptreact",
  ".js": "javascript", ".jsx": "javascriptreact", ".mjs": "javascript",
  ".cjs": "javascript", ".mts": "typescript", ".cts": "typescript",
  ".vue": "vue", ".svelte": "svelte", ".astro": "astro",
  ".py": "python", ".pyi": "python", ".go": "go", ".rs": "rust",
};

// Types
interface LSPServerConfig {
  id: string;
  extensions: string[];
  findRoot: (file: string, cwd: string) => string | undefined;
  spawn: (root: string) => Promise<{ process: ChildProcessWithoutNullStreams; initOptions?: Record<string, unknown> } | undefined>;
}

interface OpenFile { version: number; lastAccess: number; }

interface LSPClient {
  connection: MessageConnection;
  process: ChildProcessWithoutNullStreams;
  diagnostics: Map<string, Diagnostic[]>;
  openFiles: Map<string, OpenFile>;
  listeners: Map<string, Array<() => void>>;
  root: string;
}

export interface FileDiagnosticItem {
  file: string;
  diagnostics: Diagnostic[];
  status: 'ok' | 'timeout' | 'error' | 'unsupported';
  error?: string;
}

export interface FileDiagnosticsResult { items: FileDiagnosticItem[]; }

// Utilities
const SEARCH_PATHS = [
  ...(process.env.PATH?.split(path.delimiter) || []),
  "/usr/local/bin", "/opt/homebrew/bin",
  `${process.env.HOME}/.pub-cache/bin`, `${process.env.HOME}/fvm/default/bin`,
  `${process.env.HOME}/go/bin`, `${process.env.HOME}/.cargo/bin`,
];

function which(cmd: string): string | undefined {
  const ext = process.platform === "win32" ? ".exe" : "";
  for (const dir of SEARCH_PATHS) {
    const full = path.join(dir, cmd + ext);
    try { if (fs.existsSync(full) && fs.statSync(full).isFile()) return full; } catch {}
  }
}

function findNearestFile(startDir: string, targets: string[], stopDir: string): string | undefined {
  let current = path.resolve(startDir);
  const stop = path.resolve(stopDir);
  while (current.length >= stop.length) {
    for (const t of targets) {
      const candidate = path.join(current, t);
      if (fs.existsSync(candidate)) return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

function findRoot(file: string, cwd: string, markers: string[]): string | undefined {
  const found = findNearestFile(path.dirname(file), markers, cwd);
  return found ? path.dirname(found) : undefined;
}

function timeout<T>(promise: Promise<T>, ms: number, name: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${name} timed out`)), ms);
    promise.then(r => { clearTimeout(timer); resolve(r); }, e => { clearTimeout(timer); reject(e); });
  });
}

function simpleSpawn(bin: string, args: string[] = ["--stdio"]) {
  return async (root: string) => {
    const cmd = which(bin);
    if (!cmd) return undefined;
    return { process: spawn(cmd, args, { cwd: root, stdio: ["pipe", "pipe", "pipe"] }) };
  };
}

// Server Configs
export const LSP_SERVERS: LSPServerConfig[] = [
  {
    id: "dart", extensions: [".dart"],
    findRoot: (f, cwd) => findRoot(f, cwd, ["pubspec.yaml", "analysis_options.yaml"]),
    spawn: async (root) => {
      let dart = which("dart");
      const pubspec = path.join(root, "pubspec.yaml");
      if (fs.existsSync(pubspec)) {
        try {
          const content = fs.readFileSync(pubspec, "utf-8");
          if (content.includes("flutter:") || content.includes("sdk: flutter")) {
            const flutter = which("flutter");
            if (flutter) {
              const dir = path.dirname(fs.realpathSync(flutter));
              for (const p of ["cache/dart-sdk/bin/dart", "../cache/dart-sdk/bin/dart"]) {
                const c = path.join(dir, p);
                if (fs.existsSync(c)) { dart = c; break; }
              }
            }
          }
        } catch {}
      }
      if (!dart) return undefined;
      return { process: spawn(dart, ["language-server", "--protocol=lsp"], { cwd: root, stdio: ["pipe", "pipe", "pipe"] }) };
    },
  },
  {
    id: "typescript", extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"],
    findRoot: (f, cwd) => {
      if (findNearestFile(path.dirname(f), ["deno.json", "deno.jsonc"], cwd)) return undefined;
      return findRoot(f, cwd, ["package.json", "tsconfig.json", "jsconfig.json"]);
    },
    spawn: async (root) => {
      const local = path.join(root, "node_modules/.bin/typescript-language-server");
      const cmd = fs.existsSync(local) ? local : which("typescript-language-server");
      if (!cmd) return undefined;
      return { process: spawn(cmd, ["--stdio"], { cwd: root, stdio: ["pipe", "pipe", "pipe"] }) };
    },
  },
  { id: "vue", extensions: [".vue"], findRoot: (f, cwd) => findRoot(f, cwd, ["package.json", "vite.config.ts", "vite.config.js"]), spawn: simpleSpawn("vue-language-server") },
  { id: "svelte", extensions: [".svelte"], findRoot: (f, cwd) => findRoot(f, cwd, ["package.json", "svelte.config.js"]), spawn: simpleSpawn("svelteserver") },
  { id: "pyright", extensions: [".py", ".pyi"], findRoot: (f, cwd) => findRoot(f, cwd, ["pyproject.toml", "setup.py", "requirements.txt", "pyrightconfig.json"]), spawn: simpleSpawn("pyright-langserver") },
  { id: "gopls", extensions: [".go"], findRoot: (f, cwd) => findRoot(f, cwd, ["go.work"]) || findRoot(f, cwd, ["go.mod"]), spawn: simpleSpawn("gopls", []) },
  { id: "rust-analyzer", extensions: [".rs"], findRoot: (f, cwd) => findRoot(f, cwd, ["Cargo.toml"]), spawn: simpleSpawn("rust-analyzer", []) },
];

// Singleton Manager
let sharedManager: LSPManager | null = null;
let managerCwd: string | null = null;

export function getOrCreateManager(cwd: string): LSPManager {
  if (!sharedManager || managerCwd !== cwd) {
    sharedManager?.shutdown().catch(() => {});
    sharedManager = new LSPManager(cwd);
    managerCwd = cwd;
  }
  return sharedManager;
}

export function getManager(): LSPManager | null { return sharedManager; }

export async function shutdownManager(): Promise<void> {
  if (sharedManager) {
    await sharedManager.shutdown();
    sharedManager = null;
    managerCwd = null;
  }
}

// LSP Manager
export class LSPManager {
  private clients = new Map<string, LSPClient>();
  private spawning = new Map<string, Promise<LSPClient | undefined>>();
  private broken = new Set<string>();
  private cwd: string;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(cwd: string) {
    this.cwd = cwd;
    this.cleanupTimer = setInterval(() => this.cleanupIdleFiles(), CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  private cleanupIdleFiles() {
    const now = Date.now();
    for (const client of this.clients.values()) {
      for (const [fp, state] of client.openFiles) {
        if (now - state.lastAccess > IDLE_TIMEOUT_MS) this.closeFile(client, fp);
      }
    }
  }

  private closeFile(client: LSPClient, absPath: string) {
    if (!client.openFiles.has(absPath)) return;
    client.openFiles.delete(absPath);
    try {
      client.connection.sendNotification(DidCloseTextDocumentNotification.type, {
        textDocument: { uri: pathToFileURL(absPath).href },
      });
    } catch {}
  }

  private evictLRU(client: LSPClient) {
    if (client.openFiles.size <= MAX_OPEN_FILES) return;
    let oldest: { path: string; time: number } | null = null;
    for (const [fp, s] of client.openFiles) {
      if (!oldest || s.lastAccess < oldest.time) oldest = { path: fp, time: s.lastAccess };
    }
    if (oldest) this.closeFile(client, oldest.path);
  }

  private key(id: string, root: string) { return `${id}:${root}`; }

  private async initClient(config: LSPServerConfig, root: string): Promise<LSPClient | undefined> {
    const k = this.key(config.id, root);
    try {
      const handle = await config.spawn(root);
      if (!handle) { this.broken.add(k); return undefined; }

      const reader = new StreamMessageReader(handle.process.stdout!);
      const writer = new StreamMessageWriter(handle.process.stdin!);
      const conn = createMessageConnection(reader, writer);
      
      // Prevent crashes from stream errors
      handle.process.stdin?.on("error", () => {});
      handle.process.stdout?.on("error", () => {});
      handle.process.stderr?.on("data", () => {});
      handle.process.stderr?.on("error", () => {});

      const client: LSPClient = {
        connection: conn, process: handle.process, diagnostics: new Map(),
        openFiles: new Map(), listeners: new Map(), root,
      };

      conn.onNotification("textDocument/publishDiagnostics", (params: { uri: string; diagnostics: Diagnostic[] }) => {
        const fp = decodeURIComponent(new URL(params.uri).pathname);
        client.diagnostics.set(fp, params.diagnostics);
        const listeners = client.listeners.get(fp);
        client.listeners.delete(fp);
        listeners?.forEach(fn => { try { fn(); } catch { /* listener error */ } });
      });

      // Handle errors to prevent crashes
      conn.onError(() => {});
      conn.onClose(() => { this.clients.delete(k); });

      conn.onRequest("workspace/configuration", () => [handle.initOptions ?? {}]);
      conn.onRequest("window/workDoneProgress/create", () => null);
      conn.onRequest("client/registerCapability", () => {});
      conn.onRequest("client/unregisterCapability", () => {});
      conn.onRequest("workspace/workspaceFolders", () => [{ name: "workspace", uri: pathToFileURL(root).href }]);

      handle.process.on("exit", () => this.clients.delete(k));
      handle.process.on("error", () => { this.clients.delete(k); this.broken.add(k); });

      conn.listen();

      await timeout(conn.sendRequest(InitializeRequest.method, {
        rootUri: pathToFileURL(root).href,
        processId: process.pid,
        workspaceFolders: [{ name: "workspace", uri: pathToFileURL(root).href }],
        initializationOptions: handle.initOptions ?? {},
        capabilities: {
          window: { workDoneProgress: true },
          workspace: { configuration: true },
          textDocument: {
            synchronization: { didSave: true, didOpen: true, didChange: true, didClose: true },
            publishDiagnostics: { versionSupport: true },
          },
        },
      }), INIT_TIMEOUT_MS, `${config.id} init`);

      conn.sendNotification(InitializedNotification.type, {});
      if (handle.initOptions) {
        conn.sendNotification("workspace/didChangeConfiguration", { settings: handle.initOptions });
      }
      return client;
    } catch { this.broken.add(k); return undefined; }
  }

  async getClientsForFile(filePath: string): Promise<LSPClient[]> {
    const ext = path.extname(filePath);
    const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(this.cwd, filePath);
    const clients: LSPClient[] = [];

    for (const config of LSP_SERVERS) {
      if (!config.extensions.includes(ext)) continue;
      const root = config.findRoot(absPath, this.cwd);
      if (!root) continue;
      const k = this.key(config.id, root);
      if (this.broken.has(k)) continue;

      const existing = this.clients.get(k);
      if (existing) { clients.push(existing); continue; }

      if (!this.spawning.has(k)) {
        const p = this.initClient(config, root);
        this.spawning.set(k, p);
        p.finally(() => this.spawning.delete(k));
      }
      const client = await this.spawning.get(k);
      if (client) { this.clients.set(k, client); clients.push(client); }
    }
    return clients;
  }

  private resolve(fp: string) { return path.isAbsolute(fp) ? fp : path.resolve(this.cwd, fp); }
  private langId(fp: string) { return LANGUAGE_IDS[path.extname(fp)] || "plaintext"; }
  private readFile(fp: string): string | null { try { return fs.readFileSync(fp, "utf-8"); } catch { return null; } }
  private toPos(line: number, col: number) { return { line: Math.max(0, line - 1), character: Math.max(0, col - 1) }; }

  private normalizeLocs(result: Location | Location[] | LocationLink[] | null | undefined): Location[] {
    if (!result) return [];
    const items = Array.isArray(result) ? result : [result];
    if (!items.length) return [];
    if ("uri" in items[0] && "range" in items[0]) return items as Location[];
    return (items as LocationLink[]).map(l => ({ uri: l.targetUri, range: l.targetSelectionRange ?? l.targetRange }));
  }

  private normalizeSymbols(result: DocumentSymbol[] | SymbolInformation[] | null | undefined): DocumentSymbol[] {
    if (!result?.length) return [];
    const first = result[0];
    if ("location" in first) {
      return (result as SymbolInformation[]).map(s => ({
        name: s.name, kind: s.kind, range: s.location.range, selectionRange: s.location.range,
        detail: s.containerName, tags: s.tags, deprecated: s.deprecated, children: [],
      }));
    }
    return result as DocumentSymbol[];
  }

  private async openOrUpdate(clients: LSPClient[], absPath: string, uri: string, langId: string, content: string, evict = true) {
    const now = Date.now();
    for (const client of clients) {
      const state = client.openFiles.get(absPath);
      try {
        if (state) {
          const v = state.version + 1;
          client.openFiles.set(absPath, { version: v, lastAccess: now });
          client.connection.sendNotification(DidChangeTextDocumentNotification.type, {
            textDocument: { uri, version: v }, contentChanges: [{ text: content }],
          });
        } else {
          client.openFiles.set(absPath, { version: 0, lastAccess: now });
          client.connection.sendNotification(DidOpenTextDocumentNotification.type, {
            textDocument: { uri, languageId: langId, version: 0, text: content },
          });
          if (evict) this.evictLRU(client);
        }
        // Send didSave to trigger analysis (important for TypeScript)
        client.connection.sendNotification(DidSaveTextDocumentNotification.type, {
          textDocument: { uri }, text: content,
        });
      } catch {}
    }
  }

  private async loadFile(filePath: string) {
    const absPath = this.resolve(filePath);
    const clients = await this.getClientsForFile(absPath);
    if (!clients.length) return null;
    const content = this.readFile(absPath);
    if (content === null) return null;
    return { clients, absPath, uri: pathToFileURL(absPath).href, langId: this.langId(absPath), content };
  }

  private waitForDiagnostics(client: LSPClient, absPath: string, timeoutMs: number, isNew: boolean): Promise<boolean> {
    return new Promise(resolve => {
      let resolved = false;
      let count = 0;
      
      const listener = () => {
        if (resolved) return;
        count++;
        if (isNew && count === 1) {
          setTimeout(() => { 
            if (resolved) return;
            resolved = true;
            clearTimeout(timer); 
            resolve(true); 
          }, 500);
        } else {
          resolved = true;
          clearTimeout(timer); 
          resolve(true);
        }
      };
      
      const timer = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        // Clean up listener on timeout to prevent memory leak
        const listeners = client.listeners.get(absPath);
        if (listeners) {
          const idx = listeners.indexOf(listener);
          if (idx !== -1) listeners.splice(idx, 1);
          if (listeners.length === 0) client.listeners.delete(absPath);
        }
        resolve(false);
      }, timeoutMs);
      
      const listeners = client.listeners.get(absPath) || [];
      listeners.push(listener);
      client.listeners.set(absPath, listeners);
    });
  }

  async touchFileAndWait(filePath: string, timeoutMs: number): Promise<{ diagnostics: Diagnostic[]; receivedResponse: boolean }> {
    const loaded = await this.loadFile(filePath);
    if (!loaded) return { diagnostics: [], receivedResponse: false };
    const { clients, absPath, uri, langId, content } = loaded;
    const isNew = clients.some(c => !c.openFiles.has(absPath));

    const waits = clients.map(c => this.waitForDiagnostics(c, absPath, timeoutMs, isNew));
    await this.openOrUpdate(clients, absPath, uri, langId, content);
    const results = await Promise.all(waits);

    let responded = results.some(r => r);
    const diags: Diagnostic[] = [];
    for (const c of clients) {
      const d = c.diagnostics.get(absPath);
      if (d) diags.push(...d);
    }
    if (!responded && clients.some(c => c.diagnostics.has(absPath))) responded = true;
    return { diagnostics: diags, receivedResponse: responded };
  }

  async getDiagnosticsForFiles(files: string[], timeoutMs: number): Promise<FileDiagnosticsResult> {
    const unique = [...new Set(files.map(f => this.resolve(f)))];
    const results: FileDiagnosticItem[] = [];
    const toClose: Map<LSPClient, string[]> = new Map();

    for (const absPath of unique) {
      if (!fs.existsSync(absPath)) {
        results.push({ file: absPath, diagnostics: [], status: 'error', error: 'File not found' });
        continue;
      }

      let clients: LSPClient[];
      try { clients = await this.getClientsForFile(absPath); }
      catch (e) { results.push({ file: absPath, diagnostics: [], status: 'error', error: String(e) }); continue; }

      if (!clients.length) {
        results.push({ file: absPath, diagnostics: [], status: 'unsupported', error: `No LSP for ${path.extname(absPath)}` });
        continue;
      }

      const content = this.readFile(absPath);
      if (!content) {
        results.push({ file: absPath, diagnostics: [], status: 'error', error: 'Could not read file' });
        continue;
      }

      const uri = pathToFileURL(absPath).href;
      const langId = this.langId(absPath);
      const isNew = clients.some(c => !c.openFiles.has(absPath));

      for (const c of clients) {
        if (!c.openFiles.has(absPath)) {
          if (!toClose.has(c)) toClose.set(c, []);
          toClose.get(c)!.push(absPath);
        }
      }

      const waits = clients.map(c => this.waitForDiagnostics(c, absPath, timeoutMs, isNew));
      await this.openOrUpdate(clients, absPath, uri, langId, content, false);
      const waitResults = await Promise.all(waits);

      const diags: Diagnostic[] = [];
      for (const c of clients) { const d = c.diagnostics.get(absPath); if (d) diags.push(...d); }

      if (!waitResults.some(r => r) && !diags.length) {
        results.push({ file: absPath, diagnostics: [], status: 'timeout', error: 'LSP did not respond' });
      } else {
        results.push({ file: absPath, diagnostics: diags, status: 'ok' });
      }
    }

    // Cleanup opened files
    for (const [c, fps] of toClose) { for (const fp of fps) this.closeFile(c, fp); }
    for (const c of this.clients.values()) { while (c.openFiles.size > MAX_OPEN_FILES) this.evictLRU(c); }

    return { items: results };
  }

  async getDefinition(fp: string, line: number, col: number): Promise<Location[]> {
    const l = await this.loadFile(fp);
    if (!l) return [];
    await this.openOrUpdate(l.clients, l.absPath, l.uri, l.langId, l.content);
    const pos = this.toPos(line, col);
    const results = await Promise.all(l.clients.map(async c => {
      try { return this.normalizeLocs(await c.connection.sendRequest(DefinitionRequest.type, { textDocument: { uri: l.uri }, position: pos })); }
      catch { return []; }
    }));
    return results.flat();
  }

  async getReferences(fp: string, line: number, col: number): Promise<Location[]> {
    const l = await this.loadFile(fp);
    if (!l) return [];
    await this.openOrUpdate(l.clients, l.absPath, l.uri, l.langId, l.content);
    const pos = this.toPos(line, col);
    const results = await Promise.all(l.clients.map(async c => {
      try { return this.normalizeLocs(await c.connection.sendRequest(ReferencesRequest.type, { textDocument: { uri: l.uri }, position: pos, context: { includeDeclaration: true } })); }
      catch { return []; }
    }));
    return results.flat();
  }

  async getHover(fp: string, line: number, col: number): Promise<Hover | null> {
    const l = await this.loadFile(fp);
    if (!l) return null;
    await this.openOrUpdate(l.clients, l.absPath, l.uri, l.langId, l.content);
    const pos = this.toPos(line, col);
    for (const c of l.clients) {
      try { const r = await c.connection.sendRequest(HoverRequest.type, { textDocument: { uri: l.uri }, position: pos }); if (r) return r; }
      catch {}
    }
    return null;
  }

  async getSignatureHelp(fp: string, line: number, col: number): Promise<SignatureHelp | null> {
    const l = await this.loadFile(fp);
    if (!l) return null;
    await this.openOrUpdate(l.clients, l.absPath, l.uri, l.langId, l.content);
    const pos = this.toPos(line, col);
    for (const c of l.clients) {
      try { const r = await c.connection.sendRequest(SignatureHelpRequest.type, { textDocument: { uri: l.uri }, position: pos }); if (r) return r; }
      catch {}
    }
    return null;
  }

  async getDocumentSymbols(fp: string): Promise<DocumentSymbol[]> {
    const l = await this.loadFile(fp);
    if (!l) return [];
    await this.openOrUpdate(l.clients, l.absPath, l.uri, l.langId, l.content);
    const results = await Promise.all(l.clients.map(async c => {
      try { return this.normalizeSymbols(await c.connection.sendRequest(DocumentSymbolRequest.type, { textDocument: { uri: l.uri } })); }
      catch { return []; }
    }));
    return results.flat();
  }

  async rename(fp: string, line: number, col: number, newName: string): Promise<WorkspaceEdit | null> {
    const l = await this.loadFile(fp);
    if (!l) return null;
    await this.openOrUpdate(l.clients, l.absPath, l.uri, l.langId, l.content);
    const pos = this.toPos(line, col);
    for (const c of l.clients) {
      try {
        const r = await c.connection.sendRequest(RenameRequest.type, {
          textDocument: { uri: l.uri },
          position: pos,
          newName,
        });
        if (r) return r;
      } catch {}
    }
    return null;
  }

  async getCodeActions(fp: string, startLine: number, startCol: number, endLine?: number, endCol?: number): Promise<(CodeAction | Command)[]> {
    const l = await this.loadFile(fp);
    if (!l) return [];
    await this.openOrUpdate(l.clients, l.absPath, l.uri, l.langId, l.content);
    
    const start = this.toPos(startLine, startCol);
    const end = this.toPos(endLine ?? startLine, endCol ?? startCol);
    const range = { start, end };
    
    // Get diagnostics for this range to include in context
    const diagnostics: Diagnostic[] = [];
    for (const c of l.clients) {
      const fileDiags = c.diagnostics.get(l.absPath) || [];
      for (const d of fileDiags) {
        if (this.rangesOverlap(d.range, range)) diagnostics.push(d);
      }
    }
    
    const results = await Promise.all(l.clients.map(async c => {
      try {
        const r = await c.connection.sendRequest(CodeActionRequest.type, {
          textDocument: { uri: l.uri },
          range,
          context: { diagnostics, only: [CodeActionKind.QuickFix, CodeActionKind.Refactor, CodeActionKind.Source] },
        });
        return r || [];
      } catch { return []; }
    }));
    return results.flat();
  }

  private rangesOverlap(a: { start: { line: number; character: number }; end: { line: number; character: number } }, 
                        b: { start: { line: number; character: number }; end: { line: number; character: number } }): boolean {
    if (a.end.line < b.start.line || b.end.line < a.start.line) return false;
    if (a.end.line === b.start.line && a.end.character < b.start.character) return false;
    if (b.end.line === a.start.line && b.end.character < a.start.character) return false;
    return true;
  }

  async shutdown() {
    if (this.cleanupTimer) { clearInterval(this.cleanupTimer); this.cleanupTimer = null; }
    const clients = Array.from(this.clients.values());
    this.clients.clear();
    for (const c of clients) {
      try {
        await Promise.race([
          c.connection.sendRequest("shutdown"),
          new Promise(r => setTimeout(r, 1000))
        ]);
      } catch {}
      try { c.connection.sendNotification("exit"); } catch {}
      try { c.connection.end(); } catch {}
      try { c.process.kill(); } catch {}
    }
  }
}

// Diagnostic Formatting
export { DiagnosticSeverity };
export type SeverityFilter = "all" | "error" | "warning" | "info" | "hint";

export function formatDiagnostic(d: Diagnostic): string {
  const sev = ["", "ERROR", "WARN", "INFO", "HINT"][d.severity || 1];
  return `${sev} [${d.range.start.line + 1}:${d.range.start.character + 1}] ${d.message}`;
}

export function filterDiagnosticsBySeverity(diags: Diagnostic[], filter: SeverityFilter): Diagnostic[] {
  if (filter === "all") return diags;
  const max = { error: 1, warning: 2, info: 3, hint: 4 }[filter];
  return diags.filter(d => (d.severity || 1) <= max);
}

// URI utilities
export function uriToPath(uri: string): string {
  if (uri.startsWith("file://")) try { return fileURLToPath(uri); } catch {}
  return uri;
}

// Symbol search
export function findSymbolPosition(symbols: DocumentSymbol[], query: string): { line: number; character: number } | null {
  const q = query.toLowerCase();
  let exact: { line: number; character: number } | null = null;
  let partial: { line: number; character: number } | null = null;

  const visit = (items: DocumentSymbol[]) => {
    for (const sym of items) {
      const name = String(sym?.name ?? "").toLowerCase();
      const pos = sym?.selectionRange?.start ?? sym?.range?.start;
      if (pos && typeof pos.line === "number" && typeof pos.character === "number") {
        if (!exact && name === q) exact = pos;
        if (!partial && name.includes(q)) partial = pos;
      }
      if (sym?.children?.length) visit(sym.children);
    }
  };
  visit(symbols);
  return exact ?? partial;
}

export async function resolvePosition(manager: LSPManager, file: string, query: string): Promise<{ line: number; column: number } | null> {
  const symbols = await manager.getDocumentSymbols(file);
  const pos = findSymbolPosition(symbols, query);
  return pos ? { line: pos.line + 1, column: pos.character + 1 } : null;
}
