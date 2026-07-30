import { describe, expect, it } from "vitest";

import { getProjectOverrideInfo, slugifyProjectKey } from "./project-overrides.ts";

describe("project override paths", () => {
  it("slugifies remote urls into override keys", () => {
    expect(slugifyProjectKey("git@github.com:Zenobi-US/dotfiles.git")).toBe("git-github-com-zenobi-us-dotfiles-git");
  });

  it("falls back to cwd when no git origin exists", () => {
    const info = getProjectOverrideInfo("/work/no-remote", "/home/q");

    expect(info.source).toBe("cwd");
    expect(info.key).toBe("work-no-remote");
    expect(info.root).toBe("/home/q/.pi/overrides/work-no-remote");
  });
});
