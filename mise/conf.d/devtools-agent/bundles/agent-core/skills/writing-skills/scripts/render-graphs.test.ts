import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { instance } from "./vendor/viz-3.31.0.mjs";

const script = path.join(import.meta.dir, "render-graphs.js");

async function withSkill(markdown: string, run: (directory: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(path.join(tmpdir(), "render-graphs-"));
  try {
    await Bun.write(path.join(directory, "SKILL.md"), markdown);
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function render(command: "render" | "combine", directory: string) {
  return Bun.spawnSync([process.execPath, script, command, directory], {
    stdout: "pipe",
    stderr: "pipe",
  });
}

const twoGraphs = "```dot\ndigraph first { A -> B; }\n```\n```dot\ndigraph second { C -> D; }\n```";

test("renders each DOT block to an SVG with its nodes and edge", async () => {
  await withSkill(twoGraphs, async (directory) => {
    const result = render("render", directory);
    expect(result.exitCode).toBe(0);
    for (const [name, tail, head] of [["first", "A", "B"], ["second", "C", "D"]]) {
      const svg = await Bun.file(path.join(directory, "diagrams", `${name}.svg`)).text();
      expect(svg).toContain(`<title>${tail}</title>`);
      expect(svg).toContain(`<title>${head}</title>`);
      expect(svg).toContain(`<title>${tail}&#45;&gt;${head}</title>`);
    }
  });
});

test("combines DOT blocks into separate clusters and saves reusable DOT", async () => {
  await withSkill(twoGraphs, async (directory) => {
    const result = render("combine", directory);
    expect(result.exitCode).toBe(0);
    const name = `${path.basename(directory).replaceAll("-", "_")}_combined`;
    const svg = await Bun.file(path.join(directory, "diagrams", `${name}.svg`)).text();
    for (const title of ["cluster_0", "cluster_1", "A", "B", "C", "D"]) {
      expect(svg).toContain(`<title>${title}</title>`);
    }
    const dot = await Bun.file(path.join(directory, "diagrams", `${name}.dot`)).text();
    const graph = (await instance()).renderJSON(dot) as { objects: { name: string }[] };
    expect(graph.objects.map((object) => object.name)).toEqual(expect.arrayContaining(["A", "B", "C", "D"]));
  });
});

test("reports invalid DOT and still renders later valid blocks", async () => {
  await withSkill("```dot\ndigraph broken { A -> ; }\n```\n```dot\ndigraph valid { C -> D; }\n```", async (directory) => {
    const result = render("render", directory);
    expect(result.exitCode).toBe(1);
    expect(await Bun.file(path.join(directory, "diagrams", "broken.svg")).exists()).toBe(false);
    const svg = await Bun.file(path.join(directory, "diagrams", "valid.svg")).text();
    expect(svg).toContain("<title>C&#45;&gt;D</title>");
  });
});
