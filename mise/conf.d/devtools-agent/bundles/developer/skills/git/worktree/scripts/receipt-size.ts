// Keeps v4 receipts small; evidence bytes belong in checksum-bound artifacts, not event history.
import { createHash } from "node:crypto";
import { lstat, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

type Fields = Record<string, unknown>;
const receiptLimit = 64 * 1024;
const stringLimit = 2 * 1024;
const narrativeLimit = 8 * 1024;
const forbidden: Record<string, true> = { stdout: true, stderr: true, output: true, body: true, content: true, contents: true, diff: true, patch: true, transcript: true, transcripts: true, logs: true, base64: true, data_uri: true, data_url: true, payload: true, file_contents: true };
const metadata: Record<string, true> = { schemaVersion: true, receipt_id: true, workflow_id: true, phase: true, event: true, status: true, attempt: true, parent_receipt: true, repository: true, worktree: true, workspace_path: true, source_branch: true, base_branch: true, source_commit: true, source_tree: true, created_at: true, muxer: true, agent: true, pane_id: true, session_id: true, ticket: true, ticket_ref: true, workflow: true, evidence: true, inputs: true, outputs: true, goal_run_id: true, goal_dispatch_ref: true, source_candidate: true, changed_files: true, changed_scope: true, affected_contracts: true, integration_checks: true, consumed_review_receipts: true, resolved_finding_ids: true, unresolved_finding_ids: true, history_supplements: true };
const technical: Record<string, true> = { argv: true, cwd: true, source_commit: true, source_tree: true, ref: true, sha256: true, media_type: true, id: true, severity: true, file: true, kind: true, store: true, verdict: true, checkpoint: true, next_step: true, integration_method: true, merged_commit: true, merged_tree: true, merged_parents: true, candidate_branch: true, candidate_workspace: true, remote: true, remote_ref: true, remote_observed_commit: true, review_receipt: true, review_base_commit: true, reviewed_source_commit: true, reviewed_source_tree: true, base_before: true, expected_merge_tree: true };

/** Validate v4 fields and final serialized bytes. Historical events retain their original contract. */
export function validateReceiptSize(receipt: Fields, serialized?: string): void {
  if (receipt.schemaVersion !== "worktree-receipt/v4") return;
  const bytes = Buffer.byteLength(serialized ?? Bun.YAML.stringify(receipt));
  if (bytes > receiptLimit) throw new Error(`Receipt is ${bytes} bytes; limit is ${receiptLimit}. Move large lists and evidence into immutable artifacts and record references.`);
  const jsonBytes = Buffer.byteLength(JSON.stringify(receipt, null, 2));
  if (jsonBytes > receiptLimit) throw new Error(`Receipt transport is ${jsonBytes} bytes; limit is ${receiptLimit}. Move large lists and evidence into immutable artifacts and record references.`);
  const narrative = inspectValue(receipt, "$", false, true);
  if (narrative > narrativeLimit) throw new Error(`Receipt narrative is ${narrative} bytes; limit is ${narrativeLimit}. Move details into immutable artifacts and record references.`);
  if (receipt.findings != null && !Array.isArray(receipt.findings)) throw new Error("Receipt findings must be a compact array or use findings_ref.");
  if (Array.isArray(receipt.findings)) {
    for (const finding of receipt.findings) {
      const row = finding as Fields;
      if (!row || typeof row !== "object" || Array.isArray(row)
        || Object.keys(row).some(key => !["id", "severity", "file", "line", "ref"].includes(key))
        || ["id", "severity", "file", "ref"].some(key => typeof row[key] !== "string" || !row[key])
        || !Number.isInteger(row.line) || Number(row.line) < 1) {
        throw new Error("Receipt findings contain only id, severity, file, line and ref; put full findings in the review artifact.");
      }
    }
  }
  const references = [...(Array.isArray(receipt.inputs) ? receipt.inputs : []), ...(Array.isArray(receipt.outputs) ? receipt.outputs : [])] as Fields[];
  for (const entry of references) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || Object.keys(entry).some(key => !["kind", "ref", "sha256", "bytes", "media_type", "store"].includes(key))) throw new Error("Receipt references contain metadata only: kind, ref, sha256, bytes, media_type and store.");
  }
  const artifacts = artifactReferences(receipt);
  for (const entry of artifacts) validateArtifactMetadata(entry);
  if (Array.isArray(receipt.validation_results) && receipt.validation_results.some(row => row && typeof row === "object" && row.ref != null && !artifacts.some(entry => entry.ref === row.ref))) throw new Error("Validation artifact refs must also be listed in inputs or outputs.");
  for (const [key, value] of Object.entries(receipt)) {
    if (key.endsWith("_ref") && typeof value === "string" && /(?:^|\/)artifacts\//.test(value) && !references.some(entry => entry.ref === value)) throw new Error(`Receipt ${key} must also be listed in inputs or outputs.`);
  }
  if (Array.isArray(receipt.findings) && receipt.findings.some(row => !artifacts.some(entry => entry.ref === row.ref))) throw new Error("Finding refs must identify review artifacts listed in inputs or outputs.");
  if (receipt.changed_files_ref != null && (!Array.isArray(receipt.scope_paths) || !receipt.scope_paths.length || receipt.scope_paths.some(path => typeof path !== "string" || !path))) throw new Error("A changed-files manifest requires non-empty scope_paths covering all changed files for coordination.");
  for (const key of ["findings_ref", "changed_files_ref"]) if (receipt[key] != null && !artifacts.some(entry => entry.ref === receipt[key])) throw new Error(`Receipt ${key} must identify an artifact listed in inputs or outputs.`);
  if (receipt.phase === "review" && receipt.event === "phase-result" && receipt.status === "completed") {
    if (!Array.isArray(receipt.findings) && receipt.findings_ref == null) throw new Error("A completed review requires compact findings or findings_ref; use [] when no findings remain.");
    if (!artifacts.some(entry => Array.isArray(receipt.outputs) && receipt.outputs.includes(entry) && /(?:^|\/)artifacts\/reviews\//.test(String(entry.ref)))) throw new Error("A completed review requires its immutable review artifact in outputs.");
  }
}

/** Check file references against independently resolved workflow/evidence roots before publication. */
export async function validateReceiptArtifacts(receipt: Fields, workflow: Fields, evidence?: Fields): Promise<void> {
  if (receipt.schemaVersion !== "worktree-receipt/v4") return;
  for (const entry of artifactReferences(receipt)) {
    validateArtifactMetadata(entry);
    let path: string | undefined;
    for (const root of [evidence, workflow]) {
      if (!root || entry.store != null && entry.store !== root.store) continue;
      const rootRef = String(root.ref).replace(/\/$/, "");
      const suffix = entry.ref.startsWith(rootRef + "/") ? entry.ref.slice(rootRef.length + 1)
        : root === workflow && entry.ref.startsWith("artifacts/") ? entry.ref : undefined;
      if (suffix == null) continue;
      if (root === workflow && !suffix.startsWith("artifacts/")) continue;
      const base = await realpath(root === workflow ? resolve(String(root.path), "artifacts") : String(root.path));
      const resolvedRoot = await realpath(String(root.path));
      const baseLocal = relative(resolvedRoot, base);
      if (baseLocal === ".." || baseLocal.startsWith("../") || isAbsolute(baseLocal)) throw new Error("Artifact directory escapes its resolved workflow root.");
      const candidate = resolve(base, root === workflow ? suffix.slice("artifacts/".length) : suffix);
      const local = relative(base, candidate);
      if (!local || local === ".." || local.startsWith("../") || isAbsolute(local)) throw new Error("Artifact reference escapes its resolved artifact root.");
      const actual = await realpath(candidate);
      const actualLocal = relative(base, actual);
      if (actualLocal === ".." || actualLocal.startsWith("../") || isAbsolute(actualLocal)) throw new Error("Artifact symlink escapes its resolved artifact root.");
      if (!(await lstat(actual)).isFile()) throw new Error("Artifact reference must identify an existing regular file, not a directory.");
      path = actual;
      break;
    }
    if (!path) throw new Error("Artifact reference must name a file under the resolved workflow artifacts or evidence run.");
    const hash = createHash("sha256");
    let bytes = 0;
    for await (const chunk of Bun.file(path).stream()) { bytes += chunk.byteLength; hash.update(chunk); }
    if (bytes !== entry.bytes || hash.digest("hex") !== entry.sha256) throw new Error("Artifact bytes or SHA-256 do not match the receipt reference.");
  }
}

function inspectValue(value: unknown, path: string, technicalValue: boolean, root = false): number {
  if (typeof value === "string") {
    const bytes = Buffer.byteLength(value);
    if (bytes > stringLimit) throw new Error(`Receipt field ${path} is ${bytes} bytes; limit is ${stringLimit}. Store the details in an immutable artifact and record its reference.`);
    if (/data:[^\s,]*[;,]/i.test(value)) throw new Error(`Receipt field ${path} contains a data URI; store binary evidence as an artifact.`);
    return technicalValue ? 0 : bytes;
  }
  if (Array.isArray(value)) return value.reduce((sum, item, index) => sum + inspectValue(item, `${path}[${index}]`, technicalValue), 0);
  if (value && typeof value === "object") {
    let bytes = 0;
    for (const [key, item] of Object.entries(value)) {
      if (Buffer.byteLength(key) > 128) throw new Error("Receipt field names must not exceed 128 UTF-8 bytes.");
      if (Object.hasOwn(forbidden, key.toLowerCase()) || !root && ["schema", "schemaVersion"].includes(key)) throw new Error(`Receipt field ${path}.${key} embeds evidence or another record; use an artifact reference.`);
      bytes += inspectValue(item, `${path}.${key}`, technicalValue || (root ? Object.hasOwn(metadata, key) : Object.hasOwn(technical, key)) || key.endsWith("_ref"));
    }
    return bytes;
  }
  return 0;
}

function artifactReferences(receipt: Fields): Fields[] {
  const entries = [...(Array.isArray(receipt.inputs) ? receipt.inputs : []), ...(Array.isArray(receipt.outputs) ? receipt.outputs : [])] as Fields[];
  const evidence = receipt.evidence && typeof receipt.evidence === "object" ? receipt.evidence as Fields : undefined;
  return entries.filter(entry => entry && typeof entry === "object"
    && !(entry.kind === "evidence" && entry.ref === evidence?.ref)
    && (typeof entry.ref === "string" && /(?:^|\/)artifacts\//.test(entry.ref)
      || ["artifact", "evidence", "review", "review-artifact", "review_artifact", "validation", "log", "manifest", "snapshot"].includes(String(entry.kind))));
}

function validateArtifactMetadata(entry: Fields): asserts entry is Fields & { ref: string; sha256: string; bytes: number; media_type: string } {
  if (typeof entry.ref !== "string" || typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256)
    || !Number.isSafeInteger(entry.bytes) || Number(entry.bytes) < 0 || typeof entry.media_type !== "string" || !entry.media_type.trim()) {
    throw new Error("Artifact references require ref, sha256, bytes and media_type; store evidence separately before publishing.");
  }
}
