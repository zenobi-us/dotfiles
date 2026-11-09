#!/usr/bin/env -S mise x -- bun --install=fallback
// Publishes the authoritative child receipt and its transport result in one operation.
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { mkdir, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deliverResult, loadDeliveryContext, publishImmutableFile } from "../../../../../agent-core/skills/result-delivery/scripts/delivery.ts";

const sharedContextCli = fileURLToPath(new URL("../../../../../agent-core/skills/shared-context/scripts/shared-context/cli.ts", import.meta.url));
const app = new Crust("write-worktree-result").meta({ description: "Write one immutable worktree phase-result receipt and deliver the same object to its caller." }).flags({
  repository: { type: "string", description: "Absolute repository path used by shared-context.", required: true },
  input: { type: "string", description: "JSON receipt file. Read stdin when omitted." },
  "delivery-context": { type: "string", description: "Absolute result-delivery context file; otherwise use RESULT_DELIVERY_CONTEXT." },
  format: { type: "string", description: "human or json for an unbound caller. Required artifact handoffs take precedence." },
}).run(async ({ flags }) => {
  let receipt: Record<string, unknown> | undefined;
  let receiptWritten = false;
  let publicationAttempted = false;
  try {
    if (!isAbsolute(flags.repository)) throw new Error("--repository must be absolute");
    if (flags.format !== undefined && flags.format !== "human" && flags.format !== "json") throw new Error("--format must be human or json");
    let context = await loadDeliveryContext(flags["delivery-context"]);
    if (context.mode === "artifact-reference" && context.target?.schema !== "worktree-receipt/v1") throw new Error("The handoff must expect worktree-receipt/v1");
    if (context.mode !== "artifact-reference" && flags.format) context = { ...context, mode: flags.format, audience: flags.format === "human" ? "human" : "machine" };
    const text = flags.input ? await Bun.file(flags.input).text() : await Bun.stdin.text();
    receipt = object(JSON.parse(text));
    validateReceipt(receipt);
    const resolution = Bun.spawnSync([sharedContextCli, "resolve", "workflow", "--id", String(receipt.workflow_id), "--json"], { cwd: flags.repository, stdout: "pipe", stderr: "pipe" });
    if (resolution.exitCode !== 0) throw new Error("Shared-context could not resolve the workflow. No receipt was written.");
    const target = object(JSON.parse(new TextDecoder().decode(resolution.stdout)));
    const workflow = object(receipt.workflow);
    if (!isAbsolute(String(target.path)) || target.store !== workflow.store || target.root !== workflow.root || target.ref !== workflow.ref) throw new Error("The receipt workflow does not match the resolved store, root and reference");
    const repositories = await Promise.all([flags.repository, String(receipt.repository), String(receipt.worktree)].map(gitCommonDirectory));
    if (repositories.some((directory) => directory !== repositories[0])) throw new Error("The caller, receipt and worktree must belong to the same Git repository");
    const source = Bun.spawnSync(["git", "-C", String(receipt.worktree), "rev-parse", "HEAD", "HEAD^{tree}"], { stdout: "pipe", stderr: "pipe" });
    const identities = new TextDecoder().decode(source.stdout).trim().split("\n");
    if (source.exitCode !== 0 || identities[0] !== receipt.source_commit || identities[1] !== receipt.source_tree) throw new Error("The current source commit or tree does not match the receipt");
    const destination = join(String(target.path), "events", String(receipt.receipt_id) + ".yaml");
    if (context.target?.path === destination) throw new Error("The transport target must not replace the authoritative receipt");
    await mkdir(dirname(destination), { recursive: true });
    publicationAttempted = true;
    receiptWritten = await publishImmutableFile(destination, Bun.YAML.stringify(receipt));
    if (!receiptWritten) throw new Error("The receipt already exists. Inspect it; do not repeat the phase. Use delivery recovery to resend an existing result.");
    console.log(await deliverResult(receipt, context));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not write the phase result");
    if (publicationAttempted && receipt) {
      console.error(receiptWritten
        ? "The authoritative receipt was written but delivery failed. Recovery JSON follows on stdout. Do not repeat the phase."
        : "Receipt publication is unconfirmed. Prepared receipt JSON follows on stdout. Inspect the existing event before retrying; this JSON is not proof of publication.");
      console.log(JSON.stringify(receipt, null, 2));
    }
    process.exitCode = 1;
  }
});
app.use(helpPlugin()).execute();

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("The receipt must be an object");
  return value as Record<string, unknown>;
}

async function gitCommonDirectory(repository: string): Promise<string> {
  const result = Bun.spawnSync(["git", "-C", repository, "rev-parse", "--path-format=absolute", "--git-common-dir"], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error("A receipt repository identity is unavailable");
  return realpath(new TextDecoder().decode(result.stdout).trim());
}

function validateReceipt(receipt: Record<string, unknown>): void {
  if (receipt.schema !== "worktree-receipt/v1" || receipt.event !== "phase-result") throw new Error("Expected a worktree-receipt/v1 phase-result");
  for (const key of ["receipt_id", "workflow_id", "phase", "parent_receipt", "repository", "worktree", "source_branch", "base_branch", "source_commit", "source_tree", "created_at", "muxer", "workspace_path", "agent", "session_id", "ticket_ref"]) {
    if (typeof receipt[key] !== "string" || !(receipt[key] as string).trim()) throw new Error("The receipt requires a non-empty " + key);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(String(receipt.receipt_id))) throw new Error("The receipt ID must be a safe event filename");
  if (!Number.isInteger(receipt.attempt) || Number(receipt.attempt) < 1) throw new Error("The receipt attempt must be a positive integer");
  if (!["completed", "failed", "blocked"].includes(String(receipt.status))) throw new Error("The child result status must be completed, failed or blocked");
  if (typeof receipt.pane_id !== "string" && typeof receipt.pane_id !== "number") throw new Error("The child result must identify its pane");
  const ticket = object(receipt.ticket);
  for (const key of ["backend", "id", "ref"]) if (typeof ticket[key] !== "string" || !String(ticket[key]).trim()) throw new Error("The receipt ticket requires " + key);
  if (ticket.ref !== receipt.ticket_ref) throw new Error("The ticket reference fields disagree");
  const workflow = object(receipt.workflow);
  for (const key of ["store", "root", "ref"]) if (typeof workflow[key] !== "string" || !String(workflow[key]).trim()) throw new Error("The workflow requires " + key);
  for (const key of ["repository", "worktree", "workspace_path"]) if (!isAbsolute(String(receipt[key]))) throw new Error(key + " must be absolute");
  for (const key of ["inputs", "outputs"]) {
    if (!Array.isArray(receipt[key])) throw new Error("The receipt requires an " + key + " array");
    for (const entry of receipt[key] as unknown[]) {
      const reference = object(entry);
      if (typeof reference.kind !== "string" || typeof reference.ref !== "string" || !reference.ref.trim()) throw new Error("Receipt references require kind and ref");
    }
  }
  if (receipt.phase === "review" && (receipt.status === "completed" || receipt.verdict !== undefined) && !["SUCCESS", "FAILURE"].includes(String(receipt.verdict))) throw new Error("A completed review requires a SUCCESS or FAILURE verdict; an explicit verdict must also be valid");
}
