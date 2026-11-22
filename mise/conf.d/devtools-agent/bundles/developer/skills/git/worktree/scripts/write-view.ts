#!/usr/bin/env -S mise x -- bun --install=fallback
// Updates one resolved generated view; immutable events never enter the upgrade API.
import { mkdir, realpath } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveContextRecord, resolveSharedContext } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import type { Exec } from "../../../../../agent-core/skills/shared-context/scripts/shared-context/lib";
import { publishImmutableFile } from "../../../../../agent-core/skills/result-delivery/scripts/delivery";
import { safeUpgrade } from "../../../../../agent-core/skills/skill-contracts/scripts/upgrades";
import { loadContracts } from "../../../../../agent-core/skills/skill-contracts/scripts/contracts";
import owner from "./view-contracts";
import { readContextResolution } from "./context-resolution";

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    const options: Record<string, string> = {};
    for (let index = 0; index < args.length; index += 2) {
      const flag = args[index];
      if (!["--repository", "--id", "--kind", "--input"].includes(flag ?? "") || !args[index + 1] || options[flag!]) throw new Error("Usage: write-view.ts --repository <path> --id <workflow-id> --kind manifest|latest-status --input <JSON-file>");
      options[flag!] = args[index + 1]!;
    }
    if (Object.keys(options).length !== 4 || !["manifest", "latest-status"].includes(options["--kind"]!)) throw new Error("Specify repository, workflow ID, view kind and JSON input.");
    await loadContracts(fileURLToPath(new URL("..", import.meta.url)));
    const exec: Exec = async (command, argv, cwd) => {
      const process = Bun.spawn([command, ...argv], { cwd, stdout: "pipe", stderr: "pipe" });
      const [stdout, stderr, code] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
      return { code, stdout: code ? stderr : stdout };
    };
    const context = await resolveSharedContext(exec, options["--repository"]);
    if (!context || context.error) throw new Error(context?.error ?? "View publication requires shared-context routing.");
    const target = await readContextResolution(await resolveContextRecord(context, { kind: "workflow", id: options["--id"]! }));
    if (!target.root || !target.path) throw new Error("Workflow must be file-backed.");
    const canonicalRoot = await realpath(target.root);
    const path = join(canonicalRoot, relative(target.root, target.path), options["--kind"] === "manifest" ? "manifest.yaml" : "projections/latest-status.yaml");
    const request = await Bun.file(options["--input"]!).json();
    let result;
    if (await Bun.file(path).exists()) {
      if (await realpath(dirname(path)) !== dirname(path)) throw new Error("View ancestors must not be symlinks.");
      result = await safeUpgrade({ skill: fileURLToPath(new URL("..", import.meta.url)), owner: "file:scripts/view-contracts.ts", artifact: path, operation: "update", request });
      if (result.status !== "completed") process.exitCode = 1;
    } else {
      const content = Bun.YAML.stringify(request);
      const contract = await owner.identify(content);
      const expected = options["--kind"] === "manifest" ? "worktree-workflow/v3" : "worktree-latest-status/v2";
      if (contract !== expected || !await owner.validate(contract, content) || !await owner.mutable(path, content) || request.workflow_id !== options["--id"]) throw new Error("Initial view does not match its current contract and resolved workflow.");
      // A view cannot dirty reviewed source in the repository-backed workflow store.
      if (target.store === "repository" && await realpath(process.cwd()) !== canonicalRoot) {
        const common = await exec("git", ["-C", process.cwd(), "rev-parse", "--path-format=absolute", "--git-common-dir"]);
        const repository = await exec("git", ["-C", canonicalRoot, "rev-parse", "--path-format=absolute", "--git-common-dir"]);
        if (common.code || repository.code || common.stdout.trim() !== repository.stdout.trim()) throw new Error("Caller and publication checkout must share Git identity.");
      }
      await mkdir(dirname(path), { recursive: true });
      if (!await publishImmutableFile(path, content)) throw new Error("View appeared during initialization; inspect before retrying.");
      result = { status: "completed", artifact: path, changed: true, from: expected, to: expected };
    }
    console.log(JSON.stringify({ schemaVersion: "worktree-view-result/v1", ...result }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not update workflow view.");
    process.exitCode = 1;
  }
}
