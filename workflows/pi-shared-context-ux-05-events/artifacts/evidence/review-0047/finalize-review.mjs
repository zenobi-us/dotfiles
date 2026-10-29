import * as fs from "node:fs/promises";

const config = JSON.parse(await fs.readFile(Bun.argv[2], "utf8"));
const assessment = JSON.parse(await fs.readFile(Bun.argv[3], "utf8"));
const launch = JSON.parse(await fs.readFile(config.launchPath, "utf8"));
if (assessment.source_commit !== config.sourceCommit || assessment.source_tree !== config.sourceTree) throw new Error("Assessment does not identify the frozen source.");
if (!["completed", "blocked"].includes(assessment.status) || !["SUCCESS", "FAILURE"].includes(assessment.verdict)) throw new Error("Invalid review status or verdict.");
if (!Array.isArray(assessment.findings)) throw new Error("Review findings must be an array.");
for (const finding of assessment.findings) for (const field of ["id", "severity", "adr", "file", "line", "description", "required_change", "validation_command", "blocking_reason"]) if (finding[field] === review-start-0040) throw new Error("Finding lacks " + field);
if (assessment.verdict === "SUCCESS" && (assessment.findings.length || assessment.status !== "completed")) throw new Error("Incomplete assessment cannot pass.");
if (assessment.status === "completed" && assessment.verdict === "FAILURE" && !assessment.findings.length) throw new Error("A completed failed review needs a blocking finding; unavailable assessment is blocked.");
if (config.role !== "main" && (assessment.axis_report ?? "").split(/\s+/).length > 400) throw new Error("Axis report exceeds400 words.");
await verifySource();

let checks;
let artifact;
if (config.role === "main") {
  checks = JSON.parse(await fs.readFile(config.checksPath, "utf8"));
  const axes = await Promise.all(config.axisReceiptPaths.map(async path => JSON.parse(await fs.readFile(path, "utf8"))));
  if (assessment.verdict === "SUCCESS" && (checks.status !== "passed" || axes.some(axis => axis.status !== "completed" || axis.verdict !== "SUCCESS" || axis.source_commit !== config.sourceCommit || axis.source_tree !== config.sourceTree))) throw new Error("SUCCESS requires passing exact-source checks and both independent axes.");
  const findings = assessment.findings.length ? assessment.findings.map(finding => `### ${finding.id} — ${finding.severity}\n\n${finding.adr}: ${finding.description}\n\n- [${finding.file}:${finding.line}] ${finding.blocking_reason}\n- Required change: ${finding.required_change}\n- Validation: \`${finding.validation_command}\``).join("\n\n") : "None.";
  const body = `# Verdict\n\n${assessment.verdict}\n\n## Scope\n\n- Ticket: ${config.template.ticket_ref}\n- Source branch: ${config.template.source_branch}\n- Base branch: ${config.template.base_branch}\n- Fixed review base: \`${config.fixedPoint}\`\n- Frozen source commit: \`${config.sourceCommit}\`\n- Frozen source tree: \`${config.sourceTree}\`\n\n${assessment.summary ?? ""}\n\n## Findings\n\n${findings}\n\n## Independent Standards assessment\n\n${axes[0].verdict}: ${axes[0].axis_report ?? ""}\n\n[Standards receipt](${config.axisArtifactLinks[0]})\n\n## Independent Spec assessment\n\n${axes[1].verdict}: ${axes[1].axis_report ?? ""}\n\n[Spec receipt](${config.axisArtifactLinks[1]})\n\n## Validation\n\n${checks.commands.map(row => `- \`${row.argv.join(" ")}\` in \`${row.cwd}\`: exit${row.exit_code}.`).join("\n")}\n\n[Full actual commands and output](${config.checksArtifactLink})\n\n## Limits\n\n${(assessment.limitations ?? []).map(text => "- " + text).join("\n")}\n\n## Next step\n\n${assessment.status !== "completed" ? "Resolve the recorded assessment blocker; no integration verdict is valid." : assessment.verdict === "SUCCESS" ? "Run the source-preserving finish workflow for this exact source." : "Use a fresh counted fixer session, then obtain new exact-source reviews."}\n`;
  const generated = await mq(["--allow-http-import", "-I", "null", "-F", "text", "--args", "body", body, 'import "github.com/harehare/okf.mq" | okf::okf_new("Report", {title: "Independent ticket05 review attempt3"}, body) | okf::okf_stringify(.)']);
  const validation = JSON.parse(await mq(["--allow-http-import", "-I", "raw", "-F", "json", 'import "github.com/harehare/okf.mq" | okf::okf_validate(okf::okf_parse(.))'], generated));
  if (validation.length) throw new Error("Generated review document is invalid.");
  await exclusive(config.artifactPath, generated);
  artifact = config.artifactRef;
}

const receipt = {
  ...config.template,
  receipt_id: config.resultId,
  parent_receipt: config.template.receipt_id,
  event: "phase-result",
  status: assessment.status,
  verdict: assessment.verdict,
  created_at: new Date().toISOString(),
  session_id: launch.session_id,
  native_goal_id: launch.goal_id,
  fixed_point: config.fixedPoint,
  evidence: { store: config.evidence.store, root: config.evidence.root, ref: config.evidence.ref },
  axis: config.role,
  findings: assessment.findings,
  axis_report: assessment.axis_report,
  summary: assessment.summary,
  optional_smells: assessment.optional_smells,
  smells_checked: assessment.smells_checked,
  standards_reviewed: assessment.standards_reviewed,
  acceptance_assessment: assessment.acceptance_assessment,
  initiative_decisions: assessment.initiative_decisions,
  limitations: assessment.limitations ?? [],
  cleanup: assessment.cleanup,
  review_artifact: artifact,
  validation: checks?.commands.map(row => ({ name: row.name, command: row.argv, cwd: row.cwd, exit_code: row.exit_code })) ?? assessment.validation ?? [],
  inputs: [...config.template.inputs, { kind: "receipt", ref: config.startRef }, { kind: "evidence", ref: config.launchRef }, { kind: "evidence", ref: config.assessmentRef }, ...(config.axisReceiptRefs ?? []).map(ref => ({ kind: "receipt", ref }))],
  outputs: [{ kind: "receipt", ref: config.resultRef }, { kind: "evidence", ref: config.assessmentRef }, ...(artifact ? [{ kind: "review", ref: artifact }, { kind: "evidence", ref: config.checksRef }] : [])],
};
if (!receipt.inputs.some(row => row.ref === receipt.goal_dispatch_ref)) throw new Error("Missing coordinator reservation input.");
await exclusive(config.resultPath, JSON.stringify(receipt, null, 2) + "\n");
const readback = JSON.parse(await fs.readFile(config.resultPath, "utf8"));
if (readback.receipt_id !== config.resultId || readback.source_commit !== config.sourceCommit || !readback.evidence) throw new Error("Persisted review receipt failed readback.");
console.log(JSON.stringify({ status: receipt.status, verdict: receipt.verdict, receipt: config.resultRef, artifact, source_commit: config.sourceCommit, source_tree: config.sourceTree }));

async function exclusive(path, content) {
  const file = await fs.open(path, "wx");
  try { await file.writeFile(content); } finally { await file.close(); }
}
async function verifySource() {
  const child = Bun.spawn(["git", "rev-parse", "HEAD", "HEAD^{tree}"], { cwd: config.worktree, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code || stdout.trim() !== `${config.sourceCommit}\n${config.sourceTree}`) throw new Error("Frozen source changed: " + stderr);
  const clean = Bun.spawn(["git", "diff", "--quiet", "HEAD"], { cwd: config.worktree, stdout: "ignore", stderr: "pipe" });
  if (await clean.exited) throw new Error("Tracked source was modified during review.");
}
async function mq(args, input) {
  const child = Bun.spawn([config.mq, ...args], { cwd: config.worktree, stdin: input === review-start-0040 ? "ignore" : "pipe", stdout: "pipe", stderr: "pipe" });
  if (input !== review-start-0040) { child.stdin.write(input); child.stdin.end(); }
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  if (code) throw new Error("MQ report operation failed: " + stderr);
  return stdout;
}
