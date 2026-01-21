/**
 * Example ~/.pi/settings.bunfig.ts
 * 
 * This is a TypeScript configuration file that supports:
 * - onCreate callbacks (functions or shell commands)
 * - Template variables ({{path}}, {{name}}, {{branch}}, {{project}})
 * - Full TypeScript features for advanced configurations
 * 
 * Copy this to ~/.pi/settings.bunfig.ts and customize for your setup.
 */

import type { WorktreeSettings, WorktreeCreatedContext } from "./types";

const settings = {
  worktree: {
    // Parent directory for storing worktrees
    // Template variables: {{project}} (git repo name)
    parentDir: "~/.local/share/worktrees/{{project}}",

    // onCreate callback - runs after worktree is created
    // Can be a shell command string OR an async function
    onCreate: async (ctx: WorktreeCreatedContext) => {
      console.log(`✓ Created worktree: ${ctx.name}`);
      console.log(`  Location: ${ctx.path}`);
      console.log(`  Branch: ${ctx.branch}`);

      // Example: Run mise setup in the new worktree
      const { execSync } = await import("child_process");

      try {
        console.log("Running mise setup...");
        execSync("mise setup", {
          cwd: ctx.path,
          stdio: "inherit",
        });
      } catch (error) {
        console.warn("mise setup failed (this is optional)");
      }
    },
  } as WorktreeSettings,
};

export default settings;
