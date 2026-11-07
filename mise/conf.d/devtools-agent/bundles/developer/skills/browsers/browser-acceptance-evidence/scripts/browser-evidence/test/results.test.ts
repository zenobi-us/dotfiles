import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Evidence } from "../plan.ts";
import { planJson, renderComment, renderEvidenceMd, resultsJson } from "../results.ts";
import { plan } from "./fixture.ts";

const LOCATOR_TEXT = /data-testid|row-id|button\[|\.row\b/;

const record = (step: string, over: Partial<Evidence> = {}): Evidence => ({
  test: "1", step, action: "assert", target: "x", resolved: "", url: "u",
  screenshot: "", observed: "", verdict: "", note: "", ...over,
});

describe("planJson", () => {
  it("keeps only the steps a person follows", () => {
    const json = planJson(plan);
    expect(json.tests[0]!.steps).toEqual([
      "Open the list.",
      "Tick the first row.",
      "Check the row reads \"1 selected\".",
      "Select Delete.",
      "Check the row is gone.",
      "Note the page title.",
      "By hand: Confirm the email arrived.",
    "Press Enter to open the cell editor.",
    ]);
    expect(JSON.stringify(json)).not.toMatch(LOCATOR_TEXT);
  });
});

describe("renderComment", () => {
  it("lists the steps with no evidence and footnotes the evidence URL", () => {
    const body = renderComment(planJson(plan), "https://pages.example.invalid/evidence.md");
    expect(body).toContain("**Manual test steps: WORK-1** [1]");
    expect(body).toContain("1. Open the list.");
    expect(body).toContain("[1] Steps and evidence (screenshots, verdicts): https://pages.example.invalid/evidence.md");
    expect(body).not.toContain("![");
    expect(body).not.toMatch(LOCATOR_TEXT);
  });
});

describe("resultsJson and renderEvidenceMd", () => {
  it("carries the verdict, the screenshots on disk and no missing video", () => {
    const reportDir = mkdtempSync(join(tmpdir(), "be-results-"));
    mkdirSync(join(reportDir, "shots"));
    writeFileSync(join(reportDir, "shots/14-selected.png"), "png");
    const records = [
      record("1.4", { screenshot: "shots/14-selected.png", observed: "Found text: 1 selected" }),
      record("1.7", { screenshot: "shots/17-gone.png", verdict: "PASS" }),
    ];

    const results = resultsJson(plan, records, reportDir);
    const t = results.tests[0]!;
    expect(t.verdict).toBe("PASS");
    expect(t.shots).toEqual([{ step: 3, path: "shots/14-selected.png", caption: "Found text: 1 selected" }]);
    expect(t.video).toBeNull();

    const md = renderEvidenceMd(results);
    expect(md).toContain("![Step 3 of test 1](report/shots/14-selected.png)");
    expect(md).toContain("| [1](#test-1) | Delete removes the ticked row | **PASS** |");
    expect(md).not.toContain("Video:");
  });

  it("links the video when the run recorded one", () => {
    const reportDir = mkdtempSync(join(tmpdir(), "be-video-"));
    mkdirSync(join(reportDir, "videos"));
    writeFileSync(join(reportDir, "videos/test-1.webm"), "webm");
    const results = resultsJson({ ...plan, video: true }, [record("1.1", { verdict: "PASS" })], reportDir);
    expect(results.tests[0]!.video).toBe("videos/test-1.webm");
    expect(renderEvidenceMd(results)).toContain("Video: [test 1](report/videos/test-1.webm)");
  });
});
