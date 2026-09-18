#!/usr/bin/env -S mise x -- bun --install=fallback
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { basename, dirname, resolve } from "node:path";

async function packageSkill(sourceArg?: string, outputArg?: string) {
  const source = resolve(sourceArg ?? "/home/moltbot/clawd/skills/ttrpg-gm");
  const output = resolve(outputArg ? `${outputArg}/${basename(source)}.skill` : `${dirname(source)}/${basename(source)}.skill`);
  if (!(await Bun.file(source).exists())) throw new Error(`source directory missing: ${source}`);
  const proc = Bun.spawn(["tar", "-czf", output, "--exclude=.git", "--exclude=__pycache__", "--exclude=node_modules", "-C", dirname(source), basename(source)], { stdout: "pipe", stderr: "pipe" });
  const code = await proc.exited;
  if (code !== 0) throw new Error(await new Response(proc.stderr).text());
  console.log(`Packaging ${basename(source)}...`);
  console.log(`\n✅ Created: ${output}`);
  console.log(`   Size: ${(await Bun.file(output).stat()).size} bytes`);
}
const cli = new Crust("ttrpg-gm").meta({ description: "Package and verify the TTRPG Game Master skill." });
const doctor = cli.sub("doctor").meta({ description: "Report Bun, tar, and skill layout prerequisites." }).run(() => console.log(JSON.stringify({ bun: Bun.version, tar: Boolean(Bun.which("tar")), defaultPath: "/home/moltbot/clawd/skills/ttrpg-gm" }, null, 2)));
const verify = cli.sub("verify").meta({ description: "Verify a skill source directory." }).args([{ name: "source", type: "string", required: false }]).run(async ({ args }) => { const source = resolve(args.source ?? "/home/moltbot/clawd/skills/ttrpg-gm"); if (!(await Bun.file(source).exists())) { process.exitCode = 1; throw new Error(`source directory missing: ${source}`); } console.log(source); });
const pack = cli.sub("package").meta({ description: "Create a .skill archive." }).args([{ name: "source", type: "string", required: false }, { name: "output", type: "string", required: false }]).run(async ({ args }) => packageSkill(args.source, args.output));
cli.use(helpPlugin()).command(doctor).command(verify).command(pack).execute();
