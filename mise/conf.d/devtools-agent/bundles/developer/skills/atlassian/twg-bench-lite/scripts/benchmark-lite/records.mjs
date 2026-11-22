// Benchmark-owned readers validate historical evidence without changing its identity or bytes.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { constants, readFileSync } from "node:fs";
import { lstat, mkdir, open, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const skillRoot = fileURLToPath(new URL("../../", import.meta.url));
export const sharedRouter = fileURLToPath(new URL("../../../../../../agent-core/skills/skill-contracts/scripts/router.ts", import.meta.url));
export const ids = Object.freeze(Object.fromEntries(
  ["configuration", "result", "manifest", "judgement", "run", "progress"].map(family => [family, `twg-benchmark-${family}/v2`])
));
let declarations;

export function contracts() {
  if (!declarations) {
    declarations = JSON.parse(execFileSync(sharedRouter, ["validate", "--skill", skillRoot], { encoding: "utf8" }));
    for (const identifier of Object.values(ids)) {
      if (!declarations.manifest.produces.includes(identifier)) throw new Error("Benchmark output contract is not declared.");
    }
  }
  return declarations;
}

export function readRecord(value, family) {
  contracts();
  requireObject(value, family);
  const historical = historicalIdentity(value, family);
  if (value.schemaVersion !== ids[family] && !historical) {
    throw new Error(`Unsupported ${family} schemaVersion; use a declared historical reader or the current record contract.`);
  }
  const identifier = historical ? `twg-benchmark-${family}/v1` : ids[family];
  if (!contracts().manifest.accepts.includes(identifier)) throw new Error("Benchmark input contract is not declared.");
  if (Object.hasOwn(value, "schema")) throw new Error(`${family} must not declare a competing schema field.`);
  validateContent(value, family, historical);
  return value;
}

export function historicalIdentity(value, family) {
  if (Object.hasOwn(value, "schemaVersion")) {
    return value.schemaVersion === 1 && ["configuration", "result", "manifest"].includes(family);
  }
  return ["judgement", "run", "progress"].includes(family);
}

function requireObject(value, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${field} must be an object.`);
}
function text(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be a non-empty string.`);
}
function strings(value, field) {
  if (!Array.isArray(value) || value.some(item => typeof item !== "string" || !item)) throw new Error(`${field} must be a string array.`);
}
function measurement(value, field) {
  if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error(`${field} must be a nonnegative measurement or null.`);
}
function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function integrity(value) {
  requireObject(value, "integrity");
  if (typeof value.valid !== "boolean") throw new Error("integrity.valid must be boolean.");
  requireObject(value.checks, "integrity.checks");
  if (Object.values(value.checks).some(check => check !== null && typeof check !== "boolean")) throw new Error("Integrity checks must be boolean or null.");
  for (const key of ["samePrompt", "sameParentSession", "sameAgentRuntime", "sameModelWhenObservable", "sameReasoningWhenObservable", "controlDidNotUseTwg", "controlDidNotUsePaidGraphTools", "testUsedTwg", "noParentTaskSolving", "noCrossArmContext"]) {
    if (!Object.hasOwn(value.checks, key)) throw new Error("Integrity record is missing a benchmark check.");
  }
  if (value.valid !== Object.values(value.checks).every(check => check === true)) throw new Error("Integrity validity contradicts its stored checks.");
  strings(value.warnings, "integrity.warnings");
}
function validateContent(value, family, historical) {
  if (family === "configuration") {
    for (const key of ["contractName", "contractVersion", "description", "displayName"]) text(value[key], key);
    requireObject(value.defaultArms, "defaultArms");
    for (const arm of ["control", "test"]) {
      const record = value.defaultArms[arm];
      requireObject(record, arm);
      if (record.id !== arm) throw new Error("Configuration must preserve control/test arm identities.");
      text(record.label, `${arm}.label`);
      text(record.context, `${arm}.context`);
      strings(record.mustRecord, `${arm}.mustRecord`);
    }
    strings(value.defaultArms.control.mustNotUse, "control.mustNotUse");
    strings(value.defaultArms.test.mustUse, "test.mustUse");
    for (const key of ["integrityChecks", "progressFields", "qualityClassifications", "qualityDimensionWinners"]) strings(value[key], key);
    requireObject(value.publicSafety, "publicSafety");
    for (const key of ["noInternalTenantsOrCloudIds", "noInternalUrls", "noPublishCommand", "noRawSecrets"]) {
      if (value.publicSafety[key] !== true) throw new Error("Configuration must retain every public safety boundary.");
    }
    for (const key of ["runtimeSupport", "qualityJudge", "report"]) requireObject(value[key], key);
    strings(value.runtimeSupport.v1, "runtimeSupport.v1");
    strings(value.qualityJudge.supportedAgents, "qualityJudge.supportedAgents");
    strings(value.report.sections, "report.sections");
  } else if (family === "manifest") {
    for (const key of ["contractVersion", "agent", "model", "promptHash"]) text(value[key], key);
    if (!["codex", "rovo"].includes(value.agent) || !/^[a-f0-9]{64}$/u.test(value.promptHash)) throw new Error("Invalid manifest runtime or prompt hash.");
    requireObject(value.arms, "arms");
    for (const arm of ["control", "test"]) { requireObject(value.arms[arm], arm); text(value.arms[arm].label, `${arm}.label`); }
  } else if (family === "result") {
    text(value.contractVersion, "contractVersion");
    requireObject(value.prompt, "prompt");
    text(value.prompt.text, "prompt.text");
    if (value.prompt.hash !== hash(value.prompt.text)) throw new Error("Result prompt hash does not match the stored prompt.");
    readRecord(value.manifest, "manifest");
    if (historical !== historicalIdentity(value.manifest, "manifest")) throw new Error("Result and manifest contract generations differ.");
    if (value.manifest.promptHash !== value.prompt.hash || value.manifest.contractVersion !== value.contractVersion) throw new Error("Result and manifest identities differ.");
    for (const arm of ["control", "test"]) {
      const record = value[arm];
      requireObject(record, arm);
      if (typeof record.output !== "string" || record.label !== value.manifest.arms[arm].label) throw new Error("Result arm output or identity is invalid.");
      if (!["completed", "failed", "blocked"].includes(record.status)) throw new Error("Unsupported arm status.");
      for (const key of ["tokens", "toolCalls", "twgCalls", "durationMs", "toolErrors"]) measurement(record[key], `${arm}.${key}`);
      strings(record.toolSurface, `${arm}.toolSurface`);
      if (!Array.isArray(record.toolCallLog)) throw new Error("Arm toolCallLog must be an array.");
    }
    integrity(value.integrity);
    if (Object.hasOwn(value, "quality")) readRecord(value.quality, "judgement");
  } else if (family === "judgement") {
    if (!["equivalent", "twg-better", "control-better", "capability-gain", "not-comparable"].includes(value.classification)) throw new Error("Unsupported quality classification.");
    text(value.summary, "summary");
    const dimensions = historical && !Object.hasOwn(value, "dimensions") ? [] : value.dimensions;
    if (!Array.isArray(dimensions)) throw new Error("Judgement dimensions must be an array.");
    for (const dimension of dimensions) {
      requireObject(dimension, "dimension");
      text(dimension.name, "dimension.name"); text(dimension.explanation, "dimension.explanation");
      if (!["control", "test", "tie", "not-comparable"].includes(dimension.winner)) throw new Error("Unsupported dimension winner.");
    }
  } else if (family === "run") {
    requireObject(value.contract, "contract"); text(value.contract.name, "contract.name"); text(value.contract.version, "contract.version");
    if (!["codex", "rovo"].includes(value.agent) || !/^[a-f0-9]{64}$/u.test(value.promptHash)) throw new Error("Invalid run runtime or prompt hash.");
    integrity(value.integrity);
    requireObject(value.artifacts, "artifacts");
    for (const key of ["manifestPath", "resultPath", "reportPath", "progressPath"]) text(value.artifacts[key], key);
    if (Object.hasOwn(value, "quality")) readRecord(value.quality, "judgement");
  } else if (family === "progress") {
    if (!["initialized", "completed", "completed-with-warnings"].includes(value.status)) throw new Error("Unsupported progress status.");
    for (const key of ["elapsedMs", "toolCalls", "tokens"]) measurement(value[key], key);
    text(value.lastActivity, "lastActivity");
  } else throw new Error("Unknown benchmark record family.");
}

export function readRecordFile(path, family) {
  return readRecord(JSON.parse(readFileSync(path, "utf8")), family);
}

// Exclusive directory creation reserves a new run before any live arm can start.
export async function reserveRunDirectory(path) {
  await mkdir(dirname(resolve(path)), { recursive: true });
  await mkdir(resolve(path));
}

export async function writeReport(path, resultPath, html) {
  const output = resolve(path);
  if (!/\.html?$/iu.test(output) || output === resolve(resultPath)) throw new Error("Report output must be a separate HTML file, not run evidence.");
  await mkdir(dirname(output), { recursive: true });
  let handle;
  try {
    // Exclusive creation and no-follow inspection prevent aliases from replacing stored evidence.
    handle = await open(output, "wx");
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const before = await lstat(output);
    if (!before.isFile() || before.nlink !== 1) throw new Error("Report output must not be a symlink or hard link.");
    handle = await open(output, constants.O_RDWR | constants.O_NOFOLLOW);
    const opened = await handle.stat();
    const source = await stat(resultPath);
    if (opened.ino !== before.ino || opened.dev !== before.dev || (opened.ino === source.ino && opened.dev === source.dev)) {
      await handle.close();
      throw new Error("Report output aliases immutable run evidence.");
    }
  }
  try {
    await handle.truncate(0);
    await handle.writeFile(html, "utf8");
  } finally {
    await handle.close();
  }
}
