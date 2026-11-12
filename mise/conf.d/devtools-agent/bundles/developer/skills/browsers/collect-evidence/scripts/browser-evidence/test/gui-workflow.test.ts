// Opt-in public native test. Supply an approved collector-owned X11 fixture only.
import { expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile, readFile, cp, symlink, rm, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import type { Plan } from "../plan.ts";

test.skipIf(process.env.RUN_GUI_EVIDENCE_TESTS !== "1")("installed GUI workflow enforces scope, pixels, permissions and borrowed ownership", async () => {
  const scope = JSON.parse(process.env.GUI_EVIDENCE_SCOPE!);
  const image = JSON.parse(process.env.GUI_EVIDENCE_IMAGE!);
  const root = await mkdtemp(join(tmpdir(), "evidence-gui-public-"));
  const repository = join(root, "repository");
  const source = resolve(import.meta.dir, "../../..");
  const installed = join(root, "installed/bundles/developer/skills/browsers/collect-evidence");
  const cli = join(installed, "scripts/collect-evidence.ts");
  async function command(args: string[], env = process.env) {
    const p = Bun.spawn(args, { cwd: root, env, stdout: "pipe", stderr: "pipe" });
    const [out, err, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
    return { out, err, code };
  }
  async function checked(args: string[]) {
    const result = await command(args);
    if (result.code) throw new Error(JSON.stringify(result));
    return result.out;
  }
  try {
    await mkdir(repository);
    await checked(["git", "init", "--quiet", repository]);
    await checked(["git", "-C", repository, "remote", "add", "origin", "https://example.invalid/owned/gui-test.git"]);
    await writeFile(join(repository, ".context-routes.toml"), 'schema = 2\n[records.alignment]\nadapter = "markdown"\nstore = "repository"\n[records.tickets]\nadapter = "local-markdown"\nstore = "repository"\n[records.initiatives]\nadapter = "markdown"\nstore = "repository"\n[records.sources]\nadapter = "files"\nstore = "inherit:alignment"\n[records.workflows]\nadapter = "files"\nstore = "repository"\n[records.evidence]\nadapter = "files"\nstore = "repository"\n');
    await cp(source, installed, { recursive: true });
    await symlink(resolve(source, "../../../../agent-core"), join(root, "installed/bundles/agent-core"), "dir");
    expect((await checked([cli, "--help"]))).toContain("GUI");
    const doctor = [cli, "doctor", "--driver", "gui", "--display", scope.display, "--window", scope.window, "--title", scope.title, "--json"];
    expect(JSON.parse(await checked(doctor))).toMatchObject({ available: true, permissions: "Selected surface query and native capture succeeded" });
    const denied = await command(doctor, { ...process.env, XAUTHORITY: "/dev/null" });
    expect(denied.code).toBe(3);
    expect(JSON.parse(denied.out)).toMatchObject({ success: false, code: 3 });
    const policy = join(root, "capture-denied");
    await mkdir(policy);
    await writeFile(join(policy, "policy.xml"), '<policymap><policy domain="coder" rights="none" pattern="PNG*" /></policymap>');
    for (const scenario of ["native", "pixels", "permission", "identity", "capture-failure", "scope", "credential-input", "confirmation"]) {
      const dir = join(root, scenario);
      await checked([cli, "init", dir, "--repository", repository, "--workflow", "gui", "--run", scenario, "--driver", "gui", "--json"]);
      const selected = scenario === "identity" ? { ...scope, title: "Different approved window" } : scope;
      const plan: Plan = {
        schema: "collect-evidence/v1", kind: "plan", workId: "gui", driver: "gui", base: "gui://local", gui: selected,
        approval: { origins: [], confirmations: ["case.1"], gui: scenario === "scope" ? { ...scope, window: "root" } : selected },
        video: true,
        tests: [{ id: "case", claim: "Inspect selected native GUI surface", pass: "Selected native pixels match", fail: "Selected native pixels differ", steps: scenario === "credential-input"
          ? [{ do: "fill", says: "Stop before credential entry.", locator: "screen", text: "harmless-probe" }]
          : scenario === "confirmation" ? [{ do: "press", says: "Stop before confirmation.", key: "Enter" }]
          : [{ do: "expect", says: "Inspect the selected native window.", locator: "screen", visible: true, shot: "native-scene", timeoutMs: 500, image: scenario === "pixels" ? { ...image, width: image.width + 1 } : image }] }],
      };
      await writeFile(join(dir, "plan.ts"), `export const plan = ${JSON.stringify(plan)};`);
      if (["scope", "credential-input", "confirmation"].includes(scenario)) {
        const result = await command([cli, "compile", dir, "--json"]);
        expect(result.code).toBe(2);
        expect(JSON.parse(result.out).success).toBe(false);
        expect((await readdir(dir)).sort()).toEqual(["plan.ts", "workspace.json"]);
        continue;
      }
      await checked([cli, "render", dir, "--json"]);
      await checked([cli, "compile", dir, "--json"]);
      const before = await readdir(root);
      expect(JSON.parse(await checked([cli, "run", dir, "--dry-run", "--json"])).dryRun).toBe(true);
      expect(await readdir(root)).toEqual(before);
      const env = scenario === "permission" ? { ...process.env, XAUTHORITY: "/dev/null" }
        : scenario === "capture-failure" ? { ...process.env, MAGICK_CONFIGURE_PATH: policy } : process.env;
      const result = await command([cli, "run", dir, "--json"], env);
      expect({ code: result.code, error: result.code === 2 ? result.out + result.err : "" }).toEqual({ code: scenario === "native" ? 0 : scenario === "pixels" ? 1 : 3, error: "" });
      const run = join(repository, "workflows/gui/artifacts/evidence", scenario);
      await checked([cli, "validate", run, "--json"]);
      const verdict = scenario === "native" ? "PASS" : scenario === "pixels" ? "FAIL" : "BLOCKED";
      expect(JSON.parse(await checked([cli, "verdicts", run, "--json"])).verdicts).toEqual([{ caseId: "case", verdict }]);
      const record = JSON.parse(await readFile(join(run, "cases/case/case.json"), "utf8"));
      if (scenario === "native" || scenario === "pixels") {
        const asset = record.assets[0];
        expect(asset).toMatchObject({ width: image.width, height: image.height, captureMethod: "x11-imagemagick-import", surface: "gui", gui: { ...scope, ownership: "borrowed", cleanup: "preserved" } });
        expect(asset.sha256).toBe(createHash("sha256").update(await readFile(join(run, asset.path))).digest("hex"));
        expect(record.steps[0].assertionResult).toBe(scenario === "native" ? "passed" : "failed");
        expect(record.limits).toContain("Native video and automated GUI input are unavailable.");
      } else {
        expect(record.assets).toEqual([]);
        expect(record.errors[0].category).toBe("blocked");
        const events = (await readFile(join(run, record.events), "utf8")).trim().split("\n").map(line => JSON.parse(line));
        expect(events).toEqual([expect.objectContaining({ captureStatus: scenario === "capture-failure" ? "failed" : "not-requested", assertionResult: "not-run", assetId: null })]);
      }
      expect(JSON.parse(await checked([cli, "report", run, "--json"])).verdicts).toEqual([{ caseId: "case", verdict }]);
      expect((await checked(["xwininfo", "-display", scope.display, "-id", scope.window]))).toContain(`\"${scope.title}\"`);
    }
    console.log(`GUI public evidence: ${root}`);
  } finally {
    if (process.env.KEEP_GUI_EVIDENCE !== "1") {
      await command(["chmod", "-R", "u+w", root]);
      await rm(root, { recursive: true, force: true });
    }
  }
}, 120000);
