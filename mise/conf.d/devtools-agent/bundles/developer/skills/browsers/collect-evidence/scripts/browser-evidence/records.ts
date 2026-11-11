// Common, sealed evidence records. Driver originals stay under native/ unchanged.
// finalizeRun returns ValidatedRun { directory, run, plan, cases, records };
// validateRun returns the same view and throws on invalid records or changed bytes.
// Publication uses GNU mv's Linux renameat2 NOREPLACE path, not a racy exists/rename.
import { createHash } from "node:crypto";
import { access, chmod, copyFile, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { inflateSync } from "node:zlib";
import type { Evidence, Plan, Step, Test } from "./plan.ts";
import { CliError } from "./sh.ts";
import { checkTuiPlan } from "./tui-plan.ts";

export const SCHEMA = "collect-evidence/v1" as const;
type Kind = "run" | "plan" | "case" | "asset" | "event" | "error";
interface RecordHeader { schema: typeof SCHEMA; kind: Kind }
export type AssertionResult = "passed" | "failed" | "not-run" | "not-applicable";
export type CaptureStatus = "captured" | "failed" | "not-requested";
type CaptureEvidence = Evidence & {
  capturedAt?: string;
  viewport?: { width: number; height: number; deviceScaleFactor: number };
  captureSequence?: number;
  captureStatus?: CaptureStatus;
};
export interface ImageAssetRecord extends RecordHeader {
  kind: "asset"; id: string; caseId: string; stepId: string; path: string;
  captureSequence: number; sha256: string; mediaType: "image/png";
  width: number; height: number; capturedAt: string | null;
  viewport: CaptureEvidence["viewport"] | null;
  surface: "web" | "tui"; driver: Plan["driver"]; driverVersion: string; captureMethod: string; url: string;
  terminal?: Evidence["terminal"];
}
export interface VideoAssetRecord extends Omit<ImageAssetRecord, "mediaType"> {
  mediaType: "video/webm"; scope: "case"; durationMs: number | null;
  sourcePath: string;
}
export type AssetRecord = ImageAssetRecord | VideoAssetRecord;
interface VideoCaptureMetadata {
  schema: typeof SCHEMA; kind: "asset"; capturedAt?: string;
  viewport?: CaptureEvidence["viewport"]; durationMs?: number; toolVersion?: string;
}
export interface ErrorRecord extends RecordHeader {
  kind: "error"; id: string; caseId: string; stepId: string;
  category: "assertion" | "capture" | "blocked" | "operation"; message: string;
}
export interface EventRecord extends RecordHeader {
  kind: "event"; id: string; caseId: string; stepId: string; order: number;
  assertionResult: AssertionResult; captureStatus: CaptureStatus; assetId: string | null;
  evidence: CaptureEvidence;
}
export interface StepRecord {
  id: string; order: number; purpose: string; actions: Step;
  expected: unknown; observed: string[]; assertionResult: AssertionResult;
}
export interface CaseRecord extends RecordHeader {
  kind: "case"; id: string; runId: string; order: number; purpose: string;
  preconditions: NonNullable<Plan["preconditions"]>; steps: StepRecord[];
  expected: { pass: string; fail: string }; events: string; assets: AssetRecord[];
  errors: ErrorRecord[]; limits: string[]; sideEffects: "not-recorded" | string[];
}
export interface RunRecord extends RecordHeader {
  kind: "run"; id: string; status: "sealed"; startedAt: string; finishedAt: string;
  surface: "web" | "tui"; driver: Plan["driver"]; driverVersion: string;
  plan: "plan.json"; cases: Array<{ id: string; path: string }>;
  files: Array<{ path: string; sha256: string }>;
}
export interface ValidatedRun { directory: string; run: RunRecord; plan: Plan; cases: CaseRecord[]; records: Evidence[] }
export interface FinalizeRunOptions {
  staging: string; destination: string; plan: Plan; records: Evidence[];
  startedAt: string; finishedAt: string; driverVersion: string; runId: string;
}

/** Build privately, validate, seal, then publish without replacing any destination. */
export async function finalizeRun(options: FinalizeRunOptions): Promise<ValidatedRun> {
  checkPlan(options.plan);
  checkId(options.runId);
  checkTime(options.startedAt); checkTime(options.finishedAt);
  requireValue(Date.parse(options.finishedAt) >= Date.parse(options.startedAt), "Run finishes before it starts");
  requireValue(typeof options.driverVersion === "string" && options.driverVersion.length > 0, "Driver version is required");
  await rejectSymlinkComponents(options.staging);
  const staging = await realpath(options.staging);
  const destination = resolve(options.destination);
  requireValue(!within(staging, destination) && !within(destination, staging), "Staging and destination must be separate trees");
  // Check every incoming record before creating the temporary publication tree.
  const grouped = groupEvidence(options.plan, options.records);
  await safeFile(staging, "plan.ts");
  const videos = new Map<string, VideoAssetRecord | null>();
  for (const test of options.plan.tests) {
    videos.set(test.id, await readVideoAsset(staging, "", options.plan, test, options.driverVersion));
  }
  try {
    await access("/usr/bin/mv", constants.X_OK);
  } catch {
    throw new CliError("Finalization requires GNU /usr/bin/mv with --no-copy and --update=none-fail", 3);
  }
  await rejectSymlinkComponents(dirname(destination), true);
  await mkdir(dirname(destination), { recursive: true });
  await rejectSymlinkComponents(dirname(destination));
  const temporary = await mkdtemp(join(dirname(destination), ".incomplete-"));
  try {
    await copyTree(staging, join(temporary, "native"));
    await copyFile(await safeFile(staging, "plan.ts"), join(temporary, "plan.ts"));
    await jsonFile(join(temporary, "plan.json"), { schema: SCHEMA, kind: "plan", data: options.plan });
    const cases: CaseRecord[] = [];
    for (const [index, test] of options.plan.tests.entries()) {
      const directory = join(temporary, "cases", test.id);
      await mkdir(join(directory, "media"), { recursive: true });
      const events: EventRecord[] = [];
      const assets: AssetRecord[] = [];
      const sequences = new Map<string, number>();
      for (const evidence of grouped.get(test.id) ?? []) {
        const position = test.steps.findIndex((_, i) => stepId(test.id, i) === evidence.step);
        const step = test.steps[position]!;
        let asset: AssetRecord | undefined;
        if (evidence.screenshot) {
          const sequence = evidence.captureSequence ?? (sequences.get(evidence.step) ?? 0) + 1;
          requireValue(sequence > (sequences.get(evidence.step) ?? 0), "Capture sequence must increase within a step");
          sequences.set(evidence.step, sequence);
          const source = await safeFile(staging, `report/${safeRelative(evidence.screenshot)}`);
          const bytes = await readFile(source);
          const dimensions = pngDimensions(bytes);
          const scene = basename(evidence.screenshot, ".png").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-|-$/g, "") || "scene";
          const name = `step-${pad(position + 1)}-${scene}--capture-${pad(sequence)}.png`;
          const path = `cases/${test.id}/media/${name}`;
          await writeFile(join(temporary, path), bytes, { flag: "wx" });
          asset = {
            schema: SCHEMA, kind: "asset", id: `${evidence.step}.capture-${pad(sequence)}`,
            caseId: test.id, stepId: evidence.step, path, captureSequence: sequence,
            sha256: hash(bytes), mediaType: "image/png", ...dimensions,
            capturedAt: evidence.capturedAt ?? null, viewport: evidence.viewport ?? null,
            surface: options.plan.driver === "tui" ? "tui" : "web", driver: options.plan.driver, driverVersion: evidence.toolVersion ?? options.driverVersion,
            captureMethod: options.plan.driver === "tui" ? "grim-native" : `${options.plan.driver}-screenshot`, url: evidence.url,
            ...(evidence.terminal ? { terminal: evidence.terminal } : {}),
          };
          assets.push(asset);
        }
        events.push({
          schema: SCHEMA, kind: "event", id: `${test.id}.event-${pad(events.length + 1)}`,
          caseId: test.id, stepId: evidence.step, order: events.length + 1,
          assertionResult: assertion(step, evidence), captureStatus: capture(step, evidence),
          assetId: asset?.id ?? null, evidence,
        });
      }
      const video = videos.get(test.id);
      if (video) {
        await copyFile(await safeFile(staging, video.sourcePath.replace(/^native\//, "")), join(temporary, video.path));
        assets.push(video);
      }
      const record = buildCase(options.runId, options.plan, test, index, events, assets);
      cases.push(record);
      await jsonFile(join(directory, "case.json"), record);
      await writeFile(join(directory, "events.jsonl"), events.map((event) => JSON.stringify(event)).join("\n") + (events.length ? "\n" : ""), { flag: "wx" });
      await markdown(join(directory, "index.md"), "case", `# Case ${test.id}\n\n${test.claim}\n\n${record.steps.map((step) => `## Step ${step.id}\n\n${step.purpose}\n\nExpected: ${JSON.stringify(step.expected)}\n\nObserved: ${step.observed.join("; ") || "Not executed"}\n\nAssertion: ${step.assertionResult}\n`).join("\n")}\n${assets.map((asset) => asset.mediaType === "video/webm" ? `[Case recording](media/${basename(asset.path)})` : `![Capture ${asset.captureSequence} for step ${asset.stepId}](media/${basename(asset.path)})`).join("\n\n")}\n\nLimits: ${record.limits.join("; ")}\n`);
    }
    await markdown(join(temporary, "index.md"), "run", `# Evidence ${options.runId}\n\nDriver: ${options.plan.driver} (${options.driverVersion})\n\n${cases.map((record) => `- [Case ${record.id}](cases/${record.id}/index.md): ${record.purpose}`).join("\n")}\n\nAssertions and captures have separate results. Unknown capture times remain unknown.\n`);
    const run: RunRecord = {
      schema: SCHEMA, kind: "run", id: options.runId, status: "sealed",
      startedAt: options.startedAt, finishedAt: options.finishedAt, surface: options.plan.driver === "tui" ? "tui" : "web",
      driver: options.plan.driver, driverVersion: options.driverVersion, plan: "plan.json",
      cases: cases.map((record) => ({ id: record.id, path: `cases/${record.id}/case.json` })),
      files: await inventory(temporary),
    };
    await jsonFile(join(temporary, "run.json"), run);
    const validated = await inspectRun(temporary);
    await sealTree(temporary);
    // GNU mv uses RENAME_NOREPLACE for this same-filesystem, exclusive move.
    await command("/usr/bin/mv", ["--no-copy", "--update=none-fail", "-T", "--", temporary, destination]);
    return { ...validated, directory: destination };
  } catch (error) {
    await unsealTree(temporary).catch(() => { });
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}

/** Read without executing plan.ts. Recheck all references, hashes and PNG bytes. */
export async function validateRun(directory: string): Promise<ValidatedRun> {
  try {
    const root = resolve(directory);
    requireValue(!basename(root).startsWith(".incomplete-"), "Run finalization is incomplete");
    await rejectSymlinkComponents(root);
    const result = await inspectRun(root);
    await checkSealed(root);
    return result;
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError(`Invalid evidence run: ${(error as Error).message}`, 2);
  }
}

async function inspectRun(root: string): Promise<ValidatedRun> {
  const run = await readJson<RunRecord>(root, "run.json", "run");
  checkId(run.id); checkTime(run.startedAt); checkTime(run.finishedAt);
  requireValue(Date.parse(run.finishedAt) >= Date.parse(run.startedAt), "Run finishes before it starts");
  requireValue(run.status === "sealed" && ["web", "tui"].includes(run.surface) && run.plan === "plan.json", "Invalid run state");
  requireValue(typeof run.driverVersion === "string" && run.driverVersion.length > 0, "Missing driver provenance");
  const envelope = await readJson<RecordHeader & { data: Plan }>(root, "plan.json", "plan");
  const plan = envelope.data;
  checkPlan(plan);
  requireValue(run.driver === plan.driver, "Run driver differs from plan");
  requireValue(run.surface === (plan.driver === "tui" ? "tui" : "web"), "Run surface differs from plan");
  await safeFile(root, "plan.ts");
  const actualFiles = (await inventory(root)).filter((file) => file.path !== "run.json");
  requireValue(same(actualFiles, run.files), "Run files are missing, changed or unregistered");
  requireValue(same(run.cases, plan.tests.map((test) => ({ id: test.id, path: `cases/${test.id}/case.json` }))), "Invalid run case references or order");
  const cases: CaseRecord[] = [];
  const records: Evidence[] = [];
  for (const [index, test] of plan.tests.entries()) {
    const record = await readJson<CaseRecord>(root, `cases/${test.id}/case.json`, "case");
    requireValue((await lstat(join(root, "cases", test.id, "media"))).isDirectory(), "Case media directory is missing");
    const eventPath = `cases/${test.id}/events.jsonl`;
    const text = await readFile(await safeFile(root, eventPath), "utf8");
    const events: EventRecord[] = text.trim() ? text.trim().split("\n").map((line) => JSON.parse(line)) : [];
    groupEvidence({ ...plan, tests: [test] }, events.map((event) => event.evidence));
    records.push(...events.map((event) => event.evidence));
    const assets = record.assets;
    requireValue(Array.isArray(assets), "Case assets must be an array");
    const usedAssets = new Set<string>();
    const sequences = new Map<string, number>();
    for (const [eventIndex, event] of events.entries()) {
      header(event, "event");
      const position = test.steps.findIndex((_, i) => stepId(test.id, i) === event.stepId);
      const step = test.steps[position]!;
      requireValue(event.id === `${test.id}.event-${pad(eventIndex + 1)}` && event.order === eventIndex + 1 && event.caseId === test.id && event.stepId === event.evidence.step, "Invalid event identity, reference or order");
      requireValue(event.assertionResult === assertion(step, event.evidence) && event.captureStatus === capture(step, event.evidence), "Event assertion or capture contradicts evidence");
      if (!event.evidence.screenshot) {
        requireValue(event.assetId === null, "Event without capture references media");
        continue;
      }
      const asset = assets.find((item) => item.id === event.assetId);
      requireValue(asset && !usedAssets.has(asset.id), "Missing or reused event asset");
      usedAssets.add(asset.id);
      header(asset, "asset");
      const sequence = event.evidence.captureSequence ?? (sequences.get(event.stepId) ?? 0) + 1;
      requireValue(sequence > (sequences.get(event.stepId) ?? 0), "Invalid capture order");
      sequences.set(event.stepId, sequence);
      requireValue(asset.id === `${event.stepId}.capture-${pad(sequence)}` && asset.captureSequence === sequence && asset.caseId === test.id && asset.stepId === event.stepId, "Invalid asset identity or reference");
      const scene = basename(event.evidence.screenshot, ".png").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-|-$/g, "") || "scene";
      requireValue(asset.path === `cases/${test.id}/media/step-${pad(position + 1)}-${scene}--capture-${pad(sequence)}.png`, "Invalid media path");
      const bytes = await readFile(await safeFile(root, asset.path));
      const dimensions = pngDimensions(bytes);
      requireValue(asset.sha256 === hash(bytes) && asset.width === dimensions.width && asset.height === dimensions.height && asset.mediaType === "image/png", "Asset hash, dimensions or media type differ from PNG bytes");
      const original = await readFile(await safeFile(root, `native/report/${safeRelative(event.evidence.screenshot)}`));
      requireValue(bytes.equals(original), "Asset differs from its preserved native screenshot");
      requireValue(asset.capturedAt === (event.evidence.capturedAt ?? null) && same(asset.viewport, event.evidence.viewport ?? null), "Asset capture metadata differs from evidence");
      requireValue(asset.surface === run.surface && asset.driver === run.driver && asset.driverVersion === (event.evidence.toolVersion ?? run.driverVersion) && asset.captureMethod === (run.driver === "tui" ? "grim-native" : `${run.driver}-screenshot`) && asset.url === event.evidence.url, "Invalid asset provenance");
      if (run.driver === "tui") {
        requireValue(same(asset.terminal, event.evidence.terminal) && asset.terminal?.cleanup === "released" && asset.terminal.session && asset.terminal.socket && asset.terminal.pane && asset.terminal.tty && asset.terminal.display && asset.terminal.runtime && Number.isInteger(asset.terminal.cagePid) && Number.isInteger(asset.terminal.footPid), "Missing native terminal identity or owned cleanup");
      }
    }
    const video = await readVideoAsset(root, "native/", plan, test, run.driverVersion);
    if (video) {
      const registered = assets.find((asset) => asset.id === video.id);
      requireValue(same(registered, video), "Video asset metadata differs from native recording");
      const bytes = await readFile(await safeFile(root, video.path));
      requireValue(hash(bytes) === video.sha256, "Video asset hash differs from native recording");
      usedAssets.add(video.id);
    }
    requireValue(usedAssets.size === assets.length, "Unreferenced or duplicate case assets");
    requireValue(same(record, buildCase(run.id, plan, test, index, events, assets)), "Case steps, assertions, errors or references differ from events and plan");
    if (events.some(event => event.evidence.verdict === "PASS")) {
      requireValue(assets.some(asset => asset.mediaType === "image/png") &&
        record.steps.some(step => step.assertionResult === "passed") &&
        record.steps.every(step => step.observed.length > 0 &&
          (step.actions.do !== "expect" || step.assertionResult === "passed")) &&
        !record.errors.length && !events.some(event => ["PARTIAL", "BLOCKED", "FAIL"].includes(event.evidence.verdict)),
        "A PASS requires completed steps, passing assertions and actual image evidence without failures");
    }
    cases.push(record);
  }
  return { directory: root, run, plan, cases, records };
}

function buildCase(runId: string, plan: Plan, test: Test, index: number, events: EventRecord[], assets: AssetRecord[]): CaseRecord {
  return {
    schema: SCHEMA, kind: "case", id: test.id, runId, order: index + 1, purpose: test.claim,
    preconditions: (test.requires ?? []).map((id) => plan.preconditions!.find((item) => item.id === id)!),
    expected: { pass: test.pass, fail: test.fail },
    steps: test.steps.map((step, position): StepRecord => {
      const id = stepId(test.id, position);
      const mine = events.filter((event) => event.stepId === id);
      const assertions = mine.map((event) => event.assertionResult);
      return {
        id, order: position + 1, purpose: step.do === "human" ? step.needs : step.says ?? step.do,
        actions: step, expected: step.do === "expect" ? { text: step.text ?? null, visible: step.visible ?? null, url: step.url ?? null } : null,
        observed: mine.map((event) => event.evidence.observed),
        assertionResult: step.do !== "expect" ? "not-applicable" : assertions.includes("failed") ? "failed" : assertions.includes("passed") ? "passed" : "not-run",
      };
    }),
    events: `cases/${test.id}/events.jsonl`, assets,
    errors: events.filter((event) => event.evidence.verdict === "FAIL" || event.evidence.verdict === "BLOCKED" || event.captureStatus === "failed").map((event, i): ErrorRecord => ({
      schema: SCHEMA, kind: "error", id: `${test.id}.error-${pad(i + 1)}`, caseId: test.id, stepId: event.stepId,
      category: event.evidence.verdict === "BLOCKED" ? "blocked" : event.assertionResult === "failed" ? "assertion" : event.captureStatus === "failed" ? "capture" : "operation",
      message: event.evidence.observed || event.evidence.note || "Driver reported failure",
    })),
    limits: ["Capture time and viewport are unknown when the driver did not record them.", "Only executed expect evidence with assertionPassed=true can establish a passing assertion.", ...(plan.driver === "surf" ? ["Video is unavailable with the Surf driver. Image captures remain valid."] : plan.video && !assets.some((asset) => asset.mediaType === "video/webm") ? ["Video was requested but the driver produced no recording."] : []), ...assets.filter((asset) => asset.mediaType === "video/webm" && asset.durationMs === null).map(() => "Video duration is unknown: neither native container nor driver metadata supplied timing.")],
    ...(plan.driver === "tui" ? { limits: ["Native video is unavailable.", "OCR and stable frame hashes check visible content, not usability. Inspect every original PNG.", "The private headless display does not reproduce a borrowed desktop terminal.", "Font metrics and output dimensions depend on installed foot/wlroots/fonts; explicit image expectations must match."] } : {}),
    sideEffects: plan.driver === "tui" ? ["The approved command ran in a private tmux pane. Inspect its application-specific side effects separately.", "Collector-owned resources were released before sealing; borrowed terminals were not attached or closed."] : "not-recorded",
  };
}

function assertion(step: Step, evidence: CaptureEvidence): AssertionResult {
  if (step.do !== "expect") return "not-applicable";
  if (evidence.verdict === "BLOCKED" || evidence.verdict === "PARTIAL" || evidence.target === "precondition" || evidence.action !== "assert") return "not-run";
  if (evidence.assertionPassed === true) return "passed";
  if (evidence.assertionPassed === false || evidence.verdict === "FAIL") return "failed";
  return "not-run";
}
function capture(_step: Step, evidence: CaptureEvidence): CaptureStatus {
  if (evidence.screenshot) return "captured";
  return evidence.captureStatus === "failed" ? "failed" : "not-requested";
}
function groupEvidence(plan: Plan, records: Evidence[]): Map<string, CaptureEvidence[]> {
  requireValue(Array.isArray(records), "Evidence must be an array");
  const grouped = new Map<string, CaptureEvidence[]>();
  const positions = new Map(plan.tests.flatMap((test, t) => test.steps.map((_, i) => [stepId(test.id, i), t * 1000000 + i] as const)));
  let previous = -1;
  for (const record of records as CaptureEvidence[]) {
    requireValue(record && typeof record === "object", "Evidence must be a record");
    if ("schema" in record) requireValue(record.schema === SCHEMA, "Unsupported explicit evidence schema");
    if ("kind" in record) requireValue(record.kind === "event", "Invalid explicit evidence kind");
    for (const key of ["test", "step", "action", "target", "resolved", "url", "screenshot", "observed", "verdict", "note"] as const) requireValue(typeof record[key] === "string", "Evidence fields must be strings");
    requireValue(["", "PASS", "FAIL", "PARTIAL", "BLOCKED", "WARN"].includes(record.verdict), "Invalid evidence verdict");
    requireValue(plan.tests.some((test) => test.id === record.test && test.steps.some((_, i) => stepId(test.id, i) === record.step)), "Evidence references an unknown case or step");
    const position = positions.get(record.step)!;
    requireValue(position >= previous, "Evidence step order moved backwards"); previous = position;
    if (record.screenshot) safeRelative(record.screenshot);
    if (record.capturedAt !== undefined) checkTime(record.capturedAt);
    if (record.assertionPassed !== undefined) requireValue(typeof record.assertionPassed === "boolean", "Assertion outcome must be a boolean");
    if (record.toolVersion !== undefined) requireValue(typeof record.toolVersion === "string" && record.toolVersion.length > 0, "Invalid driver version metadata");
    if (record.captureStatus !== undefined) {
      requireValue(["captured", "failed", "not-requested"].includes(record.captureStatus), "Invalid capture status");
      requireValue(record.screenshot ? record.captureStatus === "captured" : record.captureStatus !== "captured", "Capture status contradicts screenshot reference");
    }
    if (record.captureSequence !== undefined) requireValue(Number.isSafeInteger(record.captureSequence) && record.captureSequence > 0, "Capture sequence must be a positive integer");
    if (record.viewport !== undefined) requireValue(record.viewport && Number.isFinite(record.viewport.width) && record.viewport.width > 0 && Number.isFinite(record.viewport.height) && record.viewport.height > 0 && Number.isFinite(record.viewport.deviceScaleFactor) && record.viewport.deviceScaleFactor > 0, "Invalid viewport metadata");
    const mine = grouped.get(record.test) ?? []; mine.push(record); grouped.set(record.test, mine);
  }
  return grouped;
}
export function checkPlan(plan: Plan): void {
  requireValue(plan && typeof plan === "object", "Plan must be an object");
  if ("schema" in plan) requireValue(plan.schema === SCHEMA, "Unsupported explicit plan schema");
  if ("kind" in plan) requireValue(plan.kind === "plan", "Invalid explicit plan kind");
  requireValue(["surf", "playwright", "tui"].includes(plan.driver) && typeof plan.workId === "string" && typeof plan.base === "string" && Array.isArray(plan.tests) && plan.tests.length > 0, "Invalid evidence plan");
  requireValue(plan.preconditions === undefined || Array.isArray(plan.preconditions), "Preconditions must be an array");
  const ids = new Set<string>();
  const preconditions = new Set<string>();
  for (const precondition of plan.preconditions ?? []) {
    requireValue(precondition && typeof precondition === "object", "Invalid precondition record");
    checkId(precondition.id);
    requireValue(!preconditions.has(precondition.id) && typeof precondition.desc === "string" && precondition.check && typeof precondition.check === "object", "Invalid or duplicate precondition");
    for (const field of ["locator", "text", "goto"] as const) {
      requireValue(precondition.check[field] === undefined || typeof precondition.check[field] === "string", `Precondition check ${field} must be a string`);
    }
    const timeoutMs = precondition.check.timeoutMs;
    requireValue(timeoutMs === undefined || (typeof timeoutMs === "number" && Number.isFinite(timeoutMs) && timeoutMs >= 0), "Precondition check timeoutMs must be a finite non-negative number");
    preconditions.add(precondition.id);
  }
  for (const test of plan.tests) {
    requireValue(test && typeof test === "object", "Invalid case record");
    checkId(test.id); requireValue(!ids.has(test.id), "Duplicate case ID"); ids.add(test.id);
    requireValue([test.claim, test.pass, test.fail].every((value) => typeof value === "string" && value.trim().length > 0) && Array.isArray(test.steps) && test.steps.length > 0, "Invalid case purpose, expectations or steps");
    requireValue(test.requires === undefined || Array.isArray(test.requires), "Case requires must be an array");
    requireValue((test.requires ?? []).every((id) => preconditions.has(id)), "Case references an unknown precondition");
    for (const step of test.steps) {
      requireValue(step && ["navigate", "click", "fill", "capture", "expect", "wait", "scroll", "press", "human"].includes(step.do), "Invalid step action");
      if (step.do !== "human") {
        requireValue(typeof step.says === "string" || (step.says === undefined && (step.do === "wait" || step.do === "scroll")), "Step says must be a string");
      }
      switch (step.do) {
        case "navigate":
          requireValue(typeof step.to === "string", "Step to must be a string");
          break;
        case "click":
        case "fill":
        case "capture":
        case "wait":
        case "scroll":
          requireValue(typeof step.locator === "string", "Step locator must be a string");
          if (step.do === "fill") requireValue(typeof step.text === "string", "Step text must be a string");
          if (step.do === "capture") requireValue(typeof step.as === "string", "Step as must be a string");
          if (step.do === "capture") requireValue(step.attr === undefined || typeof step.attr === "string", "Step attr must be a string");
          if (step.do === "click") requireValue(step.dom === undefined || typeof step.dom === "boolean", "Step dom must be a boolean");
          if (step.do === "wait") requireValue(step.gone === undefined || typeof step.gone === "boolean", "Step gone must be a boolean");
          break;
        case "press":
          requireValue(typeof step.key === "string", "Step key must be a string");
          break;
        case "human":
          requireValue(typeof step.needs === "string", "Step needs must be a string");
          break;
        case "expect":
          requireValue(step.locator === undefined || typeof step.locator === "string", "Step locator must be a string");
          requireValue(step.url === undefined || typeof step.url === "string", "Step url must be a string");
          requireValue(step.text === undefined || typeof step.text === "string", "Step text must be a string");
          requireValue(step.visible === undefined || typeof step.visible === "boolean", "Step visible must be a boolean");
          break;
      }
      if (step.do === "wait" || step.do === "expect") {
        requireValue(step.timeoutMs === undefined || (typeof step.timeoutMs === "number" && Number.isFinite(step.timeoutMs) && step.timeoutMs >= 0), "Step timeoutMs must be a finite non-negative number");
      }
      if (step.shot !== undefined) requireValue(typeof step.shot === "string" && /^[A-Za-z0-9_-]*$/.test(step.shot), "Invalid screenshot slug");
      if (step.do === "expect") requireValue(!!step.url || (!!step.locator && (typeof step.text === "string" || typeof step.visible === "boolean")), "Expect needs an executable assertion");
    }
  }
  if (plan.driver === "tui") checkTuiPlan(plan);
}
function header(value: unknown, kind: Kind): asserts value is RecordHeader {
  requireValue(value && typeof value === "object" && "schema" in value && value.schema === SCHEMA && "kind" in value && value.kind === kind, "Unsupported schema or invalid record kind");
}
function checkId(value: unknown): asserts value is string {
  requireValue(typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) && value !== "." && value !== ".." && value.length <= 160, "ID must use 1–160 safe letters, digits, dots, underscores or hyphens");
}
function checkTime(value: unknown): void { requireValue(typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value)), "Timestamp must be an ISO date with timezone"); }
function requireValue(condition: unknown, message: string): asserts condition { if (!condition) throw new CliError(message, 2); }
function stepId(id: string, position: number): string { return `${id}.${position + 1}`; }
function pad(value: number): string { return String(value).padStart(3, "0"); }
function hash(bytes: Buffer): string { return createHash("sha256").update(bytes).digest("hex"); }
function same(left: unknown, right: unknown): boolean { return JSON.stringify(left) === JSON.stringify(right); }
function within(root: string, path: string): boolean { const part = relative(root, path); return part === "" || (!part.startsWith(`..${sep}`) && part !== ".." && !isAbsolute(part)); }
function safeRelative(path: string): string {
  requireValue(typeof path === "string" && path.length > 0 && !isAbsolute(path) && !path.includes("\\") && !path.includes("\0") && path.split("/").every((part) => part !== "" && part !== "." && part !== ".."), "Unsafe evidence path"); return path;
}
async function rejectSymlinkComponents(path: string, allowMissing = false): Promise<void> {
  const absolute = resolve(path);
  let current: string = sep;
  for (const component of absolute.split(sep).filter(Boolean)) {
    current = join(current, component);
    try {
      requireValue(!(await lstat(current)).isSymbolicLink(), "Symlink paths are not allowed");
    } catch (error) {
      if (allowMissing && (error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
  }
}
async function safeFile(root: string, path: string): Promise<string> {
  const file = join(root, safeRelative(path));
  requireValue(within(root, file), "Evidence path escapes run");
  try {
    let current = root;
    for (const part of path.split("/")) { current = join(current, part); requireValue(!(await lstat(current)).isSymbolicLink(), "Evidence symlink is not allowed"); }
    requireValue((await lstat(file)).isFile(), "Evidence reference is not a regular file");
    return file;
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError(`Invalid evidence file reference: ${(error as Error).message}`, 2);
  }
}
async function copyTree(source: string, destination: string): Promise<void> {
  await mkdir(destination);
  for (const entry of await readdir(source, { withFileTypes: true })) {
    requireValue(!entry.isSymbolicLink(), "Native output contains a symlink");
    const from = join(source, entry.name), to = join(destination, entry.name);
    if (entry.isDirectory()) await copyTree(from, to);
    else { requireValue(entry.isFile(), "Native output must contain only files and directories"); await copyFile(from, to); }
  }
}
async function inventory(root: string, prefix = ""): Promise<Array<{ path: string; sha256: string }>> {
  const files: Array<{ path: string; sha256: string }> = [];
  const entries = await readdir(join(root, prefix), { withFileTypes: true });
  entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    requireValue(!entry.isSymbolicLink(), "Run contains a symlink");
    if (entry.isDirectory()) files.push(...await inventory(root, path));
    else { requireValue(entry.isFile(), "Run contains a non-file entry"); files.push({ path, sha256: hash(await readFile(await safeFile(root, path))) }); }
  }
  return files;
}
async function sealTree(path: string): Promise<void> {
  const stat = await lstat(path);
  requireValue(!stat.isSymbolicLink(), "Cannot seal symlink");
  if (stat.isDirectory()) { for (const name of await readdir(path)) await sealTree(join(path, name)); await chmod(path, 0o555); }
  else await chmod(path, 0o444);
}
async function unsealTree(path: string): Promise<void> {
  const stat = await lstat(path);
  if (stat.isDirectory()) { await chmod(path, 0o700); for (const name of await readdir(path)) await unsealTree(join(path, name)); }
}
async function checkSealed(path: string): Promise<void> {
  const stat = await lstat(path);
  requireValue(!stat.isSymbolicLink() && (stat.mode & 0o222) === 0, "Run has unsealed files or directories");
  if (stat.isDirectory()) for (const name of await readdir(path)) await checkSealed(join(path, name));
}
async function jsonFile(path: string, value: unknown): Promise<void> { await writeFile(path, JSON.stringify(value, null, 2) + "\n", { flag: "wx" }); }
async function readJson<T>(root: string, path: string, kind: Kind): Promise<T> {
  try {
    const value: unknown = JSON.parse(await readFile(await safeFile(root, path), "utf8"));
    header(value, kind);
    return value as T;
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError(`Invalid evidence JSON record: ${(error as Error).message}`, 2);
  }
}
async function markdown(path: string, kind: "run" | "case", body: string): Promise<void> {
  const raw = `---\nschema: ${SCHEMA}\nkind: ${kind}\n---\n${body}`;
  await command("mise", ["exec", "--", "mq", "--allow-http-import", "--no-lockfile", "-I", "raw", "-F", "text", "--no-clobber", "-o", path, 'import "github.com/harehare/okf.mq" | .'], raw, dirname(path));
}
async function command(binary: string, args: string[], input?: string, cwd?: string): Promise<void> {
  const { promise, resolve: accept, reject } = Promise.withResolvers<void>();
  const child = spawn(binary, args, { cwd, stdio: ["pipe", "ignore", "pipe"] });
  let diagnostic = "";
  child.stderr.on("data", (chunk: Buffer) => { diagnostic += chunk.toString(); });
  child.on("error", reject);
  child.stdin.on("error", reject);
  child.on("close", (code) => code === 0 ? accept() : reject(new Error(`${binary} failed (${code}): ${diagnostic}`)));
  child.stdin.end(input);
  await promise;
}
function pngDimensions(bytes: Buffer): { width: number; height: number } {
  requireValue(bytes.length >= 45 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "Capture is not a PNG");
  requireValue(bytes.readUInt32BE(8) === 13 && bytes.toString("ascii", 12, 16) === "IHDR", "PNG lacks an IHDR header");
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  requireValue(width > 0 && height > 0 && width <= 0x7fffffff && height <= 0x7fffffff, "PNG dimensions are invalid");
  const data: Buffer[] = [];
  let ended = false;
  for (let offset = 8; offset < bytes.length;) {
    requireValue(offset + 12 <= bytes.length, "PNG chunk is truncated");
    const size = bytes.readUInt32BE(offset), end = offset + 12 + size;
    requireValue(end <= bytes.length, "PNG chunk exceeds file");
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    requireValue(crc32(bytes.subarray(offset + 4, end - 4)) === bytes.readUInt32BE(end - 4), "PNG chunk checksum is invalid");
    if (type === "IDAT") data.push(bytes.subarray(offset + 8, end - 4));
    if (type === "IEND") { requireValue(size === 0 && end === bytes.length, "Invalid PNG end chunk"); ended = true; }
    offset = end;
  }
  requireValue(ended && data.length > 0, "PNG lacks image data or end chunk");
  const depth = bytes[24]!, color = bytes[25]!, interlace = bytes[28]!;
  const channels = new Map([[0, 1], [2, 3], [3, 1], [4, 2], [6, 4]]).get(color);
  requireValue(channels && [1, 2, 4, 8, 16].includes(depth) && bytes[26] === 0 && bytes[27] === 0 && interlace <= 1, "Unsupported PNG header");
  requireValue(color === 0 || color === 3 ? depth <= (color === 3 ? 8 : 16) : depth >= 8, "Invalid PNG colour depth");
  const passes = interlace === 0 ? [[0, 0, 1, 1]] : [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]];
  const rows = passes.map(([x, y, dx, dy]) => {
    const columns = Math.max(0, Math.ceil((width - x!) / dx!));
    const count = Math.max(0, Math.ceil((height - y!) / dy!));
    return { bytes: Math.ceil(columns * channels * depth / 8), count: columns ? count : 0 };
  });
  const expected = rows.reduce((sum, row) => sum + (row.bytes + 1) * row.count, 0);
  requireValue(expected <= 512 * 1024 * 1024, "PNG exceeds the 512 MiB decoded-image limit");
  let decoded: Buffer;
  try {
    decoded = inflateSync(Buffer.concat(data), { maxOutputLength: expected + 1 });
  } catch {
    throw new CliError("PNG compressed image data is invalid", 2);
  }
  requireValue(decoded.length === expected, "PNG image data does not match its dimensions");
  let rowOffset = 0;
  for (const row of rows) for (let i = 0; i < row.count; i++) {
    requireValue(decoded[rowOffset]! <= 4, "Invalid PNG row filter");
    rowOffset += row.bytes + 1;
  }
  return { width, height };
}
function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}

async function readVideoAsset(root: string, prefix: "" | "native/", plan: Plan, test: Test, driverVersion: string): Promise<VideoAssetRecord | null> {
  const source = `report/videos/test-${test.id}.webm`;
  const unavailablePath = `${prefix}${source}.unavailable.json`;
  if (await optionalFile(root, unavailablePath)) {
    const diagnostic = await readJson<RecordHeader & { id: string; message: string }>(root, unavailablePath, "error");
    requireValue(plan.driver === "playwright" && plan.video === true &&
      diagnostic.id === `${test.id}.video-unavailable` && typeof diagnostic.message === "string" && diagnostic.message.length > 0,
      "Invalid optional video limitation");
    return null;
  }
  if (!await optionalFile(root, prefix + source)) return null;
  requireValue(plan.driver === "playwright" && plan.video === true, "Unexpected recording without a video-enabled Playwright plan");
  const bytes = await readFile(await safeFile(root, prefix + source));
  const dimensions = webmMetadata(bytes);
  const metadataPath = `${prefix}${source}.metadata.json`;
  let metadata: VideoCaptureMetadata | undefined;
  if (await optionalFile(root, metadataPath)) {
    metadata = await readJson<VideoCaptureMetadata>(root, metadataPath, "asset");
    if (metadata.capturedAt !== undefined) checkTime(metadata.capturedAt);
    if (metadata.durationMs !== undefined) requireValue(Number.isFinite(metadata.durationMs) && metadata.durationMs >= 0, "Invalid video duration");
    if (metadata.toolVersion !== undefined) requireValue(typeof metadata.toolVersion === "string" && metadata.toolVersion.length > 0, "Invalid video tool version");
    if (metadata.viewport !== undefined) requireValue(metadata.viewport && metadata.viewport.width > 0 && metadata.viewport.height > 0 && metadata.viewport.deviceScaleFactor > 0 && [metadata.viewport.width, metadata.viewport.height, metadata.viewport.deviceScaleFactor].every(Number.isFinite), "Invalid video viewport");
  }
  return {
    schema: SCHEMA, kind: "asset", id: `${test.id}.video.capture-001`, caseId: test.id,
    stepId: stepId(test.id, 0), scope: "case", path: `cases/${test.id}/media/step-001-case-recording--capture-001.webm`,
    sourcePath: `native/${source}`, captureSequence: 1, sha256: hash(bytes),
    mediaType: "video/webm", width: dimensions.width, height: dimensions.height,
    durationMs: dimensions.durationMs ?? metadata?.durationMs ?? null,
    capturedAt: metadata?.capturedAt ?? null, viewport: metadata?.viewport ?? null,
    surface: "web", driver: plan.driver, driverVersion: metadata?.toolVersion ?? driverVersion,
    captureMethod: "playwright-video", url: "",
  };
}

async function optionalFile(root: string, path: string): Promise<boolean> {
  try {
    await lstat(join(root, safeRelative(path)));
    await safeFile(root, path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

// WebM stores pixel dimensions in the video track. Read them from those bytes,
// rather than treating a browser viewport or a screenshot size as recording size.
function webmMetadata(bytes: Buffer): { width: number; height: number; durationMs: number | null } {
  requireValue(bytes.length > 4 && bytes.readUInt32BE(0) === 0x1a45dfa3, "Recording is not WebM/EBML");
  const containers = new Set([0x1a45dfa3, 0x18538067, 0x1654ae6b, 0xae, 0xe0, 0x1549a966, 0x1f43b675, 0xa0]);
  const pending = [{ start: 0, end: bytes.length, depth: 0 }];
  let width: number | undefined, height: number | undefined;
  let duration: number | undefined, scale: number | undefined;
  let documentType = "", videoPayload = false;
  while (pending.length) {
    const range = pending.pop()!;
    requireValue(range.depth <= 12, "WebM nesting exceeds the supported container depth");
    for (let offset = range.start; offset < range.end;) {
      const element = ebmlElement(bytes, offset, range.end);
      const data = bytes.subarray(element.start, element.end);
      if (element.id === 0x4282) documentType = data.toString("utf8");
      if (element.id === 0xb0) width = ebmlUnsigned(data);
      if (element.id === 0xba) height = ebmlUnsigned(data);
      if (element.id === 0x2ad7b1) scale = ebmlUnsigned(data);
      if (element.id === 0x4489) {
        requireValue(data.length === 4 || data.length === 8, "Invalid WebM duration field");
        duration = data.length === 4 ? data.readFloatBE(0) : data.readDoubleBE(0);
        requireValue(Number.isFinite(duration) && duration >= 0, "Invalid WebM duration");
      }
      if ((element.id === 0xa3 || element.id === 0xa1) && data.length > 4) videoPayload = true;
      if (containers.has(element.id)) pending.push({ start: element.start, end: element.end, depth: range.depth + (element.id === 0x1f43b675 ? 0 : 1) });
      offset = element.end;
    }
  }
  requireValue(documentType === "webm" && videoPayload, "WebM lacks a document type or recorded cluster");
  requireValue(width && height && Number.isSafeInteger(width) && Number.isSafeInteger(height), "WebM lacks valid video-track dimensions");
  return { width, height, durationMs: duration !== undefined && scale !== undefined ? duration * scale / 1000000 : null };
}

function ebmlElement(bytes: Buffer, offset: number, boundary: number): { id: number; start: number; end: number } {
  requireValue(offset < boundary && bytes[offset] !== 0, "Invalid EBML element ID");
  let idLength = 1, idMask = 0x80;
  while (!(bytes[offset]! & idMask)) { idLength++; idMask >>= 1; }
  requireValue(idLength <= 4 && offset + idLength < boundary, "Invalid EBML element ID length");
  let id = 0;
  for (let i = 0; i < idLength; i++) id = id * 256 + bytes[offset + i]!;
  const sizeOffset = offset + idLength;
  requireValue(bytes[sizeOffset] !== 0, "Invalid EBML size");
  let sizeLength = 1, sizeMask = 0x80;
  while (!(bytes[sizeOffset]! & sizeMask)) { sizeLength++; sizeMask >>= 1; }
  requireValue(sizeLength <= 8 && sizeOffset + sizeLength <= boundary, "Truncated EBML size");
  let size = bytes[sizeOffset]! & (sizeMask - 1);
  let unknown = size === sizeMask - 1;
  for (let i = 1; i < sizeLength; i++) {
    size = size * 256 + bytes[sizeOffset + i]!;
    unknown = unknown && bytes[sizeOffset + i] === 255;
  }
  const start = sizeOffset + sizeLength;
  const end = unknown ? boundary : start + size;
  requireValue((unknown || Number.isSafeInteger(size)) && end >= start && end <= boundary, "EBML element exceeds its container");
  return { id, start, end };
}

function ebmlUnsigned(bytes: Buffer): number {
  requireValue(bytes.length > 0 && bytes.length <= 8, "Invalid EBML unsigned integer");
  let value = 0;
  for (const byte of bytes) value = value * 256 + byte;
  requireValue(Number.isSafeInteger(value), "EBML integer exceeds safe range");
  return value;
}
