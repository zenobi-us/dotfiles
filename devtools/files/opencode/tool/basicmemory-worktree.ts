import { tool } from "@opencode-ai/plugin";
import { $ } from "execa";

const Api = {
  slugify(text: string) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\\n/g, " ") // Replace newlines with _
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w\-]+/g, "") // Remove all non-word chars
      .replace(/\-\-+/g, "-") // Replace multiple - with single -
      .replace(/^-+/, "") // Trim - from start of text
      .replace(/-+$/, "") // Trim - from end of text
      .trim(); // Trim whitespace
  },

  async identifyWorktree() {
    const pwd = process.cwd();
    const path = Api.slugify(pwd);
    try {
      const path = await $`git rev-parse --show-toplevel`;
      const remote = await $`git remote`;
      const repo_url = await $`git remote get-url ${remote.stdout}`;

      const slugified_repo_url = Api.slugify(repo_url.stdout);
      const slugified_worktree = Api.slugify(path.stdout);

      return {
        remote: remote.stdout,
        repo: slugified_repo_url,
        path: slugified_worktree,
      };
    } catch {
      return { path };
    }
  },
};

export const instruct = tool({
  description:
    "Get instructions on creating new projects based on the current worktree",
  args: {},
  async execute() {
    const meta = await Api.identifyWorktree();
    return `
    The current worktree is identified as:

    - Repository: ${meta.repo}
    - Remote: ${meta.remote}
    - Path: ${meta.path}

    Continue by creating a new BasicMemory project with the following command:

    basicmemory_create_project(
      name="${meta?.repo}",
      directory="~/Notes/Projects/${meta?.repo}",
    )
    `;
  },
});

export const repo_url = tool({
  description: "Get the repository URL of the current worktree",
  args: {},
  async execute() {
    const identifier = await Api.identifyWorktree();
    if (!identifier.repo) {
      throw new Error("Could not identify repository");
    }
    return identifier.repo;
  },
});

export const repo_path = tool({
  description: "Get the path identifier for the current worktree",
  args: {},
  async execute() {
    const identifier = await Api.identifyWorktree();
    return identifier.path;
  },
});

export const remote_name = tool({
  description: "Get the remote name of the current worktree",
  args: {},
  async execute() {
    const identifier = await Api.identifyWorktree();
    if (!identifier.remote) {
      throw new Error("Could not identify remote");
    }
    return identifier.remote;
  },
});
