#!/usr/bin/env -S mise x -- bun --install=fallback
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { Crust } from "@crustjs/core@^0.0.19";
import { helpPlugin } from "@crustjs/plugins@^0.1.2";
import { instance } from "./vendor/viz-3.31.0.mjs";
import type { Viz } from "./vendor/viz-3.31.0.mjs";

type DotBlock = { name: string; content: string };

export function extractDotBlocks(markdown: string): DotBlock[] {
  const blocks: DotBlock[] = [];
  const regex = /```dot\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const content = match[1].trim();
    const name = content.match(/digraph\s+(\w+)/)?.[1] ?? `graph_${blocks.length + 1}`;
    blocks.push({ name, content });
  }
  return blocks;
}

export function extractGraphBody(dotContent: string): string {
  const match = dotContent.match(/digraph\s+\w+\s*\{([\s\S]*)\}/);
  if (!match) return "";
  return match[1].replace(/^\s*rankdir\s*=\s*\w+\s*;?\s*$/gm, "").trim();
}

export function combineGraphs(blocks: DotBlock[], skillName: string): string {
  const bodies = blocks.map((block, index) => `  subgraph cluster_${index} {
    label="${block.name}";
    ${extractGraphBody(block.content).split("\n").map((line) => `  ${line}`).join("\n")}
  }`);
  return `digraph ${skillName}_combined {
  rankdir=TB;
  compound=true;
  newrank=true;

${bodies.join("\n\n")}
}`;
}

function renderToSvg(dotContent: string, viz: Viz): string | null {
  const result = viz.render(dotContent, { format: "svg", engine: "dot" });
  if (result.status === "failure") {
    console.error("Error rendering DOT:", result.errors.map((error) => error.message).join("\n"));
    return null;
  }
  return result.output;
}

async function loadSkill(skillDirectory: string): Promise<{ directory: string; skillFile: string; skillName: string; markdown: string; blocks: DotBlock[] }> {
  const directory = path.resolve(skillDirectory);
  const skillFile = path.join(directory, "SKILL.md");
  if (!await Bun.file(skillFile).exists()) throw new Error(`Error: ${skillFile} not found`);
  const markdown = await Bun.file(skillFile).text();
  return { directory, skillFile, skillName: path.basename(directory).replaceAll("-", "_"), markdown, blocks: extractDotBlocks(markdown) };
}

async function renderSkill(skillDirectory: string, combine: boolean): Promise<void> {
  const skill = await loadSkill(skillDirectory);
  if (skill.blocks.length === 0) {
    console.log("No ```dot blocks found in", skill.skillFile);
    return;
  }
  console.log(`Found ${skill.blocks.length} diagram(s) in ${path.basename(skill.directory)}/SKILL.md`);
  const outputDirectory = path.join(skill.directory, "diagrams");
  await mkdir(outputDirectory, { recursive: true });
  const blocks = combine ? [{ name: `${skill.skillName}_combined`, content: combineGraphs(skill.blocks, skill.skillName) }] : skill.blocks;
  const viz = await instance();
  for (const block of blocks) {
    const svg = renderToSvg(block.content, viz);
    if (!svg) {
      console.error(`  Failed: ${block.name}`);
      process.exitCode = 1;
      continue;
    }
    const outputPath = path.join(outputDirectory, `${block.name}.svg`);
    await Bun.write(outputPath, svg);
    console.log(`  Rendered: ${path.basename(outputPath)}`);
    if (combine) {
      const dotPath = path.join(outputDirectory, `${block.name}.dot`);
      await Bun.write(dotPath, block.content);
      console.log(`  Source: ${path.basename(dotPath)}`);
    }
  }
  console.log(`\nOutput: ${outputDirectory}/`);
}

async function runRender(ctx: { args: { skill: string } }): Promise<void> {
  await renderSkill(ctx.args.skill, false);
}

async function runCombine(ctx: { args: { skill: string } }): Promise<void> {
  await renderSkill(ctx.args.skill, true);
}

async function runDoctor(): Promise<void> {
  const viz = await instance();
  viz.renderString("digraph doctor { ready -> rendered; }", { format: "svg" });
  console.log(`bun: ${Bun.version}`);
  console.log(`graphviz: ${viz.graphvizVersion} (vendored Viz.js 3.31.0, WebAssembly)`);
}

const cli = new Crust("render-graphs")
  .meta({ description: "Render Graphviz diagrams from a skill's SKILL.md" })
  .use(helpPlugin())
  .command("render", (cmd) => cmd
    .meta({ description: "Render each dot block to its own SVG" })
    .args([{ name: "skill", type: "string", required: true }] as const)
    .run(runRender))
  .command("combine", (cmd) => cmd
    .meta({ description: "Combine all dot blocks into one SVG" })
    .args([{ name: "skill", type: "string", required: true }] as const)
    .run(runCombine))
  .command("doctor", (cmd) => cmd
    .meta({ description: "Check the vendored Graphviz WebAssembly renderer" })
    .run(runDoctor));

if (import.meta.main) {
  // Keep the old script interface as a compatibility path.
  const legacySkill = process.argv[2];
  if (!legacySkill) {
    console.error("Usage: render-graphs.js <skill-directory> [--combine]");
    process.exitCode = 1;
  } else if (["render", "combine", "doctor"].includes(legacySkill) || legacySkill.startsWith("-")) {
    await cli.execute();
  } else {
    const combine = process.argv.includes("--combine");
    process.argv.splice(2, process.argv.length - 2, combine ? "combine" : "render", legacySkill);
    await cli.execute();
  }
}
