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

  async getWorktreeIdentifier() {
    const pwd = process.cwd();
    const path = Api.slugify(pwd);
    try {
      const worktree = await $`git rev-parse --show-toplevel`;
      const remote = await $`git remote`;
      const repo_url = await $`git remote get-url ${remote.stdout}`;

      const slugified_repo_url = Api.slugify(repo_url.stdout);
      const slugified_worktree = Api.slugify(worktree.stdout);
      return {
        id: `${slugified_repo_url}/${slugified_worktree}`,
        remote: remote.stdout,
        repo: slugified_repo_url,
        worktree: slugified_worktree,
      };
    } catch {
      return { path };
    }
  },
};

export const getIdentifier = tool({
  description: "Generate a identifier for the current worktree",
  args: {},
  async execute() {
    const identifier = await Api.getWorktreeIdentifier();
    return JSON.stringify({ identifier });
  },
});
