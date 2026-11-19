// Shared manifest validation resolves declarations, not owner-specific artifact content.
import Ajv from "ajv@^8.17.1";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import schema from "../references/manifest.schema.json";

export interface ContractManifest {
  schemaVersion: "skill-contract-manifest/v1";
  sourceRepository?: string;
  produces: string[];
  accepts: string[];
  contracts: Record<string, string>;
  upgrades: { from: string; to: string; procedure: string }[];
}

export interface Definition {
  reference: string;
  path: string;
  content: string;
}

export interface ResolvedContracts {
  manifest: ContractManifest;
  definitions: Record<string, Definition>;
  procedures: Definition[];
}

const validate = new Ajv({ allErrors: true, ownProperties: true }).compile<ContractManifest>(schema);
const validateIdentifier = new Ajv().compile<string>(schema.definitions.identifier);
const manifestIdentifier = "skill-contract-manifest/v1";
const manifestDefinitionPath = fileURLToPath(new URL("../references/manifest.schema.json", import.meta.url));

/** Read-only: reject the entire manifest before returning any resolved declaration. */
export async function loadContracts(skillDirectory: string): Promise<ResolvedContracts> {
  const root = resolve(skillDirectory);
  let value: unknown;
  try {
    value = JSON.parse(await readFile(resolve(root, "contracts.json"), "utf8"));
  } catch {
    throw new Error("Cannot read contracts.json as JSON from the installed skill directory.");
  }
  if (!validate(value)) {
    const errors = validate.errors?.map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
    throw new Error(`Invalid skill contract manifest: ${errors}`);
  }
  // The manifest format is bootstrapped here, never through the manifest under inspection.
  if (Object.hasOwn(value.contracts, manifestIdentifier)) {
    throw new Error("contracts must not redefine the built-in skill-contract-manifest/v1 definition.");
  }
  const usedIdentifiers = [...value.produces, ...value.accepts, ...value.upgrades.flatMap(({ from, to }) => [from, to])];
  for (const identifier of usedIdentifiers) {
    if (identifier !== manifestIdentifier && !Object.hasOwn(value.contracts, identifier)) {
      throw new Error(`Missing authoritative definition for ${identifier}.`);
    }
  }
  const endpoints = new Set<string>();
  for (const upgrade of value.upgrades) {
    const key = `${upgrade.from}:${upgrade.to}`;
    if (upgrade.from === upgrade.to || endpoints.has(key)) {
      throw new Error("Each upgrade must have distinct endpoints and one procedure per endpoint pair.");
    }
    endpoints.add(key);
  }
  const definitions: Record<string, Definition> = Object.create(null);
  for (const [identifier, reference] of Object.entries(value.contracts)) {
    definitions[identifier] = await readDefinition(reference, root, value.sourceRepository);
  }
  if (usedIdentifiers.includes(manifestIdentifier)) {
    definitions[manifestIdentifier] = await readManifestDefinition();
  }
  const procedures: Definition[] = [];
  for (const upgrade of value.upgrades) procedures.push(await readDefinition(upgrade.procedure, root, value.sourceRepository));
  return { manifest: value, definitions, procedures };
}

/** Resolve only after all declarations validate; recognition does not infer input/output support. */
export async function resolveContract(skillDirectory: string, identifier: string): Promise<Definition> {
  if (!validateIdentifier(identifier)) {
    throw new Error("Contract identifier must use record-family/v<positive-integer>.");
  }
  const result = await loadContracts(skillDirectory);
  if (identifier === manifestIdentifier) return readManifestDefinition();
  const definition = result.definitions[identifier];
  if (!definition) throw new Error("Requested contract has no authoritative definition in this manifest.");
  return definition;
}

async function readManifestDefinition(): Promise<Definition> {
  return { reference: "builtin:skill-contract-manifest/v1", path: manifestDefinitionPath, content: await readFile(manifestDefinitionPath, "utf8") };
}

async function readDefinition(reference: string, root: string, sourceRepository?: string): Promise<Definition> {
  if (reference.startsWith("git:")) return readGitDefinition(reference, sourceRepository);
  if (!reference.startsWith("file:")) throw new Error("Definition reference must use file: or git:.");
  const relativePath = reference.slice(5);
  if (!relativePath || isAbsolute(relativePath) || relativePath.includes("\0")) {
    throw new Error("file: definition reference must contain a relative installed-skill path.");
  }
  const path = resolve(root, relativePath);
  let content: string;
  try {
    content = await readFile(path, "utf8");
  } catch {
    throw new Error("Cannot resolve file: definition from the installed skill directory.");
  }
  if (!content.trim()) throw new Error("Authoritative definition must not be empty.");
  return { reference, path, content };
}

async function readGitDefinition(reference: string, sourceRepository?: string): Promise<Definition> {
  if (!sourceRepository?.trim()) throw new Error("git: references require sourceRepository.");
  // Relative repository locations would depend on the caller checkout.
  if (!isAbsolute(sourceRepository) && !/^(?:https?|ssh|git|file):\/\/|^[^/\s:]+@[^/\s:]+:/.test(sourceRepository)) {
    throw new Error("sourceRepository must be an absolute path, repository URL, or user@host:path.");
  }
  const match = /^git:([a-fA-F0-9]{40}|[a-fA-F0-9]{64}):(.+)$/.exec(reference);
  if (!match) throw new Error("git: references require a full immutable commit ID and repository-root-relative path.");
  const [, commit, path] = match;
  if (isAbsolute(path) || path.includes("\\") || /[\0\r\n]/.test(path) || path.split("/").some((part) => !part || part === "." || part === "..")) {
    throw new Error("git: definition path must be repository-root-relative without traversal.");
  }
  const repository = await mkdtemp(resolve(tmpdir(), "skill-contract-git-"));
  try {
    await git(repository, ["init", "--bare", ...(commit.length === 64 ? ["--object-format=sha256"] : [])]);
    // Fetch into an isolated object store, never a caller or installed checkout.
    await git(repository, ["fetch", "--no-tags", "--depth=1", "--", sourceRepository, commit]);
    if ((await git(repository, ["cat-file", "-t", commit])).trim() !== "commit") {
      throw new Error("git: pin must identify a commit object, not a tag, tree, or blob.");
    }
    const object = `${commit}:${path}`;
    const content = await git(repository, ["cat-file", "blob", object]);
    if (!content.trim()) throw new Error("Authoritative definition must not be empty.");
    return { reference, path: object, content };
  } finally {
    await rm(repository, { recursive: true, force: true });
  }
}

async function git(repository: string, args: string[]): Promise<string> {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_")));
  const child = Bun.spawn(["git", "-C", repository, ...args], { env: { ...env, GIT_TERMINAL_PROMPT: "0" }, stdout: "pipe", stderr: "pipe" });
  const [code, content] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
  if (code !== 0) throw new Error("Cannot resolve git: definition from sourceRepository at the exact pinned commit and path.");
  return content;
}
