import { Crust } from "@crustjs/core@^0.0.19";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadPlan, manualTestsDir } from "../load-plan.ts";
import { planJson, renderComment } from "../results.ts";
import { die, guard } from "../sh.ts";

/** Write comment.md and print it, so the caller can post it to the tracker unchanged. */
export async function comment(dir: string, url: string, title?: string): Promise<void> {
  if (!/^https?:\/\//.test(url)) die(`--url must be the published evidence URL, got "${url}"`, 2);
  const plan = await loadPlan(dir);
  const body = renderComment(planJson(plan), url, title);
  const out = join(dir, "comment.md");
  await writeFile(out, body);
  console.error(`wrote ${out}`);
  console.log(body);
}

export const commentCmd = new Crust("comment")
  .meta({ description: "plan.ts -> comment.md: the manual steps without evidence, footnoted with the evidence URL" })
  .args([{ name: "dir", type: "string", required: true, description: "manual-tests directory" }])
  .flags({
    url: { type: "string", required: true, description: "Published URL of evidence.md (or the HTML report)" },
    title: { type: "string", description: "Comment heading, default \"Manual test steps\"" },
  })
  .run(({ args, flags }) => guard(() => comment(manualTestsDir(args.dir), flags.url, flags.title)));
