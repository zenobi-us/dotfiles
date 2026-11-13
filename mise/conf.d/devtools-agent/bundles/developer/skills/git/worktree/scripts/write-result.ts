#!/usr/bin/env -S mise x -- bun --install=fallback
// Publishes the authoritative child receipt and its transport result in one operation.
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { mkdir, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deliverResult, loadDeliveryContext, publishImmutableFile } from "../../../../../agent-core/skills/result-delivery/scripts/delivery.ts";
import { validateReceiptContract } from "./receipt-contract";
import { receiptParentIssues } from "./receipt-diagnostics";
import { verifyIntegration } from "./integration";

const sharedContextCli = fileURLToPath(new URL("../../../../../agent-core/skills/shared-context/scripts/shared-context/cli.ts", import.meta.url));
const app = new Crust("write-worktree-result").meta({ description: "Write one immutable worktree phase-result receipt and deliver the same object to its caller." }).flags({
  repository: { type: "string", description: "Absolute repository path used by shared-context.", required: true },
  input: { type: "string", description: "JSON receipt file. Read stdin when omitted." },
  "delivery-context": { type: "string", description: "Absolute result-delivery context file; otherwise use RESULT_DELIVERY_CONTEXT." },
  format: { type: "string", description: "human or json for an unbound caller. Required artifact handoffs take precedence." },
  "parent-event": { type: "boolean", description: "Write a parent lifecycle or finish event without filling the child result handoff." },
}).run(async ({ flags }) => {
  let receipt: Record<string, unknown> | undefined;
  let receiptWritten = false;
  let publicationAttempted = false;
  try {
    if (!isAbsolute(flags.repository)) throw new Error("--repository must be absolute");
    if (flags.format !== undefined && flags.format !== "human" && flags.format !== "json") throw new Error("--format must be human or json");
    let context = flags["parent-event"] ? undefined : await loadDeliveryContext(flags["delivery-context"]);
    if (context?.mode === "artifact-reference" && !["worktree-receipt/v1", "worktree-receipt/v2"].includes(context.target?.schema ?? "")) throw new Error("The handoff must expect a supported worktree-receipt schema");
    if (context && context.mode !== "artifact-reference" && flags.format) context = { ...context, mode: flags.format, audience: flags.format === "human" ? "human" : "machine" };
    const text = flags.input ? await Bun.file(flags.input).text() : await Bun.stdin.text();
    receipt = object(JSON.parse(text));
    receipt.created_at ??= new Date().toISOString();
    validateReceipt(receipt, Boolean(flags["parent-event"]));
    if (context?.mode === "artifact-reference" && context.target?.schema !== receipt.schema) throw new Error("Receipt schema must match the assigned result handoff");
    const resolution = Bun.spawnSync([sharedContextCli, "resolve", "workflow", "--id", String(receipt.workflow_id), "--json"], { cwd: flags.repository, stdout: "pipe", stderr: "pipe" });
    if (resolution.exitCode !== 0) throw new Error("Shared-context could not resolve the workflow. No receipt was written.");
    const target = object(JSON.parse(new TextDecoder().decode(resolution.stdout)));
    const workflow = object(receipt.workflow);
    if (!isAbsolute(String(target.path)) || target.store !== workflow.store || target.root !== workflow.root || target.ref !== workflow.ref) throw new Error("The receipt workflow does not match the resolved store, root and reference");
    const repositories = await Promise.all([flags.repository, String(receipt.repository), ...(!flags["parent-event"] ? [String(receipt.worktree)] : [])].map(gitCommonDirectory));
    if (repositories.some((directory) => directory !== repositories[0])) throw new Error("The caller, receipt and worktree must belong to the same Git repository");
    if (receipt.schema === "worktree-receipt/v2" && target.store === "repository") {
      const sourceRoot = await realpath(String(receipt.worktree)).catch(error => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT" && flags["parent-event"]) return undefined;
        throw error;
      });
      if (await realpath(String(target.root)) === sourceRoot) throw new Error("V2 repository workflow records require a separate context checkout so receipt publication cannot dirty reviewed source");
    }
    const source = Bun.spawnSync(["git", "-C", flags["parent-event"] ? flags.repository : String(receipt.worktree), "rev-parse", flags["parent-event"] ? `${receipt.source_commit}^{commit}` : "HEAD", flags["parent-event"] ? `${receipt.source_commit}^{tree}` : "HEAD^{tree}"], { stdout: "pipe", stderr: "pipe" });
    const identities = new TextDecoder().decode(source.stdout).trim().split("\n");
    if (source.exitCode !== 0 || identities[0] !== receipt.source_commit || identities[1] !== receipt.source_tree) throw new Error("The source commit or tree does not match the receipt");
    if (!flags["parent-event"] && receipt.schema === "worktree-receipt/v2") {
      const branch = Bun.spawnSync(["git", "-C", String(receipt.worktree), "symbolic-ref", "--short", "HEAD"], { stdout: "pipe", stderr: "pipe" });
      if (branch.exitCode !== 0 || new TextDecoder().decode(branch.stdout).trim() !== receipt.source_branch) throw new Error("The current source branch does not match the receipt");
    }
    if (receipt.schema === "worktree-receipt/v2" && receipt.phase === "finish" && receipt.merged_commit != null && receipt.status !== "FINISH_FAILED") {
      await verifyIntegration(flags.repository, { schema: "worktree-integration/v2", integration_method: receipt.integration_method as "merge" | "squash", reviewed_source_commit: String(receipt.reviewed_source_commit), reviewed_source_tree: String(receipt.reviewed_source_tree), base_branch: String(receipt.base_branch), base_before: String(receipt.base_before), expected_merge_tree: String(receipt.expected_merge_tree) }, String(receipt.merged_commit), async (command, args) => {
        const result = Bun.spawnSync([command, ...args], { stdout: "pipe", stderr: "pipe" });
        return { code: result.exitCode, stdout: new TextDecoder().decode(result.exitCode ? result.stderr : result.stdout) };
      });
    }
    const destination = join(String(target.path), "events", String(receipt.receipt_id) + ".yaml");
    if (context?.target?.path === destination) throw new Error("The transport target must not replace the authoritative receipt");
    if (receipt.schema === "worktree-receipt/v2") {
      let parent: Record<string, unknown> | undefined;
      if (receipt.parent_receipt != null) {
        if (typeof receipt.parent_receipt !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(receipt.parent_receipt)) throw new Error("Parent receipt must be an existing receipt ID");
        const yaml = Bun.file(join(String(target.path), "events", receipt.parent_receipt + ".yaml"));
        const json = Bun.file(join(String(target.path), "events", receipt.parent_receipt + ".json"));
        parent = await yaml.exists() ? object(Bun.YAML.parse(await yaml.text())) : await json.exists() ? object(await json.json()) : undefined;
        if (parent) validateReceiptContract(parent);
      }
      const issues = receiptParentIssues(receipt, parent).filter(issue => issue.severity === "error");
      if (issues.length) throw new Error(issues.map(issue => `[${issue.code}] ${issue.message}`).join("\n"));
    }
    await mkdir(dirname(destination), { recursive: true });
    publicationAttempted = true;
    receiptWritten = await publishImmutableFile(destination, Bun.YAML.stringify(receipt));
    if (!receiptWritten) throw new Error("The receipt already exists. Inspect it; do not repeat the phase. Use delivery recovery to resend an existing result.");
    console.log(context ? await deliverResult(receipt, context) : JSON.stringify(receipt, null, 2));
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

// The inspector orders receipts by created_at, so a typed or stale time reorders the workflow history.
const createdAtTolerance = 10 * 60_000;

function validateReceipt(receipt: Record<string, unknown>, parent: boolean): void {
  validateReceiptContract(receipt);
  if (!parent && receipt.event !== "phase-result") throw new Error("Expected a child phase-result");
  if (!parent && !["implementation", "review", "fix"].includes(String(receipt.phase))) throw new Error("A child phase-result phase must be implementation, review or fix; the parent records start and finish");
  const createdAt = Date.parse(String(receipt.created_at));
  if (Number.isNaN(createdAt) || Math.abs(createdAt - Date.now()) > createdAtTolerance) throw new Error("created_at must be the current UTC time; omit it and the writer records the time");
  if (parent && !["phase-start", "phase-complete", "phase-checkpoint", "operator-approval", "operator-decision-required", "phase-result"].includes(String(receipt.event))) throw new Error("Unsupported parent event");
  if (parent && receipt.event === "phase-result" && receipt.phase !== "finish") throw new Error("Only finish results run in the parent session");
  if (parent && receipt.verdict != null) throw new Error("Parent events cannot supply a review verdict");
  if (parent) {
    const states: Record<string, string[]> = {
      "phase-start": ["started"], "phase-complete": ["completed", "failed", "blocked", ...(receipt.phase === "finish" ? ["FINISHED", "FINISH_FAILED"] : [])],
      "phase-checkpoint": receipt.phase === "finish" ? ["FINISHING"] : ["started"],
      "operator-approval": ["approved"], "operator-decision-required": ["blocked"], "phase-result": ["FINISHED", "FINISH_FAILED"],
    };
    if (!states[String(receipt.event)]?.includes(String(receipt.status))) throw new Error("Parent event and status do not match");
  }
  for (const key of ["receipt_id", "workflow_id", "phase", "repository", "worktree", "source_branch", "base_branch", "source_commit", "source_tree", "created_at", "muxer", "workspace_path", "agent", "ticket_ref", ...(!parent ? ["parent_receipt", "session_id"] : [])]) {
    if (typeof receipt[key] !== "string" || !(receipt[key] as string).trim()) throw new Error("The receipt requires a non-empty " + key);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(String(receipt.receipt_id))) throw new Error("The receipt ID must be a safe event filename");
  const operator = parent && ["operator-approval", "operator-decision-required"].includes(String(receipt.event));
  if (!Number.isInteger(receipt.attempt) || Number(receipt.attempt) < (operator ? 0 : 1)) throw new Error("Invalid receipt attempt");
  if (!parent && !["completed", "failed", "blocked"].includes(String(receipt.status))) throw new Error("The child result status must be completed, failed or blocked");
  if (parent && !["started", "completed", "failed", "blocked", "approved", "FINISHING", "FINISHED", "FINISH_FAILED"].includes(String(receipt.status))) throw new Error("Unsupported parent status");
  if ((!parent || receipt.pane_id !== null) && typeof receipt.pane_id !== "string" && typeof receipt.pane_id !== "number") throw new Error("The result must identify its pane");
  if (parent && (typeof receipt.session_id !== "string" || !receipt.session_id.trim() || !Object.hasOwn(receipt, "parent_receipt"))) throw new Error("Parent events require session_id and parent_receipt (null for the first event)");
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(String(receipt.created_at)) || !Number.isFinite(Date.parse(String(receipt.created_at)))) throw new Error("Receipt timestamp must include a timezone");
  const ticket = object(receipt.ticket);
  for (const key of ["backend", "id", "ref"]) if (typeof ticket[key] !== "string" || !String(ticket[key]).trim()) throw new Error("The receipt ticket requires " + key);
  if (ticket.ref !== receipt.ticket_ref) throw new Error("The ticket reference fields disagree");
  const workflow = object(receipt.workflow);
  for (const key of ["store", "root", "ref"]) if (typeof workflow[key] !== "string" || !String(workflow[key]).trim()) throw new Error("The workflow requires " + key);
  for (const key of ["repository", "worktree", "workspace_path"]) if (!isAbsolute(String(receipt[key]))) throw new Error(key + " must be absolute");
  if (receipt.worktree !== receipt.workspace_path) throw new Error("worktree and workspace_path must identify the same workspace");
  for (const key of ["inputs", "outputs"]) {
    if (!Array.isArray(receipt[key])) throw new Error("The receipt requires an " + key + " array");
    for (const entry of receipt[key] as unknown[]) {
      const reference = object(entry);
      if (typeof reference.kind !== "string" || typeof reference.ref !== "string" || !reference.ref.trim()) throw new Error("Receipt references require kind and ref");
    }
  }
  if (!parent && receipt.phase === "review" && (receipt.status === "completed" || receipt.verdict !== undefined) && !["SUCCESS", "FAILURE"].includes(String(receipt.verdict))) throw new Error("A completed review requires a SUCCESS or FAILURE verdict; an explicit verdict must also be valid");
}
