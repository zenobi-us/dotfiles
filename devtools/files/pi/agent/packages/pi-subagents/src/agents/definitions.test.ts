import { describe, expect, it } from "vitest";

import { getAgentDefinitionDirs, getProjectOverrideRoot } from "./definitions.ts";

describe("agent override discovery", () => {
  it("orders global, project, then override agent dirs", () => {
    const dirs = getAgentDefinitionDirs(
      "/repo/worktree",
      "/home/q/.pi/agent",
      "/home/q",
      "git@github.com:Zenobi-US/dotfiles.git",
      {},
    );

    expect(dirs.map((dir) => dir.source)).toEqual(["global", "project", "override"]);
    expect(dirs.map((dir) => dir.path)).toEqual([
      "/home/q/.pi/agent/agents",
      "/repo/worktree/.pi/agents",
      "/home/q/.pi/overrides/git-github-com-zenobi-us-dotfiles-git/agents",
    ]);
    expect(dirs[2].cwdBase).toBe("/repo/worktree");
  });

  it("uses cwd slug when origin is absent", () => {
    expect(getProjectOverrideRoot("/repo/worktree", "/home/q", undefined, {})).toBe(
      "/home/q/.pi/overrides/repo-worktree",
    );
  });

  it("uses context links for override agents", () => {
    expect(getProjectOverrideRoot("/mnt/something/else/project", "/home/q", undefined, {
      shared: ["/mnt/something/else"],
    })).toBe("/home/q/.pi/overrides/shared");
  });
});
