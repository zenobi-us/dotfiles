#!/usr/bin/env -S mise x -- bun --install=fallback
// Publishes the authoritative child receipt and its transport result in one operation.
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { createHash } from "node:crypto";
import { mkdir, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { deliverResult, loadDeliveryContext, publishImmutableFile } from "../../../../../agent-core/skills/result-delivery/scripts/delivery.ts";
import { validateReceiptContract } from "./receipt-contract";
import { receiptParentIssues } from "./receipt-diagnostics";
import { verifyIntegration } from "./integration";
import { validateReceipt as validateEnvelope, validateSourceWorktree } from "./receipt-validation";
import { generateReceipt } from "./phase-context";
import { receiptIdentity, strictReceipt } from "./contract-identity";
import { readContextResolution } from "./context-resolution";
import { relocateRepository } from "./repository-relocation";

const sharedContextCli = fileURLToPath(new URL("../../../../../agent-core/skills/shared-context/scripts/shared-context/cli.ts", import.meta.url));
const app = new Crust("write-worktree-result").meta({ description: "Write one immutable worktree phase-result receipt and deliver the same object to its caller." }).flags({
  repository: { type: "string", description: "Absolute repository path used by shared-context.", required: true },
  input: { type: "string", description: "JSON receipt file. Read stdin when omitted." },
  "phase-context": { type: "string", description: "Validated worktree-phase-context/v2 JSON (retained v1 handoffs supported); input contains only outcome and evidence." },
  "repair-authorization": { type: "string", description: "Retained operator-approval event ID authorizing the SHA-256 of an exact v1 input file." },
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
    if (context?.mode === "artifact-reference" && !["worktree-receipt/v1", "worktree-receipt/v2", "worktree-receipt/v3"].includes(context.target?.schema ?? "")) throw new Error("The handoff must expect a supported worktree-receipt schema");
    if (context && context.mode !== "artifact-reference" && flags.format) context = { ...context, mode: flags.format, audience: flags.format === "human" ? "human" : "machine" };
    const text = flags.input ? await Bun.file(flags.input).text() : await Bun.stdin.text();
    const input = object(JSON.parse(text));
    const phaseContext = flags["phase-context"] ? object(await Bun.file(flags["phase-context"]).json()) : undefined;
    if (!phaseContext && input.schema !== "worktree-receipt/v1") throw new Error("New receipt publication requires --phase-context; full envelopes are retained v1 only");
    const workflowId = phaseContext?.workflow_id ?? input.workflow_id;
    if (typeof workflowId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(workflowId)) throw new Error("Phase workflow_id must be a safe identifier");
    const resolution = Bun.spawnSync([sharedContextCli, "resolve", "workflow", "--id", workflowId, "--json"], { cwd: flags.repository, stdout: "pipe", stderr: "pipe" });
    if (resolution.exitCode !== 0) throw new Error("Shared-context could not resolve the workflow. No receipt was written.");
    const target = { ...await readContextResolution(JSON.parse(new TextDecoder().decode(resolution.stdout))) };
    if (target.kind !== "workflow") throw new Error("Expected a workflow resolution.");
    let parent: Record<string, unknown> | undefined;
    const parentId = phaseContext?.parent_receipt ?? input.parent_receipt;
    if (parentId != null) {
      if (typeof parentId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(parentId)) throw new Error("Parent receipt must be an existing receipt ID");
      const yaml = Bun.file(join(String(target.path), "events", parentId + ".yaml"));
      const json = Bun.file(join(String(target.path), "events", parentId + ".json"));
      parent = await yaml.exists() ? object(Bun.YAML.parse(await yaml.text())) : await json.exists() ? object(await json.json()) : undefined;
    }
    if (parent && phaseContext?.event === "operator-approval" && input.status === "approved" && Array.isArray(input.history_supplements)) {
      const ref = `${target.ref}/events/${parentId}`;
      const supplement = input.history_supplements.find(value => value?.relocate_repository != null && [ref + ".yaml", ref + ".json"].includes(value.ref));
      if (supplement) {
        const bytes = await Bun.file(join(String(target.root), supplement.ref)).text();
        if (createHash("sha256").update(bytes).digest("hex") !== supplement.sha256
          || !Array.isArray(input.inputs) || !input.inputs.some(value => value?.ref === supplement.ref)) {
          throw new Error("Repository relocation requires the exact parent receipt checksum and input reference.");
        }
        parent = await relocateRepository(parent, supplement.relocate_repository, { ...input, event: phaseContext.event }, flags.repository, String(target.ref), async (command, args) => {
          const result = Bun.spawnSync([command, ...args], { stdout: "pipe", stderr: "pipe" });
          return { code: result.exitCode, stdout: new TextDecoder().decode(result.stdout) };
        });
      }
    }
    if (parent && object(parent.workflow).root !== target.root) {
      const inspected = Bun.spawnSync([fileURLToPath(new URL("./inspect.ts", import.meta.url)), String(parent.ticket_ref), "--json"], { cwd: flags.repository, stdout: "pipe", stderr: "pipe" });
      if (inspected.exitCode !== 0) throw new Error("Inspect the historical parent before continuing publication.");
      const history = object(object(JSON.parse(new TextDecoder().decode(inspected.stdout))).workflow);
      if (object(history.inspection).historyValid !== true) throw new Error("Historical parent requires valid append-only repair before publication.");
      const effective = Array.isArray(history.receipts) ? history.receipts.find(value => value.id === parentId) : undefined;
      if (!effective?.fields) throw new Error("The validated historical parent is unavailable.");
      parent = object(effective.fields);
    }
    receipt = phaseContext ? await generateReceipt(phaseContext, input, flags.repository, target, parent, async (command, args) => {
      const result = Bun.spawnSync([command, ...args], { stdout: "pipe", stderr: "pipe" });
      return { code: result.exitCode, stdout: new TextDecoder().decode(result.stdout) };
    }, context?.mode === "artifact-reference" ? { runId: context.runId, operationId: context.operationId } : undefined) : input;
    receipt.created_at ??= new Date().toISOString();
    validateReceipt(receipt, Boolean(flags["parent-event"]));
    if (context?.mode === "artifact-reference" && context.target?.schema !== receiptIdentity(receipt)) throw new Error("Receipt schema must match the assigned result handoff");
    if (!phaseContext) await validateSourceWorktree(receipt, async (command, args) => {
      const result = Bun.spawnSync([command, ...args], { stdout: "pipe", stderr: "pipe" });
      return { code: result.exitCode, stdout: new TextDecoder().decode(result.stdout) };
    }, Boolean(flags["parent-event"]));
    const workflow = object(receipt.workflow);
    if (!isAbsolute(String(target.path)) || target.store !== workflow.store || target.root !== workflow.root || target.ref !== workflow.ref) throw new Error("The receipt workflow does not match the resolved store, root and reference");
    const repositories = await Promise.all([flags.repository, String(receipt.repository), ...(!flags["parent-event"] ? [String(receipt.worktree)] : [])].map(gitCommonDirectory));
    if (repositories.some((directory) => directory !== repositories[0])) throw new Error("The caller, receipt and worktree must belong to the same Git repository");
    if (strictReceipt(receipt) && target.store === "repository") {
      const sourceRoot = phaseContext ? String(receipt.worktree) : await realpath(String(receipt.worktree)).catch(error => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT" && flags["parent-event"]) return undefined;
        throw error;
      });
      if (await realpath(String(target.root)) === sourceRoot) throw new Error("V2 repository workflow records require a separate context checkout so receipt publication cannot dirty reviewed source");
    }
    if (!phaseContext) {
      const source = Bun.spawnSync(["git", "-C", flags["parent-event"] ? flags.repository : String(receipt.worktree), "rev-parse", flags["parent-event"] ? `${receipt.source_commit}^{commit}` : "HEAD", flags["parent-event"] ? `${receipt.source_commit}^{tree}` : "HEAD^{tree}"], { stdout: "pipe", stderr: "pipe" });
      const identities = new TextDecoder().decode(source.stdout).trim().split("\n");
      if (source.exitCode !== 0 || identities[0] !== receipt.source_commit || identities[1] !== receipt.source_tree) throw new Error("The source commit or tree does not match the receipt");
      if (!flags["parent-event"]) {
        const branch = Bun.spawnSync(["git", "-C", String(receipt.worktree), "symbolic-ref", "--short", "HEAD"], { stdout: "pipe", stderr: "pipe" });
        if (branch.exitCode !== 0 || new TextDecoder().decode(branch.stdout).trim() !== receipt.source_branch) throw new Error("The current source branch does not match the receipt");
      }
    }
    if (!phaseContext) {
      validateEnvelope(input);
      if (flags["repair-authorization"]) {
        const approvalId = flags["repair-authorization"];
        if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(approvalId)) throw new Error("Repair authorization must name a retained event ID");
        const approval = object(Bun.YAML.parse(await Bun.file(join(String(target.path), "events", approvalId + ".yaml")).text()));
        validateEnvelope(approval);
        const repair = object(approval.envelope_repair);
        if (!parent || approval.receipt_id !== approvalId || approval.event !== "operator-approval" || approval.status !== "approved" || approval.workflow_id !== workflowId
          || approval.ticket_ref !== input.ticket_ref || approval.repository !== input.repository
          || !sameFields(object(approval.ticket), object(input.ticket), ["backend", "id", "ref"])
          || !sameFields(object(approval.workflow), object(input.workflow), ["store", "root", "ref"])
          || repair.receipt_id !== input.receipt_id || repair.sha256 !== createHash("sha256").update(text).digest("hex")) {
          throw new Error("Retained approval does not authorize this exact v1 envelope repair");
        }
      } else {
        if (!parent || parent.schema !== "worktree-receipt/v1" || parent.event !== "phase-start"
          || input.event !== "phase-result" || parent.phase !== (input.phase === "implementation" ? "start" : input.phase)) {
          throw new Error("New receipt publication requires --phase-context; a full v1 envelope requires retained phase identity or checksum-bound repair approval");
        }
        validateEnvelope(parent);
        const keys = ["workflow_id", "ticket_ref", "repository", "worktree", "workspace_path", "source_branch", "base_branch", "source_commit", "source_tree", "attempt", "muxer", "agent", "session_id", "pane_id"];
        if (!sameFields(input, parent, keys) || !sameFields(object(input.ticket), object(parent.ticket), ["backend", "id", "ref"])
          || !sameFields(object(input.workflow), object(parent.workflow), ["store", "root", "ref"])) {
          throw new Error("Full v1 envelope differs from retained phase identity; use generated phase context and the assigned handoff");
        }
      }
    } else if (flags["repair-authorization"]) throw new Error("Repair authorization applies only to retained full v1 envelopes");
    if (strictReceipt(receipt) && receipt.phase === "finish" && receipt.merged_commit != null && receipt.status !== "FINISH_FAILED") {
      await verifyIntegration(flags.repository, { schema: "worktree-integration/v2", integration_method: receipt.integration_method as "merge" | "squash", reviewed_source_commit: String(receipt.reviewed_source_commit), reviewed_source_tree: String(receipt.reviewed_source_tree), base_branch: String(receipt.base_branch), base_before: String(receipt.base_before), expected_merge_tree: String(receipt.expected_merge_tree) }, String(receipt.merged_commit), async (command, args) => {
        const result = Bun.spawnSync([command, ...args], { stdout: "pipe", stderr: "pipe" });
        return { code: result.exitCode, stdout: new TextDecoder().decode(result.exitCode ? result.stderr : result.stdout) };
      });
    }
    const destination = join(String(target.path), "events", String(receipt.receipt_id) + ".yaml");
    if (context?.target?.path === destination) throw new Error("The transport target must not replace the authoritative receipt");
    if (strictReceipt(receipt)) {
      if (parent) validateReceiptContract(parent);
      const issues = receiptParentIssues(receipt, parent).filter(issue => issue.severity === "error");
      if (issues.length) throw new Error(issues.map(issue => `[${issue.code}] ${issue.message}`).join("\n"));
    }
    await mkdir(dirname(destination), { recursive: true });
    // Store roots can use system aliases such as /home; workflow descendants still require no-follow traversal.
    const storageDestination = join(await realpath(String(target.root)), relative(String(target.root), destination));
    publicationAttempted = true;
    receiptWritten = await publishImmutableFile(storageDestination, Bun.YAML.stringify(receipt));
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

function sameFields(left: Record<string, unknown>, right: Record<string, unknown>, keys: string[]): boolean {
  return keys.every(key => left[key] === right[key]);
}

async function gitCommonDirectory(repository: string): Promise<string> {
  const result = Bun.spawnSync(["git", "-C", repository, "rev-parse", "--path-format=absolute", "--git-common-dir"], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error("A receipt repository identity is unavailable");
  return realpath(new TextDecoder().decode(result.stdout).trim());
}

// The inspector orders receipts by created_at, so a typed or stale time reorders the workflow history.
const createdAtTolerance = 10 * 60_000;

function validateReceipt(receipt: Record<string, unknown>, parent: boolean): void {
  validateEnvelope(receipt);
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
  if (!parent) {
    for (const key of ["parent_receipt", "session_id"]) if (typeof receipt[key] !== "string" || !String(receipt[key]).trim()) throw new Error("The child result requires " + key);
  }
  if (!parent && !["completed", "failed", "blocked"].includes(String(receipt.status))) throw new Error("The child result status must be completed, failed or blocked");
  if ((!parent || receipt.pane_id !== null) && typeof receipt.pane_id !== "string" && typeof receipt.pane_id !== "number") throw new Error("The result must identify its pane");
  if (parent && (typeof receipt.session_id !== "string" || !receipt.session_id.trim() || !Object.hasOwn(receipt, "parent_receipt"))) throw new Error("Parent events require session_id and parent_receipt (null for the first event)");
  if (!parent && receipt.phase === "review" && (receipt.status === "completed" || receipt.verdict !== undefined) && !["SUCCESS", "FAILURE"].includes(String(receipt.verdict))) throw new Error("A completed review requires a SUCCESS or FAILURE verdict; an explicit verdict must also be valid");
}
