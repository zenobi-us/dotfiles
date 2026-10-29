import { readFile, writeFile, mkdir } from "node:fs/promises";
const config = JSON.parse(await readFile(new URL("./check-config.json", import.meta.url), "utf8"));
await mkdir(config.evidence, { recursive: true });
const results = await Promise.all(config.commands.map(async row => {
  const process = Bun.spawn(row.argv, { cwd: config.worktree, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
  const result = { ...row, cwd: config.worktree, code, stdout, stderr };
  await writeFile(config.evidence + "/" + row.name + "-command.json", JSON.stringify(result, null, 2) + "\n");
  return result;
}));
await writeFile(config.evidence + "/checks.json", JSON.stringify({ commands: results }, null, 2) + "\n");
console.log(JSON.stringify(results.map(row => ({ name: row.name, code: row.code, result: config.evidence + "/" + row.name + "-command.json", summary: row.name === "suite" ? row.stderr.split("\n").slice(-6).join("\n") : row.stderr }))));
if (results.some(row => row.code !== 0)) process.exitCode = 1;
