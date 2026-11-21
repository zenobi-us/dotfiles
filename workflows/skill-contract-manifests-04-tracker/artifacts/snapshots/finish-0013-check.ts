// Validates the isolated integration candidate without retaining dependency links or changing source.
import { lstat, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cwd = process.cwd();
const dependencyLink = join(cwd, "node_modules");
if (await lstat(dependencyLink).then(() => true, error => {
  if (error.code === "ENOENT") return false;
  throw error;
})) throw new Error("Refusing to replace existing candidate dependencies");
const temporary = await mkdtemp(join(tmpdir(), "tracker-integration-dependencies-"));
let linked = false;
let identity: { source_commit: string; source_tree: string } | undefined;
const env = { ...process.env };
async function run(argv: string[], directory = cwd) {
  const process = Bun.spawn(argv, { cwd: directory, env, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exit_code] = await Promise.all([
    new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited,
  ]);
  console.log(JSON.stringify({ argv, cwd: directory, exit_code, stdout, stderr, ...identity }));
  if (exit_code !== 0) throw new Error(`Candidate check failed: ${argv.join(" ")}`);
  return stdout;
}
try {
  const [source_commit, source_tree] = (await run(["git", "rev-parse", "HEAD", "HEAD^{tree}"])).trim().split("\n");
  identity = { source_commit: source_commit!, source_tree: source_tree! };
  await writeFile(join(temporary, "package.json"), JSON.stringify({
    private: true, dependencies: {
      ajv: "8.17.1", "@crustjs/core": "0.0.19", "@crustjs/plugins": "0.1.2",
    }
  }));
  await run(["mise", "exec", "--", "bun", "install"], temporary);
  await symlink("ajv", join(temporary, "node_modules", "ajv@^8.17.1"));
  await symlink("core", join(temporary, "node_modules", "@crustjs", "core@^0.0.19"));
  await symlink("plugins", join(temporary, "node_modules", "@crustjs", "plugins@^0.1.2"));
  await symlink(join(temporary, "node_modules"), dependencyLink, "dir");
  linked = true;
  const excludes = join(temporary, "git-excludes");
  await writeFile(excludes, "node_modules\n");
  const count = Number(env.GIT_CONFIG_COUNT ?? "0");
  env.GIT_CONFIG_COUNT = String(count + 1);
  env[`GIT_CONFIG_KEY_${count}`] = "core.excludesfile";
  env[`GIT_CONFIG_VALUE_${count}`] = excludes;
  const checks = [
    ["mise", "exec", "--", "bun", "test", "mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts", "mise/conf.d/devtools-agent/bundles/agent-core/skills/result-delivery/scripts"],
    ["mise", "exec", "--", "bun", "test", "mise/conf.d/devtools-agent/bundles/developer/skills/git/worktree/scripts/delivery-integration.test.ts"],
    ["mise", "exec", "--", "bun", "test", "mise/conf.d/devtools-agent/bundles/agent-core/extensions/pi-shared-context/data.test.ts", "--test-name-pattern", "versioned|initiative links"],
  ];
  for (const argv of checks) await run(argv);
  const owner = join(cwd, "mise/conf.d/devtools-agent/bundles/matt-pocock/skills/reading-and-writing-tickets/scripts/records.ts");
  const result = JSON.parse(await run([owner, "check", "--repository", cwd, "--ticket", "skill-contract-manifests-04-tracker"]));
  if (result.schemaVersion !== "tracker-result/v2" || result.validation?.status !== "passed") {
    throw new Error("Current owner CLI did not validate the candidate's canonical retained ticket");
  }
  console.log(JSON.stringify({ scenario: "candidate owner CLI and declared checks", status: "passed", ...identity }));
} finally {
  if (linked) await rm(dependencyLink);
  await rm(temporary, { recursive: true, force: true });
}
