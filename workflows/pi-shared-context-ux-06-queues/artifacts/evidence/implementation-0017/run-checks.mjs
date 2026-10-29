import { readFile, writeFile, mkdir } from "node:fs/promises";
const input = Bun.argv[2] ?? new URL("./check-config.json", import.meta.url);
const config = JSON.parse(await readFile(input, "utf8"));
await mkdir(config.evidence, { recursive: true });
const results = await Promise.all(config.commands.map(async row => {
  const child = Bun.spawn(row.argv, { cwd: config.worktree, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  const result = { ...row, cwd: config.worktree, code, stdout, stderr };
  await writeFile(config.evidence + "/" + row.name + "-command.json", JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
  return result;
}));
await writeFile(config.evidence + "/checks.json", JSON.stringify({ commands: results }, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify(results.map(row => ({ name: row.name, code: row.code, result: config.evidence + "/" + row.name + "-command.json", summary: row.name === "suite" ? row.stderr.split("\n").slice(-6).join("\n") : row.stderr }))));
if (results.some(row => row.code !== 0)) process.exitCode = 1;
