import { expect, test } from "bun:test";
import registerPoster from "../.pi/extensions/poster-make/index";

test("registers poster_render with current Pi error semantics", async () => {
  let tool: any;
  registerPoster({
    registerTool(definition: unknown) {
      tool = definition;
    },
  } as any);

  expect(tool.name).toBe("poster_render");
  await expect(
    tool.execute(
      "test-call",
      {
        tsx: 'export default () => <div className="w-[320px]">test</div>',
        out: "poster.bmp",
      },
      undefined,
      undefined,
      { cwd: process.cwd() },
    ),
  ).rejects.toThrow("Cannot infer format");
});
